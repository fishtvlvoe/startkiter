# Code Review Report: `course-ai-batch-import`

- **Review Date**: 2026-08-30
- **Review Scope**: `main..HEAD` on branch `fishtvlvoe/course-ai-batch-import`
- **Review Mode**: Independent Code Review (Code-First Truth Verification)

---

## 審查摘要與評級總覽

| 等級 | 數量 | 說明 |
| :--- | :--- | :--- |
| **Critical** | 2 | 嚴重的安全性漏洞（未認證上傳）與資料庫唯一鍵衝突（Slug 碰撞導致寫入失敗） |
| **High** | 2 | 權限檢查不一致（講師遭 403 阻擋）與規格遺漏（UI 未顯示缺件警示） |
| **Medium** | 3 | SRT 二次解析冗餘、全域 Layout 權限邏輯擴大變更、單元標題預覽編輯遺漏 |
| **Low** | 2 | 跨模組相對路徑 import、大型影片記憶體 buffer 建議 |

---

## 核心審查方向驗證結論（Code-First Truth）

1. **Correctness（正確性）**
   - **資料夾三層結構解析**：`packages/platform/src/course-batch-import/folder-parser.ts` 透過 `path.length === 4` 嚴格限制「課程/章節/單元/檔案」結構，非四層路徑皆正確略過，副檔名篩選與自然排序邏輯符合預期。
   - **AI 講義生成串接（Task 2.3 驗證）**：確認 `generateBatchLessonContent` 與 `BatchImportDialog.tsx` 確實呼叫 `POST /api/course/ai-notes/generate` 串流，並正確將生成文字累積至 `lesson.content` 且於確認後寫入資料庫。已實跑單元與整合測試驗證通過。
   - **並行控制**：`concurrency-controller.ts` 的 `runWithConcurrency` 搭配 `BatchImportDialog` 的 `uploadQueue` Promise 鏈，確實達成了上傳序列化（Concurrency = 1）與整體處理池並行度上限（Concurrency <= 5）。

2. **資料完整性（Data Integrity）**
   - **確認匯入前不寫入資料庫**：在點擊「確認匯入」前，所有狀態僅保留於前端 React state，點擊取消或關閉 Dialog 不會發送任何寫入 DB 的請求，資料庫無殘留紀錄。
   - **取消行為**：符合「Canceling before confirmation writes nothing」規範。

3. **個別重試邏輯（Retry Isolation）**
   - `batch-import-state.ts` 之 `retryFailedLesson` 僅針對傳入的 `lessonId` 呼叫處理函式，其餘已完成單元之狀態（`status: "completed"`, `bunnyVideoId`, `content`）完全保持不變。

4. **既有功能影響範圍（Impact Check）**
   - `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx` 被修改了 `isOperator` 檢查邏輯，超出了 proposal.md 的 Impact 清單，需注意對其他後台頁面的連帶影響（見 Medium 發現）。

5. **錯誤處理與檔案大小（Error Handling）**
   - `uploadVideoToBunny` 與 route 皆對超過大小限制（預設 2GB）之檔案丟出 `FILE_TOO_LARGE`（HTTP 413），單一單元失敗不阻擋其餘單元處理。
   - 資料夾結構不符時前端顯示明確提示，非靜默失敗。

---

## 詳細發現清單（Findings）

### 🔴 Critical

#### 1. `/api/course/batch-import/upload-video` 缺少身份驗證與授權防護
- **檔案路徑**：`apps/saas/app/api/course/batch-import/upload-video/route.ts#L7-L23`
- **具體理由**：
  該 API 端點完全沒有呼叫 `getSession()` 檢查登入狀態，亦無任何權限驗證。任何未認證的外部訪客只要對 `/api/course/batch-import/upload-video` 發送 POST 請求，即可藉由伺服器持有的 Bunny API Key 將影片上傳至平台 Bunny 媒體庫，造成嚴重的儲存配額消耗與錢包耗盡攻擊（Unauthenticated Upload / Resource Exhaustion）。
- **修復建議**：
  在函式開頭加入 Session 檢查與管理者/講師授權判定：
  ```ts
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  ```

#### 2. `create-curriculum` 的 Lesson Slug 格式固定無隨機性，造成資料庫 Unique Constraint 衝突
- **檔案路徑**：`apps/saas/app/api/course/batch-import/create-curriculum/route.ts#L46`
- **具體理由**：
  建立單元時使用固定 slug：`slug: lesson.slug ?? \`${body.courseId}-${chapterIndex + 1}-${lessonIndex + 1}\``。
  在 Prisma schema 中，`Lesson.slug` 為 `@unique` 全域唯一。若同一門課程進行第二次批次匯入、或在匯入部分失敗後再次點擊確認匯入，資料庫將因 slug 重複而拋出 Unique constraint violation，導致所有單元建立失敗。
- **修復建議**：
  比照 `apps/saas/app/api/course/studio/route.ts` 的 `generateSlug` 模式，在 slug 後方加入隨機唯一後綴（例如 timestamp / nanoid）。

