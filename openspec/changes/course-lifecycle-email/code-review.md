# Code Review 報告 — 2026-08-28

**Change:** `course-lifecycle-email`（main 已落地實作）  
**Reviewer:** 獨立 Code Reviewer（全新 context，未照抄 archive CR）  
**範圍:** 歡迎信、到期掃描、cron、Prisma models、admin email-settings / mount point，對照 `openspec/changes/course-lifecycle-email/` 契約  
**角度:** correctness / security / performance

---

## Verdict

**PASS（可過關）**

Critical 定義（本輪硬門檻）對照結果：

| Critical 條件 | 結論 |
|---|---|
| 重複寄信（成功路徑、同一 `daysBefore` 再掃一次） | 未成立：`@@unique([subscriptionId, daysBefore])` 先預約再寄 |
| 未授權 cron 能跑掃描 | 未成立：無/錯 Bearer 或未設 `CRON_SECRET` 皆 401，且先於掃描 |
| 付款成功、`enabled: true` 卻沒寄（主路徑） | 未成立：一次買斷三條 gateway 與訂閱首期 `periodNumber === 1` 都會呼叫寄信；`enabled: false` / 無設定靜默跳過 |

**Critical: 0**

有 3 個 HIGH，建議修，但不構成「禁止過關」的 Critical。

---

## CRITICAL（0 個）

無。

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| — | — | — | — |

---

## HIGH（3 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| H1 | `packages/api/modules/course/lib/send-welcome-email.ts:40-54` | **歡迎信冪等會把「沒寄出去」鎖死。** `EmailDeliveryLog` 沒有 `(type, userId, courseId, orderId, subscriptionId)` unique。預約只靠 `pg_advisory_xact_lock` + `findFirst`：最新一筆若是 `PENDING` 或 `SENT` 就直接 return。一次買斷 webhook 重放（PAYUNi/Stripe/Shopline 已付仍會再呼叫 `sendWelcomeEmailsForOrder`）碰上「已寫 PENDING、進程在 `sendEmail` 前後被殺」時，重放會當成進行中而**永遠不寄**。`PENDING` 也沒有 TTL。這最接近 Critical「該寄卻沒寄」，但需要行程中斷，不是付款成功主路徑，故列 HIGH。 | 加 DB unique；`PENDING` 超過 N 秒視為失敗可重試；或重放時只跳過 `SENT`，不要跳過過期的 `PENDING`。 |
| H2 | `apps/saas/app/api/payuni/period-notify/route.ts:102-111` vs `208-214` | **訂閱首期 webhook 在 `COMPLETED` 重放時只補發票、不補歡迎信。** 首次 `CLAIMED` 成功後先 `completeWebhookEvent`，再用 `scheduleAfterResponse` 寄歡迎信。`after()` 沒跑完或 fire-and-forget 被吞掉時，PAYUNi 重放拿到 `COMPLETED`，程式只 `triggerInvoiceForSubscriptionPeriod`，`periodNumber === 1` 的 `sendWelcomeEmail` 不會再走。一次買斷路徑對「已付」會重試歡迎信，訂閱路徑不對稱。 | `COMPLETED && isSuccess && periodNumber === 1` 同樣呼叫 `sendWelcomeEmail`（內部已有 SENT 去重，重試安全）。 |
| H3 | `packages/api/modules/course/lib/expiration-reminder-scan.ts:55-114` + `packages/mail/lib/send.ts:48-59` | **到期提醒在失敗時刪 unique 預約，寄信結果不確定時會重複寄。** 流程是 `CourseExpirationReminder.create`（預約）→ `sendEmail` → 成功才留預約。`sendEmail` 把 provider 任何 exception 收成 `false`（包含「provider 已收信但 HTTP 超時」）。掃描端把 `false` 當失敗，`delivered` 仍為 false，於是 `courseExpirationReminder.delete`。下次 cron 會再寄一封。這不是「再掃一次就重複」（unique 擋得住成功路徑），而是失敗回滾把 at-most-once 變成 at-least-once。 | 失敗時**不要刪** reminder；改留預約並把 `EmailDeliveryLog` 標 `FAILED` 供人工/下次補償。若要自動重試，用明確的「未寄出」狀態，不要用「刪 unique 列」。 |

