## Context

woomin（`products/woomin/realms/`）用 `CourseInstructor` model（`prisma/schema.prisma` 361 行起，`{ courseId, userId, createdById }`）＋ `lib/course-permissions.ts` 的 `manageableCourseWhereForUser`（`courseId`/`userId`/`instructors.none({})` 三分支 OR）＋ `UserRole` enum 的 `INSTRUCTOR`/`EDITOR` 值，做完整的多角色課程管理範圍限縮。

StartKiter 目前的 course studio 授權是單層 email 比對：`apps/saas/app/api/course/studio/route.ts` 的 `getOperatorStatus` 呼叫 `isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)`（`packages/api/modules/course/lib/course-operator.ts`），與 `apps/saas/lib/operator.ts` 的 `isOperator` 邏輯重複但各自獨立維護。`AdminLayout`（`apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`）走另一套機制：`checkPermission({ user }, "admin.access")`（`packages/permissions/`，Permix 框架，`admin.access = user.role === "admin"`）。這兩套機制目前並存，`/admin` 整體入口用 Permix，`/admin/course` 的 API 動作用 email 比對，互不相通。

`admin/course/page.tsx` 目前用 `db.course.findMany()`（GET route，無 where 條件）抓全部課程，前端邏輯是 `setCourseId(firstCourse.id)`——UI 從未支援選擇/切換課程，即使資料庫允許多筆 `Course` 記錄。

StartKiter 沒有 `UserRole` enum，Better Auth `user.role` 欄位只有 `"admin"` 這個特殊值（其餘 user 為 null/undefined）。本次不新增角色系統，改成「是否存在 `CourseInstructor` 指派記錄」這個布林事實驅動授權，比照 woomin 精神但去掉角色分級。

## Goals / Non-Goals

**Goals:**
- Operator 能把特定課程的管理權指派給其他 user，不需要分享 `ADMIN_EMAIL`
- 被指派的 user 登入後只能看到、只能操作自己被指派的課程，看不到 users/orders/revenue/bundles/settings
- `admin/course/page.tsx` 支援多課程選擇，不再寫死抓第一筆

**Non-Goals:**
- 不新增 `INSTRUCTOR`/`EDITOR` 角色分級，不擴充 Better Auth `user.role`
- 不做「未指派任何講師 = 全講師共管」規則
- 不合併 `isCourseOperator`/`isOperator` 這兩個重複實作（屬於既有技術債，本次只在 `isCourseOperator` 的呼叫點擴充邏輯，不做重構清理，避免範圍外變更）
- 不做課程建立者自動指派

## Decisions

### Decision 1：course-scoped 授權判斷獨立寫成一個異步函式，不塞進 Permix 框架

`packages/permissions/create-permission-rules.ts` 的 `createPermissionRules` 是同步、不帶特定資源 ID 的全域規則函式（`admin.access`／`organization.*` 皆是「使用者是否屬於某個角色」，不需要查詢特定 courseId）。Course-scoped 判斷需要「這個 userId 對這個 courseId 有沒有指派記錄」，是需要查 DB 的資源層級判斷，硬塞進 Permix 的同步規則物件會需要在呼叫端先把所有 courseId 的指派結果查完塞進去，徒增複雜度。改成獨立的 `canManageCourse(params): Promise<boolean>` 函式，比照現有 `packages/course/access.ts` 的 `canAccessCourseId` 依賴注入模式。

**Alternatives Considered：**
1. 擴充 `PermissionsDefinition` 加入 `course.manage`，`createPermissionRules` 改成異步——否決，`checkPermission` 目前所有呼叫端都假設同步，改成異步會牽動 `AdminLayout` 以外的既有呼叫點（`organization.*` 相關頁面），屬於範圍外的破壞性變更
2. 完全複用 `packages/course/access.ts` 的 `canAccessCourseId`——否決，那支函式解的是「學員能不能看課」，語意是播放權限，跟「講師能不能管理課程內容」是不同的授權維度，混用會讓函式名稱與 Requirement 對不上

### Decision 2：`AdminLayout` 放行條件擴充為 OR，選單依身份分流

`AdminLayout` 改成：`checkPermission(..., "admin.access") || (await hasAnyCourseInstructorAssignment(session.user.id))` 才放行；放行後傳一個 `isFullOperator: boolean` 給選單渲染邏輯——`true` 顯示現有全部選單項目，`false` 只顯示「課程管理」一項。

**Alternatives Considered：**
1. 讓被指派講師的 user 走完全獨立的路由（例如 `/instructor/course`），不共用 `/admin` 底下的 layout——否決，會產生兩份幾乎相同的課程管理頁面程式碼，未來功能新增要改兩處
2. 在 `admin/course/page.tsx` 內部自己做二次授權检查，`AdminLayout` 完全不變——否決，被指派講師的 user 連 `/admin` 都進不去（`AdminLayout` 會先 redirect），走不到 `admin/course/page.tsx`

### Decision 3：`isCourseOperator` 呼叫點擴充為 course-scoped 檢查，函式本身不改

`getOperatorStatus`（`route.ts`）依動作類型分流：GET（列出課程）不用單一 courseId 判斷，而是查詢「operator 回傳全部課程 / 非 operator 回傳 `CourseInstructor` 指派的課程清單」；其餘帶 `courseId` 參數的動作（`create_chapter`/`update_lesson` 等）呼叫新增的 `canManageCourse(userId, courseId, isOperator)`，`isOperator` 為 true 直接通過，否則查 `CourseInstructor` 是否存在該筆指派。

