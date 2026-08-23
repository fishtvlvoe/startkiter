## Phase 1：Plugin Manifest 型別與 Mount Points 機制（Mount Points 維持四種掛載點架構，v1 靜態 TypeScript 陣列）

### 1. 紅燈測試：PluginManifest 型別定義

- [x] 1.1 [P] 撰寫型別測試驗證 Requirement「Core defines a fixed set of mount point kinds」——PluginManifest 只接受 route/menu/content/dataSpec 四種 mount 鍵,不支援的鍵型別檢查失敗（spec: platform-mount-points）
- [x] 1.2 [P] 撰寫型別測試驗證 Requirement「Content data specs are limited to content and none」——dataSpec 只接受 "content" | "none",宣告 "payment" 型別檢查失敗（spec: platform-mount-points）
- [x] 1.3 [P] 撰寫型別測試驗證 Requirement「Content mount point supports three placement modes」——mount.content.kind 只接受 "auto" | "shortcode" | "block"（spec: platform-mount-points）

### 2. 實作：PluginManifest 型別與靜態掛載點清單

- [x] 2.1 新增 `packages/platform/src/types.ts`，匯出 PluginManifest TypeScript 型別（design.md Interface 定義），滿足 spec platform-mount-points 的型別相關 Requirement，驗證：1.1、1.2、1.3 轉綠燈
- [x] 2.2 新增 `packages/platform/src/mount-points.ts`，匯出 `MOUNT_POINTS: PluginManifest[]` 靜態陣列，含課程 Plugin manifest（`id: "course"`, `mount.content: { kind: "auto", boundTo: "/course" }`, `dataSpec: "content"`），滿足 spec course-module「Course content is exposed as the first official demonstration Plugin」與 spec platform-mount-points「Menu mount points render from a static registry in v1」

### 3. 紅燈測試：靜態掛載點清單行為

- [x] 3.1 [P] 撰寫測試驗證 spec course-module「Course manifest is registered」——MOUNT_POINTS 含 `id: "course"` 且 `mount.content.kind` 為 "auto"
- [x] 3.2 [P] 撰寫測試驗證 spec platform-mount-points「Menu item appears from manifest without editing the Shell component」——側欄從 MOUNT_POINTS 動態渲染
- [x] 3.3 [P] 撰寫測試驗證 spec platform-mount-points「Operator-only menu item is hidden from learners」——requiresOperator: true 的項目對非 operator 隱藏

### 4. Phase 1 Review 與驗收

- [x] 4.1 對 `packages/platform/` 跑 correctness / security code review，Critical 為零
- [x] 4.2 `pnpm type-check` 通過（含新增型別測試）

## Phase 2：後台 Shell 統一對照重建後結構，擴充 NavBar + sidebar-context

### 5. 紅燈測試：統一 Shell 涵蓋所有已登入路由

- [x] 5.1 [P] 撰寫測試驗證 spec saas-shell「Unified Shell covers all authenticated routes」——GET /agent 回應含統一 Shell 側欄結構
- [x] 5.2 [P] 撰寫測試驗證同一 Requirement——GET /admin/settings 回應含統一 Shell 側欄結構
- [x] 5.3 [P] 撰寫測試驗證 spec saas-shell「Operator navigation reaches settings」——operator 側欄含 /admin/settings 連結，learner 不含

### 6. 實作：Shell 統一與選單動態渲染

- [x] 6.1 修改 `modules/shared/components/NavBar.tsx` 的側欄 nav 區塊，從手寫 Link 改為 `.map()` 迭代 MOUNT_POINTS 渲染，menu 項目依 `order` 排序、依 `requiresOperator` 過濾，驗證：3.2、3.3、5.1、5.2、5.3 轉綠燈
- [x] 6.2 確認 `modules/lib/sidebar-context.tsx` 的狀態管理涵蓋所有已登入路由（/app, /course, /agent, /admin/settings），必要時擴充

### 7. 紅燈測試：語系與深色模式配置

- [x] 7.1 撰寫測試驗證 spec saas-shell「Locale switcher lives in the sidebar user area, color mode toggle stays in the top bar」——側欄使用者區塊含語系切換、頂欄含深色模式但不含語系切換

### 8. 實作：語系與深色模式配置

- [x] 8.1 將語系切換元件從頂欄移入 NavBar 側欄使用者區塊，驗證：7.1 轉綠燈

### 9. 紅燈測試：窄螢幕 tab bar

- [x] 9.1 [P] 撰寫測試驗證 spec saas-shell「Narrow viewport renders a bottom tab bar with an overflow drawer」的 375px scenario——tab bar 恰好 4 個項目（開始/課程/客服/更多）
- [x] 9.2 [P] 撰寫測試驗證同一 Requirement 的 More drawer scenario——operator 在 375px 點「更多」，抽屜含帳號設定
- [x] 9.3 [P] 撰寫測試驗證同一 Requirement 的 Wide viewport scenario——1280px 渲染側欄、不渲染 tab bar

### 10. 實作：窄螢幕 tab bar

