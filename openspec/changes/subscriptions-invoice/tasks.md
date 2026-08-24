## 1. 紅燈測試（TDD，先寫測試不寫實作）

- [x] 1.1 為 `Invoice` model 寫查詢/約束測試，涵蓋 Requirement「Invoice records support both one-time orders and subscription period payments」：(a) 建立 `orderId` 非空、`subscriptionId`／`periodNumber` 皆空的記錄成功；(b) 建立 `subscriptionId`＋`periodNumber` 非空、`orderId` 空的記錄成功；(c) 同時給 `orderId` 與 `subscriptionId` 兩組都非空的記錄違反 CHECK 約束被拒絕；(d) 同一 `subscriptionId`＋`periodNumber` 建立第二筆記錄違反唯一鍵被拒絕。此時 schema 尚未新增，驗證目標：`pnpm --filter @startkiter/database type-check` FAIL（型別不存在）
- [x] 1.2 [P] 為 `packages/payments/lib/invoice-issue-input.ts` 的 `buildIssueInput` 寫紅燈測試案例，涵蓋 Requirement「Buyers select an invoice type at checkout for both one-time and subscription purchases」：(a) 個人未指定載具 → 預設會員載具；(b) 公司帶統編 → B2B 三聯式且 ezPay 品項金額為未稅、ECPay 為含稅；(c) 捐贈 → 帶愛心碼；(d) 品項名稱超過 provider 字數限制被截斷（ECPay 500／ezPay 30）。驗證目標：`pnpm --filter @startkiter/api test invoice-issue-input.test.ts` FAIL（函式尚未實作）
- [x] 1.3 [P] 為 `InvoiceProvider` 與 ECPay/ezPay 兩個實作寫三個紅燈測試案例，涵蓋 Requirement「Taiwan e-invoices are issued through a provider-agnostic InvoiceProvider」：(a) `issue` 成功回傳 `invoiceNumber`／`randomCode`／`invoiceDate`；(b) `void` 在同月呼叫成功；(c) `allowance` 呼叫成功並回傳折讓單號。驗證目標：`pnpm --filter @startkiter/api test invoice-provider.test.ts` FAIL（`InvoiceProvider` 尚未實作）
- [x] 1.4 [P] 為一次買斷付款 webhook（`apps/saas/app/api/payuni/notify/route.ts`）新增三個紅燈測試案例，涵蓋 Requirement「Electronic invoicing is off by default and does not alter existing payment flows」與 Requirement「Webhook marks a single order paid」新增的 Scenario：(a) 電子發票停用時付款成功不建立 `Invoice`，行為跟改動前一致；(b) 啟用＋自動開立時付款成功建立 `Invoice{orderId}`；(c) 開票呼叫失敗時訂單仍標記為 paid、courseAccess 仍為 true，`Invoice{status: FAILED}`。驗證目標：`pnpm --filter @startkiter/saas test notify.test.ts` FAIL
- [x] 1.5 [P] 為訂閱期款 webhook（`apps/saas/app/api/payuni/period-notify/route.ts`）新增兩個紅燈測試案例，涵蓋 Requirement「Subscription records reserve invoice fields without implementing invoicing」新增的 Scenario 與 Requirement「Invoice issuance failure does not block payment success」：(a) 啟用＋自動開立時期款成功建立 `Invoice{subscriptionId, periodNumber}`，`periodNumber` 對應遞增後的 `paidPeriods`；(b) 開票失敗時訂閱仍轉為 ACTIVE／`paidPeriods` 仍遞增，`Invoice{status: FAILED}`。驗證目標：`pnpm --filter @startkiter/saas test period-notify.test.ts` FAIL
- [x] 1.6 [P] 為作廢／折讓操作寫三個紅燈測試案例，涵蓋 Requirement「Issued invoices can be voided within the same billing period or credited with an allowance across periods」：(a) 同月作廢成功轉 `VOIDED`；(b) 跨月作廢被拒絕、狀態維持 `ISSUED`；(c) 折讓成功（同月或跨月皆可）轉 `ALLOWANCE` 且 `allowanceTotal` 正確累加，涵蓋範例表兩種折讓金額組合。驗證目標：`pnpm --filter @startkiter/api test invoice-operations.test.ts` FAIL

## 2. Database schema：Invoice model 與發票偏好欄位

- [x] 2.1 依 design.md Decision: Invoice model 同時支援 Order 與訂閱期款兩種付款來源，在 `packages/database/prisma/schema.prisma` 新增 `Invoice` model（含 CHECK 約束、`invoice_subscription_period_key` partial unique index），並新增 `Order`／`CourseSubscription` 的發票偏好欄位（`invoiceType`／`invoiceCarrierType`／`invoiceCarrierId`／`invoiceTaxId`／`invoiceTitle`／`invoiceAddress`／`invoiceLoveCode`，`CourseSubscription` 只需補齊缺的 `invoiceAddress`／`invoiceLoveCode` 兩個），產生對應 migration。驗證目標：`pnpm --filter @startkiter/database type-check` 通過，task 1.1 轉綠燈

