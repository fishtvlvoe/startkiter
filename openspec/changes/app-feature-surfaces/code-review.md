# app-feature-surfaces 4.1／4.2 Review Checklist

## 審查基準

- 分支：`fishtvlvoe/sr-app-feature-surfaces-review`
- 審查基準：`origin/main`／`62a87b41`
- 實作 commit：`f6d6ba4d`（`feat(platform): 分離課程使用者與管理員路由`）
- 比對命令：`git diff f6d6ba4d^ f6d6ba4d`

## 4.1 Scope boundaries

### PASS：diff 統計與檔案範圍

`git diff --stat f6d6ba4d^ f6d6ba4d` 的摘要為：

```text
26 files changed, 160 insertions(+), 52 deletions(-)
```

`git diff --name-status f6d6ba4d^ f6d6ba4d` 分類如下：

- 16 個課程管理路由／元件 rename 到 `/admin/course/*`：assignment、bundles、course-pack、invites、media、onboarding-surveys、quiz、review。
- 6 個邊界／導覽測試：`apps/saas/modules/shared/components/NavBar.test.tsx`、`apps/saas/modules/shared/lib/nav-menu-items.test.ts`、`packages/platform/src/mount-points.test.ts`、`packages/platform/src/workspace/feature-surfaces.test.ts`、`packages/platform/src/workspace/navigation.test.ts`、`packages/platform/src/workspace/registry.test.ts`。
- 2 個平台路由註冊／解析來源：`packages/platform/src/mount-points.ts`、`packages/platform/src/workspace/navigation.ts`。
- 1 個導覽 fixture：`docs/ux/startkiter-navigation-fixture.json`。
- 1 個 change 進度檔：`openspec/changes/app-feature-surfaces/tasks.md`。

實際檔案清單沒有 `packages/course/**`，也沒有 `openspec/changes/app-extension-contract/**` 或 `openspec/changes/account-settings-theme-language/**`。因此沒有改到課程內容資料模型、編輯器本體、前三張 change 固定的註冊型別或規則。

### PASS：課程路由歸屬

`packages/platform/src/mount-points.ts` 只把既有課程管理 mount path 移到 `/admin/course/*`：

```text
/quiz-admin       -> /admin/course/quiz
/assignment-admin -> /admin/course/assignment
/review-admin     -> /admin/course/review
/admin/bundles    -> /admin/course/bundles
/admin/onboarding-surveys -> /admin/course/onboarding-surveys
/admin/media      -> /admin/course/media
/admin/course-pack -> /admin/course/course-pack
```

`navigation.ts` 的變更讓路由樹決定 user／admin surface；platform admin 不會因為進入 `/course` 就把使用者路由渲染成管理畫面。這是路由邊界行為，沒有引入內容資料或編輯器邏輯。

### PASS：邊界測試

新增 `packages/platform/src/workspace/feature-surfaces.test.ts`，覆蓋：

1. `/course` 在 platform admin caller 下仍是 `app-user` surface。
2. 每個已註冊課程 admin route 都落在 `/admin/course` route tree。
3. platform surface 只有一個 `course-admin` workspace switch，沒有課程 admin detail。
4. 程式化列出 account admin route inventory 並分類 course／platform。

## 4.2 Risks／Trade-offs

| 風險 | Design mitigation | 實際證據 | 結果 |
| --- | --- | --- | --- |
| 課程既有功能複雜，路由遷移可能破壞既有行為 | 先跑課程測試基準，再跑遷移後測試 | `pnpm --filter @startkiter/course test`：exit 0；19 test files、114 tests passed。`pnpm --filter @startkiter/platform exec vitest run src/mount-points.test.ts src/workspace/feature-surfaces.test.ts src/workspace/navigation.test.ts src/workspace/registry.test.ts`：exit 0；4 files、30 tests passed。 | PASS（本 change 影響範圍） |
| 總管理員路由盤點可能漏掉隱藏 route | 以程式化 route inventory 列出全部 `admin/` page route 並逐一分類 | `apps/saas/app/(authenticated)/(main)/(account)/admin` 共 32 個 `page.tsx` route：course-admin 16、platform 16；inventory 同時由 `feature-surfaces.test.ts` 的 `routePaths()` 產生。 | PASS |
| `AppRegistrationManifest` 欄位不足 | 發現不足時用 `spectra ingest` 修正 `app-extension-contract`，不在本 change 私自擴充 | `f6d6ba4d` 沒有修改 `app-extension-contract`；mount-point diff 只有既有 manifest 的 route path 變更，沒有新增欄位或型別。未發現需 ingest 的欄位缺口。 | PASS |

補充：完整 `@startkiter/platform` package suite 目前有既有失敗：30 files 中 29 files passed、157 tests 中 156 tests passed，`src/workspace/forbidden-nouns-check.test.ts` 失敗，指出未被 `f6d6ba4d` 修改的 `apps/saas/modules/admin/component/users/UserList.tsx` 含 `學員`。此失敗不歸因於本 diff，但不能把完整 package suite 宣稱為全綠。SaaS 導覽兩個測試在本 worktree 因缺少 `packages/database/prisma/generated/client` 無法啟動；`prisma generate` 也因未提供 `DATABASE_URL` 停止，未把這個環境問題誤記成 route regression。

## 4.3 檢查紀錄（不勾選）

```text
$ spectra analyze app-feature-surfaces
Change: app-feature-surfaces

  ✓ Coverage       Clean (0 findings)
  ✓ Consistency    Clean (0 findings)
  ● Ambiguity      1 issue(s) found (1 findings)
  ✓ Gaps           Clean (0 findings)
  ✓ Localization   Clean (0 findings)

  Analyzed: proposal, specs, design, tasks

  Findings (1):

  [SUGGEST] Scenario 'existing course functionality is unaffected by the migration' has no concrete examples
    at: specs/app-feature-surfaces/spec.md
    → Add ##### Example: with concrete GIVEN/WHEN/THEN data

$ spectra validate app-feature-surfaces
✓ app-feature-surfaces — valid

ANALYZE_EXIT=0
VALIDATE_EXIT=0
```

本輪沒有部署後可用的 preview URL，因此沒有執行 ego-browser，也沒有桌面／手機截圖或瀏覽器驗收輸出。依要求不製作假截圖、不把本地測試當成瀏覽器驗收；`tasks.md` 的 3.2 與 4.3 維持未勾選，analyzer 的 1 個 `SUGGEST` 也保留原樣。

## 審查結論

- 4.1：PASS，scope 只涵蓋課程路由歸屬、平台導覽解析與邊界測試，沒有課程內容／編輯器／固定契約規則改動。
- 4.2：PASS，三項 design risk 都有 mitigation 與可核對證據；完整 platform suite 的既有 forbidden-noun 失敗已明確列出，沒有假報全綠。
- 4.3：未完成；analyze／validate 已執行並記錄，但缺少部署後瀏覽器證據，維持未勾選。
