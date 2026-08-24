## 1. 紅燈測試（TDD）

- [x] 1.1 為 `packages/course/src/player/watermark-overlay.tsx` 寫紅燈測試，涵蓋 Requirement「Video playback overlays a per-viewer dynamic watermark when enabled」與「Masked email display mode does not reveal the full address」：enabled 時渲染含 email/課程標題的疊加層並定時改變位置；disabled 時不渲染；`MASKED` 模式輸出不含完整 email。驗證：先跑紅燈，因 `./watermark-overlay` 尚不存在而 FAIL；完成實作後同一測試檔 3 tests passed，最後 `pnpm --filter @startkiter/course test` 為 13 files／78 tests passed。

## 2. Database schema 與疊加層實作

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `CourseVideoWatermarkSetting` model（DDL 見 design.md），產生 migration；依 design.md Decision: 浮水印是前端播放器疊加層，不燒錄進影片檔案，實作 `watermark-overlay.tsx` 與修改 `FluentPlayer.tsx` 新增 `watermark` prop。驗證：`20260824200500_add_course_video_watermark_setting` 已由 Prisma migrate deploy 套用；package tests 13 files／78 tests passed。

## 3. Course Studio 設定區塊

- [x] 3.1 修改 `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`，新增浮水印設定區塊（開關、顯示內容、透明度、移動間隔）。驗證：ego-browser 實際操作 operator UI，設定目標課程 enabled=true／moveIntervalSec=1 後 API 回讀 `enabled:true`；學員頁實際顯示 email、課程標題、時間戳與動態位置。

## 4. Review 與驗證

- [x] 4.1 派 Codex 或等效工具對本次全部 diff（task 1-3）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `MASKED` 模式輸出不含完整 email、疊加層開關關閉後播放器不渲染任何浮水印元素；security 確認浮水印顯示的 email 是當前登入 viewer 自己的資料，不會被前端竄改成他人 email；performance 確認位置定時改變的計時器在元件卸載時正確清除，不造成 memory leak。驗證：CC 因用量耗盡無法派遣，改派 Codex 等效工具於 Orca 隔離 worktree 做 final5 CR；前幾輪 CR 的 2 High／2 Medium／2 P1 已逐項修正，final5 結論為無 correctness／security／maintainability regression，Critical 0、High 0、Medium 0、Low 0。
- [x] 4.2 用 ego-browser skill 跑一次完整 e2e：operator 為一門課開啟浮水印並設為顯示 email → 學員播放該課程單元 → 確認畫面出現含其 email 的浮水印且位置會定時改變 → operator 關閉浮水印 → 確認學員再次播放時不再出現浮水印。驗證：operator UI 儲存 enabled=true，API 回讀 true；學員頁 `overlayCount=1`、`controlsList=nofullscreen`，位置由 `68%,78%` 變成 `18%,18%`；關閉後 API 回讀 false，學員頁 `overlayCount=0`。截圖：`/tmp/startkiter-course-video-watermark-operator-enabled.png`、`/tmp/startkiter-course-video-watermark-enabled-final.png`、`/tmp/startkiter-course-video-watermark-disabled-final.png`，皆為 1904x851 PNG。
- [x] 4.3 跑 `spectra analyze course-video-watermark --json` 與 `spectra validate course-video-watermark`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證：四維均 Clean、finding_count 0；`✓ course-video-watermark — valid`。
- [x] 4.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/course test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證：course 13 files／78 tests passed；`TURBO_CONCURRENCY=1 pnpm test` 19/19 tasks successful；`pnpm type-check` 25/25 tasks successful；`pnpm build` 2/2 tasks successful，全部 exit code 0。
