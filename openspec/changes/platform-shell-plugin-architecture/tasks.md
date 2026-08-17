## Phase 1：後台 Shell 統一

### 1. 紅燈測試：AppShell 涵蓋所有已登入路由

- [ ] 1.1 [P] 撰寫測試驗證 Requirement「AppShell covers all four authenticated routes」的 Agent route uses AppShell scenario——斷言 GET /agent 回應含 AppShell 側欄結構、不含 SiteNav 結構,驗證方式：新增測試,目前為紅燈
- [ ] 1.2 [P] 撰寫測試驗證同一 Requirement 的 Settings route uses AppShell scenario——斷言 GET /admin/settings 同上,驗證方式：新增測試,目前為紅燈
- [ ] 1.3 撰寫測試驗證 Requirement「Operator navigation reaches settings」——斷言 operator 檢視 AppShell 時側欄含 /admin/settings 連結、learner 檢視時不含,驗證方式：新增測試,目前為紅燈

### 2. 實作：AppShell 涵蓋所有已登入路由

- [ ] 2.1 修改 apps/saas/app/agent/page.tsx 改用 AppShell 元件取代 SiteNav,依循 design.md 決策「統一 Shell 採擴充既有 AppShell 元件,不重寫 SiteNav 或新建第三套」,滿足 Requirement「AppShell covers all four authenticated routes」的 Agent route scenario,驗證方式：1.1 轉綠燈
- [ ] 2.2 修改 apps/saas/app/admin/settings/page.tsx 改用 AppShell 元件取代 SiteNav,同樣依循「統一 Shell 採擴充既有 AppShell 元件」決策,滿足「AppShell covers all four authenticated routes」的 Settings route scenario 與「Operator navigation reaches settings」,驗證方式：1.2、1.3 轉綠燈

### 3. 紅燈測試：語系與深色模式配置

- [ ] 3.1 撰寫測試驗證 Requirement「Locale switcher lives in the sidebar user area, color mode toggle stays in the top bar」兩個 scenario——斷言側欄使用者區塊 DOM 含語系切換元素、頂欄 DOM 含深色模式元素但不含語系切換,驗證方式：新增測試,目前為紅燈

### 4. 實作：語系與深色模式配置

- [ ] 4.1 將 apps/saas/app/components/locale-switcher.tsx 從 AppShell 頂欄移入側欄使用者區塊,移除頂欄對語系切換的渲染,滿足 Requirement「Locale switcher lives in the sidebar user area, color mode toggle stays in the top bar」,驗證方式：3.1 轉綠燈

### 5. 紅燈測試：窄螢幕 tab bar

- [ ] 5.1 [P] 撰寫測試驗證 Requirement「Narrow viewport renders a bottom tab bar with an overflow drawer」的 Narrow viewport shows the 4-slot tab bar scenario——375px viewport 斷言 tab bar 恰好 4 個項目,驗證方式：新增測試,目前為紅燈
- [ ] 5.2 [P] 撰寫測試驗證同一 Requirement 的 More drawer lists overflow items scenario——operator 在 375px viewport 點「更多」,斷言抽屜列表含帳號設定,驗證方式：新增測試,目前為紅燈
- [ ] 5.3 [P] 撰寫測試驗證同一 Requirement 的 Wide viewport shows the sidebar, not the tab bar scenario——1280px viewport 斷言渲染側欄、不渲染底部 tab bar,驗證方式：新增測試,目前為紅燈

### 6. 實作：窄螢幕 tab bar

- [ ] 6.1 新增 apps/saas/app/components/mobile-tabbar.tsx,螢幕寬度小於 768px 時渲染 3 個固定項目加「更多」抽屜,取代側欄,滿足 Requirement「Narrow viewport renders a bottom tab bar with an overflow drawer」,驗證方式：5.1、5.2、5.3 轉綠燈

### 7. Phase 1 Review 與驗收

- [ ] 7.1 對 Phase 1 變更(apps/saas/app/components/app-shell.tsx、apps/saas/app/agent/page.tsx、apps/saas/app/admin/settings/page.tsx、apps/saas/app/components/locale-switcher.tsx、apps/saas/app/components/mobile-tabbar.tsx)跑一輪 correctness／security／performance code review,驗證方式：Review 報告列出的 Critical 發現數為零
- [ ] 7.2 用 ego-browser 對 /agent、/admin/settings 截圖比對 /app 的頂欄/側欄結構一致性,並以 375px 與 1280px 兩種 viewport 各截一次確認 tab bar／側欄切換正確,驗證方式：截圖存檔並附比對結論
- [ ] 7.3 執行 pnpm build 與 pnpm test 全專案,驗證方式：兩指令皆以 exit code 0 結束

## Phase 2：平台化架構

### 8. 紅燈測試：Plugin manifest 型別與掛載點機制

