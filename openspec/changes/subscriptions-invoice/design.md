## Context

`openspec/config.yaml` 既定「發票不在 MVP；下一輪才接 `@paid-tw/einvoice*`」，這次就是那一輪。PAYUNi（StartKiter 唯一金流）不提供開發票 API——`.docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md`（官方教學文件）明確指出：PAYUNi 用戶必須另外搭配 ezPay（藍新）或綠界 ECPay 當發票加值中心，收款跟開票是完全分開的兩件事，互不綁定。Fish 已確認公司、工商憑證、字軌都已就位，可以直接做到正式上線開票。

`/Users/fishtv/Development/products/woomin/realms/lib/invoice/`（10 個檔案）已有生產驗證過的完整實作：`provider.ts`（雙 provider factory）、`issue.ts`（`buildIssueInput`，含稅/未稅換算、B2C/B2B/捐贈欄位對映）、`credentials.ts`、`config.ts`、`reconciliation.ts`（作廢/折讓）、`query.ts`、`preflight.ts`、`ecpay-online-allowance.ts`、`provider-order-id.ts`、`provider-limits.ts`。這次照抄其邏輯層，適配 StartKiter 自己的 schema。

現有 `Order` model（一次買斷）與 `CourseSubscription` model（訂閱期款，`payuni-recurring-billing` change 已完成）是兩條完全不同的付款路徑：`Order` 每筆對應一次真實交易，`CourseSubscription` 刻意不建立 `Order` 記錄（每期只更新 `paidPeriods`／`currentPeriodEnd`）。woomin 的 `Invoice.orderId` 是一對一綁 `Order` 的設計，因為 woomin 的訂閱「每期扣款各建一張 Order」——這個前提在 StartKiter 不成立，因此 `Invoice` 不能照抄 woomin 的單一 `orderId` 綁定方式，必須同時支援「綁 Order」與「綁訂閱期款」兩種來源。

`CourseSubscription` 已有 5 個發票偏好欄位（`invoiceType`／`invoiceCarrierType`／`invoiceCarrierId`／`invoiceTaxId`／`invoiceTitle`，`payuni-recurring-billing` change 預留），缺 `invoiceAddress`（公司三聯式地址）與 `invoiceLoveCode`（捐贈愛心碼），這次補齊；`Order` 完全沒有發票偏好欄位，這次一併新增。

## Goals / Non-Goals

**Goals:**

- 買家結帳時（一次買斷或訂閱）可選擇發票類型：B2C 二聯式（載具）／B2B 三聯式（統編抬頭）／捐贈
- 付款成功後（啟用電子發票且「自動開立」開啟時）自動觸發開票，涵蓋一次買斷 `Order` 與訂閱期款兩種來源
- `InvoiceProvider` 抽象讓 ECPay／ezPay 可切換，比照 `SubscriptionGateway` 同一模式，兩個都做成完整實作（不是留空 interface），因為 woomin 兩個都有現成代碼可抄，成本不高
- 訂單頁可對已開立發票「作廢」（同期間未跨月）或「開立折讓」（跨月或已對獎）
- 未啟用電子發票總開關時，所有既有付款流程行為與現在完全相同（純新增路徑，不影響既有行為）

**Non-Goals:**

- 不做財政部配號授權流程本身（Fish 自己在外部平台操作，非代碼範圍）
- 不做對帳報表匯出、跨月月結報表
- 不做海外零稅率的稽核邏輯，維持「系統上可逐筆決定要不要開」的簡單開關
- 不做超商代碼/ATM 等非課程情境發票
- 不做同時啟用多個加值中心的動態路由，後台一次只設定一個 provider
- 不做發票提醒/通知信（留給未來 Email 生命週期自動化模組）

## Decisions

### Decision: Invoice model 同時支援 Order 與訂閱期款兩種付款來源

`Invoice.orderId` 改為 nullable，新增 `Invoice.subscriptionId`（nullable）與 `Invoice.periodNumber`（nullable，Int），兩組欄位互斥：恰好其中一組非空（`orderId` 非空且 `subscriptionId`／`periodNumber` 皆空，或反之）。一次買斷付款成功時建立 `Invoice{orderId}`；訂閱每期扣款成功時依 PayUNi `PeriodOrderNo` 的實際期數建立 `Invoice{subscriptionId, periodNumber}`，並在 subscription advisory lock 內以該期數更新 `paidPeriods` 的最大值，確保亂序 webhook 不會把期數重新編號或重複開票（`@@unique([subscriptionId, periodNumber])`，`subscriptionId` 非空時生效）。

