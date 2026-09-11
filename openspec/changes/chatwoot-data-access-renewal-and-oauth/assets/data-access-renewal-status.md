# Meta Data Access Renewal Assessment Status

## 2026-09-11 執行紀錄

### 1. 資料存取權限更新 (Data Access Renewal)
- **執行工具**：`ego-browser`
- **對象 App**：`opcos`（編號 `2578433362383415`）
- **網址**：`https://developers.facebook.com/apps/data-access-renewal/overview/?app_id=2578433362383415`
- **填寫結果**：
  1. **商家連結**：維持既有驗證商家資產管理組合「費雪資訊坊（已驗證）」。
  2. **允許的使用方式**：確認保留 `pages_show_list` 權限，勾選保證遵循條款。
  3. **資料處理**：
     - 法定實體名稱：核流有限公司
     - 所在國家／地區：台灣
     - 外部平台資料處理者：否
     - 因應國安要求提供用戶個資：否
     - 公共機構要求處理程序：勾選合法性審查、質疑準備、最少資料政策、紀錄要求。
  4. **審查人員指示**：
     - 隱私政策：`https://startkiter.dev/zh-tw/legal/privacy-policy`（HTTP 200）。
     - 應用程式網址：`https://opcos.me`。
     - 存取指示：OPCOS 平台簡介與粉專管理用途。
     - 平台 Facebook 登入整合：否。
- **提交結果**：
  - 狀態轉為「**檢閱中**」。
  - 官方提示：「感謝提交。大多數的提交內容都會在 10 天內檢閱。目前無須採取動作。」
  - 阻擋 Live 的過期提示已解除，進入 Meta 審查佇列。

### 2. Facebook Page Channel OAuth 重新授權 (Task 1.1)
- **執行工具**：`ego-browser` + Chatwoot UI + Rails runner
- **對象 Channel**：`Channel::FacebookPage` (ID: 1, Account: 2, Page ID: `660594740619142`, Fishtv余啟彰)
- **環境設定修正**：
  1. Meta Developer Console App 基本資料（Settings Basic）：新增應用程式網域 `startkiter.dev`，持久化儲存成功。
  2. Meta 商家專用 Facebook 登入（Business Login Settings）：開啟「使用 JavaScript SDK 登入」(`js_sdk_usage=true`)，並將 `https://support.startkiter.dev/` 同步加入「JavaScript SDK 允許的網域」與「有效的 OAuth 重新導向 URI」，持久化儲存成功。
  3. Chatwoot `InstallationConfig`：確認 `DISABLE_META_INBOX_CREATION` 設為 `false`。
- **OAuth 重連操作**：
  1. 透過 Rails runner 觸發 `Channel::FacebookPage.find_by(page_id: "660594740619142").prompt_reauthorization!`。
  2. 於 Chatwoot 收件匣設定頁（`/app/accounts/2/settings/inboxes/3`）點擊「點此重新連線。」。
  3. 在跳出的 Meta 登入互動式同意視窗（`auth_type=reauthorize`）完成授權（勾選存取所有粉專與權限、點擊「儲存」與「繼續」）。
  4. 回調完成後，Chatwoot 斷線橫幅消失，`reauthorization_required` 自動恢復為 `false`。
- **Token 健康驗證（Graph API debug_token 查詢）**：
  - 查詢時間：`2026-09-11 09:27:19 UTC`
  - **Page Token**：
    - `is_valid`：`true`
    - `expires_at`：`0`（永久長效）
    - `data_access_expires_at`：`1796894838`（**2026-12-10 09:27:18 UTC**，晚於執行當下 90 天）
  - **User Token**：
    - `is_valid`：`true`
    - `expires_at`：`0`（永久長效）
    - `data_access_expires_at`：`1796894838`（**2026-12-10 09:27:18 UTC**，晚於執行當下 90 天）
  - **結論**：Task 1.1 驗證通過，`data_access_expires_at` 已從 2020 成功更新為 2026-12-10。

