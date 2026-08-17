## Context

後台目前有兩套並存的版面系統：`apps/saas/app/components/app-shell.tsx`（側邊欄式,`/app`、`/course` 在用,已確認視覺 OK）與 `apps/saas/app/components/site-nav.tsx`（頂部橫向,`/agent`、`/admin/settings`、`/`、`/login`、`/signup`、`/checkout` 在用)。`/agent` 側邊欄裡明明有「站內客服」連結,點進去卻換成 SiteNav 版面,造成割裂。

已完成的實測研究記錄於：
- `docs/discuss/2026-08-17-hyperagent-reference.md`——Hyperagent 的 MCP access（固定 endpoint + OAuth 式授權,無 API key)與 Marketplace（Agents/Skills 分類陳列)介面參考
- `docs/discuss/2026-08-17-wp-frontend-mount-research.md`——WordPress 前台掛載三種機制實測(shortcode/block/the_content filter),對應本機 FluentCart／power-course 外掛原始碼
- `docs/discuss/2026-08-14-thetu-source.md`——THE-TU-Project 的 Simple-first 精神(金流/OAuth 預設關可跳過、金鑰填後台)

v1 既有硬邊界（openspec/config.yaml context)：不做 Organization/Member/Invitation、主金流僅 PAYUNi、不准註冊寫入工具給 site-agent、發票不在 MVP。這次的 Plugin 架構設計必須在這些邊界內運作,不得繞過。

課程（`packages/course`）、金流（`packages/payments`,PAYUNi)、Email（既有 tosend 整合)已經是可運作的既有系統,這次不重寫其邏輯,只釐清歸屬。

## Goals / Non-Goals

**Goals:**

- 統一後台 Shell,`/app`、`/course`、`/agent`、`/admin/settings` 四個已登入頁面共用同一個框架,消除版面割裂
- 定義 Core 提供的掛載點機制（路由/資料表/選單/前台區塊)與 Plugin manifest 型別,讓「課程內容」可以透過這套機制掛進 Shell,而非繼續手寫
- 建立 Marketplace 頁面展示已安裝 Plugin,建立 MCP Gateway 讓外部 AI 工具可連線操作帳號
- 明確聲明金流／Email／LINE 通知／頁面編輯系統／課程引擎歸屬 Core,不開放 Plugin 替換;客戶可自行修改核心代碼不受限制,但官方引導路徑只有 Plugin 一條

**Non-Goals:**

- 不重寫金流／Email／LINE 通知／頁面編輯系統的既有實作邏輯
- 不做真正的 zip 上傳安裝流程,Marketplace v1 只列出已知的官方 Plugin(僅課程一項),安裝/移除走程式碼層級,不做終端使用者上傳介面
- 不做 block editor 視覺化編輯器與 shortcode 解析器的實作,前台掛載 v1 只實作 `auto` 一種模式,`shortcode`／`block` 只定義型別留待未來擴充
- 不做交易型 Plugin 的實際 migration 工具鏈(因為金流已排除出 Plugin 範疇,v1 沒有交易型 Plugin 示範)
- 不做 Agent 管理 Plugin（仿 Hyperagent)、不做 StartKiter 主動連線客戶伺服器的 MCP 方向
- 不改動 `/checkout`、`/`、`/login`、`/signup` 的版面,維持獨立於統一 Shell 外
- 不處理 Organization 多租戶／電子發票範圍／已封存 changes 關係三個既有 Open Question

## Decisions

### 統一 Shell 採擴充既有 AppShell 元件,不重寫 SiteNav 或新建第三套

擴充 `app-shell.tsx`,新增 `agent`、`settings` 兩個 `AppShellCurrent` 值的路由涵蓋範圍(型別已存在,只是 `/agent`、`/admin/settings` 頁面還沒改用它)。

Alternatives Considered:
- 保留 SiteNav 並統一其視覺風格對齊 AppShell——否決：兩套元件長期維護成本高,且無法解決「側邊欄選單指向的頁面卻不在側邊欄框架內」這個結構性問題,只是把視覺對齊,割裂感仍在
- 從零新建第三套 Shell 元件——否決：AppShell 已存在且視覺已獲確認 OK(見 2026-08-17 前台對焦討論),重造是浪費

### 選單項目渲染方式改為讀取掛載點清單,v1 用靜態 TypeScript 陣列而非資料庫驅動

