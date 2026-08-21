# 2026-08-22 對焦記錄：平台定位補漏 + 基礎設施現況

## 背景

Fish 看了一份現況圖解（https://share.onorca.dev/a/3CEeYhHiSGfP）後指出「對焦：我理解的目標」少講了一段——StartKiter 要做的是類似 WordPress 的平台，不是單一固定功能清單的 SaaS。順著這個對焦，同一輪對話又牽出一連串基礎設施現況調查。這份文件把當天所有發現跟待決策事項記下來，避免下一個 session 重新查一遍。

## 1. 平台定位補漏（已寫進 AGENTS.md）

之前的對焦摘要只講「一次買斷拿到 SaaS 骨架＋台灣金流＋課程系統」，沒講這個骨架長什麼架構。實際上 `openspec/changes/platform-shell-plugin-architecture/`（129 項任務，90 已完成）就是在做這件事：

- Mount Points（四種掛載點，v1 靜態 TypeScript 陣列）
- PluginContent 共用表
- Marketplace（v1 降級為展示頁 + 模版選擇，不做「裝/解」操作）
- MCP Gateway（外部 AI 唯讀連線）

這是產品第一性，不是事後補的功能。已寫進 AGENTS.md 的「產品定位」段落。

## 2. woomin repo = THE-TU/dev/thetu 同一套代碼家族

`https://github.com/woomini-flow/woomin`（私有 repo，README 寫「WuMin 買方專屬課程 repo 樣板」）跟 `THE-TU-Project/dev/thetu` 的 `app/`、`lib/` 檔案清單逐一比對幾乎完全一致（`meta-capi.ts`、`posthog-server.ts`、`site-brand.ts`、`setup-config.ts`、`settings-page-tabs.ts`、`deployment-capabilities.ts`、`seamless-upgrade.ts`、`tours`、`unified-video-player.ts` 等都一樣）。

`.env` 裡好幾處寫「from woomin notes」（PAYUNi sandbox、GitHub App、ezPay、Email ToSend、Bunny Stream）其實就是同一套代碼的設定，不是另一個獨立來源。差別只在部署層：woomin 走 Zeabur（有自己的 cron-worker、customer-deployment 文件），thetu/StartKiter 走 Coolify+VPS。已寫進 AGENTS.md 的 Allowed extract sources 段落，避免以後誤判成「還有一個新來源沒盤點」。

## 3. 基礎設施現況總盤點

### Vercel（已決定停用）

- 專案 `test-startkiter`（Vercel org `fishtvs-projects`），部署網址 `test-startkiter.vercel.app`
- 查 `vercel ls` 發現最新兩筆部署都是 **6-7 天前**，跟最新 git commit（2026-08-21 23:04）差了一大段——這才是 `unified-support-desk` 的 webhook 路徑一直 404 的真正原因（不是網域設定問題，是部署根本沒跟上代碼）
- **Fish 2026-08-22 定案：不再用 Vercel，全部搬到 Coolify + VPS。** 已停止一切 Vercel 相關操作（觸發過一次 `vercel --prod` 但中途主動停掉了，沒讓它跑完）
- 遷移到 VPS 的具體步驟還沒規劃，需要開新 Spectra change

### Cloudflare

