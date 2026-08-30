# StartKiter Coolify + VPS 正式部署 SOP

**版本日期：** 2026-08-28
**適用範圍：** `apps/saas`、`apps/marketing` 部署到 Coolify 管理的 VPS
**正式網域：** `startkiter.dev`（marketing）、`app.startkiter.dev`（SaaS）

這份文件是正式、可重複的部署流程。歷史驗證紀錄留在 [`coolify-vps-setup-runbook.md`](./coolify-vps-setup-runbook.md)，兩者若有差異，以本文件為準。

## 前置需求

- Coolify Cloud 帳號可登入 `app.coolify.io`，且能管理 StartKiter project。
- 一台可由 Coolify Cloud 透過 SSH 連線的 Linux VPS。現行主機是 `startkiter-managed-fleet-01`，Vultr、Ubuntu 26.04、2 vCPU / 3.3GB RAM、Docker 29.7.2。
- GitHub repository `fishtvlvoe/startkiter` 的 `main` 分支可被 Coolify 拉取。
- `startkiter.dev` zone 的 Cloudflare DNS 管理權限。DNS token 只從機器上的集中憑證索引取得，不放進 repo 或本文件。
- 外部 Neon database 已建立，`DATABASE_URL` 以 Coolify secret environment variable 注入；不要把連線字串寫入 `.env`、Dockerfile、部署腳本或 log。
- 本機驗證工具：`git`、`pnpm`、`curl`、`dig`、`ssh`。部署前在 repo 根目錄執行 `pnpm install --frozen-lockfile`。

## Coolify resource 建立步驟

### 1. 連接 VPS

1. 在 Coolify Cloud 的 Servers 建立或選取 VPS，使用 Coolify 管理的 ED25519 key。
2. 以 VPS 公開 IP 或主機名稱建立連線，執行 Validate connection。
3. 確認 server 顯示 ready，再建立 Project `startkiter-test` 的 `production` environment。
4. 不在 VPS 另裝一套自架 Coolify；VPS 維持純 Linux + Docker，由 Coolify Cloud 管理。

### 2. 建立 `apps/saas` resource

在 Project → New resource → Git repository 建立 application：

| 設定 | 值 |
|---|---|
| Repository | `git@github.com:fishtvlvoe/startkiter.git` |
| Branch | `main` |
| Build Pack | Dockerfile |
| Dockerfile location | `/apps/saas/Dockerfile` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm --filter @startkiter/database exec prisma generate --no-hints && pnpm --filter @startkiter/saas run build` |
| Start command | `node apps/saas/server.js` |
| Exposed port | `3000` |
| Domain | `https://app.startkiter.dev` |

儲存後設定 environment variables，再 Deploy。SaaS 的 live acceptance 是 `curl -I https://app.startkiter.dev` 回成功狀態或合理 redirect（目前預期導向 `/login`）。

### 3. 建立 `apps/marketing` resource

使用同一個 repository、branch 與 environment 建立第二個 application：

| 設定 | 值 |
|---|---|
| Repository | `git@github.com:fishtvlvoe/startkiter.git` |
| Branch | `main` |
| Build Pack | Dockerfile |
| Dockerfile location | `/apps/marketing/Dockerfile` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm --filter @startkiter/database exec prisma generate --no-hints && pnpm --filter @startkiter/marketing run build` |
| Start command | `node apps/marketing/server.js` |
| Exposed port | `3000` |
| Domain | `https://startkiter.dev` |

`apps/marketing/Dockerfile` 使用 Next.js standalone output。它會在 installer stage 將 `@swc/helpers` 的實體 package 一併放入 runtime 的 pnpm store，避免 standalone 只帶 symlink、容器啟動時找不到 ESM helper。部署後必須查 Coolify resource 與 container 都是 running，再驗證網域；不能只看 HTTP 結果。

### 4. Deploy 與回讀

1. 先儲存設定，再從 Coolify resource 執行 Deploy / Redeploy。
2. 等 deployment 狀態為 finished，確認 deployment commit 是預期的 Git commit。
3. 回讀 resource 的 status、last online time、restart count 與 container status。
4. 若 Coolify API 操作自動化，token 只由 shell 的暫存環境變數傳入；API path 使用 Coolify 官方 `/deploy` 與 `/deployments/{deployment_uuid}`，不把 token 寫入腳本或輸出。

## 環境變數清單（機密／非機密分類表）

### 設定原則

機密值一律在 Coolify Environment Variables 介面標記為 Secret。下表只列名稱與用途，不列任何實際值。Build log、commit、截圖與實作筆記也不得出現機密值。

