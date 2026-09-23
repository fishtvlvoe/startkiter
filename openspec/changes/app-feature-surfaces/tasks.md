<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試與盤點

- [x] 1.1 [P] 讓「An App's user surface and admin surface are independent route trees」在同一元件依角色 conditional render 不同內容時失敗；先建立 route-tree independence component test。
- [x] 1.2 [P] 讓「The platform surface excludes any single App's admin detail」在總管理員介面出現任何已註冊 App 的專屬路由時失敗；先建立 boundary check script 與違規 fixture。
- [x] 1.3 程式化列出 `apps/saas/app/(authenticated)/(main)/(account)/admin/` 全部路由並分類「全站層級」／「課程專屬」，輸出盤點清單；完成後清單能明確指出哪些路由需要遷移。
- [x] 1.4 跑一次既有課程測試套件（`course-studio-upgrade`、`interactive-learning-system` 對應測試）建立基準結果，作為遷移後比對用。

## 2. 遷移課程 App

- [x] 2.1 依「The course App is migrated to the registration contract」與「Failure behavior」依 `app-extension-contract` 的 `AppRegistrationManifest` 註冊課程 App（`appId: "course"`、`displayName`、icon、語系、測試欄位）；完成後 CI 驗證通過，並以 spec 的 registration scenario 驗證。
- [x] 2.2 依「An App's user surface and admin surface are independent route trees」把 1.3 盤點出的課程專屬內容從總管理員路由樹遷移到 `/admin/course/*`；完成後 `/course`、`/admin/course` 是兩棵獨立路由樹，並以 1.1 測試驗證。
- [x] 2.3 依「The platform surface excludes any single App's admin detail」（設計決策「The platform (super-admin) surface exposes only site-wide capabilities, never a single App's admin detail」）移除總管理員介面內殘留的課程專屬功能明細，改為單一「切換到課程管理員」入口；完成後總管理員介面不含課程細節（見「Observable behavior」「Interface and data shape」的邊界測試示意），並以 1.2 測試驗證。

## 3. 回歸與邊界驗收

- [x] 3.1 依「existing course functionality is unaffected by the migration」重跑 1.4 的基準測試套件；完成後遷移前後行為一致，全數通過。
- [ ] 3.2 依「Acceptance criteria」在部署後以 ego-browser 走一次課程使用者與課程管理員的既有核心流程（章節/單元 CRUD、講義編輯器、沙盒、拖曳排序）；完成後功能正常且無殘留於總管理員介面的課程入口，並保留截圖證據。

> 3.2 卡點（2026-09-23）：本輪沒有部署後可用的 preview URL，瀏覽器走查未執行；依要求不製作假截圖、不把本地測試當成瀏覽器驗收。待部署完成後，再用 ego-browser 走課程使用者與課程管理員核心流程並補證據。

## 4. Review、風險與交付

- [x] 4.1 依「Scope boundaries」檢查 diff 只涉及課程 App 的路由歸屬與邊界測試，不觸碰課程內容資料模型或編輯器本體邏輯、前三張 change 已固定的型別與規則；完成後以 `git diff --stat` 與檔案清單 review 驗證。證據：`code-review.md`；`git diff f6d6ba4d^ f6d6ba4d` 為 26 files、16 個課程路由 rename、邊界測試與平台 route resolver 變更，未涉及 `packages/course/**`、`app-extension-contract` 或 `account-settings-theme-language`。
- [x] 4.2 依「Risks / Trade-offs」逐項確認既有測試基準、盤點完整性與契約欄位不足時的處理方式都有對應 mitigation；完成後以 code review checklist 記錄證據。證據：`code-review.md`；課程基準 19 files／114 tests、路由邊界測試 4 files／30 tests 通過，32 個 admin page route 完成 16／16 分類，契約欄位不足沿用 `spectra ingest` 處理；完整 platform suite 的既有 forbidden-noun 失敗已明列，未宣稱全綠。
- [ ] 4.3 完成 self-review、`spectra analyze app-feature-surfaces` 與 `spectra validate app-feature-surfaces`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試與瀏覽器驗收輸出。

> 4.3 檢查紀錄（2026-09-23）：`spectra analyze app-feature-surfaces` exit 0；Coverage／Consistency／Gaps／Localization 均 `Clean (0 findings)`，Ambiguity 有 1 個 `[SUGGEST]`：`existing course functionality is unaffected by the migration` 缺少 concrete examples，位置 `specs/app-feature-surfaces/spec.md`。`spectra validate app-feature-surfaces` exit 0，輸出 `✓ app-feature-surfaces — valid`。
>
> 4.3 維持未勾：本輪沒有部署後 preview URL，未執行 ego-browser，沒有瀏覽器／桌面／手機驗收輸出；不製作假截圖、不把本地測試當瀏覽器驗收。
