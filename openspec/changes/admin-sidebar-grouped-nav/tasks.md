## 1. 紅燈測試

- [x] 1.1 依「Platform workspace resolves app root children」與「Expandable parent items」在 `packages/platform/src/workspace/navigation.test.ts`（或現有 navigation 測試檔）新增紅燈測試：平台工作區 `course-admin` 帶出含 `quiz` 的 children、`admin-system-settings` 帶出 5 個設定子項、學員 `/course` 不出現 app-admin 子項；`validateNavigationRegistry(toAppManifestEntries(MOUNT_POINTS))` 不 throw。驗證：`pnpm --filter @startkiter/platform test` 新測試失敗、既有測試仍綠。
- [x] 1.2 依「Default sections in fixed order」「Collapsible section headings」「Expandable parent items」在 `apps/saas/modules/shared/components/NavBar.test.tsx` 新增紅燈測試：五分區標題順序與項目、無「管理」標題、自建分組優先、點分區標題收合、點「課程」不換頁且出現 11 子項、`/admin/settings/einvoice` 自動展開；保留既有分組側邊欄回歸測試不改預期。驗證：新測試失敗、舊測試仍綠。
- [x] 1.3 依「Mobile overflow includes sub-items」在 `apps/saas/modules/shared/lib/nav-menu-items.test.ts` 新增紅燈測試：overflow 含 `/admin/email-settings` 與 `/admin/course/quiz`，固定 3 格斷言實際順序。驗證：新測試失敗。

## 2. Manifest 與導覽解析

- [x] 2.1 [after: 1.1] 依 Decision「子選單一律用既有 parentId 機制，不新增第二種巢狀方式」與「分區用 manifest 的 menu.section 欄位宣告」：`packages/platform/src/types.ts` 加 `section`、`selfLabelKey`；`mount-points.ts` 新增 `admin-system-settings`、5 個設定頁改標 `parentId: "admin-system-settings"` 並移除 `groupId: "admin-settings"`、課程子頁維持既有 `groupId`（registry 已轉成 parentId）、`course-dashboard` 移除 `groupId`、`course-admin` 加 `selfLabelKey: "course.list"`、頂層項目標 `section`（依 design Design Source 表）、`course-dashboard` 改顯示「控制台」並標 core。驗證：`pnpm --filter @startkiter/platform test` 中 registry 驗證與 mount-points 測試綠燈。
- [x] 2.2 [after: 2.1] 依 Decision「平台工作區帶出 App 根項目的子選單」修改 `resolveNavigation` platform 分支，並把 `section`、`selfLabelKey` 傳到 `NavigationItem` 與 `nav-menu-items.ts` 的 `MountMenuItem`。驗證：1.1 全部轉綠。
- [x] 2.3 [after: 2.1] 新增 i18n key（zh-tw、zh-cn、en）：`admin.menu.systemSettings`、`admin.menu.sections.*`（core/content/members/billing/system/other）、`course.list`，並把 course-dashboard 的顯示名改為「控制台」。驗證：`pnpm --filter @startkiter/platform test` 的 locale 完整性測試綠燈。

## 3. 側邊欄與手機

- [ ] 3.1 [after: 1.2, 2.2] 依 Decision「有子選單的項目改成展開按鈕，自己的頁面放成第一個子項」與「Default sections in fixed order」修改 `NavBar.tsx`：未分組的管理項目依 section 分區渲染、分區標題可收合、有子項的項目改為展開按鈕並在子頁時自動展開、展開狀態存 localStorage（try/catch）。動手前先 grep `NavBar.tsx` 所有讀 `subItems`、`requiresOperator`、`groupId` 的判斷式並列在 commit 說明。驗證：1.2 全部轉綠，既有 NavBar 測試全綠。
- [ ] 3.2 [after: 1.3, 2.2] 依 Decision「手機『更多』攤平子選單」修改 `getTabBarItems`。驗證：1.3 轉綠。

## 4. Review

- [ ] 4.1 [after: 3.1, 3.2] 由不同於實作方的審查者做 code review，聚焦：自建分組拖曳是否仍可用、學員端選單是否變動、localStorage 失效時是否正常、是否有死連結。驗證：無 Critical，修完重跑 `pnpm --filter @startkiter/platform test`、`pnpm --filter @startkiter/saas exec vitest run`、`pnpm --filter @startkiter/saas run type-check` 全綠。

## 5. 部署驗收

- [ ] 5.1 [after: 4.1] 合併、部署正式站後，ego-browser 桌面 1440 與手機 390：五分區、課程與系統設定子選單展開收合、`/admin/settings/einvoice` 自動展開、手機「更多」含 Email 設定、`/course` 學員選單不變；每個子選單連結點一次無 404/500。截圖存 `~/Downloads/sk-sidebar-*.png`。驗證：截圖與點擊紀錄。
