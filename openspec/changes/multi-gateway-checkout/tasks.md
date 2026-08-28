## 1. 紅燈測試（TDD，先寫測試不寫實作）

- [x] 1.1 為 `CheckoutGateway` interface 與 Shopline/Stripe 兩個實作寫紅燈測試，涵蓋 Requirement「Checkout calls gateways through a provider-agnostic CheckoutGateway interface」：(a) Shopline `createPaymentSession` 回傳 `{ type: "redirect", checkoutUrl }`；(b) Stripe `createPaymentSession` 回傳同樣格式；(c) 兩者 `processRefund` 呼叫成功回傳 `{ success: true }`。驗證目標：`pnpm --filter @startkiter/api test checkout-gateway.test.ts` FAIL（尚未實作）
- [x] 1.2 [P] 修改 `packages/payments/factory.test.ts`，把「rejects shopline and stripe for MVP checkout」斷言改為紅燈測試：(a) 設定啟用金流為 `shopline` 且提供 Shopline 金鑰時 `createMvpCheckoutGateway` 回傳 Shopline gateway 實例；(b) 設定為 `stripe` 同理；(c) 未設定啟用金流時 fallback 回既有 PAYUNi 行為維持不變。驗證目標：`pnpm --filter @startkiter/api test factory.test.ts` FAIL（尚未支援其他金流）
- [x] 1.3 [P] 為 Shopline／Stripe webhook route 寫紅燈測試，涵蓋 Requirement「Successful payments from any enabled gateway trigger the shared invoice hook」：(a) 簽章驗證成功且訂單標記為 paid 後，呼叫既有的 `triggerInvoiceForOrder`（可用 mock/spy 驗證呼叫一次且參數為對應 orderId）；(b) 簽章驗證失敗回 400，不呼叫該函式。驗證目標：`pnpm --filter @startkiter/saas test shopline-notify.test.ts`／`stripe-webhook.test.ts` FAIL
- [x] 1.4 [P] 為退款分派邏輯寫紅燈測試，涵蓋 Requirement「Refunds are dispatched to the order's originating gateway before being marked locally」：(a) `paymentGateway: "shopline"` 的訂單退款時呼叫 Shopline 退款 API 成功才標記 refunded；(b) 金流退款 API 呼叫失敗時訂單狀態維持不變、不標記 refunded。驗證目標：`pnpm --filter @startkiter/saas test refund-dispatch.test.ts` FAIL

## 2. CheckoutGateway 抽象與雙實作

- [x] 2.1 依 design.md Decision: CheckoutGateway 用 redirect/form_post 兩種型態統一介面，不用單一導向方式，在 `packages/payments/types.ts` 定義 `CheckoutGateway` interface，在 `packages/payments/provider/shopline/gateway.ts`／`packages/payments/provider/stripe/gateway.ts` 各自實作 `createPaymentSession`／`processRefund`，呼叫規格照抄 `/Users/fishtv/Development/products/woomin/realms/lib/payment/shopline-gateway.ts`／`stripe-gateway.ts`（先安裝 `stripe` 套件到 `packages/payments/package.json`）。驗證目標：task 1.1 全數轉綠燈

## 3. 金流切換 factory 與後台設定頁

- [x] 3.1 依 design.md Decision: 全站同一時間只有一家啟用金流，不做買家結帳頁自選，實現 Requirement「PAYUNi is the only MVP gateway」修改後的內容（PAYUNi/Shopline/Stripe 三選一、恰好一家生效）。三處同步修改：(a) 新增 `apps/saas/lib/checkout-gateway-settings.ts` 的 `loadEnabledGatewayCredentials()`，依 `SiteSetting{id: "checkout-gateway"}` 的 `enabledGateway` 讀取對應格式的憑證；(b) 修改 `packages/payments/factory.ts` 的 `createMvpCheckoutGateway(enabledGateway, credentials)` 簽章，依 `enabledGateway` 分派建立對應 `CheckoutGateway` 實例，不再是「非 payuni 就拋錯」；(c) 修改 `apps/saas/app/api/checkout/route.ts` 與 `packages/payments/checkout.ts`（現在寫死呼叫 `createMvpCheckoutGateway("payuni", credentials)`），改為呼叫 `loadEnabledGatewayCredentials()` 取得 `{ enabledGateway, credentials }` 再傳入 factory，不再寫死傳入 `"payuni"` 字串。新增 `apps/saas/app/(authenticated)/(operator)/settings/checkout-gateway/page.tsx` 後台設定頁（選擇啟用金流、對應金鑰欄位、測試模式）。驗證目標：task 1.2 全數轉綠燈

## 4. Webhook route 與發票共用函式串接

