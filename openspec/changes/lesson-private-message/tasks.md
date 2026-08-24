## 1. 紅燈測試（TDD）

- [x] 1.1 為 `send-lesson-message.ts` 寫紅燈測試，涵蓋 Requirement「Learners and teachers exchange one-to-one messages per lesson」與「Teacher can mark messages as read」：學員發送、老師回覆、標記已讀三個情境。證據：先執行 `pnpm --filter @startkiter/api test send-lesson-message.test.ts`，在 procedure 尚不存在時實際 FAIL：`Cannot find module .../send-lesson-message`；完成後同檔案 focused suite 5 tests passed。
- [x] 1.2 [P] 為附件上傳寫紅燈測試，涵蓋 Requirement「Message attachments use the signed-URL storage abstraction」：`attachmentStorageKey` 為系統產生 ID 而非原始檔名。證據：同一輪紅燈先以缺少 procedure 實際 FAIL，完成後 attachment intent、signed upload、一次性 finalize 測試均納入 5 tests passed。

## 2. Database schema 與 procedure

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `LessonPrivateMessage` model（DDL 見 design.md），產生 migration；依 design.md Decision: 私訊附件複用 packages/storage，storageKey 不用使用者檔名；依 Decision: 附件採 staged upload intent，再以一次性 finalize 建立訊息；修改 `packages/storage/types.ts`／`config.ts` 新增 `lessonMessages` bucket，實作 `sendLessonMessage`／`markLessonMessageRead` procedure。證據：migration `20260824182322_add_lesson_message_upload_intent`、`20260824184149_lesson_message_upload_cleanup_lifecycle`、`20260824184722_lesson_message_upload_retention_index` 已套用；focused suite 5/5 通過。

## 3. 頁面

- [x] 3.1 新增 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx`（學員私訊面板）與 `apps/saas/app/(authenticated)/(operator)/lesson-messages/page.tsx`（operator 未讀私訊列表）。證據：ego-browser 實測學員含附件送出、operator 看到未讀、回覆、標記已讀、學員重新整理看到回覆。

## 4. Review 與驗證

- [x] 4.1 grep `packages/storage/types.ts`／`config.ts` 確認若 `course-assignment-plugin` 已 apply，這次新增的 `lessonMessages` bucket 與既有 `assignments` bucket 兩者的 `StorageBucketNamesConfig` 欄位都存在，沒有互相覆蓋。證據：`rg` 顯示兩欄並存；`@startkiter/storage` type-check 通過。
- [x] 4.2 派 Codex 或等效工具對本次全部 diff（task 1-3）做 Code Review（correctness／security／performance 三角度）：correctness 確認未讀計數與已讀標記狀態轉換正確；security 確認學員只能看到自己與 operator 之間的訊息串，無法讀取其他學員的私訊，附件簽名網址走既有 `packages/storage` 機制不允許路徑穿越；performance 確認 operator 未讀列表查詢沒有 N+1。證據：`docs/verification/lesson-private-message/14-code-review.md`；最終 CR PASS，Critical/High/Medium/Low 皆 0。
- [x] 4.3 用 ego-browser skill 跑一次完整 e2e：學員在單元頁私訊面板發送一則含附件的訊息 → operator 在未讀列表看到並回覆 → 標記已讀 → 學員看到老師回覆。證據：`docs/verification/lesson-private-message/14-e2e.md` final remediation run；實際頁面操作全部成功，首次 3001/3000 fallback mismatch 已修正後重跑通過。
- [x] 4.4 跑 `spectra analyze lesson-private-message --json` 與 `spectra validate lesson-private-message`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。證據：兩指令 exit code 0，0 warnings／0 errors。
- [x] 4.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。證據：focused API suite 5/5、root `pnpm test`、`pnpm type-check`、`pnpm build` 全部 exit code 0。
