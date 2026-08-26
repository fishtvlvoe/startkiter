# multi-gateway-checkout Code Review

日期：2026-08-26

## Review scope

逐檔檢查本 change 的 working tree diff 與直接相依程式碼，涵蓋 correctness、security、performance：

- `CheckoutGateway`、factory、PAYUNi／Shopline／Stripe gateway 與退款分派。
- Shopline notify、Stripe webhook 的 raw body、簽章、時間窗、訂單 gateway／金額／幣別綁定、重複通知。
- 加密 `SiteSetting`、fail-closed、共用 `triggerInvoiceForOrder`、非同步開票與資料庫唯一鍵。

Codex 唯讀代理已實際被派到 main 工作樹，但因背景掃描反覆中斷，沒有產出可引用的終稿；安全 TAC connector 也回報未連線。以下是本 session 依相同檢查範圍完成的逐檔唯讀 CR，沒有修改或提交代理產物。

## Finding history

### M-1 — closed before final review

- 檔案：`apps/saas/app/api/shopline/notify/route.ts:80`
- 觸發：簽章正確、金額正確，但 webhook 沒有帶 currency。
- 影響：原條件式只在 currency 有值且不相等時拒絕，缺幣別的通知仍可能把訂單標成已付款。
- 修法：改成 `currency !== order.currency.toUpperCase()` 必須嚴格相等，並加入缺 currency 的 route test。
- 複驗：`route.test.ts` 3/3 passed。

### M-2 — closed before final review

- 檔案：`packages/payments/provider/shopline/gateway.ts:104-124`
- 觸發：Shopline refund API 回 HTTP 200，但原實作未送官方要求的 amount/currency，也未檢查 response.status。
- 影響：業務退款失敗可能被當成成功，接著本地撤銷課程權限；退款請求也不符合官方 API 電文。
- 修法：送 `amount.value = order.amount * 100`、order currency 與 reason；只有 response `status === "SUCCEEDED"` 才回傳 success；補 15 秒 API timeout、refund body/status test。
- 複驗：`checkout-gateway.test.ts` 4/4 passed；官方規格要求退款 body 的金額幣別，並以 200 回應中的 `status` 判斷退款狀態，參見 [Shopline 建立退款交易](https://docs.shoplinepayments.com/api/trade/refund/)。

## Final checks

### Correctness

- factory 只依 `payuni`／`shopline`／`stripe` 建立對應 provider，結帳金額與 SKU 仍由 server 目錄決定。
- Shopline webhook：讀 raw body 後先驗 HMAC-SHA256、5 分鐘 timestamp window、`timingSafeEqual`，再查 DB；成功路徑嚴格綁定 gateway、amount、currency。
- Stripe webhook：將 raw body 與 `stripe-signature` 交給 Stripe SDK 驗證，只接受已付款 Checkout Session，嚴格綁定 metadata orderNo、PaymentIntent、amount、currency、gateway。
- `updateMany(... status: "pending")` 保護付款競態；重複通知在訂單已 paid 時只回成功，不重複觸發開票。
- 退款均先呼叫外部 gateway，成功後才更新本地 refunded；PAYUNi 明確回報需要人工處理，不假裝已完成。

### Security

- Shopline 簽章比對長度先驗證，再用 `timingSafeEqual`；過期 timestamp 與錯誤簽章都在讀訂單前拒絕。
- Stripe 不自行 parse/重建 payload 後驗簽，直接使用 SDK 的 raw body 驗簽。
- 金鑰存 encrypted `SiteSetting`，未設定或解密失敗視為未設定；設定頁未把 secret 回填到 HTML，錯誤回傳只含固定錯誤碼。
- `rg` 掃描 modified source 與報告，沒有發現 API key、token、密碼或 webhook secret 被寫入 log／報告。

### Performance

- webhook 在簽章失敗時不查 DB；付款成功後用 `scheduleAfterResponse` 執行 invoice／welcome email。
- Shopline API 新增 15 秒 abort timeout，避免外部服務無限佔住 checkout／refund request。
- 退款金額與 gateway trade ID 由已查出的 Order 帶入，不新增不必要的 provider 查詢。

## Verdict

Final CR counts：Critical 0、High 0、Medium 0、Low 0。

`M-1`、`M-2` 已在最終複驗前關閉。CR 本身通過；Stripe 真實沙盒 checkout 仍受缺少 account-specific test credentials 阻塞，這是環境驗收狀態，不是 CR finding。
