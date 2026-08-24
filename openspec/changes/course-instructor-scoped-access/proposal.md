## Why

StartKiter 的 course studio（`/admin/course`）目前只認一個固定的 `ADMIN_EMAIL`（`isCourseOperator`，`apps/saas/app/api/course/studio/route.ts`），沒有「這個人只能管理某幾門課」的概念，資料庫也允許多筆 `Course` 但 UI 目前寫死抓第一筆課程。未來站主要找協作者一起經營多門課時，現在只能把 `ADMIN_EMAIL` 分享出去，等於把整個後台（users/orders/revenue/bundles/settings）都交出去。woomin 的 `CourseInstructor` 機制提供「只指派特定課程管理權」的解法，這次照抄精神但簡化成符合 StartKiter 現行單層 operator 判斷的版本。

## What Changes

- 新增 `CourseInstructor` model：記錄哪個 user 被指派管理哪門課
- **BREAKING**：`AdminLayout`（`apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`）的進入條件從「僅 `admin.access`（`user.role === "admin"`）」擴充為「`admin.access` 或該 user 至少被指派一門課的 `CourseInstructor`」；後者進入後選單只顯示「課程管理」一項，隱藏 users/orders/revenue/bundles/settings
- `apps/saas/app/api/course/studio/route.ts` 的 `isCourseOperator` 判斷擴充：operator（`ADMIN_EMAIL`）可操作全部課程；被指派講師的 user 只能操作自己被指派的課程，其餘動作一律 403
- `admin/course/page.tsx` 從「寫死抓第一筆課程」改成課程選擇器（下拉選單），operator 看到全部課程，講師只看到被指派的課程
- Operator 專屬新增「指派講師」設定區塊（在課程選擇器旁，選擇既有 user 指派/移除該課程的講師身份）

## Non-Goals

- 不做 `INSTRUCTOR`/`EDITOR` 角色區分，統一是「被指派的課程協作者」，不擴充 Better Auth 的 `user.role` 欄位
- 不做「未指派任何講師的課程 = 所有講師共管」規則（woomin 的協作語意）；本次設計預設未指派講師的課程只有 operator 能管理，避免意外開放
- 不做課程建立者自動指派為講師（StartKiter 目前只有 operator 能建立課程，這條規則在 StartKiter 用不到）
- 不做多組織/多租戶講師隔離

## Capabilities

### New Capabilities

- `course-instructor-scoped-access`：課程講師範圍限縮管理權

## Impact

- Affected specs: `course-instructor-scoped-access`（新增）
- Affected code:
  - New:
    - `packages/api/modules/course/lib/course-instructor-access.ts`（`hasAnyCourseInstructorAssignment(userId)`、`canManageCourse(userId, courseId, adminEmail, userEmail)`）
    - `packages/api/modules/course/lib/course-instructor-access.test.ts`
    - `packages/api/modules/course/procedures/assign-course-instructor.ts`
    - `packages/api/modules/course/procedures/assign-course-instructor.test.ts`
    - `packages/api/modules/course/procedures/remove-course-instructor.ts`
    - `packages/api/modules/course/procedures/list-manageable-courses.ts`
    - `packages/database/prisma/migrations/`（新增 `CourseInstructor` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`（新增 `CourseInstructor` model）
    - `packages/api/modules/course/router.ts`（掛上述 procedure）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`（進入條件擴充、選單依身份過濾）
    - `apps/saas/app/api/course/studio/route.ts`（`getOperatorStatus` 擴充為 course-scoped 檢查）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（課程選擇器取代寫死抓第一筆；新增指派講師 UI）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
