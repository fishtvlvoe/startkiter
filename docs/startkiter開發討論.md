# StarKiter 開發討論

> 整理日：2026-08-19 | 來源：specs、README、討論稿、supastarter 文件、對話記錄

---

## 一、這是什麼產品

### 現在賣的

**課程 + 終身代碼包** 同一 SKU，一次買斷 TWD 8800。

買家付錢拿到：
1. 站內課程（教他怎麼用 AI 從零開 SaaS）
2. GitHub 私有 repo 只讀存取（乾淨安裝包，終身更新）
3. LINE 學員群邀請連結
4. 站內 AI Agent（可查自己的訂單和課程進度）

**核心定位差異**：市面上課程不附代碼、代碼包不附教學。StartKiter 兩者綁在一起賣。

---

### 更大的圖：WordPress 式模組化平台

> 老魚 2026-08-19 補充

StartKiter 的底層代碼包，長期目標不是只有「一種」網站模式。

想像 WordPress：裝好核心，掛不同 plugin，就變成不同網站。StartKiter 要做到類似的事：

```
同一套 StartKiter 底層
    ├─ 掛 Course 模組  → 課程銷售平台
    ├─ 掛 SaaS 模組   → 純 SaaS 工具
    ├─ 掛 Community 模組 → 社群平台
    └─ 多模組同時掛  → 混合型產品
```

**課程模組可以「關閉」**——關掉之後，整個站就切換成純 SaaS 產品的邏輯，不是強制綁課程不可。

這個架構意義在於：買家拿到的不是一個「只能做課程站」的代碼包，而是一個**可以長出任何形狀的基座**。

---

## 二、底層基礎：supastarter for Next.js

StartKiter 的代碼從 supastarter（Next.js 版）長出來，不是從零寫。

### supastarter 是什麼

商業授權的 fullstack SaaS starter kit，買斷制，附完整源碼，可無限修改。
定位：「production-ready SaaS 殼，買來直接改成你的產品」。

### 架構分層

```
apps/
  marketing/   → 公開行銷頁（首頁、blog、法律頁）
  saas/        → 核心產品（認證、訂閱、後台）

packages/
  auth/        → Better Auth（Email/Password + OAuth）
  database/    → Prisma + PostgreSQL
  payments/    → 多金流 provider 抽象層（Stripe/Lemon 等）
  api/         → Hono + oRPC（type-safe API）
  ui/          → shadcn/ui + Base UI + Tailwind
  i18n/        → next-intl 多語系
  ai/          → Vercel AI SDK
  mail/        → React Email + provider
  storage/     → S3 相容層

tooling/
  tailwind/    → theme.css（品牌色、CSS 變數）
  typescript/  → 共用 tsconfig
```

### supastarter 的重要限制

> **supastarter 沒有 plugin/hook/mount-point 系統**

它的設計哲學是「源碼即產品，買來直接改」。所有自訂都靠直接修改源碼，沒有官方插件市集或 mount point 機制。

**這代表什麼**：StartKiter 要做到 WordPress 式的可插拔模組架構，這個機制需要我們自己建，supastarter 不送。

---

## 三、StartKiter 對 supastarter 做了什麼

### 替換

| supastarter 原版 | StartKiter 替換成 |
|-----------------|-----------------|
| `packages/payments`（Stripe/Lemon 等） | **PAYUNi** 台灣金流，完整替換 |
| `packages/auth` OAuth providers | 加入 **LINE Login Channel**（台灣主要路線） |
| 預設訂閱制 Billing | **一次買斷** TWD 8800，Order 模型替換 Subscription |
| Organization 多租戶 | **移除**（不做） |

### 新增

| 新增模組 | 說明 |
|----------|------|
| `packages/course` | 課程目錄、播放、403 守門、LINE 群連結面板 |
| `packages/github-kit` | GitHub App 邀請 / 撤銷，終身代碼包履約 |
| `packages/site-agent` | 多供應商 AI 聊天（Gemini/OpenAI/Claude）+ 2 個唯讀工具 |

### 保留不動

- `packages/ui`（shadcn 設計系統）
- `packages/database` 核心 User/Session/Account 結構
- `packages/auth` Better Auth 框架（加 LINE）
- `apps/marketing` 行銷頁架構
- `tooling/` Tailwind 設定

---

## 四、買家完整旅程