新增 `packages/platform/src/mount-points.ts`,匯出 `MOUNT_POINTS: PluginManifest[]` 靜態陣列。`app-shell.tsx` 的 `<nav>` 區塊改為 `.map()` 渲染這份清單,取代目前逐一手寫的 `<Link>`。

Alternatives Considered:
- 資料庫驅動的動態選單(Plugin 安裝時寫入 DB,啟動時查詢)——否決：v1 沒有真正的第三方 Plugin 安裝機制在運作,資料庫驅動只是空轉,增加不必要的複雜度;等真的需要動態裝卸時,消費端(渲染邏輯)不用改,只需替換清單來源
- 檔案系統掃描(掃描 `packages/` 底下符合 manifest 格式的資料夾)——否決：v1 只有一個示範 Plugin(課程),掃描機制的複雜度暫不需要,留待未來真正需要多 Plugin 並存時再做

### 內容型 Plugin 資料規格：新增共用 `PluginContent` 表,而非各自開表

比照 WordPress CPT 概念,提供一張共用內容表,讓內容型 Plugin(課程屬此類)不用自己寫 migration。

Alternatives Considered:
- 每個內容型 Plugin 各自開表——否決：v1 只有課程一個示範,沒必要;且要求 AI 生成新 Plugin 時「自己寫 migration」會提高出錯風險,不如提供統一內容表降低門檻
- 直接用檔案(JSON/Markdown)存,不進資料庫——否決：查詢與跟 Core 既有資料(如 `userId`)關聯的能力太弱,無法 join

### 交易型 Plugin 資料規格只寫進 spec 當作原則,v1 不實作對應工具鏈

`platform-core-boundary` spec 記錄「交易型 Plugin 應走自己的 migration 建表,不共用內容表」這條原則供未來參考,但這次 change 不建立對應的 scaffolding 工具,因為金流已確定歸 Core、v1 沒有交易型 Plugin 示範。

Alternatives Considered:
- 這次就做出交易型 Plugin 的 migration scaffolding 工具——否決：沒有實際使用場景可驗證,做出來是空中樓閣,等真的有交易型 Plugin 需求時再設計會更準確

### 前台掛載 v1 只實作 `auto` 模式,課程內容用此模式掛進 `/course`

`PluginManifest.mount.content.kind` 型別定義三個值 `"auto" | "shortcode" | "block"`,v1 課程 Plugin 使用 `"auto"`——比照 WordPress `the_content` filter 的自動注入邏輯,偵測路由為 `/course` 時自動渲染課程引擎內容,不需要使用者手動放置。

Alternatives Considered:
- v1 三種模式全部實作——否決：block editor 視覺化編輯器是獨立的大型工程(等級接近 Gutenberg),shortcode 解析器也需要額外的模板渲染管線,兩者都超出這次 change 的合理範圍,應獨立立項
- 只定義 manifest 型別不做任何實際渲染——否決：這樣課程示範 Plugin 無法真的掛載運作,無法驗證整套掛載機制是否可行,達不到「用課程驗證架構」這個目的

### MCP Gateway 採固定 endpoint + OAuth 式授權,不用 API key

新增 `apps/saas/app/api/mcp/route.ts` 提供固定 endpoint,外部工具連線時導向既有 Better Auth 的登入/授權畫面,授權成功後寫入 `McpConnection` 記錄,使用者可在設定頁查看與撤銷。

Alternatives Considered:
- 用 API key 方式讓外部工具帶 key 呼叫——否決：API key 容易被複製外洩、使用者體驗上要手動產生/貼上;Hyperagent 的參考案例明確標榜「no API key to copy or paste」是介面設計優點
- 不做連線清單管理,只做單次授權檢查——否決：沒有「查看目前有哪些工具連著、可撤銷」的介面是基本安全衛生的缺失,Hyperagent 的「Active connections」清單是必要對照組

### Marketplace v1 只做靜態展示列表,不做上傳安裝流程

`/marketplace` 頁面呼叫 `GET /api/plugins` 讀取 `MOUNT_POINTS` 靜態清單並顯示啟用狀態,不提供「上傳 zip」的表單或後端處理邏輯。

