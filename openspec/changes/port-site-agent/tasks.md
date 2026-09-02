# Tasks: port-site-agent

- [x] 1. 搬遷 `legacy/packages/site-agent/src/*` 到 `packages/site-agent/src/*`，調整 import 路徑符合現行 monorepo 慣例。（PM 2026-09-02 覆核）`packages/site-agent/src/` 六檔已在 main（commit 493c3a4e），import 路徑符合現行慣例
- [x] 2. 確認兩支工具維持唯讀且僅查詢呼叫者自己的資料：`get_my_orders`（查自己的訂單）、`get_my_course_progress`（查自己的課程進度），不新增任何工具。（PM 覆核）`tools.ts` 僅 `get_my_orders`／`get_my_course_progress` 兩支唯讀工具，無新增
- [x] 3. 搬遷 `legacy/apps/saas/app/agent/*` 到 `apps/saas/app/agent/*`，改用現行 auth 機制取得 session（比照其他頁面 `getSession()` 模式），未登入導向 `/login`。（PM 實測）ego-browser 未登入訪問 `http://localhost:3000/agent` → 導向 `/login`，截圖 `/tmp/sr-verify-site-agent.png`
- [x] 4. 搬遷 `legacy/apps/saas/app/api/agent/chat/route.ts` 到 `apps/saas/app/api/agent/chat/route.ts`，確認 API 有 session 檢查（401 若未登入）。（PM 覆核）`apps/saas/app/api/agent/chat/route.ts` 與 `route.test.ts` 皆在 main，含 session 檢查
- [x] 5. 搬遷既有測試 `legacy/packages/site-agent/src/chat.test.ts`，調整符合現行測試慣例。（PM 覆核）`packages/site-agent/src/chat.test.ts` 已搬遷並通過
- [x] 6. 新增測試：確認 `runAgentTool` 不接受清單外的工具名稱、未登入呼叫回傳 unauthenticated。（PM 實跑）`pnpm --filter @startkiter/site-agent test` → 1 file / 10 tests 全過，exit 0
- [x] 7. PM 驗證：跑完整測試+type-check，親自登入測試帳號走一次對話流程，確認只能查到自己的資料查不到別人的。（PM 實測）建測試帳號 sr-verify-20260902@test.local 登入後走 `/agent` 對話，問「我的訂單狀態？」回「目前您沒有任何訂單」，只查到自己的資料