**Alternatives Considered：**
1. 修改 `isCourseOperator` 函式簽章本身塞入 courseId 參數——否決，`isCourseOperator` 是純同步 email 比對，混入異步 DB 查詢會讓函式語意混亂且到處都要 `await`，改成呼叫點組合兩個獨立判斷式更清楚

## Implementation Contract

**Behavior：**
- Operator 在 `admin/course/page.tsx` 的課程選擇器旁看到「管理講師」按鈕，可指派/移除任一 user 為選定課程的講師
- 被指派講師的 user 登入後，`/admin` 側邊選單只顯示「課程管理」；點進 `/admin/course` 的課程選擇器只列出自己被指派的課程；對未被指派的 courseId 呼叫任何 studio 動作一律 403
- Operator 不受任何限制，行為與現況相同

**Interface / data shape：**
```prisma
model CourseInstructor {
  id          String   @id @default(cuid())
  courseId    String
  userId      String
  createdById String
  createdAt   DateTime @default(now())

  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@index([userId])
  @@index([courseId])
  @@map("course_instructor")
}
```

- `hasAnyCourseInstructorAssignment(userId: string): Promise<boolean>` — `packages/api/modules/course/lib/course-instructor-access.ts`
- `canManageCourse(params: { userId: string; courseId: string; isOperator: boolean }): Promise<boolean>` — operator 直接 true；否則查 `CourseInstructor.findUnique({ courseId_userId })`
- `assignCourseInstructor` procedure：`{ courseId: string, userId: string }` → 建立 `CourseInstructor`；僅 operator 可呼叫（複用 `isCourseOperator`）
- `removeCourseInstructor` procedure：`{ courseId: string, userId: string }` → 刪除該筆記錄；僅 operator 可呼叫
- `listManageableCourses` procedure：`{}` → operator 回傳全部 `Course`；非 operator 回傳該 user 有 `CourseInstructor` 記錄的 `Course` 清單，兩者皆無回傳空陣列

**Failure modes：**
- 非 operator、非被指派講師的 user 呼叫任何 studio 動作 → 403（沿用現有 `COURSE_STUDIO_ERROR_CODES.FORBIDDEN`）
- 被指派講師的 user 對不屬於自己的 courseId 呼叫動作 → 403，與上一條同錯誤碼，不額外區分「沒被指派」與「完全無權限」，避免洩漏課程是否存在指派關係
- `assignCourseInstructor`/`removeCourseInstructor` 被非 operator 呼叫 → 403

**Acceptance criteria：**
- `pnpm --filter @startkiter/api test course-instructor-access.test.ts` 綠燈：operator 對任意 courseId 通過、被指派講師對自己課程通過、被指派講師對他人課程拒絕、一般 user 拒絕
- `pnpm --filter @startkiter/api test assign-course-instructor.test.ts` 綠燈：operator 指派成功、非 operator 指派被拒絕、重複指派同一 user 不報錯（`@@unique` upsert 語意）
- 手動驗證：以講師帳號登入，`/admin` 側邊選單只看到「課程管理」，`/admin/users` 直接存取回傳 403 或 redirect
- 手動驗證：講師在 `admin/course/page.tsx` 課程選擇器只看到被指派的課程，對其他課程的 studio API 直接呼叫回傳 403

**Scope boundaries：**
- In scope：`CourseInstructor` model、`canManageCourse`/`hasAnyCourseInstructorAssignment` 判斷函式、`assignCourseInstructor`/`removeCourseInstructor`/`listManageableCourses` procedure、`AdminLayout` 放行條件與選單分流、`admin/course/page.tsx` 課程選擇器與指派講師 UI、`route.ts` 的 course-scoped 動作檢查
- Out of scope：`UserRole` 角色分級、Permix `PermissionsDefinition` 擴充、`isCourseOperator`/`isOperator` 重複實作的重構清理

## Cross-Impact Note

`isCourseOperator` 也被 `apps/saas/app/api/bundles/route.ts`／`apps/saas/app/api/bundles/admin/route.ts`／`apps/saas/app/api/bundles/[id]/route.ts` 引用。本次不修改 `isCourseOperator` 函式本身，只在 `studio/route.ts` 的呼叫點擴充判斷邏輯組合，bundle 相關 API 行為完全不受影響，維持 operator-only。`packages/api/modules/course/router.ts` 既有的 `courseOperatorProcedure` 中介層同理不受影響，`assign-course-instructor`/`remove-course-instructor` 直接複用它。

## Risks / Trade-offs

- [Risk] `AdminLayout` 放行條件擴充為異步查詢（`hasAnyCourseInstructorAssignment`），每次進入 `/admin` 任何頁面都會多一次 DB 查詢（即使是純 operator）→ Mitigation：`checkPermission(..., "admin.access")` 為同步且優先判斷，短路求值下 operator 完全不觸發這次查詢，只有非 operator 才會查
- [Risk] 被指派講師的 user 未來若需要更細的分工（例如只能編輯內容不能刪除課程）——目前設計是全有全無的課程級管理權 → Mitigation：Non-Goals 已明確排除角色分級，需要時再開新 change，不在本次預先設計動作級別的權限矩陣
- [Risk] `isCourseOperator`／`isOperator` 兩份重複實作在本次之後會有第三個呼叫點（`canManageCourse` 內部呼叫），進一步增加重複維護面 → Mitigation：`canManageCourse` 的簽章接受 `isOperator: boolean` 由呼叫端傳入而非自己 import 判斷函式，呼叫端各自決定要用哪一份 email 比對，不擴大 `canManageCourse` 對特定實作的耦合
