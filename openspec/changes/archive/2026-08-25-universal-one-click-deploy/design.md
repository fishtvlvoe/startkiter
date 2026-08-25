## Context

`deploy/zeabur.yaml` 是目前 repo 唯一的部署設定檔，格式是 Zeabur 專屬的 template schema，只有 Zeabur 讀得懂。買家想放在別的平台（自己的 VPS、Railway、Render、Fly.io）完全沒有路可走。StartKiter 官網本身已經證實這套 Next.js monorepo 能在 Coolify VPS 上跑（`app.startkiter.dev` 目前回應正常）；同源產品 woomin（`/Users/fishtv/Development/products/woomin/realms`）repo 根目錄同時放了 `Dockerfile` 與 `.zeaburignore`，證實同一份代碼可以兩邊都吃。supastarter 官方文件（`docs/reference/supastarter-nextjs-docs/deployment/docker.mdx`）也提供了對應的 Dockerfile 範本可以直接參照。

## Goals / Non-Goals

**Goals:**

- 一份 Dockerfile 讓 Zeabur、Coolify、任何支援 Docker 的 VPS 都能部署同一份代碼
- 沒填金鑰時仍要能開機（既有 fail-closed 行為在容器化後不能被破壞）
- 部署設定與既有 Zeabur 路徑並存，不是二選一的破壞性替換

**Non-Goals:**

- 不做 Coolify 的一鍵服務範本
- 不做部署狀態回報或開站教學內容（留給後續 change）
- 不動 `apps/marketing` 的部署設定

## Decisions

### 採用 woomin 已驗證的 multi-stage Dockerfile 樣板，不重新設計 build 流程

`packages/course/`、`packages/payments/` 等既有套件的抽取來源就是同一個代碼家族（woomin/thetu），woomin 的 Dockerfile 已經在正式環境跑過，直接照抄其 turbo prune → 安裝 → build → standalone runner 的四階段結構，只調整套件過濾目標（`turbo prune saas` 對應本專案的 `apps/saas`）。

Alternatives Considered：
- 從零設計一份新的 Dockerfile——否決，重複造輪子且引入未經驗證的風險，supastarter 官方文件與 woomin 的樣板已經是同一套邏輯，沒有理由自創
- 直接請 Coolify／Zeabur 各自用原生 buildpack（Nixpacks）自動偵測，不寫 Dockerfile——否決，這正是目前「被鎖死在單一平台慣例」的根因；Dockerfile 才是唯一能讓多個平台與裸機 VPS 共用同一份建置邏輯的形式

### `apps/marketing` 不在本次範圍內

買家實際安裝、部署到自己伺服器的是產品本體 `apps/saas`；`apps/marketing` 是 StartKiter 自己的官方銷售頁，不是買家安裝包的一部分。

Alternatives Considered：
- 兩個 app 一起做——否決，範圍會膨脹且銷售頁的部署已經有獨立的 `startkiter-official-site-cleanup` change 在排隊處理，職責分開

## Implementation Contract

**Behavior**：任何人在 repo 根目錄執行 `docker build -f apps/saas/Dockerfile . -t startkiter` 後 `docker run -p 3000:3000 startkiter`，容器啟動成功並在 3000 port 回應 HTTP 請求；未設定 `PAYUNI_*` 等金流環境變數時，`/api/checkout` 仍回傳既有 fail-closed 的 503（不是 500 或崩潰）。

**Interface / data shape**：
- `apps/saas/Dockerfile`：四個 build stage（`base` / `builder` / `installer` / `runner`），最終 `CMD` 啟動 `apps/saas/.next/standalone` 產出的 `server.js`
- `apps/saas/.dockerignore`：排除 `node_modules`、`.next`、`.git` 等非必要內容
- `apps/saas/next.config.ts`：`output: "standalone"`
- `README.md` 「一鍵部署」段落：新增一個「自架 VPS（Docker）」小節，列出 `docker build`/`docker run` 指令與需要填的環境變數指引連結

**Failure modes**：
- Docker build 因記憶體不足失敗（Next.js production build 吃記憶體）→ README 內註明建議建置機至少 4GB RAM，並提供 `NODE_OPTIONS=--max-old-space-size=4096` 的設定方式
- 環境變數缺漏 → 沿用既有各模組 fail-closed 慣例（PAYUNi 503、其他模組個別降級），本 change 不新增或改變任何模組的 fail-closed 邏輯本身，只確保容器化後這些既有行為仍然成立

**Acceptance criteria**：
- 本機 `docker build` + `docker run` 成功，`curl -I http://localhost:3000` 回應 200 或合理的重導向
- 清空所有金流／第三方服務環境變數後重跑上述指令，`/api/checkout` 回應 503（不是 500 或程序崩潰）
- Zeabur 用既有 `deploy/zeabur.yaml` 部署流程不受影響（回歸驗證）
- Coolify 後台用「Build Pack: Dockerfile」手動建立一個測試 resource，成功部署並可存取（一次性人工驗證，不寫自動化測試）

**Scope boundaries**：範圍內＝上述 Dockerfile／.dockerignore／next.config.ts／README 四個檔案與既有 `one-click-deploy` spec 的 Requirement 擴充；範圍外＝心跳回報、開站教學內容、Coolify 一鍵範本、`apps/marketing`。

## Risks / Trade-offs

- [Risk] Next.js production build 記憶體需求高，買家在小型 VPS（如 1GB RAM）建置會失敗 → Mitigation：README 明確標註最低建議規格與 `NODE_OPTIONS` 設定，並建議規格不足時改用 `managed` hosting tier（既有 `managed-hosting-tiers` 能力）
- [Risk] `standalone` 輸出模式可能遺漏某些執行期需要的靜態檔案（Next.js 已知常見坑）→ Mitigation：Dockerfile 明確複製 `.next/static` 與 `public` 目錄，比照官方文件與 woomin 現有樣板逐項核對
- [Risk] Zeabur 既有部署路徑可能因為新增 Dockerfile 而被 Zeabur 誤判改走 Dockerfile 建置、行為跟 `deploy/zeabur.yaml` 定義的不一致 → Mitigation：apply 階段先在測試環境用 Zeabur 部署一次確認其仍照 `deploy/zeabur.yaml` 的設定走，若 Zeabur 優先偵測到 Dockerfile 導致行為改變，需在 `deploy/zeabur.yaml` 明確指定建置方式覆蓋預設偵測

## Migration Plan

1. 新增 `apps/saas/Dockerfile`、`.dockerignore`，修改 `next.config.ts`
2. 本機 `docker build`／`docker run` 驗證成功且 fail-closed 行為正常
3. 測試環境用 Zeabur 既有流程重新部署一次，確認未受影響（回歸驗證）
4. 測試環境在 Coolify 手動建立一個 `Build Pack: Dockerfile` 的 resource，驗證能成功部署
5. 更新 README「一鍵部署」段落與 `one-click-deploy` spec
6. Rollback：純新增檔案與 config 選項，未修改任何既有 runtime 邏輯；回滾＝revert commit，`deploy/zeabur.yaml` 路徑不受影響

## Open Questions

- 是否需要在 CI 加一個「docker build 是否成功」的自動化檢查，避免未來套件依賴變動悄悄弄壞 Dockerfile 而沒人發現——本次先靠 apply 階段人工驗證一次，是否要投資自動化留給後續判斷
