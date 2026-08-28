## Context

StartKiter monorepo 目前 `apps/` 只有 `marketing`（行銷首頁）與 `saas`（登入後產品本體）兩個 app，比對官方框架 `/Users/fishtv/Development/supastarter-nextjs/apps/` 少了 `docs`（技術文件站）與 `mail-preview`（開發用 email 樣板預覽，非本次範圍）。官方 `apps/docs` 用 Fumadocs（`fumadocs-core@16.9.3`／`fumadocs-mdx@15.0.10`／`fumadocs-ui@16.9.3`），內容組織是 `content/docs/**/*.mdx` + 各層 `meta.json` 定義導覽順序，`app/[[...slug]]/page.tsx` 一個 catch-all route 讀取所有內容。`source.config.ts` 用 `defineDocs({ dir: "content/docs" })` 定義集合，`fumadocs-mdx` 在 `postinstall` 階段產生型別安全的 source。

買家取得的是「完整可寫的專屬 GitHub 私有倉庫」（非官方框架的唯讀 collaborator 權限），現有可用的原始材料：`README.md`（開發啟動指令、VPS Docker 自架段落已存在）、`docs/core-boundary-and-extension-guide.md`（Core／Plugin 邊界完整定義，含 Mount Points 型別防護機制）、`apps/saas/.env.example`（88 個環境變數，19 行註解）。這些材料是給 AI 工具或開發者直接讀原始碼庫用的，格式（純 Markdown 表格、程式碼片段）跟語氣都不是設計給人類買家在瀏覽器裡導覽查閱的文件站體驗（沒有導覽側欄、沒有全文搜尋、沒有分類分頁）。

`pnpm-workspace.yaml` 的 `apps/*` glob 已涵蓋任何新增的 `apps/docs`，不需要改 workspace 設定本身。

## Goals / Non-Goals

**Goals:**

- 新增 `apps/docs` app，用 Fumadocs 建立買家可瀏覽、可全文搜尋的技術文件站
- 涵蓋四個核心章節：環境變數設定、本地開發啟動流程、Core／Plugin 擴充邊界、Upstream Sync 機制，內容改寫自現有材料，不是憑空重新設計規則
- 部署指引章節先搭骨架（章節標題 + 簡短占位說明），不寫實際操作步驟

**Non-Goals:**

- 不重寫或搬遷 `docs/` 資料夾內幾十份給 AI 工具讀的內部開發規範全文，只挑環境變數、開發啟動、Core／Plugin 邊界、Upstream Sync 這四塊改寫成買家能看懂的文件站內容
- 不寫 VPS 實際部署操作步驟的正式文件內容（`vps-production-deployment` change 完成、有實際跑通的流程之後才回填，這次只留章節骨架，避免把沒驗證過的步驟當正式文件發布給買家）
- 不做行銷網站的任何內容變更（`marketing-site-real-content` change 的範圍）
- 不做多語言：現有 i18n 涵蓋 zh-tw／zh-cn／en／de／fr／es，這次文件站只做繁體中文（zh-tw），Fumadocs 本身不需要接 `@startkiter/i18n`，之後有需求再擴充
- 不做站內登入/權限保護：文件站是公開靜態內容（不含機密），比照 marketing app 對外公開，不接 Better Auth

## Decisions

### Decision: 文件站技術棧照抄官方框架 Fumadocs 版本，不重新選型

`apps/docs` 直接採用官方 `supastarter-nextjs` 框架 `apps/docs` 的技術棧：`fumadocs-core@16.9.3`、`fumadocs-mdx@15.0.10`、`fumadocs-ui@16.9.3`，檔案佈局比照 `source.config.ts`（`defineDocs({ dir: "content/docs" })`）、`app/[[...slug]]/page.tsx` catch-all route 讀取 `content/docs/**/*.mdx`、各層資料夾用 `meta.json` 定義導覽順序與分類。`package.json` 的 `dev` script 使用 port 3002（比照官方框架慣例，避開 `apps/marketing` 既有的 3001 與 `apps/saas` 既有 port），`postinstall` 執行 `fumadocs-mdx` 產生型別安全的 content source。

