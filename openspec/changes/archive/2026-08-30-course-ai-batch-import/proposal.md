## Why

即使有了單堂課補生成講義的功能（`course-ai-notes-single`），講師要新增一整門課（多章節多單元）還是得一個單元一個單元手動建立、手動貼影片、手動觸發 AI 生成，非常耗時。參考舊系統 `realms-course-platform` 已驗證過的做法：講師拖拉一個照「課程/章節/單元」三層結構整理好的資料夾進來，系統自動解析結構、批次上傳影片、批次生成講義，一次建好整門課的骨架。本張 change 依賴 `course-ai-notes-single` 已完成的字幕解析與 AI 生成邏輯，是疊加批次處理與資料夾解析這層複雜度，不是重新設計生成邏輯本身。

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `course-ai-batch-import`: 講師拖拉三層結構資料夾（課程/章節/單元，單元資料夾內含影片 + 字幕或講義檔），系統自動解析、批次上傳影片至 Bunny、批次呼叫 AI 生成講義（沿用 `course-ai-notes-single` 的生成邏輯）、批次寫入資料庫建立課程骨架，涵蓋並行處理與部分失敗個別重試

## Modified Capabilities

（無：本次重用 `course-ai-notes-single` 既有的生成邏輯與函式，不變更其需求行為）

## Impact

- Affected specs: New: `course-ai-batch-import`
- Affected code:
  - New:
    - `packages/platform/src/course-batch-import/folder-parser.ts`（資料夾三層結構解析）
    - `packages/platform/src/course-batch-import/concurrency-controller.ts`（並行處理控制器）
    - `packages/platform/src/course-batch-import/bunny-uploader.ts`（影片上傳至 Bunny，伺服器端代轉）
    - `apps/saas/app/api/course/batch-import/upload-video/route.ts`（單支影片上傳端點）
    - `apps/saas/app/api/course/batch-import/create-curriculum/route.ts`（批次寫入章節/單元）
    - `apps/saas/modules/shared/components/BatchImportDialog.tsx`（拖拉資料夾、預覽結構、處理進度、逐筆確認的精靈介面）
  - Modified:
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（新增「批次匯入」入口按鈕）
  - Removed: 無
