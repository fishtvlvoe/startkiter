## Why

`platform-shell-plugin-architecture` 定義了買家如何用 AI 工具擴充自己的代碼、透過 git-push-auto-deploy 上線，但沒有回答「買家的部署最終落在哪台機器、誰付這筆錢、出問題誰負責」。2026-08-18 老闆與 Claude Code 花了一整天對焦，逆推出一個會撞牆的問題：如果 StartKiter 自己出錢租 VPS 給每個買家用，買家只付一次課程費、StartKiter 卻要每個月一直繳主機費，這筆帳打不平，等於用一次性收入養訂閱制成本。

這張 change 定案三層客群模型與對應的主機/費用/支援架構，解決「小白友善」與「StartKiter 不被拖垮」這兩個目標同時成立的方式。

## What Changes

- **新增**：三層客群分流——(1) 自行部署（有工程師，拿代碼自己架，StartKiter 不管）、(2) 我們推薦流程（小白主力客群，見下）、(3) 高階玩家（拿代碼自己改，不歸 StartKiter 管）
- **新增**：Tier 2 主機模式——買家自己租一台 VPS（自己付錢、自己開帳號），把 SSH 存取權交給 StartKiter 一次，StartKiter 把這台機器接進**唯一一個** Coolify 帳號（一個控制台管理多台買家的機器，如同一支遙控器控制多台電視）
- **新增**：第三方帳號代管政策——買家自己申請的 Email 串接、金流帳號、自訂網域授權碼，一律由買家直接透過 AI 對話介面提供，StartKiter 公司人員全程不經手、不查看這些憑證
- **新增**：買家自訂網域綁定——買家把自己的網域轉去 Cloudflare 管理，產生一組僅限「編輯 DNS」的 scoped API token 交給 AI 系統，AI 自動完成綁定，不需要 Cloudflare for SaaS 這類額外付費產品
- **新增**：買家可見的簡化部署狀態面板——買家登入 StartKiter 自己的平台看到「網站是否正常／網址／上次更新時間」，不會看到、也碰不到 Coolify 操作介面本身

## Non-Goals

- 不讓買家登入 Coolify 本身，即使只是唯讀——Coolify 目前沒有安全的專案級別（per-project）權限隔離機制（已查證：[coollabsio/coolify#6894](https://github.com/coollabsio/coolify/issues/6894) 顯示這個功能仍在規劃中），貿然開放有誤動到其他買家資源的風險
- 不由 StartKiter 代為申請或代管買家的 Email／金流／網域帳號——這些帳號的所有權與帳單責任永遠在買家自己身上
- v1 不自動化「買家去 VPS 供應商租機器」這個步驟本身——當作教學內容的一部分，買家跟著教學手動完成，不是技術障礙
- 不變動 Tier 1（自行部署）與 Tier 3（高階玩家）既有的交付方式——這兩層維持現況：純代碼 + README 的 Zeabur 一鍵部署按鈕
- 不在這張 change 內處理 Zeabur 相關的任何整合——今天討論中考慮過用 StartKiter 自己持有的 Zeabur 帳號取代 Coolify，但驗證後發現 Zeabur 的黑盒容器（無 SSH/root）、按服務計費（無法像 VPS 一樣一台機器切多份攤成本）等限制不適合這個用途，維持 Coolify + 買家自租 VPS 的方向
- 不處理 Coolify Cloud 帳號本身的存取權交接——那是既有的維運待辦（見 `docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md`）

## Capabilities

### New Capabilities

- `managed-hosting-tiers`: 三層客群模型定義，各層的交付邊界與 StartKiter 的責任範圍
- `coolify-fleet-management`: StartKiter 唯一 Coolify 控制台如何集中管理多台買家自租 VPS 的機制與成本模型
- `buyer-credential-handoff`: 買家自己的第三方帳號憑證（Email／金流／自訂網域）交給 AI 自動串接、StartKiter 人員不經手的政策邊界與技術實作
- `buyer-status-panel`: 買家在 StartKiter 平台內看到的簡化部署狀態面板規格

## Impact

- Affected specs: `managed-hosting-tiers`、`coolify-fleet-management`、`buyer-credential-handoff`、`buyer-status-panel`（皆新增）
- Affected code:
  - New: `apps/saas/app/(authenticated)/(main)/(account)/deployment/`（買家狀態面板頁面）、`packages/platform/src/deployment/`（Coolify API 串接、憑證交換型別）
  - Dependencies 新增：Coolify API client（多伺服器管理）、Cloudflare API client（DNS token 驗證與 apex proxying）
  - 環境變數新增：`COOLIFY_API_TOKEN`（StartKiter 唯一控制台的 API 存取金鑰，僅後端使用，絕不下發給前端或買家）
- Affected docs: `docs/deploy-and-public-url.md` 需補上 Tier 2 主機/費用模型章節
- 需要 Fish 裁決的外部事項（不在這張 change 範圍內）：VPS 供應商是否官方推薦 Vultr（東京／新加坡機房）、Coolify per-server 費用是否反映進課程定價
