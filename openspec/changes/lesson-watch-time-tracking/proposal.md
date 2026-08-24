## Why

StartKiter 既有 `LessonProgress` 只記錄「完成/未完成」的二元狀態，沒有記錄學員實際觀看了多久，operator 無法知道學員是不是快速拖到結尾點擊完成、還是真的看完內容。woomin 的 `WatchTimeLog` 補上這個缺口，是課程內容有效性分析的基礎資料。

## What Changes

- 新增 `WatchTimeLog` model（`userId`／`lessonId`／`watchedSec`／`lastWatchAt`，`@@unique([userId, lessonId])`，累計觀看秒數）
- 新增 `recordWatchTime` procedure（`protectedProcedure`），播放器定期（例如每 30 秒）呼叫回報目前累計觀看秒數，取較大值更新（避免快退造成秒數倒退）
- Operator 後台課程分析頁新增「平均觀看時長 / 完成率對照」的簡單摘要查詢

## Non-Goals

- 不做即時觀看熱力圖（哪個時間點被重複觀看/跳過），只記錄累計總秒數
- 不做觀看時長異常偵測（例如短時間內回報大量秒數視為作弊）
- 不修改 `LessonProgress` 既有的完成判斷邏輯，兩者是平行的獨立資料

## Capabilities

### New Capabilities

- `lesson-watch-time-tracking`：學員觀看時長累計記錄

## Impact

- Affected specs: `lesson-watch-time-tracking`（新增）
- Affected code：
  - New:
    - `packages/api/modules/course/procedures/record-watch-time.ts`
    - `packages/api/modules/course/procedures/record-watch-time.test.ts`
    - `packages/database/prisma/migrations/`（新增 `WatchTimeLog` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/api/modules/course/router.ts`（新增 `recordWatchTime` procedure）
    - `packages/course/src/player/FluentPlayer.tsx`（定期回報觀看秒數）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
