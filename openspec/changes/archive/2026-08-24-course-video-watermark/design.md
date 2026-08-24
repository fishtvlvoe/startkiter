## Context

`packages/course/src/player/FluentPlayer.tsx` 目前只接收 `title`／`resolved`（影片來源），沒有任何使用者資訊或浮水印相關 props。這次新增浮水印疊加層，是純前端播放器層的視覺疊加，不修改影片檔案本身、不需要伺服器端轉碼。

## Goals / Non-Goals

**Goals:**

- 播放器疊加動態浮水印（email／課程標題／時間戳），定時改變位置
- Operator 可依課程開關與調整浮水印設定

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: 浮水印是前端播放器疊加層，不燒錄進影片檔案

新增 `packages/course/src/player/watermark-overlay.tsx`，接收 `{ email, courseTitle, showEmail, showCourseTitle, showTimestamp, emailDisplayMode, opacityPercent, textSize, movementMode, moveIntervalSec }`，用 CSS 定位 + `setInterval` 定時改變疊加層位置，`FluentPlayer` 新增 `watermark` prop 傳入這個元件。

Alternatives Considered:
- 伺服器端轉碼時把浮水印燒錄進影片檔案 → 否決：每個學員看到的浮水印內容不同（含個人 email），若燒錄進檔案需要對每個學員產生一份獨立的轉碼版本，儲存與運算成本遠高於前端疊加；且 StartKiter 影片來源多樣（Bunny／YouTube／Vimeo／HLS），無法統一做伺服器端轉碼
- 用瀏覽器原生的全螢幕錄影偵測 API 主動阻擋 → 否決：這類 API 支援度不一致且容易被繞過，`tamperPauseEnabled` 這次只做基本的分頁失焦偵測，不宣稱能真正防止錄影，浮水印本身的嚇阻與追溯作用才是核心防線

## Implementation Contract

**Behavior:**
- Operator 為課程開啟浮水印並設定顯示內容
- 學員播放該課程影片時，畫面疊加顯示其 email（依 `emailDisplayMode` 決定完整或遮蔽顯示）與課程標題，位置每 `moveIntervalSec` 秒改變一次

**Interface / data shape:**
- `FluentPlayer` 新增 `watermark?: WatermarkOverlayProps` prop

**DB DDL:**
```sql
CREATE TABLE "course_video_watermark_setting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseId" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "showEmail" BOOLEAN NOT NULL DEFAULT true,
  "showCourseTitle" BOOLEAN NOT NULL DEFAULT true,
  "showTimestamp" BOOLEAN NOT NULL DEFAULT true,
  "emailDisplayMode" TEXT NOT NULL DEFAULT 'FULL' CHECK ("emailDisplayMode" IN ('FULL', 'MASKED')),
  "opacityPercent" INTEGER NOT NULL DEFAULT 18,
  "textSize" TEXT NOT NULL DEFAULT 'MD',
  "movementMode" TEXT NOT NULL DEFAULT 'STANDARD',
  "moveIntervalSec" INTEGER NOT NULL DEFAULT 12,
  "tamperPauseEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "course_video_watermark_setting_enabled_idx" ON "course_video_watermark_setting"("enabled");
```

**Failure modes:**
- 沒有設定記錄的課程 → 視為 `enabled: false`，播放器不顯示浮水印，行為跟現在一致

**Acceptance criteria:**
- `pnpm --filter @startkiter/course test watermark-overlay.test.tsx` 涵蓋位置定時改變邏輯、`emailDisplayMode` 遮蔽格式正確
- `pnpm type-check`／`pnpm build` 全綠

**Scope boundaries:**
- In scope：`CourseVideoWatermarkSetting` model；播放器疊加層；Course Studio 設定區塊
- Out of scope：伺服器端影片轉碼；主動螢幕錄影偵測技術

## Risks / Trade-offs

- [Risk] 前端疊加層理論上可被瀏覽器開發者工具移除後再錄影 → Mitigation: 這是所有前端浮水印方案的共同限制，主要作用是嚇阻一般使用者與提供事後追溯線索，不是絕對防線，記錄在案