Alternatives Considered:
- 照抄 woomin 單一 `orderId` 綁定，訂閱扣款時額外建立一筆輕量 `Order` 記錄專門給發票用 → 否決：這違反 `payuni-recurring-billing` change 的既有決策「訂閱不建立 Order 記錄」（design.md 已記錄理由：避免 `Order.sku === MVP_SKU` 判斷邏輯被訂閱期款污染），為了發票功能推翻已驗證的決策不划算，且會讓 `Order` 表混雜兩種語意
- 新增一個獨立的 `SubscriptionPayment` 中間表記錄每期付款，`Invoice` 只綁這個中間表 → 否決：徒增一個表和一層間接，`CourseSubscription.paidPeriods` 已經是每期付款的權威計數，`periodNumber` 直接對應這個計數即可識別唯一一期，不需要額外持久化一筆「付款記錄」

### Decision: InvoiceProvider 抽象同時完整實作 ECPay 與 ezPay，不是留空 interface

`packages/payments/types.ts` 新增 `InvoiceProvider` interface（`issue`／`void`／`allowance` 三個方法），`packages/payments/provider/ecpay/invoice-provider.ts`、`packages/payments/provider/ezpay/invoice-provider.ts` 各自完整實作，都包裝 `@paid-tw/einvoice-ecpay`／`@paid-tw/einvoice-ezpay` 套件。跟 `subscription-billing` 那次「只留 interface、只做一家」不同，這次兩家都做，因為 woomin 兩家都有生產驗證過的完整代碼可以照抄（`provider.ts` 第 39-60 行已示範 `createInvoiceProvider` 如何依設定切換），額外成本只是多抄一份，不是從零設計。

Alternatives Considered:
- 只做 ECPay（官方文件建議首選），ezPay 留 interface 之後再補 → 否決：官方文件明講「PAYUNi 用戶建議搭配 ezPay」，StartKiter 唯一金流正是 PAYUNi，只做 ECPay 反而是搭配次選，兩家都做才不用之後回頭補
- 只做 ezPay（跟 PAYUNi 搭配的建議組合）→ 否決：woomin 兩家都验证过，只做一家會浪費另一家現成的代碼，且 Fish 未來換金流時 ECPay 選項可能更合用

### Decision: 開票運算邏輯照抄 buildIssueInput，不重新設計稅務計算

含稅/未稅拆分（`splitTaxInclusive`）、B2C 手機條碼/會員載具判斷、B2B 統編抬頭判斷、捐贈愛心碼、品項名稱字數限制（ECPay 500 字／ezPay 30 字）、買受人名稱字數限制（ezPay B2C 30／其餘 60）、ezPay 訂單編號 20 字限制（超長時雜湊截斷），全部照抄 `/Users/fishtv/Development/products/woomin/realms/lib/invoice/issue.ts` 的 `buildIssueInput`／`normalizeItemName`／`normalizeBuyerName`／`normalizeProviderOrderId`，這些是稅務與加值中心規格的正確性代碼，不是可以憑感覺重寫的地方。

Alternatives Considered:
- 只做最簡化的 B2C 二聯式，B2B／捐贈留給以後 → 否決：`buyer-extension-convention` 之類的既有規則沒有排除 B2B 買家，且官方文件把 B2C/B2B 判斷寫成結帳時的基本欄位（有沒有填統編），拆成兩次開發反而要重新過一次相同的欄位驗證邏輯
- 自己重新設計稅務計算，不依賴 woomin 現成邏輯 → 否決：稅額計算錯誤是合規風險，`buildIssueInput` 已經是生產環境驗證過的正確版本，重新設計只會引入新 bug

### Decision: 金鑰存放沿用既有 SiteSetting 加密表，新增 einvoice key

比照 `subscription-billing` change 的 `getPayUniSubscriptionGateway`／`readPayuniSettings` 模式，新增 `db.siteSetting.findUnique({ where: { id: "einvoice" } })`，用同一套 `SETTINGS_ENCRYPTION_KEY` AES-256-GCM 加解密機制存放 `provider`（`ecpay`／`ezpay`）、`merchantId`、`hashKey`、`hashIV`、`testMode`、`sellerName`、`sellerTaxId`、`autoIssueEnabled`、`einvoiceEnabled`。

Alternatives Considered:
- 用環境變數存放發票金鑰 → 否決：`config.yaml` 既定「金鑰填後台、env fallback」模式，且發票金鑰需要 Fish 自己在後台操作填入測試/正式金鑰、來回切換測試模式，環境變數不利於這種操作流程
- 新增一張獨立的 `EInvoiceSettings` model 而不是沿用 `SiteSetting` → 否決：`SiteSetting` 本來就是為這種「一筆設定、需要加密」的場景設計的通用 key-value 表，`payuni` key 已經驗證過這個模式可用，沒有理由為發票另開一張表

