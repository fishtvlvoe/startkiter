## 1. 優惠券建立與停用

- [ ] 1.1 [P] 先寫會失敗的 `packages/coupons` 測試，覆蓋 Requirement `Operator can create one coupon` 的成功、重複代碼、空白代碼、percent 0 與 101，以及 Requirement `Operator can deactivate a coupon without deleting it` 的不存在代碼。驗證是這些測試在函式未匯出時失敗。對應設計決策「優惠券建立與停用放在 coupons 套件，只有營運人員能呼叫」。
- [ ] 1.2 實作 `createCoupon` 與 `deactivateCoupon`，代碼 trim 後轉大寫，重複代碼不覆寫，停用只把 active 設為 false。完成時 1.1 的測試通過。[after: 1.1]
- [ ] 1.3 先寫會失敗的 HTTP 與頁面測試：非營運人員 POST `/api/coupons` 得 403，重複代碼得 409，講師頁面不渲染建立表單，percent 券顯示百分比。對應 Requirement `Instructor used-coupon list stays scoped`。驗證是測試在路由與表單不存在時失敗。[after: 1.2]
- [ ] 1.4 接上建立與停用路由，並只對營運人員渲染表單，講師列表查詢維持原範圍。完成時 1.3 的測試通過。[after: 1.3]

## 2. 組合包與優惠券報表

- [ ] 2.1 [P] 先寫會失敗的路由測試：未登入呼叫 `GET /api/export/bundles` 與 `GET /api/export/coupons` 得 401，無 `admin.access` 得 403，有權限且無資料得 200 與 xlsx 內容類型。對應 Requirement `Admin can download the bundle spreadsheet` 與 `Admin can download the coupon spreadsheet`。驗證是路由尚未存在時測試失敗。對應設計決策「兩種新報表沿用訂單匯出的權限與回應形狀」。
- [ ] 2.2 實作兩支匯出路由與管理頁下載按鈕，空資料仍回 200。完成時 2.1 的測試通過。優惠券頁的按鈕接在建立表單之後，避免同時改同一頁。[after: 2.1] [after: 1.4]

## 3. 營運人員發送站內通知

- [ ] 3.1 [P] 先寫會失敗的測試：非營運人員 403、使用者不存在 404、站內偏好關閉時 HTTP 200 且不插入、允許時 HTTP 201 且類型為 APP_UPDATE、標題 121 字 400。對應 Requirement `Operator can send one APP_UPDATE notification to an existing user`。驗證是程序未存在時測試失敗。對應設計決策「後台只發送 APP_UPDATE，不改建立函式」。
- [ ] 3.2 實作發送程序與後台表單，呼叫既有 `createNotification`，不改它的簽名，也不改 `createWelcomeNotification`。完成時 3.1 的測試通過。[after: 3.1]

## 4. 審查

- [ ] 4.1 審查 behavior、interface / data shape、failure modes、acceptance criteria、scope boundaries：非營運人員不能建券或發通知、無 `admin.access` 不能下載兩份報表，且範圍停在這三個入口。驗證方式是重跑 1.1、1.3、2.1、3.1 對應的測試檔，全數通過，並確認 `createWelcomeNotification` 的呼叫參數仍是 WELCOME。[after: 1.4] [after: 2.2] [after: 3.2]
