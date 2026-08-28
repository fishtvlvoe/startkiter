## Context

woomin（`products/woomin/realms/`）有完整的 email 生命週期自動化，其中 `CourseExpirationReminder`（`prisma/schema.prisma` 1486 行起）、`CourseWelcomeEmail`（1498 行起）、`EmailDeliveryLog`（1516 行起）三個 model 是本次搬遷範圍；`NewsletterCampaign`／`NewsletterAutomation` 系列共 9 個 model 是行銷自動化平台等級功能，本次 Non-Goals 排除。woomin 用 Vercel Cron（`vercel.json` 的 `crons` 陣列，`/api/cron/course-expiration` 排程 `0 2 * * *`）觸發到期掃描。

StartKiter 部署目標是 Zeabur 類常駐 Node（`context` 段落：「部署：常駐 Node（Zeabur 類）+ PostgreSQL + /data volume；預設不是 Vercel serverless」），沒有 Vercel Cron 可用，目前也沒有任何背景排程基礎設施。`packages/mail/lib/send.ts` 的 `sendEmail` 支援兩種模式：固定 `templateId`（`mailTemplates` 是寫死的 React 信件元件）或自由 `subject`/`html`/`text`；`CourseWelcomeEmail.markdownTemplate` 是 operator 自訂內容，不適合走固定模板路徑，須走自由 subject/html 模式。

`Order` 付款成功的既有觸發點是 `apps/saas/lib/orders.ts` 的 `markOrderPaid(orderNo, gatewayTradeNo)`；訂閱首期扣款成功的觸發點在 `subscriptions-invoice` change 規劃的 `triggerInvoiceForSubscriptionPeriod`（`packages/api/modules/course/lib/invoice-events.ts`，該 change 已封存待 apply）。`CourseSubscription.currentPeriodEnd`（`packages/database/prisma/schema.prisma` 458 行起）是到期日欄位，`status: CourseSubscriptionStatus` 有 `PENDING`/`ACTIVE`/`CANCELED` 三值。

`Order` 沒有 `courseId` 欄位，只有 `sku`；`packages/course/access.ts` 的 `canAccessCourseId` 顯示 `sku === MVP_SKU` 時代表授予「唯一那門課」的存取權，沒有現成的「sku → courseId」反查函式。`sendWelcomeEmail` 需要自行解析：`sku === MVP_SKU` 時查 `db.course.findFirst({ where: { status: "PUBLISHED" } })`（比照 `getPublicCurriculum` procedure 既有寫法）取得該課程；`sku` 對應 bundle 時（透過既有 `BundleCourseAccessReader.findBundleCourseIds(sku)`）取得課程清單，逐一檢查各自的 `CourseWelcomeEmail` 設定分別寄送。

## Goals / Non-Goals

**Goals:**
- 付款成功（一次買斷或訂閱首期）後，若該課程設定了啟用的歡迎信，自動寄送
- 訂閱到期前 7 天、前 1 天、當天各寄一次提醒，同一筆訂閱同一個 `daysBefore` 不重複寄
- 每封信的送達結果（成功／失敗／provider 回傳的訊息 ID）都有記錄可查

**Non-Goals:**
- 不做電子報群發、行銷自動化流程引擎、開信/點擊追蹤、退訂同意記錄（見 proposal.md Non-Goals，範圍屬於行銷工具而非交易生命週期）
- 不引入常駐排程套件（`node-cron` 等），排程改由外部觸發

## Decisions

### Decision 1：到期提醒排程用外部 Cron 服務打 HTTP endpoint，不引入常駐排程套件

新增 `apps/saas/app/api/cron/course-expiration/route.ts`，用 `CRON_SECRET` 環境變數做 Bearer token 驗證，由 Zeabur 內建 Cron Job（或任何外部 cron 服務，例如 cron-job.org）每天呼叫一次。

**Alternatives Considered：**
1. 引入 `node-cron` 在應用啟動時註冊排程——否決，常駐 Node 進程重啟（部署、crash restart）會遺失排程狀態且需要額外處理「進程剛啟動時是否要立即補跑」的邊界情況；HTTP endpoint 模式無狀態，且能用 `curl` 手動觸發驗證，更容易測試
2. 用資料庫層的 pg_cron 擴充——否決，StartKiter 用的是託管 PostgreSQL（Neon/Zeabur），不確定目標環境是否啟用該擴充，增加部署環境依賴的不確定性

