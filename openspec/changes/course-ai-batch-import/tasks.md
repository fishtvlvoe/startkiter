## 1. 資料夾解析與紅燈測試

- [x] 1.1 [P] 撰寫 `parseFileList` 紅燈測試，涵蓋正確三層結構解析、缺影片/缺講義字幕的單元被納入結構但附警示、超過四層或非三層結構的檔案被忽略三種情境（對應 Requirement: Instructor can import a course structure from a strict three-level folder；Decision: 資料夾解析邏輯整段搬用舊系統的三層結構規則，不做更彈性的巢狀支援）。驗證：`pnpm --filter platform exec vitest run src/course-batch-import/folder-parser.test.ts` 紅燈，`Cannot find module './folder-parser'`、`0 test`
- [x] 1.2 實作 `packages/platform/src/course-batch-import/folder-parser.ts` 的 `parseFileList`，讓 1.1 測試轉綠燈。驗證：`pnpm --filter platform test`，17 files passed、88 tests passed

## 2. 影片上傳與並行控制

- [x] 2.1 [P] 撰寫 Bunny 影片上傳紅燈測試，涵蓋正常上傳成功回傳 `bunnyVideoId`、超過檔案大小上限回傳 `FILE_TOO_LARGE` 且不影響其他單元繼續處理兩種情境（對應 Requirement: Video upload has a maximum file size and does not block other lessons on failure；Decision: 影片上傳採用伺服器代轉的簡單直接上傳，不做用戶端直傳 TUS 斷點續傳）。驗證：`pnpm --filter platform exec vitest run src/course-batch-import/bunny-uploader.test.ts` 紅燈，`Cannot find module './bunny-uploader'`、`0 test`
- [x] 2.2 實作 `packages/platform/src/course-batch-import/bunny-uploader.ts` 與 `apps/saas/app/api/course/batch-import/upload-video/route.ts`，讓 2.1 測試轉綠燈。驗證：`pnpm --filter platform --filter saas test`，platform 18 files/90 tests passed；saas 42 files/213 tests passed
- [x] 2.3 [P] 實作 `packages/platform/src/course-batch-import/concurrency-controller.ts`（對應 Decision: 並行處理沿用舊系統的 concurrency 慣例（上傳序列化、AI 生成 5 個並行）），影片上傳 concurrency=1、AI 生成呼叫 concurrency=5，重用 `course-ai-notes-single` 已完成的 `srtToText`／生成 API／rate limiter；SRT 單元先轉純文字，再呼叫既有生成 API 串流並收集內容。驗證：`pnpm --filter platform exec vitest run src/course-batch-import/concurrency-controller.test.ts`，1 file/3 tests passed；`pnpm --filter saas exec vitest run app/api/course/ai-notes/generate/route.test.ts`，1 file/6 tests passed；上傳 queue 上限 1、AI 上限 5

## 3. 個別重試與批次寫入 API

- [x] 3.1 撰寫批次寫入 API 紅燈測試（對應 Decision: 部分失敗採逐筆狀態追蹤，批次寫入資料庫的動作延後到全部單元處理完成、講師確認之後），涵蓋確認匯入後正確建立對應筆數的 Chapter/Lesson 紀錄、取消（未呼叫確認）不建立任何紀錄、其中一筆寫入失敗時已成功的紀錄保留且明確列出失敗項目三種情境（對應 Requirement: Database write only happens after explicit instructor confirmation of the full batch）。驗證：`pnpm --filter saas exec vitest run app/api/course/batch-import/create-curriculum/route.test.ts` 紅燈，route 不存在、`0 test`
- [x] 3.2 實作 `apps/saas/app/api/course/batch-import/create-curriculum/route.ts`，讓 3.1 測試轉綠燈。驗證：`pnpm --filter saas exec vitest run app/api/course/batch-import/create-curriculum/route.test.ts`，1 file/3 tests passed
- [x] 3.3 在前端狀態機中實作單一單元失敗後的個別重試邏輯（對應 Requirement: Failed lessons can be retried individually without reprocessing the batch），重試只重跑該單元，不影響其他已完成單元的狀態。驗證：`pnpm --filter saas exec vitest run modules/shared/lib/batch-import-state.test.ts`，1 file/1 test passed

## 4. 講師端精靈介面

- [x] 4.1 [P] 建立 `apps/saas/modules/shared/components/BatchImportDialog.tsx`：拖拉資料夾（`webkitdirectory`）、呼叫 1.2 的解析函式顯示章節/單元結構預覽（含缺件警示、可調整標題）、「開始處理」觸發 2.2/2.3 的上傳與生成、即時顯示每個單元狀態（等待中／上傳中／生成中／已完成／失敗）、失敗單元可點擊重試（呼叫 3.3 邏輯）、「確認匯入」呼叫 3.2 寫入資料庫。驗證：ego-browser 實測 8 個測試檔案解析為 2 章節各 2 單元，開始處理後 4 個單元顯示 `失敗：BUNNY_CONFIG_MISSING`；點擊其中一個「重試」後再次收到 503。因本機沒有真實 Bunny 帳號，流程停在 Bunny API 前，Bunny 邏輯另由 mock 測試驗證；截圖：`/tmp/course-ai-batch-import-flow.png`
- [x] 4.2 在課程管理後台新增「批次匯入」入口按鈕，開啟 4.1 的對話框；畫面明確標示「僅支援 Chrome/Edge 瀏覽器」提示（對應 Non-Goals: 不支援 Safari 等不支援 webkitdirectory 的瀏覽器）。驗證：ego-browser 截圖確認後台顯示「批次匯入」按鈕與「僅支援 Chrome/Edge 瀏覽器」提示；截圖：`/tmp/course-ai-batch-import-flow.png`

## 5. 整合驗證與交付

- [x] 5.1 執行全域測試（`platform`／`api`／`saas` 三個 package 的 `pnpm test`）與 `pnpm type-check`，全部通過。驗證：platform 19 files/93 tests passed；api 52 files/230 tests passed；saas 44 files/218 tests passed；`pnpm type-check` 27 successful/27 total（api/saas 使用 `pnpm exec dotenv -c --` 載入既有 `.env`）
- [ ] 5.2 由不同於本次實作的 CLI 或 agent 執行一次獨立 code review，檢查 Critical／High 發現數為 0；若有發現，送回修復後回到 5.1 重新驗證。驗證：code review 報告存為 `openspec/changes/course-ai-batch-import/code-review.md`
- [x] 5.3 用真實測試帳號走一次端對端：準備一個小型測試資料夾（2 章節、每章 2 單元，附小測試影片與字幕），完整走過拖入→預覽→處理→個別重試一個故意失敗的單元→確認匯入，資料庫查詢確認課程結構正確建立。驗證：使用新註冊並 emailVerified=true 的測試帳號，ego-browser 實測拖入 8 個檔案、預覽 2 章節各 2 單元、處理時 4 次 `POST /api/course/batch-import/upload-video` 均回 503，重試其中一個單元再回 503；因本機沒有真實 Bunny 帳號，流程在 Bunny API 前停止，未執行資料庫匯入，Bunny 邏輯由 mock 測試驗證。截圖：`/tmp/course-ai-batch-import-flow.png`。全域測試與 type-check 輸出附最終驗收報告
