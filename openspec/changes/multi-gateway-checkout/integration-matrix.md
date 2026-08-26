# 跨金流整合驗收矩陣

日期：2026-08-26

每一列都由 `ego-browser` 實際操作結帳與訂單頁；付款成功後的本地 webhook 使用對應測試模式的真實加密／簽章資料送到本地 endpoint。`PASS` 只代表付款與發票都達到要求；`FAIL` 代表付款成功但發票狀態實際失敗；`BLOCKED` 代表尚未能建立第三方付款交易。

| # | 一次性金流 | 發票金流 | 實際結果 | 訂單／發票證據 | 截圖 |
|---|---|---|---|---|---|
| 1 | PAYUNi sandbox | ECPay Stage | **PASS** | `SK2026082672373a345df5`：order `paid`；invoice `ISSUED`，`LA25027216` | `/tmp/startkiter-payuni-ecpay-issued.png` |
| 2 | PAYUNi sandbox | ezPay test | **FAIL** | `SK20260826734bb0ca4de6`：order `paid`；invoice `FAILED`；`取得商店申請資格失敗` | `/tmp/startkiter-payuni-ezpay-failed.png` |
| 3 | Shopline sandbox | ECPay Stage | **PASS** | `SK20260826de25f82e5433`：order `paid`；invoice `ISSUED`，`LA25027215` | `/tmp/startkiter-shopline-ecpay-issued.png` |
| 4 | Shopline sandbox | ezPay test | **FAIL** | `SK20260826f2aaad2c35db`：order `paid`；invoice `FAILED`；`取得商店申請資格失敗` | `/tmp/startkiter-shopline-ezpay-failed.png` |
| 5 | Stripe test | ECPay Stage | **BLOCKED** | operator UI 實際回 `error=incomplete_stripe_settings`；沒有建立 order | `/tmp/startkiter-stripe-unconfigured.png` |
| 6 | Stripe test | ezPay test | **BLOCKED** | 同上；沒有建立 order | `/tmp/startkiter-stripe-unconfigured.png` |

## 結論

六組沒有全部通過，因此本輪不執行 `spectra archive`。實際結果已把「訂單已付款」與「發票成功」分開記錄，沒有把 ezPay 的 FAILED 或 Stripe 的 BLOCKED 報成成功。

ezPay 兩列的共同阻塞是目前測試商店不具備公開測試商店申請資格；ECPay Stage 則實際開出測試發票並可在 operator 頁作廢。Stripe test mode 仍需要一組 Stripe 帳號專屬的 test Secret Key 與 Webhook Signing Secret，正式 Stripe 商戶帳號／正式金鑰不是本輪必需，但測試帳號憑證不可由公開資料代替。