## 3. 開票運算邏輯層

- [x] 3.1 依 design.md Decision: 開票運算邏輯照抄 buildIssueInput，不重新設計稅務計算，在 `packages/payments/lib/invoice-issue-input.ts` 實作 `buildIssueInput`／`normalizeItemName`／`normalizeBuyerName`／`normalizeProviderOrderId`，邏輯照抄 `/Users/fishtv/Development/products/woomin/realms/lib/invoice/issue.ts`。驗證目標：task 1.2 全數轉綠燈

## 4. InvoiceProvider 抽象與雙實作

- [x] 4.1 依 design.md Decision: InvoiceProvider 抽象同時完整實作 ECPay 與 ezPay，不是留空 interface，在 `packages/payments/types.ts` 定義 `InvoiceProvider` interface，在 `packages/payments/provider/ecpay/invoice-provider.ts` 與 `packages/payments/provider/ezpay/invoice-provider.ts` 各自實作 `issue`／`void`／`allowance`，包裝 `@paid-tw/einvoice`／`@paid-tw/einvoice-ecpay`／`@paid-tw/einvoice-ezpay`（先安裝這三個套件到 `packages/payments/package.json`），呼叫規格照抄 `/Users/fishtv/Development/products/woomin/realms/lib/invoice/provider.ts`。驗證目標：task 1.3 全數轉綠燈

## 5. 金鑰設定與後台頁面

- [x] 5.1 依 design.md Decision: 金鑰存放沿用既有 SiteSetting 加密表，新增 einvoice key，在 `apps/saas/lib/invoice-settings.ts` 新增 `getInvoiceProvider()`（讀取 `SiteSetting{id: "einvoice"}` 並依 `provider` 欄位建立對應 `InvoiceProvider` 實例）與 `getInvoiceSettings()`（回傳 `einvoiceEnabled`／`autoIssueEnabled`／`sellerName`／`sellerTaxId`／`testMode` 等非機密欄位供 UI 顯示），比照既有 `getPayUniSubscriptionGateway`／`readPayuniSettings` 模式；新增 `apps/saas/app/(authenticated)/(operator)/settings/einvoice/page.tsx` 後台設定頁（供應商選擇、賣方名稱、賣方統編、測試模式、自動開立開關、啟用電子發票總開關、金鑰輸入欄位留空即不變更）。驗證目標：`pnpm type-check` 通過，手動以假設定值驗證 `getInvoiceProvider()` 能依 `provider` 值切換回傳正確的 provider 實例

## 6. 一次買斷付款觸發開票

- [x] 6.1 依 design.md Decision: 開票觸發邏輯抽成 gateway-agnostic 共用函式，不寫死在 PAYUNi 專屬 route 裡，在 `packages/api/modules/course/lib/invoice-events.ts` 實作 `triggerInvoiceForOrder(orderId)`：讀取電子發票設定，若 `einvoiceEnabled && autoIssueEnabled`，呼叫 `getInvoiceProvider()` 的 `issue`，用訂單的發票偏好欄位與 `buildIssueInput` 組出開立輸入，成功建立 `Invoice{orderId, status: ISSUED}`，失敗建立 `Invoice{orderId, status: FAILED, failReason}`；修改 `apps/saas/app/api/payuni/notify/route.ts`，在既有 `markOrderPaid` 成功分支之後呼叫 `triggerInvoiceForOrder`，不在 route 檔案內重複開票判斷邏輯；開票呼叫本身失敗或拋錯不得影響既有 `markOrderPaid` 已完成的付款成功回應。驗證目標：task 1.4 全數轉綠燈

## 7. 訂閱期款觸發開票

- [x] 7.1 在 `packages/api/modules/course/lib/invoice-events.ts` 實作 `triggerInvoiceForSubscriptionPeriod(subscriptionId, periodNumber)`，邏輯同 `triggerInvoiceForOrder`；修改 `apps/saas/app/api/payuni/period-notify/route.ts`，在既有 `paidPeriods` 遞增與狀態更新的 transaction 之後，用遞增後的 `paidPeriods` 作為 `periodNumber` 呼叫 `triggerInvoiceForSubscriptionPeriod`；開票呼叫失敗不得影響既有訂閱狀態更新已完成的結果。驗證目標：task 1.5 全數轉綠燈

## 8. 結帳頁收集發票偏好

- [x] 8.1 修改 `apps/saas/app/(authenticated)/checkout/payuni/page.tsx` 與 `apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx`：新增發票類型選擇欄位（個人/公司/捐贈），公司類型時要求填統編才能送出，個人類型未指定載具時預設會員載具，資料隨結帳請求存入對應 `Order`／`CourseSubscription` 的 `invoice*` 欄位。驗證目標：涵蓋 Requirement「Buyers select an invoice type at checkout for both one-time and subscription purchases」的兩個 Scenario 均為綠燈

## 9. 訂單頁作廢與折讓操作

