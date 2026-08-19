## Context

2026-08-18 老闆定案：部署管線改用 Coolify VPS / Vercel 原生 git-push-auto-deploy，取消客製打包工具與 MCP 推送安裝包。買家的「安裝模組」流程變成「AI 幫改代碼 → commit + push → 平台自動重建部署」。

rebuild-from-official-upstream（已封存）完成後，後台結構已改為：
- `apps/saas/app/(authenticated)/` — 已登入區域 layout
- `modules/shared/components/NavBar.tsx` — 主要導覽元件
- `modules/lib/sidebar-context.tsx` — 側邊欄狀態管理
- 舊的 `app-shell.tsx`、`site-nav.tsx`、`mobile-tabbar.tsx` 已不存在

原 `platform-shell-plugin-architecture` change 的 Phase 1（12 個打勾 task）對應的檔案全部失效，視為未完成。

買家 UI 模版選擇是全新方向：目標客群是純小白，不懂程式/終端機/Git，需要「選模版」起步，不是從空白畫布開始。參考：refero.design（真實 SaaS 截圖庫，可按頁面類型/流程/UI 元件篩選）、saasframe.io。

v1 既有硬邊界（openspec/config.yaml context）維持不變：不做 Organization/Member/Invitation、主金流僅 PAYUNi、不准註冊寫入工具給 site-agent、發票不在 MVP。

已完成的討論記錄：
- `docs/discuss/2026-08-18-plugin-architecture-tiers-comparison.html` — 三方案比較
- `docs/discuss/2026-08-18-auto-deploy-pipeline-gap.html` — 差距圖（部分過時，②打包工具/③MCP推送/④自動build 已被 git-push-auto-deploy 取代）
- `docs/buyer-extension-convention.md` — 買家模組擴充慣例（已完成）
- `docs/deploy-and-public-url.md` — 部署結構紀錄

## Goals / Non-Goals

**Goals:**

- 部署管線簡化：買家用 AI 工具（Claude Code/Codex）依照 buyer-extension-convention 改代碼，AI 幫 commit + push，Coolify / Vercel 原生 git-push-auto-deploy 自動重建部署，買家全程不碰終端機
- 統一後台 Shell：對照重建後真實結構，所有已登入路由共用同一個導覽框架
- 定義 Mount Points 掛載點機制（路由/資料表/選單/前台區塊）與 Plugin manifest 型別
- Marketplace 頁面展示已啟用模組 + 可選模版（不是「一鍵安裝商店」）
- MCP Gateway 讓外部 AI 工具連線唯讀操作帳號
- 買家 UI 模版選擇：提供 2-3 個內建模版，買家選完後 AI 工具自動套用
- 明確聲明 Core 邊界

**Non-Goals:**

- 不建客製打包工具、不建 MCP 推送安裝包功能、不建伺服器端自動 build/deploy 觸發（全部改走 git-push-auto-deploy）
- 不做「一鍵裝/解」的 Marketplace 操作介面
- 不做 zip 上傳安裝流程、block editor、shortcode 解析器、交易型 Plugin migration 工具鏈
- 不整合 refero.design MCP（v1 僅內建模版）
- 不做 Agent 管理 Plugin；AI 反向連線客戶伺服器的機制不在此 change 定義，見 `coolify-managed-deployment`

## Decisions

### 部署管線採 git-push-auto-deploy，取消客製打包/MCP推送/自動build 三層

買家用 AI 工具改自己倉庫代碼 → AI 幫 commit + push main → Coolify（或 Vercel）偵測到 push 自動重建部署。這條路線 Vercel TEST 站已接通（git push → auto deploy），Coolify 的 git-push 觸發也是原生功能。

Alternatives Considered:
- 客製打包工具 + MCP Gateway 推送安裝包 + 伺服器端自動 build/deploy（原方案四）— 否決：三層全是新工程，時程 4-6 週，而目標客群的核心需求（不碰終端機）可以靠「AI 代為 git 操作 + 托管平台原生 auto-deploy」達成，不需要這個複雜度
- 真 WordPress 執行期動態載入（方案三）— 否決：Next.js 無原生支援，需自建沙盒引擎，先前評估 cordis 已否決過

