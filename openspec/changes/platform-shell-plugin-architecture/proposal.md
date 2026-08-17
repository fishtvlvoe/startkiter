## Why

後台目前有兩套並存的版面系統（AppShell 與 SiteNav），`/agent`、`/admin/settings` 落在 SiteNav 那一側，導致從側邊欄點過去會整個換掉版面，使用者感覺跳系統。同時產品要從「賣一次性代碼包」進化成「客戶能用 AI 生成服務、以 Plugin 形式安裝」的平台，現有架構沒有可供 Plugin 掛載的機制，也沒有清楚定義哪些能力固定屬於 Core、哪些開放給客戶自建，導致下一步要往平台化發展時無法可循。

## What Changes

- 新增：統一後台 Shell,涵蓋 `/app`、`/course`、`/agent`、`/admin/settings` 四個已登入頁面,取代 `/agent`、`/admin/settings` 目前使用的 SiteNav
- 修改：語系切換移入側邊欄使用者區塊,深色模式維持在頂欄
- 修改：電腦版側邊欄收合維持現有「縮成純圖示」機制;新增手機版底部 tab bar,常駐 3 個核心功能 + 1 個「更多」抽屜收納其餘項目
- 新增：Core 掛載點機制,涵蓋路由、資料表、選單、前台區塊四種掛載方式,前台區塊支援 shortcode／block／auto 三種模式（使用者手動放置／視覺化編輯器放置／自動注入)
- 新增：Plugin manifest 格式,宣告掛載位置、資料規格類型（內容型走共用內容表、交易型走專屬 migration 建表)、所需權限
- 新增：Marketplace 頁面,列出可安裝的 Plugin,是掛載點機制的展示與安裝介面,不是獨立系統
- 新增：MCP Gateway,提供固定 MCP server endpoint,授權外部 AI 工具（Claude、IDE、其他 agent）透過 OAuth 式流程連線操作帳號,並可查看／撤銷現有連線
- 新增：Core 邊界聲明——金流／購物車、Email／LINE 通知、頁面編輯系統、課程引擎固定內建於 Core,不開放 Plugin 替換;客戶可自行修改核心代碼,StartKiter 不限制也不提供保護,官方引導路徑僅支援 Plugin 機制
- 新增：課程內容作為第一個官方示範 Plugin,示範透過 Core 課程引擎產出內容的流程,依循 THE-TU-Project 的 Simple-first 精神(金流／OAuth 相關設定預設關閉可跳過、金鑰填後台)
- **BREAKING**：`/agent`、`/admin/settings` 頁面的 DOM 結構改變(換用統一 Shell 元件),既有以 SiteNav 結構為準的 E2E 測試選擇器需同步更新

## Non-Goals

- 不重寫金流／Email／LINE 通知／頁面編輯系統本身的實作——這次只聲明其歸屬 Core、不開放 Plugin 替換,既有程式碼邏輯維持不動
- 不做 Agent 管理 Plugin（仿 Hyperagent 的多 Agent 管理介面),列為後續獨立 change
- 不做「StartKiter 的 AI 主動連線操作客戶自己伺服器」這個方向,MCP Gateway 只做外部 AI 連進來這一個方向
- 不處理 Organization 多租戶、電子發票範圍、已封存 changes 關係這三個既有 Open Question,另開 change 處理
- 不改動 `/checkout`、`/`、`/login`、`/signup` 的版面呈現,這些頁面維持獨立於統一 Shell 之外
- 不做完整的 Marketplace 電商功能（付費上架、評分評論等),v1 只做「列出可安裝項目 + 安裝/移除」
- 不修改 `site-agent`、`operator-settings` 兩個 capability 的既有 requirement——這兩份 spec 對「主要導覽可到達 /agent、/admin/settings」的描述本身是抽象契約,沒有指定具體用哪個 Shell 元件呈現,換用 AppShell 不違反既有 requirement

## Capabilities

### New Capabilities

- `platform-mount-points`: Core 提供的四種掛載點機制（路由/資料表/選單/前台區塊)與 Plugin manifest 格式規範
- `platform-marketplace`: Plugin 安裝與展示介面,基於掛載點機制列出可安裝項目
- `mcp-gateway`: 授權外部 AI 工具透過固定 endpoint 連線操作帳號,管理連線清單
- `platform-core-boundary`: Core 與 Plugin 的能力邊界聲明,含客戶自行修改核心代碼的原則

### Modified Capabilities

- `saas-shell`: 「Operator navigation reaches settings」這條 requirement 明確寫死「renders SiteNav」場景,需修改為 AppShell 場景;並新增涵蓋 `/agent`、語系/深色模式配置、窄螢幕 tab bar 收合規則的新 requirement
- `course-module`: 新增一條 requirement,說明課程內容可透過 `platform-mount-points` 機制的 `auto` 模式掛載呈現,既有播放/購買邏輯的 requirement 不變

## Impact

- Affected specs: saas-shell、course-module（modified,見上）；platform-mount-points、platform-marketplace、mcp-gateway、platform-core-boundary（new)。site-agent、operator-settings 的 spec 內容不變,但其頁面的實際渲染元件會改變(見 Affected code)
- Affected code:
  - New: packages/platform/（新 package,含掛載點機制與 Plugin manifest 型別定義)、apps/saas/app/marketplace/page.tsx、apps/saas/app/api/mcp/route.ts、apps/saas/app/components/mobile-tabbar.tsx
  - Modified: apps/saas/app/components/app-shell.tsx、apps/saas/app/agent/page.tsx、apps/saas/app/admin/settings/page.tsx、apps/saas/app/components/site-nav.tsx、apps/saas/app/globals.css、apps/saas/app/components/locale-switcher.tsx
  - Removed: apps/saas/app/agent/page.tsx 與 apps/saas/app/admin/settings/page.tsx 對 SiteNav 元件的 import
  - Dependencies 新增：無(掛載機制沿用既有 Next.js App Router 與 Prisma,不引入新框架)
  - 環境變數新增：無(MCP Gateway 沿用既有 BETTER_AUTH_SECRET／BETTER_AUTH_URL 做授權基礎)
