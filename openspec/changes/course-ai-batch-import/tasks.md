## 1. 資料夾解析與紅燈測試

- [x] 1.1 [P] 撰寫 `parseFileList` 紅燈測試，涵蓋正確三層結構解析、缺影片/缺講義字幕的單元被納入結構但附警示、超過四層或非三層結構的檔案被忽略三種情境（對應 Requirement: Instructor can import a course structure from a strict three-level folder；Decision: 資料夾解析邏輯整段搬用舊系統的三層結構規則，不做更彈性的巢狀支援）。驗證：`pnpm --filter platform exec vitest run src/course-batch-import/folder-parser.test.ts` 紅燈，`Cannot find module './folder-parser'`、`0 test`
- [ ] 1.2 實作 `packages/platform/src/course-batch-import/folder-parser.ts` 的 `parseFileList`，讓 1.1 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠

## 2. 影片上傳與並行控制

- [ ] 2.1 [P] 撰寫 Bunny 影片上傳紅燈測試，涵蓋正常上傳成功回傳 `bunnyVideoId`、超過檔案大小上限回傳 `FILE_TOO_LARGE` 且不影響其他單元繼續處理兩種情境（對應 Requirement: Video upload has a maximum file size and does not block other lessons on failure；Decision: 影片上傳採用伺服器代轉的簡單直接上傳，不做用戶端直傳 TUS 斷點續傳）。驗證：新測試檔執行為紅燈
- [ ] 2.2 實作 `packages/platform/src/course-batch-import/bunny-uploader.ts` 與 `apps/saas/app/api/course/batch-import/upload-video/route.ts`，讓 2.1 測試轉綠燈。驗證：`pnpm --filter platform --filter saas test` 全綠
- [ ] 2.3 [P] 實作 `packages/platform/src/course-batch-import/concurrency-controller.ts`（對應 Decision: 並行處理沿用舊系統的 concurrency 慣例（上傳序列化、AI 生成 5 個並行）），影片上傳 concurrency=1、AI 生成呼叫 concurrency=5，重用 `course-ai-notes-single` 已完成的 `srtToText`／生成 API／rate limiter。驗證：撰寫單元測試確認 concurrency 上限確實生效（同時送入 10 個任務，任一時刻執行中的上傳任務數不超過 1）並轉綠燈

## 3. 個別重試與批次寫入 API

- [ ] 3.1 撰寫批次寫入 API 紅燈測試（對應 Decision: 部分失敗採逐筆狀態追蹤，批次寫入資料庫的動作延後到全部單元處理完成、講師確認之後），涵蓋確認匯入後正確建立對應筆數的 Chapter/Lesson 紀錄、取消（未呼叫確認）不建立任何紀錄、其中一筆寫入失敗時已成功的紀錄保留且明確列出失敗項目三種情境（對應 Requirement: Database write only happens after explicit instructor confirmation of the full batch）。驗證：新測試檔執行為紅燈
- [ ] 3.2 實作 `apps/saas/app/api/course/batch-import/create-curriculum/route.ts`，讓 3.1 測試轉綠燈。驗證：`pnpm --filter saas test` 全綠
- [ ] 3.3 在前端狀態機中實作單一單元失敗後的個別重試邏輯（對應 Requirement: Failed lessons can be retried individually without reprocessing the batch），重試只重跑該單元，不影響其他已完成單元的狀態。驗證：撰寫前端邏輯測試涵蓋「重試一個失敗單元時其他已完成單元狀態不變」並轉綠燈

## 4. 講師端精靈介面

- [ ] 4.1 [P] 建立 `apps/saas/modules/shared/components/BatchImportDialog.tsx`：拖拉資料夾（`webkitdirectory`）、呼叫 1.2 的解析函式顯示章節/單元結構預覽（含缺件警示、可調整標題）、「開始處理」觸發 2.2/2.3 的上傳與生成、即時顯示每個單元狀態（等待中／上傳中／生成中／已完成／失敗）、失敗單元可點擊重試（呼叫 3.3 邏輯）、「確認匯入」呼叫 3.2 寫入資料庫。驗證：ego-browser 走一次「拖入測試資料夾（2 章節各 2 單元）→ 看到結構預覽 → 開始處理看到即時狀態 → 全部完成後確認匯入 → 資料庫確認章節/單元正確建立」的完整畫面流程並截圖存證
- [ ] 4.2 在課程管理後台新增「批次匯入」入口按鈕，開啟 4.1 的對話框；畫面明確標示「僅支援 Chrome/Edge 瀏覽器」提示（對應 Non-Goals: 不支援 Safari 等不支援 webkitdirectory 的瀏覽器）。驗證：ego-browser 截圖確認提示文字存在

## 5. 整合驗證與交付

- [ ] 5.1 執行全域測試（`platform`／`api`／`saas` 三個 package 的 `pnpm test`）與 `pnpm type-check`，全部通過。驗證：附上實際跑出的通過筆數，不得只回報「測試通過」四字
- [ ] 5.2 由不同於本次實作的 CLI 或 agent 執行一次獨立 code review，檢查 Critical／High 發現數為 0；若有發現，送回修復後回到 5.1 重新驗證。驗證：code review 報告存為 `openspec/changes/course-ai-batch-import/code-review.md`
- [ ] 5.3 用真實測試帳號走一次端對端：準備一個小型測試資料夾（2 章節、每章 2 單元，附小測試影片與字幕），完整走過拖入→預覽→處理→個別重試一個故意失敗的單元→確認匯入，資料庫查詢確認課程結構正確建立。驗證：截圖與指令輸出存證，附在最終驗收報告中