- [ ] 8.1 [P] 撰寫測試驗證 Requirement「Core defines a fixed set of mount point kinds」兩個 scenario——PluginManifest 型別只接受 route/menu/content/dataSpec 四個 mount 鍵,不支援的鍵型別檢查失敗、支援的鍵組合編譯成功,驗證方式：新增型別測試,目前為紅燈
- [ ] 8.2 [P] 撰寫測試驗證 Requirement「Content mount point supports three placement modes」的 Auto-mode content renders without manual placement scenario——斷言 GET /course 回應含課程引擎渲染的課程清單,驗證方式：新增測試,目前為紅燈
- [ ] 8.3 [P] 撰寫測試驗證 Requirement「Content data specs are limited to content and none」兩個 scenario——dataSpec 只接受 content/none,宣告 payment 值型別檢查失敗,驗證方式：新增型別測試,目前為紅燈
- [ ] 8.4 [P] 撰寫測試驗證 Requirement「Menu mount points render from a static registry in v1」兩個 scenario——側欄項目從 MOUNT_POINTS 動態渲染不需編輯 Shell 元件、requiresOperator 項目對非 operator 隱藏,驗證方式：新增測試,目前為紅燈

### 9. 實作：Plugin manifest 型別與掛載點機制

- [ ] 9.1 新增 packages/platform package,定義 PluginManifest TypeScript 型別,依循 design.md 決策「選單項目渲染方式改為讀取掛載點清單,v1 用靜態 TypeScript 陣列而非資料庫驅動」,滿足 Requirement「Core defines a fixed set of mount point kinds」與「Content data specs are limited to content and none」,驗證方式：8.1、8.3 轉綠燈
- [ ] 9.2 在 packages/platform 新增 MOUNT_POINTS 靜態陣列,含課程 Plugin manifest(mount.content.kind 為 auto、boundTo 為 /course、dataSpec 為 content),依循 design.md 決策「前台掛載 v1 只實作 `auto` 模式,課程內容用此模式掛進 `/course`」,滿足 Requirement「Content mount point supports three placement modes」與「Course content is exposed as the first official demonstration Plugin」,驗證方式：8.2 轉綠燈
- [ ] 9.3 修改 apps/saas/app/components/app-shell.tsx 的側欄 nav 區塊,從逐一手寫 Link 改為 .map() 迭代 MOUNT_POINTS 渲染,依循「選單項目渲染方式改為讀取掛載點清單」決策,滿足 Requirement「Menu mount points render from a static registry in v1」,驗證方式：8.4 轉綠燈

### 10. 紅燈測試：PluginContent 資料表

- [ ] 10.1 撰寫測試驗證 Requirement「Shared PluginContent table stores content-type Plugin data」兩個 scenario——插入 pluginId=course/type=lesson 記錄後可依條件查回、空 body 值被資料庫拒絕,驗證方式：新增測試,目前為紅燈

### 11. 實作：PluginContent 資料表

- [ ] 11.1 新增 Prisma migration 建立 PluginContent 表(欄位 id/pluginId/type/title/body/authorId/createdAt/updatedAt,索引 (pluginId,type) 與 authorId),依循 design.md 決策「內容型 Plugin 資料規格：新增共用 `PluginContent` 表,而非各自開表」,滿足 Requirement「Shared PluginContent table stores content-type Plugin data」,驗證方式：10.1 轉綠燈

### 12. 紅燈測試：Marketplace

- [ ] 12.1 [P] 撰寫測試驗證 Requirement「Marketplace page lists known Plugins from the mount point registry」兩個 scenario——已登入使用者於 /marketplace 看到課程項目、未登入訪客被導向登入頁,驗證方式：新增測試,目前為紅燈
- [ ] 12.2 [P] 撰寫測試驗證 Requirement「Plugin listing API returns manifest data with enabled status」三個 scenario——GET /api/plugins 回傳含課程項目的陣列、回應格式符合範例、未登入請求回 401,驗證方式：新增測試,目前為紅燈

### 13. 實作：Marketplace

- [ ] 13.1 新增 apps/saas/app/api/plugins/route.ts 回傳 MOUNT_POINTS 衍生的 JSON 陣列並含 enabled 布林欄位,滿足 Requirement「Plugin listing API returns manifest data with enabled status」,驗證方式：12.2 轉綠燈
- [ ] 13.2 新增 apps/saas/app/marketplace/page.tsx 呼叫該 API 並用 AppShell 呈現清單,依循 design.md 決策「Marketplace v1 只做靜態展示列表,不做上傳安裝流程」,滿足 Requirement「Marketplace page lists known Plugins from the mount point registry」,驗證方式：12.1 轉綠燈

### 14. 紅燈測試：MCP Gateway

