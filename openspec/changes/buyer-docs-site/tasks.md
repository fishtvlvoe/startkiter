## 1. Fumadocs app 骨架

- [x] 1.1 新增 `apps/docs/package.json`（`name: "@startkiter/docs"`）、`next.config.ts`、`source.config.ts`（`defineDocs({ dir: "content/docs" })`）、`tsconfig.json`、`global.d.ts`，依 design.md Decision: 文件站技術棧照抄官方框架 Fumadocs 版本，不重新選型，鎖定版本 `fumadocs-core@16.9.3`／`fumadocs-mdx@15.0.10`／`fumadocs-ui@16.9.3`，比照 `/Users/fishtv/Development/supastarter-nextjs/apps/docs/` 的檔案佈局。`package.json` script：`dev`（`next dev --port 3002`）、`build`、`type-check`（`fumadocs-mdx && next typegen && tsc --noEmit`）、`postinstall`（`fumadocs-mdx`）。驗證目標：`pnpm install` 成功解析新依賴，`pnpm --filter @startkiter/docs type-check` 在只有空 `content/docs/index.mdx`（含合法 frontmatter）情況下不報錯
- [x] 1.2 [P] 新增 `apps/docs/app/layout.tsx`、`apps/docs/app/[[...slug]]/page.tsx`、`apps/docs/app/global.css`、`apps/docs/lib/source.ts`、`apps/docs/mdx-components.tsx`，實現 Requirement「A dedicated docs app renders buyer-facing technical documentation」的頁面渲染與導覽骨架，`[[...slug]]` catch-all route 讀取 `content/docs/**/*.mdx` 並渲染側邊導覽。驗證目標：`pnpm --filter @startkiter/docs dev` 啟動後手動瀏覽 `/` 首頁能看到側邊導覽（此時內容章節尚未填入，先驗證骨架能跑）

## 2. 環境變數設定頁面

- [x] 2.1 新增 `apps/docs/content/docs/getting-started/environment-variables.mdx` 與 `apps/docs/content/docs/getting-started/meta.json`，依 design.md Decision: 內容改寫自既有材料，四個章節各自對應一份原始檔案，逐一讀取 `apps/saas/.env.example` 全部 88 個環境變數，依該檔案既有分組順序整理成表格（欄位：變數名稱、必填/選填、用途說明），必填/選填判斷依據為該變數在程式碼中是否有預設值 fallback（有 `??` 或 zod `.optional()` 視為選填，否則必填），實現 Requirement「Documentation covers environment variables, local development, Core/Plugin boundaries, and upstream sync」的環境變數 Scenario。驗證目標：手動核對頁面表格列數等於 `apps/saas/.env.example` 內 `grep -oE "^[A-Z0-9_]+=" apps/saas/.env.example | wc -l` 的變數數量（88），逐一抽查至少 10 個變數的必填/選填標記與程式碼實際 fallback 行為一致

## 3. 本地開發啟動頁面

- [x] 3.1 新增 `apps/docs/content/docs/getting-started/local-development.mdx`，內容改寫自 `README.md` 現有開發指令段落（`pnpm install`／`pnpm dev` 等）與「自架 VPS（Docker）」段落之前的既有內容，不新增或修改任何指令本身。驗證目標：頁面內每一條指令都能在 `README.md` 原文中找到逐字或語意對應的來源，無新增指令

## 4. Core／Plugin 邊界頁面

- [x] 4.1 新增 `apps/docs/content/docs/core-and-plugins/core-boundary.mdx` 與 `apps/docs/content/docs/core-and-plugins/meta.json`，依 design.md Decision: 內容改寫自既有材料，四個章節各自對應一份原始檔案，改寫 `docs/core-boundary-and-extension-guide.md` 第 1、2、3、4、5、6 節（Core 模組邊界表格、Plugin 掛載點規則、買家修改 Core 的權利與免責聲明、TypeScript 型別防護機制、交易型資料規格演進指引、擴充檢查清單），實現 Requirement「Documentation covers environment variables, local development, Core/Plugin boundaries, and upstream sync」的 Core/Plugin 邊界 Scenario。逐一核對頁面列出的 Core 模組清單與 `packages/platform/src/types.ts` 的 `PluginManifest` 型別定義（`mount.route`／`mount.menu`／`mount.content`、`dataSpec: "content" | "none"`）完全一致。驗證目標：頁面內容與 `docs/core-boundary-and-extension-guide.md` 逐段對照無遺漏，且與 `packages/platform/src/types.ts` 實際型別定義一致

## 5. Upstream Sync 頁面

