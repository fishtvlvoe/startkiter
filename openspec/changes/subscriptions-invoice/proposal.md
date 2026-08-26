## Why

`openspec/config.yaml` 既定「發票不在 MVP；下一輪才接 `@paid-tw/einvoice*`」。Fish 的公司、工商憑證、字軌都已就位，可以直接做到正式上線開票，不用停在架構層。PAYUNi（現有唯一金流）本身不提供開發票 API，必須另外接電子發票加值中心（綠界 ECPay 或藍新 ezPay）才能讓買家拿到合法發票，這是「能收錢」跟「能合規開票」之間最後一塊缺口。

## What Changes

- 新增 `Invoice` model：可關聯一次買斷 `Order`（`orderId`，nullable）或訂閱期款（`subscriptionId` + `periodNumber`，皆 nullable），兩者互斥、恰好一個非空，狀態機 `PENDING → ISSUED / FAILED`，`ISSUED` 之後可轉 `VOIDED`（作廢）或 `ALLOWANCE`（折讓）
- 新增 `InvoiceProvider` 抽象（`packages/payments/types.ts`），比照 `SubscriptionGateway` 同一模式：定義 `issue`／`void`／`allowance` 方法簽名，`packages/payments/provider/ecpay/invoice-provider.ts` 與 `packages/payments/provider/ezpay/invoice-provider.ts` 各自實作，包裝 `@paid-tw/einvoice` + `@paid-tw/einvoice-ecpay` + `@paid-tw/einvoice-ezpay` 套件家族，運算邏輯（含稅/未稅拆分、B2C 手機條碼/會員載具、B2B 統編抬頭、捐贈愛心碼、品項字數限制）照抄已生產驗證的 `/Users/fishtv/Development/products/woomin/realms/lib/invoice/issue.ts` 的 `buildIssueInput`
- 新增電子發票設定頁（後台「金流收款 → 台灣統一發票」分頁）：發票供應商（ECPay/ezPay 二選一）、賣方名稱、賣方統編、測試模式、付款成功後自動開立開關、啟用電子發票總開關，金鑰用既有 `SiteSetting`（加密 key-value 表）存放，比照 `payuni` 設定的既有存放模式
- 給 `Order` model 新增發票偏好欄位（`invoiceType`／`invoiceCarrierType`／`invoiceCarrierId`／`invoiceTaxId`／`invoiceTitle`／`invoiceAddress`／`invoiceLoveCode`），結帳流程收集買家的發票類型選擇
- 給 `CourseSubscription` model 補齊缺的兩個發票欄位（`invoiceAddress`／`invoiceLoveCode`，其餘五個欄位已在 `payuni-recurring-billing` change 預留）
- 一次買斷付款成功 webhook（`apps/saas/app/api/payuni/notify/route.ts`）與訂閱首期/續期成功 webhook（`apps/saas/app/api/payuni/period-notify/route.ts`）在啟用電子發票且「付款成功後自動開立」開啟時，觸發 `InvoiceProvider.issue`
- 訂單頁新增「作廢發票」（`VOIDED`，限同期間未跨月）與「開立折讓」（`ALLOWANCE`，跨月或已對獎時使用）兩個操作按鈕，呼叫對應 provider 的 `void`／`allowance` 方法

**BREAKING**：無破壞性變更——既有 `Order`／`CourseSubscription` 既有欄位與既有 checkout／webhook 行為不變，本次為純新增欄位與新增觸發路徑；未啟用電子發票總開關時，所有既有流程行為與現在完全相同。

## Non-Goals

- 不做財政部配號授權流程本身——那是 Fish 要在「財政部電子發票整合服務平台」親自操作的業務流程（插工商憑證、取得字軌配號），不是代碼能完成的事，本次只確保後台設定填完、金鑰正確就能開票
- 不做對帳報表匯出（跨月發票對獎、月結報表），留給既有 `sheets-export-engine` capability 未來擴充
- 不做海外客戶零稅率的稽核邏輯，比照官方指引維持「系統上仍可逐筆決定要不要開、開哪一種」的簡單開關，複雜稽核留給 Fish 自己判斷
- 不做超商代碼／ATM 等非課程情境的發票（StartKiter 只有線上課程銷售）
- 不做多加值中心同時啟用（後台一次只能設定一個 provider，不做動態多 provider 路由）
- 不做行銷向的發票提醒/通知信（留給未來 Email 生命週期自動化模組）

## Capabilities

### New Capabilities

- `einvoice-issuance`：台灣電子發票開立、作廢、折讓，涵蓋一次買斷訂單與訂閱期款兩種付款來源

### Modified Capabilities

- `payuni-checkout`：一次買斷付款成功 webhook 新增電子發票觸發路徑
- `subscription-billing`：訂閱付款成功 webhook 新增電子發票觸發路徑，`CourseSubscription` 補齊發票欄位

## Impact

- Affected specs: `einvoice-issuance`（新增）、`payuni-checkout`（修改）、`subscription-billing`（修改）
- Affected code：
  - New:
    - `packages/payments/provider/ecpay/invoice-provider.ts`
    - `packages/payments/provider/ecpay/invoice-provider.test.ts`
    - `packages/payments/provider/ezpay/invoice-provider.ts`
    - `packages/payments/provider/ezpay/invoice-provider.test.ts`
    - `packages/payments/lib/invoice-issue-input.ts`
    - `packages/payments/lib/invoice-issue-input.test.ts`
    - `apps/saas/app/(authenticated)/(operator)/settings/einvoice/page.tsx`
    - `apps/saas/lib/invoice-settings.ts`
    - `packages/api/modules/course/lib/invoice-events.ts`
    - `packages/api/modules/course/lib/invoice-events.test.ts`
    - `packages/database/prisma/migrations/`（新增 `Invoice` model migration，新增 `Order`／`CourseSubscription` 發票欄位）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `apps/saas/app/api/payuni/notify/route.ts`
    - `apps/saas/app/api/payuni/period-notify/route.ts`
    - `apps/saas/app/(authenticated)/checkout/payuni/page.tsx`（結帳表單新增發票偏好欄位）
    - `apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx`（同上）
    - `apps/saas/app/(authenticated)/(account)/orders/page.tsx`（訂單頁新增作廢/折讓操作，若此頁不存在則新建）
  - Removed: 無
- Dependencies 新增：`@paid-tw/einvoice`、`@paid-tw/einvoice-ecpay`、`@paid-tw/einvoice-ezpay`
- 環境變數新增：無，金鑰走既有 `SiteSetting` 加密表，不用 env
