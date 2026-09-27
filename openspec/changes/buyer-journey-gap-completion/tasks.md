## 1. 資料庫欄位與紅燈測試

- [ ] 1.1 [P] 讓「Course admin can set the course's LINE invite URL」在送出非 https 的 `lineInviteUrl` 時，課程更新動作拒絕寫入；先建立 `apps/saas/app/api/course/studio/route.ts` 的 validation test（紅燈：目前欄位不存在、動作也不驗證格式）。
- [ ] 1.2 為「LINE 學習群連結是 `Course` 資料表的欄位，不是全站環境變數；存檔沿用既有課程更新路徑」新增 Prisma migration：`Course` model 新增 `lineInviteUrl String?`；完成後 `pnpm --filter @startkiter/database prisma migrate dev` 產生的 migration 檔存在，既有 `Course` row 的該欄位為 null，既有課程相關測試套件重跑不受影響。

## 2. 課程首頁與教室、官網同步課綱

- [ ] 2.1 [P] 讓「Course landing page shares the published catalog source」在 `/course` 仍呼叫 `listLessons()` 時失敗；先建立元件測試斷言 `/course` 呼叫的資料來源函式跟 `/course/{lessonId}` 教室相同，且不匯入 `listLessons`（紅燈：目前確實呼叫 `listLessons`）。
- [ ] 2.2 依「課程首頁改用課程套件的已發布課綱，取代 listLessons() 固定清單」與「Course landing page shares the published catalog source」修改 `apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`，改用 `packages/course` 對外提供的已發布課程/章節/單元 reader；完成後 `/course` 顯示的單元標題、順序、連結 id 與教室、官網三處一致，並以 2.1 測試驗證。
- [ ] 2.3 依「No published content renders an empty state, not stale fixtures」，讓課程無已發布章節時 `/course` 顯示空狀態文案；完成後以元件測試驗證空資料情境不再退回靜態示範清單。

## 3. 課程管理員預覽學員教室（照設計稿的預覽模式，2026-09-27 Fish 裁決）

- [ ] 3.1 [P] 讓「A course admin can preview the real learner surface from the admin workspace, with a single return entry」在 `/course/preview` 渲染出選單、或 `app-user` 角色直接打這個網址沒被擋下時失敗；先建立 route guard 與 layout 的測試，涵蓋「`app-admin` 開啟看到無選單+單一返回鈕」「`app-user` 直接打網址被拒絕」兩種 fixture（紅燈：目前這個 route 不存在）。
- [ ] 3.2 依「課程管理員用獨立的「預覽學員教室」模式看學員畫面，照 docs/ux/startkiter-navigation-focus.html 原始設計稿，不在 /course 選單裡加入口」新增 `/course/preview` route（`apps/saas/app/(authenticated)/(main)/(account)/course/preview/page.tsx`），套用既有 `app-admin` route guard，內容呼叫跟 `/course` 相同的已發布課程 reader（沿用 2.2 的資料來源函式），layout 不掛任何選單、只渲染一顆連往 `/admin/course` 的「返回課程管理員」按鈕；完成後以 3.1 測試驗證。
- [ ] 3.3 在 `/admin/course` 工作室新增「預覽學員教室」按鈕，`href` 指向 `/course/preview`；完成後以元件測試驗證按鈕存在且連結正確，並確認真實學員使用的 `/course` 選單維持既有五項、沒有因這次改動新增任何項目或分支。

## 4. 領取代碼包入口

- [ ] 4.1 [P] 讓「The claim entry point is visible where the buyer needs it, not only reachable via a direct API call」在 `kitClaimEligible` true/false 兩種 fixture 下沒有對應渲染結果時失敗；先建立結帳頁與課程頁的元件測試（紅燈：目前兩頁都沒有 claim 控制項）。
- [ ] 4.2 依「領代碼按鈕是條件式渲染的 UI 元件，接上既有 API，不新增後端邏輯」在結帳頁（`apps/saas/app/(authenticated)/checkout/checkout-button.tsx` 所在頁面）新增「領取代碼包」按鈕，符合資格時渲染並呼叫既有 `POST /api/github/claim`；完成後以 4.1 測試驗證資格 true 情境渲染可點擊按鈕、資格 false 情境不渲染。
- [ ] 4.3 在課程頁（`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`）新增同一顆「領取代碼包」按鈕，共用 4.2 的資格判斷邏輯；完成後以 4.1 測試涵蓋課程頁兩種情境。

## 5. LINE 學習群連結：後台存檔與畫面顯示

- [ ] 5.1 [P] 讓「Paid learners see a LINE community join control」在該課程 `lineInviteUrl` 為 https 但使用者未購買、或已購買但欄位為空/非 https 時，畫面不得出現連結；先建立課程頁的元件測試，涵蓋「已購買+https」「已購買+空值」「已購買+非https」「未購買+https」四種 fixture（紅燈：目前頁面完全沒有這個區塊）。
- [ ] 5.2 依「LINE 學習群連結是 `Course` 資料表的欄位，不是全站環境變數；存檔沿用既有課程更新路徑」修改課程頁，讀取該課程的 `lineInviteUrl`，在已購買且值為非空 https 網址時渲染可點擊的「加入 LINE 學習群」連結；完成後以 5.1 測試驗證四種情境全數符合預期。
- [ ] 5.3 依「Course admin can set the course's LINE invite URL」修改 `apps/saas/app/api/course/studio/route.ts` 課程更新動作的 payload，新增 `lineInviteUrl` 欄位並套用 https 格式驗證，非法值拒絕寫入、空字串允許清空；完成後以 1.1 測試驗證，並確認既有 `title`／`description`／`status` 欄位更新行為不受影響。
- [ ] 5.4 在課程工作室（Course Studio）課程設定畫面新增 `lineInviteUrl` 輸入框，串接 5.3 的更新動作；完成後以元件測試驗證輸入非 https 值時畫面顯示驗證錯誤、不送出成功狀態。

## 6. Review、風險與交付

- [ ] 6.1 依「Scope boundaries」檢查 diff 只涉及課程首頁資料來源、學員側選單入口、領代碼按鈕、`Course.lineInviteUrl` 欄位與其存讀顯示，不觸碰優惠券、報表下載、站內通知、GitHub 私倉驗證、正式站回滾；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [ ] 6.2 依「Risks / Trade-offs」逐項確認課程首頁空清單、選單越權、claim 重複點擊、`lineInviteUrl` migration 四項風險的 mitigation 都已落實；完成後以 code review checklist 記錄證據。
- [ ] 6.3 完成 self-review、`spectra analyze buyer-journey-gap-completion` 與 `spectra validate buyer-journey-gap-completion`；完成後 analyzer 無未處理 Critical/Warning、validation exit 0。
- [ ] 6.4 部署後以 ego-browser 分別用已購買測試帳號與純學員測試帳號各走一次 `/course`、結帳頁、`/admin/course`；完成後對照 `docs/2026-09-24-畫面落差與上架路徑.md` 逐項確認落差已補上，保留截圖證據。
