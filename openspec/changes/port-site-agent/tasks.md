# Tasks: port-site-agent

- [ ] 1. 搬遷 `legacy/packages/site-agent/src/*` 到 `packages/site-agent/src/*`，調整 import 路徑符合現行 monorepo 慣例
- [ ] 2. 確認兩支工具維持唯讀且僅查詢呼叫者自己的資料：`get_my_orders`（查自己的訂單）、`get_my_course_progress`（查自己的課程進度），不新增任何工具
- [ ] 3. 搬遷 `legacy/apps/saas/app/agent/*` 到 `apps/saas/app/agent/*`，改用現行 auth 機制取得 session（比照其他頁面 `getSession()` 模式），未登入導向 `/login`
- [ ] 4. 搬遷 `legacy/apps/saas/app/api/agent/chat/route.ts` 到 `apps/saas/app/api/agent/chat/route.ts`，確認 API 有 session 檢查（401 若未登入）
- [ ] 5. 搬遷既有測試 `legacy/packages/site-agent/src/chat.test.ts`，調整符合現行測試慣例
- [ ] 6. 新增測試：確認 `runAgentTool` 不接受清單外的工具名稱、未登入呼叫回傳 unauthenticated
- [ ] 7. PM 驗證：跑完整測試+type-check，親自登入測試帳號走一次對話流程，確認只能查到自己的資料查不到別人的