要區分的兩件事（不要混成同一個決策）：
1. git-push-auto-deploy：Vercel 現在就有，跟是不是用 VPS 無關
2. Coolify/VPS 的價值：常駐 Node、固定 IP，讓 PAYUNi 正式金流 webhook 更穩定——這是獨立的維運決策，不在這張 change 的範圍內

### Marketplace 角色降級為展示頁 + 模版選擇，不做「裝/解」操作

在 git-push-auto-deploy 流程下，「安裝模組」= AI 幫買家改代碼再 push，不是在 Marketplace UI 點「安裝」。Marketplace 頁面改定位為：(1) 展示目前站上已啟用哪些模組；(2) 模版選擇入口——買家選模版後，AI 工具依照模版定義調整掛載點配置 + 樣式 token。

Alternatives Considered:
- 維持原設計的「列出可安裝項目 + 安裝/移除」— 否決：在 git-push-auto-deploy 下，「安裝」這個動作不發生在 UI 上而是在代碼層面，Marketplace 做裝/解按鈕會誤導買家以為點一下就好
- 完全拿掉 Marketplace 頁面 — 否決：買家仍需要一個地方看「我的站上有什麼」和「可以選什麼模版」，頁面本身有價值，只是角色不同

### 後台 Shell 統一對照重建後結構，擴充 NavBar + sidebar-context

對照現在的 `modules/shared/components/NavBar.tsx` 與 `modules/lib/sidebar-context.tsx`，擴充導覽涵蓋所有已登入路由。

Alternatives Considered:
- 沿用舊 change 的 app-shell.tsx 路徑 — 否決：檔案在重建後已不存在，路徑無效
- 從零新建第三套導覽元件 — 否決：NavBar 已存在且是重建後的標準結構，重造浪費

### Mount Points 維持四種掛載點架構，v1 靜態 TypeScript 陣列

新增 `packages/platform/src/mount-points.ts`，匯出 `MOUNT_POINTS: PluginManifest[]` 靜態陣列。NavBar 的選單渲染改為 `.map()` 這份清單。架構意圖與原 design 一致，只是實作路徑對齊新結構。

Alternatives Considered:
- 資料庫驅動 — 否決：v1 沒有動態安裝機制，資料庫驅動空轉
- 檔案系統掃描 — 否決：v1 只有課程一個示範 Plugin，複雜度不需要

### 買家 UI 模版選擇：v1 內建 2-3 個靜態模版，不整合外部設計參考庫

模版定義在 `packages/platform/src/templates/`，每個模版是一組：掛載點配置（哪些模組啟用、排列順序）+ 樣式 token 組合（Dashboard 排版風格）+ 預覽截圖。買家在 Marketplace 頁面的「模版」tab 選擇後，AI 工具讀取模版定義檔自動套用。

v1 內建模版初步規劃：
1. **課程教學站**（預設）— 側邊欄課程優先排列、首頁即課程列表、Dashboard 顯示學習進度
2. **服務型 SaaS** — 側邊欄功能模組優先、Dashboard 顯示使用量/客戶統計
3. **作品集展示** — 最小化後台、前台網格展示為主

模版的所有 UI 改動遵守 Demo-first 流程：先出靜態 HTML demo（用 DESIGN.md token），老闆確認才寫真代碼。

Alternatives Considered:
- v1 就整合 refero.design MCP — 否決：refero.design 是「真實產品截圖參考庫」，讓 AI 查詢參考再生成 UI 是有價值的方向，但 v1 先用人工策展的內建模版起步更可控，整合 MCP 是「讓買家的 AI 更聰明」的增強，不是起步必要條件。留作後續探索
- 不做模版選擇，只給空白骨架 — 否決：目標客群是純小白，憑空想「網站要長怎樣」太難，老闆明確要「選模版」體驗
- 模版做成獨立 npm package — 否決：v1 只有 2-3 個內建模版，獨立 package 的分離收益不足以抵銷維護開銷

