# subscriptions-invoice E2E 紀錄

日期：2026-08-26

執行工具：`ego-browser` skill，task space 14。所有登入、填表、第三方測試付款、訂單頁查看與作廢按鈕均由瀏覽器實際操作；沒有用讀程式碼推測結果。

## 一次買斷：公司發票 → ECPay Stage

1. 登入測試買家，在一次買斷結帳頁選擇公司發票，填入 ECPay Stage 官方測試統編與公司抬頭，送出結帳。
2. 以 PAYUNi sandbox 實際完成付款；返回 `/checkout-return` 後送出 signed/encrypted test notify。
3. operator 訂單頁實際看到 order `SK2026082672373a345df5` 為 `paid`，invoice provider 為 ECPay、狀態 `ISSUED`，發票號碼 `LA25027216`。
4. 畫面證據：`/tmp/startkiter-payuni-ecpay-issued.png`。

這筆一次買斷發票只作為一次買斷開票證據，沒有在本次訂閱發票作廢流程中操作或宣稱已作廢。

ECPay Stage 官方測試環境說明：[ECPay 電子發票測試文件](https://developers.ecpay.com.tw/24174/)。本紀錄只保存訂單／發票結果，不保存任何測試金鑰。

## 訂閱期款：PAYUNi → ECPay Invoice

1. 以獨立測試買家開啟 `E2E Monthly` 訂閱方案，在訂閱結帳頁選擇公司發票，填入統編 `53538851`、公司抬頭與地址後送出 PAYUNi sandbox checkout。
2. 結帳畫面證據：`/tmp/startkiter-subscription-checkout-company-invoice.png`；畫面實際顯示 PAYUNi 訂閱方案、公司三聯式、`E2E Monthly | TWD390` 與統編欄位。
3. 對同一筆訂閱送出 encrypted period success notify，第一期 `PeriodOrderNo` 為 `PERIOD-SUBMTA6M7IH32A3625267D8`；API 回 `{"message":"OK"}`。
4. operator 訂單頁的「訂閱期款發票」區塊實際看到 subscription invoice `LA25027239`、`ecpay · ISSUED`、NT$390。
5. 畫面證據：`/tmp/startkiter-subscription-ecpay-issued.png`。
6. DB 回讀確認 subscription `cmta6m7ih000mmbz78pvl8jh0` 為 `ACTIVE`、`paidPeriods = 1`，invoice `periodNumber = 1`、provider `ecpay`、`invoiceNumber = LA25027239`。

## 同一筆訂閱發票：ISSUED → VOIDED

1. 在 operator 訂單頁對同一筆訂閱發票 `LA25027239` 實際點擊「作廢發票」。
2. 在確認對話框點擊「確認作廢」。
3. 訂單頁的「訂閱期款發票」區塊實際看到 `LA25027239` 狀態由先前截圖的 `ISSUED` 變成 `VOIDED`。
4. DB 回讀同一筆 `subscriptionId + periodNumber`：`LA25027239|VOIDED|ecpay`。
5. 畫面證據：`/tmp/startkiter-subscription-ecpay-voided.png`。

這段作廢證據只指向訂閱發票 `LA25027239`；一次買斷發票 `LA25027216` 不在這個作廢流程內。

## 實際失敗後的修正紀錄

- 先前使用無效統編時 ECPay 正確拒絕，該筆資料沒有被當成成功證據。
- 先前使用過長付款人姓名時 provider 正確拒絕；改用符合 provider 長度限制的測試姓名後才完成付款。
- 上一版紀錄把訂閱發票號碼與一次買斷發票的作廢描述混在一起；本版改成以 `LA25027239` 的兩張前後截圖與 DB 回讀作為唯一作廢鏈。

## Verdict

task 11.3 的訂閱結帳、period webhook、ECPay Invoice 建立與同一張訂閱發票作廢均有畫面與 DB 證據。正式發票字軌與正式金鑰未操作。