- [ ] 14.1 [P] 撰寫測試驗證 Requirement「MCP endpoint is reachable at a fixed path」兩個 scenario——有效 session 對 /api/mcp 握手成功回傳 serverInfo 與 capabilities、無 session 導向既有授權流程,驗證方式：新增測試,目前為紅燈
- [ ] 14.2 [P] 撰寫測試驗證 Requirement「MCP Gateway authorizes via OAuth-style session flow, not API keys」——完成授權流程過程中回應不含任何 API key 字串,驗證方式：新增測試,目前為紅燈
- [ ] 14.3 [P] 撰寫測試驗證 Requirement「Successful authorization creates a revocable connection record」四個 scenario——授權建立連線記錄、GET 自己的連線清單不含他人、DELETE 撤銷自己的連線、無法 DELETE 他人的連線,驗證方式：新增測試,目前為紅燈
- [ ] 14.4 [P] 撰寫測試驗證 Requirement「MCP Gateway exposes read-only operations only」兩個 scenario——唯讀工具呼叫成功回傳資料、寫入類工具呼叫回傳協定錯誤且不執行變更,驗證方式：新增測試,目前為紅燈
- [ ] 14.5 [P] 撰寫測試驗證 Requirement「MCP Gateway fails closed when auth configuration is missing」——BETTER_AUTH_SECRET 未設定時所有請求回傳 503 而非 500,驗證方式：新增測試,目前為紅燈

### 15. 實作：MCP Gateway

- [ ] 15.1 新增 Prisma migration 建立 McpConnection 表(欄位 id/userId/clientName/authorizedAt/lastUsedAt/revokedAt,索引 userId),支撐 Requirement「Successful authorization creates a revocable connection record」,驗證方式：migration 執行成功且 schema 含上述欄位與索引
- [ ] 15.2 新增 apps/saas/app/api/mcp/route.ts 實作 MCP 協定握手,重用既有 Better Auth session 機制做授權,依循 design.md 決策「MCP Gateway 採固定 endpoint + OAuth 式授權,不用 API key」,滿足 Requirement「MCP endpoint is reachable at a fixed path」與「MCP Gateway authorizes via OAuth-style session flow, not API keys」,驗證方式：14.1、14.2 轉綠燈
- [ ] 15.3 授權成功時寫入 McpConnection 記錄,新增 apps/saas/app/api/mcp/connections/route.ts 處理 GET、apps/saas/app/api/mcp/connections/[id]/route.ts 處理 DELETE,滿足 Requirement「Successful authorization creates a revocable connection record」,驗證方式：14.3 轉綠燈
- [ ] 15.4 MCP Gateway 只註冊唯讀工具,範圍比照 site-agent 既有兩支唯讀工具,滿足 Requirement「MCP Gateway exposes read-only operations only」,驗證方式：14.4 轉綠燈
- [ ] 15.5 MCP Gateway 端點在 DATABASE_URL 或 BETTER_AUTH_SECRET 缺失時回傳 503,滿足 Requirement「MCP Gateway fails closed when auth configuration is missing」,驗證方式：14.5 轉綠燈

### 16. 紅燈測試：Core 邊界聲明

- [ ] 16.1 [P] 撰寫測試驗證 Requirement「Payment, notification, page-editing, and course-engine infrastructure are fixed Core capabilities」兩個 scenario——manifest 宣告 dataSpec 為 payment 型別檢查失敗、/api/plugins 回應不含任何金流類項目,驗證方式：新增測試,目前為紅燈
- [ ] 16.2 [P] 撰寫測試驗證 Requirement「Plugin scope is limited to service-type capabilities」兩個 scenario——課程內容 manifest 通過驗證、宣告不存在的 mount 種類型別檢查失敗,驗證方式：新增測試,目前為紅燈
- [ ] 16.3 [P] 撰寫測試驗證 Requirement「Transaction-type data spec is documented but not scaffolded in v1」——依循 design.md 決策「交易型 Plugin 資料規格只寫進 spec 當作原則,v1 不實作對應工具鏈」,檢查 codebase 不含交易型 Plugin 的程式碼產生器或 scaffold 樣板,驗證方式：新增測試,目前為紅燈

### 17. 實作：Core 邊界聲明

- [ ] 17.1 撰寫文件明確聲明官方 AI 引導擴充路徑僅支援 Plugin 機制、直接修改 Core 原始碼不受官方保護,依循 design.md 決策「Core 邊界聲明採 spec 文件聲明 + manifest schema 不提供金流類型掛載點,不做程式碼層級存取限制」,滿足 Requirement「Customers may modify Core source code without platform restriction」的文件 scenario,驗證方式：文件內容經人工檢閱含上述聲明
- [ ] 17.2 確認步驟 9.1 建立的 PluginManifest 型別本身即滿足「Payment, notification, page-editing, and course-engine infrastructure are fixed Core capabilities」與「Plugin scope is limited to service-type capabilities」的型別檢查要求,不需額外程式碼變更,驗證方式：16.1、16.2、16.3 轉綠燈

### 18. Phase 2 Review 與驗收

- [ ] 18.1 對 Phase 2 全部變更(packages/platform、PluginContent 與 McpConnection migration、apps/saas/app/marketplace、apps/saas/app/api/mcp)跑一輪 correctness／security／performance code review,特別檢查 MCP Gateway 是否確實唯讀、有無意外開放寫入路徑,驗證方式：Review 報告列出的 Critical 發現數為零
- [ ] 18.2 執行 pnpm build 與 pnpm test 全專案,驗證方式：兩指令皆以 exit code 0 結束
- [ ] 18.3 用 curl 對 /api/plugins、/api/mcp、/api/mcp/connections 三個端點各發一次請求,確認回應格式符合 spec 範例,驗證方式：三次 curl 輸出存檔並附比對結論
