## Why

買家付款成功後，站內目前只有 `createWelcomeNotification` 寫入的站內通知（`packages/notifications/src/welcome.ts`），沒有寄送 email。訂閱到期前也沒有任何提醒機制，買家續費失敗或訂閱到期後才會發現失去課程存取權。也沒有任何 email 送達記錄，出問題時無法追查是否真的寄出、是否失敗。

## What Changes

- 新增 `EmailDeliveryLog` model：記錄本次新增的兩類信件（歡迎信、到期提醒）的送達狀態、`providerMessageId`、失敗原因
- 新增 `CourseWelcomeEmail` model：operator 可依課程設定是否啟用歡迎信、自訂主旨與 Markdown 內文（含變數：`{{userName}}`／`{{courseName}}`／`{{courseUrl}}`）
- 一次買斷付款成功（`markOrderPaid`）與訂閱首期扣款成功兩個既有觸發點，各自呼叫 `sendCourseWelcomeEmail`：讀取對應課程的 `CourseWelcomeEmail` 設定，`enabled` 為 false 或無設定時不寄信、不視為錯誤
- 新增 `CourseExpirationReminder` model：記錄「哪筆訂閱在到期前第幾天已經寄過提醒」，防止同一筆訂閱同一個 `daysBefore` 重複寄送
- 新增每日排程任務：掃描 `currentPeriodEnd` 落在提醒區間（到期前 7 天、到期前 1 天、已到期當天）且 `status: ACTIVE` 的 `CourseSubscription`，寄送到期提醒信並寫入 `CourseExpirationReminder`
- Operator 後台新增 email 設定頁：編輯歡迎信模板、查看送達記錄列表（依 type/status 篩選）

## Non-Goals

- 不做電子報群發（`NewsletterCampaign`/`Recipient`/`Template`/`Link` 系列）：屬於行銷工具範疇，需要退訂連結網域、寄信頻率限制、內容審核等額外基礎設施，非課程交易生命週期的必要功能，列入總 SR 計畫的待裁決清單
- 不做自動化流程引擎（`NewsletterAutomation`/`Step`/`Enrollment`/`Delivery`/`Open`/`Click` 系列）：woomin 這套是完整的行銷自動化平台等級功能，範圍遠超單一課程 MVP 需求，同上列入待裁決清單
- 不做 `EmailConsentLog`（退訂同意記錄）：只有主動群發行銷信才需要這份合規記錄；本次兩類信件（交易歡迎信、到期提醒）都是服務性通知，不受退訂規範約束
- 不做 email 開信/點擊追蹤（pixel/link tracking）
- 不做退款後的到期提醒取消通知（退款後訂閱直接被標記退款，不會進入到期提醒的排程掃描範圍，見 design.md）

## Capabilities

### New Capabilities

- `course-lifecycle-email`：購買後歡迎信與訂閱到期提醒

## Impact

- Affected specs: `course-lifecycle-email`（新增）
- Affected code:
  - New:
    - `packages/mail/emails/CourseWelcome.tsx`（Markdown 轉 HTML 的信件外殼元件）
    - `packages/api/modules/course/lib/send-welcome-email.ts`
    - `packages/api/modules/course/lib/send-welcome-email.test.ts`
    - `packages/api/modules/course/lib/expiration-reminder-scan.ts`
    - `packages/api/modules/course/lib/expiration-reminder-scan.test.ts`
    - `packages/api/modules/course/procedures/update-welcome-email-settings.ts`
    - `packages/api/modules/course/procedures/list-email-delivery-log.ts`
    - `apps/saas/app/api/cron/course-expiration/route.ts`（排程觸發的 HTTP endpoint）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/page.tsx`
    - `packages/database/prisma/migrations/`（新增 `EmailDeliveryLog`／`CourseWelcomeEmail`／`CourseExpirationReminder` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/api/modules/course/router.ts`
    - `apps/saas/lib/orders.ts`（`markOrderPaid` 成功後呼叫 `sendWelcomeEmail`）
    - `packages/api/modules/course/lib/invoice-events.ts`（訂閱首期扣款成功的既有觸發點旁掛 `sendWelcomeEmail`，具體函式名稱於 apply 階段以 `grep -n "triggerInvoiceForSubscriptionPeriod" packages/api` 定位）
    - `packages/mail/emails/index.ts`（`mailTemplates` 不需要新增 `courseWelcome`，因為模板內容是 operator 動態填寫，走 `sendEmail` 的自由 subject/html 模式，非固定模板 ID，僅需新增共用信件外殼元件）
    - `packages/platform/src/mount-points.ts`（`MOUNT_POINTS` 新增一筆 entry：`id: "email-settings"`、`route.path: "/admin/email-settings"`、`menu: { requiresOperator: true }`）
  - Removed: 無
- Dependencies 新增：無（排程改用平台外部 Cron 服務打 HTTP endpoint，不引入 `node-cron` 等常駐排程套件，見 design.md Decision）
- 環境變數新增：`CRON_SECRET`（保護 `/api/cron/course-expiration` endpoint 不被外部隨意觸發，比照常見 cron endpoint 保護慣例）
