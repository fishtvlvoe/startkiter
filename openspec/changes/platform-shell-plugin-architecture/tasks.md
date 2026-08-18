## Phase 1：Plugin Manifest 型別與 Mount Points 機制（Mount Points 維持四種掛載點架構，v1 靜態 TypeScript 陣列）

### 1. 紅燈測試：PluginManifest 型別定義

- [ ] 1.1 [P] 撰寫型別測試驗證 Requirement「Core defines a fixed set of mount point kinds」——PluginManifest 只接受 route/menu/content/dataSpec 四種 mount 鍵,不支援的鍵型別檢查失敗（spec: platform-mount-points）
- [ ] 1.2 [P] 撰寫型別測試驗證 Requirement「Content data specs are limited to content and none」——dataSpec 只接受 "content" | "none",宣告 "payment" 型別檢查失敗（spec: platform-mount-points）
- [ ] 1.3 [P] 撰寫型別測試驗證 Requirement「Content mount point supports three placement modes」——mount.content.kind 只接受 "auto" | "shortcode" | "block"（spec: platform-mount-points）

### 2. 實作：PluginManifest 型別與靜態掛載點清單

- [ ] 2.1 新增 `packages/platform/src/types.ts`，匯出 PluginManifest TypeScript 型別（design.md Interface 定義），滿足 spec platform-mount-points 的型別相關 Requirement，驗證：1.1、1.2、1.3 轉綠燈
- [ ] 2.2 新增 `packages/platform/src/mount-points.ts`，匯出 `MOUNT_POINTS: PluginManifest[]` 靜態陣列，含課程 Plugin manifest（`id: "course"`, `mount.content: { kind: "auto", boundTo: "/course" }`, `dataSpec: "content"`），滿足 spec course-module「Course content is exposed as the first official demonstration Plugin」與 spec platform-mount-points「Menu mount points render from a static registry in v1」

### 3. 紅燈測試：靜態掛載點清單行為

- [ ] 3.1 [P] 撰寫測試驗證 spec course-module「Course manifest is registered」——MOUNT_POINTS 含 `id: "course"` 且 `mount.content.kind` 為 "auto"
- [ ] 3.2 [P] 撰寫測試驗證 spec platform-mount-points「Menu item appears from manifest without editing the Shell component」——側欄從 MOUNT_POINTS 動態渲染
- [ ] 3.3 [P] 撰寫測試驗證 spec platform-mount-points「Operator-only menu item is hidden from learners」——requiresOperator: true 的項目對非 operator 隱藏

### 4. Phase 1 Review 與驗收

- [ ] 4.1 對 `packages/platform/` 跑 correctness / security code review，Critical 為零
- [ ] 4.2 `pnpm type-check` 通過（含新增型別測試）

## Phase 2：後台 Shell 統一對照重建後結構，擴充 NavBar + sidebar-context

### 5. 紅燈測試：統一 Shell 涵蓋所有已登入路由

- [ ] 5.1 [P] 撰寫測試驗證 spec saas-shell「Unified Shell covers all authenticated routes」——GET /agent 回應含統一 Shell 側欄結構
- [ ] 5.2 [P] 撰寫測試驗證同一 Requirement——GET /admin/settings 回應含統一 Shell 側欄結構
- [ ] 5.3 [P] 撰寫測試驗證 spec saas-shell「Operator navigation reaches settings」——operator 側欄含 /admin/settings 連結，learner 不含

### 6. 實作：Shell 統一與選單動態渲染

- [ ] 6.1 修改 `modules/shared/components/NavBar.tsx` 的側欄 nav 區塊，從手寫 Link 改為 `.map()` 迭代 MOUNT_POINTS 渲染，menu 項目依 `order` 排序、依 `requiresOperator` 過濾，驗證：3.2、3.3、5.1、5.2、5.3 轉綠燈
- [ ] 6.2 確認 `modules/lib/sidebar-context.tsx` 的狀態管理涵蓋所有已登入路由（/app, /course, /agent, /admin/settings），必要時擴充

### 7. 紅燈測試：語系與深色模式配置

- [ ] 7.1 撰寫測試驗證 spec saas-shell「Locale switcher lives in the sidebar user area, color mode toggle stays in the top bar」——側欄使用者區塊含語系切換、頂欄含深色模式但不含語系切換

### 8. 實作：語系與深色模式配置

