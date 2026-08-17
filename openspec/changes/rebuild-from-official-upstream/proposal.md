## Summary

整個專案改用官方 supastarter-nextjs 作為正式 git upstream 並從零重新安裝底座，取代目前手動搬遷官方原始碼/文件片段的做法；StartKiter 既有業務邏輯（auth、payments、course、github-kit、database）整包遷移進新底座，不重寫。

## Motivation

`rebuild-design-system-from-source`（已封存合併）只解決了元件庫、CSS 架構、配色、字體這幾項技術選型層面的落差，沒有解決兩個更根本的問題：一是 StartKiter 首頁等公開頁面被硬塞進 `apps/saas`，而官方架構是 `apps/marketing`（公開網站）與 `apps/saas`（產品 app + 驗證流程）兩個獨立 app，版面骨架（Logo icon、首頁瀏覽器窗格內容展示、無邊框登入卡片等）因此持續停留在憑印象詮釋的舊版樣貌；二是 StartKiter 完全沒有 git 層級的 upstream 追蹤，每次「參考官方」都是手動 clone 一份快照來比對，版本持續漂移，導致同類 bug（如本機快照抄到過時的 `--radius` 值、`packages/ui` 缺 Tailwind 建置鏈）反覆出現。已查證 StartKiter 現有業務邏輯package 化程度高（`packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit`、`packages/database` 各自有獨立 `index.ts` 公開介面與完整測試覆蓋，route handler 僅為薄接線層），遷移到官方底座是可控的「整包搬遷 + 重新接線 + 既有測試驗證」，不是重寫，值得現在一次做對。

## Proposed Solution

五層由下而上依序施工，下層未完成不動上層：

1. **建立官方 upstream 追蹤**：`git remote add upstream https://github.com/supastarter/supastarter-nextjs.git`，之後官方更新透過 `git fetch upstream && git merge upstream/main` 拉取，衝突只發生在真正客製化過的檔案。
2. **官方底座完整安裝**：照 `docs/reference/supastarter-nextjs-docs/setup.mdx` 從零建立一份乾淨的官方 monorepo（`apps/marketing` 全部頁面、`apps/saas` login/signup + 官方後台殼、`packages/ui`、`packages/tooling`），不夾帶任何 StartKiter 客製化。
3. **遷移 StartKiter 業務邏輯**：`packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit`、`packages/database` 整包搬進新底座，route handler 在新底座重新接線，`schema.prisma` 與官方預設 model 合併、migration 重新產生，用既有測試套件與已封存的 Spectra spec 行為契約逐一驗證。
4. **中文語系**：在乾淨底座上只加一件事——多一個 `zh-tw` locale，改用官方 next-intl 架構取代 StartKiter 自製的 `@startkiter/i18n`，其餘頁面結構、元件、版面不動。

第五層（StartKiter 客製化：WordPress 式 Core/Theme/Plugin 架構、課程外掛模組）明確排除在本次範圍外，見 Non-Goals。

## Non-Goals

- 不做 StartKiter 客製化的 WordPress 式 Core/Theme/Plugin 架構與課程外掛模組——排入後續 change，待本次四層都驗證穩定才開工
- 不改變商業規則本身：結帳金額鎖 8800 TWD、PAYUNi 為唯一金流、GitHub kit 履約流程、課程存取權限規則——只搬遷這些邏輯的技術實作位置，不重新設計行為
- 不刪除現有 repo：新底座在獨立目錄/分支建立並完整驗證通過後才切換生產環境指向，保留舊版本可回滾
- 不在本次順帶做 `platform-shell-plugin-architecture` Phase 2（Plugin manifest、Marketplace、MCP Gateway）範疇
- 不修改 `vendor/supastarter-nextjs/` 來源本身，僅唯讀參考

## Alternatives Considered

1. 只在現有 repo 裡新增 `apps/marketing` 資料夾，`apps/saas`、`packages/*` 維持原樣不動——否決：不解決「沒有 upstream 追蹤」這個根本問題，官方持續更新時 StartKiter 仍然只能手動比對，同類版本漂移的 bug 會反覆重演；且現有 `apps/saas`、`packages/ui` 本身可能還有其他未發現的技術債（如這次發現的 Tailwind 建置鏈缺失），局部修補無法保證徹底對齊
2. 用腳本自動化比對 StartKiter 與官方版本差異，持續增量修補——否決：今晚已經證明這種「發現一個問題修一個」的模式會不斷遺漏（先漏了 Tailwind 建置鏈，又漏了版面骨架），沒有從源頭解決版本追蹤問題，治標不治本

## Impact

- Affected specs: `saas-shell`（修改：路由服務者從單一 `apps/saas` 拆分為 `apps/marketing` + `apps/saas` 兩個 app，移除與 `i18n-multilingual` 重複定義的「Locale is zh-TW only」Requirement）。`i18n-multilingual` capability 的 spec 本來就要求使用 next-intl 架構，本次是修正實作去對齊既有 spec，不修改 spec 文字本身
- Affected code:
  - New: 官方 upstream git remote 設定、新底座的 `apps/marketing` 目錄結構、`packages/tooling`（Tailwind 主題共用包，已在前一輪建立）
  - Modified: `packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit`、`packages/database`（遷移進新底座，重新接線，內部邏輯不變）、`apps/saas`（瘦身為 login/signup + 後台殼）、`packages/i18n`（換成 next-intl 架構）
  - Removed: 舊 `apps/saas` 內公開頁面（首頁等，搬遷到 `apps/marketing`）
- Dependencies 新增：`next-intl`（取代自製 i18n）；`@base-ui/react`、`@tailwindcss/postcss`、`tailwindcss`（已在前一輪安裝，新底座延續）
- 環境變數新增：無