- [x] 4.1 **前置依賴檢查**：確認 `subscriptions-invoice` change 的 `packages/api/modules/course/lib/invoice-events.ts` 的 `triggerInvoiceForOrder` 已存在於代碼庫（若尚未 apply，此 task 標記為阻塞，等待該 change 完成後才繼續，不自行重新實作一份開票邏輯）。依 design.md Decision: 三家金流的付款成功 webhook 都呼叫既有的 triggerInvoiceForOrder 共用函式，新增 `apps/saas/app/api/shopline/notify/route.ts`／`apps/saas/app/api/stripe/webhook/route.ts`：驗簽 → 更新訂單狀態 → 呼叫 `triggerInvoiceForOrder(orderId)`。驗證目標：task 1.3 全數轉綠燈

## 5. 退款分派

- [x] 5.1 依 design.md Decision: 退款依 Order.paymentGateway 分派到對應金流的退款 API，修改 `apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb`：先依 `Order.paymentGateway` 呼叫對應 `CheckoutGateway` 的 `processRefund`，成功才繼續既有的資料庫狀態更新（`status: "refunded"`, `courseAccess: false`），失敗則保留原狀態並回傳錯誤；為 `PayUniOneTimeGateway` 新增 `processRefund` 方法（目前尚未實作，只有本地標記）。驗證目標：task 1.4 全數轉綠燈

## 6. Review 與回歸驗證

- [x] 6.1 grep `createMvpCheckoutGateway`／`Order.paymentGateway`／`markOrderRefundedInDb` 所有既有引用點，確認本次改動未破壞既有 PAYUNi 一次買斷流程與既有測試斷言。驗證目標：`pnpm --filter @startkiter/api test`／`pnpm --filter @startkiter/saas test` 既有測試（不含本次新增案例）全數維持綠燈，無回歸
- [x] 6.2 派 Codex 或等效工具對本次全部 diff（task 1-5）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `createMvpCheckoutGateway` 依 `enabledGateway` 分派到正確的 gateway 實作、security 確認 Shopline／Stripe 金鑰不會被記錄進任何 log、webhook 簽章驗證使用官方建議的比對方式（避免 timing attack）、未通過簽章驗證的請求不會觸發任何訂單狀態變更，performance 確認 webhook route 在驗簽失敗時提早 return，不做多餘的資料庫查詢。驗證方式：第六輪全新 context CR 報告 `Critical 0 / High 0 / Medium 0`、Verdict `PASS`（見 `code-review.md`）
- [x] 6.3 用 ego-browser skill 跑一次完整 e2e：在後台設定頁切換啟用金流為 Shopline（測試模式）→ 以測試帳號跑一次結帳流程 → 確認導向 Shopline 測試付款頁 → 模擬付款成功 webhook → 確認訂單頁顯示已付款、課程權限已授予 → 切換回 PAYUNi → 確認既有結帳流程不受影響；Stripe 同樣跑一次。驗證目標：截圖記錄關鍵畫面（後台設定切換、付款導向頁、訂單頁付款狀態），任何一步失敗即視為本 task 未完成。2026-08-28：Stripe sandbox account-specific credentials、`NT$8,800.00` hosted checkout、`checkout.session.completed` webhook `200`、order `SK202608289b3f7e56cfb9` paid／course access、ECPay invoice `LA25029687` 均通過；Shopline 成功路徑與 PAYUNi regression 沿用既有證據，non-3DS declined 截圖不列入證據。
- [x] 6.4 跑 `spectra analyze multi-gateway-checkout --json` 與 `spectra validate multi-gateway-checkout`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 6.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 與 Scope boundaries 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm --filter @startkiter/saas test`／`pnpm type-check`／`pnpm build`，確認全數綠燈；`git diff --stat` 核對改動檔案清單與 Scope boundaries 一致。驗證目標：所有指令 exit code 為 0

## 7. 需要 Fish 親自操作的部分（提前告知，不等最後）

- [x] 7.1 **需要 Fish 手動操作**：向 Shopline Payments 申請商戶帳號（Merchant ID／API Key／Client Key／Sign Key）與向 Stripe 申請帳號（Secret Key／Webhook Secret），這兩組帳號申請都是 Fish 要親自跟金流商互動的業務流程，Claude／Codex 無法代辦；申請完成前，這張 change 的 e2e 驗證（task 6.3）只能用 Shopline／Stripe 官方公開的測試模式帳號跑通串接邏輯，無法驗證正式收款。驗證目標：Fish 確認已取得至少一組正式或沙盒的 Shopline／Stripe 憑證，供後續填入後台測試。2026-08-28：Stripe sandbox account-specific `sk_test_`／`pk_test_` 已由 Fish 提供，Stripe CLI 產生的 `whsec_` 已補入本機 `apps/saas/.env` 並完成 credential gate。