---

## MEDIUM（9 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| M1 | `apps/saas/app/api/cron/course-expiration/route.ts:4-8` | Cron 用字串 `!==` 比對 `Authorization: Bearer ${secret}`，**不是 timing-safe**。同專案 `invoice-retry` / `assignment-upload-cleanup` / `lesson-message-upload-cleanup` 已用 `timingSafeEqual`。此 endpoint 亦無 `dynamic = "force-dynamic"`、無 `Cache-Control: no-store`；契約規定 GET，CDN 對缺 `Authorization` 的 GET 有快取 401 或略過 Vary 的風險。未授權仍不會跑掃描（`!secret` fail-closed），故非 Critical。 | 抽共用 `hasValidCronSecret`；加 `export const dynamic = "force-dynamic"` 與 `Cache-Control: no-store`。 |
| M2 | `apps/saas/lib/orders.ts:80-99`；`packages/api/modules/course/lib/invoice-events.ts` | 契約 / tasks.md 3.4 寫在 `markOrderPaid` 成功分支與 `triggerInvoiceForSubscriptionPeriod` 旁掛歡迎信。實作改掛在各 gateway webhook + `period-notify`。**目前三條一次買斷路徑都有掛**，主路徑沒漏；但以後新付款入口只呼叫 `markOrderPaid` 就會漏寄。 | 把 `sendWelcomeEmailsForOrder` 收進 `markOrderPaid` 成功且 `count > 0` 之後（或單一 `onOrderPaid` hook），避免各 webhook 複製。 |
| M3 | `apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx:50-54, 124-144` | 契約：送達紀錄「依 type/status 篩選」。API `list-email-delivery-log.ts` 已有 `type`/`status`，**UI 載入時固定 `limit: 50`，沒有篩選控制**，也不在儲存後重整。 | 頁面加 type/status 下拉，把參數傳進 `listEmailDeliveryLog`。 |
| M4 | `packages/database/prisma/schema.prisma:664-700` | `scanAndSendExpirationReminders` 的 WHERE 是 `status: ACTIVE` + `currentPeriodEnd` 區間，**`CourseSubscription` 沒有 `(status, currentPeriodEnd)` 複合索引**。掃描本身是一次 `findMany`（符合「不要逐筆訂閱各打一次 DB」），但訂閱量上來會變 seq scan。 | 加 `@@index([status, currentPeriodEnd])`。 |
| M5 | `packages/mail/lib/course-lifecycle.ts:5-13`；`packages/mail/emails/CourseWelcome.tsx:19` | HTML 標籤有把 `<` `>` 換成 entity，`<script>` 不會進 HTML。**未擋 markdown 連結協定**：operator 可寫 `[x](javascript:...)` / `data:`。收件人值有跳脫 `[]()*_`#<>`，學員名稱不容易組出連結；這是 operator 模板面，不是公開 XSS 後門。 | markdown 轉 HTML 後清掉非 `https?` 的 `href`/`src`；加回歸測試。 |
| M6 | `packages/api/modules/course/lib/send-welcome-email.ts:21-26, 17-19` | 白名單三個變數用 `replaceAll` **依序**替換，且 `safeTemplateValue` 不跳脫 `{` `}`。使用者名稱若為 `{{courseUrl}}`，會在下一步被換成真正 URL（變數連動）。其餘 `{{foo}}` 會原樣保留，符合契約。 | 一次 pass 用 regex 只替換白名單；值裡的 `{{` 再跳脫。 |
| M7 | `packages/api/modules/course/lib/expiration-reminder-scan.ts:8-10, 45-46` vs `apps/saas/app/api/payuni/period-notify/route.ts:32` | 到期掃描用 **UTC 日界**；訂閱 `currentPeriodEnd` 由 PAYUNi `NextAuthDate` 寫成 **`T00:00:00+08:00`**。台灣日曆的「前 7 / 前 1 / 當天」可能偏移一個曆日。仍會各寄一次、unique 仍擋重複，不是漏寄或重寄。 | 掃描改用 Asia/Taipei 日界，或寫入 periodEnd 時就存 UTC 日期與掃描同一套。 |
| M8 | `apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/page.tsx:7` vs `packages/api/modules/course/lib/course-operator.ts:15-18` | 頁面用 `requireGlobalAdmin()`（`user.role === admin` → `admin.access`）；寫入/列表 API 用 `courseOperatorProcedure`（email 必須等於 `ADMIN_EMAIL`）。**有 admin role 但 email 不是 `ADMIN_EMAIL` 的人進得了頁、存檔會 FORBIDDEN。** 這是課程後台既有模式，不是越權（API 更嚴），但本頁會「看得到存不了」。 | 與其他 admin 頁對齊同一套 gate，或在頁面載入時用同一規則。 |
| M9 | `packages/api/modules/course/lib/send-welcome-email.ts:141-150` | tasks.md 3.4 要走 `BundleCourseAccessReader.findBundleCourseIds(sku)`。實作是 `db.bundle.findUnique({ where: { id: order.sku } })`，與 reader 目前等價（sku = bundle id），但之後 reader 若排除停用課程，這裡會漂。另外 `MVP_SKU` 用 `findFirst({ status: "PUBLISHED" })` 無 `orderBy`，多門已上架課時歡迎信可能寄錯課程（與 `getPublicCurriculum` 同一假設：「唯一那門課」）。 | 改呼叫既有 reader；MVP 課程識別不要靠無序 `findFirst`。 |