### 機密變數

| 變數 | 用途 |
|---|---|
| `DATABASE_URL` | Neon database 連線字串 |
| `BETTER_AUTH_SECRET` | Better Auth session/signing secret |
| `SETTINGS_ENCRYPTION_KEY` | 站內設定加密金鑰 |
| `CRON_SECRET` | cron endpoint 驗證密鑰 |
| `PAYUNI_MERCHANT_ID`, `PAYUNI_HASH_KEY`, `PAYUNI_HASH_IV` | PAYUNi 認證 |
| `EINVOICE_MERCHANT_ID`, `EINVOICE_HASH_KEY`, `EINVOICE_HASH_IV` | 電子發票認證 |
| `SHOPLINE_MERCHANT_ID`, `SHOPLINE_CLIENT_KEY`, `SHOPLINE_API_KEY`, `SHOPLINE_SIGN_KEY` | Shopline credentials；即使是識別值也按 Secret 管理 |
| `GOOGLE_CLIENT_SECRET`, `LINE_CHANNEL_SECRET`, `GITHUB_CLIENT_SECRET` | OAuth secrets |
| `LINE_COMMUNITY_INVITE_URL` | 學員社群邀請連結；runtime 只發給有權限學員，儲存與部署畫面仍按 Secret 管理 |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`, `LINE_MESSAGING_CHANNEL_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | Messaging credentials |
| `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID` | GitHub App 履約憑證 |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage credentials |
| `CHATWOOT_API_ACCESS_TOKEN`, `CHATWOOT_WEBHOOK_SECRET` | Chatwoot server credentials |
| `RESEND_API_KEY`, `MAILGUN_API_KEY`, `POSTMARK_SERVER_TOKEN`, `MAIL_USER`, `MAIL_PASS` | Email provider credentials |
| `OPENAI_API_KEY` | AI provider credential |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe server/webhook credentials |
| `CREEM_API_KEY`, `DODO_PAYMENTS_API_KEY`, `LEMONSQUEEZY_API_KEY`, `POLAR_ACCESS_TOKEN` | 未啟用 provider credentials |
| `CREEM_WEBHOOK_SECRET`, `DODO_PAYMENTS_WEBHOOK_SECRET`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `POLAR_WEBHOOK_SECRET` | 未啟用 provider webhook secrets |
| `ASSIGNMENT_UPLOAD_CLEANUP_SECRET`, `LESSON_MESSAGE_UPLOAD_CLEANUP_SECRET` | 內部 cleanup endpoint secrets |
| `COOLIFY_API_TOKEN`, `COOLIFY_PRIVATE_KEY_UUID` | 部署自動化憑證；不注入 runtime application |

### 非機密變數

