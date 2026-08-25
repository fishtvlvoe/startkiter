## Why

repo 根目錄目前只有一份 `deploy/zeabur.yaml`，沒有任何 `Dockerfile`，等於買家的一鍵部署被鎖死只能用 Zeabur 一家平台。StartKiter 官網本身已經證實能在 Coolify VPS 上跑（`app.startkiter.dev` 正常運作），同源產品 woomin（`https://github.com/woomini-flow/woomin`）也已經證實同一套代碼可以同時放一份 `Dockerfile` 讓 Zeabur 讀，也讓任何有 Docker 的 VPS 讀。買家的伺服器不該被我們限定平台。

## What Changes

- 新增 `apps/saas/Dockerfile` 與 `apps/saas/.dockerignore`，照抄 woomin 現有已驗證的 multi-stage build 模式（turbo prune → 安裝 → build → standalone runner），使產出的容器影像能在任何支援 Docker 的環境啟動
- 修改 `apps/saas/next.config.ts` 新增 `output: "standalone"`，讓 Next.js 產出獨立可執行的伺服器檔案
- 修改 `README.md` 的「一鍵部署」段落：從只列 Zeabur 按鈕，改成同時說明「Zeabur 一鍵部署」（沿用既有 `deploy/zeabur.yaml`，不移除）與「任何支援 Docker 的 VPS」兩條並存的部署路徑，並附上對應的 `docker build`/`docker run` 指令
- 修改既有 `openspec/specs/one-click-deploy/spec.md` 的 Requirement：從「只驗證 deploy 設定檔存在、沒填金鑰也能開機」擴充為「透過標準 Dockerfile 支援任一相容 Docker 的平台」，並補上原本空白的 Purpose 段落

## Non-Goals (optional)

- 不做 Coolify 的一鍵服務範本（類似 Chatwoot 那種 one-click template）——開發成本高，本次只確保 Coolify 能用既有的「Build Pack: Dockerfile」選項手動讀取同一份 Dockerfile 成功部署
- 不做買家部署狀態的心跳回報／儀表板串接（留給 `buyer-heartbeat-dashboard` change）
- 不做部署完成後的開站教學或檢查清單內容（留給 `gamified-onboarding-course` change）
- 不修改 `apps/marketing`（銷售頁）的部署設定，本次只做買家實際安裝的 `apps/saas`
- 不移除既有的 `deploy/zeabur.yaml`，Zeabur 路徑維持並存

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `one-click-deploy`: 從只驗證「deploy 設定檔存在、缺金鑰仍可開機」擴充為「透過標準 Dockerfile 讓任一支援 Docker 的平台皆可完成一鍵部署」，並補齊原本缺漏的 Purpose 說明

## Impact

- Affected specs: Modified: `one-click-deploy`
- Affected code:
  - New: apps/saas/Dockerfile, apps/saas/.dockerignore
  - Modified: apps/saas/next.config.ts, README.md
  - Removed: (none)
- Dependencies 新增：無
- 環境變數新增：無
