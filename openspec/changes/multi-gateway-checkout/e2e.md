# multi-gateway-checkout E2E 紀錄

日期：2026-08-28

執行工具：`ego-browser` skill，實際操作 localhost 管理頁、結帳頁、第三方 sandbox 頁與訂單頁。沒有用 Playwright、Puppeteer 或其他瀏覽器工具。

## Shopline sandbox

1. 由 operator 後台選擇 Shopline，使用既有 sandbox 設定，儲存後確認設定頁顯示 Shopline 已設定。
2. 由登入買家實際開啟結帳，瀏覽器被導向 Shopline sandbox hosted checkout。
3. 既有 non-3DS declined 檔案實際只是填卡表單，不能當拒絕結果證據；本輪不再宣稱該情境已完成：
   - `startkiter-shopline-non3d-declined.png`
4. 既有 sandbox `VirtualAccount` 成功路徑已實際完成，signed webhook 回 `{"ok":true}`；operator 訂單頁確認 order `SK20260826de25f82e5433` 為 `paid`、課程權限已授予、ECPay invoice 為 `ISSUED`／`LA25027215`：
   - `startkiter-shopline-ecpay-issued.png`

Shopline sandbox 的官方流程與測試資源：[Shopline 沙盒環境資源](https://docs.shoplinepayments.com/overview/sandboxResource/)、[串接流程](https://docs.shoplinepayments.com/guide/guideOverview)。

## PAYUNi regression

實際切回 PAYUNi 後，以 ego-browser 完成一次性 sandbox checkout，瀏覽器回到 `/checkout-return`；用測試加密通知使 order `SK2026082672373a345df5` 變成 `paid`，並確認 ECPay invoice `LA25027216` 為 `ISSUED`。

- `/tmp/startkiter-payuni-ecpay-issued.png`
- PAYUNi return route 的實際回歸曾落到不存在的 `/checkout/result`；已改成 `/checkout-return`，並以 route test 2/2 複驗。

## Stripe sandbox credential gate

1. 以 `fish.myfb@gmail.com` 的 Stripe sandbox account-specific `sk_test_`／`pk_test_` 設定在 `apps/saas/.env`；Stripe CLI `listen` 產生的 `whsec_` 已寫入同一檔案，值未寫入本紀錄。
2. operator 後台選擇 Stripe，儲存後 URL 實際為 `admin/settings/checkout-gateway?saved=1`；畫面顯示目前金流 `stripe`、Stripe `已設定`、`設定已儲存`：
   - `startkiter-stripe-settings.png`
3. 首次建立 Checkout 時發現 hosted page 顯示 `NT$88.00`，尚未輸入卡號；因此中止該 session。修正 Stripe TWD 金額轉為最小單位後，重新建立 hosted Checkout，畫面實際顯示 `沙箱`、`StartKiter MVP`、`NT$8,800.00`：
   - `startkiter-stripe-checkout.png`
4. 使用 Stripe sandbox Visa `4242 4242 4242 4242`、到期 `12/34`、CVC `123` 完成付款。Stripe CLI 收到 `checkout.session.completed` event `evt_1U9DOGDpFlP7Qx6kutSn05qm`，轉送本地 webhook 回 `200`。
5. operator 訂單頁實際顯示 order `SK202608289b3f7e56cfb9` 為 `paid`、`NT$8,800`、發票 `ISSUED`，發票 `LA25029687`／`ecpay`：
   - `startkiter-stripe-order-paid.png`
6. 資料庫查證同一 order：`paid|stripe|8800|TWD|courseAccess=t|kitClaimEligible=t|pi_3U9DOFDpFlP7Qx6k02nSVMuY`；Invoice：`ecpay|ISSUED|LA25029687|8800`。

這次驗收同時修正 Stripe checkout 與 webhook 的 TWD 最小單位：訂單金額維持 `8800` TWD，Stripe Checkout／webhook 比對使用 `880000`。Stripe 的 Checkout API 參數契約可參見 [Stripe Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions/create)。付款是 sandbox，不是正式收款驗收。

## E2E verdict

- Shopline：既有 sandbox checkout、signed webhook、paid order 與 invoice hook 均有成功證據；non-3DS declined 檔案不列入證據。
- PAYUNi：既有切回後 sandbox checkout 與 paid order 回歸通過。
- Stripe：account-specific sandbox credentials、hosted checkout、paid webhook、paid order、課程權限與 ECPay invoice 均通過。
- `multi-gateway-checkout` tasks：`14/14`；ezPay 的獨立資格阻塞仍保留在 integration matrix，不冒充 Stripe 或完整發票矩陣通過。
- 正式 Stripe 商戶收款未測；本輪只驗證 sandbox credential gate。
