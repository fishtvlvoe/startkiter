## Why

StartKiter 沒有作業繳交機制，只有測驗（`course-quiz-plugin`，若已 apply）跟被動的單元完成進度。woomin 的作業系統（`Assignment`／`AssignmentSubmission`／`AssignmentAttachment`／`AssignmentReview`／`AssignmentDraft` 五個 model）是完整生產驗證過的功能（文字/圖片/檔案提交、遲交判斷、修訂次數、老師評分/評語/等第、草稿自動儲存），但過去 woomin 在這個領域踩過真實的安全與功能坑：`fix-critical-xss-and-assignment-upload`（2026-07-26 封存）修過（1）站點設定欄位未驗證格式直接插值進 `<script>` 造成 stored XSS，（2）課程銷售頁 HTML 完全沒有 sanitize 就用 `dangerouslySetInnerHTML` 輸出，（3）作業附件在本地儲存模式下 storage key 格式不符驗證規則導致上傳必定失敗。這次要吸取這三個教訓：任何要渲染成 HTML 的使用者輸入都要 sanitize、附件上傳要用現成的 `packages/storage` 簽名 URL 模式（不走本地檔案系統路徑，天生避開 woomin 那個特定漏洞的攻擊面）、storage key 組成不能直接拼接使用者可控的檔名。

跟 `course-quiz-plugin` 一樣，資料儲存要遵守 `platform-core-boundary` 的既有邊界：作業定義（說明、提交限制、評分設定）走共用 `PluginContent` 表；提交/附件/評分/草稿是交易型資料，各自開獨立表。

## What Changes

- 新增 `course-assignment` Plugin：業務邏輯放 `packages/course-assignment/`（比照 `packages/course-quiz` 的目錄慣例），在 `MOUNT_POINTS` 新增 manifest entry（`dataSpec: "content"`, `mount.content: { kind: "auto", boundTo: "/assignment" }`, `mount.route: { path: "/assignment-admin" }`, 含 `mount.menu`）
- 作業定義存 `PluginContent{pluginId: "assignment", type: "assignment-definition"}`：`lessonId`、`title`、`description`（Markdown）、提交類型與限制（文字/圖片/檔案、字數上下限、檔案數量與大小上限、允許副檔名）、評分設定（及格制/百分制）
- 新增四個交易型 Prisma model：`AssignmentSubmission`（提交記錄，含遲交判斷、修訂次數）、`AssignmentAttachment`（附件，透過 `packages/storage` 簽名 URL 上傳，不走本地檔案系統）、`AssignmentReview`（老師評分/評語/等第）、`AssignmentDraft`（自動儲存的草稿，`@@unique([assignmentId, userId])` 一位學員對一份作業只有一份草稿）
- 作業說明（`description`）與評語（`feedback`）若要渲染成 HTML，必須先過 sanitize 函式庫（新增共用工具函式），不得直接 `dangerouslySetInnerHTML` 輸出未清理的內容
- 附件上傳新增 `assignments` storage bucket（`packages/storage` 的 `StorageBucketNamesConfig` 新增這個 bucket 名稱），`storageKey` 組成用系統產生的 ID 而非直接使用使用者上傳的檔名，避免路徑相關問題

## Non-Goals

- 不做即時協作編輯（多人同時編輯同一份提交）
- 不做作業抄襲比對
- 不做作業提交的富文本編輯器（WYSIWYG），MVP 範圍只做 Markdown 文字框 + 檔案上傳
- 不修改 `course-module`／`platform-mount-points`／`platform-core-boundary` 既有 Requirement
- 不做評分等第的自動化統計報表（留給 `sheets-export-engine` 未來擴充）

## Capabilities

### New Capabilities

- `course-assignment-plugin`：課程作業繳交與評分 Plugin

## Impact

- Affected specs: `course-assignment-plugin`（新增）
- Affected code：
  - New:
    - `packages/course-assignment/index.ts`
    - `packages/course-assignment/package.json`
    - `packages/course-assignment/tsconfig.json`
    - `packages/course-assignment/assignment-definition.ts`
    - `packages/course-assignment/assignment-definition.test.ts`
    - `packages/course-assignment/submission-rules.ts`（遲交判斷、字數/檔案數驗證、修訂次數）
    - `packages/course-assignment/submission-rules.test.ts`
    - `packages/course-assignment/sanitize-html.ts`（作業說明/評語的 HTML 清理共用函式）
    - `packages/course-assignment/sanitize-html.test.ts`
    - `apps/saas/app/(authenticated)/assignment/[pluginContentId]/page.tsx`
    - `apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx`
    - `packages/api/modules/assignment/router.ts`
    - `packages/api/modules/assignment/router.test.ts`
    - `packages/database/prisma/migrations/`（新增 `AssignmentSubmission`／`AssignmentAttachment`／`AssignmentReview`／`AssignmentDraft` 四個 model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/platform/src/mount-points.ts`
    - `packages/storage/types.ts`（`StorageBucketNamesConfig` 新增 `assignments` bucket）
  - Removed: 無
- Dependencies 新增：一個 HTML sanitize 函式庫（如 `sanitize-html` 或 `isomorphic-dompurify`，apply 階段依既有專案慣例挑選）
- 環境變數新增：無