### Decision: 開票觸發邏輯抽成 gateway-agnostic 共用函式，不寫死在 PAYUNi 專屬 route 裡

`packages/api/modules/course/lib/invoice-events.ts` 新增 `triggerInvoiceForOrder(orderId: string)` 與 `triggerInvoiceForSubscriptionPeriod(subscriptionId: string, periodNumber: number)` 兩個共用函式，內部處理「讀取電子發票設定 → 判斷是否啟用/自動開立 → 組出 `buildIssueInput` → 呼叫 `InvoiceProvider.issue` → 寫入 `Invoice`」全流程。`apps/saas/app/api/payuni/notify/route.ts`／`apps/saas/app/api/payuni/period-notify/route.ts` 只需要在既有成功分支呼叫這兩個函式，不在 route 檔案內直接重複開票邏輯。StartKiter 的 v1 硬邊界目前只接通 PAYUNi 一家金流，但這兩個函式的參數（`orderId`／`subscriptionId`＋`periodNumber`）不含任何 PAYUNi 專屬概念，未來若有其他金流的付款成功 webhook（例如另一張處理多金流的 change），可以直接呼叫同一組函式，不需要重新設計或複製貼上開票邏輯到每個 gateway 各自的 route 裡。一次買斷付款 transaction 會一併建立 `Invoice{status: PENDING}` intent；`/api/cron/invoice-retry` 會以 bearer secret 重試超過冷卻時間的 `PENDING`／`FAILED` intent。

Alternatives Considered:
- 把開票邏輯直接寫在 `payuni/notify`／`payuni/period-notify` 兩個 route 檔案內部（如同這兩個 route 本來就有的付款狀態更新邏輯）→ 否決：這次 propose 過程中已確認未來會有處理其他金流（Shopline/Stripe）的獨立 change，若開票邏輯跟 PAYUNi 專屬 route 綁死，屆時每新增一個金流的 webhook route 都要重新複製一份開票判斷邏輯，任何一處未來修改（例如發票欄位邏輯調整）都要同步改多處，容易漏改
- 把觸發邏輯做成一個事件匯流排／pub-sub（付款成功時發一個事件，訂閱者各自決定要不要開票）→ 否決：超出 MVP 範圍的複雜度，目前只有「付款成功」這一種觸發時機，一個直接呼叫的共用函式已經足夠達到「不寫死在單一 gateway route」的目的，不需要引入額外的事件系統抽象

### Decision: 退款時自動作廢同月發票，跨月或已對獎則標記待人工處理

Fish 明確要求退款要自動處理發票，不是完全丟給操作員自己記得去點按鈕。`apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb`（既有退款流程，清除 `courseAccess`、寫入 `refundedAt`；`packages/payments/refund.ts` 是未使用的舊 memory-store 代碼，不是本次修改對象）之後，新增呼叫 `packages/api/modules/course/lib/invoice-events.ts` 的 `handleRefundInvoice(orderId)`：查詢該 `Order` 對應的 `Invoice`，若 `status === "ISSUED"` 且發票開立日仍在當前月份內，自動呼叫 `InvoiceProvider.void`，成功則 `Invoice.status = VOIDED`；若已跨月（`invoiceDate` 的月份早於退款當下月份）或作廢呼叫本身失敗，不強制自動開折讓（折讓金額與稅務認定需要人工判斷，`.docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md` 官方文件明講「退款牽涉到稅，認定上比較細，第一次處理直接問記帳士」），而是把 `Invoice.attentionReason` 設為 `"REFUND_NEEDS_ALLOWANCE"`，訂單頁與發票列表對這個狀態要顯示明顯的「退款但發票待處理」提示，操作員自己決定金額後手動點「開立折讓」。訂閱取消（`cancel-course-subscription` procedure）同理：取消成功後對該訂閱最近一筆 `ISSUED` 發票跑同一套 `handleRefundInvoice` 邏輯。所有外部發票作業先以 `*_IN_PROGRESS` marker 搶占，完成時條件式寫回；開票完成前若來源已退款／取消，會立即嘗試作廢，否則留下 `REFUND_NEEDS_ALLOWANCE` 待查。

