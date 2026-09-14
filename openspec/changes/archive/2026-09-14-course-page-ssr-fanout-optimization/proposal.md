## Why

上一輪 buyer-flow-concurrency-hardening SR 的壓測（50 人同時瀏覽已登入頁面）與後續排查發現，已登入的課程頁面（`/course`、`/course/lesson-01`）在高併發下反應時間比未登入頁面慢一個量級（p50 5522ms/p95 6472ms vs 未登入頁面 p50 474ms）。排查結論確認根因是程式邏輯層面重複查詢：每個 request 重複做 session 驗證、每一堂課逐一做存取權限檢查，而不是缺資料庫索引或伺服器資源不足。這次直接處理排查結論裡的優化方向，不重新排查。

**追加排查（本次更新）**：完成上述修復並重跑 50 人壓測後（見 tasks.md 5.2），`/course/lesson-01` 有明顯改善（p50 7258ms→5305ms），但 `/course` 幾乎沒變（p50 5522ms→5604ms，仍未達 p95 3 秒內目標）。進一步排查發現：`/course` 與 `/course/lesson-01` 共用同一組三層 authenticated layout（`apps/saas/app/(authenticated)/layout.tsx`、`(main)/layout.tsx`、`(account)/layout.tsx`），這層 layout 加上 `/course` 頁面本身，共有 6-9 個彼此獨立的 DB 查詢（`getOrganizationMembership`、`getOrganizationList`、`listPurchases`、`findBuyerDeploymentsForUser`，以及 page.tsx 內的 `userHasCourseAccess`、`db.course.findFirst`）全部用 `await` 序列執行，沒有平行化。這是一個兩邊頁面共用、前一輪修復沒有觸及的固定延遲地板，在 50 併發下互相排隊放大成主要瓶頸，需要在同一張 SR 內補做。

## What Changes

- 修改 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`：把 page 已經取得的 session/user 資料傳給每堂課的存取判斷邏輯，不讓每一堂課都重新呼叫 session 驗證
- 修改 `packages/api/orpc/procedures.ts` 的 `publicProcedureWithSession`：支援接收已驗證的 session 而非強制每次重新查詢
- 修改 `packages/api/modules/course/router.ts`：讓同一個 request 內的課程存取權限判斷（`userCanAccessCourseId` 相關呼叫）只執行一次，判斷結果傳給後續的內容組裝與問卷顯示邏輯共用
- 新增有明確失效時機的 server 端快取，用於已發布課程內容與翻譯資料（不常變動的資料），避免每次 request 都重新查詢資料庫
- **（本次追加）** 修改 `apps/saas/app/(authenticated)/layout.tsx`：把彼此獨立的 `getOrganizationMembership`、`getOrganizationList` 預取、`listPurchases` 預取、`findBuyerDeploymentsForUser` 四個查詢從序列 `await` 改成 `Promise.all` 平行執行
- **（本次追加）** 修改 `apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`：讓 `userHasCourseAccess` 判斷與 `db.course.findFirst` 查詢平行發出（後者查詢本身不依賴前者的判斷結果，只是顯示邏輯依賴）
- **（本次追加）** 檢查 `apps/saas/.env` 的 `DATABASE_URL` 是否需要補上 `connection_limit`，評估 50 併發下 Prisma 預設連線池是否為排隊瓶頸並提出建議值

## Non-Goals (optional)

- 不新增資料庫索引：上一輪排查用 EXPLAIN (ANALYZE, BUFFERS) 確認過，目前正式站資料量（1 course、1 chapter、3 lessons）太小，Postgres planner 選擇 Seq Scan 是合理決策，沒有根據加索引
- 不升級 Coolify VPS 伺服器規格：上一輪排查沒有觀測到 CPU/記憶體飽和證據，不是資源不足的問題
- 不處理 auth 限流或 PayUni webhook 併發問題：這兩項屬於上一輪 buyer-flow-concurrency-hardening SR，已經處理完畢
- **（本次追加）** 不重構 `userHasCourseAccess`／`getCourseAccessOrdersForUser` 內部的兩段序列查詢（`getOrganizationIdsForUser` → `order.findMany`）成單一 join 查詢：後者依賴前者的查詢結果（`organizationIds` 用於 `where` 子句），本質上是依賴關係不是可平行化的獨立查詢，這次只處理彼此獨立、被誤寫成序列的查詢

## Impact

- Affected specs: none（純效能優化，使用者能看到的課程存取判斷結果與頁面顯示內容完全不變，只有內部查詢次數與執行方式改變，不改變 course-module 對外可觀測的功能行為契約）
- Affected code:
  - New: 課程內容/翻譯的 server 端快取模組（實際檔案路徑待 apply 階段依現有 packages/api 或 apps/saas/lib 慣例決定）
  - Modified: `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`、`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`、`packages/api/orpc/procedures.ts`、`packages/api/modules/course/router.ts`、`apps/saas/app/(authenticated)/layout.tsx`、`apps/saas/.env`（如需補 connection_limit）
  - Removed: (none)
- Compatibility: no capability-level observable behavior changes
