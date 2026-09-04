# Tasks: lesson-completion-without-blocks

## 0. 前置

- [ ] 0.1 Cross-impact 預檢：grep `toggleLessonProgress`、`LessonProgress`、`extractLessonBlockIds` 所有呼叫端
      （已由 PM 在 propose 階段查過：`review/router.ts` 只讀 count、`site-agent`／`mcp/lib/handler.ts`
      只讀 findMany，皆不受影響；此步驟由實作方覆核一次，若有遺漏立即回報）

## 1. TDD 紅燈（Phase 2，只寫測試，不寫實作）

對應規格 Requirement「學員進度由持久化單元完成狀態推導」新增的 2 個情境。

- [ ] 1.1 `packages/api/modules/course/router.test.ts`（或既有測試檔案）新增：
      - `marks a lesson with no interactive blocks complete without a blockId`
      - `rejects a lesson with interactive blocks when no blockId is provided`
      - 確認既有「錯誤 blockId 被拒絕」測試仍存在且會通過（不能被這次改動弄壞）
- [ ] 1.2 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.test.tsx`
      （新建或補在既有檔案）新增：無積木單元點擊「標記為完成」時，mutation 被呼叫且
      `blockId` 為 `undefined`
- [ ] 1.3 全部跑一次，確認 1.1 前兩支測試皆為紅燈（目前 schema 必填 blockId 會直接擋掉）

## 2. 實作（Phase 3）

- [ ] 2.1 `packages/api/modules/course/router.ts`：`toggleLessonProgress` 的 `blockId`
      改為 `z.string().min(1).optional()`，依 design.md 邏輯調整驗證分支
      （`allowedBlockIds.length > 0` 才要求並驗證 `blockId`）
- [ ] 2.2 `apps/saas/.../classroom-client.tsx`：`toggleCompletion` 改為
      `blockId: blockId || undefined` 送出，移除「抓不到 blockId 就靜默 return」的邏輯
- [ ] 2.3 跑 1.1／1.2 的測試，確認轉綠燈

## 3. 驗證

- [ ] 3.1 `pnpm --filter api test`、`pnpm --filter saas test` 全綠（含既有測試，確認沒改壞防偽造驗證）
- [ ] 3.2 `pnpm type-check` 全綠
- [ ] 3.3 ego-browser 實測：本機或正式站找一個純文字/影片單元（沒有積木），登入學員帳號，
      點擊「標記為完成」，截圖確認按鈕變成「已完成單元」、頂部進度百分比更新、
      直接查 `LessonProgress` 資料表確認真的寫入
- [ ] 3.4 ego-browser 額外實測：有積木的單元，走完互動積木觸發完成，確認行為與改動前一致
      （防止 R2 回歸）

## 4. 收尾

- [ ] 4.1 `spectra validate` 通過
- [ ] 4.2 更新 `openspec/site-remediation-tracker.md`：記錄這次群眾測試發現並修復的 Critical 項目
- [ ] 4.3 `spectra archive`
