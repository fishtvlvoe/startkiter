## Context

跟 `course-quiz-plugin` 同一套架構模式：作業定義走共用 `PluginContent` 表（content-type），提交/附件/評分/草稿是交易型資料各自開獨立表（`platform-core-boundary` 既有 Requirement 允許）。

woomin `fix-critical-xss-and-assignment-upload`（2026-07-26 封存）修過三個問題，這次要主動避開：(1) 未驗證格式的欄位直接插值進 `<script>`／HTML 屬性造成 stored XSS——這次不涉及 script 插值情境，但 (2) 課程銷售頁 HTML 未 sanitize 直接 `dangerouslySetInnerHTML` 輸出的教訓適用於這次的作業說明／評語欄位：任何允許使用者輸入、最終要渲染成 HTML 的內容都必須先 sanitize；(3) 本地儲存模式下 storage key 格式不符驗證規則導致上傳必定失敗——StartKiter 的 `packages/storage`（`GetSignedUploadUrlHandler`／`GetSignedUrlHander`）走簽名 URL 上傳模式，不是 woomin 那種本地檔案系統路徑寫入，天生不會踩到同一個漏洞，但這次新增 `assignments` bucket 時仍要注意 `storageKey` 不能直接用使用者上傳的原始檔名組成路徑（避免特殊字元造成非預期的路徑或 key 碰撞）。

`packages/storage/types.ts` 目前的 `StorageBucketNamesConfig` 只有 `avatars` 一個 bucket，這次新增 `assignments`。

## Goals / Non-Goals

**Goals:**

- 作業定義走 `PluginContent`，提交/附件/評分/草稿各自開交易型表
- 附件上傳透過 `packages/storage` 既有簽名 URL 抽象，不重新設計上傳機制
- 作業說明／評語若渲染為 HTML 一律先 sanitize
- `storageKey` 用系統產生的 ID，不直接拼接使用者上傳的原始檔名

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: 附件上傳複用 packages/storage 的簽名 URL 抽象，新增 assignments bucket

`packages/storage/types.ts` 的 `StorageBucketNamesConfig` 新增 `assignments: string`。學員上傳附件時，先呼叫 `GetSignedUploadUrlHandler("assignments/{submissionId}/{attachmentId}.{ext}", { bucket: "assignments" })` 取得簽名上傳 URL，前端直接 PUT 檔案內容到該 URL，成功後才建立 `AssignmentAttachment` 記錄（`storageKey` 存放系統產生的路徑，`filename` 欄位單獨存放使用者看到的原始檔名，兩者分離）。

Alternatives Considered:
- 照抄 woomin 的本地儲存模式（`assignments/{assignmentId}/{userId}/{filename}` 路徑格式）→ 否決：StartKiter 沒有本地檔案系統儲存這個部署形態的既定支援，`packages/storage` 已經是走簽名 URL 到物件儲存的既定抽象，重新引入本地儲存是額外的技術債，且正是 woomin 踩過坑的那個模式
- `storageKey` 直接用使用者上傳的原始檔名（`{submissionId}/{filename}`）→ 否決：使用者可控的檔名可能含特殊字元、超長字串、或刻意構造成路徑穿越樣式（如 `../../etc/passwd`），系統產生的 ID 完全避開這類風險，檔名只作為顯示用途單獨存欄位

### Decision: 作業說明與評語一律 sanitize 後才能渲染成 HTML

`packages/course-assignment/sanitize-html.ts` 提供 `sanitizeAssignmentContent(raw: string): string`，用 HTML sanitize 函式庫清理 `Assignment.description`（作業說明）與 `AssignmentReview.feedback`（評語）在渲染前的內容，只允許排版需要的安全標籤子集（比照 woomin 修復後對課程銷售頁 HTML 採用的做法），不允許 `<script>`／事件屬性（`onclick` 等）。

Alternatives Considered:
- 只做純文字顯示，不支援任何 HTML/Markdown 格式化 → 否決：作業說明需要基本排版（列點、粗體）才好閱讀，完全純文字會犧牲可讀性，這次選擇支援受限的安全子集而非完全禁用
- 依賴前端框架的預設 XSS 防護（React 預設 escape，不用 `dangerouslySetInnerHTML`）而不主動 sanitize → 否決：若這次要支援 Markdown 轉 HTML 顯示格式化文字，勢必要用某種形式把 HTML 字串注入 DOM（無論是 `dangerouslySetInnerHTML` 或 MDX 編譯），單靠 React 預設 escape 只在「直接把字串當純文字節點渲染」時有效，一旦要轉成 HTML 顯示就必須主動清理，這正是 woomin 踩過的坑

