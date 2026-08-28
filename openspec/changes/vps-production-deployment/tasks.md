## 1. 診斷 startkiter.dev 503 事故根因

- [x] 1.1 依 design.md「Decision: 先診斷 503 根本原因，不假設是資源不足或 DNS 問題」：Coolify resource `8x5bmcpct9dri6tnnhjleeed` 起初 `exited:unhealthy`；container log 確認 standalone image 缺少 `@swc/helpers/esm/_interop_require_default.js`，不是 DNS 或 VPS 資源問題。完整診斷記錄於 `implementation-notes.md`。
- [x] 1.2 依診斷結果修復並重新部署，涵蓋 Requirement「The marketing site is deployed under the official domain」：`apps/marketing/Dockerfile` 補齊 pnpm store 的完整 `@swc/helpers` package，Coolify start command 使用 `node apps/marketing/server.js`。deployment `jxhh0ldhhmaxxrbhjzdpa5ag` finished，resource/container running；`curl -L https://startkiter.dev` 回 `200`，headers 存於 `/tmp/startkiter-vps-production-startkiter-dev.headers`。

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

- [ ] 6.1 grep `startkiter.dev`／`app.startkiter.dev`／`coolify-vps-setup-runbook` 所有既有引用點（`docs/`、`AGENTS.md`、`README.md`），確認本次新增的 SOP 文件與既有文件之間沒有互相矛盾的部署步驟描述。驗證目標：無矛盾描述，或已在對應位置加註「詳見 docs/vps-deployment-sop.md」導向新文件
- [ ] 6.2 派 Codex 或等效工具對本次全部 diff（task 1-5，含文件變更與 VPS 上的實際操作記錄）做 Code Review（correctness／security／performance 三角度）：correctness 確認 SOP 文件的步驟描述與實際在 Coolify 上執行過的操作一致（不是憑空編寫的理論步驟）、security 確認 `docs/vps-deployment-sop.md` 與 `docs/coolify-vps-setup-runbook.md` 全文搜尋不出現任何機密變數的實際值（`SETTINGS_ENCRYPTION_KEY`／`DATABASE_URL` 等只出現變數名稱不出現值）、performance 確認若本次有調整 VPS 規格，調整過程有沒有造成非預期的服務中斷超出必要時間。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [ ] 6.3 用 ego-browser skill 或 curl 實際驗證：`https://startkiter.dev` 與 `https://app.startkiter.dev` 同時回應成功狀態碼或合理重導向（非 5xx），並截圖或存證兩者的 HTTP 回應標頭。驗證目標：兩個網域的驗證結果（含 HTTP 狀態碼與回應標頭）附進實作筆記，任何一個網域驗證失敗即視為本 task 未完成，禁止只憑「文件寫完」就判定通過
- [ ] 6.4 跑 `spectra analyze vps-production-deployment --json` 與 `spectra validate vps-production-deployment`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [ ] 6.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 與 Scope boundaries 是否全部滿足：`curl -I https://startkiter.dev`／`curl -I https://app.startkiter.dev` 皆非 5xx；`docs/vps-deployment-sop.md` 涵蓋五個必要章節；`git diff --stat` 核對改動檔案清單與 Scope boundaries 一致，未觸碰 `apps/saas` 既有 Coolify 設定、未執行任何 Chatwoot 部署動作、未修改行銷網站文案內容。驗證目標：所有檢查項目確認通過