- [ ] 8.1 將語系切換元件從頂欄移入 NavBar 側欄使用者區塊，驗證：7.1 轉綠燈

### 9. 紅燈測試：窄螢幕 tab bar

- [ ] 9.1 [P] 撰寫測試驗證 spec saas-shell「Narrow viewport renders a bottom tab bar with an overflow drawer」的 375px scenario——tab bar 恰好 4 個項目（開始/課程/客服/更多）
- [ ] 9.2 [P] 撰寫測試驗證同一 Requirement 的 More drawer scenario——operator 在 375px 點「更多」，抽屜含帳號設定
- [ ] 9.3 [P] 撰寫測試驗證同一 Requirement 的 Wide viewport scenario——1280px 渲染側欄、不渲染 tab bar

### 10. 實作：窄螢幕 tab bar

- [ ] 10.1 在 NavBar 或新增獨立元件，螢幕寬度 < 768px 時渲染底部 tab bar（3 固定項目 + 更多抽屜），取代側欄。menu 項目超出固定 3 個的全部進「更多」抽屜，驗證：9.1、9.2、9.3 轉綠燈

### 11. Phase 2 Review 與驗收

- [ ] 11.1 對 Phase 2 變更（`modules/shared/components/NavBar.tsx`、`modules/lib/sidebar-context.tsx`、相關 layout）跑 correctness / security / performance code review，Critical 為零
- [ ] 11.2 用 Chrome MCP 對 /app、/agent、/admin/settings 截圖驗證 Shell 結構一致性，375px 與 1280px 各截一次確認 tab bar / 側欄切換正確
- [ ] 11.3 `pnpm build` 與 `pnpm test` 通過

## Phase 3：內容型 Plugin 共用 PluginContent 表維持不變

### 12. 紅燈測試：PluginContent 共用表

- [ ] 12.1 撰寫測試驗證 spec platform-mount-points「Shared PluginContent table stores content-type Plugin data」——插入 pluginId=course / type=lesson 記錄後可依條件查回
- [ ] 12.2 撰寫測試驗證同一 Requirement——空 body 值被資料庫拒絕

### 13. 實作：PluginContent 資料表

- [ ] 13.1 新增 Prisma migration 建立 PluginContent 表（id/pluginId/type/title/body(JSONB)/authorId/createdAt/updatedAt，索引 (pluginId,type) 與 authorId），驗證：12.1、12.2 轉綠燈

### 14. Phase 3 Review 與驗收

- [ ] 14.1 對 migration 跑 correctness / security review，Critical 為零
- [ ] 14.2 `pnpm build` 與 `pnpm test` 通過

## Phase 4：Marketplace 角色降級為展示頁 + 模版選擇，不做「裝/解」操作

### 15. 紅燈測試：Plugin 列表 API

- [ ] 15.1 [P] 撰寫測試驗證 spec platform-marketplace「Plugin listing API returns manifest data with enabled status」——GET /api/plugins 回傳含 `id: "course"` 且 `enabled: true` 的 JSON 陣列
- [ ] 15.2 [P] 撰寫測試驗證同一 Requirement——未登入請求回 401

### 16. 實作：Plugin 列表 API

- [ ] 16.1 新增 `apps/saas/app/api/plugins/route.ts`，回傳 MOUNT_POINTS 衍生的 JSON 陣列，含 enabled 布林欄位，驗證：15.1、15.2 轉綠燈

### 17. 紅燈測試：模版定義與 API

- [ ] 17.1 [P] 撰寫測試驗證 spec buyer-template-selection「Template array contains at least two entries」——SITE_TEMPLATES 長度 >= 2，每個有唯一 id
- [ ] 17.2 [P] 撰寫型別測試驗證 spec buyer-template-selection「Template with missing required fields fails type check」——SiteTemplate 缺 defaultMountConfig 型別檢查失敗
- [ ] 17.3 [P] 撰寫測試驗證 spec buyer-template-selection「Template listing API returns template data」——GET /api/templates 回傳 >= 2 個模版物件
- [ ] 17.4 [P] 撰寫測試驗證同一 API Requirement——未登入請求回 401
- [ ] 17.5 [P] 撰寫型別測試驗證 spec buyer-template-selection「Templates connect to mount points through defaultMountConfig」——defaultMountConfig entry 可賦值給 Partial<PluginManifest>

