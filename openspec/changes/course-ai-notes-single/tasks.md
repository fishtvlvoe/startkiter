## 1. 共用工具函式與紅燈測試

- [x] 1.1 [P] 撰寫 `srtToText` 紅燈測試，涵蓋去除序號行、時間軸行，只留字幕文字內容（對應 Requirement: Instructor can generate lesson notes from an uploaded subtitle file）。驗證：新測試檔執行為紅燈
- [x] 1.2 [P] 撰寫 `checkRateLimit` 紅燈測試，涵蓋 60 秒內第 1-10 次呼叫允許、第 11 次拒絕並回傳 retryAfterMs、視窗過期後重置（對應 Requirement: Generation calls are rate-limited per instructor；Decision: 速率限制用記憶體內計數器，每講師每分鐘上限，不落地資料庫）。驗證：新測試檔執行為紅燈
- [x] 1.3 [P] 撰寫 `readGeminiApiKey`／`writeGeminiApiKey` 紅燈測試，涵蓋寫入後 `SiteSetting.ciphertext` 不含明文 Key、讀取時能正確解密還原（對應 Requirement: Gemini API key is stored encrypted per the existing site-setting convention；Decision: Gemini API Key 比照既有 payuni 設定模式儲存，不新建加密機制）。驗證：新測試檔執行為紅燈

## 2. 核心邏輯實作

- [x] 2.1 [P] 實作 `packages/platform/src/course-ai-notes/srt-parser.ts` 的 `srtToText`，讓 1.1 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠
- [x] 2.2 [P] 實作 `packages/platform/src/course-ai-notes/rate-limiter.ts` 的 `checkRateLimit`，讓 1.2 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠
- [ ] 2.3 [P] 實作 `packages/api/modules/course/lib/gemini-settings.ts`，比照 `apps/saas/lib/site-settings.ts` 複用 `encryptSettingsJson`／`decryptSettingsJson`，讓 1.3 測試轉綠燈。驗證：`pnpm --filter api test` 全綠

## 3. 生成 API 與紅燈測試

- [ ] 3.1 撰寫 `POST /api/course/ai-notes/generate` 整合測試，涵蓋未設定 Key 回傳 400 `GEMINI_KEY_MISSING`、非講師呼叫回傳 403 且不消費 rate limit 額度、超過速率限制回傳 429 三種情境（對應 Requirement: Generation is blocked without a configured API key；Requirement: Non-manager cannot trigger generation；Requirement: Generation calls are rate-limited per instructor）。驗證：新測試檔執行為紅燈
- [ ] 3.2 實作 `apps/saas/app/api/course/ai-notes/generate/route.ts`（對應 Decision: v1 只支援字幕上傳生成，不支援無字幕直接分析影片，只接受 `srtContent` 輸入，不接受影片網址作為生成來源），呼叫既有 `canManageCourse` 做權限檢查、呼叫 2.1/2.2/2.3 的工具函式，串接 Gemini streamText（System Prompt 沿用舊系統 H1 分段+時間軸標記慣例），讓 3.1 測試轉綠燈。驗證：`pnpm --filter saas test` 全綠

## 4. 講師端設定與生成介面

- [ ] 4.1 [P] 在既有後台設定選單新增「Gemini API Key」設定頁（比照 einvoice／checkout-gateway 設定頁模式），呼叫 2.3 的函式讀寫。驗證：ego-browser 走一次「講師登入→設定頁面輸入 API Key→儲存成功→重新整理後顯示已設定狀態（不顯示明文 Key）」的完整畫面流程並截圖存證
- [ ] 4.2 [P] 建立 `apps/saas/modules/shared/components/AiNotesDialog.tsx`（對應 Decision: 生成內容是草稿，講師手動確認才寫入 Lesson.content，不自動覆蓋）：上傳 .srt 檔案、呼叫 3.2 的生成 API、串流即時顯示生成內容、可編輯內容與標題、「存檔」才寫入 `Lesson.content`、「取消」不影響既有內容（對應 Requirement: Generated content requires explicit instructor confirmation before it overwrites lesson content）。驗證：撰寫元件測試涵蓋「存檔寫入編輯後內容」「取消不變更內容」兩種情境並轉綠燈
- [ ] 4.3 在課程管理後台單元編輯區塊新增「AI 生成講義」按鈕，開啟 4.2 的對話框；未設定 API Key 時按鈕點擊顯示提示並連結到 4.1 的設定頁，不嘗試呼叫生成 API。驗證：ego-browser 走一次「未設定 Key 時點擊看到提示→設定完成後點擊能正常開啟對話框→上傳字幕檔看到串流生成→編輯後存檔→重新整理頁面確認內容真的存進去」的完整畫面流程並截圖存證

## 5. 整合驗證與交付

- [ ] 5.1 執行全域測試（`platform`／`api`／`saas` 三個 package 的 `pnpm test`）與 `pnpm type-check`，全部通過。驗證：附上實際跑出的通過筆數，不得只回報「測試通過」四字
- [ ] 5.2 由不同於本次實作的 CLI 或 agent 執行一次獨立 code review，檢查 Critical／High 發現數為 0；若有發現，送回修復後回到 5.1 重新驗證。驗證：code review 報告存為 `openspec/changes/course-ai-notes-single/code-review.md`
- [ ] 5.3 用真實測試帳號走一次端對端：設定 Gemini API Key、上傳測試字幕檔生成講義、編輯後存檔確認內容真的更新、連續呼叫超過速率限制確認第 11 次被拒絕。驗證：截圖與指令輸出存證，附在最終驗收報告中
