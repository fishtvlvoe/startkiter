## 1. operator-settings 規格擴充（對應 Requirement「Operator settings hub registers every backend settings page」）

- [x] 1.1 核對 `apps/saas/app/(authenticated)/(main)/(account)/admin/settings/` 底下實際存在的所有設定分頁，確認清單與規格登記的頁面完全一致，並為 PAYUNi／電子發票登記穩定 ID、欄位與驗證規則；驗證證據：`find apps/saas/app/\(authenticated\)/\(main\)/\(account\)/admin/settings -name "page.tsx"` 找到 2 個頁面，規格表登記 2 列。

## 2. 新增 .env.example（對應 Impact「New: apps/saas/.env.example」）

- [x] 2.1 盤點目前 `apps/saas` 與其 workspace packages 實際會讀取的環境變數，列出每個變數的必填／選填狀態與缺漏時的既有行為；驗證證據：以 source scan 交叉核對 `DATABASE_URL`、Better Auth、`SETTINGS_ENCRYPTION_KEY`、PAYUNi、GitHub kit、LINE、電子發票、儲存、客服與部署設定。
- [x] 2.2 新增 `apps/saas/.env.example`，依 2.1 盤點結果列出變數與註解說明；驗證證據：檔案存在，所有 source-scan 環境變數均有對應模板項目，且模板不含真實 secret。

## 3. Review 與驗收

- [x] 3.1 完成第 1-2 節 diff 內容審查；驗證證據：source scan 與 `.env.example` 對照無遺漏，secret scan 無硬編碼 secrets。
- [x] 3.2 執行 `spectra validate spec-plan-consistency-cr` 確認產出物驗證通過；驗證證據：strict validation exit code 0。
