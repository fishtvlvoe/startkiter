# Code Review 報告 — 2026-08-28

獨立審查：StartKiter `buyer-docs-site`（全新 context，只讀不改檔）

審查範圍：`apps/docs/**`（Fumadocs 文件站）＋預期的 `pnpm-lock.yaml` 依賴變更。`openspec/changes/buyer-docs-site/**` 僅作契約對照，不當審查主體。

契約來源：
- `openspec/changes/buyer-docs-site/tasks.md`
- `openspec/changes/buyer-docs-site/design.md` Implementation Contract
- `openspec/changes/buyer-docs-site/specs/buyer-docs-site/spec.md`
- `packages/platform/src/types.ts` 的 `PluginManifest`

審查方式：靜態讀檔對照。未實際執行 `pnpm --filter @startkiter/docs build`、dev server 或瀏覽器搜尋；執行期行為以程式碼推導，能確定的標「已核對」，其餘標「靜態分析」。

---

## Verdict: PASS

## Critical: 0

- High: 1
- Medium: 3
- Low: 4

---

### CRITICAL（0 個）

無。明確寫：**Critical: 0**

沒有硬編碼金鑰、沒有把 `.env`／`.pem` 寫進文件站、沒有讓 catch-all／tokenizer 從程式碼上必然弄壞頁面或搜尋、Core／Plugin 型別描述與 `packages/platform/src/types.ts` 一致、部署骨架沒有可執行部署指令。

---

### HIGH（1 個）

| # | 位置 | 問題 | 為何是 High | 建議 |
|---|------|------|-------------|------|
| H1 | `apps/docs/content/docs/getting-started/local-development.mdx:10-22` | 頁面兩條可執行指令 `pnpm install`、`pnpm dev` 在倉庫根目錄 `README.md` 找不到來源。`README.md` 全文沒有 `pnpm install`／`pnpm dev`；「自架 VPS（Docker）」之前也沒有本地開發指令段落。task 3.1 驗證目標是「頁面內每一條指令都能在 `README.md` 原文中找到逐字或語意對應的來源，無新增指令」。同頁還用散文提到「文件站 package 的開發指令，在 3002 port 啟動」，這也是 README 沒有的新指示。 | 不是 Critical：這兩條指令與根目錄 `package.json`（`"dev": "dotenv -c -- turbo dev --concurrency 15"`）一致，買家照做不會跑錯指令、也不會讓建置壞掉。但是契約明確要求指令必須來自 README，這項驗證目標失敗。 | 二選一：把根目錄 `README.md` 補上真實的本地開發段落後再改寫文件站；或文件站改寫 README 實際存在的文字（產品邊界、PAYUNi fail-closed、VPS 段之前的說明），不要發明 README 沒有的指令區塊。若要保留 `pnpm install`／`pnpm dev`，先改 README 再同步 docs，維持單一來源。 |

---

### MEDIUM（3 個）

