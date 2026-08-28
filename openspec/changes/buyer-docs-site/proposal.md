## Why

StartKiter 現行 `apps/` 只有 `marketing`、`saas` 兩個 app，買家付款拿到專屬 GitHub 私有倉庫後，除了 `README.md` 開發者段落與內部給 AI 工具讀的 `docs/core-boundary-and-extension-guide.md`、`docs/buyer-extension-convention.md` 之外，沒有任何一個給人類買家瀏覽的技術文件站可以查環境變數、開發啟動、Core／Plugin 擴充邊界。對照組 supastarter.dev（Fish 明確要求交付體驗要對齊的目標）官方框架 `apps/docs` 就是獨立的 Fumadocs 文件站，這是買家自助排除障礙的第一線，現在完全空白。

## What Changes

- 新增 `apps/docs/` app：Next.js + Fumadocs（`fumadocs-core`／`fumadocs-mdx`／`fumadocs-ui`），比照官方框架 `/Users/fishtv/Development/supastarter-nextjs/apps/docs/` 的技術棧與檔案佈局（`content/docs/**/*.mdx` + `meta.json` 導覽 + `app/[[...slug]]/page.tsx` catch-all）
- 新增文件內容，涵蓋四個章節：環境變數設定、本地開發啟動流程、Core／Plugin 邊界說明、Upstream Sync 機制說明，內容改寫自既有的 `README.md`、`docs/core-boundary-and-extension-guide.md`、`apps/saas/.env.example`（88 個環境變數）
- 新增「部署指引」章節骨架（僅目錄與各小節標題 + 簡短占位說明，不含實際操作步驟，實際內容留給 `vps-production-deployment` change 完成後回填）
- 修改 `pnpm-workspace.yaml`／`turbo.json`：確認新 app 被既有 `apps/*` glob 與 turbo pipeline 涵蓋（`pnpm-workspace.yaml` 已含 `apps/*`，預期免改；`turbo.json` 視實際 pipeline 設定需要才調整）
- 新增 `apps/docs/package.json` 的 `dev`（port 3002，比照官方框架慣例，避開 marketing 的 3001／saas 既有 port）、`build`、`type-check` script

## Capabilities

### New Capabilities

- `buyer-docs-site`：給付費買家使用的技術文件站，涵蓋環境變數、本地開發、Core/Plugin 擴充邊界、部署指引骨架四大章節

### Modified Capabilities

(none)

## Impact

- Affected specs: `buyer-docs-site`（新增）
- Affected code:
  - New:
    - `apps/docs/package.json`
    - `apps/docs/next.config.ts`
    - `apps/docs/source.config.ts`
    - `apps/docs/app/layout.tsx`
    - `apps/docs/app/[[...slug]]/page.tsx`
    - `apps/docs/app/global.css`
    - `apps/docs/lib/source.ts`
    - `apps/docs/mdx-components.tsx`
    - `apps/docs/content/docs/index.mdx`
    - `apps/docs/content/docs/meta.json`
    - `apps/docs/content/docs/getting-started/environment-variables.mdx`
    - `apps/docs/content/docs/getting-started/local-development.mdx`
    - `apps/docs/content/docs/getting-started/meta.json`
    - `apps/docs/content/docs/core-and-plugins/core-boundary.mdx`
    - `apps/docs/content/docs/core-and-plugins/upstream-sync.mdx`
    - `apps/docs/content/docs/core-and-plugins/meta.json`
    - `apps/docs/content/docs/deployment/overview.mdx`
    - `apps/docs/content/docs/deployment/meta.json`
    - `apps/docs/tsconfig.json`
    - `apps/docs/global.d.ts`
  - Modified:
    - `turbo.json`（若既有 pipeline 規則需要納入新 app 的 build／dev task）
  - Removed: 無
- Dependencies 新增：`fumadocs-core`、`fumadocs-mdx`、`fumadocs-ui`（比照官方框架鎖定版本 `16.9.3`／`15.0.10`／`16.9.3`）
- 環境變數新增：無，文件站本身不需要專屬環境變數
