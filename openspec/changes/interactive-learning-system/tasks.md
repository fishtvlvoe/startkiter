# Tasks: 互動式學習模組 (Interactive Learning System)

## 1. 互動積木元件庫 (Interactive Blocks Core)

- [ ] 1.1 在 `packages/course/components/interactive/` 實作 `InstantQuiz.tsx`（即時選擇題與解析）
- [ ] 1.2 在 `packages/course/components/interactive/` 實作 `ConceptCompare.tsx`（多 Tab / 前後代碼對照）
- [ ] 1.3 在 `packages/course/components/interactive/` 實作 `TimelineSync.tsx`（時間軸連動外框容器）
- [ ] 1.4 在 `packages/course/components/interactive/` 實作 `WorkflowSorter.tsx`（步驟拖曳排序）
- [ ] 1.5 在 `packages/course/components/interactive/` 實作 `MicroSandbox.tsx`（即時參數微沙盒）
- [ ] 1.6 在 `packages/course/components/interactive/` 實作 `TeacherAvatar.tsx`（互動式教師人像）
- [ ] 1.7 在 `packages/course/components/interactive/` 實作 `DialogueWindow.tsx`（動態對話視窗）
- [ ] 1.8 撰寫互動積木單元測試 (`packages/course/components/interactive/*.test.tsx`)

## 2. 課程目錄與 MDX 引擎擴充 (Catalog & MDX Engine)

- [ ] 2.1 擴充 `packages/course/catalog.ts` 型別定義：新增 `interactiveMdx`、`estimatedMinutes`、`videoDurationSeconds`
- [ ] 2.2 在 `packages/course/catalog.ts` 建立 `lesson-01` 之互動式 MDX 種子資料範例
- [ ] 2.3 在 `packages/course/mdx/` 建立 MDX 渲染器與安全元件對應表 (`mdx-components.tsx`)
- [ ] 2.4 擴充 `packages/course/catalog.test.ts` 驗證互動單元與純影片單元相容性

## 3. 站內互動播放介面整合 (Interactive Lesson Player UI)

- [ ] 3.1 在 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/` 實作 `InteractivePlayer` 雙欄/響應式佈局
- [ ] 3.2 實作影音時間軸監聽與 `TimelineSync` 滾動連動邏輯 (`useTimeSync` hook)
- [ ] 3.3 實作雙模式分支：無 MDX 單元走經典視圖，有 MDX 單元走互動視圖
- [ ] 3.4 實作單元內積木完成進度追蹤與百分比展示

## 4. 驗證與行為測試 (Verification & Polish)

- [ ] 4.1 執行 `pnpm test` 確認 `packages/course` 所有單元測試 PASS
- [ ] 4.2 驗證付費學員進入 `lesson-01` 體驗完整互動積木流與影音連動
- [ ] 4.3 驗證未付費學員 403 阻擋機制未退化