- [x] 10.1 在 NavBar 或新增獨立元件，螢幕寬度 < 768px 時渲染底部 tab bar（3 固定項目 + 更多抽屜），取代側欄。menu 項目超出固定 3 個的全部進「更多」抽屜，驗證：9.1、9.2、9.3 轉綠燈

### 11. Phase 2 Review 與驗收

- [x] 11.1 對 Phase 2 變更（`modules/shared/components/NavBar.tsx`、`modules/lib/sidebar-context.tsx`、相關 layout）跑 correctness / security / performance code review，Critical 為零（唯一發現：`sidebar-collapsed` cookie 未設 Secure/SameSite，因無敏感資料非 Critical）
- [x] 11.2 用 `/ego-browser`（唯一瀏覽器工具）對 /app、/agent、/admin/settings 截圖驗證 Shell 結構一致性，375px 與 1280px 各截一次確認 tab bar / 側欄切換正確。過程中發現並修復真實 Bug：`next.config.ts` 的 `/:organizationSlug/settings` 重導向規則會把 `/admin/settings` 誤判為 organizationSlug="admin"，導致 308 重導向到不存在的 `/admin/settings/general`（404）。改用排除 "admin" 的正則 `/:organizationSlug((?!admin(?:\/|$))[^\/]+)/settings` 修復，修復後截圖確認 375px/1280px 皆正確渲染統一 Shell
- [x] 11.3 `pnpm build` 與 `pnpm test` 通過（含 next.config.ts 修復後重驗）

## Phase 3：內容型 Plugin 共用 PluginContent 表維持不變

### 12. 紅燈測試：PluginContent 共用表

- [x] 12.1 撰寫測試驗證 spec platform-mount-points「Shared PluginContent table stores content-type Plugin data」——插入 pluginId=course / type=lesson 記錄後可依條件查回
- [x] 12.2 撰寫測試驗證同一 Requirement——空 body 值被資料庫拒絕

### 13. 實作：PluginContent 資料表

- [x] 13.1 新增 Prisma migration 建立 PluginContent 表（id/pluginId/type/title/body(JSONB)/authorId/createdAt/updatedAt，索引 (pluginId,type) 與 authorId），驗證：12.1、12.2 轉綠燈

### 14. Phase 3 Review 與驗收

- [x] 14.1 對 migration 跑 correctness / security review，Critical 為零
- [x] 14.2 `pnpm build` 與 `pnpm test` 通過

## Phase 4：Marketplace 角色降級為展示頁 + 模版選擇，不做「裝/解」操作

### 15. 紅燈測試：Plugin 列表 API

- [x] 15.1 [P] 撰寫測試驗證 spec platform-marketplace「Plugin listing API returns manifest data with enabled status」——GET /api/plugins 回傳含 `id: "course"` 且 `enabled: true` 的 JSON 陣列
- [x] 15.2 [P] 撰寫測試驗證同一 Requirement——未登入請求回 401

### 16. 實作：Plugin 列表 API

- [x] 16.1 新增 `apps/saas/app/api/plugins/route.ts`，回傳 MOUNT_POINTS 衍生的 JSON 陣列，含 enabled 布林欄位，驗證：15.1、15.2 轉綠燈

### 17. 紅燈測試：模版定義與 API

- [x] 17.1 [P] 撰寫測試驗證 spec buyer-template-selection「Template array contains at least two entries」——SITE_TEMPLATES 長度 >= 2，每個有唯一 id
- [x] 17.2 [P] 撰寫型別測試驗證 spec buyer-template-selection「Template with missing required fields fails type check」——SiteTemplate 缺 defaultMountConfig 型別檢查失敗
- [x] 17.3 [P] 撰寫測試驗證 spec buyer-template-selection「Template listing API returns template data」——GET /api/templates 回傳 >= 2 個模版物件
- [x] 17.4 [P] 撰寫測試驗證同一 API Requirement——未登入請求回 401
- [x] 17.5 [P] 撰寫型別測試驗證 spec buyer-template-selection「Templates connect to mount points through defaultMountConfig」——defaultMountConfig entry 可賦值給 Partial<PluginManifest>

### 18. 實作：SiteTemplate 型別與內建模版定義（買家 UI 模版選擇：v1 內建 2-3 個靜態模版，不整合外部設計參考庫）

- [x] 18.1 新增 `packages/platform/src/templates/types.ts`，匯出 SiteTemplate 型別（design.md Interface 定義），滿足 Requirement「Platform provides a fixed set of site templates for buyers to choose from」，驗證：17.2、17.5 轉綠燈
- [x] 18.2 新增 `packages/platform/src/templates/index.ts`，匯出 `SITE_TEMPLATES: SiteTemplate[]` 靜態陣列（v1: 課程教學站、服務型 SaaS、作品集展示，三個內建模版），滿足同一 Requirement 的「Template array contains at least two entries」scenario，驗證：17.1 轉綠燈

### 19. 實作：模版列表 API

