## 1. 紅燈測試（TDD）

- [x] 1.1 為 `CourseReview` 相關約束寫紅燈測試，涵蓋 Requirement「A learner can rate a course exactly once」：重複評價同一課程被資料庫拒絕。驗證目標：`pnpm --filter @startkiter/database type-check` FAIL（型別不存在）
- [x] 1.2 [P] 為 `packages/course-review/review-summary.ts` 寫紅燈測試，涵蓋 Requirement「Reviews and comments are stored in dedicated transaction-type tables, not PluginContent」與「Course review summary is computed on demand, not cached on the Course model」：`getCourseReviewSummary` 計算平均分數與總數正確，且不依賴任何 `Course` model 上的快取欄位。驗證目標：`pnpm --filter @startkiter/course-review test review-summary.test.ts` FAIL
- [x] 1.3 [P] 為匿名留言顯示邏輯寫紅燈測試，涵蓋 Requirement「Anonymous comments retain the real author for operator review while hiding it from other learners」：學員視角看不到匿名留言的真實身份，operator 視角能看到。驗證目標：`pnpm --filter @startkiter/api test lesson-comment.test.ts` FAIL

## 2. 交易型資料表

- [x] 2.1 依 design.md Decision: 評價與留言全部走交易型獨立表，不使用 PluginContent，在 `packages/database/prisma/schema.prisma` 新增 `CourseReview`／`ReviewHelpful`／`ReviewReport`／`LessonComment` 四個 model（DDL 見 design.md），產生 migration。驗證目標：task 1.1 全數轉綠燈

## 3. 評分摘要與留言顯示邏輯

- [x] 3.1 依 design.md Decision: 評分摘要即時查詢，不快取進 Course model，新增 `packages/course-review/`（`index.ts`／`package.json`／`tsconfig.json`）與 `review-summary.ts` 的 `getCourseReviewSummary`；新增留言顯示邏輯的 API procedure（依 `isAnonymous` 與呼叫者角色決定是否回傳真實 `userId`）；投「有用」票時在同一個資料庫 transaction 內遞增 `helpfulCount`。驗證目標：task 1.2／1.3 全數轉綠燈

## 4. Operator 管理頁與 Plugin 登記

- [x] 4.1 新增 operator 評價/留言管理頁（隱藏評價、回覆評價、查看檢舉列表、標記留言已讀、軟刪除留言）；在 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 陣列新增 Review Plugin 的 manifest entry（含 `mount.menu`）。驗證目標：手動驗證 operator 選單可看到「評價與留言管理」入口且功能可操作

## 5. Review 與驗證

- [ ] 5.1 派 Codex 或等效工具對本次全部 diff（task 1-4）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `getCourseReviewSummary` 即時計算結果正確、重複評價/投票/檢舉被唯一鍵擋下；security 確認學員視角的 API 回應真的不含真實 `userId`（不是只在前端隱藏，後端回應本身就要排除）；performance 確認 `helpfulCount` 遞增與投票記錄在同一 transaction 內，且課程頁讀取評價摘要沒有 N+1。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 5.2 用 ego-browser skill 跑一次完整 e2e：學員對一門課評 5 星並留言 → 另一位學員對該評價投有用票 → 學員在單元下方留一則匿名留言 → operator 在管理頁看到該留言的真實身份、標記已讀 → 確認一般學員視角看不到匿名者身份。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [x] 5.3 跑 `spectra analyze course-review-plugin --json` 與 `spectra validate course-review-plugin`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 5.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/course-review test`／`pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
