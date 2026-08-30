# Proposal: test-env-database-url

## 問題

`pnpm --filter api test` 若沒有先手動載入 `.env` 的 `DATABASE_URL`，會直接 exit 1：`packages/api/modules/assignment/assignment-lifecycle.test.ts` 失敗，錯誤 `DATABASE_URL is not set`（來源 `packages/database/prisma/client.ts:7`）。

根因：`assignment-lifecycle.ts` 頂層 `import { db } from "@startkiter/database"`，觸發 `client.ts` 的 `prismaClientSingleton()`，該函式在沒有 `DATABASE_URL` 時同步 throw——即使這個測試本身完全沒呼叫 `db`，純測試 `decodeAssignmentSubmissionCursor` 這種不碰資料庫的函式。

`apps/saas/vitest.config.ts` 已經用 `test.env.DATABASE_URL` 塞一個假連線字串解決同樣問題（該連線字串從不真的被連上，Prisma adapter 是 lazy connect），但 `packages/api/vitest.config.ts` 沒有比照辦理。

## 修法

比照 `apps/saas/vitest.config.ts` 既有模式，在 `packages/api/vitest.config.ts` 的 `test` 區塊加上同一組假連線字串：

```ts
test: {
	globals: true,
	environment: "node",
	env: {
		DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
	},
},
```

## 不做什麼

- 不改 `packages/database/prisma/client.ts` 的行為（throw-if-missing 是刻意設計，正式環境要保留）
- 不動其餘 10 個目前「依賴 database 但 vitest.config.ts 沒 mock」的 package（`platform`／`auth`／`payments`／`bundles`／`coupons`／`notifications`／`course-assignment`／`course-quiz`／`course-review`／`ai`）——這些目前測試全過，沒有實際壞掉，屬於「未來若有人寫出頂層 import db 的純函式測試才會踩到」的潛在風險，不在本次範圍內；若之後真的踩到，套用同一個模式即可
- 不改 root `package.json` 的 `"test": "dotenv -c -- turbo test"` 這條正式指令（這條本來就會載入 `.env`，只有直接用 `pnpm --filter x test` 略過 dotenv wrapper 時才會踩到本次問題）

## 影響範圍

只改一個 vitest config 檔的 test-only 設定值，不影響 runtime 代碼、不影響其他 package。
