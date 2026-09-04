# Tasks: lesson-completion-without-blocks

## 0. 前置

- [x] 0.1 Cross-impact 預檢：grep `toggleLessonProgress`、`LessonProgress`、`extractLessonBlockIds` 所有呼叫端
      （已由 PM 在 propose 階段查過：`review/router.ts` 只讀 count、`site-agent`／`mcp/lib/handler.ts`
      只讀 findMany，皆不受影響；此步驟由實作方覆核一次，若有遺漏立即回報）

## 1. TDD 紅燈（Phase 2，只寫測試，不寫實作）

對應規格 Requirement「學員進度由持久化單元完成狀態推導」新增的 2 個情境。

- [x] 1.1 `packages/api/modules/course/router.test.ts`（或既有測試檔案）新增：
      - `marks a lesson with no interactive blocks complete without a blockId`
      - `rejects a lesson with interactive blocks when no blockId is provided`
      - 確認既有「錯誤 blockId 被拒絕」測試仍存在且會通過（不能被這次改動弄壞）
- [x] 1.2 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.test.tsx`
      （新建或補在既有檔案）新增：無積木單元點擊「標記為完成」時，mutation 被呼叫且
      `blockId` 為 `undefined`
- [x] 1.3 全部跑一次，確認 1.1 前兩支測試皆為紅燈（目前 schema 必填 blockId 會直接擋掉）

## 2. 實作（Phase 3）

- [x] 2.1 `packages/api/modules/course/router.ts`：`toggleLessonProgress` 的 `blockId`
      改為 `z.string().min(1).optional()`，依 design.md 邏輯調整驗證分支
      （`allowedBlockIds.length > 0` 才要求並驗證 `blockId`）
- [x] 2.2 `apps/saas/.../classroom-client.tsx`：`toggleCompletion` 改為
      `blockId: blockId || undefined` 送出，移除「抓不到 blockId 就靜默 return」的邏輯
- [x] 2.3 跑 1.1／1.2 的測試，確認轉綠燈

## 3. 驗證

- [x] 3.1 `pnpm --filter api test`（276 passed）、`pnpm --filter saas test`（351 passed，
      含重寫過的 `classroom-client.test.tsx`——原版只是手動複製邏輯自己測自己，沒有真的
      render 元件；PM 改寫成用 `@vitest-environment jsdom` + `react-dom/client` 真的渲染
      `AcademyClassroomClient`、真的點擊按鈕）全綠；防偽造驗證邏輯 R2 檢查完整
- [x] 3.2 `pnpm exec dotenv -c -- turbo test/type-check --continue` 全庫 25/25、28/28 全綠
- [x] 3.3 ego-browser 實測：本機開這個 worktree 的 dev server，登入既有 operator 帳號，
      開一個純文字單元（無積木），點擊「標記為完成」——伺服器回 200、畫面從
      `學習進度 0% (0/4 單元)` 變成 `25% (1/4 單元)`、按鈕變綠色「已完成單元」、
      課綱旁出現勾勾，直接查 `lesson_progress` 資料表確認真的寫入一筆（測完已清除）
- [x] 3.4 有積木單元的行為改由 `classroom-client.test.tsx`（真實 render + 真實點擊）
      跟後端 3 支測試（`still rejects a blockId that does not belong to the lesson` 等）
      共同驗證：真的送出正確 blockId、防偽造驗證維持不變。本機資料庫目前沒有含真積木的
      課程單元可供瀏覽器實測，改用上述真實元件渲染測試涵蓋（非僅心智模擬）

## 4. 收尾

- [x] 4.1 `spectra validate` 通過
- [x] 4.2 更新 `openspec/site-remediation-tracker.md`：記錄這次群眾測試發現並修復的 Critical 項目
- [x] 4.3 `spectra archive`