Alternatives Considered:
- 用 Docusaurus 或 Nextra 等其他文件站框架 → 否決：官方框架已經驗證過 Fumadocs 跟 monorepo 內既有的 Next.js／Tailwind 生態相容，重新選型只是換一套要重新學的工具鏈，沒有實質收益，且買家日後若要參考官方框架的文件站更新方式，技術棧一致才好比對
- 用純 Markdown 靜態頁面（不用 Fumadocs，直接用 `apps/marketing` 現有的 file-based content 模式）→ 否決：文件站需要導覽側欄、分類分頁、全文搜尋，這些是 Fumadocs 內建能力，純手刻 Markdown 頁面要重新做這些 UI，不符合「文件站」該有的基本體驗

### Decision: 內容改寫自既有材料，四個章節各自對應一份原始檔案

- 「環境變數設定」章節內容對照 `apps/saas/.env.example`（88 個環境變數、19 行既有註解），依 `.env.example` 現有的分組順序（如 Database／Auth／Payments／Mail 等區塊，若該檔案本身沒有明確分組標記，則依變數名稱前綴歸類）整理成表格，每個變數標示「必填／選填」（判斷依據：程式碼中該環境變數是否有 `?? ""` 或其他預設值 fallback，若有預設值視為選填，否則視為必填），不重新設計環境變數本身的意義或新增/移除任何一個變數
- 「本地開發啟動流程」章節內容直接改寫自 `README.md` 現有的「自架 VPS（Docker）」段落之前的開發指令（`pnpm install`／`pnpm dev` 等），不重新設計啟動流程本身
- 「Core／Plugin 邊界」章節內容改寫自 `docs/core-boundary-and-extension-guide.md` 全文六個段落（Core 邊界定義表格、Plugin 掛載點規則、買家修改 Core 的權利與免責聲明、TypeScript 型別防護機制、交易型資料規格演進指引、擴充檢查清單），用買家能看懂的語氣重新組織，但邏輯規則本身（哪些是 Core、Mount Points 三種類型、`dataSpec` 只允許 `content`／`none`）必須逐字對應原文件，不得引入原文件沒有的新規則
- 「Upstream Sync 機制」章節內容改寫自 `docs/core-boundary-and-extension-guide.md` 第 3 節「Upstream Sync 衝突責任」段落，說明 `git fetch startkiter-upstream` + `git merge` 指令與買家自行修改 Core 後的衝突責任歸屬

Alternatives Considered:
- 直接把 `docs/core-boundary-and-extension-guide.md` 整份檔案原封不動塞進文件站當一頁 → 否決：該文件開頭明講是給 AI 工具讀的內部規範格式（Markdown 表格＋TypeScript 型別片段密度高），買家在瀏覽器閱讀體驗會很差，需要拆成 Fumadocs 的多頁結構＋更口語化的說明，才是文件站該有的體驗

## Implementation Contract

**Behavior:**
- 買家（或任何訪客）造訪 `apps/docs` 的首頁（`/`），看到文件站導覽首頁，可透過側邊導覽或全文搜尋找到「環境變數設定」「本地開發啟動」「Core／Plugin 邊界」「Upstream Sync」「部署指引（骨架）」五個章節內容
- 每個章節頁面內容可正確渲染 MDX（含表格、程式碼區塊語法高亮）
- `pnpm --filter @startkiter/docs dev` 可在 port 3002 啟動本地開發伺服器
- `pnpm --filter @startkiter/docs build` 可產出正式建置

