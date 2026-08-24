## 1. 紅燈測試（TDD）

- [ ] 1.1 為 `send-lesson-message.ts` 寫紅燈測試，涵蓋 Requirement「Learners and teachers exchange one-to-one messages per lesson」與「Teacher can mark messages as read」：學員發送、老師回覆、標記已讀三個情境。驗證目標：`pnpm --filter @startkiter/api test send-lesson-message.test.ts` FAIL
- [ ] 1.2 [P] 為附件上傳寫紅燈測試，涵蓋 Requirement「Message attachments use the signed-URL storage abstraction」：`attachmentStorageKey` 為系統產生 ID 而非原始檔名。驗證目標：`pnpm --filter @startkiter/api test send-lesson-message.test.ts` FAIL（同檔案追加案例）

## 2. Database schema 與 procedure

- [ ] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `LessonPrivateMessage` model（DDL 見 design.md），產生 migration；依 design.md Decision: 私訊附件複用 packages/storage，storageKey 不用使用者檔名，修改 `packages/storage/types.ts`／`config.ts` 新增 `lessonMessages` bucket，實作 `sendLessonMessage`／`markLessonMessageRead` procedure。驗證目標：task 1.1／1.2 全數轉綠燈

## 3. 頁面

- [ ] 3.1 新增 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx`（學員私訊面板）與 `apps/saas/app/(authenticated)/(operator)/lesson-messages/page.tsx`（operator 未讀私訊列表）。驗證目標：手動驗證頁面可正常運作

## 4. Review 與驗證

- [ ] 4.1 grep `packages/storage/types.ts`／`config.ts` 確認若 `course-assignment-plugin` 已 apply，這次新增的 `lessonMessages` bucket 與既有 `assignments` bucket 兩者的 `StorageBucketNamesConfig` 欄位都存在，沒有互相覆蓋。驗證目標：`packages/storage` 型別檢查通過，兩個 bucket 欄位並存
- [ ] 4.2 派 Codex 或等效工具對本次全部 diff（task 1-3）做 Code Review（correctness／security／performance 三角度）：correctness 確認未讀計數與已讀標記狀態轉換正確；security 確認學員只能看到自己與 operator 之間的訊息串，無法讀取其他學員的私訊，附件簽名網址走既有 `packages/storage` 機制不允許路徑穿越；performance 確認 operator 未讀列表查詢沒有 N+1。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [ ] 4.3 用 ego-browser skill 跑一次完整 e2e：學員在單元頁私訊面板發送一則含附件的訊息 → operator 在未讀列表看到並回覆 → 標記已讀 → 學員看到老師回覆。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [ ] 4.4 跑 `spectra analyze lesson-private-message --json` 與 `spectra validate lesson-private-message`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [ ] 4.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