| # | 位置 | 問題 | 為何是 Medium | 建議 |
|---|------|------|---------------|------|
| M1 | `apps/docs/content/docs/getting-started/environment-variables.mdx:18-24` | `BETTER_AUTH_URL` 用途寫成「Better Auth 對外基準網址」且標必填；`NEXT_PUBLIC_SAAS_URL` 標選填。實際 `packages/auth/auth.ts` 的 Better Auth `baseURL`／`trustedOrigins` 吃的是 `getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000)`。`BETTER_AUTH_URL` 真正用在結帳對外 origin（`apps/saas/app/api/checkout/route.ts` 的 `resolvePublicBaseUrl(process.env.BETTER_AUTH_URL)`，缺了回 503）。必填／選填標記本身大致符合「有 fallback → 選填」規則，且 `NEXT_PUBLIC_SAAS_URL` 用途已寫「需要連結到已部署 SaaS 時要填」，所以不是完全沒提示。 | 仔細讀的買家不會踩坑；只填三個必填、把 `NEXT_PUBLIC_SAAS_URL` 留空的人，正式環境 Auth／OAuth callback 可能指到 `localhost`。會誤導，但文件已有部署時要填的但書，未達 Critical。 | 用途改成：`BETTER_AUTH_URL`＝結帳／對外 origin；`NEXT_PUBLIC_SAAS_URL`＝Better Auth `baseURL`。部署時兩個都要填成正式網址。 |
| M2 | `apps/docs/content/docs/core-and-plugins/core-boundary.mdx` | task 4.1 要求改寫 `docs/core-boundary-and-extension-guide.md` 第 1–6 節，並「逐段對照無遺漏」。原文第 2 節第 5 點「部署流程」（AI 改模組 → `git commit` + `git push` → Coolify／Vercel git-push-auto-deploy）沒有寫進此頁。其餘 Core 表、三種 Mount、`dataSpec`、免責、型別防護、交易型資料、檢查清單都有對上。 | 漏的是官方 Plugin 怎麼上線，不是型別錯誤，也不會讓買家用錯 `dataSpec`。部署細節依契約本就不該寫成正式 SOP，但「push 後自動建置」這句不是 VPS 操作步驟，省略後買家不知道 Plugin 的官方落地路徑。 | 用一句非操作步驟的說明補回：改 Plugin 後 commit／push，由既有 git-push-auto-deploy 建置；不要寫 Docker／Coolify 具體指令。 |
| M3 | `apps/docs/next.config.ts:8-14` | 抄了官方 Fumadocs／supastarter 的 rewrite：`/:path*.mdx` → `/llms.mdx/:path*`，但沒有抄 `app/llms.mdx/[[...slug]]/route.ts`。對照 `/Users/fishtv/Development/supastarter-nextjs/apps/docs/`，那邊有該 route，用 `getLLMText` 回原始 markdown。StartKiter 的 `source.config.ts` 已開 `includeProcessedMarkdown: true`，卻沒有消費端。 | 正常文件 URL（不帶 `.mdx`）與 `/api/search` 不會被這條 rewrite 攔到，頁面／搜尋不應因此壞掉。只有人訪問 `*.mdx` 會 404。建置也不會因為 rewrite 目的地不存在而失敗。屬不完整抄模板，不是執行期必壞。 | 刪掉這條 rewrite（本次不需要 LLM markdown 端點）；或把官方 `app/llms.mdx/[[...slug]]/route.ts` 一併補齊。不要留半套。 |

---

### LOW（4 個）

| # | 位置 | 問題 | 為何是 Low | 建議 |
|---|------|------|-----------|------|
| L1 | `apps/docs/content/docs/getting-started/local-development.mdx:22` | 用散文說可以只啟動文件站、port 3002，但沒寫 `pnpm --filter @startkiter/docs dev`。 | 沒有給出會跑錯的指令，只是不完整。真正可執行的只有 `pnpm install`／`pnpm dev`。 | 要嘛寫完整指令（先確保 README 有來源），要嘛刪掉 3002 這句，避免買家去猜。 |
| L2 | `apps/docs/content/docs/core-and-plugins/upstream-sync.mdx:10-13` | 原文是 `git fetch startkiter-upstream` + `git merge`；文件寫成 `git merge startkiter-upstream/main`。 | spec 要求描述 fetch + merge 工作流，有寫到。目前官方預設分支是 `main`，實務上合理；若買家 remote 預設分支不同會失敗。 | 維持原文抽象（`git merge`）並註明常見目標是 `startkiter-upstream/main`，或寫「合併該 remote 的預設分支」。 |
| L3 | `apps/docs/content/docs/meta.json` | Implementation Contract 寫每份 `meta.json` 為 `{ "title": string, "pages": string[] }`。根層只有 `pages`，沒有 `title`。 | Fumadocs `metaSchema` 的 `title` 是 optional；官方 `supastarter-nextjs/apps/docs/content/docs/meta.json` 同樣沒有 title。不影響建置與導覽。 | 若要嚴守契約，補 `title`。否則可忽略。 |
| L4 | `apps/docs/app/layout.tsx:10-16` | `lang="zh-TW"` 但字體只有 `Inter({ subsets: ["latin"] })`。 | 中文會退回系統字，可讀、不影響正確性／安全。 | 之後可加 Noto Sans TC 或允許系統中文字族 fallback。 |

---

## 三個角度結論

### 1. correctness

**Core／Plugin 邊界 vs `packages/platform/src/types.ts`：無發現（型別一致）**

`core-boundary.mdx` 內嵌的 `PluginManifest` 與 `packages/platform/src/types.ts` 欄位一致：

- `dataSpec: "content" | "none"`
- `mount` 僅 `route?`／`menu?`／`content?`
- `menu` 含 `label`、`icon`、`order`、`requiresOperator?`
- `content.kind: "auto" | "shortcode" | "block"`，可選 `boundTo`