- [x] 19.1 新增 `apps/saas/app/api/templates/route.ts`，回傳 SITE_TEMPLATES JSON 陣列，需有效 session，驗證：17.3、17.4 轉綠燈

### 20. Demo-first：模版靜態 HTML demo

- [x] 20.1 為每個內建模版製作靜態 HTML demo 放入 `docs/design-system-demo/templates/`，使用 DESIGN.md token，老闆確認後才能進下一步的 React 實作（spec buyer-template-selection「Each template has a static HTML demo approved before implementation」）

### 21. 紅燈測試：Marketplace 頁面

- [x] 21.1 [P] 撰寫測試驗證 spec platform-marketplace「Marketplace page lists known Plugins from the mount point registry」——已登入使用者於 /marketplace 看到課程項目
- [x] 21.2 [P] 撰寫測試驗證同一 Requirement——未登入訪客重導至 /login?next=/marketplace
- [x] 21.3 [P] 撰寫測試驗證 spec platform-marketplace——Marketplace 頁面不含 install/uninstall 操作按鈕
- [x] 21.4 [P] 撰寫測試驗證 spec buyer-template-selection「Marketplace page includes a template selection tab」——已登入使用者看到模版 tab 並顯示 >= 2 張預覽卡片

### 22. 實作：Marketplace 頁面（展示 + 模版選擇）

- [x] 22.1 新增 `apps/saas/app/(authenticated)/(main)/marketplace/page.tsx`，含兩個 tab：「已啟用模組」（呼叫 /api/plugins）與「模版選擇」（呼叫 /api/templates），使用統一 Shell，驗證：21.1、21.2、21.3、21.4 轉綠燈
- [x] 22.2 模版詳細頁（或展開區塊）顯示 description、aiPromptHint、視覺引導說明如何用 AI 工具套用。模版與 Mount Points 的接合方式：模版的 `defaultMountConfig` 描述預設掛載點配置，AI 工具讀取後更新 `MOUNT_POINTS` 靜態陣列 + CSS token，不引入新抽象層

### 23. Phase 4 Review 與驗收

- [x] 23.1 對 Phase 4 全部變更跑 correctness / security / performance code review，Critical 為零
- [x] 23.2 用 Chrome MCP 截圖 /marketplace 頁面兩個 tab 的呈現，確認展示正確
- [x] 23.3 `curl /api/plugins` 與 `curl /api/templates` 回傳格式符合 spec 範例
- [x] 23.4 `pnpm build` 與 `pnpm test` 通過

## Phase 5：MCP Gateway 維持外部 AI 唯讀連線，收窄用途

### 24. 紅燈測試：MCP Gateway

- [x] 24.1 [P] 撰寫測試驗證 spec mcp-gateway「MCP endpoint is reachable at a fixed path」——有效 session 對 /api/mcp 握手成功回傳 serverInfo 與 capabilities
- [x] 24.2 [P] 撰寫測試驗證同一 Requirement——無 session 導向授權流程
- [x] 24.3 [P] 撰寫測試驗證 spec mcp-gateway「MCP Gateway authorizes via OAuth-style session flow, not API keys」——授權流程不顯示 API key
- [x] 24.4 [P] 撰寫測試驗證 spec mcp-gateway「Successful authorization creates a revocable connection record」——授權建立連線記錄、GET 回自己的清單、DELETE 撤銷自己的、無法 DELETE 他人的（4 scenarios）
- [x] 24.5 [P] 撰寫測試驗證 spec mcp-gateway「MCP Gateway exposes read-only operations only」——唯讀呼叫成功、寫入呼叫被拒且不變更
- [x] 24.6 [P] 撰寫測試驗證 spec mcp-gateway「MCP Gateway fails closed when auth configuration is missing」——BETTER_AUTH_SECRET 未設定回 503

### 25. 實作：McpConnection 資料表

- [x] 25.1 新增 Prisma migration 建立 McpConnection 表（id/userId/clientName/authorizedAt/lastUsedAt/revokedAt，索引 userId）

### 26. 實作：MCP Gateway 端點

- [x] 26.1 新增 `apps/saas/app/api/mcp/route.ts`，實作 MCP 協定握手，重用 Better Auth session 授權，驗證：24.1、24.2、24.3 轉綠燈
- [x] 26.2 授權成功寫入 McpConnection，新增連線管理 API（GET /api/mcp/connections、DELETE /api/mcp/connections/[id]），驗證：24.4 轉綠燈
- [x] 26.3 MCP Gateway 只註冊唯讀工具，範圍比照 site-agent 既有兩支唯讀工具，驗證：24.5 轉綠燈
- [x] 26.4 DATABASE_URL 或 BETTER_AUTH_SECRET 缺失時回傳 503，驗證：24.6 轉綠燈

### 27. Phase 5 Review 與驗收

- [x] 27.1 對 MCP Gateway 全部變更跑 correctness / security / performance code review，特別檢查唯讀限制是否確實、有無意外寫入路徑，Critical 為零
- [x] 27.2 `curl /api/mcp`、`/api/mcp/connections` 回傳格式符合 spec
- [x] 27.3 `pnpm build` 與 `pnpm test` 通過

