## 1. 紅燈測試

- [x] 1.1 依「Overview numbers」「Pending work counts」「Configuration check」「Recent orders」「Section failure isolation」新增 `packages/api/modules/admin/lib/platform-dashboard.test.ts`（mock `db` 與各設定讀取函式）：30 天視窗範例表算出 8830 與 2、刪除的留言不計、金流金鑰 `test_hash_key_9999` 不出現在序列化結果、6 筆訂單取最新 5 筆且排序正確、email 遮罩兩例、待處理查詢 throw 時該區塊 `unavailable` 其餘 `ok`。驗證：`pnpm --filter @startkiter/api test` 新測試失敗、既有測試仍綠。
- [x] 1.2 依「Platform admins keep the platform workspace on admin paths」在 `apps/saas/modules/shared/lib/nav-menu-items.test.ts` 新增紅燈測試覆蓋 Example 表 5 列；既有課程管理員案例預期不改。驗證：新測試失敗、舊測試仍綠。
- [x] 1.3 依「Expandable parent items」「Core section links to the platform dashboard」更新 `NavBar.test.tsx`：控制台 href 為 `/admin`、課程子選單 12 項含課程儀表板。驗證：新斷言失敗。

## 2. 資料彙整

- [x] 2.1 [after: 1.1] 依 Decision「控制台資料集中在一支彙整函式」「學員數與上架課程沿用 getCourseDashboardMetrics」「『未讀』『未回覆』沿用既有欄位」「設定檢查只回布林與顯示文字，不回憑證」實作 `packages/api/modules/admin/lib/platform-dashboard.ts` 的 `getPlatformDashboard`，型別照 design Interface。驗證：1.1 全部轉綠。

## 3. 選單與工作區

- [x] 3.1 [after: 1.2, 1.3] 依 Decision「控制台用新 mount entry，課程儀表板回課程子選單」修改 `mount-points.ts` 與三語 i18n（`admin.menu.dashboard`＝控制台；課程儀表板名稱改回「課程儀表板」），並更新 `docs/ux/startkiter-navigation-fixture.json`（用專案既有產生方式）。驗證：`pnpm --filter @startkiter/platform test` 綠燈、1.3 轉綠。
- [x] 3.2 [after: 3.1] 依 Decision「總管理員在 /admin/... 固定使用平台工作區」修改 `getMountNavigationContext`。驗證：1.2 轉綠，`pnpm --filter @startkiter/saas exec vitest run` 全綠。
- [x] 3.3 [after: 1.2] 依「Account menu does not duplicate sidebar entries」修改 `apps/saas/modules/shared/lib/account-menu.ts` 移除 `app-admin-settings` 項目，並把 `account-menu.test.ts`、`UserMenu.test.tsx` 的預期改成 spec Example 表 4 列（舊預期 → 新預期寫在 commit 說明）。驗證：`pnpm --filter @startkiter/saas exec vitest run modules/shared` 綠燈，`grep -rn "app-admin-settings" apps` 只剩測試中的「不存在」斷言。

## 4. 控制台頁面

- [x] 4.1 [after: 2.1, 3.1] 依「Dashboard page access」與 design Design Source 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/page.tsx`：伺服器端呼叫 `getPlatformDashboard`，5 區塊照設計稿版位，`unavailable` 顯示「暫時無法載入」，連結照 design Behavior，SVG 圖示、無 Emoji。補頁面測試：總管理員看到 5 區塊標題、某區塊 unavailable 時其他區塊仍在。驗證：`pnpm --filter @startkiter/saas exec vitest run`、`pnpm --filter @startkiter/saas run type-check`、正式 build 全綠。

## 5. Review

- [ ] 5.1 [after: 4.1, 3.2, 3.3] 由不同於實作方的審查者做 code review：憑證是否可能進入回傳資料或 log、非總管理員進 `/admin` 是否被擋、課程管理員選單是否不變、查詢是否都是 count/aggregate/take。驗證：無 Critical，修完重跑第 4 節指令全綠。

## 6. 部署驗收

- [ ] 6.1 [after: 5.1] 合併部署後，ego-browser 桌面 1440 與手機 390：`/admin` 五區塊、點待處理 4 列與設定檢查 5 列連結無 404/500、`/admin/course/quiz` 與 `/admin/course/dashboard` 左側仍是總管理員 5 分區選單、記錄 `/admin` 載入時間。截圖存 `~/Downloads/sk-dashboard-prod-*.png`。驗證：截圖與點擊紀錄。