```
1. 看銷售頁 /
   └─ 一個 CTA：「立即購買」

2. 登入 / 註冊
   └─ Email/Password、Google、LINE（哪個金鑰沒設就藏那個按鈕）

3. 結帳
   └─ PAYUNi，伺服器端鎖死 TWD 8800，買家無法篡改

4. 付款成功（PAYUNi webhook 回打）
   └─ Order.status = PAID
   └─ courseAccess = true
   └─ kitClaimEligible = true

5. 進課程學習 /course
   └─ 未付款 → 403
   └─ 課程內含：LINE 學員群邀請連結

6. 領 GitHub 代碼包
   └─ GitHub OAuth → GitHub App 邀請
   └─ 拿到私有 repo pull-only 存取（終身）

7. 用 AI Agent /agent
   └─ 查自己訂單 + 課程進度（唯讀，只查自己）

8. 自己部署自己的站
   └─ Zeabur 一鍵部署（含 PostgreSQL）
   └─ 未來：Coolify VPS 方案
```

---

## 五、技術架構（當前）

### 資料模型（已落地）

```
User → Session → Account（OAuth 綁定）
Order {
  status: PENDING | PAID | REFUNDED
  courseAccess: boolean
  kitClaimEligible: boolean
  paidAt: DateTime
  orderNo: string
}
SiteSetting（PAYUNi 金鑰 AES 加密存 DB）
github_kit_grants（邀請狀態追蹤）
```

### 核心 API 端點

| 端點 | 功能 | 守門規則 |
|------|------|---------|
| `POST /api/checkout` | 建立 PAYUNi session | 已登入；金鑰未設 → 503 |
| `POST /api/payuni/notify` | 付款 webhook（冪等） | 驗簽才處理 |
| `GET /api/course/lessons` | 課程清單 | `courseAccess=true` |
| `POST /api/github/claim` | 觸發 GitHub 邀請 | `kitClaimEligible=true` |
| `POST /api/agent/chat` | AI 對話 | Session 存在 |
| `PUT /api/admin/settings/payuni` | 後台填金鑰 | `ADMIN_EMAIL` 限定 |

### v1 硬性規則（不可違反）

| 規則 | 內容 |
|------|------|
| 金流 | 只有 PAYUNi，一次買斷 |
| 金額 | 8800 TWD 伺服器端鎖死 |
| 發票 | MVP 不做 |
| 組織 | 不做 Organization 多租戶 |
| LINE | Login Channel 做登入；社群用邀請連結，不靜默入群 |
| 金鑰未設 | fail-closed 503（不是 500） |

---

## 六、模組化架構願景（待建）

### 問題陳述

supastarter 沒有 plugin 機制，但老魚要的是 WordPress 式可插拔。
所以這個機制要自己建，對應 `platform-shell-plugin-architecture` change。

### 目標架構

```
┌─────────────────────────────────────┐
│         StartKiter Shell             │
│  Auth / DB / AI / 設計系統 / 金流   │  ← Core（永遠存在）
└──────────────┬──────────────────────┘
               │
       ┌───────┼───────────┐
       ▼       ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌──────────┐
  │ Course  │ │  SaaS   │ │Community │  ← Modules（可開關）
  │ Module  │ │ Module  │ │  Module  │
  └─────────┘ └─────────┘ └──────────┘
```

### 四種 Mount Point（已在 spec 規格化）

| 類型 | 說明 |
|------|------|
| **路由** | 模組帶進新的 `/module-name/*` 路由 |
| **選單** | 模組在 NavBar 加入自己的選單項目 |
| **內容** | 模組在既有頁面（如 Dashboard）注入 widget |
| **資料表** | 模組帶進自己的 Prisma model（資料層隔離） |

### 部署機制（已定案）

買家改代碼的方式：**AI 幫他 commit + push → 托管平台（Coolify/Vercel）自動重新建置部署**。
不做客製打包工具，不做「一鍵裝卸 Plugin 的 Marketplace」操作按鈕。

---

## 七、現況快照

### 已落地（specs 已封存）

| 能力 | 狀態 |
|------|------|
| SaaS Shell（monorepo、auth、db、設計系統、多語系） | ✅ |
| PAYUNi 金流（閘道、webhook、Order 狀態機） | ✅ |
| 課程模組（播放、403 守門、LINE 群連結） | ✅ |
| GitHub Kit 履約（App 邀請 + claim API） | ✅ |
| 站內 AI Agent（多供應商 + 2 唯讀工具） | ✅ |
| Operator 後台（金鑰加密存取） | ✅ |
| 銷售頁 UX（單一 CTA、繁中錯誤訊息） | ✅ |
| 一鍵部署（Zeabur deploy.yaml） | ✅ |

### 施工中

