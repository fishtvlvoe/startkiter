## 1. 紅燈測試（Lesson content access is enforced per bundle membership）

- [x] 1.1 為 Requirement「Lesson content access is enforced per bundle membership」在 `packages/api/modules/course/course.test.ts` 新增三個測試案例，涵蓋 design.md Implementation Contract 的 **Behavior** 段落：(a) 買了包含目標課程的 bundle → `getLessonDetail` 回傳完整內容；(b) 買了不包含目標課程的另一個 bundle → 拋出 `FORBIDDEN`；(c) 未登入請求非免費試看單元 → 拋出 `UNAUTHORIZED`。此時 production reader 尚未實作，`userCanAccessCourseId` 尚未存在，案例 (a)(b) 應為紅燈（現有邏輯對 (a)(b) 兩種情況目前都會回傳內容，因為只判斷「有沒有任一付費訂單」）；驗證目標：`pnpm --filter @startkiter/api test course.test.ts` 顯示新案例 FAIL。
- [x] 1.2 在 `apps/saas/app/api/course/ai/route.test.ts`（既有則沿用，不存在則新建）新增對稱的三個測試案例：(a) 買了包含目標課程的 bundle → 200；(b) 買了不包含目標課程的另一個 bundle → 403 `forbidden`；(c) 未登入 → 401 `unauthorized`；驗證目標：測試 FAIL，理由同 1.1（AI 助教目前也是「有付費訂單就放行」）。
- [x] 1.3 執行 `pnpm --filter @startkiter/saas test:integration -- tests/integration/bundle-course-access.test.ts` 作為既有行為基線，確認 `canAccessCourseId` 本身的兩個既有情境（bundle 付款授權、退款撤銷）在改動前已是綠燈；驗證目標：1 個 test file、2 個 test cases 皆 PASS。

## 2. Production reader 放在 packages/api/modules/course/lib/course-access.ts

- [x] 2.1 依 design.md 決策「Production reader 放在 `packages/api/modules/course/lib/course-access.ts`，讓兩個入口共用」，在該檔新增 `createPrismaBundleCourseAccessReader()`，其 `findGrantedSkusForUser` 查詢 `db.order.findMany({ where: { userId, courseAccess: true }, select: { sku: true } })` 並回傳 sku 陣列，`findBundleCourseIds` 查詢 `db.bundle.findUnique({ where: { id: sku }, include: { courses: true } })` 並回傳 `courses.map(c => c.courseId)` 或 `null`——依決策「Reader 查詢邏輯照抄測試裡驗證過的 shape，不重新設計」，此邏輯必須與 `apps/saas/tests/integration/bundle-course-access.test.ts` 裡 `createDbBundleCourseAccessReader()` 的 shape 逐行比對一致；驗證目標：`pnpm type-check` 通過，型別與 `BundleCourseAccessReader` 完全匹配。
- [x] 2.2 依 design.md Implementation Contract 的 **Interface / data shape** 段落，在同檔新增 `userCanAccessCourseId(userId, courseId)`，內部呼叫 `canAccessCourseId(userId, courseId, createPrismaBundleCourseAccessReader())` 並回傳其結果；驗證目標：`pnpm type-check` 通過，函式簽章為 `(userId: string, courseId: string) => Promise<boolean>`。
- [x] 2.3 依現行 `course-module` spec 保留 `startkiter-mvp` + `courseAccess=true` 的全課程 entitlement（保留 MVP_SKU entitlement，bundle SKU 逐課程判斷）：在 `packages/course/access.ts` 的 `canAccessCourseId` 先處理 `MVP_SKU`，其他 SKU 仍走 bundle `courseId` 比對；在 `packages/course/access.test.ts` 補 MVP entitlement 與退款後拒絕案例。驗證目標：既有 bundle cases 與新增 MVP cases 全 PASS。

## 3. 新增 publicProcedureWithSession，取代 getLessonDetail 的 @ts-expect-error hack

- [x] 3.1 依決策「新增 `publicProcedureWithSession`，取代 `getLessonDetail` 的 `@ts-expect-error` hack」，在 `packages/api/orpc/procedures.ts` 新增 `publicProcedureWithSession`：`publicProcedure.use()` 包一層呼叫 `auth.api.getSession({ headers: context.headers })`，把 `session`／`user`（皆可為 `null`）放進 context，不因未登入而丟錯；驗證目標：`pnpm type-check` 通過，新 export 型別正確，且不修改既有 `publicProcedure`／`protectedProcedure`／`adminProcedure` 的行為。

## 4. getLessonDetail 的判斷順序：先查 lesson，再查 courseId 授權