Alternatives Considered:
- v1 就做完整 zip 上傳安裝流程——否決：涉及檔案上傳驗證、安全掃描、動態程式碼載入,而 Next.js 是編譯期打包框架,「執行期讀取新程式碼並生效」在技術上需要額外的動態 import／重新部署機制,複雜度遠超這次 change 範圍,應獨立立項處理

### Core 邊界聲明採 spec 文件聲明 + manifest schema 不提供金流類型掛載點,不做程式碼層級存取限制

`PluginManifest` 型別的 `dataSpec` 欄位只有 `"content" | "none"` 兩個值,刻意不提供 `"payment"` 或類似選項,讓 AI 生成 Plugin 時自然不會被引導產生金流類型的 Plugin。

Alternatives Considered:
- 用程式碼層級的存取控制阻擋客戶修改核心檔案——否決：客戶擁有完整原始碼,技術上無法真正阻擋,且違反「客戶可自行改代碼不受限制」的邊界聲明精神
- 完全不做任何引導,只靠文件說明——否決：純文件說明沒有強制力,AI 生成 Plugin 時仍可能誤生成金流類型;manifest schema 本身「沒有這個選項」是比文件更有效的軟性引導

## Implementation Contract

**Behavior**（使用者可觀察的行為)：

- 已登入使用者點擊側邊欄「站內客服」「帳號設定」,頁面維持同一個 Shell（頂欄/側邊欄不消失、不換版面系統)
- 螢幕寬度小於 768px 時,側邊欄自動變成底部 tab bar,常駐「開始」「課程」「客服」三項 + 一個「更多」項;點「更多」彈出抽屜列出「帳號設定」等其餘項目
- 語系切換入口移至側邊欄使用者頭像旁的下拉;深色/淺色切換維持在頁面右上角頂欄
- 已登入使用者在 `/marketplace` 看到目前已知 Plugin 清單(v1 僅「課程內容」一項),顯示為已啟用狀態
- 外部 AI 工具(如 Claude Desktop)在其 MCP 設定填入 `https://<domain>/api/mcp` 後,會導向 StartKiter 登入/授權畫面,授權後可讀取 v1 開放範圍內的資源;使用者可在設定頁查看目前連線清單並個別撤銷
- 課程內容透過既有 `packages/course` 引擎產出,呈現於 `/course` 路由,不需修改 Shell 核心檔案即可運作

**Interface / data shape:**

```ts
// packages/platform/src/types.ts
type PluginManifest = {
  id: string;
  name: string;
  version: string;
  mount: {
    route?: { path: string };
    menu?: { label: string; icon: string; order: number; requiresOperator?: boolean };
    content?: { kind: "auto" | "shortcode" | "block"; boundTo?: string };
  };
  dataSpec: "content" | "none";
};
```

- `GET /api/plugins` → 回傳 `PluginManifest[]`（來自 `MOUNT_POINTS` 靜態陣列),含 `enabled: boolean` 欄位
- `GET/POST /api/mcp` → 遵循 MCP 協定標準 HTTP transport,握手回應包含 server capabilities
- `GET /api/mcp/connections` → 回傳目前使用者的 `McpConnection[]`；`DELETE /api/mcp/connections/:id` → 撤銷指定連線

DB DDL（PostgreSQL,對應 Prisma model)：

```sql
CREATE TABLE "PluginContent" (
  "id" TEXT PRIMARY KEY,
  "pluginId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" JSONB NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE INDEX "PluginContent_pluginId_type_idx" ON "PluginContent"("pluginId", "type");
CREATE INDEX "PluginContent_authorId_idx" ON "PluginContent"("authorId");

CREATE TABLE "McpConnection" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "authorizedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "lastUsedAt" TIMESTAMP,
  "revokedAt" TIMESTAMP
);
CREATE INDEX "McpConnection_userId_idx" ON "McpConnection"("userId");
```

**Failure modes:**

- manifest 不符合 `PluginManifest` 型別 → TypeScript 編譯期失敗(fail-closed),不會靜默忽略導致執行期出現不完整項目
- MCP 授權請求缺少有效 session → 回傳 `401`,不建立 `McpConnection` 記錄
- 側邊欄 menu 項目未設定 `requiresOperator` 但目標路由實際需要 operator 權限 → 頁面本身仍走既有 `isOperator`／`shouldShowOperatorSettings` 檢查做 redirect;menu 顯示與否只是 UX 提示,不是唯一的權限防線
- `DATABASE_URL` 或 `BETTER_AUTH_SECRET` 缺失 → 沿用既有 `packages/auth` 的 fail-closed 行為,MCP Gateway 與 Marketplace 一併回傳 503,不是 500