散文也寫死只有這三種掛載點，並點名 `authProvider`／`shellOverride`／`paymentGateway` 不支援，與原文第 4 節及型別防護一致。Core 五個模組表（支付、通知、認證、Shell、課程播放引擎）與 `docs/core-boundary-and-extension-guide.md` 第 1 節一致。`PluginManifest` 本身不定義 Core 清單，文件沒有把型別發明成第四種 Mount 或第三種 `dataSpec`。

**環境變數表格列數：無發現（88 = 88）**

`apps/saas/.env.example` 以 `^[A-Z0-9_]+=` 計 88 個變數。`environment-variables.mdx` 表格以 `` `| \`([A-Z0-9_]+)\` |` `` 列出同一組 88 個名稱，順序與 `.env.example` 相同。`apps/docs/content.test.ts` 用 `toEqual(sourceNames)` 鎖住名稱與順序。

抽查必填／選填（對照程式碼 fallback，超過 10 個）：

| 變數 | 文件 | 程式碼 | 判定 |
|------|------|--------|------|
| `DATABASE_URL` | 必填 | `packages/database/drizzle/client.ts` 直接 `as string` | 一致 |
| `BETTER_AUTH_SECRET` | 必填 | Better Auth 慣例必填；缺了 quiz／upload 會 throw | 一致 |
| `BETTER_AUTH_URL` | 必填 | 結帳 `resolvePublicBaseUrl` 空值 → 503 | 標記合理；用途見 M1 |
| `NEXT_PUBLIC_SAAS_URL` | 選填 | `getBaseUrl(..., 3000)` | 符合 fallback 規則 |
| `ADMIN_EMAIL` | 選填 | 空字串不授 operator | 一致 |
| `SETTINGS_ENCRYPTION_KEY` | 選填 | `?? ""` | 一致 |
| `PAYUNI_MERCHANT_ID` 等 | 選填（啟用結帳時必填） | 不完整則 fail-closed | 一致 |
| `PAYUNI_API_URL` | 選填 | `DEFAULT_API_URL` sandbox fallback | 一致 |
| `GOOGLE_CLIENT_ID` | 選填 | `getSocialProviders` 缺了就不註冊 | 一致 |
| `S3_REGION` | 選填 | `\|\| "auto"` | 一致 |
| `OPENAI_API_KEY` | 選填 | 缺了 AI 路由 fail-closed | 一致 |
| `PORT` | 選填 | `?? defaultPort` | 一致 |
| `EINVOICE_*` | 選填 | `.env.example` 標 legacy／外部部署才用 | 一致 |

**部署頁可執行指令：無發現**

`deployment/overview.mdx` 有契約要求的「詳細部署步驟撰寫中，正式上線後回填」，沒有 fence code、沒有 `docker`／`pnpm`／`git fetch`／Coolify 操作步驟。`content.test.ts` 也禁止這些字樣。符合 spec「Deployment documentation is scaffolded but explicitly marked incomplete」。

**本地開發頁 vs README：有發現 → H1、L1**

**next.config rewrite／搜尋 tokenizer／catch-all：頁面與搜尋不應壞掉；rewrite 半套 → M3**

- Catch-all `app/[[...slug]]/page.tsx`：`source.getPage(slug)` 找不到就 `notFound()`；`generateStaticParams` 走 `source.generateParams()`。`/` 的 optional catch-all 可渲染 `content/docs/index.mdx`。
- `/api/search` 是 Route Handler（`createFromSource` 的 `GET`），App Router 下優先於 catch-all，不會被 `[[...slug]]` 吃掉。搜尋客戶端預設 `api = "/api/search"`，對得上。
- Rewrite 只匹配路徑以 `.mdx` 結尾的 URL。一般文件路徑沒有這個後綴，搜尋也不走它。靜態分析：不會弄壞頁面／搜尋；`*.mdx` 會 404（M3）。
- Tokenizer（`lib/search-tokenizer.ts`）形狀符合 Orama Tokenizer（`language`、`normalizationCache`、`tokenize`）。中文逐字、`[A-Za-z0-9_]+` 當一個 token，並 NFKC＋小寫。測試期望 `"環境變數 PAYUNi dataSpec"` → `["環","境","變","數","payuni","dataspec"]`，查「PAYUNi」或「dataSpec」對得上索引。`this.normalizationCache` 在 Orama 以 method 呼叫時 `this` 綁得到；未實跑搜尋 API，標靜態分析通過。

