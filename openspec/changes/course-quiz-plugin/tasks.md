## 1. 紅燈測試（TDD）

- [x] 1.1 為 `packages/course-quiz/quiz-definition.ts` 寫紅燈測試，涵蓋 Requirement「Quiz definitions are stored through the shared PluginContent table」：建立測驗定義後能透過 `pluginId: "quiz" AND type: "quiz-definition"` 查詢取回，且不建立任何 Plugin 專屬表。驗證目標：`pnpm --filter @startkiter/course-quiz test quiz-definition.test.ts` FAIL（尚未實作）
- [x] 1.2 [P] 為 `packages/course-quiz/quiz-grading.ts` 寫紅燈測試，涵蓋 Requirement「Four question types are graded using verified logic」：單選/多選（含 Example 表兩組順序不同案例）/是非/填空（多個可接受答案）四種題型的判分正確性。驗證目標：`pnpm --filter @startkiter/course-quiz test quiz-grading.test.ts` FAIL
- [x] 1.3 [P] 為 `QuizAttempt` model 與 `hasPassedQuiz` 寫紅燈測試，涵蓋 Requirement「Quiz attempts are recorded in a dedicated transaction-type table」與「Pass status is queryable without modifying the course engine's unlock logic」：送出作答建立 `QuizAttempt` 記錄；`hasPassedQuiz` 對有/無通過記錄回傳正確布林值。驗證目標：`pnpm --filter @startkiter/database type-check` FAIL（型別不存在）
- [x] 1.4 [P] 為 `/quiz/[pluginContentId]` 頁面寫紅燈測試，涵蓋 Requirement「Quiz pages render through the auto-mode mount point, not embedded in lesson content」：頁面能透過獨立路由渲染，不依賴任何 block 模式的掛載機制。驗證目標：`pnpm --filter @startkiter/saas test quiz-page.test.ts` FAIL

## 2. Quiz 定義儲存層

- [x] 2.1 依 design.md Decision: Quiz 定義存 PluginContent，QuizAttempt 開獨立交易型表，新增 `packages/course-quiz/`（`index.ts`／`package.json`／`tsconfig.json`，比照 `packages/course` 目錄慣例）與 `quiz-definition.ts`：建立/查詢/更新測驗定義，全部透過 `db.pluginContent`（`pluginId: "quiz", type: "quiz-definition"`）操作。驗證目標：task 1.1 全數轉綠燈

## 3. 判分邏輯

- [x] 3.1 依 design.md Decision: 計分邏輯照抄 woomin 驗證過的判分規則，實作 `packages/course-quiz/quiz-grading.ts`，四種題型判分邏輯照抄 `/Users/fishtv/Development/products/woomin/realms/prisma/schema.prisma` 定義的 `QuizQuestionType`／`correctAnswer` 資料形狀對應的判分規則。驗證目標：task 1.2 全數轉綠燈

## 4. QuizAttempt 與查詢函式

- [x] 4.1 在 `packages/database/prisma/schema.prisma` 新增 `QuizAttempt` model（DDL 見 design.md），產生 migration；在 `packages/course-quiz/index.ts` 新增 `hasPassedQuiz(userId, pluginContentId)` 匯出函式。驗證目標：task 1.3 全數轉綠燈

## 5. Quiz 頁面與 Plugin 登記

- [x] 5.1 依 design.md Decision: Quiz 頁面用 auto 模式綁定獨立路由，買家自己在課程內容裡貼連結，新增 `apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx`（學員作答頁）與 `apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx`（operator 建立測驗頁）；在 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 陣列新增 Quiz 的 manifest entry（`id: "quiz"`, `dataSpec: "content"`, `mount.content: { kind: "auto", boundTo: "/quiz" }`, `mount.route: { path: "/quiz-admin" }`, `mount.menu: { label: "測驗管理", icon: "list-checks", order: 5, requiresOperator: true }`——`apps/saas/modules/shared/lib/nav-menu-items.ts` 只會渲染有 `mount.menu` 欄位的 entry，沒有這個欄位 operator 就完全找不到 `/quiz-admin` 入口）。驗證目標：task 1.4 全數轉綠燈

## 6. Review 與驗證

- [x] 6.1 對 `PluginContent` 讀寫方式跑一次架構核對：確認沒有新增任何 Plugin 專屬的內容儲存表、`QuizAttempt` 沒有對 `PluginContent` 建立外鍵約束、`MOUNT_POINTS` 新增的 entry 型別完全符合 `PluginManifest`（不含任何 Core 保留欄位）。驗證目標：架構核對記錄 Critical 為零，逐條核對 design.md Scope boundaries
- [ ] 6.2 派 Codex 或等效工具對本次全部 diff（task 1-5）做 Code Review（correctness／security／performance 三角度）：correctness 確認四種題型的計分邏輯符合預期、security 確認 `showAnswers: false` 時作答頁與其對應 API 回應都不洩漏正確答案內容（不只是前端隱藏，後端 payload 本身不能含答案）、非本人無法讀取他人 `QuizAttempt`，performance 確認 `/quiz/[pluginContentId]` 頁面查詢沒有 N+1。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 6.3 用 ego-browser skill 跑一次完整 e2e：以 operator 身分在 `/quiz-admin` 建立一份含四種題型的測驗 → 以學員身分訪問 `/quiz/[id]` 作答並送出 → 確認依 `showAnswers` 設定顯示或不顯示正確答案 → 確認 `QuizAttempt` 記錄正確建立 → 呼叫 `hasPassedQuiz` 確認回傳值正確。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [x] 6.4 跑 `spectra analyze course-quiz-plugin --json` 與 `spectra validate course-quiz-plugin`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 6.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/course-quiz test`／`pnpm --filter @startkiter/saas test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
