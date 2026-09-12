## Why

上一輪 buyer-flow-concurrency-hardening SR 的壓測（50 人同時瀏覽已登入頁面）與後續排查發現，已登入的課程頁面（`/course`、`/course/lesson-01`）在高併發下反應時間比未登入頁面慢一個量級（p50 5522ms/p95 6472ms vs 未登入頁面 p50 474ms）。排查結論確認根因是程式邏輯層面重複查詢：每個 request 重複做 session 驗證、每一堂課逐一做存取權限檢查，而不是缺資料庫索引或伺服器資源不足。這次直接處理排查結論裡的優化方向，不重新排查。

## What Changes

- 修改 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`：把 page 已經取得的 session/user 資料傳給每堂課的存取判斷邏輯，不讓每一堂課都重新呼叫 session 驗證
- 修改 `packages/api/orpc/procedures.ts` 的 `publicProcedureWithSession`：支援接收已驗證的 session 而非強制每次重新查詢
- 修改 `packages/api/modules/course/router.ts`：讓同一個 request 內的課程存取權限判斷（`userCanAccessCourseId` 相關呼叫）只執行一次，判斷結果傳給後續的內容組裝與問卷顯示邏輯共用
- 新增有明確失效時機的 server 端快取，用於已發布課程內容與翻譯資料（不常變動的資料），避免每次 request 都重新查詢資料庫

## Non-Goals (optional)

- 不新增資料庫索引：上一輪排查用 EXPLAIN (ANALYZE, BUFFERS) 確認過，目前正式站資料量（1 course、1 chapter、3 lessons）太小，Postgres planner 選擇 Seq Scan 是合理決策，沒有根據加索引
- 不升級 Coolify VPS 伺服器規格：上一輪排查沒有觀測到 CPU/記憶體飽和證據，不是資源不足的問題
- 不處理 auth 限流或 PayUni webhook 併發問題：這兩項屬於上一輪 buyer-flow-concurrency-hardening SR，已經處理完畢

## Impact

- Affected specs: none（純效能優化，使用者能看到的課程存取判斷結果與頁面顯示內容完全不變，只有內部重複查詢次數減少，不改變 course-module 對外可觀測的功能行為契約）
- Affected code:
  - New: 課程內容/翻譯的 server 端快取模組（實際檔案路徑待 apply 階段依現有 packages/api 或 apps/saas/lib 慣例決定）
  - Modified: `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`、`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`、`packages/api/orpc/procedures.ts`、`packages/api/modules/course/router.ts`
  - Removed: (none)
- Compatibility: no capability-level observable behavior changes
