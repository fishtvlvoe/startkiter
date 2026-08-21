# StartKiter Core 邊界與擴充指引

本文件定義 StartKiter 平台的核心能力邊界（Core Boundary）、官方支援的擴充機制，以及買家自訂修改原始碼的權利與免責聲明。

---

## 1. Core 核心能力邊界定義

StartKiter 是以完整原始碼形式交付的開站包與課程平台。為了確保核心商業邏輯的穩定性與長期可維護性，以下系統模組被定義為 **Core 固定能力**：

| Core 模組 | 職責與能力範圍 | 實作位置 |
|---|---|---|
| **支付與結帳 (Payment & Checkout)** | 台灣金流（PAYUNi）、訂單狀態機、購買權限授予與防偽驗證 | `packages/payments/` |
| **通知系統 (Notifications)** | Email、LINE 通知整合與發送基底 | `packages/notifications/`, `packages/mail/` |
| **認證與授權 (Authentication & Auth)** | Better Auth 帳號體系、LINE/OAuth 登入、Session 與權限管理 | `packages/auth/` |
| **頁面編輯與後台外殼 (Shell & CMS)** | 統一 WordPress Admin 語彙後台 Shell（頂欄 admin bar、側邊欄分組持久化）與頁面編輯系統 | `apps/saas/modules/`, `packages/platform/` |
| **課程播放引擎 (Course Engine)** | 課程單元播放、章節權限判定、影音播放適配與學習進度追蹤 | `packages/course/` |

> **核心邊界原則**：
> 買家站點不得透過 Plugin 機制或掛載點（Mount Points）將上述 Core 能力替換為替代型 Plugin（例如不得註冊替代的金流處理器或覆蓋 Shell 版型）。Core 能力由平台標準化維護。

---

## 2. 官方 AI 引導擴充路徑：Plugin 機制

StartKiter 唯一**官方支援且引導**的擴充路徑為 **Plugin 模組機制**。

### 擴充規則（依據 `docs/buyer-extension-convention.md`）

1. **獨立套件結構**：所有業務模組必須建立於獨立的 `packages/<name>/` 目錄，進入點為 `packages/<name>/src/index.ts`。
2. **靜態掛載點註冊**：模組透過 `PluginManifest` 介面聲明其掛載需求，並註冊至 `packages/platform/src/mount-points.ts` 中的 `MOUNT_POINTS` 靜態清單。
3. **支援的掛載點（Mount Points）**：
   - `route`: 聲明前台/後台頁面路由（如 `mount: { route: { path: "/my-tool" } }`）。
   - `menu`: 聲明側邊欄選單項目、圖示、排序與權限（如 `requiresOperator: true`）。
   - `content`: 聲明前台內容掛載（支援 `"auto"`、`"shortcode"`、`"block"` 三種放置模式）。
4. **內容型資料儲存**：
   - 內容型 Plugin 宣告 `dataSpec: "content"`，共用 PostgreSQL 的 `PluginContent` 資料表（JSONB 欄位），適用於自訂課程筆記、非同步問答、簡報內容等非高頻資料。
   - 無資料儲存需求之純 UI/工具 Plugin 宣告 `dataSpec: "none"`。
5. **部署流程**：買家透過 AI 工具（Claude Code / Codex / Cursor）修改模組代碼 → AI 工具執行驗證並 `git commit` + `git push` → 伺服器（Coolify / Vercel）原生 git-push-auto-deploy 自動重新建置上線。

---

## 3. 直接修改 Core 原始碼的權利與免責聲明

### 買家權利（No Platform Restriction）

- **完全原始碼交付**：每位付款買家皆取得一份專屬、完整的可讀寫 GitHub 私有倉庫（`org/kit-<orderId>`）。
- **無運行期與代碼層限制**：StartKiter 平台**絕不**設置任何授權檢查碼（License Key Check）、代碼混淆（Obfuscation）、代碼簽署檢查（Code-signing Verification）或運行期閘門（Runtime Gate）阻止買家檢視或直接修改 Core 原始碼。

### 官方免責聲明（Unsupported & Unprotected）

- **非官方引導路徑**：直接修改 Core 檔案（如 `packages/platform/`、`packages/auth/`、`packages/payments/`、`apps/saas/app/` 底層結構）屬於買家自主行為，**不受官方升級保護與技術支援保證**。
- **Upstream Sync 衝突責任**：
  - 官方模板倉庫後續釋出更新（新功能、安全修補、效能調校）時，買家可使用官方提供的 Upstream Sync 指令（`git fetch startkiter-upstream` + `git merge`）進行同步。
  - 若買家直接修改了 Core 代碼，合併時產生的 Git Merge Conflict 或核心依賴破壞，**需由買家或買家所使用的 AI 工具自行承擔與解決**，StartKiter 不提供自動衝突解決保證。

---

## 4. 型別系統與架構防護機制

平台透過 TypeScript 型別系統在**編譯期（Compile-time）**嚴格守護 Core 邊界：

### (1) `dataSpec` 嚴格枚舉約束

```typescript
// packages/platform/src/types.ts
export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  mount: {
    route?: { path: string };
    menu?: { label: string; icon: string; order: number; requiresOperator?: boolean };
    content?: { kind: "auto" | "shortcode" | "block"; boundTo?: string };
  };
  dataSpec: "content" | "none"; // 僅允許 content 或 none
};
```

- 若 Manifest 嘗試宣告 `dataSpec: "payment"`、`dataSpec: "transaction"` 或其他非受控資料規格，TypeScript 編譯器將直接報錯，阻止建置。

### (2) 固定 Mount Kind 約束

- Manifest 僅允許聲明 `route`、`menu`、`content`。
- 任何嘗試宣告非支援掛載點（例如 `authProvider`、`shellOverride`、`paymentGateway`）的 Manifest 會在 `pnpm type-check` 階段被型別系統拒絕。

---

## 5. 交易型（Transaction-type）資料規格演進指引

1. **v1 現行決策**：
   - v1 僅提供共用的 `PluginContent` 表（儲存 JSONB 內容）。
   - v1 **不隨附**交易型 Plugin 的通用 scaffolding、CLI 程式碼生成器或模板（遵循 Ponytail 精簡原則，避免無實際使用場景的空轉抽象）。
2. **未來擴充規範（Future Reference）**：
   - 未來若有高頻、交易型模組需求（例如自訂點數錢包、自建分銷結算等），該模組**必須建立專屬的獨立 Prisma migration 資料表與索引**，嚴禁將高頻交易與關聯資料硬塞入共用的 `PluginContent` JSONB 表內。

---

## 6. 結論與擴充檢查清單

開發或引導 AI 開發新功能前，請依序檢查：

- [ ] 新功能是否侵入 Core 固定能力（金流、通知、認證、Shell）？若有，是否確認要脫離官方保護自行維護？
- [ ] 新模組是否放置在 `packages/<name>/` 並符合 `docs/buyer-extension-convention.md` 規範？
- [ ] Manifest 是否僅使用合法掛載點（`route`, `menu`, `content`）與 `dataSpec`（`"content" | "none"`）？
- [ ] 執行 `pnpm type-check` 與 `pnpm test` 是否全綠？
