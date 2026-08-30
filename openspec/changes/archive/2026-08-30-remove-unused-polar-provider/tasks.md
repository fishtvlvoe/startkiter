# Tasks: remove-unused-polar-provider

- [x] 1. 刪除 `packages/payments/provider/polar/` 資料夾
- [x] 2. 從 `packages/payments/package.json` 移除 `@polar-sh/sdk` 依賴
- [x] 3. 跑 `pnpm install` 更新 lockfile
- [x] 4. 驗證：`pnpm --filter platform --filter api --filter saas test` 全過（不設 DATABASE_URL）
- [x] 5. 驗證：`pnpm --filter payments type-check` 無錯誤
- [x] 6. PM 親自 grep 確認 `polar`／`Polar` 全 repo 不再有任何 runtime 代碼引用
