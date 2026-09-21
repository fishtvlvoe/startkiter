# 6.1／6.2／6.4 Review Checklist

## 6.1 Scope

- PASS：diff 只涵蓋 workspace 型別、manifest adapter、resolver、NavBar、admin layout、三份語系 catalog、UX fixture 與測試／證據文件。
- PASS：`apps/saas/modules/settings/components/SettingsMenu.tsx` 沒有修改。
- PASS：`apps/saas/app/(authenticated)/(main)/(account)/settings/layout.tsx` 沒有修改。
- PASS：沒有修改課程內容資料模型、App 功能畫面、付款、Email、客服或 App 安裝規則。

## 6.2 Risk checks

- PASS：BREAKING 型別變更有 adapter；`toAppManifestEntries(MOUNT_POINTS)` 讓現有 mount registry 仍是輸入來源，`getMountMenuItems` 再轉成 shell 需要的資料。
- PASS：稱呼規則集中在 `getWorkspaceLabel`，總管理員固定「總管理員」、App 管理員使用 `displayName`、一般角色固定「使用者」。
- PASS：forbidden noun check 只掃 `apps/saas/modules` 與正式 UX demo，排除測試檔；平台 workspace test 已通過。
- PARTIAL：demo 的資料已改讀 serialized fixture；HTML 視覺 CSS 仍是 demo 自己的 CSS，正式上線前仍需 desktop／mobile screenshot 比對。
- PASS：舊導覽 assertion 已遷移；後端資料權限測試中的 `isOperator` 依 `test-migration.md` 保留，避免把權限契約誤改成 UI 契約。
- UNVERIFIED：app-user 真實帳號瀏覽器視角尚未完成；TEST 入口目前回 `DEPLOYMENT_NOT_FOUND`，因此不能推定正式畫面正確。

## 6.4 App extension contract alignment

- PASS：`openspec/changes/app-extension-contract/proposal.md` 與 `design.md` 已固定 `displayName` 可由該 App 管理員修改，並保留「{displayName}管理員」稱呼樣板不自訂。
- PASS：本 change 只使用 `displayName`／`displayNameKey` 供 navigation model 顯示，不提前實作 App 改名 API；改名功能仍留給 `app-extension-contract`。
- PASS：沒有未標記的 displayName 命名模糊規則。

## 未完成的交付證據

- 6.3 TEST／preview deploy、health check、rollback rehearsal：未執行。
- 3.3 390px 前後 screenshot 與實際容器寬度：未驗證。
- 5.3 三種角色真實瀏覽器驗收：依賴 0.3，未驗證。