---

## LOW（5 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| L1 | `packages/database/prisma/schema.prisma:713`；寄信成功 update | 契約有 `providerMessageId`，成功路徑沒寫入。Resend SDK 回傳 `{ data, error }` 也沒被 `resend.ts` 檢查，底層寄信失敗可能仍被 `sendEmail` 當成 `true`。這是 mail 層既有問題，本 change 用它記 `SENT`。 | 檢查 Resend `error`；把 message id 寫進 log。 |
| L2 | `packages/platform/src/mount-points.ts:118-126` | tasks 要選單「Email 設定」；實作是「郵件設定」，`requiresOperator: true`、`order: 18` 正確。 | 若文案要對契約再改 label。 |
| L3 | `packages/api/modules/course/lib/expiration-reminder-scan.ts:45-46` | 8 天視窗內 2–6 天的訂閱會被載入再 `continue`，不計入 `skipped`。統計可能讓 operator 以為排程沒掃到。 | WHERE 直接限制 0/1/7 三個日期，或 `skipped` 分開計。 |
| L4 | `packages/api/modules/course/lib/send-welcome-email.test.ts`；mail 套件 | 無 `sendWelcomeEmailsForOrder`（MVP_SKU / bundle）測試；無 `interpolateTemplate` 未知變數／連動替換測試；無 markdown XSS 測試。到期測試沒 assert `daysBefore` 為 7/1/0。cron 測試沒覆蓋「未設定 `CRON_SECRET`」（程式本身 fail-closed）。 | 補上列回歸。 |
| L5 | `packages/api/modules/course/lib/expiration-reminder-scan.ts:48-53` | 到期提醒 subject 直接插入 `course.title`，沒走歡迎信的 `safeSubject`（去 CRLF）。title 是 operator 欄位，不是學員輸入。 | 共用 `safeSubject`。 |

---

## 三角度對照（契約 checklist）

### 1. Correctness

