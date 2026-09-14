## 1. 紅燈測試：證明 6 個頁面目前不會出現在導覽選單

- [x] 1.1 在 `apps/saas/modules/shared/lib/nav-menu-items.test.ts` 為「isOperator=true 時，getMountMenuItems 回傳結果應包含 organizations/orders/revenue/checkout-gateway/einvoice/gemini 對應的項目」寫紅燈測試：斷言回傳陣列（含群組展開後的 subItems）裡能找到 href 為 `/admin/organizations`、`/admin/orders`、`/admin/revenue`、`/admin/settings/checkout-gateway`、`/admin/settings/einvoice`、`/admin/settings/gemini` 的項目，交付：測試檔案存在且執行後為紅燈（目前 MOUNT_POINTS 沒有這些條目）。驗證：跑該測試觀察到失敗，失敗原因是找不到對應 href 的項目。
- [x] 1.2 為「checkout-gateway/einvoice/gemini 三個項目應該收合成一個 admin-settings 群組」寫紅燈測試：斷言 `getMountMenuItems({ isOperator: true, ... })` 回傳結果裡有一個 id 為 `admin-settings-menu` 的頂層項目，其 `subItems` 剛好包含這三個子項目，交付：測試檔案存在且執行後為紅燈。驗證：跑該測試觀察到失敗。

## 2. 實作：MOUNT_POINTS 新增 6 個條目

- [x] 2.1 [after: 1.1] 修改 `packages/platform/src/mount-points.ts`：新增 `organizations`、`orders`、`revenue` 三個 `PluginManifest` 條目，各自 `mount.route.path` 對應 `/admin/organizations`、`/admin/orders`、`/admin/revenue`，`mount.menu.requiresOperator` 皆為 `true`，不帶 `groupId`（維持獨立頂層項目），依 Decision「order 值安排在既有最大值（18，email-settings）之後，避免打亂既有順序」，`order` 值接續既有最大值（目前 `email-settings` 為 18）依序遞增，滿足 specs/platform-mount-points/spec.md 新增的「Existing orphaned admin pages are registered in the static mount point registry」需求裡 organizations/orders/revenue 三項，交付：Decision「organizations/orders/revenue 維持獨立頂層項目」成立。驗證：1.1 的紅燈測試裡這三個項目的斷言轉綠燈。
- [x] 2.2 [after: 1.1] 修改 `packages/platform/src/mount-points.ts`：新增 `checkout-gateway`、`einvoice`、`gemini` 三個 `PluginManifest` 條目，各自 `mount.route.path` 對應 `/admin/settings/checkout-gateway`、`/admin/settings/einvoice`、`/admin/settings/gemini`，`mount.menu.requiresOperator` 皆為 `true`，`mount.menu.groupId` 皆為 `"admin-settings"`，交付：Decision「checkout-gateway/einvoice/gemini 併入新的 admin-settings 群組」的前半部（條目本身）成立。驗證：1.1 的紅燈測試裡這三個項目的斷言轉綠燈。
- [x] 2.3 [after: 2.2] 修改 `apps/saas/modules/shared/lib/nav-menu-items.ts` 的 `MENU_GROUP_CONFIG`：新增 `"admin-settings"` 這個 key，對應 `{ id: "admin-settings-menu", label: "系統設定", icon: "settings", requiresOperator: true }`，交付：Decision「checkout-gateway/einvoice/gemini 併入新的 admin-settings 群組」成立，三個子項目正確收合成一個群組項目。驗證：1.2 的紅燈測試轉綠燈。
- [x] 2.4 確認 6 個新增條目的 `id` 值與既有 15 個 `MOUNT_POINTS` 條目的 `id` 完全不重複（grep 全部既有 id 逐一比對），交付：Risk「PluginManifest 的 id 欄位必須唯一」的檢查要求成立。驗證：列出這次新增的 6 個 id 與比對結果，明確記錄「無重複」。

## 3. 回歸測試：確認既有 9 個導覽項目不受影響

- [x] 3.1 跑 `apps/saas/modules/shared/lib/nav-menu-items.test.ts` 既有測試案例（驗證既有項目的順序、course-admin 分組、isOperator 過濾邏輯），交付：Implementation Contract 裡「不影響現有已註冊項目的順序與分組」成立。驗證：測試輸出顯示 0 failed，且逐一確認既有 9 個項目（start/course/quiz/assignment/pages-cms/review/chatbot/settings/admin/bundles/onboarding-surveys/media-library/course-pack-admin/email-settings，實際數量以 apply 階段當下 MOUNT_POINTS 內容為準）的順序與 course-admin 分組結果跟這次改動前一致。
- [x] 3.2 新增測試驗證 isOperator=false 時，這 6 個新項目與新的 admin-settings 群組完全不出現在 `getMountMenuItems()` 回傳結果，交付：Implementation Contract 裡「role !== admin 的使用者這 6 個項目完全不出現」成立。驗證：測試通過。

## 4. Review

- [ ] 4.1 Review：另一個 CLI（非實作 2 的那個）針對本次改動做獨立 code review，聚焦「新增的 6 個 id 有沒有跟既有 id 衝突」「requiresOperator 判斷有沒有正確套用到每一個新條目」「order 值有沒有意外打亂既有項目順序」，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆到 PM。
- [x] 4.2 全部確認沒問題後，跑一次完整測試套件（pnpm --filter saas test），交付：測試全數通過。驗證：測試輸出顯示 0 failed。

## 5. 部署與手動驗證

- [ ] 5.1 [after: 4.2] commit 並 push 到 origin/main，觸發 Coolify 部署，交付：新版本真正上線運行。驗證：SSH 確認正式站容器運行的 image tag 與 git HEAD commit 一致。
- [ ] 5.2 [after: 5.1] 以 admin 角色（依 admin-role-full-access-bypass SR 的 6.2 任務把帳號設成 admin 後）登入正式站，手動點擊側邊導覽，依序確認組織管理、訂單管理、營收報表、系統設定群組（展開後三個子項目：金流設定、發票設定、Gemini 設定）全部能正確點擊進入且頁面正常渲染，交付：Success Criteria「這 6 個頁面能被導覽選單找到」成立。驗證：記錄手動驗證的操作步驟與觀察結果。
