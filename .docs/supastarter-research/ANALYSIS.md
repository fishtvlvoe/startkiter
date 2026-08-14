▋ supastarter.dev 商業模式完整分析（StartKiter 對標用）

撰寫日期：2026-08-14

資料來源：56 頁爬蟲快照（.docs/supastarter-research/pages/）、llms.txt、FAQ 展開、pricing / docs Markdown 版。

▋ 一句話結論

supastarter 賣的不是「訂閱制 SaaS」，而是一次買斷的「可商用 SaaS 種子程式庫 + 文件 + 社群 + 持續更新權」。他的商業邏輯是：用 SEO 與比較文把「想自己架 SaaS 的開發者 / vibe coder / agency」導進來 → 用 demo + docs + AI-ready 敘事降低不確定性 → 一次付費解鎖 GitHub private repo → 靠更新、Discord、blog 留住口碑與 affiliate。

舊結論曾把 StartKiter 講成「在地化 boilerplate」。這句作廢。正確定義見 `../COMBINED.md`：用 Realms 的代碼教學包賣法，去賣一套可開張的 SaaS 種子系統。supastarter 只提供系統骨架，不是產品品類。

▋ 他到底在賣什麼

產品本體

• 三套平行 codebase：Next.js、Nuxt、TanStack Start（分開賣，不是買一送三）

• Monorepo：apps/marketing（官網）、apps/saas（產品）、apps/docs、apps/mail-preview

• packages 拆 auth / payments / i18n / ai / api / storage / mailing 等

• 授權：買斷、終身 GitHub 存取、可改、可商用無限專案；不可再當 template 轉售、不可分享 license

交付方式

• 付完款 → 邀請 GitHub 帳號進 private repo

• 文件可下載 .md zip（給離線與 AI agent 用）

• Demo 站：demo.supastarter.dev（讓人「先摸再買」）

他沒有賣「幫你代營運 SaaS」，主線是 DIY。加購才是 consulting call（$149）或 FeatherFlow 代做 landing。

▋ 定價與收入結構

公開價（2026-08 快照，USD 一次付清）

• Solo $299 — 1 位開發者，一個 framework

• Startup $799 — 5 位開發者 + consulting call

• Agency $1,499 — 10 位開發者 + white-label 相關敘事

加購

• Consulting call $149

• Done-for-you（FeatherFlow 合作）

隱含假設

• 客單價中高，靠轉換率不是靠量

• 「一 framework 一 license」→ 同一客戶買 Next + Nuxt 要付兩次（或升 tier）

• 第三方成本（Vercel、Supabase、Stripe）由客戶自付，他在 FAQ 明講可零成本起步

▋ 漏斗架構（文字圖）

```
                    ┌─────────────────────────────────────┐
                    │  SEO / 比較文 / Agent landing       │
                    │  blog, dev-tips, vs ShipFast...     │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │ 免費工具      │        │ Demo 站       │        │ Docs / FAQ   │
   │ idea validator│        │ 可點完整 UI   │        │ 降低購買風險  │
   └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
                    ┌─────────────────────────────────────┐
                    │ 首頁 / 產品頁 / Pricing              │
                    │ 「Production-ready」「AI-ready」     │
                    └──────────────┬──────────────────────┘
                                   ▼
                    ┌─────────────────────────────────────┐
                    │ 一次付費 → GitHub private repo       │
                    └──────────────┬──────────────────────┘
                                   ▼
                    ┌─────────────────────────────────────┐
                    │ Discord + Changelog + 終身更新       │
                    │ Showcase / Affiliate 擴散           │
                    └─────────────────────────────────────┘
```

▋ 網站資訊架構（銷售面）

已爬到的主要區塊

• 首頁 + 三框架產品頁（/nextjs, /nuxt, /tanstack-start）

• Pricing、FAQ、Showcase、Contact

• 比較頁：vs ShipFast、vs Makerkit 等（搶「boilerplate 選哪個」搜尋意圖）

• Agent 專頁：Cursor、Claude Code、Codex、Windsurf…（2025 後主軸敘事）

• 工具：SaaS Idea Validator、Ideas Generator（lead magnet）

• 內容：Blog 索引 55+ 篇、Changelog、Dev-tips、Newsletter

• 法律：Terms、Privacy、License

