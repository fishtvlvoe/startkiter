# subscriptions-invoice E2E 紀錄

日期：2026-08-26

執行工具：`ego-browser` skill，task space 10。所有登入、填表、第三方測試付款、訂單頁查看與作廢按鈕均由瀏覽器實際操作；沒有用讀程式碼推測結果。

## 一次買斷：公司發票 → ECPay Stage

1. 登入測試買家，在一次買斷結帳頁選擇公司發票，填入 ECPay Stage 官方測試統編與公司抬頭，送出結帳。
2. 以 PAYUNi sandbox 實際完成付款；返回 `/checkout-return` 後送出 signed/encrypted test notify。
3. operator 訂單頁實際看到 order `SK2026082672373a345df5` 為 `paid`，invoice provider 為 ECPay、狀態 `ISSUED`，發票號碼 `LA25027216`。
4. 畫面證據：`/tmp/startkiter-payuni-ecpay-issued.png`。

ECPay Stage 官方測試環境說明：[ECPay 電子發票測試文件](https://developers.ecpay.com.tw/24174/)。本紀錄只保存訂單／發票結果，不保存任何測試金鑰。

## 作廢發票

1. 在同一筆訂單頁由 operator 實際點擊「作廢發票」。
2. 在確認對話框點擊「確認作廢」。
3. 訂單頁實際看到 invoice 狀態由 `ISSUED` 變成 `VOIDED`。
4. 畫面證據：`/tmp/startkiter-subscription-ecpay-voided.png`。

## 訂閱期款 → Invoice

1. 由同一個測試買家實際開啟 `E2E Monthly` 訂閱方案，填公司發票資料並送出 PAYUNi sandbox checkout。
2. 送出對應的 encrypted period success notify，`PeriodOrderNo` 使用第一期編號；API 回 `{"message":"OK"}`。
3. DB 與 operator 頁確認 subscription 變成 `ACTIVE`、`paidPeriods = 1`，並建立 Invoice：provider ECPay、狀態 `ISSUED`、period number 1、發票號碼 `LA25027218`。
4. 畫面證據：`/tmp/startkiter-subscription-ecpay-issued.png`。

## 實際失敗後的修正紀錄

- 先前使用無效統編時 ECPay 正確拒絕，該筆測試資料已清理；沒有把拒絕當成功。
- 先前使用過長付款人姓名時 provider 正確拒絕；改用符合 provider 長度限制的測試姓名後才完成付款。

## Verdict

task 11.3 的買家結帳、公司發票、實際付款通知、`Invoice` 建立、operator 作廢、訂閱期款 Invoice 建立全部有畫面與 DB 證據，已更新 tasks.md。正式發票字軌與正式金鑰未操作。