Alternatives Considered:
- 跨月也自動開立全額折讓 → 否決：折讓金額不一定是全額（買家可能只退部分課程），且已對獎中獎的發票折讓有額外的加值中心流程要求，自動猜測金額風險高於效益，官方文件也建議這種情況交給人工判斷
- 完全不自動化，退款永遠只在訂單頁顯示按鈕讓操作員自己點 → 否決：Fish 明確要求退款要自動作廢，同月未跨月的情況技術上完全可以無腦判斷（沒有金額歧義、沒有稅務認定爭議），不自動做等於增加操作員每次退款都要多一步手動確認的負擔

## Implementation Contract

**Behavior:**
- 買家在結帳頁（一次買斷或訂閱）填寫發票偏好（B2C 載具／B2B 統編抬頭／捐贈愛心碼），資料存進 `Order` 或 `CourseSubscription` 的 `invoice*` 欄位
- 一次買斷付款成功（`payuni/notify`、Shopline notify 或 Stripe webhook）或訂閱期款成功（`payuni/period-notify`）時，若後台「啟用電子發票」與「付款成功後自動開立」皆開啟，先留下 `Invoice{status: PENDING}` operation intent，再於 transaction 外呼叫 `InvoiceProvider.issue`；成功更新為 `ISSUED`，失敗更新為 `FAILED`，不阻塞付款成功的其他既有流程，重送 webhook 或 `/api/cron/invoice-retry` stale job 可重試
- 操作員在訂單頁對已 `ISSUED` 的發票點「作廢」：同期間未跨月時允許，呼叫 `InvoiceProvider.void`，成功後 `Invoice.status = VOIDED`
- 操作員點「開立折讓」：填折讓金額（預設全額），呼叫 `InvoiceProvider.allowance`，成功後 `Invoice.status = ALLOWANCE`，`allowanceTotal` 累加

**Interface / data shape:**
- `InvoiceProvider`（`packages/payments/types.ts`）：
  ```ts
  interface InvoiceProvider {
    issue(input: BuildIssueParams): Promise<{ invoiceNumber: string; randomCode: string; invoiceDate: Date } | { failReason: string }>;
    void(params: { invoiceNumber: string; reason: string }): Promise<{ success: boolean; error?: string }>;
    allowance(params: { invoiceNumber: string; amount: number }): Promise<{ success: boolean; allowanceNumber?: string; error?: string }>;
  }
  ```
- `Invoice` model：見下方 DDL
- `POST /course/invoices/void`、`POST /course/invoices/allowance`（`operatorProcedure` 或對應既有 operator 權限層級）

**DB DDL:**
```sql
CREATE TABLE "invoice" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT UNIQUE REFERENCES "order"("id") ON DELETE CASCADE,
  "subscriptionId" TEXT REFERENCES "course_subscription"("id") ON DELETE CASCADE,
  "periodNumber" INTEGER,
  "provider" TEXT NOT NULL CHECK ("provider" IN ('ecpay', 'ezpay')),
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'ISSUED', 'FAILED', 'VOIDED', 'ALLOWANCE')),
  "invoiceNumber" TEXT,
  "randomCode" TEXT,
  "invoiceDate" TIMESTAMP,
  "amount" INTEGER NOT NULL,
  "allowanceTotal" INTEGER NOT NULL DEFAULT 0,
  "failReason" TEXT,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (
    ("orderId" IS NOT NULL AND "subscriptionId" IS NULL AND "periodNumber" IS NULL)
    OR ("orderId" IS NULL AND "subscriptionId" IS NOT NULL AND "periodNumber" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "invoice_subscription_period_key" ON "invoice"("subscriptionId", "periodNumber") WHERE "subscriptionId" IS NOT NULL;
CREATE INDEX "invoice_invoiceNumber_idx" ON "invoice"("invoiceNumber");
CREATE INDEX "invoice_status_idx" ON "invoice"("status");

ALTER TABLE "order" ADD COLUMN "invoiceType" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceCarrierType" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceCarrierId" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceTaxId" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceTitle" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceAddress" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceLoveCode" TEXT;

ALTER TABLE "course_subscription" ADD COLUMN "invoiceAddress" TEXT;
ALTER TABLE "course_subscription" ADD COLUMN "invoiceLoveCode" TEXT;
```

