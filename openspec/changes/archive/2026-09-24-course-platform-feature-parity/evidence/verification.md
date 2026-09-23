# Course platform feature parity 驗證紀錄

日期：2026-09-23

## 自動化驗證

| Spec / Scenario 群組 | 驗證 | 結果 |
| --- | --- | --- |
| `course-dashboard`：總管理員總覽、講師範圍 | `packages/api/modules/course/lib/course-dashboard.test.ts` | PASS，2 tests |
| `lesson-comments-dm-split`：私訊資料隔離、講師回覆權限 | `packages/api/modules/course/procedures/send-lesson-message.test.ts` | PASS，納入聚合測試 |
| `quiz-results-review`：最新成績、逐題結果、跨課程隔離 | `packages/api/modules/quiz/quiz-results.test.ts` | PASS，3 tests |
| `multi-instructor-management`：共用權限、列表範圍、角色指派、講師選單 | `course-instructor-access.test.ts`、`list-manageable-courses.test.ts`、`set-instructor-role.test.ts`、既有 `course/studio/route.test.ts`、`nav-menu-items.test.ts` | PASS，聚合測試 26/26；導覽 13/13 |
| `design-tokens`：五檔硬編碼色票清除 | `rg` 掃描五個指定檔案 | PASS，無 `text-neutral-*`/`bg-neutral-*`/`text-gray-*`/`text-zinc-*`/`text-slate-*` |

## 整合驗證

- `DATABASE_URL='postgresql://placeholder:placeholder@localhost:5432/placeholder' BETTER_AUTH_SECRET='local-build-only-placeholder-secret-32chars' pnpm build`：PASS，31 packages；產出包含新增後台路由。
- `pnpm --filter @startkiter/api type-check`：PASS。
- `pnpm --filter @startkiter/saas type-check`：PASS。
- `pnpm --filter @startkiter/platform exec vitest run src/mount-points.test.ts`、`pnpm --filter @startkiter/i18n test`：PASS，8 + 30 tests；新增留言/私訊/儀表板/優惠券選單與各語系鍵值有效。
- `pnpm test`：未通過既有環境依賴。`packages/payments/catalog.test.ts` 需要可寫測試資料庫，`apps/docs/content.test.ts` 的既有環境變數數量契約也失敗；本次新增聚合測試仍為 26/26 PASS。
- `pnpm type-check`：未通過既有 `@startkiter/database` 隱含 any、`@startkiter/ui` 測試 unknown 型別錯誤；本次 API/SaaS 直接 type-check 通過。

## 尚待真人操作

`6.2` 尚未勾選。此工作樹沒有可用的登入資料庫與講師測試帳號，因此未虛構儀表板、留言/私訊、測驗成績、跨課程隔離的瀏覽器截圖；需在可登入環境補做桌面與手機 UI 巡查及截圖。