| Change | 進度 | 說明 |
|--------|------|------|
| `coolify-managed-deployment` | 6/25 | 三層客群 + VPS 管線 |
| `platform-shell-plugin-architecture` | 0/76 | WordPress 式模組架構（重新設計） |
| `unified-support-desk` | 0/49 | Chatwoot 客服（等 coolify merge） |
| `interactive-learning-system` | 0/19 | MDX 互動積木課程（無前置依賴） |

### 卡老魚的非技術阻塞

| 項目 | 狀態 |
|------|------|
| GitHub App PEM / ORG / REPO | ❌ 未到位 |
| LINE_COMMUNITY_INVITE_URL | ❌ 未到位 |
| Google OAuth callback（正式站） | ❌ 未到位 |
| LINE OAuth callback（正式站） | ❌ 未到位 |

---

## 八、三倉架構

| 倉庫 | 用途 | 狀態 |
|------|------|------|
| `products/startkiter`（本機） | 施工、Spectra 規格、開發 | 開發中 |
| `test-startkiter`（GitHub Private） | 邊裝邊測髒站，Vercel 自動部署 | ✅ 已接通 |
| 正式倉庫（乾淨安裝包） | 給客戶，對標 supastarter 的乾淨度 | ⬜ 尚未建立 |

**學員 kit repo 是第三條線**，跟以上兩倉完全無關，是付費後 GitHub App 邀請的獨立 private repo。

---

## 九、買家主機部署架構（三層客群與 Coolify 萬能遙控器）

> 2026-08-18~19 定案決策

### 三層客群模型

| 客群層級 | 對象 | 部署方式 | 支援與責任邊界 |
|---------|------|---------|---------------|
| **1. 自行部署** | 有工程師、熟悉技術 | 依 README Zeabur 一鍵部署（`deploy/zeabur.yaml`） | StartKiter 不代管，買家自行負責 |
| **2. 推薦流程（主力客群）** | 小白、無技術背景 | 買家自租一台 VPS（自己付帳單）→ 提供 SSH 存取權一次 → 接進 StartKiter 唯一 Coolify 控制台 | **核心賣點**：出問題我們或 AI 能直接上去修，不用臨時索取密碼 |
| **3. 高階玩家** | 想魔改代碼者 | 純代碼交付，自行處理 | 不代管 |

### 核心原則與決策

1. **買家永遠不碰 Coolify 本身**：Coolify 現階段無可靠的「專案級別權限隔離」，買家登入有誤觸其他買家資源的風險。買家在 StartKiter 後台只看到精簡面板（`/deployment`：網站健康/網址/更新時間）。
2. **第三方憑證不經手人眼**：買家的金流、Email、Cloudflare DNS Scoped Token 一律由買家直接交給系統環境變數，公司人員正常流程不經手。
3. **已實測通過的坑**：
   - VPS 系統一律安裝乾淨 Ubuntu 24.04/26.04，**切勿使用 Vultr 等廠商的「Coolify Marketplace App」**（會與既有 Coolify Cloud 衝突）。
   - Cloudflare 自訂網域 DNS A 記錄**必須設為灰雲朵（僅 DNS）**，若開橘雲朵（Proxy）會導致 Let's Encrypt SSL 憑證簽發卡住。

---

## 十、統一 AI 客服工單系統（unified-support-desk 願景）

> 2026-08-19 定案決策

### 為什麼做：拒絕「斷點式人工客服」

買家網站故障時，傳統做法是「請聯絡我們 → 人工引導加 LINE / 填表單」，這是斷點式人工客服。
有 AI 之後，**買家只跟網站介面互動，背後自動化分派**。

### 核心運作流程

```
買家網站出問題
    │
    ├─ 管道 A：全站浮動客服框（Chatwoot widget）
    ├─ 管道 B：/deployment 頁面點擊「回報這個部署的問題」
    └─ 管道 C：LINE 官方帳號 / Telegram Bot
    │
    ▼
匯入自架 Chatwoot 統一收件匣（自動綁定該買家的 BuyerDeployment ID）
    │
    ▼
AI Webhook 消費者即時介入：
    ├─ 唯讀呼叫 Coolify API 拉該機器的即時狀態與錯誤 log
    ├─ 產出「建議修復步驟」草稿給工程師，或對常見問題自動回覆
    └─ 解決後自動通知買家
    │
    ▼
混合式關單判定：
    ├─ AI 標記「建議已解決」
    └─ 等買家主動確認，或 3 天逾時自動關單（期間買家回覆自動重啟工單）
```