• 文件站：/docs/*（行銷站與 docs 分離，但互相連結）

行銷敘事關鍵字

• production-ready（不是 toy MVP）

• modular monorepo / Turborepo

• multi-tenancy organizations

• 5 payment providers

• i18n、admin、AI SDK

• AGENTS.md + skills → vibe code 也能用

▋ 功能怎麼被「包成商品」

他不是列 tech stack，而是把「開 SaaS 會卡關的每一關」變成 checklist：

| 創業者卡關 | supastarter 包裝 |
|-----------|------------------|
| 金流訂閱 | Stripe + 4 家替代，統一 API |
| 登入 | better-auth，多 OAuth |
| 團隊 / B2B | Organizations multi-tenant |
| 官網 | apps/marketing 內建 landing/blog/pricing |
| 寄信 | React Email + 多 provider |
| 部署 | 多平台 guide |
| AI 功能 | Vercel AI SDK |
| 維運 | Sentry、analytics 多選 |
| 用 AI 寫 code | AGENTS.md、docs .md 下載 |

也就是：賣的是「時間」與「決策已做完」，不是某個 hook 寫得多漂亮。

▋ 內容與 SEO 策略

Blog 主題群（從 slug 歸納）

• 選 stack：Next vs Nuxt vs SvelteKit、Hono vs tRPC vs oRPC、Prisma vs Drizzle

• 選 boilerplate：要不要 boilerplate、vs ShipFast、best stack for AI agents

• 教學型：multi-tenant、Neon、Netlify/Fly 部署、Dodo Payments 整合

• 心智：2026 還值得做 SaaS 嗎、怎麼找 idea、vibe code SaaS

• 品牌：創辦人訪談、changelog、合作（FeatherFlow）

免費工具

• Idea validator / generator → 收集 email、建立「我們懂 SaaS 創業」權威

比較頁

• 直接打競品名稱，服務 Google 「X vs Y」意圖

Agent landing

• 每個 AI IDE 一頁，把「搜尋 Cursor SaaS template」的流量接住

▋ 社群、更新與護城河

• Discord 1200+（FAQ 自述）

• Changelog 公開 → 買斷客仍感到「活著的商品」

• Showcase → 社會證明

• Affiliate program → 分銷

• 創辦人持續接案 → 「我們自己也用」的可信度

護城河本質：不是 secret sauce code，而是 brand + 整合深度 + 更新節奏 + 內容 SEO 機器。

▋ StartKiter 對照：哪裡一樣、哪裡必須不同

一樣的骨架（建議保留）

• apps/marketing + apps/saas + packages 模組化

• 一次買斷 + private repo + demo + docs + changelog

• 比較文 / SEO / showcase 漏斗

• AGENTS.md + AI-ready 文件（你的學員也會 vibe code）

• Organizations 骨架留著（B2B 以後用）

必須不同的四塊（你的差異化）

1. 受眾

• 他：全球英文開發者，金流以 Stripe 系 + Lemon/Creem/Polar 為主

• 你：繁中亞洲（台、馬、新、海外華人），排除中國大陸金流生態

2. 金流與合規

• 你：Shopline + Stripe + 統一金流（PAYUNi），同一套 order 可接台灣電子發票

• 他：五家 provider，偏歐美 indie hacker

3. 交付

• 他：只賣 codebase + 文件

• 你：codebase 嵌在課程裡 — 銷售頁、UI 設計、內容風格、安裝、金流設定都是模組

• 商業上你是「教育 + 工具包」，不是純 devtool

4. 產品敘事

• 他：AI-ready boilerplate

• 你：AI-ready boilerplate + 中文市場開 SaaS 完整路徑 + MCP 對外暴露（學員產品要能接 agent 生態）

▋ 「內容 & 設計」模組（方案 C）在商業上的位置

supastarter 把 marketing UI 放在 apps/marketing，但「教你怎么賣、怎么寫 landing、怎么做簡報式敘事」不在商品裡。

你的方案 C 等於在商品裡多一層：

```
supastarter 商品層級：
  Code ── Docs ── Community

StartKiter 商品層級：
  Code ── Docs ── Community
           │
           └── 課程模組「內容 & 設計」
                 • 銷售頁結構與 copy 範本
                 • SaaS UI / design token（對齊 DESIGN.md）
                 • 線上 PPT / 白板敘事（script-to-storyboard 等）
                 • 參考書籤「網站設計」工具鏈
```

這讓你的定價邏輯可以比 $299 高，或維持類似價位但用「課程 + 在地金流」正當化 — 因為你賣的是「開張」，不是「下載 zip」。

▋ 建議的 StartKiter 商業框架（草案）

產品名層級

• StartKiter Kit：monorepo 本體（對標 supastarter codebase）

• StartKiter Course：模組化課程（含內容 & 設計、金流、部署、MCP…）

• StartKiter Demo：可公開操作的 demo 站（繁中預設）

定價維度（可討論，非定案）

• 可沿用 Solo / Team / Agency 三階，但「人數」改綁「課程席位 + repo collaborator」

• 或：Kit-only vs Kit+Course 兩 SKU（我傾向 Kit+Course 為主 SKU，避免跟 supastarter 完全同型競價）

漏斗差異化頁面（網站要有）

• vs supastarter（中文市場版）

• 台灣金流三選一設定指南（公開 SEO 文）

• LINE Login + 發票同一張訂單（demo 可展示）

• 「用 StartKiter 開 SaaS 給馬新台客戶」案例

▋ 風險與前提（我自己也會質疑的地方）

• 若 Kit 跟 supastarter 太像，會被說 fork — 需要在「亞洲金流 + 課程 + MCP + 繁中運營內容」至少兩項做深，不能只換 logo

• 課程 + code 交付會提高 support 成本；supastarter 靠 Discord，你可能要加「模組化自助 + office hour」設計

• 三金流維護負擔大；對外敘事可強調「adapters 已接好」，內部用 feature flag 控制

• blog 55 篇未全爬；若要做 SEO 對標，還需補爬或至少歸納標題與關鍵字矩陣

▋ 附錄：已爬 URL 統計

• 總計 56 URLs（manifest.json）

• 含：首頁、三框架、FAQ、pricing、tools、比較、agent 頁、showcase、legal、blog 索引、changelog、dev-tips、llms.txt、部分 docs .md

• Blog 子文：55 slugs 見 blog.md，內容未逐篇快照

▋ 下一步（給老闆對齊用）

1. 用本報告更新 StartKiter openspec —  supersede repo-foundation 裡「minimal / 4 課 / 無 org」舊假設

2. 開新 change：product-framework（商業 SKU + 模組邊界 + 對標頁清單）

3. 決定定價：Kit+Course 綁售 vs 分售

4. 若要 SEO 對標，第二輪爬蟲補 /blog/*

本報告位置：products/startkiter/.docs/supastarter-research/ANALYSIS.md