### 模版與 Mount Points 的接合方式

模版定義檔包含一份 `defaultMountConfig: Partial<PluginManifest>[]`，描述該模版預設啟用哪些掛載點、選單排列順序、Dashboard widget 配置。AI 工具套用模版時，讀取這份 config 並更新 `MOUNT_POINTS` 靜態陣列 + 對應的樣式 token CSS 變數。

這個接合點讓模版不是獨立的「主題系統」，而是 Mount Points 機制的一層預設配置，不引入新的抽象層。

### MCP Gateway 維持外部 AI 唯讀連線，收窄用途

MCP Gateway 只做「外部 AI 連進帳號唯讀操作」，不再承擔「推送安裝包」用途（因為部署改走 git-push）。實作方式與原 design 一致：固定 endpoint + OAuth 式授權 + 連線記錄管理。

Alternatives Considered:
- 維持原設計的「推送安裝包」用途 — 否決：部署管線已改走 git-push-auto-deploy，MCP Gateway 推安裝包這條路失去存在理由

### 內容型 Plugin 共用 PluginContent 表維持不變

與原 design 一致。

### Core 邊界聲明維持不變

與原 design 一致。

## Implementation Contract

**Behavior**（使用者可觀察的行為）：

- 已登入使用者點擊導覽列任何已登入路由（課程/客服/設定），頁面維持同一個 Shell 框架
- 螢幕寬度小於 768px 時，導覽自動適應行動裝置版面
- 已登入使用者在 `/marketplace` 看到兩個 tab：「已啟用模組」（v1 僅課程一項）與「模版選擇」（v1 提供 2-3 個內建模版的預覽卡片）
- 買家選擇模版後，Marketplace 顯示該模版的詳細說明與適用場景，引導買家用 AI 工具套用（給出 prompt 建議）
- 外部 AI 工具在 MCP 設定填入 `https://<domain>/api/mcp` 後完成授權，可唯讀操作
- 課程內容透過 `packages/course` 引擎產出，掛載於 `/course` 路由
- 買家用 AI 工具依照 buyer-extension-convention 改代碼 → AI commit + push → Coolify/Vercel 自動重建部署

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

