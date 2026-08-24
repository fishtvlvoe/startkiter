## Context

`LessonProgress` 只記錄完成/未完成二元狀態，`WatchTimeLog` 是平行的新表，記錄累計觀看秒數，不修改既有 `LessonProgress` 的判斷邏輯。

## Goals / Non-Goals

**Goals:**

- 記錄學員每個單元的累計觀看秒數
- 秒數只增不減（防止快退/重新載入造成數字倒退）

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: watchedSec 只取較大值更新，不是每次回報都覆蓋

`recordWatchTime(lessonId, watchedSec)` 在資料庫用條件式更新：`UPDATE ... SET watchedSec = GREATEST(watchedSec, $newValue) WHERE userId = $userId AND lessonId = $lessonId`（或先查詢比較後決定是否更新），確保回報的秒數不會因為使用者重新載入頁面或快退導致記錄的累計秒數變小。

Alternatives Considered:
- 每次回報直接覆蓋 `watchedSec` → 否決：使用者重新整理頁面後播放器從頭開始計時，若直接覆蓋會讓「這個學員看了多久」的記錄失真變小，取較大值才能正確反映「這個學員至少看過多少秒」

## Implementation Contract

**Behavior:**
- 播放器每 30 秒回報一次目前累計觀看秒數
- 記錄取歷史最大值，不因重新整理/快退而減少

**Interface / data shape:**
- `recordWatchTime(userId: string, lessonId: string, watchedSec: number): Promise<void>`

**DB DDL:**
```sql
CREATE TABLE "watch_time_log" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "lessonId" TEXT NOT NULL REFERENCES "lesson"("id") ON DELETE CASCADE,
  "watchedSec" INTEGER NOT NULL DEFAULT 0,
  "lastWatchAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "lessonId")
);
CREATE INDEX "watch_time_log_lessonId_idx" ON "watch_time_log"("lessonId");
```

**Failure modes:**
- 未登入使用者呼叫 `recordWatchTime` → 401，不記錄

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test record-watch-time.test.ts` 涵蓋較大值更新邏輯
- `pnpm type-check`／`pnpm build` 全綠

**Scope boundaries:**
- In scope：`WatchTimeLog` model；`recordWatchTime` procedure；播放器定期回報
- Out of scope：觀看熱力圖；異常偵測；`LessonProgress` 既有邏輯不修改

## Risks / Trade-offs

- [Risk] 播放器每 30 秒回報一次會增加 API 呼叫頻率 → Mitigation: 單次寫入量小，MVP 範圍內學員規模不會造成負擔