| 項目 | 結果 |
|---|---|
| 到期 7 / 1 / 0 天各一次 | **通過。** `REMINDER_DAYS = {0,1,7}`；`daysBefore` 由 UTC 日差 `Math.round` 算出。測試覆蓋三檔。時區偏移見 M7。 |
| unique 擋重複 | **成功路徑通過。** `CourseExpirationReminder @@unique([subscriptionId, daysBefore])`，先 `create` 再寄；`P2002` → skipped。失敗回滾見 H3。 |
| `CANCELED` 不寄 | **通過。** `findMany` 已 `status: "ACTIVE"`，迴圈再守一次。測試有 CANCELED fixture。 |
| 歡迎信 `enabled` 開關 | **通過。** `if (!setting?.enabled \|\| !user?.email \|\| !course) return`；false / 無設定不建 log。測試覆蓋。 |
| 一次買斷後該寄 | **主路徑通過。** PAYUNi / Stripe / Shopline notify 在 `markOrderPaid` 成功與已付重放都呼叫 `sendWelcomeEmailsForOrder`。掛點不在 `markOrderPaid` 本體（M2）。 |
| 訂閱首期該寄、後續期不寄 | **主路徑通過。** `periodNumber === 1` 才寄。`COMPLETED` 重放不補（H2）。 |

### 2. Security

| 項目 | 結果 |
|---|---|
| cron 無/錯 bearer → 401 且不掃描 | **通過。** `!secret \|\| authorization !== \`Bearer ${secret}\`` 先 return 401。測試：`undefined` / `Bearer wrong` / `Basic cron-secret` 皆不呼叫 scan。未設 secret 亦 401。 |
| markdown 不可任意 script | **HTML 注入通過。** `<` `>` 先 entity 再進 `react-email` `<Markdown>`；React 文字節點輸出 courseName/userName。`javascript:` 協定見 M5。 |
| admin 寫入越權 | **通過（偏嚴）。** 頁面 `requireGlobalAdmin`；API `courseOperatorProcedure`。無公開 REST `__return_true`。 |
| 無硬編碼金鑰 | **通過。** |

### 3. Performance

| 項目 | 結果 |
|---|---|
| 到期掃描不是逐筆訂閱各打一次 DB | **通過。** 一次 `courseSubscription.findMany`（含 user/course），記憶體算 `daysBefore`，再用 unique `create` 當預約，沒有對每筆訂閱 `findUnique` reminder。寄信後的 per-email create/update 是必要寫入，不是 N+1 查詢。 |
| 缺掃描索引 | M4，不影響「一次查出再處理」的契約。 |

---

## 通過項目

- Cron 無/錯/未設 `CRON_SECRET` → 401，掃描函式不會跑
- `CourseExpirationReminder @@unique([subscriptionId, daysBefore])` 存在，成功路徑再掃不重寄
- `CANCELED` / 非 ACTIVE 不進掃描結果（query + 迴圈雙重）
- `CourseWelcomeEmail.enabled === false` 或無設定：不寄、不寫 log、不拋錯
- `enabled === true` 主路徑：寄信並把 log 從 `PENDING` 更新為 `SENT`；provider 回 `false` 記 `FAILED`
- 一次買斷：PAYUNi / Stripe / Shopline 付款成功與已付重放都呼叫 `sendWelcomeEmailsForOrder`
- 訂閱：僅 `periodNumber === 1` 寄歡迎信
- Markdown 原始 HTML 標籤被跳脫；無 `dangerouslySetInnerHTML`
- 到期掃描單次 `findMany`，不是逐筆訂閱查 DB
- Prisma models / enum 與 design.md DDL 一致（`EmailDeliveryType` 只有 `WELCOME_EMAIL` / `EXPIRATION_REMINDER`）
- `/admin/email-settings` 存在，`requireGlobalAdmin`；mount point `id: "email-settings"`、`requiresOperator: true`
- 更新／列表 API 走 operator procedure，有 Zod 長度上限
- 無硬編碼密碼 / API key；無 merge conflict marker

---

## 結論

**CRITICAL 0 / HIGH 3 / MEDIUM 9 / LOW 5 — 可過關（Critical: 0）**

主契約（7/1/0 各一次、unique 擋成功路徑重複、CANCELED 不寄、enabled 開關、未授權 cron 不掃描、markdown 不跑 script 標籤、掃描非逐筆查訂閱、付款成功主路徑會寄）成立。

HIGH 三條都是**中斷／重放／不確定失敗**的冪等問題，不是 happy path 漏寄或未授權掃描。建議修 H1–H3 再 archive，但不擋本輪 Critical 門檻。