## Phase 6：Core 邊界聲明維持不變

### 28. 紅燈測試：Core 邊界

- [x] 28.1 [P] 撰寫測試驗證 spec platform-core-boundary「Payment, notification, page-editing, and course-engine infrastructure are fixed Core capabilities」——manifest 宣告 dataSpec: "payment" 型別檢查失敗、/api/plugins 不含金流項目
- [x] 28.2 [P] 撰寫測試驗證 spec platform-core-boundary「Plugin scope is limited to service-type capabilities」——課程 manifest 通過驗證、不存在的 mount kind 型別檢查失敗
- [x] 28.3 [P] 撰寫測試驗證 spec platform-core-boundary「Transaction-type data spec is documented but not scaffolded in v1」——codebase 不含交易型 Plugin scaffold

### 29. 實作：Core 邊界文件與確認

- [x] 29.1 撰寫擴充文件聲明官方 AI 引導擴充路徑僅支援 Plugin 機制，直接修改 Core 不受官方保護（spec platform-core-boundary「Customers may modify Core source code without platform restriction」的文件 scenario）
- [x] 29.2 確認 Phase 1 建立的 PluginManifest 型別本身即滿足 Core 邊界相關型別限制，不需額外程式碼，驗證：28.1、28.2、28.3 轉綠燈

### 30. Phase 6 Review 與驗收

- [x] 30.1 對 Phase 6 變更跑 review，Critical 為零
- [x] 30.2 `pnpm build` 與 `pnpm test` 通過

## 架構決策引用：部署管線採 git-push-auto-deploy，取消客製打包/MCP推送/自動build 三層

此決策不產生獨立實作 task——Non-Goals 明確排除客製打包工具、MCP 推送安裝包、伺服器端自動 build/deploy。買家的部署路徑是「AI 改代碼 → commit + push → Coolify/Vercel 原生 auto-deploy」，已在 proposal.md 與 design.md 記錄，各 Phase 的實作均遵循此決策。

## Phase 7：既有測試更新與全面驗收

### 31. 更新既有測試

- [x] 31.1 搜尋既有測試中引用舊元件名稱（AppShell、SiteNav、MobileTabBar）的選擇器，更新為對應新結構（NavBar + sidebar-context），確保 Shell 統一後既有測試不誤判（`grep -rln "AppShell\|SiteNav\|MobileTabBar"` 全專案 apps/packages 無殘留匹配，Shell 重建已徹底取代舊命名，無需修改）

### 32. 全面驗收

- [x] 32.1 `pnpm build` 與 `pnpm test` 全專案通過
- [x] 32.2 用 `/ego-browser`（唯一瀏覽器工具）跑完所有已登入路由（/app, /course, /agent, /admin/settings, /marketplace），截圖確認 Shell 一致性與功能正確——五個路由皆正確渲染統一側欄結構，無 404/500
- [x] 32.3 `spectra validate platform-shell-plugin-architecture` 通過，0 warnings（`spectra validate platform-shell-plugin-architecture --strict` → `✓ valid`）

## Phase 8：買家倉庫拓樸從「共用 pull-only」改為「per-buyer 專屬可寫」，並提供買家倉庫追蹤 StartKiter 官方模板倉庫更新（upstream sync）機制

### 33. 紅燈測試：per-buyer 專屬倉庫生成

- [x] 33.1 [P] 撰寫測試驗證 spec github-kit-fulfillment「In-site GitHub claim after payment」修訂後行為——POST /api/github/claim 成功時呼叫 GitHub template-generate API 並產生 write 權限的 github_kit_grants 列，不再呼叫舊的共用 repo collaborator 邀請邏輯；同時驗證同一 spec 修訂後的 Requirement「Claim entitlement reads Order.kitClaimEligible」——kitClaimEligible true 的使用者呼叫時系統必須嘗試產生專屬倉庫並授予 write，成功時寫入 github_kit_grants
- [x] 33.2 [P] 撰寫測試驗證 spec github-kit-fulfillment「Invite grants write access on a dedicated per-buyer organization repository」——寫入的 grant permission 恆等於 write，不等於 pull/maintain/admin
- [x] 33.3 [P] 撰寫測試驗證同一 Requirement 的「No two buyers share a delivered repository」scenario——兩個不同買家各自 claim 成功後，github_kit_grants 的 repo 欄位不相同
- [x] 33.4 [P] 撰寫測試驗證 spec buyer-repo-upstream-sync「Missing template repo configuration fails closed」——`GITHUB_KIT_TEMPLATE_REPO` 未設定時 POST /api/github/claim 回 503，不建立部分完成的 grant

### 34. 實作：per-buyer 專屬倉庫生成