## Implementation Contract

**Behavior:**
- Operator 在 `/assignment-admin` 建立作業定義（說明、提交類型限制、評分設定）
- 學員在 `/assignment/[pluginContentId]` 填寫文字內容／上傳附件，可先儲存草稿（`AssignmentDraft`，同一學員同一作業只保留最新一份），確認送出後建立 `AssignmentSubmission`（判斷是否遲交、遞增修訂次數）
- 老師/operator 對已送出的提交評分，建立 `AssignmentReview`（評語先 sanitize 才存或才顯示）

**Interface / data shape:**
- `PluginContent.body`（作業定義）：`{ lessonId, title, description, submissionType, editorMode, minWords, maxWords, maxImages, maxImageSize, maxFiles, maxFileSize, allowedExtensions, gradingType, passingScore }`
- `sanitizeAssignmentContent(raw: string): string`

**DB DDL:**
```sql
CREATE TABLE "assignment_submission" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pluginContentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content" TEXT,
  "contentFormat" TEXT,
  "wordCount" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'SUBMITTED', 'REVIEWED')),
  "revisionNumber" INTEGER NOT NULL DEFAULT 1,
  "isLate" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "assignment_submission_pluginContentId_userId_idx" ON "assignment_submission"("pluginContentId", "userId");

CREATE TABLE "assignment_attachment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "submissionId" TEXT NOT NULL REFERENCES "assignment_submission"("id") ON DELETE CASCADE,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "assignment_attachment_submissionId_idx" ON "assignment_attachment"("submissionId");

CREATE TABLE "assignment_review" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "submissionId" TEXT NOT NULL REFERENCES "assignment_submission"("id") ON DELETE CASCADE,
  "reviewerId" TEXT NOT NULL REFERENCES "user"("id"),
  "feedback" TEXT,
  "score" INTEGER,
  "letterGrade" TEXT,
  "reviewedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "assignment_review_submissionId_idx" ON "assignment_review"("submissionId");

CREATE TABLE "assignment_draft" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pluginContentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content" TEXT,
  "contentFormat" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "assignment_draft_pluginContentId_userId_key" ON "assignment_draft"("pluginContentId", "userId");
```

**Failure modes:**
- 上傳附件超過 `maxFileSize`／`maxFiles` 限制 → 拒絕，回傳明確錯誤訊息
- 附件副檔名不在 `allowedExtensions` 白名單內 → 拒絕
- 找不到對應的作業定義（`pluginContentId` 錯誤）→ 404

**Acceptance criteria:**
- `pnpm --filter @startkiter/course-assignment test` 涵蓋：遲交判斷、字數/檔案數量驗證、sanitize 函式清除危險標籤/事件屬性
- `pnpm type-check`／`pnpm build` 全綠
- `spectra validate course-assignment-plugin` 0 warnings

**Scope boundaries:**
- In scope：`packages/course-assignment/`；四個交易型 model；`/assignment`／`/assignment-admin` 頁面；`MOUNT_POINTS` 新增 entry；`packages/storage` 新增 `assignments` bucket
- Out of scope：`course-module`／`platform-mount-points`／`platform-core-boundary` 既有 Requirement 不修改；即時協作編輯；抄襲比對

## Risks / Trade-offs

- [Risk] Sanitize 函式庫若允許的標籤子集設計不當，仍可能留下 XSS 繞道（例如允許 `<a>` 標籤但沒擋 `javascript:` 協定的 href）→ Mitigation: 使用主流 sanitize 函式庫的預設安全設定，不自己手刻正規表達式清理規則
- [Risk] 附件上傳走簽名 URL，前端直接 PUT 到物件儲存，若簽名 URL 的權限範圍設定過寬可能被用來上傳到非預期路徑 → Mitigation: 沿用 `packages/storage` 既有的簽名 URL 產生機制與其既有的權限範圍限制，不繞過這層既有防護
