# 5.2 分層驗證紀錄

## Contract 層

```text
pnpm --filter @startkiter/platform test
Test Files  27 passed (27)
Tests  136 passed (136)
```

涵蓋 manifest、registry、WorkspaceContext、resolver、locale completeness、forbidden noun 與 demo fixture consistency。

## App 層 focused tests

```text
pnpm --filter @startkiter/saas exec vitest run 'modules/shared/lib/nav-menu-items.test.ts'
Test Files  1 passed (1)
Tests  12 passed (12)

pnpm --filter @startkiter/saas exec vitest run 'modules/shared/components/NavBar.test.tsx'
Test Files  1 passed (1)
Tests  18 passed (18)

pnpm --filter @startkiter/saas exec vitest run 'app/(authenticated)/(main)/(account)/admin/layout.test.ts'
Test Files  1 passed (1)
Tests  2 passed (2)
```

## 型別與完整回歸

```text
pnpm --filter @startkiter/platform type-check
exit 0

pnpm --filter @startkiter/saas type-check
exit 0

pnpm --filter @startkiter/saas test
Test Files  107 passed (107)
Tests  430 passed (430)
```

完整回歸中的 430 是遷移後新基準，不能與 Phase 0 的 430 直接視為同一組證據；檔案數已由 106 增加至 107，且舊導覽 assertion 已改寫。
