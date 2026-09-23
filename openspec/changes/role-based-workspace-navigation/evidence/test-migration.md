# 5.1 測試遷移紀錄

## 導覽模型已遷移

以下測試現在斷言 `WorkspaceContext`／registry／`resolveNavigation` 的輸出，不再使用 `course-admin-menu` 或 `admin-settings-menu` 舊模型：

- `apps/saas/modules/shared/lib/nav-menu-items.test.ts`
- `apps/saas/modules/shared/components/NavBar.test.tsx`
- `packages/platform/src/workspace/navigation.test.ts`
- `packages/platform/src/workspace/registry.test.ts`
- `packages/platform/src/workspace/demo-consistency.test.ts`

導覽 adapter 的輸入也從 `isOperator` 改成 `platformAdmin`，由目前路由決定 App 使用者／App 管理員工作區；`/course`、`/admin/course`、平台管理路由各自有獨立 assertion。

## 保留的後端權限測試

以下檔案雖然出現 `isOperator`，測試的是資料權限或路由守門，不是選單模型。把它們改成 `resolveNavigation` 會刪掉真正的後端權限覆蓋，因此列為明確排除，不與新導覽 assertion 混用：

- `packages/permissions/is-operator.test.ts`：測試總管理員判斷函式本身。
- `packages/api/modules/course/lib/course-instructor-access.test.ts`：測試課程資料操作權限與講師指派查詢。
- `apps/saas/app/api/course/ai-notes/generate/route.test.ts`：測試 API 在呼叫課程資料權限檢查時傳入的能力。
- `apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts`：測試電子報操作的後端 operator gate。
- `apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx`：測試 CoursePack 路由守門與資料讀取。
- `apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx`：測試 CoursePack 詳情路由守門與資料讀取。

## 全套測試結果

命令：

```text
pnpm --filter @startkiter/saas test
```

結果：

```text
Test Files  107 passed (107)
Tests  430 passed (430)
Duration  12.03s
```

這是遷移後的新基準；Phase 0 的 `106 files / 430 tests` 只保留作為前後差異紀錄，不當作本次完成證據。
