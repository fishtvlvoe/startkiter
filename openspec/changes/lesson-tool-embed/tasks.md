## 1. 資料庫與共用工具函式

- [x] 1.1 [P] 新增 Prisma `Lesson.toolUrl`／`Lesson.toolTitle` 可選欄位（對應 Decision: `toolUrl`／`toolTitle` 直接加在 Lesson model 上，不建獨立表）。驗證：`pnpm --filter database prisma validate` 通過，migration 檔存在
- [x] 1.2 [P] 撰寫 `isPrivateOrLocalUrl` 紅燈測試，涵蓋 `localhost`／`127.0.0.1`／`10.1.2.3`／`192.168.1.1`／`169.254.169.254` 回傳 true、一般公開網域回傳 false（對應 Requirement: Tool URL must not resolve to a private or local address）。驗證：新測試檔執行為紅燈
- [ ] 1.3 [P] 撰寫 `signLessonToolToken`／`verifyLessonToolToken` 紅燈測試，涵蓋正常簽發驗證通過、竄改 payload／lessonId 不符／userId 不符／超過 2 小時皆驗證失敗（對應 Requirement: Learner accesses the embedded tool through a short-lived signed token；Decision: 沿用既有 HMAC 簽章模式，不引入新的簽章函式庫）。驗證：新測試檔執行為紅燈

## 2. 核心邏輯實作

- [ ] 2.1 [P] 實作 `packages/platform/src/lesson-tool/url-safety.ts` 的 `isPrivateOrLocalUrl`，讓 1.2 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠
- [ ] 2.2 [P] 實作 `packages/platform/src/lesson-tool/token.ts` 的 `signLessonToolToken`／`verifyLessonToolToken`，沿用 `lesson-message-upload.ts` 的 HMAC 簽章慣例（`BETTER_AUTH_SECRET` + 版本前綴 + `timingSafeEqual`），讓 1.3 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠

## 3. 講師設定 API 與紅燈測試

- [ ] 3.1 撰寫 `PATCH /api/lesson-tool/config` 整合測試，涵蓋有管理權限的講師儲存成功、無管理權限的使用者收到 403 且 `Lesson.toolUrl` 未被寫入、網址命中內網黑名單回傳 400 `TOOL_URL_PRIVATE` 三種情境（對應 Requirement: Instructor can configure an embedded tool for a lesson；Requirement: Non-manager cannot configure a tool 相關情境）。驗證：新測試檔執行為紅燈
- [ ] 3.2 實作 `apps/saas/app/api/lesson-tool/config/route.ts`，呼叫既有 `canManageCourse` 做權限檢查、呼叫 2.1 的 `isPrivateOrLocalUrl` 做網址檢查，讓 3.1 測試轉綠燈。驗證：`pnpm --filter saas test` 全綠

## 4. 新分頁進入頁與存取重新驗證

- [ ] 4.1 撰寫 `/lesson-tool/[lessonId]/[encodedOrigin]` 頁面整合測試，涵蓋通行證有效且該使用者目前仍有課程存取權限時渲染 iframe、已無存取權限（例如已退款）時回傳 404、通行證過期或竄改時拒絕載入三種情境（對應 Requirement: New-tab entry page re-validates course access on every load）。驗證：新測試檔執行為紅燈
- [ ] 4.2 實作 `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx`（對應 Decision: 新分頁進入頁重新呼叫既有課程存取判斷，不快取存取結果），每次載入都重新呼叫既有課程存取判斷，呼叫 2.2 的 `verifyLessonToolToken` 驗證通行證，讓 4.1 測試轉綠燈。驗證：`pnpm --filter saas test` 全綠
- [ ] 4.3 在簽發通行證組裝代理路徑的當下，重新呼叫 2.1 的 `isPrivateOrLocalUrl` 檢查一次目前解析到的網址（對應 Decision: SSRF 防護在伺服器端組裝代理路徑時做網址檢查，不在瀏覽器端做；Requirement: Re-check happens at token issuance time, not only at save time）。驗證：對應紅燈測試（涵蓋於 3.1／4.1 測試集中已包含此情境）轉綠燈

## 5. 講師端後台與學員端顯示

- [ ] 5.1 [P] 在課程管理後台單元編輯區塊新增「內嵌工具（選填）」欄位（網址 + 標題輸入框），儲存時呼叫 3.2 的 API，網址被拒絕時顯示明確錯誤訊息，並在欄位旁顯示「這是外部工具，請確認來源可信」提示（對應 Requirement: Instructor can configure an embedded tool for a lesson）。驗證：ego-browser 走一次「講師登入→設定工具網址→儲存成功→改成內網網址儲存被拒絕看到錯誤訊息」的完整畫面流程並截圖存證
- [ ] 5.2 [P] 修改課程播放頁（`classroom-client.tsx` 或既有內容渲染區塊），有設定 `toolUrl` 的單元顯示 sandboxed iframe（`sandbox="allow-scripts allow-forms allow-popups allow-downloads"`）連同標題，並提供「在新分頁開啟」連結指向 4.2 的頁面；沒有設定 `toolUrl` 的單元不顯示任何工具區塊（對應 Requirement: Embedded tool renders in a sandboxed iframe alongside lesson content）。驗證：ego-browser 走一次「學員登入→看有設定工具的課看到 iframe→看沒設定的課沒有工具區塊→點新分頁開啟」的完整畫面流程並截圖存證

## 6. 整合驗證與交付

- [ ] 6.1 執行全域測試（`platform`／`api`／`saas` 三個 package 的 `pnpm test`）與 `pnpm type-check`，全部通過。驗證：附上實際跑出的通過筆數，不得只回報「測試通過」四字
- [ ] 6.2 由不同於本次實作的 CLI 或 agent 執行一次獨立 code review，檢查 Critical／High 發現數為 0；若有發現，送回修復後回到 6.1 重新驗證。驗證：code review 報告存為 `openspec/changes/lesson-tool-embed/code-review.md`
- [ ] 6.3 用真實測試帳號走一次端對端：講師設定工具網址並儲存、學員看課看到 iframe、開新分頁確認重新驗證、退款/移除購課紀錄後再次開啟連結確認回傳 404、故意設定內網網址確認被拒絕。驗證：截圖與指令輸出存證，附在最終驗收報告中
