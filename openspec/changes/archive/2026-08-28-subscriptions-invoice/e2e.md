# subscriptions-invoice E2E 紀錄

紀錄日期：2026-08-26 至 2026-08-27

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

## 正式模式：ezPay 訂閱期款 → 正式開票 → 正式作廢（隔離 clone smoke test）

日期：2026-08-27。這次使用 Fish 明確授權的 ezPay 正式商家帳號，但只在由正式資料庫完整複製出的隔離 clone 執行。這是正式 API smoke test，不是正式部署／正式資料庫上線驗收；正式資料庫沒有切換供應商或寫入這筆測試訂閱。

1. 根目錄 `.env` 的 `EINVOICE_TEST_MODE` 已改為 `false`；operator 發票設定頁也已儲存 `provider=ezpay`、`testMode=false`、`autoIssueEnabled=true`、`einvoiceEnabled=true`。設定仍以加密 `SiteSetting{id="einvoice"}` 寫入隔離 clone。
2. 同一筆 PAYUNi 訂閱 `subscriptionId=cmtbd1lkv0001owz7vgi6mozb`、`gatewayTradeNo=SUBMTBD1LKU4F787B27F5A2`，送出 period 1 success webhook，API 回 `{"message":"OK"}`。
3. ezPay 正式 API 實際回傳發票 `DQ70632357`；operator 訂單頁的「訂閱期款發票」實際顯示 `ezpay · ISSUED`、`NT$390`。
4. 對同一張 `DQ70632357` 在 operator 訂單頁點擊「作廢發票」→「確認作廢」，ezPay 正式 API 回成功；同一頁實際顯示 `ezpay · VOIDED`、`NT$390`。
5. 以同一組正式 ezPay 憑證呼叫發票查詢 API 回讀，原始 `InvoiceStatus=2`；ezPay 技術手冊定義 `2` 為「已作廢」：[ezPay 電子發票技術串接手冊](https://inv.ezpay.com.tw/dw_files/info_api/ezPay_EZP_INVI_1_1_9.pdf)。repo 另以 regression test 鎖定 SDK 對字串／數字 `2` 都正規化為 `VOIDED`。
6. clone DB 回讀：`subscription=ACTIVE`、`paidPeriods=1`、`invoiceNumber=DQ70632357`、`periodNumber=1`、`provider=ezpay`、`status=VOIDED`、`amount=390`、`failReason=NULL`。

### 畫面裡實際看到

- `/tmp/startkiter-subscription-ezpay-issued.png`：後台「訂閱期款發票」、`DQ70632357`、`SUBMTBD1LKU4F787B27F5A2`、`ezpay · ISSUED`、`NT$390`、按鈕「作廢發票／開立折讓」。
- `/tmp/startkiter-subscription-ezpay-voided.png`：同一個後台區塊、同一張 `DQ70632357`、同一交易號、`ezpay · VOIDED`、`NT$390`。

## 實際失敗後的修正紀錄

- 先前使用無效統編時 ECPay 正確拒絕，該筆資料沒有被當成成功證據。
- 先前使用過長付款人姓名時 provider 正確拒絕；改用符合 provider 長度限制的測試姓名後才完成付款。
- 上一版紀錄把訂閱發票號碼與一次買斷發票的作廢描述混在一起；本版改成以 `LA25027239` 的兩張前後截圖與 DB 回讀作為唯一作廢鏈。

## Verdict

task 11.3 的訂閱結帳、period webhook、ECPay Invoice 建立與同一張訂閱發票作廢均有畫面與 DB 證據；另補有 ezPay 正式模式在隔離 clone 的開立、正式查詢回讀與同一張發票作廢 smoke test。正式部署／正式資料庫驗收不在本次證據範圍，正式資料庫未被切換。