### Decision 2：`CourseWelcomeEmail.markdownTemplate` 轉 HTML 時走既有 markdown renderer，不手刻字串插值

`sendWelcomeEmail` 组装信件內容時，先把 `{{userName}}`／`{{courseName}}`／`{{courseUrl}}` 三個允許變數做安全的字串取代（白名單變數，不支援任意欄位插值），再把結果丟進既有的 markdown-to-html 轉換（沿用 `packages/course` 或既有共用套件裡已經在用的 markdown renderer，apply 階段以 `grep -rln "remark\|markdown-it\|marked" packages --include="package.json"` 確認專案既有的 markdown 處理套件，優先複用不新增依賴），輸出的 HTML 才交給 `packages/mail` 的 `send()`。不手刻正則字串替換組 HTML，避免重蹈 `fix-critical-xss-and-assignment-upload`（woomin 已封存的安全修復）裡「欄位未驗證格式插值進輸出造成 stored XSS」的同類錯誤——即使 `CourseWelcomeEmail` 內容是 operator 自己填寫、非學員輸入，仍用受信任的 markdown renderer 處理，不逐字組字串。

**Alternatives Considered：**
1. 直接把 `markdownTemplate` 當純文字塞進 `<pre>` 顯示——否決，operator 需要基本排版（粗體、連結、換行），純文字不符合「可自訂內容」的產品目標
2. 允許 operator 直接填寫原始 HTML（不經 markdown）——否決，擴大可控輸出面，且與 Decision 2 的安全原則衝突

### Decision 3：`EmailDeliveryLog` 只記錄本次新增的兩類信件，不回溯既有 `sendEmail` 呼叫點

`EmailDeliveryLog.type` 只有 `WELCOME_EMAIL`／`EXPIRATION_REMINDER` 兩個值，既有的 `magicLink`／`forgotPassword`／`organizationInvitation`／`emailVerification`／`notification` 五個固定模板呼叫點（`packages/mail/emails/index.ts`）不接入送達記錄。

**Alternatives Considered：**
1. 在 `sendEmail` 函式本身統一接入送達記錄，涵蓋全部六種信件類型——否決，屬於範圍外的重構，`sendEmail` 是全站共用的底層函式，改動會影響認證流程（magic link／密碼重設）的既有行為，風險與本次 Non-Goals 邊界不符；若未來需要，應另開 change 明確評估對認證流程的影響

## Implementation Contract

**Behavior：**
- Operator 在 `/admin/email-settings` 依課程設定歡迎信：啟用開關、主旨模板、Markdown 內文
- 買家付款成功（一次買斷 `markOrderPaid` 成功，或訂閱首期 `triggerInvoiceForSubscriptionPeriod` 成功）後，若對應課程的 `CourseWelcomeEmail.enabled` 為 true，寄出歡迎信並寫入 `EmailDeliveryLog`；未設定或 `enabled` 為 false 時靜默跳過，不視為錯誤、不寫入失敗記錄
- 外部 Cron 服務每天呼叫一次 `/api/cron/course-expiration`（帶 `Authorization: Bearer ${CRON_SECRET}`），掃描 `status: ACTIVE` 且 `currentPeriodEnd` 落在「今天 + 7 天」「今天 + 1 天」「今天」三個區間的 `CourseSubscription`，逐筆檢查 `CourseExpirationReminder` 是否已有相同 `subscriptionId`+`daysBefore` 記錄，沒有才寄信並建立記錄
- `/admin/email-settings` 同頁可查送達記錄列表，依 `type`/`status` 篩選

**Interface / data shape：**
```prisma
enum EmailDeliveryType {
  WELCOME_EMAIL
  EXPIRATION_REMINDER
}

enum EmailDeliveryStatus {
  PENDING
  SENT
  FAILED
}

model EmailDeliveryLog {
  id                String              @id @default(cuid())
  type              EmailDeliveryType
  status            EmailDeliveryStatus @default(PENDING)
  orderId           String?
  subscriptionId    String?
  userId            String
  courseId          String?
  toEmail           String
  subject           String
  providerMessageId String?
  errorMessage      String?             @db.Text
  sentAt            DateTime?
  createdAt         DateTime            @default(now())

  @@index([type])
  @@index([status])
  @@index([userId])
  @@map("email_delivery_log")
}

model CourseWelcomeEmail {
  id               String   @id @default(cuid())
  courseId         String   @unique
  enabled          Boolean  @default(false)
  subjectTemplate  String
  markdownTemplate String   @db.Text
  updatedAt        DateTime @updatedAt

  course           Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@map("course_welcome_email")
}

model CourseExpirationReminder {
  id             String   @id @default(cuid())
  subscriptionId String
  daysBefore     Int
  sentAt         DateTime @default(now())

  subscription   CourseSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, daysBefore])
  @@index([sentAt])
  @@map("course_expiration_reminder")
}
```

