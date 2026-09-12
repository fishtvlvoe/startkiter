## 1. 現有行為基準測試（先確認不會迴歸）

- [x] 1.1 確認 packages/api/modules/course 現有測試涵蓋 getLessonDetail 的三種情境（免費試看可看、付費且有權限可看、無權限被擋），交付：列出現有測試檔案與對應測試案例名稱清單。驗證：`pnpm --filter api test -- course` 全數通過，且清單裡確實涵蓋這三種情境；缺少的情境要先補上對應測試（仍是現有行為，不是新行為）再繼續下一步。

  清單（`packages/api/modules/course/course.test.ts`，`pnpm --filter api test -- course`：61 files / 292 tests passed）：
  - 免費試看可看：`allows an unauthenticated request for a free-preview lesson without bundle lookup`
  - 付費且有權限可看：`returns full lesson content for a course included in the buyer's bundle`
  - 無權限被擋：`rejects a paid lesson outside the buyer's bundle`（另有未登入擋：`rejects an unauthenticated request for a non-preview lesson`）

## 2. 每個 request 只做一次 courseId 存取判斷（讓 lesson 存取判斷共用 page 層級已驗證的 session）

- [x] 2.1 為「同一個 request 內對多堂課呼叫時，courseId 存取判斷只執行一次」寫紅燈測試：在 apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx 對應的測試裡（或新建測試檔），用 mock/spy 包住 userCanAccessCourseId（或其呼叫路徑），斷言對同一個 courseId 的呼叫次數等於 1，交付：測試檔案存在且執行後為紅燈（目前實作對每堂課各呼叫一次，堂課數 >1 時斷言失敗）。驗證：跑該測試觀察到失敗訊息顯示呼叫次數大於 1。
- [x] 2.2 修改 apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx：在課綱迴圈開始前，用已知的 courseId 呼叫一次 userCanAccessCourseId 取得布林結果，交付：Decision「每個 request 只做一次 courseId 存取權限判斷」成立。驗證：2.1 的紅燈測試轉綠燈。
- [x] 2.3 修改 packages/api/orpc/procedures.ts 的 publicProcedureWithSession（或新增變體），支援接收呼叫端已驗證的 user/session，跳過內部重新呼叫 auth.api.getSession；未傳入時維持現有行為，交付：Decision「讓 lesson 存取判斷共用 page 層級已驗證的 session」成立，且這個 procedure 被其他呼叫端使用時的既有行為不變（安全性不因此改變）。驗證：新增測試確認「呼叫端傳入已驗證 user 時不重新查 session」與「呼叫端未傳入時維持原本重新查 session」兩種情境都符合預期；既有的 publicProcedureWithSession 相關測試維持通過。
- [x] 2.4 修改 apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx 呼叫 getLessonDetail 時傳入 2.2 已經判斷過的 courseId 存取結果，讓 getLessonDetail 內部不再對每堂課重新查一次 userCanAccessCourseId，交付：Implementation Contract 裡「未登入或無權限的使用者依然被正確擋下」的行為成立，同時重複查詢次數降低。驗證：1.1 確認過的三種既有測試情境（免費試看、付費有權限、無權限）全部維持通過；2.1 的呼叫次數斷言測試維持綠燈。

## 3. 課程內容與翻譯的 server 端快取

- [x] 3.1 查現有 apps/saas 或 packages/api 程式碼裡是否已有快取機制慣例（例如 unstable_cache 或既有的 in-memory cache 用法），交付：簡短筆記記錄要沿用哪種機制與理由，若專案已有課程內容修改時的失效觸發點也一併記錄。驗證：筆記裡的結論有具體程式碼位置佐證（檔案路徑 + 用法範例），不是憑空猜測。
  筆記：`openspec/changes/course-page-ssr-fanout-optimization/cache-convention-notes.md`（結論：無跨 request TTL 先例 → in-memory Map + 5 分鐘 TTL；`updateLesson` 成功後主動 invalidate）
- [x] 3.2 為「已發布課程內容查詢有快取，短時間內重複查詢不會重新打資料庫」寫紅燈測試，交付：測試檔案存在且執行後為紅燈。驗證：跑該測試觀察到失敗（目前每次查詢都真的打資料庫）。
- [x] 3.3 [after: 3.1] 依 3.1 筆記選定的機制，對已發布課程、章節、單元內容與翻譯資料查詢加上快取，TTL 依 3.1 查到的現有慣例決定，若無先例則用 5 分鐘，交付：Decision「對已發布課程內容與翻譯資料加上有明確失效時機的 server 端快取」成立。驗證：3.2 的紅燈測試轉綠燈。
- [x] 3.4 驗證管理員編輯課程內容後，前台在快取 TTL 到期後能看到最新內容（不是永久卡住舊內容），交付：Implementation Contract 裡快取失效行為成立。驗證：寫一個測試或手動驗證步驟，模擬「編輯課程內容 → 快取 TTL 到期前查詢看到舊內容 → TTL 到期後查詢看到新內容」的完整流程，記錄驗證方式與結果。
  驗證：`published-content-cache.test.ts` 的 `serves stale content until TTL expires...` + `refetches published lesson content after the TTL expires`；另外 `updateLesson` 成功路徑會呼叫 `invalidatePublishedContentCache`（見 `update-lesson.test.ts`）。

## 4. Review

- [ ] 4.1 Review：另一個 CLI（非實作 2-3 的那個）針對本次改動做獨立 code review，聚焦安全性（存取判斷有沒有因為避免重複查詢而意外繞過權限檢查）與快取失效邏輯正確性，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆到 PM。
- [ ] 4.2 全部確認沒問題後，跑一次完整測試套件（pnpm --filter saas test 與 pnpm --filter api test）確認沒有破壞其他功能，交付：測試全數通過。驗證：測試輸出顯示 0 failed。

## 5. 部署與壓力測試驗證

- [ ] 5.1 commit 並 push 到 origin/main，觸發 Coolify 部署，交付：新版本真正上線運行。驗證：SSH 確認正式站容器運行的 image tag 與 git HEAD commit 一致（不能只看 git log 或部署 API 回應，上一輪 SR 曾經卡在 build 失敗或容器沒切換而誤判已上線）。
- [ ] 5.2 [after: 5.1] 重跑一次 50 人買家流程壓力測試（新的測試帳號前綴），交付：Success Criteria 裡「course 頁面 p95 反應時間目標降到 3 秒以內」成立，或如果沒達到目標要明講實際數字與可能原因。驗證：新的壓測報告數據對比這次 SR 的 baseline（p50=5522ms/p95=6472ms，lesson 頁 p50=7258ms/p95=7529ms），列出改善幅度；測試資料清理清單附上供事後清理。