- [x] 34.1 新增 `packages/github-kit/src/provision-buyer-repo.ts`，呼叫 GitHub「Generate repository from template」API（以 `GITHUB_KIT_TEMPLATE_REPO` 為模板），在 org 下建立 `org/kit-<orderId>` 私有倉庫，驗證：33.1、33.4 轉綠燈
- [x] 34.2 修改 `packages/github-kit/src/claim.ts`，改為呼叫 34.1 的 provision 函式取代原有的共用 repo collaborator 邀請邏輯（該邏輯原本實作已移除的 Requirement「Invite is read-only on an organization repository」），邀請買家帳號時授予 `write` 權限，滿足取代它的 Requirement「Paid buyers receive a dedicated writable repository generated from the StartKiter template」與「Invite grants write access on a dedicated per-buyer organization repository」，驗證：33.2、33.3 轉綠燈
- [x] 34.3 修改 `packages/github-kit/src/config.ts`，新增 `GITHUB_KIT_TEMPLATE_REPO` 環境變數讀取（`.trim()`、缺值時 fail-closed），比照既有 `GITHUB_KIT_ORG`/`GITHUB_KIT_REPO` 讀取慣例

### 35. 紅燈測試：既有撤銷邏輯適配專屬倉庫

- [x] 35.1 [P] 撰寫測試驗證 spec github-kit-fulfillment「Refund revokes existing collaborator access」在新拓樸下的行為——退款時系統對買家專屬倉庫（非共用倉庫）呼叫移除 collaborator 或取消邀請的 GitHub API

### 36. 實作：撤銷邏輯適配專屬倉庫

- [x] 36.1 修改 `packages/github-kit/src/revoke.ts`，撤銷操作的目標 repo 改讀取該筆 github_kit_grants 記錄的專屬 repo 欄位，而非固定的共用 repo 常數，驗證：35.1 轉綠燈

### 37. 紅燈測試：版本比對 API

- [x] 37.1 [P] 撰寫測試驗證 spec buyer-repo-upstream-sync「Buyer repository is up to date」——買家倉庫與模板倉庫 `STARTKITER_VERSION` 內容相同時回傳 `upToDate: true`
- [x] 37.2 [P] 撰寫測試驗證同一 Requirement 群組「Buyer repository is behind」——內容不同時回傳 `upToDate: false` 且 `syncPromptHint` 非空字串
- [x] 37.3 [P] 撰寫測試驗證「Missing version file on either side returns an indeterminate result」——任一端讀取失敗回傳 `upToDate: null`，不得回傳 `true`
- [x] 37.4 [P] 撰寫測試驗證「Unauthenticated request is denied」——無 session 呼叫 GET /api/repo-version 回 401

### 38. 實作：版本比對 API

- [x] 38.1 新增 `apps/saas/app/api/repo-version/route.ts`，實作 Requirement「Version comparison API reports whether the buyer's repository is behind the template」：讀取買家專屬倉庫與 `GITHUB_KIT_TEMPLATE_REPO` 各自的 `STARTKITER_VERSION` 檔案內容並比較，回傳 `{ buyerVersion, latestVersion, upToDate, syncPromptHint }`，驗證：37.1、37.2、37.3、37.4 轉綠燈

### 39. 紅燈測試：Marketplace 版本區塊

- [x] 39.1 [P] 撰寫測試驗證 spec buyer-repo-upstream-sync「Version section hidden when up to date」——買家倉庫已同步時，/marketplace 版本區塊不顯示同步 prompt（`page.test.tsx` 39.1）
- [x] 39.2 [P] 撰寫測試驗證同一 Requirement 群組「Version section shows sync prompt when behind」——落後時顯示可複製的 syncPromptHint 文字（`page.test.tsx` 39.2）

### 40. 實作：Marketplace 版本區塊

- [x] 40.1 在 `apps/saas/app/(authenticated)/(main)/marketplace/page.tsx` 新增版本區塊，實作 Requirement「Marketplace surfaces an AI-executable sync prompt when a new version is available」：伺服器端直接呼叫 `getRepoVersion()`（與 `/api/repo-version` 共用同一邏輯，非額外走 client fetch），依 `upToDate` 顯示「已是最新」或落後狀態 + 可複製的 `syncPromptHint`（`git remote add` / `git fetch` / `git merge --allow-unrelated-histories` 三行指令），驗證：39.1、39.2 轉綠燈
- [x] 40.2 確認 40.1 的版本區塊與 38.1 的 `/api/repo-version` 皆為讀取型操作，不建立任何排程任務或 webhook 監聽 `STARTKITER_VERSION` 變化，滿足 Requirement「Repository synchronization is buyer-triggered only」——同步動作只能由買家的 AI 工具在買家指示下執行 git 指令觸發，系統本身不主動推送或合併進買家倉庫（`getRepoVersion` 純讀取 GitHub content API，未見任何 push/merge/PR 呼叫）

### 41. Phase 8 Review 與驗收