- [x] 9.1 新增 `voidInvoice`／`issueInvoiceAllowance` procedure（operator 權限層級），實作跨月判斷（作廢限同月，折讓不限）、呼叫對應 `InvoiceProvider` 的 `void`／`allowance`、更新 `Invoice.status`／`allowanceTotal`；在訂單頁新增「作廢發票」「開立折讓」操作入口，跨月時「作廢」按鈕停用並提示改用折讓。驗證目標：task 1.6 全數轉綠燈

## 10. 退款自動作廢發票

- [x] 10.1 依 design.md Decision: 退款時自動作廢同月發票，跨月或已對獎則標記待人工處理，先為 `apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb` 與訂閱取消流程新增紅燈測試：(a) 退款發生於發票開立當月 → 自動呼叫 `void` 並轉 `VOIDED`；(b) 退款發生於發票開立月份之後（跨月）→ 不自動作廢，`Invoice.attentionReason` 設為 `"REFUND_NEEDS_ALLOWANCE"`；(c) 取消訂閱時該訂閱最近一筆 `ISSUED` 發票同樣套用上述判斷。驗證目標：`pnpm --filter @startkiter/api test refund-invoice.test.ts` FAIL
- [x] 10.2 在 `packages/api/modules/course/lib/invoice-events.ts` 實作 `handleRefundInvoice(orderId)`，修改 `apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb` 既有退款流程（清除 `courseAccess`、寫入 `refundedAt`）之後呼叫此函式；修改 `cancel-course-subscription` procedure，取消成功後對該訂閱最近一筆 `ISSUED` 發票呼叫同一套邏輯；訂單頁與發票列表對 `attentionReason: "REFUND_NEEDS_ALLOWANCE"` 顯示明顯的「退款但發票待處理」提示。驗證目標：task 10.1 全數轉綠燈

## 11. Review 與回歸驗證

- [x] 11.1 grep `Order.sku`／`courseAccess`／`kitClaimEligible`／`CourseSubscription.paidPeriods` 所有既有引用點，確認本次新增的 `Invoice` model 與 webhook 觸發路徑未破壞既有一次買斷與訂閱期款的既有測試斷言。驗證目標：`pnpm --filter @startkiter/api test`／`pnpm --filter @startkiter/saas test` 既有測試（不含本次新增案例）全數維持綠燈，無回歸
- [x] 11.2 派 Codex 或等效工具對本次全部 diff（task 2-10）做 Code Review（correctness／security／performance 三角度）：correctness 確認 CHECK 約束與唯一鍵行為符合 task 1.1 案例、security 確認電子發票金鑰不會被記錄進任何 log、`SETTINGS_ENCRYPTION_KEY` 解密失敗時 fail-closed（視為未設定，不拋出可能洩漏金鑰片段的錯誤訊息）、未登入或非 operator 呼叫作廢/折讓操作皆被拒絕，performance 確認 `triggerInvoiceForOrder`／`triggerInvoiceForSubscriptionPeriod` 的開票呼叫不會阻塞 webhook 回應（webhook 需在 provider 逾時前完成既有付款成功回應）。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [ ] 11.3 用 ego-browser skill 跑一次完整 e2e：登入買家帳號 → 結帳（一次買斷）時選擇公司發票（填統編抬頭）→ 送出訂單 → 以測試金鑰模擬付款成功通知 → 確認訂單頁看到「已開立」發票狀態與正確的發票號碼格式 → 操作員在訂單頁對該筆發票點「作廢」成功 → 再跑一次訂閱結帳流程確認同樣能看到 `Invoice` 建立。驗證目標：截圖記錄每個關鍵畫面（結帳發票選擇、訂單頁發票狀態、作廢後狀態），過程中任何一步失敗即視為本 task 未完成
- [x] 11.4 跑 `spectra analyze subscriptions-invoice --json` 與 `spectra validate subscriptions-invoice`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 11.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 與 Scope boundaries 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm --filter @startkiter/saas test`／`pnpm type-check`／`pnpm build`，確認全數綠燈；`git diff --stat` 核對改動檔案清單與 Scope boundaries 一致，`packages/payments/factory.ts`／`packages/api/modules/course/lib/subscription-gateway.ts` 未被修改。驗證目標：所有指令 exit code 為 0

## 12. 需要 Fish 親自操作的部分（提前告知，不等最後）

- [ ] 12.1 **需要 Fish 手動操作**：在 ECPay 或 ezPay 後台申請正式串接金鑰（測試金鑰可由 task 11.3 的 e2e 驗證直接使用官方公開測試參數，不需要 Fish 介入），並在本次功能完成、測試模式驗證通過後，親自到後台「金流收款 → 台灣統一發票」填入正式金鑰、關閉測試模式、開啟「啟用電子發票」總開關——這一步涉及真實開票（會消耗字軌號碼），Claude／Codex 不會也不該代為操作正式環境切換。驗證目標：Fish 確認已完成後台正式金鑰設定並開啟總開關