| 變數 | 用途／例值 |
|---|---|
| `NODE_ENV` | 執行環境，例如 `production` |
| `PORT` | 容器監聽 port，例如 `3000` |
| `HOSTNAME` | 容器 bind host，例如 `0.0.0.0` |
| `BETTER_AUTH_URL` | SaaS 公開 URL，例如 `https://app.startkiter.dev` |
| `NEXT_PUBLIC_SAAS_URL` | 前端使用的 SaaS URL |
| `NEXT_PUBLIC_MARKETING_URL` | 前端使用的 marketing URL，例如 `https://startkiter.dev` |
| `NEXT_PUBLIC_DOCS_URL` | 文件站 URL，例如 `https://docs.startkiter.dev` |
| `NEXT_PUBLIC_VERCEL_URL` | 舊平台相容欄位；停用時保持空值 |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, `NEXT_PUBLIC_MIXPANEL_TOKEN`, `NEXT_PUBLIC_PIRSCH_CODE`, `NEXT_PUBLIC_PLAUSIBLE_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_UMAMI_TRACKING_ID` | 前端分析／追蹤設定；公開值不得存放 secret |
| `ADMIN_EMAIL`, `SUPPORT_EMAIL`, `MAIL_FROM` | 管理員／客服／寄件地址 |
| `GOOGLE_CLIENT_ID` | OAuth public identifier |
| `MAIL_HOST`, `MAIL_PORT`, `MAILGUN_DOMAIN` | SMTP／Mailgun endpoint 設定；帳號與密碼仍屬機密 |
| `PAYUNI_API_URL`, `EINVOICE_PROVIDER`, `EINVOICE_TEST_MODE`, `EINVOICE_ENABLED` | provider endpoint 與 feature flags；credentials 仍屬機密 |
| `GITHUB_APP_ID`, `GITHUB_KIT_ORG`, `GITHUB_KIT_REPO`, `GITHUB_KIT_TEMPLATE_REPO` | GitHub App／履約識別資料 |
| `GITHUB_CLIENT_ID`, `LINE_CHANNEL_ID`, `LINE_MESSAGING_CHANNEL_ID` | OAuth／Messaging public identifiers |
| `GITHUB_APP_PRIVATE_KEY_PATH`, `S3_ENDPOINT`, `S3_REGION` | 本機路徑／storage endpoint 設定 |
| `BUNNY_LIBRARY_ID` | Bunny media library identifier |
| `NEXT_PUBLIC_ASSIGNMENTS_BUCKET_NAME`, `NEXT_PUBLIC_AVATARS_BUCKET_NAME`, `NEXT_PUBLIC_LESSON_MESSAGES_BUCKET_NAME`, `NEXT_PUBLIC_MEDIA_BUCKET_NAME` | public bucket names |
| `NEXT_PUBLIC_CHATWOOT_BASE_URL`, `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` | 前端 Chatwoot widget 設定；若 provider 要求保密則改標 Secret |
| `CHATWOOT_BASE_URL`, `CHATWOOT_ACCOUNT_ID`, `CHATWOOT_INBOX_ID`, `CHATWOOT_WEBHOOK_DEBUG` | Chatwoot endpoint／識別／debug 設定 |
| `PRICE_ID_LIFETIME`, `PRICE_ID_PRO_MONTHLY`, `PRICE_ID_PRO_YEARLY` | provider price identifiers |
| `LEMONSQUEEZY_STORE_ID` | provider store identifier |
| `SHOPLINE_TEST_MODE` | Shopline mode flag |
| `COOLIFY_PROJECT_UUID`, `COOLIFY_APP_REPO_URL`, `COOLIFY_APP_GIT_BRANCH` | 部署目標識別資料 |
| `CI` | CI 行為設定 |
| `TRUSTED_PROXY_COUNT` | Rate-limit 解析 `X-Forwarded-For` 時信任的代理跳數。預設 `1`＝假設流量只經過 Coolify Traefik 單層（Traefik append 真實連線 IP 在鏈尾）。從右往左數 N 段取可信 client IP；左側客戶端可偽造。若前面再加 CDN／橘雲／第二層代理，必須改成實際跳數。設 `0`＝完全不信任該 header。應用容器不應可被外網直連繞過 Traefik，否則整條鏈仍可被偽造。 |

上表中若某 provider 對識別資料也要求保密，Coolify 可直接將該欄位升級標記為 Secret；最低要求是不把 credential 值寫進 repo。未列於本表的新變數，加入 resource 前先補進分類表。

## DNS 與 SSL 驗證步驟

1. Cloudflare DNS 新增 A record：`startkiter.dev` 與 `app.startkiter.dev` 指向 Coolify 管理的 VPS IP。若用 CNAME，目標必須是已能解析到該 VPS 的受管主機名稱。
2. 初次簽證期間將 record 設為 DNS only（灰雲）。不要讓 Cloudflare Proxy 橘雲遮住 Coolify 的 HTTP challenge。
3. 在對應 Coolify resource 的 Domains 填入完整 `https://` URL，儲存後 Redeploy，讓 Traefik 申請 Let's Encrypt 憑證。
4. 驗證 DNS：

   ```bash
   dig +short startkiter.dev
   dig +short app.startkiter.dev
   ```

5. 驗證 SSL 與 response：

   ```bash
   curl -svI https://startkiter.dev 2>&1 | rg -i 'HTTP/|location:|issuer:|verify'
   curl -svI https://app.startkiter.dev 2>&1 | rg -i 'HTTP/|location:|issuer:|verify'
   curl -L -sS -o /dev/null -w '%{http_code}\n' https://startkiter.dev
   ```

   `startkiter.dev` 直接回 `307` 導向語系路徑是合理結果；follow redirect 後必須是 `200`。任一個 domain 出現 5xx、TLS verify failure 或沒有對應 container，都算部署失敗。

## 故障排除

### 本次 `startkiter.dev` 503（2026-08-26～2026-08-28）

Coolify resource `8x5bmcpct9dri6tnnhjleeed` 起初是 `exited:unhealthy`，Traefik 因為沒有可用 upstream 回 `HTTP 503`。查 deployment 與 container log 後，真正根因是 `apps/marketing` 的 Next.js standalone image 沒有把 pnpm store 中 `@swc/helpers/esm/_interop_require_default.js` 的實體檔案帶進 image；runtime 的 standalone symlink 因此解析到不存在的檔案，container 啟動即 crash。這不是 VPS 或 DNS 故障。

