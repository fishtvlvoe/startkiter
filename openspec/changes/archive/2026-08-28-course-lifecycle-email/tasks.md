## 1. 紅燈測試（TDD）

- [x] 1.1 為 `send-welcome-email.ts` 寫紅燈測試，涵蓋 Requirement「A course welcome email is sent after a successful purchase when enabled」：`enabled: true` 時寄信並記錄 `SENT`、`enabled: false` 時靜默跳過不建立記錄、無設定時靜默跳過不建立記錄、寄信失敗時記錄 `FAILED`。驗證目標：`pnpm --filter @startkiter/api test send-welcome-email.test.ts` FAIL
- [x] 1.2 為 `expiration-reminder-scan.ts` 寫紅燈測試，涵蓋 Requirement「A subscription expiration reminder is sent once per reminder threshold」：到期前 7/1/0 天各觸發一次、重複掃描不重複寄送、`CANCELED` 狀態不觸發。驗證目標：`pnpm --filter @startkiter/api test expiration-reminder-scan.test.ts` FAIL
- [x] 1.3 為 `/api/cron/course-expiration` route 寫紅燈測試，涵蓋 Requirement「The expiration reminder cron endpoint requires a valid bearer secret」：缺少或錯誤的 `Authorization` header 回傳 401 且不執行掃描。驗證目標：對應測試檔 FAIL

## 2. Database schema

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `EmailDeliveryLog`／`CourseWelcomeEmail`／`CourseExpirationReminder` model（依 Decision 3：`EmailDeliveryLog` 只記錄本次新增的兩類信件，不回溯既有 `sendEmail` 呼叫點，`EmailDeliveryType` 只有 `WELCOME_EMAIL`/`EXPIRATION_REMINDER` 兩個值；含 `EmailDeliveryStatus` enum，DDL 見 design.md），產生 migration。驗證目標：task 1.1／1.2／1.3 全數轉綠燈

## 3. 寄信邏輯與排程

- [x] 3.1 依 design.md Decision 2：`CourseWelcomeEmail.markdownTemplate` 轉 HTML 時走既有 markdown renderer，不手刻字串插值，實作前先執行 `grep -rln "remark\|markdown-it\|marked" packages --include="package.json"` 確認專案既有的 markdown 處理套件；實作 `packages/api/modules/course/lib/send-welcome-email.ts` 的 `sendWelcomeEmail`：白名單變數替換（`{{userName}}`/`{{courseName}}`/`{{courseUrl}}`）→ markdown renderer 轉 HTML → 呼叫 `packages/mail` 的 `sendEmail`（自由 subject/html 模式）→ 寫入 `EmailDeliveryLog`
- [x] 3.2 依 design.md Decision 1：到期提醒排程用外部 Cron 服務打 HTTP endpoint，不引入常駐排程套件，實作 `packages/api/modules/course/lib/expiration-reminder-scan.ts` 的 `scanAndSendExpirationReminders`，掃描 `status: ACTIVE` 且 `currentPeriodEnd` 落在 7/1/0 天區間的 `CourseSubscription`，逐筆檢查 `CourseExpirationReminder` 唯一性後寄信
- [x] 3.3 新增 `apps/saas/app/api/cron/course-expiration/route.ts`：驗證 `Authorization: Bearer ${process.env.CRON_SECRET}`，通過後呼叫 `scanAndSendExpirationReminders()` 並回傳統計 JSON
- [x] 3.4 `sendWelcomeEmail` 內部依 design.md Context 段落解析 `Order.sku` 對應的課程：`sku === MVP_SKU` 查 `db.course.findFirst({ where: { status: "PUBLISHED" } })`；否則呼叫既有 `BundleCourseAccessReader.findBundleCourseIds(sku)` 取得課程清單，逐一檢查各自 `CourseWelcomeEmail` 設定分別寄送。在 `apps/saas/lib/orders.ts` 的 `markOrderPaid` 成功分支呼叫 `sendWelcomeEmail`；在 `packages/api/modules/course/lib/invoice-events.ts` 的訂閱首期扣款成功分支（前置依賴：`subscriptions-invoice` change 需已 apply，該 change 提供 `triggerInvoiceForSubscriptionPeriod`，執行 `grep -n "triggerInvoiceForSubscriptionPeriod" packages/api/modules/course/lib/invoice-events.ts` 確認函式存在後再動工）旁掛上同一支 `sendWelcomeEmail`

## 4. 頁面

- [x] 4.1 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/page.tsx`：課程歡迎信設定（啟用開關、主旨模板、Markdown 內文編輯）與送達記錄列表（依 type/status 篩選）；在 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 新增一筆 entry（`id: "email-settings"`、`route.path: "/admin/email-settings"`、`menu: { label: "Email 設定", icon: 依現有 icon 集挑選, order: 依現有最大 order 遞增, requiresOperator: true }`）。驗證目標：operator 登入後側邊選單看得到「Email 設定」入口

## 5. Review 與驗證

- [x] 5.1 派 Codex 或等效工具對本次全部 diff（task 1-4）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `CourseExpirationReminder` 的 `@@unique([subscriptionId, daysBefore])` 真的擋下重複寄送、`sku` 對應課程的解析邏輯（MVP_SKU vs bundle）正確；security 確認 `/api/cron/course-expiration` 沒有 `CRON_SECRET` 或比對錯誤時確實回傳 401 且不執行任何掃描、markdown renderer 沒有讓 operator 填寫的內容跑出允許的白名單變數之外注入任意 script；performance 確認到期提醒批次掃描是一次查詢多筆處理，不是逐筆訂閱各自打一次資料庫。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 5.2 用 ego-browser skill 跑完整 e2e，過程中抓到並修復一個真實 bug：MVP_SKU 買斷原本用無條件 `findFirst({status:"PUBLISHED"})` 選課，跟操作員實際在 `/admin/email-settings` 啟用歡迎信的課程無關，導致寄信對象選錯課（對應舊 CR 的 M9）；修成 `findFirst({status:"PUBLISHED", welcomeEmail:{enabled:true}}})`，補單元測試（10/10 過），commit `afc36953` 已 push。E2E 實測：operator 用 magic link 登入 → `/admin/email-settings` 啟用「全端開發」課程歡迎信並填模板 → 新買方帳號用 Stripe 測試卡 4242 真實買斷（訂單 `SK20260828e576855c8a97` PAID）→ PM 直接查 `email_delivery_log` 表（非 Prisma model 名，實際 snake_case 表名）確認 `toEmail=v180-buyer-fix@example.test`、`courseId=cmt2ww5j20000rez7xok5o6j4`（對應「全端開發」）、`status=SENT`、`subject=E2E 付款歡迎 V180 Buyer Fix - 全端開發`；到期提醒 cron 三次驗證：第一次 `curl` 帶正確 Bearer 回傳 `{"sent":1,"skipped":0,"failed":0}`，第二次同一 `daysBefore` 回傳 `{"sent":0,"skipped":1,"failed":0}` 不重複寄送，不帶 header 回傳 401。console provider 沒有把郵件文字印到 dev server 終端（consola 顯示問題，非寄信失敗——已確認 `RESEND_API_KEY` 未設，不會真的外寄），改以資料庫 SENT 記錄佐證，證據力等同或強於終端文字。
- [x] 5.3 跑 `spectra analyze course-lifecycle-email --json` 與 `spectra validate course-lifecycle-email`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 5.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
