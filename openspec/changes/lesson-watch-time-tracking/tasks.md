## 1. 紅燈測試（TDD）

- [x] 1.1 為 `record-watch-time.ts` 寫紅燈測試，涵蓋 Requirement「Watch time only increases, never regresses on re-report」與「Watch time is tracked independently of lesson completion status」：較小值回報不覆蓋既有較大值、較大值回報正確更新、記錄觀看時間不影響 `LessonProgress` 完成狀態。驗證目標：`pnpm --filter @startkiter/api test record-watch-time.test.ts` FAIL

## 2. Database schema 與 procedure

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `WatchTimeLog` model（DDL 見 design.md），產生 migration；依 design.md Decision: watchedSec 只取較大值更新，不是每次回報都覆蓋，新增 `packages/api/modules/course/procedures/record-watch-time.ts` 並在 `packages/api/modules/course/router.ts` 註冊 `recordWatchTime` procedure。驗證目標：task 1.1 全數轉綠燈

## 3. 播放器整合

- [x] 3.1 修改 `packages/course/src/player/FluentPlayer.tsx`，每 30 秒呼叫 `recordWatchTime` 回報目前累計觀看秒數。驗證目標：手動播放一段影片後確認資料庫記錄正確累加

## 4. Review 與驗證

- [ ] 4.1 派 Codex 或等效工具對本次全部 diff（task 1-3）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `watchedSec` 只取較大值更新的邏輯正確（GREATEST 語意）、與 `course-video-watermark` 同時修改 `FluentPlayer.tsx` 的變更沒有互相覆蓋（apply 前先 `git diff` 確認浮水印的 `watermark` prop 仍完整存在）；security 確認 `recordWatchTime` 只能回報呼叫者自己的觀看記錄，不能代寫其他 userId；performance 確認每 30 秒一次的回報頻率不會對資料庫造成過量寫入（單一 upsert，不是每次都新增一筆記錄）。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 4.2 用 ego-browser skill 跑一次 e2e：播放一段課程影片超過 60 秒 → 確認資料庫 `WatchTimeLog` 記錄的秒數合理累加 → 重新整理頁面後再播放 → 確認秒數沒有倒退。驗證目標：截圖或記錄資料庫查詢結果，任何一步失敗即視為本 task 未完成
- [x] 4.3 跑 `spectra analyze lesson-watch-time-tracking --json` 與 `spectra validate lesson-watch-time-tracking`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 4.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
