# vps-production-deployment 實作筆記

日期：2026-08-28
分支：`main`

## 診斷與修復

- Coolify application：`startkiter-marketing`，resource UUID `8x5bmcpct9dri6tnnhjleeed`。
- 初始狀態：`exited:unhealthy`，`startkiter.dev` 回 `HTTP 503`，Coolify/Traefik body 是 `no available server`。
- Coolify 與 VPS 連線正常，`app.startkiter.dev` 同期回 `307` 導向 `/login`；DNS/SSL 不是本次 503 根因。
- container crash log 的根因是 Next.js standalone image 只保留 pnpm symlink，沒有把 `@swc/helpers/esm/_interop_require_default.js` 實體檔案帶入 runtime image，導致 `MODULE_NOT_FOUND`。
- 另發現第一次正式 Redeploy 會被 stale patched-dependency hash 擋住；已將 `pnpm-lock.yaml` 的 `@paid-tw/einvoice-ezpay` patch hash 對齊實際 patch 檔，`pnpm install --frozen-lockfile` 通過。
- 已將 Coolify application start command 設為 `node apps/marketing/server.js`，並在 `apps/marketing/Dockerfile` installer stage 補齊完整 `@swc/helpers` package 到 runtime pnpm store。
- 舊手動 container `startkiter-marketing`、`startkiter-marketing-production` 已由 Fish 移除，只保留 Coolify 管理的 resource container。

## 部署證據

| 項目 | 結果 |
|---|---|
| 修復 commit | `228847af` `fix: 完成官網 VPS standalone 部署修復`（包含 `45fb8248` 的 runtime 修復） |
| Coolify deployment | `dxcl5unsc8wj4j0m1swilc4i`，`finished` |
| Coolify resource | `running:unknown`，`server_status=true` |
| container | `Up`，image tag 為 `8x5bmcpct9dri6tnnhjleeed:228847af...` |
| restart count | `0`（回讀時間 2026-08-28 02:03） |
| `startkiter.dev` | 直接請求 `307` → `/zh-tw`；follow redirect `200` |
| `app.startkiter.dev` | `307` → `/login` |

HTTP headers 已保存於：

- `/tmp/startkiter-vps-production-final-startkiter-dev.headers`
- `/tmp/startkiter-vps-production-final-app.headers`

兩份 headers 由 `curl` 直接取得，沒有寫入 credentials。marketing response body 驗證到 Next.js HTML 與目前既有頁面標記；文案與假資料清理留給 `marketing-site-real-content` change。

## 本地驗證

- `pnpm install --frozen-lockfile`：exit 0
- `pnpm test`：`20 successful, 20 total`
- `pnpm type-check`：`26 successful, 26 total`
- `pnpm build`：`2 successful, 2 total`
- Dockerfile assertion：確認 installer source 有 ESM helper，standalone 原始輸出沒有，補充 copy 步驟存在且目標為 pnpm store path
- Coolify clean rebuild：以 `228847af` 完成 Docker build、container startup 與 live liveness；精確 symlink 解析步驟在 Debian `node:22-slim` build log 通過

## 決策記錄

本次採用外部 Neon，沒有在 VPS 自架 PostgreSQL；現有 `startkiter-managed-fleet-01` 維持 2 vCPU / 3.3GB RAM，沒有執行 resize。503 已定位為 image assembly 缺檔，不是硬體容量事故。若之後出現 OOM、持續 restart 或實際容量指標達門檻，另開 change 記錄升級與停機窗口。

## 範圍檢查

- 沒有修改 `apps/saas` 的 Coolify 設定。
- 沒有部署 Chatwoot 或修改 `support.startkiter.dev`。
- 沒有在本 change 修改行銷文案；目前首頁仍有既有 demo 文案，交由 `marketing-site-real-content` 處理。
- 沒有把 Coolify token、Neon connection string 或任何 provider secret 寫入文件、script、commit 或本筆記。
