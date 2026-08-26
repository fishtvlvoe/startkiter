# multi-gateway-checkout E2E 紀錄

日期：2026-08-26

執行工具：`ego-browser` skill，`useOrCreateTaskSpace('startkiter-e2e-repair')`（task space 14），實際操作 localhost 管理頁、結帳頁、第三方 sandbox 頁與訂單頁。沒有用 Playwright、Puppeteer 或其他瀏覽器工具。

## Shopline sandbox

1. 由 operator 後台選擇 Shopline，填入官方 sandbox 測試設定，儲存後確認設定頁顯示 Shopline 已設定。
2. 由登入買家實際開啟結帳，瀏覽器被導向 Shopline sandbox hosted checkout。
3. 以官方 sandbox Visa test card 測試 NT$8,800；依官方測試規則，偶數金額的非 3DS 卡片會被拒絕。這次確實按下付款，收銀台實際顯示「您的付款被銀行拒絕，請換其他銀行卡或切換其他付款方式重試。」：
   - `/tmp/startkiter-shopline-non3d-declined.png`
4. 這張截圖同時可看到 Shopline hosted checkout、商品合計 `NT$8800`、已填測試卡欄位、條款勾選，以及拒絕訊息；不是尚未送出的結帳表單。
5. 切換 sandbox 的 `VirtualAccount` 測試付款方式並將交易狀態設為 `SUCCEEDED`，瀏覽器回到本地 checkout return。
6. 用瀏覽器 fetch 送出以 raw body 計算的 signed webhook，API 回 `{"ok":true}`；回到 operator 訂單頁確認 order `SK20260826de25f82e5433` 為 `paid`、課程權限已授予、ECPay invoice 為 `ISSUED`／`LA25027215`。
   - `/tmp/startkiter-shopline-ecpay-issued.png`

Shopline sandbox 的官方流程與測試資源：[Shopline 沙盒環境資源](https://docs.shoplinepayments.com/overview/sandboxResource/)、[串接流程](https://docs.shoplinepayments.com/guide/guideOverview)。

## PAYUNi regression

實際切回 PAYUNi 後，以 ego-browser 完成一次性 sandbox checkout，瀏覽器回到 `/checkout-return`；用測試加密通知使 order `SK2026082672373a345df5` 變成 `paid`，並確認 ECPay invoice `LA25027216` 為 `ISSUED`。

- `/tmp/startkiter-payuni-ecpay-issued.png`
- PAYUNi return route 的實際回歸曾落到不存在的 `/checkout/result`；已改成 `/checkout-return`，並以 route test 2/2 複驗。

## Stripe test mode

1. 由 operator 後台實際選擇 Stripe。
2. 未提供 account-specific Stripe test Secret Key 與 Webhook Signing Secret 時提交設定。
3. 頁面實際導向 `?error=incomplete_stripe_settings`，頁面顯示 `Stripe：未設定` 與 `儲存失敗：incomplete_stripe_settings`。
   - `/tmp/startkiter-stripe-unconfigured.png`

此結果確認未設定 Stripe 時會 fail-closed；沒有偽造 Stripe Checkout 成功，也沒有把不屬於本帳號的測試憑證寫入設定。Stripe 的 Checkout API 參數契約可參見 [Stripe Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions/create)。

## E2E verdict

- Shopline：實際 sandbox checkout、signed webhook、paid order 與 invoice hook 均通過。
- PAYUNi：切回後實際 sandbox checkout 與 paid order 回歸通過。
- Stripe：fail-closed 實測通過；完整第三方付款流程 BLOCKED，原因是缺少 Stripe 帳號專屬測試憑證。
- 正式商戶收款未測，因本輪明確不申請／切換正式帳號。
