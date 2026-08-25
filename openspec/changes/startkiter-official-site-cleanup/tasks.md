## 1. 確認既有 Coolify 部署現況（對應 Requirement「The SaaS application is deployed on Coolify-managed VPS infrastructure」）

- [x] 1.1 涵蓋 Requirement「The SaaS application is deployed on Coolify-managed VPS infrastructure」：用 `curl -I https://app.startkiter.dev` 確認回應成功或合理重導向（非連線失敗或 5xx），並記錄目前 Coolify resource 名稱、所在機群節點；驗證目標：curl 結果附進本次實作筆記

## 2. apps/marketing 接上正式網域（對應 Requirement「The marketing site is deployed under the official domain」）

- [ ] 2.1 在 Coolify 新建 `apps/marketing` 對應的 resource（Build Pack 依 `apps/marketing` 既有建置慣例設定），並設定自訂網域 `startkiter.dev`；驗證目標：Coolify 後台顯示該 resource 狀態為 running
- [x] 2.2 涵蓋 Requirement「The marketing site is deployed under the official domain」：在 Cloudflare DNS 設定 `startkiter.dev` A/CNAME 記錄指向對應的 Coolify 節點，確認 SSL 憑證簽發成功；驗證目標：`curl -I https://startkiter.dev` 回應成功或合理重導向

## 3. 關閉舊 Vercel 部署（對應 Requirement「The legacy Vercel deployment is decommissioned」）

- [x] 3.1 涵蓋 Requirement「The legacy Vercel deployment is decommissioned」：在 Vercel 後台移除本 repo 的 Git 整合／關閉 auto-deploy webhook；驗證目標：推一個測試 commit 到 main，確認 Vercel 專案沒有觸發新的部署
- [x] 3.2 確認 `test-startkiter.vercel.app` 網域不再指向任何有效部署（可保留網域但無 active deployment，或直接刪除該 Vercel 專案，依老闆裁決）；驗證目標：`curl -I https://test-startkiter.vercel.app` 回應與 Coolify 部署行為明確區隔（不再是最新代碼的鏡像）

## 4. 補文件記錄

- [x] 4.1 更新 `AGENTS.md` 對應段落，移除「細節與遷移步驟待寫成新 Spectra change，尚未 propose」這句過時描述，改為指向本張 change；驗證目標：`grep -n "official-site-deployment" AGENTS.md` 有命中

## 5. Review 與驗收

- [x] 5.1 執行 `spectra validate startkiter-official-site-cleanup` 確認產出物驗證通過；驗證方式：指令輸出無錯誤
- [x] 5.2 三個網域（`app.startkiter.dev`／`startkiter.dev`／`test-startkiter.vercel.app`）的最終狀態各自用 curl 截圖存證；驗證方式：三筆 curl 結果附進驗收報告
