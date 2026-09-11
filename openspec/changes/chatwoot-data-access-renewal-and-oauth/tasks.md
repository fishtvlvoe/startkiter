## 1. Facebook Page Channel Token 重新授權

- [x] 1.1 完成 Fishtv page channel 互動式 OAuth 重連，交付 Requirement「Facebook page channel token maintains a valid data access window」：Chatwoot 該 channel 的 `data_access_expires_at` 更新為晚於執行當下。驗證：Chatwoot channel 設定頁或 rails console 查詢 `Channel::FacebookPage.find_by(page_id: "660594740619142")` 經 Graph API debug_token 驗證 `data_access_expires_at=1796894838`（2026-12-10 09:27:18 UTC），晚於今天。詳細證據見 `assets/data-access-renewal-status.md`。

## 2. Meta 資料存取權限更新評估

- [x] 2.1 在 Meta Developer Console 完成 opcos App 的 Requirement「Meta data access renewal assessment reaches a completed state」評估流程：完成後 App 不再顯示資料存取阻擋 Live 切換的提示。驗證：Meta Developer Console App 設定頁確認提示已消失，將結果記入 `assets/data-access-renewal-status.md`。2026-09-11 由 Agy（ego-browser）完成 4 關評估表單，狀態轉「檢閱中」，證據見同名檔案。

## 3. pages_messaging 審核表單修復與送審

- [ ] 3.1 修復「允許的使用方式」表單選粉專＋同意勾選儲存不穩問題，交付 Requirement「pages_messaging allowed-usage form completes and reaches submission」的持久化行為：重新整理表單後仍顯示 Fishtv 已選取，Requests 區塊全部完成。驗證：重新載入表單頁面，手動確認 Fishtv page 選取狀態與 Requests 完成度，記錄於 `assets/data-access-renewal-status.md`。
- [ ] 3.2 按下「提交檢閱」完成 pages_messaging 送審，交付同一 Requirement「pages_messaging allowed-usage form completes and reaches submission」的送出行為：Meta 接受提交且不再回報 incomplete-requests 錯誤。驗證：Meta Developer Console 顯示 submission 狀態轉為審查中，記錄新的 submission id 於 `assets/data-access-renewal-status.md`。

## 4. 真實測試人員指派

- [ ] 4.1 在 opcos App Roles 新增一個真實 Facebook 帳號為 Tester 角色，交付 Requirement「Real Facebook tester account assigned for App Review」：Meta 接受該帳號為審查用測試人員而非 App 內建測試用戶。驗證：App Roles 頁面顯示該帳號角色為 Tester，將角色設定完成狀態（不含個資）記錄於 `assets/data-access-renewal-status.md`。

## 5. 收尾與文件同步

- [ ] 5.1 更新 `docs/chatwoot-facebook-messaging.md` 反映本輪 token 更新與審核狀態，交付文件與實際狀態一致的行為。驗證：`rg -n "data_access_expires_at|Tester|提交檢閱" docs/chatwoot-facebook-messaging.md` 命中對應段落且時間戳記更新為本輪日期。
- [ ] 5.2 Review：執行 `spectra analyze chatwoot-data-access-renewal-and-oauth --json` 確認 change 內部一致性，交付無 Critical／Consistency Warning 的驗證通過行為。驗證：指令輸出不含 Critical 等級 finding。
