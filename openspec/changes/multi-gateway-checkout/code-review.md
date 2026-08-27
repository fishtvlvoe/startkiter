# multi-gateway-checkout Code Review

日期：2026-08-27

## Review scope

逐檔檢查本 change 的 working tree diff 與直接相依程式碼，涵蓋 `CheckoutGateway`、factory、PAYUNi／Shopline／Stripe gateway、退款分派、Shopline notify、Stripe webhook raw body／簽章／時間窗／訂單綁定、加密 `SiteSetting`、fail-closed、共用 invoice hook 與非同步開票。

## Finding history

- 原 M-1：Shopline notify 未強制 currency，已改為與訂單幣別嚴格相等並補 route test。
- 原 M-2：Shopline refund 未送官方要求的 amount/currency 且未檢查 response status，已補 minor-unit amount、currency、reason、timeout 與成功狀態檢查。
- 第五輪全新 context CR 另發現 Shopline checkout 使用元單位、webhook 卻按 minor unit 驗證；已修成結帳傳 `amount * 100`，notify 僅接受 `order.amount * 100`，並補 8800 錯誤單位拒絕測試。
- 第六輪全新 context CR（`/tmp/startkiter-independent-cr-sixth.txt`）只讀檢查修正後 diff，最終結果：`Critical 0 / High 0 / Medium 0`，Verdict `PASS`。

## Final checks

### Correctness

- factory 只依 `payuni`／`shopline`／`stripe` 建立 provider，結帳金額與 SKU 仍由 server 目錄決定。
- Shopline webhook 先驗 HMAC-SHA256、5 分鐘 timestamp window、`timingSafeEqual`，再查 DB；gateway、minor-unit amount 與 currency 都嚴格綁定。
- Stripe webhook 將 raw body 與 `stripe-signature` 交給 Stripe SDK 驗證，只接受已付款 Checkout Session，並綁定 metadata orderNo、PaymentIntent、amount、currency、gateway。
- `pending` 狀態更新保護付款競態；重複通知不重複觸發開票。退款外部成功後才更新本地 refunded，PAYUNi 不確定結果不假裝成功。

### Security and performance

- Shopline 簽章先驗長度再使用 `timingSafeEqual`；錯誤簽章與過期 timestamp 不會查 DB 或變更訂單。
- Stripe 不自行重建 payload 驗簽；金鑰存 encrypted `SiteSetting`，未設定／解密失敗視為未設定。
- webhook 成功後以 response 後工作觸發 invoice／welcome email；Shopline API 有 15 秒 timeout。
- CR 檢查修改檔案與報告，沒有保存 API key、token、密碼或 webhook secret。

## Writable verification

- API：`48 files / 209 tests` 全數通過；payments：`17 files / 76 tests` 全數通過；SaaS：`39 files / 195 tests` 全數通過。
- API、payments、database、SaaS type-check 全數 exit 0；SaaS 與 marketing production build 全數 exit 0。
- `spectra validate multi-gateway-checkout` valid；`spectra analyze` 只有既有 Suggestion，沒有 Warning／Error。
- 第六輪 CR 的 focused test 未以 CR sandbox 宣稱通過，因唯讀 sandbox 建立 system temp `ssr` 遭 `EPERM`；上列測試是本 session 在可寫環境獨立實跑的結果。

## E2E boundary

- `multi-gateway-checkout` 目前 `12/14`：task 6.3 的 Shopline／Stripe 完整 browser checkout 與 task 7.1 的 account-specific credentials 仍未完成。
- 現有 `startkiter-shopline-non3d-declined.png` 是表單畫面，不能當 declined 結果證據；本報告不宣稱 Shopline non-3DS declined E2E 已完成。
- Stripe 真實沙盒 checkout 受缺少 account-specific credentials 阻塞；這是環境驗收狀態，不是第六輪 CR finding。

## Verdict

第六輪全新 context CR：`Critical 0 / High 0 / Medium 0`，`PASS`。程式碼層 finding 已關閉；未完成的 2 項是缺第三方帳號／憑證造成的真實 E2E 阻塞，因此不 archive。