- [x] 41.1 對 `packages/github-kit/`、`apps/saas/app/api/repo-version/`、Marketplace 版本區塊變更跑 correctness / security / performance code review，特別檢查退款撤銷邏輯是否正確指向專屬倉庫、write 權限授予範圍是否過寬，Critical 為零——`revoke.ts` 確認撤銷目標讀取 `grant.org`/`grant.repo`（per-buyer 專屬倉庫，非固定共用常數）；`claim.ts` 授予權限固定為 `write`，未見過寬的 `admin`/`maintain` 授權
- [x] 41.2 `curl /api/repo-version` 回傳格式符合 spec 範例（含 buyerVersion/latestVersion/upToDate/syncPromptHint）——本機驗證：未登入 `curl http://localhost:3000/api/repo-version` 回 401 `{"error":"authentication_required"}`；已登入以 `/ego-browser` 開 `/marketplace` 觀察 SSR 版本區塊正確渲染「暫時無法比對版本，請確認 GitHub 授權設定」（因本機 `.env` 未配置 `GITHUB_KIT_*`，fail-closed 回傳 `upToDate: null`，符合 spec「Missing version file on either side returns an indeterminate result」）
- [x] 41.3 用真實帳號跑一次完整 claim 流程，確認產生專屬 repo，並確認退款後撤銷操作正確作用在對應的專屬 repo 上，保存實際輸出——2026-08-23 完成，**只驗證了一個買家身分**（見下方限制）：
  1. 根因排除：GitHub App 憑證其實早就設好（`.env`），是 `apps/saas/.env` 沒同步，已修（見 41.3a 決策記錄）
  2. GitHub OAuth App「華AI」（`GITHUB_CLIENT_ID=Ov23liN07Ec8UuJAAJtb`）缺 `http://localhost:3000/api/auth/callback/github` 這個 redirect URI，導致本機測試連 GitHub 帳號一直 `Invalid Redirect URI`；已在 GitHub 加上這個 redirect URI（永久設定變更，非測試資料，之後本機開發都需要它）
  3. 用一筆標記清楚的測試訂單（`TEST-E2E-41-3`，已於驗證後刪除）+ Fish 本人帳號連結 GitHub，呼叫 `POST /api/github/claim` → 真實在 `startkiter` org 建出 `kit-test-e2e-order-41-3` 私有 repo（GitHub 網頁確認過）
  4. 呼叫 `revokeKitGrantOnRefund`（真實 GitHub API，非 mock）→ 回傳 `{ githubCalled: true, grantStatus: "revoked" }`，DB `github_kit_grants.status` 確認為 `revoked`
  5. 測試 repo、測試訂單、grant 記錄皆已清理乾淨（`DELETE /repos/...` 回 204、DB 已刪除對應列）
  - **限制／未涵蓋**：只用 Fish 一個真實 GitHub 身分跑通，沒有第二個買家帳號可以驗證「兩個不同買家各自拿到不同專屬 repo」。這件事程式碼邏輯上必然成立（`kit-<orderId>` 依訂單 id 命名、grant store 依 userId 隔離，已於 41.1 code review 確認），但沒有第二個真實帳號實測。若要補這個缺口，需要 Fish 提供第二個 GitHub 帳號（或建一個測試小號）
- [x] 41.4 `pnpm build` 與 `pnpm test` 通過
- [x] 41.5 `spectra validate platform-shell-plugin-architecture` 通過，0 warnings（涵蓋 github-kit-fulfillment 修改後的 delta spec 一致性）

### 42. 待老闆裁決：既有買家遷移排程（非阻塞，記錄於 design.md Open Questions）

- [ ] 42.1 待老闆裁決既有已用舊共用 pull-only 模式完成履約的買家的一次性遷移排程（是否提前通知、遷移期限）後，補寫遷移批次任務的具體 task 內容；裁決前不執行任何既有買家的權限變更

## Phase 9：後台 Shell 視覺風格定案落地——WordPress Admin 語彙、側邊欄分組持久化排序、重用全域用戶管理（依 design.md 2026-08-21 決策）

### 43. 紅燈測試：側邊欄分組持久化 API

- [x] 43.1 [P] 撰寫測試驗證 GET /api/sidebar-layout 回傳 `{ groups, items }`，未登入請求回 401
- [x] 43.2 [P] 撰寫測試驗證 PUT /api/sidebar-layout——operator 可成功寫入分組與排序，非 operator 呼叫回 403
- [x] 43.3 [P] 撰寫測試驗證 PUT /api/sidebar-layout 對不存在於 MOUNT_POINTS 的 `menuItemId` 拒絕該筆寫入回 400，其餘合法項目正常寫入不受影響
- [x] 43.4 [P] 撰寫測試驗證 SidebarGroup 表為空（未初始化）時 GET /api/sidebar-layout 回傳空陣列

### 44. 實作：SidebarGroup / SidebarGroupItem 資料表與 API

- [x] 44.1 新增 Prisma migration 建立 `SidebarGroup`、`SidebarGroupItem` 兩張表（design.md DB DDL），驗證：43.4 轉綠燈（migration `20260822105711_add_sidebar_group`，DDL 與 design.md 完全一致）
- [x] 44.2 新增 `apps/saas/app/api/sidebar-layout/route.ts`，實作 GET/PUT，驗證：43.1、43.2、43.3 轉綠燈

