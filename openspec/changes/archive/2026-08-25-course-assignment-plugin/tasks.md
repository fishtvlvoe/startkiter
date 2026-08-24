## 1. 紅燈測試（TDD）

- [x] 1.1 為 `packages/course-assignment/assignment-definition.ts` 寫紅燈測試，涵蓋 Requirement「Assignment definitions are stored through the shared PluginContent table」：建立作業定義後能透過 `pluginId: "assignment" AND type: "assignment-definition"` 查詢取回。驗證目標：`pnpm --filter @startkiter/course-assignment test assignment-definition.test.ts` FAIL；實作後 PASS
- [x] 1.2 [P] 為 `packages/course-assignment/submission-rules.ts` 寫紅燈測試，涵蓋 Requirement「Submissions track lateness and revision count as transaction-type data」：遲交判斷、修訂次數遞增邏輯。驗證目標：`pnpm --filter @startkiter/course-assignment test submission-rules.test.ts` FAIL；實作後 PASS
- [x] 1.3 [P] 為 `packages/course-assignment/sanitize-html.ts` 寫紅燈測試，涵蓋 Requirement「Assignment description and review feedback are sanitized before HTML rendering」：`<script>` 標籤與 `onclick` 事件屬性被清除。驗證目標：`pnpm --filter @startkiter/course-assignment test sanitize-html.test.ts` FAIL；實作後 PASS
- [x] 1.4 [P] 為附件上傳流程寫紅燈測試，涵蓋 Requirement「Attachment uploads use the signed-URL storage abstraction, not a local filesystem path」：含特殊字元的檔名上傳後，`storageKey` 為系統產生的 ID 而非原始檔名。驗證目標：`pnpm --filter @startkiter/api test assignment-upload.test.ts` FAIL；實作後 PASS
- [x] 1.5 [P] 為 `AssignmentDraft` 寫紅燈測試，涵蓋 Requirement「One draft per learner per assignment is retained」：同一學員對同一作業儲存草稿兩次，只存在一筆記錄。驗證目標：`pnpm --filter @startkiter/database type-check` FAIL（型別不存在）；實作後 PASS

## 2. 作業定義儲存層與規則邏輯

- [x] 2.1 依 design.md Decision: 附件上傳複用 packages/storage 的簽名 URL 抽象，新增 assignments bucket 與 Decision: 作業說明與評語一律 sanitize 後才能渲染成 HTML，新增 `packages/course-assignment/`（`index.ts`／`package.json`／`tsconfig.json`）與 `assignment-definition.ts`（透過 `db.pluginContent` 操作）、`submission-rules.ts`（遲交判斷、字數/檔案數量驗證、修訂次數遞增）、`sanitize-html.ts`（安裝 HTML sanitize 函式庫並實作 `sanitizeAssignmentContent`）。驗證目標：task 1.1／1.2／1.3 全數轉綠燈

## 3. 交易型資料表與附件上傳

- [x] 3.1 在 `packages/database/prisma/schema.prisma` 新增 `AssignmentSubmission`／`AssignmentAttachment`／`AssignmentReview`／`AssignmentDraft` 四個 model（DDL 見 design.md），產生 migration；依 design.md Decision: 附件上傳複用 packages/storage 的簽名 URL 抽象，新增 assignments bucket，修改 `packages/storage/types.ts` 的 `StorageBucketNamesConfig` 新增 `assignments` 欄位，並同步修改 `packages/storage/config.ts` 新增對應的 bucket 名稱映射（比照既有 `avatars` 的 `NEXT_PUBLIC_AVATARS_BUCKET_NAME` 模式，新增 `NEXT_PUBLIC_ASSIGNMENTS_BUCKET_NAME` env fallback），實作附件上傳 API procedure（先取簽名 URL，前端上傳成功後才建立 `AssignmentAttachment` 記錄，`storageKey` 用系統產生 ID）。驗證目標：task 1.4／1.5 全數轉綠燈

## 4. 頁面與 Plugin 登記

- [x] 4.1 新增 `apps/saas/app/(authenticated)/assignment/[pluginContentId]/page.tsx`（學員提交頁，含草稿自動儲存）與 `apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx`（operator 建立作業定義與評分頁）；在 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 陣列新增 Assignment 的 manifest entry（含 `mount.menu`，比照 `course-quiz-plugin` 的教訓，operator 頁面沒有 menu entry 會完全找不到入口）。驗證目標：手動驗證頁面可正常渲染、operator 選單可看到「作業管理」入口

## 5. Review 與驗證

- [x] 5.1 派 Codex 或等效工具對本次全部 diff（task 1-4）做 Code Review（correctness／security／performance 三角度）：correctness 確認草稿只保留一筆記錄、正式送出後草稿轉正式提交的狀態轉換正確；security 確認 `storageKey` 組成完全不依賴使用者輸入、`sanitizeAssignmentContent` 白名單不允許 `<script>`／`on*` 事件屬性／`javascript:` 協定的 href、學員無法讀取或評分他人的 `AssignmentSubmission`；performance 確認 operator 評分頁列表查詢沒有 N+1；另核對 `AssignmentAttachment`／`AssignmentSubmission`／`AssignmentReview`／`AssignmentDraft` 沒有新增任何 Plugin 專屬的內容儲存表（作業定義本身仍走 `PluginContent`）。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 5.2 用 ego-browser skill 跑一次完整 e2e：operator 建立一份含文字+檔案提交類型的作業 → 學員填寫內容並上傳一個檔案存為草稿 → 確認草稿只有一筆記錄 → 正式送出 → operator 對提交評分並留評語（含測試性質的 HTML 標籤驗證有被清理）→ 確認學員能看到評分結果。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [x] 5.3 跑 `spectra analyze course-assignment-plugin --json` 與 `spectra validate course-assignment-plugin`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 5.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/course-assignment test`／`pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
