## Why

StartKiter 要從「賣一次性代碼包」進化成「買家用 AI 工具自助擴充、push 後自動部署」的教學 SaaS 平台。2026-08-18 老闆定案三個方向：(1) 部署管線改用 Coolify VPS / Vercel 原生 git-push-auto-deploy，不再客製打包工具或 MCP 推送安裝包；(2) 後台 Shell 統一與 Mount Points 掛載機制必須對照 rebuild-from-official-upstream 之後的真實檔案結構重新設計；(3) 給純小白買家「選模版」的體驗，而非丟一片空白畫布。

這是對原 `platform-shell-plugin-architecture` change 的大幅修訂，取代其舊版 proposal/design/tasks。Phase 1 那 12 個打勾 task 對應的檔案（`app-shell.tsx`、`site-nav.tsx`、`mobile-tabbar.tsx`）在重建後已不存在，視為未完成，需重新評估。

## What Changes

- **修訂**：部署管線從「②打包工具 → ③MCP Gateway（推送安裝包）→ ④伺服器端自動 build/deploy」三層客製管線，改為完全依賴 Coolify / Vercel 原生的 git-push-auto-deploy。買家用 AI 工具改自己倉庫的代碼 → AI 幫他 commit + push → 托管平台自動重新建置部署，買家全程不碰 Git 指令或終端機
- **修訂**：Marketplace 頁面角色從「一鍵安裝商店」降級為「展示目前站上已啟用模組 + 可用模版」的展示頁，不再有「裝/解」操作按鈕
- **修訂**：MCP Gateway 用途從「推送安裝包 + 外部 AI 操作帳號」收窄為「外部 AI 連進帳號唯讀操作」單一用途，不再承擔部署管線角色
- **修訂**：Phase 1 後台 Shell 統一，對照重建後的 `apps/saas/app/(authenticated)/` + `modules/shared/components/NavBar.tsx` + `modules/lib/sidebar-context.tsx` 結構重新設計，取代舊的 `app-shell.tsx` / `site-nav.tsx` 路徑
- **新增**：Plugin manifest 與 Mount Points 機制維持架構意圖（路由/選單/內容/資料表四種掛載方式），但實作路徑對齊新的模組結構
- **新增**：買家 UI 模版選擇（`buyer-template-selection`）——買家在 Marketplace 頁面選擇預設模版（版面風格 + Dashboard 排版），模版本質是一組預設的掛載點配置 + 樣式 token 組合，v1 提供 2-3 個內建模版，不整合 refero.design MCP
- **新增**：Core 邊界聲明維持不變（金流/通知/頁面編輯/課程引擎固定 Core）
- **BREAKING**：後台導覽元件結構改變，既有以舊 SiteNav/AppShell 結構為準的 E2E 測試選擇器需同步更新

## Non-Goals

- 不建客製打包工具——部署改走 git-push-auto-deploy，不需要把模組壓成安裝檔
- 不建 MCP Gateway 推送安裝包功能——部署不經 MCP，MCP Gateway 只做外部 AI 連進帳號唯讀操作
- 不做「一鍵裝/解 Plugin」的 Marketplace 操作介面——買家的「安裝」就是 AI 幫他改代碼再 push
- 不做真正的 zip 上傳安裝流程
- 不做 block editor / shortcode 解析器實作
- 不做交易型 Plugin migration 工具鏈
- 不做 Agent 管理 Plugin
- 此 change 不定義 StartKiter AI 反向連線客戶伺服器的機制本身——這屬於部署主機模式的維運決策，見 `coolify-managed-deployment`（該 change 定案：Tier 2／集中管理模式下，StartKiter 可反向連線協助；Tier 1／自行部署模式下維持不連線）
- 不改動 `/checkout`、`/`、`/login`、`/signup` 的版面
- 不處理 Organization 多租戶、電子發票範圍（另開 change）
- 不整合 refero.design MCP（v1 僅內建模版，refero.design 留作後續探索）
- 不重寫金流/Email/LINE 通知/頁面編輯系統本身的實作

## Capabilities

### New Capabilities

- `platform-mount-points`: Core 提供的四種掛載點機制（路由/資料表/選單/前台區塊）與 Plugin manifest 格式規範
- `platform-marketplace`: Plugin 展示與模版選擇介面，基於掛載點機制列出已啟用模組與可選模版
- `mcp-gateway`: 授權外部 AI 工具透過固定 endpoint 連線唯讀操作帳號，管理連線清單
- `platform-core-boundary`: Core 與 Plugin 的能力邊界聲明
- `buyer-template-selection`: 買家 UI/後台模版選擇機制，提供預設版面風格供小白買家起步

### Modified Capabilities

- `saas-shell`: 導覽元件對照重建後結構重新設計，涵蓋所有已登入路由
- `course-module`: 新增課程模組作為官方示範 Plugin 的 manifest 宣告

## Impact

- Affected specs: saas-shell、course-module（modified）；platform-mount-points、platform-marketplace、mcp-gateway、platform-core-boundary、buyer-template-selection（new）
- Affected code:
  - New: `packages/platform/`（掛載點機制與 manifest 型別）、`apps/saas/app/(authenticated)/(main)/marketplace/`、`apps/saas/app/api/mcp/`、`packages/platform/src/templates/`（內建模版定義）
  - Modified: `modules/shared/components/NavBar.tsx`、`modules/lib/sidebar-context.tsx`、相關 layout 檔案
  - Dependencies 新增：無（沿用既有 Next.js App Router 與 Prisma）
  - 環境變數新增：無（MCP Gateway 沿用既有 BETTER_AUTH_SECRET / BETTER_AUTH_URL）
