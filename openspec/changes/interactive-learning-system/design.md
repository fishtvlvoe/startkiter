# Design: 互動式學習模組 (Interactive Learning System)

---

## 1. 系統架構全景

```
                      ┌────────────────────────────────────────┐
                      │  Lesson Detail Data (packages/course)  │
                      │  - id, title, order                    │
                      │  - mediaUrl (Bunny / MP4)              │
                      │  - interactiveMdx?: string             │
                      └──────────────────┬─────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 [無 interactiveMdx]             [有 interactiveMdx]
                         │                               │
                         ▼                               ▼
               ┌───────────────────┐           ┌───────────────────┐
               │  經典影片播放器    │           │  互動式課堂播放器  │
               │ (Classic Player)  │           │ (Interactive View)│
               └───────────────────┘           └─────────┬─────────┘
                                                         │
                ┌────────────────────────────────────────┼────────────────────────────────────────┐
                ▼                                        ▼                                        ▼
      ┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
      │  Video Controller│                     │ MDX Block Engine │                     │ Progress Engine  │
      │  - timeupdate    │──(broadcast time)──▶│ - TimelineSync   │──(submit answer)───▶│ - completed     │
      │  - seekTo(time)  │◀──(click timecode)──│ - ConceptCompare │                     │   block IDs      │
      └──────────────────┘                     │ - MicroSandbox   │                     │ - % calculation  │
                                               │ - WorkflowSorter │                     └──────────────────┘
                                               │ - InstantQuiz    │
                                               │ - TeacherAvatar  │
                                               │ - DialogueWindow │
                                               └──────────────────┘
```

---

## 2. 7 大標準互動積木規範 (Standard Interactive Blocks)

所有互動積木均實作在 `packages/course/components/interactive/`，並在 MDX 渲染時作為自訂元件注入：

### 1. `<TimelineSync at="01:30" end="02:15">`
- **功能**：時間軸連動容器。當影片播放至 `at` 秒數時，此區塊自動加上平滑捲動 (`scrollIntoView`) 與外框光暈高亮。
- **Props**：
  - `at`: 起始時間（秒數或字串如 `"01:30"`）
  - `end`: 結束時間（可選）
  - `title`: 步驟標題

### 2. `<ConceptCompare tabs={[...]} />`
- **功能**：概念/時代/前後架構對照 Tab。
- **Props**：
  - `tabs`: Array of `{ title: string; description?: string; code?: string; visual?: string }`
  - `defaultIndex`: 預設選中索引

### 3. `<MicroSandbox template="tailwind" initialProps={...} />`
- **功能**：微型可調參數沙盒。學員調整輸入框、Slider 或下拉選單時，右側/下方即時響應渲染。
- **Props**：
  - `controls`: Array of `{ name: string; type: 'slider'|'select'|'text'; default: any; min?: number; max?: number }`
  - `renderPreview`: 內建模擬渲染器

### 4. `<WorkflowSorter items={[...]} correctOrder={[...]} explanation="..." />`
- **功能**：流程與步驟拖曳排序題（基於 HTML5 Drag&Drop 或 Framer Motion Reorder）。
- **Props**：
  - `items`: 待排序步驟陣列（自動打亂）
  - `correctOrder`: 正確順序 ID 陣列
  - `explanation`: 完成後顯示的流程詳解

### 5. `<InstantQuiz question="..." options={[...]} answerIndex={1} explanation="..." />`
- **功能**：隨堂診斷選擇題。點擊選項即時判定對錯、展開解析，並標記此 Block 完成。
- **Props**：
  - `question`: 題目文字
  - `options`: 選項字串陣列
  - `answerIndex`: 正確答案索引 (0-based)
  - `explanation`: 詳解說明

### 6. `<TeacherAvatar mood="explaining" caption="..." />`
- **功能**：互動式教師人像。以虛擬講師形象在關鍵時間點浮現，搭配表情/動作狀態與提示文字，引導學員注意當前重點。
- **Props**：
  - `mood`: 表情/動作狀態（如 `'explaining' | 'encouraging' | 'thinking'`）
  - `caption`: 隨人像顯示的引導文字
  - `at`: 出現的時間點（可選，串接時間軸）

### 7. `<DialogueWindow prompts={[...]} />`
- **功能**：動態對話視窗。以類聊天介面呈現一組預設問答或引導式對話，學員可點選提問選項推進學習節奏。
- **Props**：
  - `prompts`: Array of `{ question: string; response: string }`
  - `avatar`: 是否搭配 `TeacherAvatar` 同時顯示（可選）

---

## 3. 資料與型別擴充 (`packages/course/catalog.ts`)

```typescript
export type LessonDetail = LessonSummary & {
  description: string;
  mediaUrl: string;
  mediaKind: LessonMediaKind;
  isDemoFallback: boolean;
  
  // 擴充：互動內容
  interactiveMdx?: string;
  estimatedMinutes?: number;
  videoDurationSeconds?: number;
};
```

---

## 4. 前端播放器實作與時間軸同步架構

在 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/interactive-player.tsx`：

1. **State 共享**：
   - `currentTime`: 當前影片秒數（由 Video `onTimeUpdate` 廣播）
   - `activeBlockId`: 目前高亮聚焦的積木 ID
   - `completedBlocks`: 學員已完成互動的 Block ID Set
2. **連動模式**：
   - 影片前進 → 時間進入特定 Block 區間 → 該 Block 啟動 `glow-active` 樣式並平滑滾動。
   - 點擊 Block 的時間戳標籤 → 觸發影片 `videoRef.current.currentTime = targetTime`。

---

## 5. 測試策略 (Verification Plan)

1. **單元測試 (`packages/course/catalog.test.ts`)**：
   - 驗證含有 `interactiveMdx` 的單元能正常檢索。
   - 驗證傳統純影片單元在無 `interactiveMdx` 時輸出為 `undefined` 且不報錯。
2. **元件測試 (`packages/course/components/interactive/*.test.tsx`)**：
   - 測試 `InstantQuiz` 正確答案選擇、錯誤答案提示與詳解展示。
   - 測試 `ConceptCompare` Tab 切換。
   - 測試 `WorkflowSorter` 排序判定。
3. **頁面整合測試 / 行為驗證**：
   - 付費學員進入 `lesson-01`：可正常操作互動積木並播放影音。
   - 未付費訪客依然受限於 HTTP 403 權限閘門。
