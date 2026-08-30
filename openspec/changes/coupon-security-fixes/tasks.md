## 1. 確認部署環境的 x-forwarded-for 實際行為

- [x] 1.1 讀 `docs/deploy-and-public-url.md` 與現有部署設定，確認Zeabur/反向代理實際如何注入`x-forwarded-for`（是否只附加一段、client能否在前面插入偽造值），若文件不足以判斷則寫紅燈測試模擬多層代理情境驗證假設。驗證：能明確寫出「本專案部署環境下，x-forwarded-for的哪一段可信」的結論，並附證據來源。

結論（PM 2026-08-31 確認；Codex 審查後 2026-08-31 補強）：不以「無條件最後一段」當契約，改為固定代理跳數 `TRUSTED_PROXY_COUNT`（預設 `1`＝現行 Coolify + Traefik 單層）。從右往左數 N 段取可信 IP；左側客戶端可偽造。證據／拓樸：`docs/vps-deployment-sop.md`、`docs/discuss/2026-08-22-platform-positioning-infra-alignment.md`；Cloudflare 目前灰雲 DNS only，不依賴 `cf-connecting-ip`。代理層數變了必須改 env；app 不可外網直連繞過 Traefik。

## 2. Coupon兌換次數原子性修復

- [x] 2.1 紅燈測試：`packages/coupons/src/validate.ts`或對應checkout測試新增並行競態測試，模擬同一coupon code在`maxRedemptions=1`情況下同時發送2個以上checkout請求，驗證修復前會超過上限（測試應先失敗）。驗證：測試檔案存在，跑起來會fail（紅燈）。
- [x] 2.2 實作：checkout流程在同一DB transaction內用悲觀鎖讀取並檢查coupon `timesRedeemed`，通過才建立訂單並原子遞增，訂單保存coupon id/code關聯。驗證：task 2.1的測試轉綠燈，`pnpm --filter api test coupon`／`pnpm --filter saas test checkout`全綠。
- [x] 2.3 驗證orders表確實保存了coupon關聯（非本次修復前的靜默遺失）。驗證：查詢建立的訂單資料含coupon id/code欄位。

## 3. Rate-limit偽造防護修復

- [x] 3.1 紅燈測試：`apps/saas/app/api/coupons/validate/route.ts`新增測試，模擬客戶端每次換不同`x-forwarded-for`值繞過20/min限制，驗證修復前確實可繞過。驗證：測試存在且先失敗。
- [x] 3.2 實作：依task 1.1的結論，改用正確的可信來源判斷client IP（信任代理注入的段落，或改用request層級可信識別方式），`apps/saas/lib/rate-limit.ts`的key產生邏輯同步修正。驗證：task 3.1測試轉綠，`pnpm --filter saas test rate-limit`全綠。

## 4. Course Studio 錯誤訊息修復

- [x] 4.1 紅燈測試：`apps/saas/app/api/course/studio/route.ts`新增測試，觸發例外並驗證修復前response含有內部細節字串（Prisma相關文字）。驗證：測試存在且先失敗。
- [x] 4.2 實作：catch block改回傳固定`INTERNAL_ERROR`訊息，完整例外寫入log（附correlation id）。驗證：task 4.1測試轉綠，response不含任何Prisma/資料庫關鍵字。

## 5. PM 驗證與交叉審查

- [ ] 5.1 PM在同一worktree重新執行相關測試（coupon/checkout/rate-limit/course-studio），記錄實際通過/失敗數字，與CLI自報比對。驗證：PM貼出實跑輸出。
- [ ] 5.2 開另一支CLI交叉審查，重點驗證：悲觀鎖是否真的防止race condition（不是只在單執行緒測試下看似正確）、rate-limit修復後是否還有其他繞過方式、錯誤訊息修復是否遺漏其他outlet（例如log本身是否意外暴露給客戶端）。驗證：審查方產出書面結論，包含實際跑過並行測試的證據。
- [ ] 5.3 審查有問題送回修，重新驗證直到過關。
- [ ] 5.4 若過程中發現新的、超出本SR範圍的漏洞，記錄並回報Fish，不擅自擴大修復範圍。
- [ ] 5.5 全部過關後更新 `openspec/site-remediation-tracker.md`：移除「額外發現」段落中這3項的「待開新SR修復」標註，改為已修復並附SR名稱；執行 `/spectra:archive` 封存，commit+push。驗證：git log有對應commit，總表已更新。