**Acceptance criteria:**

- `pnpm test` 全綠,含新增的 AppShell 涵蓋 `/agent`、`/admin/settings` 渲染測試,以及 `PluginManifest` 型別的 schema 驗證測試
- 用 ego-browser 對 `/agent`、`/admin/settings` 截圖,確認頂欄/側欄結構與 `/app` 一致
- 用 ego-browser 以 375px viewport 截圖,確認底部 tab bar 出現、點「更多」後抽屜正確展開列出其餘項目
- `curl /api/plugins` 回傳陣列含課程 Plugin manifest,`enabled: true`
- 用 curl 模擬 MCP 初始化握手請求,確認 `/api/mcp` 回應符合協定格式(含 `serverInfo`、`capabilities`)
- `curl -X DELETE /api/mcp/connections/:id`（帶有效 session)後,`GET /api/mcp/connections` 不再列出該筆記錄

**Scope boundaries:**

- In scope: AppShell 擴充涵蓋四個已登入路由、`PluginManifest` 型別與靜態掛載點清單、課程示範 Plugin 的 manifest 化(`auto` 模式)、Marketplace 靜態列表頁、MCP Gateway 基礎握手與連線記錄管理、`PluginContent`／`McpConnection` 兩張新表
- Out of scope: zip 上傳安裝流程、block editor／shortcode 解析器實作、交易型 Plugin migration 工具鏈、Agent 管理 Plugin、AI 反向連線客戶伺服器、`/checkout` 等前台獨立頁面的版面異動

## Risks / Trade-offs

- [Risk] 掛載點清單 v1 用靜態 TypeScript 陣列,非資料庫驅動,未來要支援真正動態安裝時需要額外開發 → Mitigation: `PluginManifest` 型別介面現在就定義好,渲染端(`app-shell.tsx`)只依賴型別,之後把資料來源從「靜態陣列」換成「資料庫查詢／檔案掃描」時,消費端不用改
- [Risk] MCP Gateway 開放外部 AI 連進來操作,若權限範圍沒設好可能違反 v1 硬邊界「不准註冊寫入工具」 → Mitigation: v1 MCP Gateway 開放範圍限定唯讀(比照 `site-agent` 既有兩支唯讀工具的範圍),不開放任何寫入操作
- [Risk] 統一 Shell 是 **BREAKING** 變更,既有以 SiteNav 結構為準的 E2E 測試選擇器會失效 → Mitigation: tasks.md 含更新既有測試選擇器的任務,先跑一次既有測試套件確認實際失效範圍再修
- [Risk] Core 邊界聲明只是 spec 文件層面,不是技術強制,未來人員異動可能忽略此邊界 → Mitigation: `platform-core-boundary` spec 明確寫成正式 Requirement,後續可用 `/spectra-audit` 檢查程式碼是否違反

## Migration Plan

部署步驟：

1. 合併資料庫 migration,新增 `PluginContent`、`McpConnection` 兩張表(新增表,不影響既有資料)
2. 部署新版 `app-shell.tsx`（向後相容,`/agent`、`/admin/settings` 改用 AppShell,SiteNav 元件保留但不再被這兩個頁面 import）
3. 部署 `/marketplace`、`/api/plugins`、`/api/mcp` 路由
4. 驗證通過後,移除 `apps/saas/app/agent/page.tsx`、`apps/saas/app/admin/settings/page.tsx` 對 `SiteNav` 的殘留 import

回滾策略：資料庫 migration 為新增表,回滾時可直接 `DROP TABLE` 不影響既有資料;AppShell 變更若有問題可 `git revert` 該次 commit,因 SiteNav 元件未被刪除,可快速切回舊版面。

## Open Questions

- Marketplace 未來要不要支援真正的 zip 上傳安裝——這次不做,待客戶端實際回饋需求後再議
- MCP Gateway 的唯讀操作範圍未來擴充到多個 Plugin 並存時,權限模型需要重新設計(目前鎖定跟 site-agent 既有範圍一致)——列為後續 change 的 Open Question
