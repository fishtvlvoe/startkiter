## Problem

管理員帳號（role=admin）在前台看課程內容時，跟一般買家走同一套購買/訂單判斷邏輯，等於管理員也要「買過」才能看到課程內容。查證發現 `fish@fishot.com` 在正式站資料庫角色是 `user` 不是 `admin`，且即使設成 `admin`，現有的 `userHasCourseAccess`／`canAccessCourseId` 判斷邏輯完全不檢查使用者角色，只看訂單記錄。

## Root Cause

`packages/course/access.ts` 的 `canAccessCourse`／`canAccessCourseId` 與 `apps/saas/lib/course-access.ts`／`packages/api/modules/course/lib/course-access.ts` 的 reader 實作，從一開始設計就沒有 admin bypass 路徑，只查訂單／bundle／訂閱／邀請記錄。

## Proposed Solution

1. 在 `CourseAccessReader`／`BundleCourseAccessReader` 型別新增 `getUserRole` 方法（reader 層擴充，不改既有 13+4 個呼叫點簽章）。
2. `canAccessCourse`／`canAccessCourseId` 最前面加一條：`if ((await reader.getUserRole(userId)) === "admin") return true;`，在任何訂單/bundle/訂閱/邀請查詢之前就放行。
3. Prisma 端 reader（`apps/saas/lib/course-access.ts`、`packages/api/modules/course/lib/course-access.ts`）實作 `getUserRole`：查 `db.user.findUnique({ where: { id: userId }, select: { role: true } })`。
4. 正式站資料庫操作：把 `fish@fishot.com` 的 `role` 改成 `admin`（資料操作，非程式碼變更，留待 SSH 執行）。

## Success Criteria

- role=admin 的使用者對任何課程都直接放行，不查訂單記錄。
- role=user 且無任何訂單/bundle/訂閱/邀請記錄的一般使用者，依然被正確擋下（不會被這次改動意外放行）。
- 訂單記錄本身顯示邏輯不變，這個 bypass 只影響「能不能看到課程內容」。

## Impact

- Affected code:
  - Modified: `packages/course/access.ts`, `apps/saas/lib/course-access.ts`, `packages/api/modules/course/lib/course-access.ts`
  - New: `apps/saas/lib/course-access.test.ts`, `packages/api/modules/course/lib/course-access.test.ts`