**Interface / data shape:**
- `apps/docs/package.json` 的 `name` 為 `@startkiter/docs`，比照官方框架 script 慣例：`dev`（`next dev --port 3002`）、`build`（`next build`）、`type-check`（`fumadocs-mdx && next typegen && tsc --noEmit`）
- `apps/docs/source.config.ts`：`defineDocs({ dir: "content/docs" })`
- `apps/docs/content/docs/` 目錄結構：
  ```
  content/docs/
    index.mdx
    meta.json
    getting-started/
      environment-variables.mdx
      local-development.mdx
      meta.json
    core-and-plugins/
      core-boundary.mdx
      upstream-sync.mdx
      meta.json
    deployment/
      overview.mdx
      meta.json
  ```
- 每份 `meta.json` 遵循 Fumadocs `metaSchema` 格式：`{ "title": string, "pages": string[] }`

**Failure modes:**
- 若某份 `.mdx` 檔案 frontmatter 缺少必填欄位（`title`），`fumadocs-mdx` 於 `postinstall`／`type-check` 階段會直接報錯中斷建置，不會讓建置帶著壞內容通過
- 文件站本身不接資料庫、不接 API，沒有執行期錯誤處理需求（純靜態內容渲染）

**Acceptance criteria:**
- `pnpm --filter @startkiter/docs type-check` 通過（含 `fumadocs-mdx` 內容型別檢查）
- `pnpm --filter @startkiter/docs build` 成功產出建置
- 用 ego-browser skill 實際瀏覽本地開發伺服器，確認五個章節頁面都能點擊進入、內容正確渲染、全文搜尋功能可用
- `pnpm type-check`（全 monorepo）與 `pnpm build`（全 monorepo）不因新增此 app 而破壞既有 app 的建置

**Scope boundaries:**
- In scope：`apps/docs` app 本體、四個內容章節的實質內容、部署指引章節骨架、全文搜尋與導覽功能
- Out of scope：VPS 部署實際操作步驟內容、行銷網站任何頁面、多語言內容、站內登入保護

## Risks / Trade-offs

- [Risk] 「Core／Plugin 邊界」文件內容若跟 `packages/platform/src/types.ts`、`packages/platform/src/mount-points.ts` 實際程式碼日後出現落差（例如未來新增第四種 Mount Kind），文件站內容會過期誤導買家 → Mitigation: 這次撰寫時逐一核對 `docs/core-boundary-and-extension-guide.md` 描述的型別防護機制（`dataSpec` 只允許 `"content" | "none"`、Mount Kind 只允許 `route`／`menu`／`content`）與 `packages/platform/src/types.ts` 實際定義一致，CR 階段明確列為檢查項；長期維護不在本次 change 範圍內
- [Risk] 環境變數「必填／選填」判斷若誤判（例如某變數其實有預設值但被標成必填），會誤導買家以為部署卡住 → Mitigation: 逐一對照程式碼中該環境變數的實際讀取方式（有無 `??` fallback 或 zod schema 的 `.optional()`）再標記，不是憑變數名稱猜測
- [Risk] 部署指引章節骨架若寫太多細節，可能被誤認為是完整正式文件 → Mitigation: 骨架頁面明確標註「詳細部署步驟撰寫中，正式上線後回填」字樣，不寫任何未驗證的具體指令

## Migration Plan

1. 新增 `apps/docs/` 完整檔案結構與內容
2. 安裝 `fumadocs-core`／`fumadocs-mdx`／`fumadocs-ui` 依賴
3. 本地驗證 `pnpm --filter @startkiter/docs dev`／`build`／`type-check` 皆通過
4. 確認新增此 app 不影響既有 `pnpm type-check`／`pnpm build`（全 monorepo）
5. 此次不涉及正式環境部署（部署本身是 `vps-production-deployment` change 的範圍），文件站先能在本地與既有 CI 跑通即可

**Rollback**：`apps/docs/` 是全新獨立 app，未被任何既有 app 引用，直接刪除該目錄即可回滾，不影響 `marketing`／`saas` 既有功能。

## Open Questions

- 文件站上線後要掛在哪個網域路徑（例如 `docs.startkiter.dev` 獨立子網域，或 `startkiter.dev/docs` 路徑），這是 `vps-production-deployment` change 網域規劃時才需要決定的事，這次先不決定，本地開發與建置驗證不受影響