### 18. 實作：SiteTemplate 型別與內建模版定義（買家 UI 模版選擇：v1 內建 2-3 個靜態模版，不整合外部設計參考庫）

- [ ] 18.1 新增 `packages/platform/src/templates/types.ts`，匯出 SiteTemplate 型別（design.md Interface 定義），滿足 Requirement「Platform provides a fixed set of site templates for buyers to choose from」，驗證：17.2、17.5 轉綠燈
- [ ] 18.2 新增 `packages/platform/src/templates/index.ts`，匯出 `SITE_TEMPLATES: SiteTemplate[]` 靜態陣列（v1: 課程教學站、服務型 SaaS、作品集展示，三個內建模版），滿足同一 Requirement 的「Template array contains at least two entries」scenario，驗證：17.1 轉綠燈

### 19. 實作：模版列表 API

- [ ] 19.1 新增 `apps/saas/app/api/templates/route.ts`，回傳 SITE_TEMPLATES JSON 陣列，需有效 session，驗證：17.3、17.4 轉綠燈

### 20. Demo-first：模版靜態 HTML demo

- [ ] 20.1 為每個內建模版製作靜態 HTML demo 放入 `docs/design-system-demo/templates/`，使用 DESIGN.md token，老闆確認後才能進下一步的 React 實作（spec buyer-template-selection「Each template has a static HTML demo approved before implementation」）

### 21. 紅燈測試：Marketplace 頁面

- [ ] 21.1 [P] 撰寫測試驗證 spec platform-marketplace「Marketplace page lists known Plugins from the mount point registry」——已登入使用者於 /marketplace 看到課程項目
- [ ] 21.2 [P] 撰寫測試驗證同一 Requirement——未登入訪客重導至 /login?next=/marketplace
- [ ] 21.3 [P] 撰寫測試驗證 spec platform-marketplace——Marketplace 頁面不含 install/uninstall 操作按鈕
- [ ] 21.4 [P] 撰寫測試驗證 spec buyer-template-selection「Marketplace page includes a template selection tab」——已登入使用者看到模版 tab 並顯示 >= 2 張預覽卡片

### 22. 實作：Marketplace 頁面（展示 + 模版選擇）

- [ ] 22.1 新增 `apps/saas/app/(authenticated)/(main)/marketplace/page.tsx`，含兩個 tab：「已啟用模組」（呼叫 /api/plugins）與「模版選擇」（呼叫 /api/templates），使用統一 Shell，驗證：21.1、21.2、21.3、21.4 轉綠燈
- [ ] 22.2 模版詳細頁（或展開區塊）顯示 description、aiPromptHint、視覺引導說明如何用 AI 工具套用。模版與 Mount Points 的接合方式：模版的 `defaultMountConfig` 描述預設掛載點配置，AI 工具讀取後更新 `MOUNT_POINTS` 靜態陣列 + CSS token，不引入新抽象層

### 23. Phase 4 Review 與驗收

- [ ] 23.1 對 Phase 4 全部變更跑 correctness / security / performance code review，Critical 為零
- [ ] 23.2 用 Chrome MCP 截圖 /marketplace 頁面兩個 tab 的呈現，確認展示正確
- [ ] 23.3 `curl /api/plugins` 與 `curl /api/templates` 回傳格式符合 spec 範例
- [ ] 23.4 `pnpm build` 與 `pnpm test` 通過

## Phase 5：MCP Gateway 維持外部 AI 唯讀連線，收窄用途

### 24. 紅燈測試：MCP Gateway

- [ ] 24.1 [P] 撰寫測試驗證 spec mcp-gateway「MCP endpoint is reachable at a fixed path」——有效 session 對 /api/mcp 握手成功回傳 serverInfo 與 capabilities
- [ ] 24.2 [P] 撰寫測試驗證同一 Requirement——無 session 導向授權流程
- [ ] 24.3 [P] 撰寫測試驗證 spec mcp-gateway「MCP Gateway authorizes via OAuth-style session flow, not API keys」——授權流程不顯示 API key
- [ ] 24.4 [P] 撰寫測試驗證 spec mcp-gateway「Successful authorization creates a revocable connection record」——授權建立連線記錄、GET 回自己的清單、DELETE 撤銷自己的、無法 DELETE 他人的（4 scenarios）
- [ ] 24.5 [P] 撰寫測試驗證 spec mcp-gateway「MCP Gateway exposes read-only operations only」——唯讀呼叫成功、寫入呼叫被拒且不變更
- [ ] 24.6 [P] 撰寫測試驗證 spec mcp-gateway「MCP Gateway fails closed when auth configuration is missing」——BETTER_AUTH_SECRET 未設定回 503