處置順序：

1. 先保留 Coolify resource 與 log，不以 HTTP 503 直接推測成硬體不足。
2. 清除會搶 port 的舊手動 container，只保留 Coolify resource 管理的 container。
3. 將 `apps/marketing/Dockerfile` 改為在 installer stage 複製完整 `@swc/helpers` package 到 runtime pnpm store，再讓 standalone server 使用 `node apps/marketing/server.js` 啟動。
4. 修正 `pnpm-lock.yaml` 中 `@paid-tw/einvoice-ezpay` patch hash 與實際 patch 檔一致，讓 `pnpm install --frozen-lockfile` 可在 Coolify 重現。
5. 以新 commit Redeploy，等待 deployment finished，回讀 resource status、container status、restart count，再做 live curl。

本次最新部署驗證結果：deployment `dxcl5unsc8wj4j0m1swilc4i` finished，commit `228847af`；Coolify container 為 running、restart count 為 `0`（2026-08-28 02:03）；`curl -L https://startkiter.dev` 回 `200`，`curl -I https://app.startkiter.dev` 回 `307` 導向 `/login`。headers 存於 `/tmp/startkiter-vps-production-final-startkiter-dev.headers` 與 `/tmp/startkiter-vps-production-final-app.headers`。

### Build 失敗：`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`

確認 log 的 patched dependency 名稱與 lockfile hash，重新計算 patch 檔 hash 並更新 lockfile。修完先在 repo 根目錄執行 `pnpm install --frozen-lockfile`，再 Redeploy；不要把 `--no-frozen-lockfile` 當正式修法。

### Container 啟動後 `MODULE_NOT_FOUND`

先看完整 module path 是否落在 `.pnpm/.../node_modules/@swc/helpers/esm/`。若是，檢查 Dockerfile 是否只複製 standalone output 而沒有把 pnpm store 的實體 helper package 帶入 runtime。修正 image assembly 後重新 build；不要在 VPS 上手動安裝 package，否則下次部署會被覆蓋。

### DNS 已解析但仍 503

確認 DNS IP、Coolify domain 綁定、resource status、container port `3000`、container log 與 Traefik route。若 resource 是 `restarting`、`exited` 或 `unhealthy`，先修 container 啟動原因；DNS 解析成功不代表應用已可用。

### SSL 簽發失敗

確認 DNS record 是灰雲、80/443 可從外部連入、Coolify domain 含 `https://` 且沒有綁到錯的 resource。修正後從 Coolify Redeploy，然後用 `curl -svI` 確認 certificate issuer 與 verify 結果。

### 資源壓力

本次 503 已證實不是資源不足。維運時仍要檢查 Coolify restart count、Docker memory/CPU 與 VPS 的 OOM killer。若出現 OOM、持續重啟或長時間資源達警戒值，另開硬體升級 change，不在沒有指標時直接 resize。

## 資料庫與硬體規格

**明確決策（2026-08-28，沿用 2026-08-22 的單 VPS 營運決策）：**

- **Database：外部 Neon。** `apps/saas` 與 `apps/marketing` 透過 Coolify Secret `DATABASE_URL` 連線；不在這台 VPS 自架 PostgreSQL。本次沒有資料庫搬遷或 schema 直接修改。
- **VPS：維持 2 vCPU / 3.3GB RAM。** 現行主機 `startkiter-managed-fleet-01` 先承載主站；本次 503 是 standalone runtime image 缺檔，不是資源不足，因此不執行 4 vCPU / 8GB resize。
- **升級門檻：** 只有在實際出現 OOM、container 持續重啟、或 Coolify/Docker 指標長時間顯示容量不足時，才另開 change 記錄升級後實際規格與停機窗口。Chatwoot 若日後部署到同機，納入同一份容量檢查，不在本 change 內執行部署。

這個決策取代討論稿中的「傾向 Neon」與「建議升級」措辭；後續文件引用目前部署規格時，以本節為準。

## 每次部署的最小驗收清單

- `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm type-check`、`pnpm build` 全部 exit 0。
- Coolify deployment finished，Git commit 是預期版本。
- Coolify resource 與 container 狀態都是 running，restart count 沒有在持續增加。
- `curl -L -sS -o /dev/null -w '%{http_code}' https://startkiter.dev` 是 `200`。
- `curl -sS -o /dev/null -w '%{http_code}' https://app.startkiter.dev` 是成功狀態或合理 redirect，且兩者沒有 5xx。
- 驗收記錄同時保存 HTTP headers 與 underlying resource state；只存 HTTP 狀態碼不算完成。
