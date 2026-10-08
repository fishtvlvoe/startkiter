## 1. 紅燈測試（先寫測試、先看它失敗）

- [ ] 1.1 新增 `admin/course/studio-quick-action.test.ts`，把 spec「Quick actions open creation dialogs」裡 Action resolution 表格的 6 列都寫成測試（對應 design「用網址參數 `?action=` 觸發課程頁的視窗」與「新增單元固定加到第一門課的最後一個章節」）；驗證：`pnpm vitest run studio-quick-action` 全部失敗，原因是找不到這個模組
- [ ] 1.2 在 `admin/dashboard/page.test.tsx` 加兩個斷言：快速操作依序是新增課程、新增單元、寫電子報、建立優惠券、查看前台，兩個 href 分別是 `/admin/course?action=new-course` 和 `/admin/course?action=new-lesson`；KPI 數字元素帶 `whitespace-nowrap` 與 `text-xl`（對應 spec「Overview numbers fit on one line on mobile」與 design「手機版縮小邊距與字級」）；驗證：`pnpm vitest run admin/dashboard` 新加的斷言失敗 [after: 1.1]
- [ ] 1.3 在 `admin/layout.test.ts` 加斷言：layout 用的是 `AdminLayoutHeader`、不再直接 render `PageHeader`；另外新增 `AdminLayoutHeader` 的測試，pathname 是 `/admin/dashboard` 時輸出空字串，是 `/admin/course/dashboard` 時輸出含「後台管理」（對應 spec「Single dashboard heading」與 design「用 client 元件依網址決定要不要顯示 admin 標題」）；驗證：`pnpm vitest run admin/layout` 新加的斷言失敗 [after: 1.2]

## 2. 實作

- [ ] 2.1 實作 `resolveStudioQuickAction(action, courses)`，輸出依 design Implementation Contract 的介面：`new-lesson` 選 courses[0] 裡 `order` 最大的章節；沒有章節回傳 error `請先新增章節，再新增單元`；沒有課程回傳 error `請先新增課程，再新增單元`；不認得的 action 回傳 none；驗證：1.1 的測試全綠 [after: 1.3]
- [ ] 2.2 課程頁 `loadStudio()` 載入課程後，用 `useSearchParams` 讀 `action`，呼叫 `resolveStudioQuickAction`，依結果打開 `showCreateCourseDialog`、或呼叫 `handleCreateLesson(chapterId)`、或呼叫 `showMessage("error", ...)`，最後 `router.replace("/admin/course")` 把參數清掉。新增單元視窗的 DialogDescription 寫成「加到「<課程名>／<章節名>」」；從章節旁按鈕開視窗時，同樣顯示該章節所屬的課程與章節名。這一項依賴 `loadStudio` 預設選 `courses[0]`，在程式註解寫明（呼應 spec「Quick actions open creation dialogs」）；驗證：`pnpm --filter saas typecheck` 0 錯誤、`pnpm --filter saas build` 通過（確認 `useSearchParams` 沒觸發「必須包 Suspense」的 build 錯誤，觸發就用 Suspense 包住課程頁內容），並在本機 dev server 開 `/admin/course?action=new-lesson`，截圖看到視窗已開、網址列沒有 action [after: 2.1]
- [ ] 2.3 控制台快速操作：補「新增單元」，改兩個 href；`<main>` 改成 `px-0 py-2 sm:p-6`；KPI 數字改成 `text-xl sm:text-2xl whitespace-nowrap`；驗證：1.2 的測試全綠 [after: 2.2]
- [ ] 2.4 新增 `AdminLayoutHeader`，admin layout 改用它，在 `/admin/dashboard` 隱藏「後台管理」標題；驗證：1.3 的測試全綠，`pnpm vitest run admin` 沒有新的失敗 [after: 2.3]

## 3. 審查與驗收

- [ ] 3.1 派一個和實作方不同的 CLI 做 code review，重點看 `router.replace` 會不會造成重複渲染、`useSearchParams` 有沒有包在 Suspense 裡；驗證：審查回報沒有 Critical
- [ ] 3.2 部署後用 ego-browser 檢查正式站：`/admin/dashboard` 在 1440px 和 390px 各截一張，390px 時 `scrollWidth === 390` 且 `NT$ 8,830` 只有一行；點「新增課程」「新增單元」各截一張視窗已開的圖；`/admin/course/dashboard` 仍然顯示「後台管理」。截圖存到 `~/Downloads/startkiter-dashboard-check/after-*.png`；驗證：截圖檔存在，且畫面符合 spec 的 5 個 Scenario [after: 3.1]
