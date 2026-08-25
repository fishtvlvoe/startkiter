## 1. 紅燈測試（TDD）

- [x] 1.1 為 `send-welcome-email.ts` 寫紅燈測試，涵蓋 Requirement「A course welcome email is sent after a successful purchase when enabled」：`enabled: true` 時寄信並記錄 `SENT`、`enabled: false` 時靜默跳過不建立記錄、無設定時靜默跳過不建立記錄、寄信失敗時記錄 `FAILED`。驗證目標：focused API test 綠燈
- [x] 1.2 為 `expiration-reminder-scan.ts` 寫紅燈測試，涵蓋 Requirement「A subscription expiration reminder is sent once per reminder threshold」：到期前 7/1/0 天各觸發一次、重複掃描不重複寄送、`CANCELED` 狀態不觸發。驗證目標：focused API test 綠燈
- [x] 1.3 為 `/api/cron/course-expiration` route 寫紅燈測試，涵蓋 Requirement「The expiration reminder cron endpoint requires a valid bearer secret」：缺少或錯誤的 `Authorization` header 回傳 401 且不執行掃描。驗證目標：focused SaaS test 綠燈

## 2. Database schema

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `EmailDeliveryLog`／`CourseWelcomeEmail`／`CourseExpirationReminder` model（依 Decision 3：`EmailDeliveryLog` 只記錄本次新增的兩類信件，不回溯既有 `sendEmail` 呼叫點，`EmailDeliveryType` 只有 `WELCOME_EMAIL`/`EXPIRATION_REMINDER` 兩個值；含 `EmailDeliveryStatus` enum，DDL 見 design.md），產生 migration。驗證目標：Prisma validate/generate 通過，focused tests 綠燈

## 3. 寄信邏輯與排程

- [x] 3.1 依 design.md Decision 2 實作 `sendWelcomeEmail`：白名單變數替換 → 既有 `react-email` Markdown renderer → `sendEmail` 自由 subject/html 模式 → `EmailDeliveryLog`
- [x] 3.2 依 design.md Decision 1 實作 `scanAndSendExpirationReminders`：外部 Cron HTTP endpoint、ACTIVE 訂閱 7/1/0 天掃描、唯一性檢查與單筆失敗隔離
- [x] 3.3 新增 `/api/cron/course-expiration`：驗證 `Authorization: Bearer ${process.env.CRON_SECRET}`，通過後執行掃描並回傳統計 JSON
- [x] 3.4 `sendWelcomeEmail` 依 `MVP_SKU`／bundle SKU 解析課程；一次買斷 notify 標記 paid 後與訂閱首期 period notify 成功後掛上歡迎信，後續訂閱期數不重寄

## 4. 頁面

- [x] 4.1 新增 `/admin/email-settings` 設定頁、模板編輯、送達紀錄列表與 `email-settings` mount point；sidebar focused test 7/7，production build route output 含該路徑

## 5. Review 與驗證

- [x] 5.1 完成 task 1-4 的 correctness／security／performance review；`code-review.md` verdict PASS，Critical/High 為 0
- [ ] 5.2 ego-browser 已實跑 operator 登入、`/admin/email-settings` 啟用模板、checkout 點擊、cron 正確 bearer／重複掃描／401、送達紀錄 `EXPIRATION_REMINDER/SENT`；證據：`/tmp/course-lifecycle-email-settings.png`、`/tmp/course-lifecycle-email-checkout-failclosed.png`、`/tmp/course-lifecycle-email-delivery-log-bottom.png`。買斷 PAYUNi acceptance 與 `WELCOME_EMAIL/SENT` 未完成：本 workspace 的 `PAYUNI_MERCHANT_ID`／`PAYUNI_HASH_KEY`／`PAYUNI_HASH_IV` 均未設定，checkout 實跑回傳 503 `payuni_not_configured`；不可用 mock 或 build 代替
- [x] 5.3 跑 `spectra analyze course-lifecycle-email --json` 與 `spectra validate course-lifecycle-email`，Coverage／Consistency／Ambiguity／Gaps 四個維度均 Clean，0 warnings／0 errors
- [x] 5.4 逐項核對 design.md Implementation Contract：API 48 files/182 tests、SaaS 31 files/163 tests、API/SaaS type-check 與 root production build 全數綠燈