### 45. 紅燈測試：側邊欄 WordPress 視覺與拖曳互動

- [x] 45.1 [P] 撰寫測試驗證側邊欄呈現 32px admin bar 與 WP 配色 token（`#2271b1` active、`#1d2327` 側欄背景）——`NavBar.test.tsx`，實跑確認紅燈：expected 不含 `data-testid="admin-bar"`
- [x] 45.2 [P] 撰寫測試驗證側邊欄可收折至 56px（僅 icon），且單一分組可獨立收折，兩層狀態互不影響——`NavBar.test.tsx` 45.2a/45.2b，實跑確認紅燈：仍是舊的 `md:w-[80px]`、無 `sidebar-group-*` testid，同時新增 `useSidebarLayout`（`../lib/sidebar-layout`，尚未實作）作為 46.x 要提供的資料契約
- [x] 45.3 [P] 撰寫測試驗證拖曳選單項目到不同分組後呼叫 PUT /api/sidebar-layout，畫面即時反映新分組歸屬——`e2e/startkiter.spec.ts`（原生 HTML5 drag，不引入新依賴），需登入操作故用 Playwright e2e 而非 vitest 單元測試，沿用既有 `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` skip-gate 慣例（本機未配置憑證，目前 skip；語法已用 `playwright test --list` 確認可被收錄）
- [x] 45.4 [P] 撰寫測試驗證 < 768px 時 admin bar 顯示 hamburger 按鈕，點擊觸發側邊欄滑出 + 遮罩——`e2e/startkiter.spec.ts`，同上用 e2e、同樣 skip-gate

### 46. 實作：NavBar / sidebar-context 改造為 WordPress 視覺 + 可拖曳分組

- [x] 46.1 修改 NavBar 樣式套用 WP token（admin bar、側欄配色、收折動畫），驗證：45.1、45.2 轉綠燈——實跑 vitest 128/128 全綠，`pnpm tsc --noEmit`／`pnpm build` 皆過。改版依 Fish 確認過的 `docs/demo/platform-shell-navbar-demo.html`。已知落差：expanded 寬度保留既有 280px（`w-[280px]`），design.md 寫 208px（`w-52`）但既有測試（9.3）鎖定 280px，改動範圍只涵蓋 45.x 要求的收折寬度（56px）與配色，未動 expanded 寬度，避免破壞既有驗收
- [x] 46.2 側邊欄新增分組管理 UI（新增分組／改名／跨分組拖曳排序），互動結果呼叫 44.2 的 API 儲存；`SidebarGroup` 為空時 fallback 使用 `MOUNT_POINTS` 預設順序渲染（`groups.length === 0` 時走原本 `NavMenuList`），驗證：45.3 轉綠燈——原生 HTML5 drag（無新依賴），新增/改名用 `window.prompt`（比照 demo）。e2e 45.3 本機仍因缺 `E2E_TEST_EMAIL`/`PASSWORD` skip，未跑出真正綠燈，待 Fish 提供憑證
- [x] 46.3 確認既有 hamburger + 遮罩邏輯（task 9.x）與新 admin bar 樣式相容，驗證：45.4 轉綠燈——hamburger 移到新 admin-bar（`data-testid="admin-bar-hamburger"`），沿用既有 Sheet/SheetContent 元件不變，`pnpm build` 確認编譯通過；e2e 45.4 同樣待憑證才能實際跑出綠燈

### 47. 實作：重用 supastarter 全域用戶管理

- [x] 47.1 確認 `apps/saas/app/(authenticated)/(main)/(account)/admin/` 路由與 `modules/admin/component/users/UserList.tsx` 已從 supastarter 抽取——`apps/saas/modules/admin/component/users/UserList.tsx`、`BanUserDialog.tsx` 已存在，`admin/users/page.tsx` 路由已掛
- [x] 47.2 於 `MOUNT_POINTS` 確認用戶管理相關 manifest 已存在（`packages/platform/src/mount-points.ts` 的 `id: "admin"`，`mount.route.path: "/admin/users"`、`requiresOperator: true`），未新增 `/admin/organizations` 對應 manifest；現有 label 為「後台設定」而非 design.md 建議的「用戶」，功能等價（皆導向 `/admin/users`），非 Critical，如需精確對齊文案可後續小改
- [x] 47.3 `packages/auth/config.ts` 的 `organizations.enable` 保留 `true`——2026-08-22 Fish 裁決：未來會用到，不追溯關閉。design.md 已同步更新為「底層開關開啟但 v1 不掛 `/admin/organizations` UI」，不再是「維持 false」

### 48. Phase 9 Review 與驗收

