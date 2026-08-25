## 1. operator-settings 規格擴充（對應 Requirement「Operator settings hub registers every backend settings page」）

- [ ] 1.1 核對 `apps/saas/app/(authenticated)/(main)/(account)/admin/settings/` 底下實際存在的所有設定分頁，確認清單與規格登記的頁面完全一致，落實 Requirement「Operator settings hub registers every backend settings page」；驗證目標：`find apps/saas/app/\(authenticated\)/\(main\)/\(account\)/admin/settings -name "page.tsx"` 找到的頁面數量與規格 Example 表格列數相同

## 2. 新增 .env.example（對應 Impact「New: apps/saas/.env.example」）

- [ ] 2.1 盤點目前 `apps/saas` 實際會讀取的所有環境變數（`grep -rn "process.env\." apps/saas/ packages/*/src` 排除 node_modules），列出每個變數的必填/選填狀態與缺漏時的既有行為（例如 `PAYUNI_MERCHANT_ID` 缺漏時結帳回 503）；驗證目標：清單涵蓋 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`SETTINGS_ENCRYPTION_KEY`、PAYUNi／GitHub kit／LINE／發票相關變數
- [ ] 2.2 新增 `apps/saas/.env.example`，依 2.1 的盤點結果列出全部變數與註解說明；驗證目標：`test -f apps/saas/.env.example` 存在，且 `wc -l` 行數不少於 2.1 盤點出的變數數量

## 3. Review 與驗收

- [ ] 3.1 派 Codex 或等效工具對第 1-2 節的 diff 做內容審查（正確性：`.env.example` 是否遺漏任何實際使用中的變數），驗證方式：CR 報告無遺漏項目
- [ ] 3.2 執行 `spectra validate spec-plan-consistency-cr` 確認產出物驗證通過；驗證方式：指令輸出無錯誤
