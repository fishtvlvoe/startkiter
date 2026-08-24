## 1. 紅燈測試（TDD）

- [ ] 1.1 為 `packages/course/src/player/watermark-overlay.tsx` 寫紅燈測試，涵蓋 Requirement「Video playback overlays a per-viewer dynamic watermark when enabled」與「Masked email display mode does not reveal the full address」：enabled 時渲染含 email/課程標題的疊加層並定時改變位置；disabled 時不渲染；`MASKED` 模式輸出不含完整 email。驗證目標：`pnpm --filter @startkiter/course test watermark-overlay.test.tsx` FAIL

## 2. Database schema 與疊加層實作

- [ ] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `CourseVideoWatermarkSetting` model（DDL 見 design.md），產生 migration；依 design.md Decision: 浮水印是前端播放器疊加層，不燒錄進影片檔案，實作 `watermark-overlay.tsx` 與修改 `FluentPlayer.tsx` 新增 `watermark` prop。驗證目標：task 1.1 全數轉綠燈

## 3. Course Studio 設定區塊

- [ ] 3.1 修改 `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`，新增浮水印設定區塊（開關、顯示內容、透明度、移動間隔）。驗證目標：手動驗證設定能正確存取並反映在播放器上

## 4. Review 與驗證

- [ ] 4.1 派 Codex 或等效工具對本次全部 diff（task 1-3）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `MASKED` 模式輸出不含完整 email、疊加層開關關閉後播放器不渲染任何浮水印元素；security 確認浮水印顯示的 email 是當前登入 viewer 自己的資料，不會被前端竄改成他人 email；performance 確認位置定時改變的計時器在元件卸載時正確清除，不造成 memory leak。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [ ] 4.2 用 ego-browser skill 跑一次完整 e2e：operator 為一門課開啟浮水印並設為顯示 email → 學員播放該課程單元 → 確認畫面出現含其 email 的浮水印且位置會定時改變 → operator 關閉浮水印 → 確認學員再次播放時不再出現浮水印。驗證目標：截圖記錄關鍵畫面（開啟前/開啟後/關閉後），任何一步失敗即視為本 task 未完成
- [ ] 4.3 跑 `spectra analyze course-video-watermark --json` 與 `spectra validate course-video-watermark`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [ ] 4.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/course test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
