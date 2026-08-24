---
name: handoff-coolify-implementation-and-line-support
description: 2026-08-18~19 Coolify 部署架構從決策到落地實作的完整交接，加上老闆新提的 LINE/Telegram 客服工單系統提案
type: project
---

# Coolify 集中管理部署 — 從決策到落地 + 新提案（LINE 客服工單）交接

**狀態：** 基礎設施驗證完成、核心邏輯與第一個真實頁面已落地並通過 E2E；還有一半的 tasks 沒做；新提案（LINE 客服工單）完全沒開始，需要先走 Spectra discuss
**日期：** 2026-08-18 ~ 2026-08-19
**對話框已滿，這是接手用的完整交接檔，讀完這份不用再回頭挖整個對話**

---

## 給下一個 Agent 的第一句話

老闆的角色分工要求：**聽懂需求、給方案、寫計畫，然後派工出去，不要自己埋頭做執行細節**。老闆對「查證屬實」要求很高，任何技術判斷先去查（web search / 讀官方文件 / 實測），不要憑印象回答，講錯過一次會被電。討論多個問題時**一題一題來**。結構/架構類討論老闆習慣「文字＋圖解」，可以用 Artifact 工具發公開連結給他看。老闆喜歡「說人話」——他一旦說「看不懂」，立刻停下來換成國中生程度的白話 + 表格/比喻重講一次，不要重複原本的術語講法。

---

## 一、今天最終定案的架構（結論先講）

StartKiter 教學產品的「買家部署」分**三層客群**：

| 層 | 對象 | 部署方式 | StartKiter 要不要管 |
|---|---|---|---|
| 1. 自行部署 | 有工程師、想自己架 | README 裡現成的 Zeabur 一鍵部署按鈕（`deploy/zeabur.yaml`） | 不管，出事買家自己扛 |
| 2. 我們推薦流程（主力客群） | 小白、完全不懂技術 | 買家自己租一台 VPS（自己付錢）→ 把 SSH 存取權交給我們一次 → 我們把這台機器加進 StartKiter **唯一一個** Coolify Cloud 帳號集中管理 | 要管，這是核心賣點：買家出事我們能直接上去修，不用臨時跟他要密碼 |
| 3. 高階玩家 | 只想拿代碼改自己的東西 | 跟第 1 層一樣 | 不管 |

**為什麼是這個架構（推翻過的路線，避免重踩）：**