- [x] 4.1 依決策「`getLessonDetail` 的判斷順序：先查 lesson，再查 courseId 授權」，修改 `packages/api/modules/course/router.ts` 的 `getLessonDetail`：procedure 從 `publicProcedure` 換成 `publicProcedureWithSession`，移除 `// @ts-expect-error optional user in context` 這行與手動 `context?.user?.id`，改用 context 提供的 `user`；將原本查 `db.order.findFirst({ where: { userId, courseAccess: true, status: "paid" } })` 的授權區塊替換為呼叫 `userCanAccessCourseId(user.id, lesson.chapter.courseId)`，回傳 `false` 時拋 `ORPCError("FORBIDDEN")`；未登入（`user` 為 `null`）與免費試看（`isFreePreview: true`）分支維持原行為不變。同時對照 design.md Implementation Contract 的 **Failure modes** 段落：確認 `findBundleCourseIds` 對不存在的 sku 回傳 `null` 時不拋錯、僅視為與該 courseId 無關；驗證目標：task 1.1 的三個測試案例全部轉為綠燈（`pnpm --filter @startkiter/api test course.test.ts` 全 PASS）。

## 5. AI 助教授權邏輯改用同一套判斷（堵住繞道）

- [x] 5.1 修改 `apps/saas/app/api/course/ai/route.ts`：`db.lesson.findUnique({ where: { id: lessonId } })` 加上 `include: { chapter: true }`；將原本查 `db.order.findFirst({ where: { userId: session.user.id, courseAccess: true, status: "paid" } })` 的授權區塊替換為呼叫 `userCanAccessCourseId(session.user.id, lesson.chapter.courseId)`，回傳 `false` 時維持原本的 `NextResponse.json({ error: "forbidden", message: "沒有觀看這個單元的權限" }, { status: 403 })`；未登入與免費試看分支維持原行為不變；驗證目標：task 1.2 的三個測試案例全部轉為綠燈（`pnpm --filter saas test route.test.ts` 或對應測試指令全 PASS）。

## 6. Review 與回歸驗證

- [x] 6.1 重跑 `pnpm --filter @startkiter/saas test:integration -- tests/integration/bundle-course-access.test.ts`，確認這次改動未讓既有兩個情境（bundle 付款授權、退款撤銷）回歸失敗；驗證目標：1 個 test file、2 個 test cases 依然 PASS，且無需修改該測試檔本身。
- [x] 6.2 對 `getLessonDetail` 與 AI 助教兩處改動跑 correctness／security 兩個角度 review：確認未登入路徑仍回 401、無權限路徑仍回 403、不會把其他使用者的 courseId 判斷邏輯洩漏在錯誤訊息裡、`publicProcedureWithSession` 不會讓其他既有 procedure 意外拿到未經驗證的 user；驗證目標：review 記錄 Critical 為零。
- [x] 6.3 跑 `spectra analyze bundle-aware-course-access --json` 確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion；驗證目標：無 Critical／Warning。
- [x] 6.4 跑 `spectra validate bundle-aware-course-access` 確認驗證通過；驗證目標：0 warnings、0 errors。
- [x] 6.5 逐項核對 design.md Implementation Contract 的 **Acceptance criteria** 與 **Scope boundaries** 是否全部滿足：兩個路徑各自的三個新測試案例存在且綠燈、MVP entitlement 相容性測試存在且綠燈、integration `bundle-course-access.test.ts` 無回歸、`pnpm --filter @startkiter/api test`／`pnpm --filter @startkiter/saas test`／`pnpm --filter @startkiter/saas test:integration -- tests/integration/bundle-course-access.test.ts`／`pnpm type-check` 全綠、`@ts-expect-error optional user in context` 已從代碼移除，且改動範圍未超出 Scope boundaries 列出的檔案清單；`packages/api/vitest.config.ts` 的 JSX runtime 與 `sandbox-runtime.ts` 的 TypeScript lib 相容性修復另有回歸測試。驗證目標：`pnpm build` 與 `pnpm type-check` 兩個指令 exit code 皆為 0，且 `git diff --stat` 與 `git status --short` 合併核對後，改動檔案清單與 Scope boundaries 一致。

> 6.5 驗證證據（2026-08-23）：`pnpm --filter @startkiter/api test` 為 18 files / 84 tests PASS；`pnpm --filter @startkiter/saas test` 為 27 files / 143 tests PASS；指定 integration 為 1 file / 2 tests PASS；`packages/course` 全套為 12 files / 70 tests PASS；`pnpm type-check` 為 23/23 tasks PASS；`pnpm build` 為 2/2 Next.js production builds PASS；root `pnpm test` 為 17/17 tasks PASS。`git diff --check` 無輸出，且 scope 已包含本次兩個 baseline 相容性修復。