- [x] 48.1 對 Phase 9 全部變更跑 correctness / security / performance code review，Critical 為零——3 個子代理平行審查，發現後已修：(1) correctness：`handleDropItem` 拖回原分組會撞號、建分組後未分配項目消失、race condition 無 optimistic 更新；(2) security：`SidebarGroupedNav` 未依 `canAccessAdmin` 隱藏、`useSaveSidebarLayout` 無 `onError`；(3) performance：groups 寫入逐筆 insert 應改批次 `createMany`。全部修完，無 Critical 殘留（security 稽核師確認 menuItemId 竄改防護、XSS、ID 注入皆無漏洞）
- [ ] 48.2 用 Chrome MCP 對側邊欄拖曳互動與 admin bar 視覺截圖，比對 `docs/demo/course-admin-studio-demo.html` 確認一致
- [ ] 48.3 `curl /api/sidebar-layout` 驗證持久化——拖曳後重新 GET 順序與分組歸屬正確
- [x] 48.4 `pnpm build` 與 `pnpm test` 通過——vitest 128/128、`tsc --noEmit` 無錯、`pnpm build` 成功

## 待處理發現清單（2026-08-21，老闆真人點過每個頁面後發現，先列清單再修，依 SOP `docs/startkiter-development-sop.md` 第 5 節）

### 49. NavBar icon fallback 與側欄拖曳把手 bug

- [x] 49.1 修 `apps/saas/modules/shared/components/NavBar.tsx` 的 `resolveIcon()`：盤點 `MOUNT_POINTS` 全部 `icon` 值，補齊 `iconMap` 缺的 key（目前已知至少缺 `"package"`，bundles manifest 暫用 `"settings"` 頂著，見 `packages/platform/src/mount-points.ts` 的 TODO 註解），驗收：畫面上任何選單項目不再出現原始字串 fallback 蓋到文字
- [x] 49.2 修側邊欄拖曳調整寬度把手（sidebar edge resize handle）定位邏輯——目前會不正常持續顯示，驗收：把手只在 hover 側欄邊緣時出現，拖曳結束後正確隱藏（commit `703ce9fe`）

### 50. Phase 2/3 遺留未確認項目

- [x] 50.1 確認 task 6.2（`sidebar-context.tsx` 狀態涵蓋 `/app`、`/course`、`/agent`、`/admin/settings` 全部路由）是否已完成，未完成則補上
- [x] 50.2 補寫 task 5.1、5.2、9.3 的紅燈測試（目前未寫）
- [x] 50.3 執行 task 11.1-11.3（Review、Chrome MCP 或 `/ego-browser` 截圖、`pnpm build` + `pnpm test` 全綠），未做則補做
- [x] 50.4 修 `modules/shared/lib/nav-menu-items.test.ts` 6/7 測試失敗（2026-08-21 跑 `pnpm --filter @startkiter/saas test` 時發現，非本次 bundles-coupons 改動造成——`git status` 確認 `nav-menu-items.ts`／`.test.ts` 皆非本輪 diff）：`adminItem`／`courseItem` 找不到對應 route path（`/admin/users` 解析成 undefined）、`getTabBarItems` 回傳的 fixed/overflow 分組數量與測試預期（fixed 3／overflow 1）不符，研判是 commit `c7755156` 補進來的 Phase 2 WIP 本身就帶著失敗測試，需重新對照 task 9.1-9.3 spec 排查
- [x] 50.5（2026-08-21 發現＋當場修復，PM 親自跑真實 e2e 才抓到）`nav-menu-items.ts` import 整個 `@startkiter/platform` barrel，barrel re-export 了會拉進 Prisma/`pg` 的 server-only `deployment/db.ts`，被 `"use client"` 的 NavBar 引用後把 server-only 依賴帶進瀏覽器端 bundle，導致 `pnpm build` 失敗、`(authenticated)` 底下所有路由（`admin/bundles`、`settings/security`、`course` 等）dev/prod 皆 500。改成只 import `@startkiter/platform/src/mount-points`／`@startkiter/platform/src/types` 子路徑，不經過完整 barrel（commit `3f5a6963`）。**教訓**：派工任務的驗收清單只跑了 `pnpm test`／`type-check`，沒跑 `pnpm build`，才沒抓到這種 server/client boundary 問題——之後任何改 `"use client"` 元件的 import 都要補跑一次 `pnpm build` 才算過關
- [ ] 50.6（2026-08-21 e2e 順帶發現，不修，先記）`/admin` 後台頁首（Administration / Manage your application. / Users / Organizations 等字樣）未翻譯，是既有缺口非本輪改動造成，需要另外排進 i18n 相關 task 處理
- [x] 50.7（2026-08-21 派 agy 修復，agy 額度用完中斷、自報「已完成」但實際只改了兩個斷言的措辭、真正的數值斷言仍是舊的 `["課程"]`／`fixed.length toBe(1)`，PM 親自跑真實 MOUNT_POINTS 內容核對後重寫：learner 應看到 4 項（開始/課程/客服/帳號設定）、operator 應看到 6 項（+後台設定/課程綁定包），`9.3` 改測「≤3 項不產生 overflow」這個真正在測的不變量而非硬套 4 項真實 MOUNT_POINTS 卻期待 fixed=1。**教訓再次印證**：派工自報「完成」不可信，尤其是額度中斷後的收尾回報，merge 進來前必須自己核對斷言跟真實實作是否一致，不能只看測試檔案有沒有變動
