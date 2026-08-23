## Why

`course-bundles` spec 已定義「Bundle purchase grants access to all included courses」這條 Requirement，且 `canAccessCourseId()` 函式與其單元測試已經驗證這個邏輯正確（`apps/saas/tests/integration/bundle-course-access.test.ts`）。但目前有兩個會讀取真實課程內容的 API 入口——`getLessonDetail`（`packages/api/modules/course/router.ts`）與站內 AI 助教（`apps/saas/app/api/course/ai/route.ts`）——完全沒有呼叫這個函式，而是各自判斷「該使用者名下是否存在任一筆 `courseAccess: true, status: "paid"` 的訂單」。這代表買了 A 課程 bundle 的學員，只要有任何付費訂單，實際上就能讀取所有已發布課程的內容（包含透過 AI 助教間接取得課程內容），不限於自己那個 bundle 涵蓋的課程——這是規格已經定義、但兩個 API 層都沒有強制執行的授權缺口。只修其中一個會留下另一個繞道，因此兩者必須在同一張 change 一起修。

同時必須保留現行 `course-module` spec 的既有承諾：`startkiter-mvp` 且 `courseAccess=true` 是全站課程 entitlement，不應因改接 bundle-aware 判斷而讓既有 MVP 買家失去播放權。這次要收斂的是「任意 bundle 互相穿透」，不是改掉 MVP SKU 的既有全課程權限。

## What Changes

- 新增 `packages/api/modules/course/lib/course-access.ts` 的 `createPrismaBundleCourseAccessReader()`：production 版 `BundleCourseAccessReader`，查詢邏輯與 `bundle-course-access.test.ts` 裡驗證過的 `createDbBundleCourseAccessReader()` 一致（`findGrantedSkusForUser` 查 `db.order`，`findBundleCourseIds` 查 `db.bundle`）。將 reader 放在 API package，讓 oRPC 與 SaaS Route Handler 共用，避免 `packages/api` 反向依賴 `apps/saas`。
- 新增同檔的 `userCanAccessCourseId(userId, courseId)`：包裝 `canAccessCourseId()` 與上述 reader，供 `getLessonDetail` 與 AI 助教共用。
- **BREAKING**：修改 `packages/api/modules/course/router.ts` 的 `getLessonDetail` procedure：非免費試看（`isFreePreview: false`）單元的授權判斷，從「使用者是否有任一筆付費訂單」改為「使用者是否對該 lesson 所屬的 `courseId` 具備存取權」（呼叫 `userCanAccessCourseId`）。
- **BREAKING**：修改 `apps/saas/app/api/course/ai/route.ts`（站內 AI 助教）：非免費試看單元的授權判斷，同樣從「使用者是否有任一筆付費訂單」改為呼叫 `userCanAccessCourseId`，跟 `getLessonDetail` 使用同一套判斷邏輯，避免同一個授權規則出現兩套互不一致的實作。
- 調整 `packages/course/access.ts` 的 `canAccessCourseId` 相容性分支：保留 `startkiter-mvp` + `courseAccess=true` 的全課程 entitlement；其他 SKU 仍必須解析成包含目標 `courseId` 的 bundle。新增對應單元測試，避免接上 bundle-aware reader 後讓既有 MVP 買家被誤拒。
- 修復本 change 驗證時暴露的兩個既有 baseline blocker：`packages/api/vitest.config.ts` 補上 OXC automatic JSX runtime，讓 API 全套測試能載入既有 TSX；`packages/course/src/webcontainer/sandbox-runtime.ts` 改用與現行 TypeScript lib 相容的陣列取值方式，並補上完整路徑執行檔的回歸測試。
- 不修改前端：`apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`、`classroom-client.tsx`、`FluentPlayer.tsx` 皆維持現狀，這次只換權限判斷邏輯。

## Non-Goals

- 不處理 `/course`（無 `[lessonId]`）那個平面頁面與 `packages/course/catalog.ts` 的寫死 3 堂 demo 課——那是獨立的 MVP 展示邏輯，跟這次要修的真實課程資料庫路徑無關，本次不動。
- 不新增資料庫欄位或 migration：`Order.sku`、`Bundle`、`BundleCourse` 皆已存在，沿用 `core-module-bundles-coupons` 定案的「sku 存 bundle 自己的 id」慣例。
- 不重新設計單一開站包（MVP_SKU）買家的課程存取範圍——沿用現行 `course-module` spec 的全課程 entitlement，只補上 shared helper 的相容性分支。
- 不做遊戲化元素（音效／儀表板／打擊感），也不涉及課神（Awesome-Koson）系統的 Course Pack 規格對接。
- 不修改 `toggleLessonProgress` 等其他 procedure 的授權邏輯，僅 `getLessonDetail` 在本次範圍內。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-bundles`: 新增 Requirement，明確要求「非 Bundle 涵蓋課程的存取請求 MUST 被拒絕」，並要求 `getLessonDetail` 與站內 AI 助教這兩個買家端課程內容入口都是這條授權規則的強制執行點（既有的「Bundle purchase grants access to all included courses」只定義了正向授權，沒有定義負向邊界與強制執行位置）。

## Impact

### Affected specs

- `openspec/specs/course-bundles/spec.md`（新增 Requirement）

### Affected code

- New: `packages/api/modules/course/lib/course-access.ts` 新增 `createPrismaBundleCourseAccessReader`、`userCanAccessCourseId` 兩個 export
- Modified: `packages/api/modules/course/router.ts`（`getLessonDetail` 授權邏輯）
- Modified: `apps/saas/app/api/course/ai/route.ts`（AI 助教授權邏輯，改用 `userCanAccessCourseId`）
- Modified: `packages/course/access.ts`（保留 MVP_SKU 全課程 entitlement，bundle SKU 維持逐課程比對）
- Modified: `packages/api/vitest.config.ts`（補上 API 測試載入既有 TSX 所需的 OXC automatic JSX runtime）
- Modified: `packages/course/src/webcontainer/sandbox-runtime.ts`（移除不符合現行 TypeScript lib 的 `Array.prototype.at` 用法）
- Modified: `packages/course/src/webcontainer/sandbox-runtime.test.ts`（補完整路徑測試執行檔的回歸測試）
- Modified: `packages/api/modules/course/course.test.ts`（既有測試檔，補 `getLessonDetail` bundle-aware 授權測試）
- Modified: `apps/saas/app/api/course/ai/route.test.ts`（若不存在則新建，補 AI 助教 bundle-aware 授權測試）
- Modified: `packages/course/access.test.ts`（補 MVP_SKU 與 bundle-aware 判斷的相容性測試）

不新增依賴、不改環境變數、不改資料庫 schema。