- `sendWelcomeEmail({ userId, courseId, orderId?, subscriptionId? }): Promise<void>` — 內部靜默處理未設定/未啟用情況，不拋錯
- `scanAndSendExpirationReminders(): Promise<{ sent: number; skipped: number; failed: number }>` — 供 cron endpoint 呼叫，回傳統計供 log 觀察
- `GET /api/cron/course-expiration`：`Authorization: Bearer ${CRON_SECRET}` 不符 → 401；符合 → 執行 `scanAndSendExpirationReminders()` 並回傳統計 JSON

**Failure modes：**
- `send()` 底層寄信失敗（provider 錯誤）→ `EmailDeliveryLog.status = FAILED`，`errorMessage` 記錄錯誤訊息；`sendWelcomeEmail`／`scanAndSendExpirationReminders` 不因單筆失敗中斷整批（到期提醒是批次掃描，一筆寄信失敗不影響其他筆）
- `/api/cron/course-expiration` 缺少或錯誤的 `CRON_SECRET` → 401，不執行任何掃描
- `CourseWelcomeEmail.markdownTemplate` 包含變數插值以外的 `{{...}}` 語法 → 原樣輸出（不報錯、不注入），因為 Decision 2 的白名單變數替換只處理三個已知變數，其餘 `{{...}}` 字面保留

**Acceptance criteria：**
- `pnpm --filter @startkiter/api test send-welcome-email.test.ts` 綠燈：`enabled: true` 時寄信並記錄成功、`enabled: false` 或無設定時靜默跳過且不建立記錄、寄信失敗時記錄 `FAILED` 狀態
- `pnpm --filter @startkiter/api test expiration-reminder-scan.test.ts` 綠燈：到期前 7/1/0 天的訂閱各觸發一次提醒、已寄過的 `daysBefore` 不重複寄、非 ACTIVE 狀態的訂閱不觸發
- 手動驗證：`curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/course-expiration` 回傳統計 JSON 且無 `CRON_SECRET` 時回傳 401
- 手動驗證：operator 在 `/admin/email-settings` 啟用某課程歡迎信後，用測試帳號完成一次買斷付款，確認收到信且送達記錄出現一筆 `SENT`

**Scope boundaries：**
- In scope：`EmailDeliveryLog`／`CourseWelcomeEmail`／`CourseExpirationReminder` 三個 model、`sendWelcomeEmail`／`scanAndSendExpirationReminders` 函式、`/api/cron/course-expiration` endpoint、`/admin/email-settings` 頁面
- Out of scope：Newsletter 系列 9 個 model、`EmailConsentLog`、開信/點擊追蹤、既有五種固定模板信件的送達記錄回溯

## Risks / Trade-offs

- [Risk] 外部 Cron 服務未設定或設定錯誤時，到期提醒完全不會觸發，且沒有站內告警 → Mitigation：`/admin/email-settings` 送達記錄列表可看出「最近一次 `EXPIRATION_REMINDER` 記錄的時間」，operator 可自行察覺排程異常；正式告警機制留待未來需要時再開 change
- [Risk] `subscriptions-invoice` change 尚未 apply，本次依賴的 `triggerInvoiceForSubscriptionPeriod` 掛勾點還不存在 → Mitigation：兩張 change 依 apply 順序處理，`course-lifecycle-email` 排在 `subscriptions-invoice` 之後 apply，已寫進總 SR 計畫的依賴關係
- [Risk] Markdown renderer 若專案內尚未有現成套件，apply 階段才發現需要新增依賴，與 proposal.md「Dependencies 新增：無」的宣告不一致 → Mitigation：design.md Decision 2 已要求 apply 階段先 grep 確認既有套件；若確實沒有，apply 階段記錄下來作為本 change 的實際依賴變更，不視為隱藏 scope creep（因為 markdown 轉換是 In scope 功能的必要手段）
