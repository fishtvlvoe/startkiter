# Tasks: test-env-database-url

- [x] 1. 在 `packages/api/vitest.config.ts` 的 `test` 區塊加上 `env.DATABASE_URL` 假連線字串（比照 `apps/saas/vitest.config.ts`）
- [x] 2. 驗證：不載入 `.env`（乾淨 shell）跑 `pnpm --filter api test`，確認 exit 0、`assignment-lifecycle.test.ts` 通過
- [x] 3. 驗證：不載入 `.env` 跑 `pnpm --filter platform --filter api --filter saas test`，確認 578/578 全過、exit 0
- [x] 4. 跑 `pnpm --filter api type-check`，確認無新增錯誤