- `startkiter.dev` 這個 zone 已經在同一個 Cloudflare 帳號（`Fishandy1213@gmail.com's Account`，account id `6bbd30e22e41dd355b12126c69d38116`，跟 bni 專案用的是同一個帳號）下啟用，狀態「使用中」
- 目前只有 1 筆 DNS 記錄：`coolify-test.startkiter.dev` → A `45.76.187.247`（僅 DNS，灰雲朵），沒有指到正式站的記錄
- 原本 `.env` 裡的 `CLOUDFLARE_API_TOKEN`（來自 `products/AIRE/.env`）只管得到 `opcos.me` 這個 zone，管不到 `startkiter.dev`
- 已用 ego-browser 新建一個限定 `startkiter.dev`（zone id `631be2a55e0c1b0a15038ad244b7665d`）、只有 DNS:編輯權限的專用 API Token，存進本專案 `.env` 的 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID`（跟 AIRE 那個 token 分開，各管各的 zone）
- 沒有設定 Cloudflare MCP server（`~/.claude.json` 的 `mcpServers` 只有 `agentmemory`、`codegraph`），wrangler 的 OAuth token 也不能直接拿來打 REST API（會回 `Invalid access token`）——以後要碰 Cloudflare API 就用這個新 token

### Coolify（唯一一台伺服器，還是測試機規格）

伺服器 `startkiter-managed-fleet-01`（Coolify server id `glonp0nzu6amlurvdo8rznk5`）：

| 項目 | 值 |
|---|---|
| Provider | Vultr |
| IP | `45.76.187.247` |
| OS | Ubuntu 26.04 LTS, x86_64, kernel 7.0.0-29-generic |
| CPU | 2 vCPU |
| Memory | 3.3 GB |
| Docker | 29.7.2 |
| Compose | 5.5.0 |
| Proxy | Traefik（running，設定已同步） |
| Up since | 2026-08-18 15:01:26 |
| SSH | root, port 22 |
| 現有 Resources | `docker-image-rzbtl1kdjd9mdtfabeoaa9tj`（nginx demo）、`startkiter-coolify-git-deploy-test`（git 部署測試），皆屬 project `startkiter-test` / environment `production` |

這台就是 `docs/coolify-vps-setup-runbook.md` 那次驗證用的機器（建立時間跟 runbook 日期都是 2026-08-18），目前只跑兩個測試用 resource，**還沒扛過任何正式服務**（沒有 Chatwoot、沒有主站）。2 vCPU / 3.3GB 這個規格如果要同時扛「主站 Next.js + Postgres」＋「Chatwoot（Rails+Redis+Postgres）」，大概率不夠。

**已確認（2026-08-22）：**
- Fish 說「已經買好也串好 vps」就是指這台 Vultr 機器，沒有第二台待接的新機器。
- 曾考慮用 Zeabur 上那台 Tencent Cloud 東京機器（2 核/7.5GB，當時查到只用了 2.7GB，還有 4.9GB 空間）塞 Chatwoot 省一台 VPS 錢——**已否決**：那台跑的 `thetu-platform-production` / `wumin` 是客戶的正式營運服務，不能碰（Fish 2026-08-22 明確定案）。

**還沒決定（不要自己猜，等 Fish 選）：**
1. 把現有這台 Vultr VPS 升級規格（加 RAM），主站＋Chatwoot 塞同一台，一張帳單
2. 另外買一台便宜的小 VPS 專門跑 Chatwoot（Chatwoot 吃得不多，理論上小方案就夠），維持「Chatwoot 獨立主機」的原始設計決策
3. 硬塞進現有 3.3GB（不建議，主站+Chatwoot 一起擠很容易 OOM，尤其流量一上來）

沒有 Vultr API Key（`.env` 跟全域憑證索引都查不到），真的要選 1 或 2 之前需要先查 Vultr 帳號實際升級/新開機的價格，目前只能給概念性比較，不是報價。

### LINE Messaging Channel（已建好）

- 官方帳號「StartKiter 客服」（`@958ghjex`），Provider 掛在既有「1-開發」（`2001780603`）底下
- Channel ID `2011202536`、Channel Secret、長效 Channel Access Token 都已寫進 `.env` 的 `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` / `LINE_MESSAGING_CHANNEL_SECRET`
- Webhook URL 還沒填（等主站遷移到 VPS、有真正能打通的網址後再回頭設定）
- 隱私權政策／服務條款網址（選填）還沒填

### Telegram Bot（已拿到，已存）

- Token 已存進 `.env` 的 `TELEGRAM_BOT_TOKEN`
- Webhook 一樣要等主站網址確定才能設定

## 4. 已定案的決策（2026-08-22）

1. **VPS 規劃：只用現有這台 Vultr VPS（`startkiter-managed-fleet-01`），不買第二台。** 主站 + Chatwoot 都塞這台。原本「Chatwoot 要獨立 VPS」的規則是指「不跟買家自己部署的機器混」，不是「不能跟自己的主站混」——這台上面目前沒有任何買家資源，混在一起不違反原意。技術上 Coolify 本來就支援一台機器跑多服務。記憶體預估：主站 300-500MB + Chatwoot 1.5-2GB ≈ 2-2.5GB，這台有 3.3GB，早期流量小夠撐，之後吃緊再升級規格，不用現在先買機器。
2. **Zeabur 東京機器（Tencent Cloud）已否決**：那台跑的是客戶的正式營運服務（`thetu-platform-production` / `wumin`），不能碰，只是查過但沒有用。
3. **`startkiter.dev` 網域結構已定案**：`startkiter.dev` 本體先空著（之後放行銷首頁），主站用 `app.startkiter.dev`，Chatwoot 用 `support.startkiter.dev`。**兩筆 DNS A 記錄已建好**（都指向 `45.76.187.247`，僅 DNS/灰雲朵，等服務裝上去讓 Coolify 簽 SSL），已用 `dig` 驗證解析成功。

## 5. 還沒動工的部分（下一步）

1. 把主站從 Vercel 遷移到這台 Vultr VPS（走 Coolify Docker 部署），DB 繼續用 Neon 還是搬進 VPS 自架 Postgres——待決定，傾向繼續用外部 Neon（省 VPS 資源）
2. 在同一台 VPS 上用 Coolify 的一鍵範本裝 Chatwoot，接上 `support.startkiter.dev`
3. 主站部署好、網址確定後，回頭把 LINE / Telegram 的 webhook 網址填進 LINE Developers Console / Telegram Bot API

## 5. 環境設定變更（已生效，非討論項）

- **所有網頁瀏覽器操作以後只走 `/ego-browser`**，禁用 mirasim `gui_task`/`gui_act` 系列、peekaboo browser 等其他工具。已寫進 `~/.agent-guardrails/deny-list.md`（全 Agent SSOT）並跑過 `sync_agent_rules.py` 同步進 Codex 等其他 CLI 的 AGENTS.md 副本。這條規則只有 Fish 能改。
