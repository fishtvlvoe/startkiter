## Why

Fish 要在本機驗收完整後台的介面與操作，而不是閱讀藍圖比例；目前本機程式已有商品保存與兩層導航，但平台管理員仍是示意、三種角色畫面沒有獨立交付邊界，造成反覆修改與無法安全平行施工。本 SR 把本機 UI 交付從總藍圖獨立出來，固定「上方主分類＋左側子選單＋右側內容」及三個不重疊 worker 範圍。

## What Changes

- 新增三角色本機驗收契約 `local-backoffice-acceptance`，分開平台管理員、創作者與買家；每個畫面明示可操作／只供版型驗收／外部服務未串接。
- 修改 `docs/blueprint/creator-local-ui.js` 為主控殼與事件處理，沿用 `creator-local-navigation.js` 與 `creator-local-model.js`；先建立穩定 view 介面，再派三個 worker 各自寫獨立角色檔案。
- 新增 `creator-local-admin-view.js`、`creator-local-creator-view.js`、`creator-local-buyer-view.js` 與各自 focused tests，保留本機商品與買家取得快照，不重建正式資料真相。
- 新增短驗收路線、角色／畫面／狀態表、worker packet、自審與1440／390真實瀏覽器證據；保留既有本機入口，不讓 Fish 找多個 Demo。
- 修改總藍圖的未完成 UI 交付責任引用：本 SR 經 Fish 核准後，第11.4／11.5的本機施工交由本 SR；已完成第11.1～11.3及既有證據不重算、不重寫。後續真實付款、CRM、直播、部署仍由原功能 SR 負責。

## Non-Goals

- 不把示範角色切換當正式登入或 server authorization。
- 不修改 `apps/`、`packages/`、Prisma、認證、PAYUNi、續扣、寄信、影音、GitHub grant 或部署；不讀 `.env` 或真實個資。
- 不同時完成總藍圖全部營運模組。站點／郵件／自動化／銷售／設定只提供清楚標示的介面示意，不假報可保存或已接服務。
- 不安裝新的 workflow 系統、UI 框架或依賴，不啟動 Orca，不覆蓋使用者 dirty 修改。

## Capabilities

### New Capabilities

- `local-backoffice-acceptance`: 本機三角色畫面、兩層情境導航、隔離保存、角色 view 交接與可重跑的 UI 驗收。

### Modified Capabilities

無。只增加隔離的本機驗收能力，不修改正式導航或 App 註冊規格。

## Impact

- Affected specs：新增本 SR 的 `local-backoffice-acceptance`；總藍圖的 `creator-ui-ux-foundation` 作設計依據。既有 `role-based-workspace-navigation` 與 `app-extension-contract` 只作相容性參考，不產生其 delta spec。
- Affected code：僅 `docs/blueprint/creator-local-ui.js`、`creator-local-navigation.js`、`creator-local-model.js`、新增三份角色 view／tests、本機 HTML 入口、report script tags 與本機驗收腳本。三個 worker 不碰共用檔案。
- Affected documents：本 SR artifacts、`CONTEXT.md`、`docs/blueprint/creator-local-acceptance-guide.md`、`creator-local-delivery-review.md`、總藍圖未完成 UI handoff 引用；本機 dashboard state 按鎖更新，不發布線上。
- Dependencies 新增：無。使用既有原生 HTML/CSS/JavaScript、node:test 與 ego-browser。
- Environment variables 新增：無。無 provider、憑證、資料庫或外部帳號變更。
