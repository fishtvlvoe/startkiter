## Why

Chatwoot 上 Fishtv 粉專的 Facebook channel token `data_access_expires_at` 停在 2020（已過期未更新），Meta 要求完成「資料存取權限更新（data access renewal assessment）」評估，未完成前 App 無法切到 Live 模式。這是 `chatwoot-facebook-pages-messaging-live` SR 剩下 Task 3.2（Live + 路人進線驗收）的直接阻擋，該 SR 已 park 等這張解阻擋。

## What Changes

- 粉專管理員在 Chatwoot 走互動式 OAuth 重新連接 Facebook channel，取得新的 page access token
- 在 Meta Developer Console 完成「資料存取權限更新（data access renewal assessment）」評估流程
- 修復 `pages_messaging` 審核表單「允許的使用方式」選粉專＋同意勾選儲存不穩的問題，確保能成功按下「提交檢閱」
- 指派一個真實 Facebook 帳號作為 Meta App Review 的「測試人員」角色（Meta 明確禁止使用 App 內建測試用戶審查）
- 更新 `docs/chatwoot-facebook-messaging.md` 與 `openspec/changes/chatwoot-facebook-pages-messaging-live/assets/app-review-status.md`（該檔案在 park 狀態下由 spectra 內部保管，透過 unpark 後更新）記錄本輪完成的存取更新與審核狀態

## Non-Goals

- 不新建 Meta App（帳號已達 15-app 上限，沿用既有 `opcos` App id `2578433362383415`）
- 不做 `chatwoot-facebook-pages-messaging-live` SR 本身 Task 3.2（Live 切換＋非角色路人進線驗收）——本張只解除阻擋，驗收留在原 SR unpark 後執行
- 不動 LINE／Google OAuth／Email 客服通道（各自獨立 SR）
- 不做 WhatsApp／Instagram／TikTok 相關審核
- 不啟用產品站 Chatwoot widget

## Capabilities

### New Capabilities

- `chatwoot-facebook-access-renewal`: Facebook page channel 的 token 資料存取有效期維護與 Meta App Review 送審完成度追蹤

### Modified Capabilities

(none)

## Impact

- Affected specs: `chatwoot-facebook-access-renewal`（新增）
- Affected code:
  - Modified: `docs/chatwoot-facebook-messaging.md`
  - New: `openspec/changes/chatwoot-data-access-renewal-and-oauth/assets/data-access-renewal-status.md`（記錄本輪評估與 OAuth 重連結果）
- Dependencies 新增：無
- 環境變數新增：無
