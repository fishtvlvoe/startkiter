## 1. 診斷 startkiter.dev 503 事故根因

- [x] 1.1 依 design.md「Decision: 先診斷 503 根本原因，不假設是資源不足或 DNS 問題」：Coolify resource `8x5bmcpct9dri6tnnhjleeed` 起初 `exited:unhealthy`；container log 確認 standalone image 缺少 `@swc/helpers/esm/_interop_require_default.js`，不是 DNS 或 VPS 資源問題。完整診斷記錄於 `implementation-notes.md`。
- [x] 1.2 依診斷結果修復並重新部署，涵蓋 Requirement「The marketing site is deployed under the official domain」：`apps/marketing/Dockerfile` 補齊 pnpm store 的完整 `@swc/helpers` package，Coolify start command 使用 `node apps/marketing/server.js`。最新 deployment `dxcl5unsc8wj4j0m1swilc4i`（commit `228847af`）finished，resource/container running、restart count 0；`curl -L https://startkiter.dev` 回 `200`，headers 存於 `/tmp/startkiter-vps-production-final-startkiter-dev.headers`。

## 2. Fish 確認兩個建議方案

- [x] 2.1 依現有 2026-08-22 單 VPS 營運決策與本次實際部署狀態落定：`Decision: DB 策略維持外部 Neon，不搬進 VPS 自架 Postgres`；`Decision: VPS 規格維持現有 2 vCPU / 3.3GB，先以實際資源指標觀察`。不執行 resize。決策與理由已寫入 `design.md`、`docs/vps-deployment-sop.md`、`implementation-notes.md`；本次 503 已證實為 standalone image 缺檔。

## 3. 撰寫正式部署 SOP

- [x] 3.1 [P] 涵蓋 Requirement「A repeatable production deployment SOP exists for the Coolify-managed VPS」：`docs/vps-deployment-sop.md` 已完成「前置需求」「Coolify resource 建立步驟」，包含目前 Coolify/VPS、`apps/saas`、`apps/marketing` 的實際 build/start 設定。
- [x] 3.2 [P] 涵蓋 Requirement「VPS-level secrets are classified and never recorded in plaintext within deployment documentation or scripts」及 `Decision: VPS 層級密鑰透過 Coolify 環境變數介面管理，不寫入部署腳本或 repo`：`docs/vps-deployment-sop.md` 已完成「環境變數清單（機密／非機密分類表）」；`DATABASE_URL`、`SETTINGS_ENCRYPTION_KEY` 與 provider credentials 僅列名稱，不列實際值。
- [x] 3.3 [P] `docs/vps-deployment-sop.md` 已完成「DNS 與 SSL 驗證步驟」，包含 A/CNAME、灰雲、Let's Encrypt、`dig` 與 `curl` 驗證。
- [x] 3.4 已完成「故障排除」章節，記錄本次 503 的 standalone `@swc/helpers` 缺檔、lock hash blocker、Coolify redeploy 與驗證；舊 runbook 已改指向正式 SOP，`grep` 不再命中舊 caveat。

## 4. 落實 DB 與 VPS 規格決策

- [x] 4.1 涵蓋 Requirement「The database hosting strategy and VPS sizing are recorded as an explicit decision, not left as an open discussion」：`docs/vps-deployment-sop.md` 已明確記錄外部 Neon、VPS `2 vCPU / 3.3GB RAM`、本次不自架 DB／不 resize，以及未來以 OOM/restart/resource 指標觸發另開升級 change；無「傾向」「待定」決策用語。

## 5. 補文件記錄

- [x] 5.1 `AGENTS.md` 已更新 `vps-production-deployment`、live domain 狀態與正式 SOP 路徑，移除「尚未 propose」的過時描述。

## 6. Review 與驗證

- [x] 6.1 grep `startkiter.dev`／`app.startkiter.dev`／`coolify-vps-setup-runbook` 所有既有引用點（`docs/`、`AGENTS.md`、`README.md`），已確認正式 SOP 指向一致；歷史討論稿與 reference 文件保留為歷史／上游說明，未當成現行 Coolify 操作指示。
- [x] 6.2 第三輪全新 context Codex 唯讀 CR：Critical 0／High 0／Medium 0／Low 0，status PASS；已核對 correctness、security、performance、Dockerfile symlink、source env closure、dashboard、scope 與 Coolify `228847af` 部署證據。報告存於 `/tmp/startkiter-vps-independent-cr-final-3.txt`。
- [x] 6.3 curl 實際驗證兩個 domain：`startkiter.dev` direct `307` → `/zh-tw`、follow redirect `200`；`app.startkiter.dev` `307` → `/login`；Coolify resource running、container `Up`、restart count 0。headers 存於 `/tmp/startkiter-vps-production-final-startkiter-dev.headers`、`/tmp/startkiter-vps-production-final-app.headers`。
- [x] 6.4 `spectra analyze vps-production-deployment --json` 四維度 Coverage／Consistency／Ambiguity／Gaps 全 Clean、0 findings；`spectra validate vps-production-deployment` valid。
- [x] 6.5 已核對 Implementation Contract、Acceptance criteria 與 scope：SOP 五章齊全、install/test/type-check/build 全綠、未改 `apps/saas`、未部署 Chatwoot、未改 marketing 文案；最新 live deployment 與文件證據均為 `228847af`。本 change 保持開啟，未 archive。