### 25. 實作：McpConnection 資料表

- [ ] 25.1 新增 Prisma migration 建立 McpConnection 表（id/userId/clientName/authorizedAt/lastUsedAt/revokedAt，索引 userId）

### 26. 實作：MCP Gateway 端點

- [ ] 26.1 新增 `apps/saas/app/api/mcp/route.ts`，實作 MCP 協定握手，重用 Better Auth session 授權，驗證：24.1、24.2、24.3 轉綠燈
- [ ] 26.2 授權成功寫入 McpConnection，新增連線管理 API（GET /api/mcp/connections、DELETE /api/mcp/connections/[id]），驗證：24.4 轉綠燈
- [ ] 26.3 MCP Gateway 只註冊唯讀工具，範圍比照 site-agent 既有兩支唯讀工具，驗證：24.5 轉綠燈
- [ ] 26.4 DATABASE_URL 或 BETTER_AUTH_SECRET 缺失時回傳 503，驗證：24.6 轉綠燈

### 27. Phase 5 Review 與驗收

- [ ] 27.1 對 MCP Gateway 全部變更跑 correctness / security / performance code review，特別檢查唯讀限制是否確實、有無意外寫入路徑，Critical 為零
- [ ] 27.2 `curl /api/mcp`、`/api/mcp/connections` 回傳格式符合 spec
- [ ] 27.3 `pnpm build` 與 `pnpm test` 通過

## Phase 6：Core 邊界聲明維持不變

### 28. 紅燈測試：Core 邊界

- [ ] 28.1 [P] 撰寫測試驗證 spec platform-core-boundary「Payment, notification, page-editing, and course-engine infrastructure are fixed Core capabilities」——manifest 宣告 dataSpec: "payment" 型別檢查失敗、/api/plugins 不含金流項目
- [ ] 28.2 [P] 撰寫測試驗證 spec platform-core-boundary「Plugin scope is limited to service-type capabilities」——課程 manifest 通過驗證、不存在的 mount kind 型別檢查失敗
- [ ] 28.3 [P] 撰寫測試驗證 spec platform-core-boundary「Transaction-type data spec is documented but not scaffolded in v1」——codebase 不含交易型 Plugin scaffold

### 29. 實作：Core 邊界文件與確認

- [ ] 29.1 撰寫擴充文件聲明官方 AI 引導擴充路徑僅支援 Plugin 機制，直接修改 Core 不受官方保護（spec platform-core-boundary「Customers may modify Core source code without platform restriction」的文件 scenario）
- [ ] 29.2 確認 Phase 1 建立的 PluginManifest 型別本身即滿足 Core 邊界相關型別限制，不需額外程式碼，驗證：28.1、28.2、28.3 轉綠燈

### 30. Phase 6 Review 與驗收

- [ ] 30.1 對 Phase 6 變更跑 review，Critical 為零
- [ ] 30.2 `pnpm build` 與 `pnpm test` 通過

## 架構決策引用：部署管線採 git-push-auto-deploy，取消客製打包/MCP推送/自動build 三層

此決策不產生獨立實作 task——Non-Goals 明確排除客製打包工具、MCP 推送安裝包、伺服器端自動 build/deploy。買家的部署路徑是「AI 改代碼 → commit + push → Coolify/Vercel 原生 auto-deploy」，已在 proposal.md 與 design.md 記錄，各 Phase 的實作均遵循此決策。

## Phase 7：既有測試更新與全面驗收

### 31. 更新既有測試

- [ ] 31.1 搜尋既有測試中引用舊元件名稱（AppShell、SiteNav、MobileTabBar）的選擇器，更新為對應新結構（NavBar + sidebar-context），確保 Shell 統一後既有測試不誤判

### 32. 全面驗收

- [ ] 32.1 `pnpm build` 與 `pnpm test` 全專案通過
- [ ] 32.2 用 Chrome MCP 跑完所有已登入路由（/app, /course, /agent, /admin/settings, /marketplace），截圖確認 Shell 一致性與功能正確
- [ ] 32.3 `spectra validate platform-shell-plugin-architecture` 通過，0 warnings
