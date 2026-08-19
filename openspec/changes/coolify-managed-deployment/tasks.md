# Tasks: Coolify 集中管理式部署 (Coolify Managed Deployment)

## 1. 手動驗證（Spike，先做，不寫任何買家可見的功能前必須先跑通一次）

- [x] 1.1 買一台真實 VPS（Vultr 新加坡機房，2vCPU/4GB），走一次「取得 IP + SSH 存取權」流程，記錄實際步驟與卡點——見 `docs/coolify-vps-setup-runbook.md`
- [x] 1.2 把這台 VPS 加入 StartKiter 的 Coolify 帳號（`Add Server`），確認連線成功——已驗證，狀態 Ready，Docker 29.7.2 / Compose 5.5.0 自動安裝完成
- [x] 1.3 在這台伺服器上部署一個測試用 Next.js 應用，確認 git push 觸發自動重建部署——**已完整驗證**：改用真實 Public Git Repository 來源測試（見 design.md 2026-08-18 實測驗證段落），git push 後 Coolify 透過手動設定的 GitHub Webhook 自動觸發重建，`curl` 確認部署內容真的更新，不是只看介面顯示 Success
- [x] 1.4 測試從 Coolify 端遠端介入（重啟服務、查看 log、redeploy），確認不需要向「買家」索取任何額外存取權——已驗證，Actions 選單可直接 Redeploy／查看 Deployment Logs，全程用 StartKiter 自己的 Coolify 存取權完成
- [x] 1.5 走一次自訂網域綁定流程，確認 SSL 自動簽發成功——`coolify-test.startkiter.dev` 已綁定，`curl -v` 確認 issuer 為 Let's Encrypt、SSL certificate verify ok。**注意**：這次是用 StartKiter 自己持有的 Cloudflare 帳號直接加 DNS 記錄，尚未測試「買家自己的 Cloudflare 帳號 + scoped API token 交給 AI」這個買家端交接流程本身
- [x] 1.6 把 1.1–1.5 實際踩到的坑，回寫進 `design.md` 的 Context 或 Risks 章節——見 `docs/coolify-vps-setup-runbook.md` 與 design.md Context 章節更新

## 2. 三層客群分流機制

- [ ] 2.1 在購買/onboarding 流程中新增 Tier 選擇步驟（自然語言選項，不出現「VPS」「Coolify」等術語）
- [ ] 2.2 定義 `BuyerDeployment.tier` 資料模型與對應的 Prisma migration
- [ ] 2.3 Tier 為 `self-hosted` / `advanced` 時，導向既有 README Zeabur 一鍵部署說明，不建立任何 Coolify 資源
- [ ] 2.4 Tier 為 `managed` 時，導向 VPS handoff 引導流程（教學內容：如何在 Vultr/Hetzner 開機、如何取得 SSH 存取權）

## 3. Coolify Fleet 管理

- [x] 3.1 實作 `POST /api/deployment/provision`：接收買家提供的 VPS IP，呼叫 Coolify Server API 完成加入
- [x] 3.2 實作 `GET /api/deployment/status`：呼叫 Coolify API 取得部署狀態，轉換為 `BuyerDeployment` 簡化結構
- [ ] 3.3 `COOLIFY_API_TOKEN` 走既有金鑰管理流程（後台填入 + env fallback），確認不落地明文於程式碼或版控

## 4. 買家狀態面板

- [ ] 4.1 Demo-first：先出 `/deployment` 頁面的靜態 HTML demo，經 Fish 確認後才寫真代碼
- [ ] 4.2 實作 `apps/saas/app/(authenticated)/(main)/(account)/deployment/` 頁面，讀取 `GET /api/deployment/status`
- [ ] 4.3 實作「狀態暫時無法取得」的失敗態顯示，確認 Coolify API 逾時/失敗時不誤報「網站掛了」
- [ ] 4.4 撰寫頁面渲染測試：live／building／error／status-unavailable 四種狀態各自正確顯示

## 5. 第三方憑證交接

- [x] 5.1 定義 `targetEnvKey` 允許清單（白名單），拒絕清單外的鍵名
- [x] 5.2 實作 `POST /api/deployment/credentials`：接收憑證、寫入買家部署實例環境變數、觸發 Coolify 重新部署
- [x] 5.3 稽核此 endpoint 的所有程式碼路徑與 log 輸出，確認憑證明文不落地資料庫、log、錯誤回報
- [x] 5.4 撰寫測試驗證：白名單外的 `targetEnvKey` 一律被拒絕，且不觸發任何寫入

## 6. 文件與驗收

- [ ] 6.1 更新 `docs/deploy-and-public-url.md`，補上 Tier 2 主機/費用模型章節
- [ ] 6.2 `pnpm test` 全綠
- [ ] 6.3 `spectra validate` 通過，0 Critical
- [ ] 6.4 三方角度 CR（correctness / security / performance），重點檢查憑證處理路徑的資安面
