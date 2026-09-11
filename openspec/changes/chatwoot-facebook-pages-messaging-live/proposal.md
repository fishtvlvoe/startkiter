## Why

Chatwoot 已接上粉專「Fishtv余啟彰」且管理員測試私訊可進線，但 Meta App `opcos` 仍在開發模式，一般粉絲與第三方客戶自綁粉專無法穩定使用。現在要把 Messenger 通道推到可給路人與多客戶粉專使用的正式狀態，並把操作真相寫進 StartKiter support 文件。

## What Changes

- 新增 Meta App（opcos）Messenger／`pages_messaging` 正式可用所需的審核與上線前置：隱私權／服務條款公開 URL、App 設定對齊、Webhook／粉專訂閱維持有效
- 新增 Chatwoot Facebook 頻道「開發中 → 正式」驗收路徑：路人私訊可進線；文件說明多客戶各自綁定自己粉專的邊界
- 修改 `docs/support-runtime-topology.md`（與必要 AGENTS／runbook）：記錄 Meta App id、callback `https://support.startkiter.dev/bot`、開發／正式差異、測試帳號限制
- 視需要補齊 opcos.me 對外法律頁路由，供 Meta App Review 填寫（跨 repo，以可公開 HTTPS URL 為驗收）

## Non-Goals

- 不在本 change 啟用 StartKiter 產品站內 Chatwoot widget（產品客服通道仍預設 email）
- 不做 WhatsApp／TikTok／Instagram 正式審核
- 不保證 Meta 人工審核在本 change 時窗內核准；核准等待列為外部依賴，tasks 只做到「材料齊、已送審或可送審、本側可驗證」
- 不重做 Oracle Chatwoot 部署與防回收（已暫存 `oracle-chatwoot-anti-reclaim-cutover`）
- 不自動匯入 Facebook 歷史私訊

## Capabilities

### New Capabilities

- `chatwoot-facebook-messaging`: Chatwoot 透過 Meta App 接收／回覆 Facebook Page Messenger；涵蓋 App 模式、Webhook、粉專綁定與路人／多客戶邊界

### Modified Capabilities

- `support-runtime-topology`: 文件真相補上 Facebook Messenger 通道、Meta App 與 webhook callback

## Impact

- Affected specs: `chatwoot-facebook-messaging`（new）、`support-runtime-topology`（modified）
- Affected code:
  - New: `docs/chatwoot-facebook-messaging.md`（操作與驗收 runbook）
  - Modified: `docs/support-runtime-topology.md`、必要時 `AGENTS.md`
  - Cross-repo（opcos.me）: 對外 privacy／terms 公開頁若缺路由則補上，供 Meta 審核 URL
- Dependencies 新增: Meta App Review（`pages_messaging`）、商業驗證狀態（若 Meta 要求）
- 環境變數新增: 無新鍵名；沿用 Chatwoot `FB_APP_ID`／`FB_APP_SECRET`／`FB_VERIFY_TOKEN`（已在 Oracle `/opt/chatwoot`）
