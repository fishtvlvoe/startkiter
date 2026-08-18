## Context

2026-08-18，老闆與 Claude Code 針對「Coolify 部署架構」進行一整天對焦討論，過程記錄於 `docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md`（前一 session 交接檔）與後續同日對話。討論起點是：`startkiter.dev` 網域已在 Cloudflare 購買、Coolify Cloud 帳號已開通，但兩者中間缺一台實際運算的 VPS 主機。

討論過程中查證並推翻了幾個中間結論，記錄如下避免下一個接手的人重踩：

1. **Coolify Cloud 只是控制台，不含主機**——查證屬實（[Coolify 官方定價頁](https://coolify.io/) 與多篇 2026 年評測一致：Coolify Cloud 是 bring-your-own-VPS 模式，$5/月起管 2 台已連接伺服器，每多接一台 +$3/月）
2. **一度考慮改用 StartKiter 已有的 Zeabur 帳號取代 Coolify+VPS**——因為 `ZEABUR_TOKEN` 已存在於其他專案（AIRE、woomin/aiver.me 正式站），且 Zeabur CLI 已裝好、`zeabur project create` / `template deploy` / `domain create` 等指令確實可行。但老闆基於實際使用經驗指出：Zeabur 是黑盒容器，沒有 SSH/root，主控權有限；費用是「每開一個服務收一次錢」，不像 VPS 一台機器可以自己切很多容器攤成本；一鍵部署實務上仍需人工核對，不如文件描述的順暢。另外查證 THE-TU-Project 的 `ZEABUR-DEPLOYMENT-RUNBOOK.md` 證實過去在 Zeabur「客戶各自擁有獨立資源」模式下確實踩過多個坑（主機狀態顯示 RUNNING 但系統元件未 ready、region 參數需填 `server-<serverId>`、DATABASE_URL 需手動接、容器 crash-loop、build context 缺 `.git`、無 persistent volume 導致重啟掉檔）。**結論：改回 Coolify + VPS 方向，Zeabur 帳號維持只給 Tier 1（買家自行部署）用的 README 一鍵部署按鈕，不用於 Tier 2**
3. **Coolify 沒有安全的客戶專案級別權限隔離**——查證 [coollabsio/coolify#6894](https://github.com/coollabsio/coolify/issues/6894)：讓團隊成員只看到指定專案這種細粒度權限仍在規劃中，且有已知 bug（member 角色能刪除未指派給自己的專案）。**結論：買家永遠不會拿到 Coolify 登入權限，這不是實作疏漏，是刻意設計**
4. **Coolify 支援一個控制台連接管理多台伺服器**——查證 [Coolify Servers 文件](https://coolify.io/docs)：`Add Server` 只需要目標機器的 IP + SSH key，Coolify 透過 SSH 遠端操作 Docker，不要求該機器由 Coolify 自己提供。這是本次「買家自租 VPS、StartKiter 集中管理」模式能成立的技術基礎
5. **業界已有相同模式的成熟案例**——Cloudways、WP Engine 這類代管 WordPress 服務商，客戶最多拿到自己網站範圍的 SSH／後台，看不到、也碰不到主機控制台本身。這不是新發明，是代管服務的標準做法
6. **自訂網域綁定用客戶自有 Cloudflare 帳號 + scoped API token，不用 Cloudflare for SaaS**——查證兩條路都可行：Cloudflare for SaaS（Custom Hostnames）讓客戶網域留在原註冊商、只加一筆 CNAME，但需要 StartKiter 自己的 Cloudflare 帳號開通這個附加產品（確切定價未查到）；另一條路是客戶自己把網域轉去 Cloudflare 管理、產生一組僅限「Zone:DNS:Edit」的 scoped API token 交給 StartKiter 的 AI 系統，這條路任何 Cloudflare 帳號等級都支援、不需要額外付費產品。**結論：採用客戶自有 Cloudflare 帳號 + scoped token 的方式**

`platform-shell-plugin-architecture` 的 Non-Goal 寫著「不做 StartKiter AI 反向連線客戶伺服器」，這句話寫於只考慮 Tier 1（買家自行部署、自己維運）情境的時間點，與這張 change 定案的 Tier 2 模式矛盾。已在該 change 的 proposal.md / design.md 個別修正措辭，改為「此 change 範圍不含反向連線機制本身，定義於 `coolify-managed-deployment`」。

### 2026-08-18 實測驗證（tasks.md 1.1–1.5）

同一天完成一次端到端手動驗證，完整步驟與踩坑記錄見 `docs/coolify-vps-setup-runbook.md`。摘要：

- 買了一台 Vultr VPS（新加坡機房，2vCPU/4GB），Coolify Cloud 生成專用 SSH 金鑰，公鑰裝進 VPS，`Validate connection` 通過，狀態 Ready（Docker 29.7.2、Compose 5.5.0 自動安裝）
- 部署測試應用（Docker Image `nginxdemos/hello`）成功，Coolify 自動配的 `*.sslip.io` 臨時網址可正常存取
- 綁定正式子網域 `coolify-test.startkiter.dev`：Cloudflare 新增 A 記錄（**Proxy 狀態務必設「僅 DNS」，開 Proxy 會讓 Coolify 的 Let's Encrypt 簽發卡住**，這是本次最容易誤踩的坑）→ Coolify Domains 頁面加網域 → Redeploy → `curl -v` 確認 `issuer: Let's Encrypt`、`SSL certificate verify ok`
- **一個真的裝錯的坑**：VPS 一開始選了 Vultr 的「Coolify」Marketplace App（自架版 Coolify，跟 Coolify Cloud 是兩個獨立系統），跟已經在用的 Coolify Cloud 訂閱衝突，後來重裝成乾淨 Ubuntu 才解決。**教訓寫入 Non-Goals／buyer-facing 教學文件**：VPS 系統一律選純 OS，不要選任何預裝面板類的 Marketplace App
- **未驗證到的部分**：這次測試用的是 Docker Image 直接部署（非 Git 來源），git-push 觸發自動重建這個特定機制還沒實測；自訂網域是用 StartKiter 自己的 Cloudflare 帳號直接操作，「買家自己的 Cloudflare 帳號生成 scoped API token 交給 AI」這個買家端交接流程本身也還沒測過——這兩項留待下一輪驗證

### 2026-08-19 補測：Git 來源 push 觸發自動重建部署

同一個 `startkiter-test` 專案（`production` environment）、同一台 `startkiter-managed-fleet-01` 伺服器上，另建一個測試資源，這次用 **Public Git Repository** 來源補測 1.3 剩下的部分：

- 測試 repo：`https://github.com/fishtvlvoe/startkiter-coolify-git-deploy-test`（全新極簡 repo，`index.html` + `Dockerfile`，nginx:alpine 直接 serve 靜態頁，跟 StartKiter 正式/TEST repo 完全無關）
- Coolify 新增資源選「Deploy Public Git Repository」，填 repo URL + branch（`master`，注意 repo 預設分支不是 `main`，Coolify 表單初始帶入的 `main` 要手動改掉，不然會報 `git branch field is required`），Build pack 用預設 Railpack（實際偵測到 Dockerfile 走 Dockerfile build）
- 第一次手動 Deploy 成功，`*.sslip.io` 臨時網址可正常存取，`curl` 確認內容為 v1
- **關鍵發現：Public Git Repository（純 HTTPS，無 GitHub App 綁定）不會自動偵測 push，需要手動設定 Webhook 才會觸發自動重建**——這不是預設開啟的功能。開啟方式：
  1. 進資源的 **Webhooks** 分頁，「Manual Git webhooks」區塊裡有針對 GitHub/GitLab/Bitbucket/Gitea 各自的固定 Webhook URL（本例用的是 `https://app.coolify.io/webhooks/source/github/events/manual`）跟一個要自己填的 Webhook secret 欄位
  2. 在 Coolify 端填入一組 secret 存檔（`Save changes` 後出現「Webhook secrets saved.」）
  3. 到 GitHub repo 的 Settings → Webhooks（或用 `gh api repos/<owner>/<repo>/hooks` 直接建立）新增一個 webhook：Payload URL 填上面那條、Content type `application/json`、Secret 填同一組值、事件勾 `push`
  4. 只有這樣接好，Coolify 才會在收到 GitHub push 事件時自動觸發重建；若只是走「Deploy Git Repository (with GitHub App)」來源，官方文件說明是自動帶 webhook，不需要這段手動接線——但本次驗證的是 StartKiter 實際情境更接近的 Public Git Repository 模式（買家不會把 GitHub App 裝到自己帳號上），所以手動 webhook 這條路徑才是要寫進買家端教學文件的版本
- 驗證結果：`git commit` + `git push` 一次新版本（頁面內容改成帶時間戳記的 `VERSION: v2-push-triggered-<timestamp>`）後，**沒有點任何 Coolify 按鈕**，Deployment History 自動出現一筆新紀錄，Source 欄位顯示 `Webhook`（不是 `Manual`）、Commit hash 對應到剛 push 的那個 commit，狀態從 In progress 到 Success
- `curl` 打帶 cache-buster 的網址，確認回傳內容真的是 push 之後的新版本文字（`VERSION: v2-push-triggered-1787068821`），不是只看 Coolify 介面顯示 Success 就算數
- 這兩個測試資源（GitHub repo + Coolify 資源）留著當佐證，之後有需要可以再拿來覆測

## Goals / Non-Goals

**Goals:**

- 定義三層客群模型，讓不同技術水準的買家走不同的部署路徑，且路徑之間不互相拖累
- 讓 Tier 2（小白主力客群）出問題時，StartKiter 能直接處理，不需要臨時跟買家索取任何帳號密碼
- 讓 StartKiter 的主機成本不隨買家數量線性爆炸，一次性課程收入打得平
- 讓買家的第三方帳號（Email／金流／網域）主權完全在買家自己身上，StartKiter 不承擔代管這些高敏感憑證的責任
- 買家在自己看得到的地方（StartKiter 平台本身）獲得足夠的部署狀態資訊，不需要理解 Coolify

**Non-Goals：**（同 proposal.md，不重複列出）

## Decisions

### 主機費用由買家自己出，StartKiter 只承擔 Coolify 控制台費用

買家在 Vultr／Hetzner 等供應商自己開一台 VPS（自己付款），把 SSH 存取權交給 StartKiter 一次，StartKiter 把這台機器加進唯一一個 Coolify 帳號集中管理。StartKiter 的邊際成本只有 Coolify 每多接一台機器 +$3/月，不是整台 VPS 的錢。

Alternatives Considered:
- StartKiter 自己出錢租每個買家的 VPS — 否決：買家只付一次課程費，StartKiter 卻要無限期每月繳主機費，訂閱制成本養不起一次性收入模式
- 全部買家共用同一台大型 VPS，用 Docker 切多個容器 — 否決：單台機器故障會同時影響所有買家，且資源競爭（一個買家的流量高峰會拖慢其他人），风险集中度太高，不採用
- 改用 StartKiter 已有的 Zeabur 帳號（每個買家開一個獨立 project）— 否決：見 Context 第 2 點，Zeabur 的黑盒容器與按服務計費不適合這個規模

### 買家永遠不拿到 Coolify 登入權限，只看 StartKiter 自建的簡化狀態面板

見 Context 第 3、5 點的查證依據。買家的「後台」是 StartKiter 平台裡的一個頁面（`/deployment` 或類似路由），顯示部署狀態摘要，資料來源是 StartKiter 後端呼叫 Coolify API 取得，買家本人不會有任何 Coolify 帳號或 API token。

Alternatives Considered:
- 等 Coolify 未來支援 per-project 權限後，直接給買家一個受限的 Coolify 帳號 — 否決：功能還在規劃中，時程不可控，且即使做出來也是依賴第三方平台的權限模型，不如自己包一層薄的狀態面板來得可控
- 完全不給買家任何狀態資訊 — 否決：買家至少要知道「我的網站是不是活著、網址是什麼」，這是基本使用需求

### 第三方帳號（Email／金流／自訂網域）一律買家自己申請，AI 直接串接，StartKiter 人員不經手

買家自己去 Email 服務商、金流商、Cloudflare 申請帳號，取得 API key／scoped token 後，透過與 AI 的對話介面提供（例如在聊天中貼上金鑰），AI 讀取後直接寫入該買家部署實例的環境變數並觸發重新部署。StartKiter 公司的人類員工，在正常流程中不會看到、不會手動處理這些憑證。

Alternatives Considered:
- StartKiter 統一申請/代管所有買家的第三方帳號 — 否決：這些帳號涉及買家自己的營收（金流）與品牌信譽（Email 寄送、網域），主權應該在買家自己身上；集中代管上百個買家的高敏感憑證也是巨大的資安負擔，不符合「小公司」的風險胃納
- 買家自己手動編輯環境變數檔案 — 否決：違反「買家不碰終端機」的核心目標

### 自訂網域綁定：買家自有 Cloudflare 帳號 + scoped API token

見 Context 第 6 點。買家把網域的名稱伺服器（nameserver）指向 Cloudflare（一次性設定，在原註冊商操作），在自己的 Cloudflare 帳號產生一組僅限「編輯 DNS」的 API token，交給 AI。AI 呼叫 Cloudflare API 自動建立記錄、指向買家的部署，並觸發 Coolify 端的網域綁定與 SSL 憑證簽發。

Alternatives Considered:
- Cloudflare for SaaS（Custom Hostnames）— 否決：需要 StartKiter 自己的 Cloudflare 帳號額外開通此產品，確切費用未查到，且效果與「客戶自有帳號 + scoped token」大致相同，後者不需要額外付費產品、且技術門檻對 StartKiter 更低（不用維護 Custom Hostnames 這層抽象）
- 要求買家手動在自己的 DNS 介面貼一筆 CNAME 記錄 — 否決：仍是手動操作，且如果買家的網域不在 Cloudflare，各家 DNS 介面操作方式不一致，教學成本高於「轉到 Cloudflare + 產生一組 token」這個統一流程

## Implementation Contract

**Behavior**（使用者可觀察的行為）：

- 買家在課程/購買流程中選擇部署路徑：「我要自己架」（Tier 1／3，導向 README 說明）或「幫我全包」（Tier 2，導向以下流程）
- Tier 2 買家跟著教學在 VPS 供應商開一台機器，把 IP 與一次性 SSH 存取權交給 AI 對話介面
- StartKiter 後端將該 VPS 加入唯一的 Coolify 帳號（呼叫 Coolify Server API）
- 買家登入 StartKiter 平台的 `/deployment` 頁面，看到自己網站的狀態（活著/掛了）、網址、上次更新時間，不會看到 Coolify 介面
- 買家提供第三方帳號憑證（Email／金流／自訂網域 token）給 AI 對話介面，AI 寫入該買家部署實例的環境變數並觸發重新部署，StartKiter 人員在標準流程中不查看這些憑證明文
- 買家的網站出現部署失敗、伺服器層級異常時，StartKiter 團隊透過自己的 Coolify 帳號直接介入處理，不需要另外跟買家要任何存取權

**Interface / data shape:**

```ts
// packages/platform/src/deployment/types.ts
type BuyerDeploymentTier = "self-hosted" | "managed" | "advanced";

type BuyerDeployment = {
  id: string;
  userId: string;
  tier: BuyerDeploymentTier;
  coolifyServerId?: string;      // 僅 tier === "managed" 有值
  coolifyAppId?: string;
  publicUrl: string;
  customDomain?: string;
  status: "provisioning" | "live" | "building" | "error";
  lastDeployedAt?: string;
};

// 第三方憑證僅短暫存在於伺服器記憶體/傳遞給 Coolify 環境變數 API，不落地存進 StartKiter 自己的資料庫
type ThirdPartyCredentialHandoff = {
  kind: "email" | "payment" | "domain-dns";
  targetEnvKey: string;   // 寫入買家部署實例的哪個環境變數
  // 憑證值本身不出現在型別定義或任何 log 中
};
```

- `POST /api/deployment/provision`（僅 tier === "managed"）→ 接收買家提供的 VPS IP，觸發 Coolify Server 加入流程
- `GET /api/deployment/status` → 回傳 `BuyerDeployment` 的簡化狀態，供 `/deployment` 頁面顯示
- `POST /api/deployment/credentials`（AI 對話介面後端呼叫）→ 接收 `ThirdPartyCredentialHandoff`，寫入對應買家部署實例的環境變數，觸發 Coolify 重新部署；此 endpoint 的請求/回應**禁止**記錄憑證明文到任何 log

**Failure modes:**

- 買家提供的 VPS SSH 存取權失效或格式錯誤 → `provision` 回傳明確錯誤訊息，指引買家重新產生存取權，不重試寫入
- Coolify API 呼叫失敗（額度用盡、API token 失效）→ `/deployment` 頁面顯示「暫時無法取得狀態」，不誤報買家網站掛了
- 憑證寫入環境變數後 Coolify 重新部署失敗 → 環境變數變更保留（不自動回滾），狀態顯示 `error`，需要 AI 或 StartKiter 團隊介入
- `COOLIFY_API_TOKEN` 缺失或失效 → 所有 `/api/deployment/*` endpoint 回傳 503，不讓買家誤以為部署發生了

**Acceptance criteria:**

- 手動驗證：至少一台真實 VPS（Vultr 或 Hetzner）成功透過 SSH 加入 StartKiter 的 Coolify 帳號，並部署一個測試用的 Next.js 應用
- `curl /api/deployment/status` 對一個已 provision 的測試帳號回傳正確的 `BuyerDeployment` 結構
- 手動驗證：透過 AI 對話介面提供一組測試用 Cloudflare scoped token，成功自動綁定一個測試子網域並簽發 SSL
- 檢查所有 `/api/deployment/*` 相關程式碼與 log 輸出，確認第三方憑證明文從未被寫入資料庫、log 或錯誤回報

**Scope boundaries:**

- In scope: 三層客群的路由分流、Coolify Server 加入流程、買家狀態面板頁面、第三方憑證交接的 API 邊界與 no-log 保證
- Out of scope: VPS 供應商的實際採購自動化（買家手動完成，教學內容涵蓋）、Coolify Cloud 帳號本身的存取權交接（既有維運待辦）、Coolify per-server 費用如何反映進課程定價（Fish 的定價決策）、AI 對話介面本身的憑證解析/驗證邏輯細節（依賴既有 AI 工具能力，不在此重新設計）

## Risks / Trade-offs

- [Risk] StartKiter 唯一的 Coolify 帳號是單點故障——帳號若被盜或誤操作，可能同時影響所有 Tier 2 買家的網站 → Mitigation: Coolify 帳號強制 2FA，`COOLIFY_API_TOKEN` 比照其他機敏金鑰走既有的金鑰管理流程，不落地明文
- [Risk] Coolify per-server 費用會隨買家數量成長，若沒有反映進課程定價，長期會侵蝕毛利 → Mitigation: 需要 Fish 在定價策略中納入這筆邊際成本（每買家約 +$3/月），不在此 change 自動決定
- [Risk] 買家自己申請 VPS 這個步驟，仍可能有一部分人卡關（例如信用卡驗證失敗、選錯地區） → Mitigation: 當作教學內容明確涵蓋，並保留「這一步卡住可以找 StartKiter 協助」的例外支援管道，但不是常態義務
- [Risk] AI 對話介面若誤解或誤填第三方憑證到錯誤的環境變數，可能導致買家的金流/Email 串接失敗甚至外洩 → Mitigation: `ThirdPartyCredentialHandoff` 型別明確限制 `targetEnvKey` 只能是預先定義好的白名單值，不接受任意鍵名
- [Risk] Cloudflare 的 scoped API token 若權限範圍設定錯誤（買家不小心給了過大權限），StartKiter 系統可能拿到超出預期的存取範圍 → Mitigation: 產生 token 的教學步驟明確指定只勾選「Zone:DNS:Edit」單一權限，系統端在使用前呼叫 Cloudflare 的 token verify API 確認實際權限範圍，超出預期範圍則拒絕使用並提示買家重新產生

## Migration Plan

這是全新能力，非既有系統遷移。建議分兩階段：

1. **手動驗證階段**：先用一台真實 VPS 走通「租機器 → 交 SSH → 加入 Coolify → 部署測試 app → 綁自訂網域」全流程，確認每一步的真實摩擦點，再決定要不要做成 AI 自動化教學
2. **自動化階段**：把驗證過的步驟包裝成教學內容 + AI 對話介面可執行的動作，開放給真實買家使用

回滾策略：這張 change 的程式碼部分（狀態面板頁面、憑證交接 API）都是新增，不影響既有路由，可直接停用相關路由回滾；已 provision 的買家 VPS 若需要下線，从 Coolify 帳號移除該伺服器即可，不影響其他買家。

## Open Questions

- Coolify per-server 費用要不要反映進課程定價、反映多少——需要 Fish 決定，不在此 change 範圍內
- VPS 供應商是否要官方指定（例如統一推薦 Vultr 東京/新加坡機房）或開放買家自選——影響教學內容的具體步驟，需要 Fish 確認
- 買家狀態面板的視覺設計——遵守 Demo-first 流程，先出靜態 HTML demo 給 Fish 確認才寫真代碼
- AI 對話介面偵測「這是一組憑證」的方式（結構化表單 vs 自然語言貼上金鑰後 AI 自行辨識）——需要在實作階段與既有 AI 工具（Codex/Kimi/Claude Code）的介面能力對照後決定
