# 跨金流整合驗收矩陣

日期：2026-08-28

每一列都由 `ego-browser` 實際操作結帳與訂單頁；付款成功後的本地 webhook 使用對應測試模式的真實加密／簽章資料送到本地 endpoint。`PASS` 只代表付款與發票都達到要求；`FAIL` 代表付款成功但發票狀態實際失敗；`BLOCKED` 代表尚未能建立第三方付款交易。

| # | 一次性金流 | 發票金流 | 實際結果 | 訂單／發票證據 | 截圖 |
|---|---|---|---|---|---|
| 1 | PAYUNi sandbox | ECPay Stage | **PASS** | `SK2026082672373a345df5`：order `paid`；invoice `ISSUED`，`LA25027216` | `/tmp/startkiter-payuni-ecpay-issued.png` |
| 2 | PAYUNi sandbox | ezPay test | **FAIL** | `SK20260826734bb0ca4de6`：order `paid`；invoice `FAILED`；`取得商店申請資格失敗` | `/tmp/startkiter-payuni-ezpay-failed.png` |
| 3 | Shopline sandbox | ECPay Stage | **PASS** | `SK20260826de25f82e5433`：order `paid`；invoice `ISSUED`，`LA25027215` | `/tmp/startkiter-shopline-ecpay-issued.png` |
| 4 | Shopline sandbox | ezPay test | **FAIL** | `SK20260826f2aaad2c35db`：order `paid`；invoice `FAILED`；`取得商店申請資格失敗` | `/tmp/startkiter-shopline-ezpay-failed.png` |
| 5 | Stripe sandbox | ECPay Stage | **PASS** | `SK202608289b3f7e56cfb9`：order `paid`；invoice `ISSUED`，`LA25029687`；Stripe CLI `checkout.session.completed` webhook 回 `200` | `startkiter-stripe-settings.png`；`startkiter-stripe-checkout.png`；`startkiter-stripe-order-paid.png` |
| 6 | Stripe sandbox | ezPay test | **BLOCKED** | 本輪未執行 Stripe→ezPay；ezPay 測試商店資格仍不足，沒有可記錄的 ezPay invoice transaction | — |

## 結論

ezPay 與 Stripe/ECPay 不是同一條資格鏈；Stripe/ECPay 列已通過，但六組發票矩陣仍沒有全部通過，因此本輪不執行 `spectra archive`。實際結果已把「訂單已付款」與「發票成功」分開記錄，沒有把 ezPay 的 FAILED 或 Stripe/ezPay 的 BLOCKED 報成成功。

ezPay 兩列的共同阻塞是目前測試商店不具備公開測試商店申請資格；ECPay Stage 則實際開出測試發票並可在 operator 頁作廢。Stripe sandbox 已使用帳號專屬 test credentials 完成 hosted checkout 與 webhook；正式 Stripe 商戶收款仍未測。
