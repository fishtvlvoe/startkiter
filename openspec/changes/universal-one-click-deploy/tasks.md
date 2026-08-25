## 1. Dockerfile 與建置設定（對應設計決策「採用 woomin 已驗證的 multi-stage Dockerfile 樣板，不重新設計 build 流程」）

- [ ] 1.1 修改 `apps/saas/next.config.ts` 新增 `output: "standalone"`，使 Next.js 產出可獨立執行的伺服器檔案；驗證目標：`pnpm --filter saas build` 成功產出 `apps/saas/.next/standalone` 目錄
- [ ] 1.2 新增 `apps/saas/Dockerfile`，照抄 woomin（`/Users/fishtv/Development/products/woomin/realms/Dockerfile`）與 supastarter 官方文件的四階段 multi-stage build（base/builder/installer/runner），對應 Requirement「Repository provides a one-click deploy path」的 Scenario「Dockerfile builds and runs on any Docker-compatible host」；驗證目標：`docker build -f apps/saas/Dockerfile . -t startkiter` 成功產出映像檔
- [ ] 1.3 新增 `apps/saas/.dockerignore`，排除 `node_modules`／`.next`／`.git` 等非必要內容；驗證目標：`docker build` 後映像檔大小明顯小於未排除時（人工比對）

## 2. 本機驗證（對應 Implementation Contract 的 Acceptance criteria）

- [ ] 2.1 執行 `docker run -p 3000:3000 startkiter` 並用 `curl -I http://localhost:3000` 確認回應 200 或合理重導向，對應 Requirement「Repository provides a one-click deploy path」的 Scenario「Dockerfile builds and runs on any Docker-compatible host」的 Example「Local Docker build and run」；驗證目標：curl 回應非連線失敗
- [ ] 2.2 清空容器所有金流／第三方服務環境變數後重跑 2.1，確認 `/api/checkout` 回應既有的 fail-closed 503（不是 500 或程序崩潰），對應 Requirement「One-click deploy succeeds without payment or OAuth keys configured」；驗證目標：curl 對 `/api/checkout` 回應狀態碼為 503

## 3. 跨平台回歸驗證（對應設計決策「apps/marketing 不在本次範圍內」與 Migration Plan）

- [ ] 3.1 在測試環境用既有 `deploy/zeabur.yaml` 流程重新部署一次，確認 Zeabur 部署行為未受本次新增 Dockerfile 影響；驗證目標：Zeabur 部署成功且服務正常回應，與本次改動前行為一致
- [ ] 3.2 在測試環境 Coolify 後台手動建立一個「Build Pack: Dockerfile」的 resource，指向本次的 `apps/saas/Dockerfile`，確認能成功部署並可存取；驗證目標：該 resource 部署完成後 curl 回應 200 或合理重導向
- [ ] 3.3 確認本次改動未觸及 `apps/marketing`，落實設計決策「`apps/marketing` 不在本次範圍內」；驗證目標：`git diff --stat` 確認變更檔案清單只包含 `apps/saas/`、`README.md`、`openspec/`，不含 `apps/marketing/` 底下任何檔案

## 4. 文件更新（對應 Requirement「Repository provides a one-click deploy path」的 Scenario「README documents the deploy path」）

- [ ] 4.1 修改 `README.md` 的「一鍵部署」段落，新增「自架 VPS（Docker）」小節，列出 `docker build`/`docker run` 指令、建議機器規格（至少 4GB RAM）與 `NODE_OPTIONS=--max-old-space-size=4096` 設定說明，保留既有 Zeabur 按鈕段落不變；驗證目標：`grep -n "docker build" README.md` 有命中

## 5. Review 與驗收

- [ ] 5.1 派 Codex 或等效工具對第 1-4 節的 diff 做 Code Review（correctness／security／performance 三角度），重點檢查 Dockerfile 是否遺漏 `.next/static` 或 `public` 目錄複製步驟；驗證方式：CR 報告 Critical 數量為 0
- [ ] 5.2 執行 `pnpm test`／`pnpm type-check`／`pnpm build` 確認全專案測試套件與既有建置流程未受影響；驗證方式：三個指令 exit code 皆為 0
- [ ] 5.3 執行 `spectra validate universal-one-click-deploy` 確認產出物驗證通過；驗證方式：指令輸出無錯誤