- [x] 5.1 新增 `apps/docs/content/docs/core-and-plugins/upstream-sync.mdx`，改寫自 `docs/core-boundary-and-extension-guide.md` 第 3 節「Upstream Sync 衝突責任」段落，說明 `git fetch startkiter-upstream` + `git merge` 指令與買家自行修改 Core 後的衝突責任歸屬，實現 Requirement「Documentation covers environment variables, local development, Core/Plugin boundaries, and upstream sync」的 upstream sync Scenario。驗證目標：頁面內容涵蓋原文件該段落的兩個要點（官方更新同步指令、買家自改 Core 後衝突自負）無遺漏

## 6. 部署指引骨架

- [x] 6.1 新增 `apps/docs/content/docs/deployment/overview.mdx` 與 `apps/docs/content/docs/deployment/meta.json`，依 design.md Risk「部署指引章節骨架若寫太多細節，可能被誤認為是完整正式文件」的 Mitigation，只寫章節標題與明確標註「詳細部署步驟撰寫中，正式上線後回填」的占位說明，不含任何具體部署指令，實現 Requirement「Deployment documentation is scaffolded but explicitly marked incomplete」。驗證目標：頁面內容不含任何可執行的 shell 指令或具體操作步驟，只有標題與占位說明文字

## 7. 首頁與導覽整合

- [x] 7.1 新增 `apps/docs/content/docs/index.mdx` 與根層 `apps/docs/content/docs/meta.json`，整合前 6 個 task 建立的三個分類（`getting-started`／`core-and-plugins`／`deployment`）到首頁導覽，依 Fumadocs `metaSchema` 格式（`{ "title": string, "pages": string[] }`）設定各層導覽順序，實現 Requirement「A dedicated docs app renders buyer-facing technical documentation」的首頁與導覽 Scenario。驗證目標：`pnpm --filter @startkiter/docs dev` 啟動後首頁側邊導覽顯示三個分類、各分類下的頁面皆可點擊進入且內容正確渲染

## 8. Review 與回歸驗證

- [x] 8.1 grep `pnpm-workspace.yaml`／`turbo.json` 確認新增的 `apps/docs` 被既有 `apps/*` workspace glob 與 turbo pipeline 涵蓋，若 `turbo.json` 既有 pipeline 規則需要納入新 app 的 build／dev task 才調整，不修改跟本次無關的既有 pipeline 設定，實現 Requirement「Adding the docs app does not break existing monorepo builds」的兩個 Scenario。驗證目標：`pnpm type-check`（全 monorepo）與 `pnpm build`（全 monorepo）皆通過，`apps/marketing`／`apps/saas` 既有建置輸出不因新增 `apps/docs`而改變
- [x] 8.2 派 Codex 或等效工具對本次全部 diff（task 1-7）做 Code Review（correctness／security／performance 三角度）：correctness 確認「Core／Plugin 邊界」頁面內容與 `packages/platform/src/types.ts` 實際型別定義（`dataSpec` 僅允許 `"content" | "none"`、Mount Kind 僅允許 `route`／`menu`／`content`）逐一核對一致、不誤導買家；security 確認文件站內容不洩漏任何機密資訊（環境變數頁面只列變數名稱與必填/選填標記，不含任何 `.env.local`／`.env` 的實際金鑰值或憑證片段）；performance 確認 Fumadocs 全文搜尋索引未因內容量小而有明顯建置效能問題。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 8.3 用 ego-browser skill 跑一次完整 e2e：啟動 `apps/docs` 本地開發伺服器 → 瀏覽首頁確認導覽側欄顯示三個分類 → 依序點入「環境變數設定」「本地開發啟動」「Core／Plugin 邊界」「Upstream Sync」「部署指引」五個頁面確認內容正確渲染（表格、程式碼區塊語法高亮） → 使用全文搜尋功能搜尋至少一個關鍵字（例如「PAYUNi」或「dataSpec」）確認能正確命中對應頁面。驗證目標：截圖記錄首頁導覽與至少 2 個內文頁面，任何一步失敗即視為本 task 未完成
- [x] 8.4 跑 `spectra analyze buyer-docs-site --json` 與 `spectra validate buyer-docs-site`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 8.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 與 Scope boundaries 是否全部滿足：跑 `pnpm --filter @startkiter/docs type-check`／`pnpm --filter @startkiter/docs build`／`pnpm type-check`／`pnpm build`，確認全數綠燈；`git diff --stat` 核對改動檔案清單與 Scope boundaries 一致（僅新增 `apps/docs/**`，未修改 `apps/marketing`／`apps/saas` 任何檔案，`turbo.json` 若有修改僅限納入新 app 的 pipeline 設定）。驗證目標：所有指令 exit code 為 0