**Failure modes:**
- `InvoiceProvider.issue` 失敗（加值中心 API 錯誤、金鑰未設定）→ `Invoice{status: FAILED, failReason}`，付款本身視為成功（不因發票失敗而回滾付款），`/api/cron/invoice-retry` 或重送已完成 webhook 可重試
- 電子發票總開關未啟用 → 完全不建立 `Invoice` 記錄，付款流程行為跟現在一致
- 作廢已跨月的發票 → provider 回傳失敗，UI 顯示「已跨月，請改用折讓」
- 未設定發票金鑰時嘗試開票 → 視為 `FAILED`，不拋例外中斷付款 webhook 處理
- 發票仍有 `PENDING`／`FAILED` 或 operation marker 時 → 阻擋更換 provider／金鑰，避免 retry 使用錯誤的 provider snapshot；操作員只能在待查作業結束後修改設定

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test` 涵蓋：B2C 開票成功、B2B 開票成功、捐贈開票成功、訂閱期款開票成功且 `periodNumber` 唯一、重複期款不重複開票、作廢成功、跨月作廢被拒、折讓成功且 `allowanceTotal` 累加正確
- `pnpm type-check`／`pnpm build` 全綠
- `spectra validate subscriptions-invoice` 0 warnings

**Scope boundaries:**
- In scope：`Invoice` model；`Order`／`CourseSubscription` 發票欄位補齊；`InvoiceProvider` 抽象與 ECPay/ezPay 雙實作；後台發票設定頁；付款 webhook 觸發開票；訂單頁作廢/折讓操作
- Out of scope：財政部配號授權（業務流程）；對帳報表匯出；發票提醒信；`packages/payments/factory.ts`（一次性金流 factory）與 `SubscriptionGateway`（訂閱 gateway）不修改；`GhostGrantLog`／`OrbivoGrantLog` 對應的第三方會員平台整合不搬入

## Risks / Trade-offs

- [Risk] 訂閱期款 webhook 可能亂序或並行抵達 → Mitigation: 使用 PayUNi `PeriodOrderNo` 的實際期數，不再以讀取後的 `paidPeriods + 1` 猜期數；subscription advisory lock 內以最大期數更新 `paidPeriods`，`Invoice(subscriptionId, periodNumber)` 唯一鍵防止重複
- [Risk] 外部開票成功後本地更新可能中斷 → Mitigation: 先在付款 transaction 寫入 `PENDING` intent，外部 mutation 在 transaction 外執行；本地 finalize 失敗時保留可由 webhook replay 或 `/api/cron/invoice-retry` stale job 重試的 intent，不把遠端 mutation 包在會 rollback 的 DB transaction 內
- [Risk] 付款成功後來源在開票期間被退款／取消 → Mitigation: finalize 重新查核 Order／CourseSubscription 狀態；若來源已失效，先標記並立即作廢，失敗則保留 `REFUND_NEEDS_ALLOWANCE`
- [Risk] provider 設定在待辦重試前被替換 → Mitigation: 有 `PENDING`／`FAILED` 或 attention marker 時，設定頁拒絕 provider／金鑰／測試模式變更
- [Risk] 電子發票金鑰與 PAYUNi 金鑰共用同一個 `SETTINGS_ENCRYPTION_KEY` 解密機制，若該金鑰外洩會同時影響金流與發票憑證 → Mitigation: 沿用既有機制，不新增額外攻擊面，這是既有風險非本次引入
- [Risk] `Invoice` 的 CHECK 約束（`orderId`／`subscriptionId`+`periodNumber` 互斥）若應用層邏輯寫錯，可能同時傳兩組值導致 DB 拒絕寫入 → Mitigation: DB CHECK 約束本身就是最後一道防線，寫入邏輯出錯會直接在 insert 階段失敗，不會產生髒資料
- [Risk] 作廢/折讓涉及金額異動，若操作員誤按可能造成加值中心那邊真的送出作廢/折讓請求（不可逆） → Mitigation: UI 需二次確認對話框（已在 Non-Goals 外的既有 UI 慣例），且 provider 回應失敗時不變更本地 `Invoice.status`

## Migration Plan

1. 跑 Prisma migration 新增 `Invoice` model 與 `Order`／`CourseSubscription` 發票欄位（皆為新增，不影響既有資料）
2. 安裝 `@paid-tw/einvoice`／`@paid-tw/einvoice-ecpay`／`@paid-tw/einvoice-ezpay` 三個套件
3. 部署後台發票設定頁與 API procedures，此時電子發票總開關預設關閉，不影響現有付款流程
4. Fish 在後台填入 ECPay 或 ezPay 測試金鑰，開啟測試模式，跑一次測試開票確認串接正常
5. Fish 換上正式金鑰、關閉測試模式，開啟「啟用電子發票」總開關，正式上線

**Rollback**：關閉「啟用電子發票」總開關即可讓所有付款流程回到現在的行為（不建立 `Invoice` 記錄），不需要 revert migration；`Invoice` 表與新增欄位本身不影響既有 `Order`／`CourseSubscription` 查詢邏輯，可安全保留在 schema 中。