1. 一度考慮改用 StartKiter 已有的 Zeabur 帳號（`ZEABUR_TOKEN` 在 AIRE/woomin 專案裡都有）取代 Coolify+VPS。**否決**：老闆親身用過 Zeabur，黑盒容器沒 SSH/root、費用是「每開一個服務收一次錢」不像 VPS 可以攤成本、一鍵部署實務上還要人工核對。另外查證 THE-TU-Project 的 `ZEABUR-DEPLOYMENT-RUNBOOK.md` 證實過去在 Zeabur「客戶各自擁有獨立資源」模式下踩過一堆坑（region 參數要填 `server-<id>`、DATABASE_URL 要手動接、容器 crash-loop、無 persistent volume 導致重啟掉檔）。Zeabur 帳號現在只留給第 1 層用。
2. Coolify 沒有安全的「客戶只看自己專案」的權限隔離（[coollabsio/coolify#6894](https://github.com/coollabsio/coolify/issues/6894) 還在規劃中，且有已知 bug）。**結論：買家永遠不會拿到 Coolify 登入權限，這是刻意設計，不是偷懶沒做。**
3. Coolify 支援一個控制台連接管理多台伺服器（`Add Server` 只要 IP+SSH key），這是「買家自租、我們集中管理」模式能成立的技術基礎。
4. 自訂網域走「買家自己的 Cloudflare 帳號 + 產生一組僅限 DNS 編輯的 scoped API token 交給 AI」，不是走 Cloudflare for SaaS（後者要開通額外付費產品，前者任何 Cloudflare 帳號都能用）。
5. 第三方帳號（Email／金流／自訂網域）一律**買家自己申請**，透過 AI 對話介面直接交憑證，**StartKiter 公司的人類員工在正常流程中完全不經手**。這條線索到今天的新提案（見第五節）時要注意别混淆——「不經手憑證」跟「客服要不要自動化」是兩件不同的事。

**完整對焦圖解**（今天做的兩張 Artifact，內容比這份文件更視覺化，建議先看）：
- https://claude.ai/code/artifact/f3eb299c-0a51-4fd0-b40f-6e854e6cef88 — 部署架構全貌：現況/目標、VPS+Coolify 決策、兩層權限模型、最終三層客群定案
- https://claude.ai/code/artifact/7ac89e9e-fdad-48af-aba4-09c27f40c079 — 買家狀態面板 HTML demo（三種狀態畫面稿）

---

## 二、實測驗證過的東西（有真實證據，不是空想）

完整 runbook：`docs/coolify-vps-setup-runbook.md`（在 worktree 裡，見下方路徑）

- 買了一台 Vultr VPS（新加坡機房，2vCPU/4GB，$24/月），接進 StartKiter 的 Coolify Cloud 帳號（`app.coolify.io`，帳號 fish yu's Team），伺服器名稱 `startkiter-managed-fleet-01`，狀態 Ready
- 部署測試應用（`nginxdemos/hello`）成功，之後又補測了 Git 來源（`https://github.com/fishtvlvoe/startkiter-coolify-git-deploy-test`）的 **push 觸發自動重建部署**——這個不是預設會動的功能，Public Git Repository 來源要手動去 Coolify 資源的 Webhooks 分頁設定 secret，再到 GitHub repo 建一個對應的 webhook，接好之後 `git push` 才會自動觸發（不是走「Deploy Git Repository with GitHub App」那條會自動接 webhook 的路）
- 綁定正式子網域 `coolify-test.startkiter.dev`：Cloudflare 新增 A 記錄（**Proxy 狀態務必設「僅 DNS」灰雲朵，開 Proxy 橘雲朵會讓 Coolify 的 Let's Encrypt 簽發卡住**，這是最容易誤踩的坑）→ `curl -v` 確認 `issuer: Let's Encrypt`、`SSL certificate verify ok`
- **一個真的裝錯又修正的坑**：VPS 一開始選了 Vultr 的「Coolify」Marketplace App（自架版 Coolify），跟已經在用的 Coolify Cloud 訂閱是兩個獨立系統，衝突了，後來重裝成乾淨 Ubuntu 26.04 才解決。**教訓：VPS 系統一律選純 OS，不要選任何預裝面板類的 Marketplace App。**

---

## 三、代碼落地進度（Spectra change: `coolify-managed-deployment`）

**worktree 位置：** `sr-self-service-plugin-pipeline`
**分支：** `fishtvlvoe/sr-self-service-plugin-pipeline`
**這個 worktree 還沒 merge 回 main**，跟另一張較早的 change `platform-shell-plugin-architecture`（7 個 capability，之前規劃過但今天只修正了一句跟今天架構矛盾的措辭）在同一個分支上，兩張 change 都要一起評估要不要 merge。

**SR 文件位置：** `openspec/changes/coolify-managed-deployment/`（proposal.md / design.md / tasks.md / 四個 capability 的 spec.md，`spectra validate` 皆通過）

### tasks.md 進度

- [x] 1.1～1.6：手動驗證 Spike，全部完成（見第二節）
- [x] 第 3、4、5 節的**核心邏輯層**已完成：
  - `packages/platform/src/deployment/`：`tiers.ts`（三層客群分類）、`fleet.ts`（SSH/token 驗證）、`status.ts`（狀態面板轉換，Coolify API 打不通時顯示「暫時無法取得」不會誤報「掛了」）、`credentials.ts`（第三方憑證白名單守門，kind→env key 一對一配對，Codex CR 抓出的漏洞已修）、`coolify-client.ts`（Coolify API 客戶端，**endpoint 路徑未經真實帳號驗證，是最佳猜測，失敗一律安全降級**）、`db.ts`（Prisma 讀寫橋接）
  - 151 個測試全綠（TDD 紅燈轉綠燈完整走過一輪，過程中還補了 Codex CR 抓出的 3 個 Warning：憑證 kind 沒 runtime 驗證會外洩到 log、kind/env key 沒配對限制、SSH 公鑰驗證太鬆）
  - `packages/api/modules/deployment/`：oRPC 模組，`GET /deployment/status`、`POST /deployment/provision`、`POST /deployment/credentials` 三個 endpoint，已掛進主 router
  - `apps/saas/app/(authenticated)/(main)/(account)/deployment/page.tsx`：**買家狀態面板真實頁面**，已通過 E2E（登入、渲染、console 無錯誤、深色模式、未登入保護皆正常，截圖見下方）
  - `packages/database`：新增 `BuyerDeployment` Prisma model（用 `db push` 同步，**沒有用 `migrate dev`**，因為多個 worktree 共用同一個本機 Postgres，`migrate dev` 會要求 reset 整個資料庫）
- [ ] **未完成、誠實標記的部分**：
  - `provisionServer`、`submitCredential` 這兩個 endpoint 目前**只做驗證邏輯，沒有真的呼叫 Coolify API 建立伺服器/寫入環境變數**（程式碼裡有 TODO 註解標清楚）
  - `coolify-client.ts` 的 endpoint 路徑（`https://app.coolify.io/api/v1/applications/{id}`）**沒有拿真實帳號測過**，如果錯了會一路顯示「狀態暫時無法取得」（安全降級，不會誤報）
  - tasks.md 第 2 節「三層客群分流機制」（購買流程的 Tier 選擇畫面、`BuyerDeployment.tier` 從哪裡寫入）**完全沒開始**
  - 買家的自訂網域綁定流程（買家自己的 Cloudflare 帳號 + scoped token 交給 AI 那條路）**完全沒做**，今天測的網域綁定是用 StartKiter 自己的 Cloudflare 帳號手動操作
  - `docs/deploy-and-public-url.md` 補上 Tier 2 主機/費用模型章節（tasks 6.1）**沒做**

### 環境注意事項

- `.env` 已經從主目錄複製進這個 worktree，`DATABASE_URL` 指向本機共用 Postgres（多個 worktree 共用，改 schema 前小心）
- **dev server 啟動指令有個坑**：直接在 `apps/saas` 目錄用 `pnpm dev` 或在根目錄用 `pnpm --filter saas dev` **會漏讀根目錄的 `.env`**（`DATABASE_URL is not set`，登入會 500）。正確方式是 `dotenv -e ../../.env -- pnpm dev`（在 `apps/saas` 目錄下），或直接用根目錄的 `pnpm dev`（會走 `turbo dev` 帶 `dotenv -c`）
- 測試帳密：`admin@startkiter.local` / `StartKiter2026!`
- 資料庫裡已經有一筆種子資料：這個帳號的 `BuyerDeployment`，`tier: managed`、`publicUrl: https://coolify-test.startkiter.dev`、`status: live`——E2E 截圖就是用這筆資料測的
- E2E 截圖（明亮/深色模式、未登入導向）：`/private/tmp/claude-501/-Users-fishtv-Development-products-startkiter/348cf9aa-ed96-4b39-9afe-f58ef75a5ede/scratchpad/deployment-*.png`（這是 session 暫存路徑，可能已隨 session 結束清掉，不保證還在）

### 這個專案的重要開發規則（今天親身踩過才確認的，不是憑印象）

- **API 層走 Hono+oRPC，不是普通 Next.js route handler**——原本猜錯過一次，Fish 叫去讀 `docs/reference/supastarter-nextjs-docs/api/` 才發現正確慣例是 `packages/api/modules/<domain>/router.ts` + `procedures/*.ts`，用 `protectedProcedure`/`publicProcedure`，`ORPCError("FORBIDDEN")` 這類錯誤碼。（少數像 `apps/saas/app/api/course/lessons/route.ts` 這種舊式 plain route handler 是特例，不是主流慣例，不要照抄）
- **資料庫是雙 ORM**：Drizzle（`packages/database/drizzle/`）只管 Better-Auth 自己需要的表（user/session/account/organization 等），StartKiter 自訂的業務 model（Order、GithubKitGrant、BuyerDeployment）走 Prisma Client（`@startkiter/database` 頂層 `db` 匯出的就是 Prisma，不是 Drizzle）
- **AGENTS.md 有強制的 Apply gate**：程式寫完要派 Codex 做 Code Review，Critical 清乾淨才能收尾/archive（今天有一次違反這條、被抓到才補做）。Codex 預設可能會套用很重的 `codex-security` 威脅建模框架（跑好幾分鐘），對小範圍的 diff 可以直接請它中斷、改用快速直接審查
- **Spectra TDD Phase 2 是強制的**：寫任何實作前，先產出「失敗矩陣表」（失敗點→紅燈測試名→預期行為）給老闆確認範圍，才能寫紅燈測試，測試全紅燈後才進 Phase 3 寫實作
- worktree 派工 SOP、orca terminal 監督方式，見 `~/.claude/rules/routing.md`（全域規則，不是這個 repo 裡的）

---

## 四、還沒問完的問題（需要老闆裁決）

1. **買家狀態面板文案**：失敗狀態原本設計稿寫「我們已經收到通知，會盡快協助處理」——這句話預設了「我們有自動監控，網站一壞就會通知我們」，但這套監控**現在沒做**。已經先改成保守版本「你可以聯絡我們協助排查，或稍後重新整理再確認一次」。**要不要真的做一套自動監控通知系統**（這個問題現在被第五節的新提案吸收了，見下方）
2. 兩個跟設計稿的小差異，要不要照設計稿改：（a）「上次確認更新時間」vs 現在的「上次更新」（b）設計稿有「開啟我的網站」「重新整理狀態」兩顆按鈕，現在只有網址可點擊
3. `packages/platform/src/deployment/coolify-client.ts` 裡的 Coolify API endpoint 需要拿真實帳號跑一次才能確認對不對——現在是最佳猜測
4. VPS 供應商要不要官方指定（例如統一推薦 Vultr）還是開放買家自選
5. Coolify per-server 費用（每多接一台機器 +$3/月）要不要反映進課程定價

---

## 五、新提案：統一客服/工單通知系統（完全還沒開始，需要先走 Spectra discuss）

老闆今天提出一個新方向，跟今天做的 Coolify 部署是**不同的獨立提案**，不要混進 `coolify-managed-deployment` 這張 change：

**老闆原話整理**：現在買家網站出問題，畫面上頂多寫「聯絡我們」，但沒有講「怎麼聯絡」，等於還是要人工跟買家講「加我們 LINE」「填單子」。老闆要的是：這個「聯絡」動作本身也自動化，買家只跟**一個介面**（網站）互動，背後怎麼通知我們是系統的事。

**具體想法**：
1. 網站上加一個通知系統，串接 LINE 或 Telegram（老闆傾向 LINE，理由是「比較方便」，沒有更細的理由，可以進一步問）
2. 買家在網站上提出 Issue / 開工單，我們的 AI 或對接工程師**即時**收到通知並協助處理
3. 工單完成後，系統自動通知買家已解決；如果要更進一步自動化，加一個 LINE 官方帳號，買家在後台綁定後可以收到自動回應
4. 整個流程買家感覺上是「跟一個 Agent 溝通」，不要出現「有問題請加 LINE」「有問題請填單」這種需要人工引導的斷點——老闆的原話：「以前沒有 AI 時這樣做還可以，但現在有 AI 了，這些東西應該要能自動化」

**這個提案完全沒有規格、沒有討論細節**，下一個 session 接手時，第一步應該是 `/spectra-discuss`（不是直接 propose），至少要釐清：
- LINE 官方帳號怎麼申請、費用結構（LINE Official Account 分等級，訊息則數超過要付費）
- 工單資料存在哪裡（新的 Prisma model？跟 `BuyerDeployment` 有沒有關聯，例如工單能不能自動帶出「這是哪個買家的哪個部署」）
- AI 怎麼判斷「已解決」——是買家自己按確認，還是 AI 自動判斷（自動判斷風險較高，可能誤判為已解決）
- 跟今天 `coolify-managed-deployment` 裡「StartKiter 團隊能直接介入買家部署」這個既有能力怎麼串接——例如工單進來，AI 能不能直接用 Coolify 存取權去看 log、甚至嘗試自動修復，這樣才是老闆說的「整個流程就是跟一個 Agent 溝通」
- 跟 `docs/discuss/line-login-from-line-hub.md`（現有 LINE Login 契約文件）跟 `packages/notifications` 這兩個既有東西的關係——**先查有沒有現成的可以直接用，不要從零開始寫**（這是這個專案的 reuse-first 硬規則）
- 老闆說「網站上的一個介面」——具體是加一個浮動的客服對話框？還是複用今天做的 `/deployment` 頁面加一個「回報問題」按鈕？這個沒問過，需要問

**目前完全沒有 Spectra change 資料夾對應這個提案，要新建。**

---

## 六、對話中反覆確認過的協作習慣（節錄自今天，供下一個 session 快速抓節奏）

- 派工判斷：只有「真的多工、彼此獨立、能平行跑」才用派工師/多代理；單一延續性任務（例如「把這個 SR 剩下的部分做完」）**不要反射性丟給派工師**，自己直接做或自己直接用 orca-cli 派一個外部 CLI，不用多一層派工師子代理
- 「你可以做的事情就不要叫我做」——凡是自己有工具能查、能操作的（讀檔案、開瀏覽器、查 API 文件），不要叫老闆去手動查或截圖
- 下結論前先查證，特別是「這個第三方服務能不能做 X」這類判斷句，今天連續踩過幾次「講了才發現查證是錯的」（Vultr 定價、Coolify vs Zeabur 架構取捨、supastarter API 慣例），每次都是老闆一句「你是用猜的嗎」才回頭真的去查
- 完成回報格式要老實：做了什麼、驗證了什麼（附真實指令輸出，不是「應該可以」）、誠實標記 TODO 而不是灌水說完成