---

### 🟠 High

#### 3. `create-curriculum` 僅允許 `isOperator`，授課講師（Instructor）執行匯入會被 403 阻擋
- **檔案路徑**：`apps/saas/app/api/course/batch-import/create-curriculum/route.ts#L20-L22`
- **具體理由**：
  `ai-notes/generate/route.ts` 與 `studio/route.ts` 均支援 `canManageCourse`（允許 Assigned Instructor 管理其課程），但 `create-curriculum/route.ts` 卻硬性規定 `if (!isOperator(session.user.email, process.env.ADMIN_EMAIL))`。這導致被指派的授課講師在後台即使能打開匯入視窗並完成 AI 講義生成，最後按下「確認匯入」時會收到 `403 FORBIDDEN`，無法完成建課。
- **修復建議**：
  改用 `canManageCourse` 檢查該使用者是否具備該 `courseId` 的管理權限：
  ```ts
  const allowed = await canManageCourse({
      userId: session.user.id,
      courseId: body.courseId,
      isOperator: isCourseOperator(session.user.email, process.env.ADMIN_EMAIL),
  });
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  ```

#### 4. `BatchImportDialog.tsx` 未在 UI 上呈現 `warnings`（缺件警示遺漏）
- **檔案路徑**：`apps/saas/modules/shared/components/BatchImportDialog.tsx#L108`
- **具體理由**：
  `spec.md` 要求「Missing content is warned, not silently skipped」，`folder-parser.ts` 亦正確產出 `warnings: ["MISSING_VIDEO"]` 或 `["MISSING_NOTES_OR_SUBTITLE"]`。但在 `BatchImportDialog.tsx` 的單元渲染列表中，完全沒有將 `lesson.warnings` 呈現在畫面上。講師在預覽階段無法得知哪些單元缺件，直到按下「開始處理」後才遭遇 `失敗：MISSING_VIDEO` 錯誤。
- **修復建議**：
  在單元列表 UI 中加入警示標籤（如黃色 Badge 標示「缺少影片」或「缺少字幕/講義」）。

---

### 🟡 Medium

#### 5. SRT 字幕轉純文字重複解析（Redundant srtToText）
- **檔案路徑**：
  - `packages/platform/src/course-batch-import/concurrency-controller.ts#L44`
  - `apps/saas/app/api/course/ai-notes/generate/route.ts#L94`
- **具體理由**：
  前端 `generateBatchLessonContent` 已先透過 `srtToText` 將字幕過濾為純文字；然而後端 `/api/course/ai-notes/generate` 收到文字後，又再次呼叫了 `srtToText(srtContent)`。若講義文本中含有單獨成行的段落編號數字，二次過濾可能會將該行文字誤刪。
- **修復建議**：
  前後端責任劃分明確化，由後端統一執行 `srtToText`，或在前端命名上區分純文字與 raw SRT。

#### 6. 全域 `admin/layout.tsx` 認證判定修改超出 proposal.md 清單
- **檔案路徑**：`apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx#L22`
- **具體理由**：
  將整個後台的 `checkPermission({ user: session.user }, "admin.access")` 改為 `isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)`。這改動了非課程後台模組（如 `/admin/pages`、`/admin/users`）的共用權限機制，且超出 proposal.md 宣告的修改範圍。
- **修復建議**：
  若為了解決測試帳號權限問題，應在課程專屬模組內判斷或同步更新 RBAC 角色，避免直接變更全域 admin layout。

#### 7. 預覽階段未提供單元標題編輯與跳過單元功能
- **檔案路徑**：`apps/saas/modules/shared/components/BatchImportDialog.tsx#L108`
- **具體理由**：
  Design 文件指出「預覽階段調整標題或跳過缺件的單元」，目前 UI 僅章節標題有 input 可修改，單元標題為純文字 span，且無排除/跳過按鈕。
- **修復建議**：
  在單元項目提供標題 input 與 checkbox 啟用/停用開關。

---

### 🟢 Low

#### 8. `BatchImportDialog.tsx` 跨套件採用相對路徑 Import
- **檔案路徑**：`apps/saas/modules/shared/components/BatchImportDialog.tsx#L4-L5`
- **具體理由**：
  使用了 `../../../../../packages/platform/src/course-batch-import/...` 跨 package 引用，違反 monorepo 架構規範（且 `packages/platform/index.ts` 已經 export 這些函式）。
- **修復建議**：
  改為 `import { parseFileList, generateBatchLessonContent, runWithConcurrency } from "@startkiter/platform";`。

#### 9. `uploadVideoToBunny` 影片檔案一次性載入記憶體
- **檔案路徑**：`packages/platform/src/course-batch-import/bunny-uploader.ts#L33`
- **具體理由**：
  `body: await file.arrayBuffer()` 會將多達 2GB 的檔案載入 Node.js 記憶體中，在低配額 VPS 環境下若多個請求並行可能引發 OOM。
- **修復建議**：
  未來可重構為 stream 轉發（`file.stream()`）以降低記憶體峰值。
