## 1. 紅燈測試（TDD）

- [x] 1.1 為 `course-instructor-access.ts` 寫紅燈測試，涵蓋 Requirement「An instructor can only manage the courses they are assigned to」：operator 對任意 courseId 通過、被指派講師對自己課程通過、被指派講師對他人課程拒絕、一般 user 拒絕。驗證目標：`pnpm --filter @startkiter/api test course-instructor-access.test.ts` FAIL
- [x] 1.2 為 `assign-course-instructor.ts` 寫紅燈測試，涵蓋 Requirement「Operator can assign a user as an instructor scoped to a specific course」：operator 指派成功、非 operator 指派被拒絕、對同一 courseId+userId 重複指派不報錯。驗證目標：`pnpm --filter @startkiter/api test assign-course-instructor.test.ts` FAIL
- [x] 1.3 為 `list-manageable-courses.ts` 寫紅燈測試，涵蓋 Requirement「The course studio course list is scoped by caller identity」：operator 回傳全部課程、被指派講師只回傳自己被指派的課程、皆無時回傳空陣列。驗證目標：`pnpm --filter @startkiter/api test list-manageable-courses.test.ts` FAIL

紅燈證據：三組測試先於實作執行，因目標模組尚不存在而以 exit code 1 失敗；完成實作後轉綠。

## 2. Database schema 與授權函式

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `CourseInstructor` model（DDL 見 design.md），產生 migration。驗證目標：task 1.1／1.2／1.3 全數轉綠燈
- [x] 2.2 依 design.md Decision 1：course-scoped 授權判斷獨立寫成一個異步函式，不塞進 Permix 框架，實作 `packages/api/modules/course/lib/course-instructor-access.ts` 的 `hasAnyCourseInstructorAssignment(userId)` 與 `canManageCourse({ userId, courseId, isOperator })`
- [x] 2.3 實作 `assign-course-instructor`、`remove-course-instructor`、`list-manageable-courses` 三個 procedure，掛進 `packages/api/modules/course/router.ts`；前兩者複用 router.ts 既有的 `courseOperatorProcedure` 中介層（內部呼叫 `isCourseOperator`）限制僅 operator 可呼叫，不重複寫判斷邏輯。驗證目標：`pnpm --filter @startkiter/api test` 全綠

實作證據：migration deploy 套用兩個 `CourseInstructor` migrations；Prisma validate exit code 0；API 35 個 test files／141 個 tests 通過。

## 3. 授權點串接

- [x] 3.1 依 design.md Decision 2：`AdminLayout` 放行條件擴充為 OR，選單依身份分流，實作 Requirement「The admin area entry point admits operators and assigned instructors, with menu scoped accordingly」：修改 `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`，放行條件改為 `checkPermission(..., "admin.access") || await hasAnyCourseInstructorAssignment(session.user.id)`；非 operator 的被指派講師只渲染「課程管理」選單項目
- [x] 3.2 依 design.md Decision 3：`isCourseOperator` 呼叫點擴充為 course-scoped 檢查，函式本身不改，修改 `apps/saas/app/api/course/studio/route.ts` 的 `getOperatorStatus`：GET（列課程）改呼叫 `listManageableCourses` 邏輯過濾；帶 courseId 的動作（`create_chapter`/`update_lesson` 等，執行 `grep -n "case \"" apps/saas/app/api/course/studio/route.ts` 列出全部動作分支）改呼叫 `canManageCourse`，403 時回傳既有 `COURSE_STUDIO_ERROR_CODES.FORBIDDEN`。驗證目標：task 3 相關手動驗證全部通過

授權驗證證據：講師移除 assignment 後 API 即回傳 403；被指派課程操作成功；混合授權 ID／mutation ID 回歸測試回傳 403 且 mutation 未執行。

## 4. 頁面

- [x] 4.1 修改 `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`：把 `setCourseId(firstCourse.id)` 的寫死邏輯換成呼叫 `listManageableCourses` 取得課程清單並渲染下拉選擇器；新增「管理講師」設定區塊（僅 operator 可見，選擇既有 user 指派/移除該課程的講師身份，呼叫 `assign-course-instructor`/`remove-course-instructor`）

## 5. Review 與驗證

- [x] 5.1 派 Codex 或等效工具對本次全部 diff（task 1-4）做 Code Review（correctness／security／performance 三角度），這張涉及授權邏輯改動，CR 務必逐條核對：correctness 確認 `canManageCourse` 對 operator 一律回傳 true、對被指派講師僅限自己被指派的 courseId 回傳 true；security 確認 `AdminLayout` 放行條件的 OR 邏輯沒有反向漏洞（例如講師被移除指派後，既有 session 是否仍能存取已被移除的課程，需確認每次請求都重新查詢而非快取舊結果）、`assign-course-instructor`／`remove-course-instructor` 確實限定僅 operator 可呼叫；performance 確認 `hasAnyCourseInstructorAssignment` 不會在每次頁面渲染重複查詢多次。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 5.2 用 ego-browser skill 跑一次完整 e2e：operator 登入 → 在 `admin/course/page.tsx` 建立一門新課程 → 用「管理講師」把某個既有 user 指派為該課程講師 → 登出、以該講師帳號登入 → 確認 `/admin` 側邊選單只看到「課程管理」→ 確認課程選擇器只看到被指派的課程 → 對該課程新增章節成功 → 直接呼叫其他 courseId 的 studio API 確認回傳 403 → 直接存取 `/admin/users` 確認被擋。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [x] 5.3 跑 `spectra analyze course-instructor-scoped-access --json` 與 `spectra validate course-instructor-scoped-access`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 5.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0

Review 與驗證證據：CC 本輪因用量上限無法執行；由 Orca 隔離 worktree 的 Codex 等效 CR 完成 correctness／security／performance 審查。第一次 CR 找到 1 High（混合 `courseId`／`id` 授權繞過）與 1 Low（重複索引），已修正並補回歸測試；第二次 CR：PASS，Critical 0／High 0／Medium 0／Low 0。ego-browser 實際完成 operator 建課、指派講師、講師登入、選單與課程範圍確認、指定課程新增章節、未授權課程 studio API 403、`/admin/users` 導回首頁；截圖：`/tmp/startkiter-course-instructor-admin.png`。`spectra analyze` 四維度 Clean、0 findings；`spectra validate` valid；`pnpm test` 19/19 tasks successful（API 35 files／141 tests、SaaS 30 files／157 tests）；`pnpm type-check` 25/25 tasks successful；`pnpm build` 2/2 tasks successful，以上 exit code 0。