其他 correctness（非 Critical）：
- 套件版本鎖定 `fumadocs-core@16.9.3`／`fumadocs-mdx@15.0.10`／`fumadocs-ui@16.9.3`，`dev` port 3002，`type-check` script 與契約一致。
- 目錄結構與 Implementation Contract 的 `content/docs/` 樹一致。
- `pnpm-workspace.yaml` 的 `apps/*` 與 `turbo.json` 通用 pipeline 已覆蓋新 app，不必改 turbo。
- Upstream Sync 頁有 `git fetch startkiter-upstream`、merge、買家自改 Core 衝突自負，符合 spec；分支寫死 `main` 見 L2。
- Core 頁漏原文「部署流程」一句見 M2。

### 2. security

**機密洩漏：無發現**

環境變數頁只列名稱、必填／選填、用途。沒有複製 `.env.example` 的佔位值（例如 `postgresql://user:password@...`、`replace-with-at-least-32-random-characters`），沒有 `.env`／`.env.local` 真實金鑰，沒有 PEM／憑證片段。`PAYUNI_API_URL` 只寫「範例有 sandbox 預設值」，沒把 sandbox URL 當秘密貼出。頁尾明確寫不要把真實憑證放進 Git／截圖／issue。

Grep `apps/docs` 的 `*.{ts,tsx,mdx,json,css,mjs}`：沒有 `sk-`、`BEGIN PRIVATE`、`api_key=` 這類密鑰樣式。

根目錄 `.gitignore` 已排除 `node_modules/`、`.env`、`.env.*`（保留 `.env.example`／`.env.template`）、`*.pem`。文件站 `node_modules` 在工作樹存在但是 gitignore，不應進 diff。

**危險 rewrite／敏感檔暴露／XSS：無發現會造成洩密或 XSS**

- Rewrite 目的地是 Next route `/llms.mdx/:path*`，不是檔案系統，不會把 `content/docs` 或 `.env` 直接暴露。半套 rewrite 的結果是 404，不是讀到私密檔（M3）。
- 文件站依契約公開、不接 Auth；MDX 是建置期編譯的受信任內容，沒有 `dangerouslySetInnerHTML` 吃使用者輸入，沒有使用者可寫的搜尋／表單注入點。相對連結走 Fumadocs `createRelativeLink`。
- 沒有公開 API 把 `__return_true` 或 service role 金鑰塞進前端。搜尋 API 只索引已公開的 MDX。

### 3. performance

**無發現**

內容只有首頁 + 五個買家頁，內容量很小。`createFromSource` 在 request 時對 loader 建 Orama 進階索引；5 頁的 heading／段落，CJK 逐字切 token 仍是很小的 in-memory 索引，沒有明顯建置或查詢負擔。`includeProcessedMarkdown: true` 會讓 collection 多存一份 processed markdown，但搜尋索引用的是 structured data，不是那份全文；5 頁可忽略。沒有迴圈打 API、沒有大圖、沒有永久 cache 濫用。

---

## 通過項目

- Core／Plugin 文件中的 `PluginManifest` 與 `packages/platform/src/types.ts` 一致：`dataSpec` 僅 `"content" | "none"`，Mount 僅 `route`／`menu`／`content`
- 環境變數頁 88 列，名稱與順序等於 `apps/saas/.env.example`
- 環境變數頁沒有真實金鑰、密碼、PEM、`.env.local` 內容
- 部署頁標示未完成，沒有可執行部署指令，未把 README 的 `docker build`／`docker run` 搬進來
- Upstream Sync 涵蓋官方同步指令與買家自改 Core 的衝突責任
- catch-all 與 `/api/search` 不衝突；tokenizer 設計可命中「PAYUNi」「dataSpec」與中文單字
- Fumadocs 版本、port 3002、`defineDocs({ dir: "content/docs" })`、目錄樹與 Implementation Contract 一致
- workspace glob／turbo 通用 pipeline 已覆蓋 `apps/docs`，無需為這次改 `turbo.json`
- 無 XSS 使用者輸入點；無硬編碼密鑰；`.env`／`*.pem`／`node_modules` 有 gitignore

---

## 結論

**CRITICAL 0 / HIGH 1 / MEDIUM 3 / LOW 4 — 可 commit（Verdict: PASS）**

Critical 為 0，不阻擋 commit。建議在收尾前處理 H1（本地開發指令的 README 來源）與 M1（`BETTER_AUTH_URL`／`NEXT_PUBLIC_SAAS_URL` 用途），避免買家只填「必填」三項就上正式站。M3 的半套 rewrite 刪掉或補齊即可，不影響正常瀏覽與搜尋。