// packages/platform/src/templates/types.ts
type SiteTemplate = {
  id: string;
  name: string;
  description: string;
  previewImagePath: string;
  defaultMountConfig: Partial<PluginManifest>[];
  styleTokenOverrides: Record<string, string>;
  aiPromptHint: string;
};
```

- `GET /api/plugins` → 回傳 `PluginManifest[]`，含 `enabled: boolean` 欄位
- `GET /api/templates` → 回傳 `SiteTemplate[]`，用於 Marketplace 模版選擇 tab
- `GET/POST /api/mcp` → 遵循 MCP 協定標準 HTTP transport
- `GET /api/mcp/connections` → 回傳 `McpConnection[]`
- `DELETE /api/mcp/connections/:id` → 撤銷指定連線

DB DDL（PostgreSQL，對應 Prisma model）：

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

- manifest 不符合 `PluginManifest` 型別 → TypeScript 編譯期失敗（fail-closed）
- MCP 授權請求缺少有效 session → 回傳 `401`
- `DATABASE_URL` 或 `BETTER_AUTH_SECRET` 缺失 → MCP Gateway 與 Marketplace 一併回傳 503
- 模版定義檔格式錯誤 → TypeScript 編譯期失敗
- 側邊欄 menu 項目未設定 `requiresOperator` 但目標路由需 operator 權限 → 頁面本身仍走既有權限檢查做 redirect

**Acceptance criteria:**

- `pnpm test` 全綠
- NavBar 在所有已登入路由（/app, /course, /agent, /admin/settings）呈現一致的 Shell 結構
- `curl /api/plugins` 回傳含課程 Plugin manifest 的陣列
- `curl /api/templates` 回傳含 2-3 個內建模版的陣列
- MCP Gateway `/api/mcp` 握手成功回應符合 MCP 協定格式
- Marketplace 頁面顯示「已啟用模組」與「模版選擇」兩個 tab
- 每個模版的靜態 HTML demo 經老闆確認後才寫真代碼

**Scope boundaries:**

- In scope: 後台 Shell 統一（對照新結構）、PluginManifest 型別與靜態掛載點清單、課程示範 Plugin manifest、Marketplace 展示頁 + 模版選擇、MCP Gateway 唯讀操作、PluginContent/McpConnection 兩張新表、2-3 個內建模版定義 + HTML demo
- Out of scope: 客製打包工具、MCP 推送安裝包、伺服器端自動 build/deploy 觸發、zip 上傳安裝流程、block editor/shortcode 解析器、refero.design MCP 整合、交易型 Plugin migration 工具鏈

## Risks / Trade-offs

- [Risk] git-push-auto-deploy 依賴買家的 AI 工具能正確執行 git 操作（commit + push），如果 AI 工具出錯會部署壞的代碼 → Mitigation: buyer-extension-convention 已規定代碼格式與驗證步驟（`pnpm type-check` + `pnpm test`），AI 工具在 push 前應先跑通驗證；Coolify/Vercel 的 build 失敗不會影響線上版本（只有 build 成功才切換）
- [Risk] v1 只有 2-3 個內建模版，如果都不符合買家需求會卡住 → Mitigation: 模版是起步點不是限制，買家可以請 AI 從任一模版開始自由修改；v1 的目標是「給小白一個開始的地方」而非「覆蓋所有可能的 SaaS 長相」
- [Risk] 模版預覽截圖需要人工製作，更新成本高 → Mitigation: 模版數量 v1 控制在 2-3 個，截圖工作量可控；未來可用 Playwright 自動截圖
- [Risk] 掛載點清單 v1 用靜態陣列，未來動態安裝需額外開發 → Mitigation: PluginManifest 型別介面現在就定義好，渲染端只依賴型別，之後替換資料來源時消費端不用改
- [Risk] MCP Gateway 唯讀權限若範圍不對可能洩漏敏感資料 → Mitigation: v1 範圍比照 site-agent 既有兩支唯讀工具，不開放任何寫入操作
- [Risk] 統一 Shell 是 BREAKING 變更 → Mitigation: tasks 含更新既有測試選擇器的任務

## Migration Plan

部署步驟：

1. 合併資料庫 migration，新增 `PluginContent`、`McpConnection` 兩張表（新增表，不影響既有資料）
2. 部署新版 NavBar + sidebar-context 擴充（向後相容）
3. 部署 `/marketplace`、`/api/plugins`、`/api/templates`、`/api/mcp` 路由
4. 驗證通過後，移除導覽元件對舊路由結構的殘留引用

回滾策略：migration 為新增表，回滾時可直接 `DROP TABLE`；NavBar 變更可 `git revert`。

## Open Questions

- 內建模版的具體視覺風格需要老闆看 HTML demo 才能定案——這張 change 先定義模版的資料結構與接合方式，視覺設計留給 Demo-first 流程
- refero.design MCP 整合的價值確認——是否值得讓買家的 AI 工具能查真實產品介面當設計參考，或者內建模版 + 自由修改已經足夠。v1 先不做，收集使用回饋再議
- Coolify VPS 的具體建置（常駐 Node、固定 IP、PAYUNi webhook 穩定性、三層客群主機模式）已另開 `coolify-managed-deployment` change 處理，不在這張 change 範圍內
- Marketplace 的模版選擇與 buyer-extension-convention 的 AI prompt 引導如何串接——模版定義檔的 `aiPromptHint` 欄位可以給 AI 工具直接使用，但具體的 prompt 品質需要實測調整
