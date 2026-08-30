# Tasks: unify-operator-permission-model

## Phase 0：正式規格同步（對應 specs/ delta）

- [ ] 0.1 更新 `openspec/specs/operator-settings/spec.md`「Operator identity matches ADMIN_EMAIL」條文，納入 role=admin 也算 operator（對應 `specs/operator-settings/spec.md` delta）
- [ ] 0.2 更新 `openspec/specs/course-instructor-scoped-access/spec.md` 三條 Requirement（「Operator can assign a user as an instructor scoped to a specific course」／「The admin area entry point admits operators and assigned instructors, with menu scoped accordingly」／「The course studio course list is scoped by caller identity」），機制敘述從單純 `isCourseOperator` email check 改成共用 `isOperator`（對應 `specs/course-instructor-scoped-access/spec.md` delta）

## Phase 1：新增統一函式 + 紅燈測試

- [ ] 1.1 在 `packages/permissions` 新增 `is-operator.ts`：`isOperator(user, adminEmail?)` = `checkPermission({user}, "admin.access")` OR email 比對 ADMIN_EMAIL
- [ ] 1.2 寫 `packages/permissions/is-operator.test.ts`：role=admin 通過／ADMIN_EMAIL 通過／兩者皆非拒絕／null user 拒絕（紅燈：函式還沒寫）
- [ ] 1.3 改寫 `packages/api/modules/pages-cms/access.test.ts` 的「denies a role=admin user whose email is not ADMIN_EMAIL」測試，斷言改成「allows」（改斷言後、還沒改 `access.ts` 前應為紅燈）
- [ ] 1.4 在 `packages/api/modules/course/lib/course-operator.test.ts`（若不存在則新建）補一條：role=admin 但 email 非 ADMIN_EMAIL 應通過 `courseOperatorProcedure`（紅燈）
- [ ] 1.5 跑上述新/改測試，確認全部紅燈（`isOperator` 還沒實作、`access.ts`／`course-operator.ts` 還沒改）

## Phase 2：實作，逐一遷移呼叫點

- [ ] 2.1 `packages/api/modules/course/lib/course-operator.ts`：`courseOperatorProcedure` 改呼叫 `isOperator(context.user, process.env.ADMIN_EMAIL)`（`isCourseOperator` 函式本身保留，作為 `isOperator` 內部私有邏輯或直接由 `packages/permissions` 取代）
- [ ] 2.2 `packages/api/modules/pages-cms/access.ts`：`resolvePagesCmsAccess`／`canAccessPagesCmsAdmin` 改用 `isOperator` 取代內部 `emailsMatch`
- [ ] 2.3 遷移以下 17 個呼叫點，把 `isCourseOperator(xxx.email, process.env.ADMIN_EMAIL)` 換成 `isOperator(xxx, process.env.ADMIN_EMAIL)`（傳整個 user/context.user 物件，不是只傳 email）：
  - [ ] `apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx:11`
  - [ ] `apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx:28`
  - [ ] `apps/saas/app/(authenticated)/(operator)/lesson-messages/page.tsx:12`
  - [ ] `apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx:11`
  - [ ] `apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx:11`
  - [ ] `apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx:14`
  - [ ] `apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx:13`
  - [ ] `apps/saas/app/api/course/studio/route.ts:38`
  - [ ] `apps/saas/app/api/course/batch-import/upload-video/route.ts:19`
  - [ ] `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx:57`
  - [ ] `apps/saas/app/api/course/ai-notes/generate/route.ts:64`
  - [ ] `apps/saas/app/api/course/batch-import/create-curriculum/route.ts:33`
  - [ ] `apps/saas/app/api/lesson-tool/config/route.ts:50`
  - [ ] `packages/api/modules/course/procedures/send-lesson-message.ts:55`
  - [ ] `packages/api/modules/course/procedures/list-manageable-courses.ts:14`
  - [ ] `packages/api/modules/quiz/router.ts:21`
  - [ ] `packages/api/modules/review/router.ts:12`
- [ ] 2.4 `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`：把 `isOperator = checkPermission({user}, "admin.access")` 改成 `isOperator({ ... }) = isOperator(session.user, process.env.ADMIN_EMAIL)`（讓 ADMIN_EMAIL 帳號即使 role 不是 admin 也能看到完整選單，不再走縮水的 instructor 分支）
- [ ] 2.5 刪除 `apps/saas/lib/operator.ts`（含死代碼 `shouldShowOperatorSettingsLink`），4 個呼叫點改用新的統一邏輯：
  - [ ] `apps/saas/app/api/sidebar-layout/route.ts`
  - [ ] `apps/saas/app/api/bundles/route.ts`
  - [ ] `apps/saas/app/api/bundles/[id]/route.ts`
  - [ ] `apps/saas/app/api/bundles/admin/route.ts`
- [ ] 2.6 `apps/saas/app/api/course/studio/route.ts` 目前只借用 `OperatorSession` 型別（`import type { OperatorSession } from "../../../../lib/operator"`），`lib/operator.ts` 刪除後這個型別要換來源（改從 `packages/permissions` 匯出等價型別，或直接內聯定義）
- [ ] 2.7 跑 Phase 1 的紅燈測試，全部轉綠

## Phase 3：回歸驗證

- [ ] 3.1 跑 `pnpm --filter platform --filter api --filter saas test`，確認全部通過（不設 DATABASE_URL，驗證 SR1 的修復仍然有效）
- [ ] 3.2 跑 `pnpm --filter platform --filter api --filter saas type-check`，確認全綠（尤其確認 17 個呼叫點型別都對得上，沒有偷偷退化成 role 恆 undefined）
- [ ] 3.3 PM 親自 grep `isCourseOperator(` 確認全部 17 個舊呼叫點都已替換，沒有漏改
- [ ] 3.4 PM 親自 grep `emailsMatch` 確認 pages-cms 已不再重複實作，改用共用 `isOperator`
