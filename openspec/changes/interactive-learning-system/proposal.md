## Why

StartKiter 目前已具備基礎課程觀看與權限閘門（`packages/course`），但目前僅支援傳統單一影片播放模式。
現代高效學習不再僅靠長時間觀看被動影片，而是透過「短影音導讀 + 互動式學習積木流（時間軸對齊、概念對照、微沙盒參數調節、拖曳排序流程、隨堂即時反饋、互動式教師引導）」提供沉浸式學習體驗，這是業界已驗證有效的通用 UX 手法，非特定產品獨有。

本變更旨在為 StartKiter 官方教學平台建立自有的「MDX 驅動互動式學習模組」，並 100% 相容既有的權限閘門、Bunny 影音串流與純影片單元。

---

## What Changes

- **擴充 `packages/course`**：
  - 在 `LessonDetail` 擴充可選欄位 `interactiveContent?: string`（MDX 內容）或結構化 blocks 定義。
  - 新增 7 款核心互動積木元件庫（`TimelineSync`、`ConceptCompare`、`MicroSandbox`、`WorkflowSorter`、`InstantQuiz`、`TeacherAvatar`、`DialogueWindow`）。
  - 新增 MDX 渲染解析管道，將 MDX 標籤安全映射至互動積木元件。
- **升級 `apps/saas` 課程播放路由** (`apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`)：
  - 支援雙模式播放切換：無 MDX 內容時走「經典純影片模式」；有 MDX 時走「影音＋互動積木連動模式」。
  - 實作影音時間軸廣播（HTML5 video / Bunny Iframe API `timeupdate`）與互動區塊平滑滾動/高亮連動。
- **擴充進度追蹤模型**：
  - 記錄學員在單元內已完成的互動積木 ID（`completedBlockIds`），支援百分比與通關判定。
- **規格更新**：
  - 更新 `openspec/specs/course-module/spec.md` 納入互動單元播放與積木狀態契約。

---

## Non-Goals

- 不販售此互動代碼包給學員（這是 StartKiter 官方課程平台的自有學習體驗，非外售開站包範本）。
- 不手刻每堂課的 React 獨立頁面（嚴格採用 MDX 標籤宣告，與程式碼解耦，降低寫課工程成本）。
- 不破壞現有已落地之 `Order.courseAccess` 權限判斷與金流買斷閉環。
- 不引入第三方笨重 LMS 框架。

---

## Capabilities

### New Capabilities
- `interactive-learning-blocks`: 提供標準化 MDX 互動積木元件庫（時間軸對齊、概念比對、微型沙盒、拖曳排序、隨堂測驗、互動式教師人像、動態對話視窗）。
- `timecode-sync-playback`: 支援影片播放時間與畫面文字/積木之雙向或單向時間軸高亮連動。

### Modified Capabilities
- `course-module`: 擴充單元內容型態，支援純影片與 MDX 互動單元混合共存。

---

## Impact

- Affected specs: `course-module`
- Affected code:
  - `packages/course/`（新增 components/、mdx/、擴充 catalog.ts）
  - `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/`（升級互動播放 UI）
- Dependencies 新增: `next-mdx-remote` 或 `@mdx-js/react`（輕量 MDX 解析）、`lucide-react`（現有）、`framer-motion`（動畫輔助）
