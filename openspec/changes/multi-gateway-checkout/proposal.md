## Why

`openspec/config.yaml` 既定「主金流 PAYUNi；Shopline／Stripe 介面可留空位但不接線、不上課、不出現在結帳」，`openspec/specs/payuni-checkout/spec.md` 明文「PAYUNi is the only MVP gateway」。Fish 決定要把這條硬邊界正式打開：像 woomin 一樣支援多家金流（PAYUNi／Shopline／Stripe），後台可切換要啟用哪一家，服務不同客群（台灣本地信用卡走 PAYUNi，海外客群走 Stripe，或未來其他考量），不再是「PAYUNi 是唯一選項」。`Order.paymentGateway` 欄位（`String @default("payuni")`）早就是通用字串型別，這次是把預留的空間真正填上實作。

## What Changes

- 新增 `CheckoutGateway` 抽象（`packages/payments/types.ts`），比照 `SubscriptionGateway`／`InvoiceProvider` 同一模式：`createPaymentSession` 回傳 `{ type: "redirect", checkoutUrl } | { type: "form_post", formData }` 兩種型態，`cancelSubscription`／退款相關方法各自視金流特性延伸
- 新增 `packages/payments/provider/shopline/gateway.ts`、`packages/payments/provider/stripe/gateway.ts` 完整實作，比照已生產驗證的 `/Users/fishtv/Development/products/woomin/realms/lib/payment/shopline-gateway.ts`／`stripe-gateway.ts`／`types.ts`
- 修改 `packages/payments/factory.ts` 的 `createMvpCheckoutGateway`：從「寫死只認 `payuni` 字串、其餘拋錯」改為依 `SiteSetting{id: "checkout-gateway"}` 設定的啟用金流（`payuni`／`shopline`／`stripe`）建立對應 `CheckoutGateway` 實例，全站同一時間只有一家生效（比照 woomin 單一啟用金流模式，不是買家結帳時自選）
- 新增 `apps/saas/app/api/shopline/notify/route.ts`、`apps/saas/app/api/stripe/webhook/route.ts`：驗簽、更新訂單狀態，成功後呼叫 `subscriptions-invoice` change 已定義的共用函式 `triggerInvoiceForOrder(orderId)`（gateway-agnostic，不需要為每個金流重寫開票判斷）
- 新增後台金流設定頁分頁：選擇啟用金流（PAYUNi／Shopline／Stripe）、對應金鑰欄位、測試模式，沿用既有 `SiteSetting` 加密表模式
- 修改 `openspec/config.yaml` 的 v1 硬邊界與 `openspec/specs/payuni-checkout/spec.md` 的核心 Requirement「PAYUNi is the only MVP gateway」——這條規則本次正式作廢，改為「後台可切換啟用的金流，PAYUNi／Shopline／Stripe 三選一」

**BREAKING**：`openspec/specs/payuni-checkout/spec.md` 的「PAYUNi is the only MVP gateway」Requirement 內容整條改變（見 MODIFIED Requirements）；`packages/payments/factory.test.ts` 現有「rejects shopline and stripe」斷言需要改為「accepts when configured」，這是刻意的行為反轉，不是回歸。未設定啟用金流或設定的金流缺金鑰時，行為維持 `payuni-checkout` 既有的 fail-closed 慣例（503，不是 500）。

## Non-Goals

- 不做買家結帳頁「自選金流」的 UI（全站同一時間只有一家生效，是後台設定不是買家選項）
- 不做多家金流同時收款的分潤/對帳邏輯
- 不做 Shopline／Stripe 各自的「折讓」與電子發票整合（電子發票沿用 `subscriptions-invoice` change 已定義的 gateway-agnostic 共用函式，不重寫）。**完整退款本身在 scope 內**：這次要延伸 `apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb`，依 `Order.paymentGateway` 各自呼叫 Shopline／Stripe 官方退款 API 才標記已退款（見 Impact 的 Modified 清單），這是既有退款流程只更新本地狀態不通知金流的功能缺口，必須補上，不是額外範圍
- 不做訂閱制的多金流（`SubscriptionGateway` 目前只有 PAYUNi 一家，這次不擴充訂閱路徑，只擴充一次買斷 checkout 路徑）
- 不做 Shopline 電商生態系整合（商品目錄同步、物流等），只做收款這一件事

## Capabilities

### New Capabilities

- `multi-gateway-checkout`：一次買斷付款支援 PAYUNi／Shopline／Stripe 三家可切換的金流

### Modified Capabilities

- `payuni-checkout`：「PAYUNi is the only MVP gateway」Requirement 整條改變為多金流可切換

## Impact

- Affected specs: `multi-gateway-checkout`（新增）、`payuni-checkout`（修改）
- Affected code：
  - New:
    - `packages/payments/provider/shopline/gateway.ts`
    - `packages/payments/provider/shopline/gateway.test.ts`
    - `packages/payments/provider/stripe/gateway.ts`
    - `packages/payments/provider/stripe/gateway.test.ts`
    - `apps/saas/app/api/shopline/notify/route.ts`
    - `apps/saas/app/api/shopline/notify/route.test.ts`
    - `apps/saas/app/api/stripe/webhook/route.ts`
    - `apps/saas/app/api/stripe/webhook/route.test.ts`
    - `apps/saas/app/(authenticated)/(operator)/settings/checkout-gateway/page.tsx`
    - `apps/saas/lib/checkout-gateway-settings.ts`
  - Modified:
    - `packages/payments/factory.ts`
    - `packages/payments/factory.test.ts`
    - `packages/payments/types.ts`
    - `apps/saas/app/api/checkout/route.ts`（依設定選擇 gateway，不再寫死傳入 `"payuni"` 字串）
    - `packages/payments/checkout.ts`（現在寫死呼叫 `createMvpCheckoutGateway("payuni", credentials)`，改為接收 `enabledGateway` 參數）
    - `apps/saas/lib/orders.ts`（`markOrderRefundedInDb` 依 `Order.paymentGateway` 呼叫對應金流的退款 API；`packages/payments/refund.ts` 是未使用的舊 memory-store 代碼，不在本次修改範圍）
    - `openspec/config.yaml`
  - Removed: 無
- Dependencies 新增：`stripe`（官方 SDK）；Shopline 走 REST API + 自行實作簽章，不需額外套件
- 環境變數新增：無，金鑰走既有 `SiteSetting` 加密表
