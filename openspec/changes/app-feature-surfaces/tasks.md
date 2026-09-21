<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試與盤點

- [ ] 1.1 [P] 讓「An App's user surface and admin surface are independent route trees」在同一元件依角色 conditional render 不同內容時失敗；先建立 route-tree independence component test。
- [ ] 1.2 [P] 讓「The platform surface excludes any single App's admin detail」在總管理員介面出現任何已註冊 App 的專屬路由時失敗；先建立 boundary check script 與違規 fixture。
- [ ] 1.3 程式化列出 `apps/saas/app/(authenticated)/(main)/(account)/admin/` 全部路由並分類「全站層級」／「課程專屬」，輸出盤點清單；完成後清單能明確指出哪些路由需要遷移。
- [ ] 1.4 跑一次既有課程測試套件（`course-studio-upgrade`、`interactive-learning-system` 對應測試）建立基準結果，作為遷移後比對用。

## 2. 遷移課程 App

- [ ] 2.1 依「The course App is migrated to the registration contract」與「Failure behavior」依 `app-extension-contract` 的 `AppRegistrationManifest` 註冊課程 App（`appId: "course"`、`displayName`、icon、語系、測試欄位）；完成後 CI 驗證通過，並以 spec 的 registration scenario 驗證。
- [ ] 2.2 依「An App's user surface and admin surface are independent route trees」把 1.3 盤點出的課程專屬內容從總管理員路由樹遷移到 `/admin/course/*`；完成後 `/course`、`/admin/course` 是兩棵獨立路由樹，並以 1.1 測試驗證。
- [ ] 2.3 依「The platform surface excludes any single App's admin detail」（設計決策「The platform (super-admin) surface exposes only site-wide capabilities, never a single App's admin detail」）移除總管理員介面內殘留的課程專屬功能明細，改為單一「切換到課程管理員」入口；完成後總管理員介面不含課程細節（見「Observable behavior」「Interface and data shape」的邊界測試示意），並以 1.2 測試驗證。

## 3. 回歸與邊界驗收

- [ ] 3.1 依「existing course functionality is unaffected by the migration」重跑 1.4 的基準測試套件；完成後遷移前後行為一致，全數通過。
- [ ] 3.2 依「Acceptance criteria」在部署後以 ego-browser 走一次課程使用者與課程管理員的既有核心流程（章節/單元 CRUD、講義編輯器、沙盒、拖曳排序）；完成後功能正常且無殘留於總管理員介面的課程入口，並保留截圖證據。

## 4. Review、風險與交付

- [ ] 4.1 依「Scope boundaries」檢查 diff 只涉及課程 App 的路由歸屬與邊界測試，不觸碰課程內容資料模型或編輯器本體邏輯、前三張 change 已固定的型別與規則；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [ ] 4.2 依「Risks / Trade-offs」逐項確認既有測試基準、盤點完整性與契約欄位不足時的處理方式都有對應 mitigation；完成後以 code review checklist 記錄證據。
- [ ] 4.3 完成 self-review、`spectra analyze app-feature-surfaces` 與 `spectra validate app-feature-surfaces`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試與瀏覽器驗收輸出。
