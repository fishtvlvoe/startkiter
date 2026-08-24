## Why

StartKiter 沒有防盜版浮水印機制，課程影片可以被直接錄影外流而無法追溯是誰外流的。woomin 的 `CourseVideoWatermarkSetting` 是生產驗證過的功能：在播放器上疊加動態浮水印（顯示學員 email／課程標題／時間戳，位置定時移動避免被裁切遮蔽，可設定不透明度），讓外流影片能追溯到源頭帳號，本身有嚇阻作用。

## What Changes

- 新增 `CourseVideoWatermarkSetting` model（`courseId` unique，`enabled`／`showEmail`／`showCourseTitle`／`showTimestamp`／`emailDisplayMode`／`opacityPercent`／`textSize`／`movementMode`／`moveIntervalSec`／`tamperPauseEnabled`）
- 修改 `packages/course/src/player/FluentPlayer.tsx`：新增 `watermark` prop（學員 email、課程標題、設定值），在播放器疊加層渲染動態浮水印，依 `moveIntervalSec` 定時改變顯示位置
- Operator 在課程設定頁可為個別課程開關浮水印並調整顯示內容/透明度

## Non-Goals

- 不做「偵測到螢幕錄影就自動停止播放」這類主動防錄影技術（`tamperPauseEnabled` 這次只做「偵測到分頁失焦/開發者工具開啟時暫停播放」這種基本防呆，不做更進階的螢幕錄影偵測，那需要作業系統層級 API 支援，超出網頁播放器能做的範圍）
- 不做浮水印的伺服器端影片轉碼疊加（燒錄進影片檔案本身），這次只做前端播放器層的疊加顯示，不修改影片檔案本身

## Capabilities

### Modified Capabilities

- `course-media-playback`：播放器新增浮水印疊加層

## Impact

- Affected specs: `course-media-playback`（修改）
- Affected code：
  - New:
    - `packages/course/src/player/watermark-overlay.tsx`
    - `packages/course/src/player/watermark-overlay.test.tsx`
    - `packages/database/prisma/migrations/`（新增 `CourseVideoWatermarkSetting` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/course/src/player/FluentPlayer.tsx`
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（Course Studio 課程設定頁新增浮水印設定區塊）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
