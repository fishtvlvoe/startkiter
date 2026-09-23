<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 0. 依 2026-09-21 現況盤點證據建立回歸基準

- [x] 0.1 依設計決策「2026-09-21 現況盤點證據」，跑一次既有測試套件（106 檔／430 測試）並存下輸出，作為遷移前基準；同時列出所有斷言 `isOperator`（布林）或涉及 `course-admin-menu` 概念的既有測試檔清單。完成後有一份基準測試輸出與待改寫測試清單，不得直接沿用「430 通過」當作本 change 的驗證證據。
- [x] 0.2 程式化列出 `mount-points.ts`、`nav-menu-items.ts`、`admin/layout.tsx` 三份選單資料來源目前各自的 route／label 清單，標出重複與不一致的項目（含 spec 已記錄的 6 組真實重複標籤：`/admin/course`「課程管理」vs「課程管理」、`/admin/users`「後台設定」vs「用戶」、`/admin/orders`「訂單管理」vs「訂單列表」、`/admin/revenue`「營收報表」vs「營收結算」、`/admin/organizations`「組織管理」vs「組織」、`/admin/settings/checkout-gateway`「系統設定」群組 vs「結帳金流」）。完成後有一份可對照遷移進度的清單。
- [x] 0.3 **驗收前置條件確認**：查 TEST 環境（`https://test-startkiter.vercel.app` 或現行 Coolify+VPS TEST 網址）目前是否已有一組非管理員（非 operator、非 course-instructor）的可登入測試帳號，供 5.3 的真實登入驗證使用。若已有，記錄帳號來源與取得方式；若沒有，這是 5.3 開始前的硬性前置條件——需先建立一組測試帳號（例如一般 email/password 註冊）並記錄建立方式，不得用 mock capability 或測試 fixture 取代這個前置條件。完成後有明確結論：「已有可用帳號」或「已建立新帳號」，兩者擇一，不得留空。

## 1. 先建立失敗測試與契約檢查

- [x] 1.1 [P] 讓「Workspace is scoped to the platform or to a single App」在 `WorkspaceContext` 缺 `scope`、`scope: "app"` 缺 `appId`、未知 `appId` 時失敗；先建立型別與 resolver 的 validation test，並以 `pnpm test` 的失敗案例確認測試會抓到每一種錯誤。
- [x] 1.2 [P] 讓「The resolver selects exactly one workspace context」在 app-user、app-admin、super-admin、無權限與直接進入未授權 route 的案例產生預期 navigation model；先建立 resolver test，並以 capability 與 pathname fixture 驗證只輸出一個 `WorkspaceContext`。
- [x] 1.3 [P] 讓「A person can hold different roles in different Apps」在同一 session 對兩個不同 App 解析出不同角色、以及 super-admin 進入任一 App 都得到 app-admin 的案例有明確結果；先建立跨 App 角色 fixture test。
- [x] 1.4 [P] 讓「Navigation supports one-level parent and child menus without duplicates」在子選單排序、空 menu registry、重複 id/href/parent-child 關係時有明確結果，並涵蓋 0.2 盤點出的真實重複標籤案例；先建立 navigation model test，並以 assertion 驗證失敗訊息包含衝突 module id。
- [x] 1.5 [P] 讓「Visible role labels are data-driven and forbid legacy nouns」在總管理員／{App}管理員／使用者三種標籤解析正確，且掃描到「平台管理員」「模組管理員」「學員」時失敗；先建立 label resolver test 與 forbidden-noun static check script。
- [x] 1.6 [P] 讓「Menu labels resolve through the active locale catalog, not hardcoded strings」（設計決策「Menu labels are declared as translation keys, never raw display strings」）在 `menu.labelKey` 為中文字面字串（如現況盤點中 `mount-points.ts` 的 `label: "課程管理"`）或空字串時失敗，在合法 catalog key（如既有 `course.navLabel`、`admin.menu.users`）時通過；先建立 labelKey validation test。
- [x] 1.7 [P] 讓「Locale catalogs stay key-complete across zh-tw, zh-cn, and en」在任一已註冊 `labelKey`／`displayNameKey` 缺少某個語系值時失敗；沿用 `packages/i18n/marketing-pricing-keys.test.ts` 既有的 required-paths 比對寫法，先建立對應的選單 key 完整性 test。

## 2. 建立 App-scoped workspace 核心

- [x] 2.1 依「Workspace is scoped to the platform or to a single App」（設計決策「Workspace is app-scoped, not a fixed enum」）加入 `WorkspaceContext`、`AppManifestEntry`、`NavigationModel` 型別與 App registry adapter；完成後既有 `MOUNT_POINTS` 可以轉成 manifest 而不增加第二份 menu literal，並以 1.1 的 validation test 與 TypeScript check 驗證。
- [x] 2.2 依「The resolver selects exactly one workspace context」與「A person can hold different roles in different Apps」實作 `resolveNavigation`，輸入以 `(userId, appId)` 為單位查權限；完成後 app-user 不會拿到管理選單、同一人跨 App 角色互不影響，並以 1.2、1.3 的 resolver test 驗證。
- [x] 2.3 依「Interface and data shape」固定 `scope`、`appId`、`role`、`menu.parentId`、`requiredRole`、`i18nNamespace` 與 children 的型別；完成後錯誤 module 無法用 `as any` 繞過，並以 TypeScript compile 與 1.1/1.4 測試驗證。
- [x] 2.4 依「Failure behavior」保留既有 route guard，並讓未知 App、duplicate、locale 與 permission 錯誤輸出可定位的 module id/field；完成後 direct unauthorized route 仍被拒絕，並以 resolver test 與既有 route-guard test 驗證。
- [x] 2.5 依「Visible role labels are data-driven and forbid legacy nouns」實作 workspace label resolver（總管理員固定字串／`${displayName}管理員`／使用者固定字串）與 forbidden-noun static check；完成後 label 依 App registry 動態產生，且 CI 會擋下「平台管理員」「模組管理員」「學員」字面字串，並以 1.5 測試驗證。
- [x] 2.6 依「Menu labels resolve through the active locale catalog, not hardcoded strings」把 `mount-points.ts` 目前所有 `menu.label` 的硬編碼中文字串改成 `menu.labelKey`，優先接上既有孤兒 key（如 `course.navLabel`，目前存在於三份語系 catalog 但沒有任何程式碼引用）與既有 `admin.menu.*` pattern，缺的才依同一 namespace 慣例新增；完成後 `mount-points.ts` 不再有任何一個 `label` 欄位是寫死的顯示字串，並以 1.6 測試驗證。
- [x] 2.7 依「Locale catalogs stay key-complete across zh-tw, zh-cn, and en」接上 1.7 的選單 key 完整性 test 到 CI；完成後任何新 module 缺任一語系的 `labelKey` 都會被擋下，並以 1.7 測試驗證，同時確認既有 `saas.json` 三語系基準（zh-tw／zh-cn／en 完全對齊）維持零缺漏。

## 3. 接上 shell，修正既有 bug

- [x] 3.1 依「Observable behavior」與「admin layout does not render a second menu component」讓 `admin/layout.tsx` **只移除它對 `SettingsMenu` 的呼叫**（移除 `admin/layout.tsx:28-100` 內獨立維護的 `courseMenuItem`／`coursePackMenuItem` 等第二份選單陣列與 `<SettingsMenu ... />` 掛載），讓 `NavBar` 只渲染目前 `WorkspaceContext` 的一套 navigation surface；**不得修改或刪除 `apps/saas/modules/settings/components/SettingsMenu.tsx` 元件本身，也不得動到 `apps/saas/app/(authenticated)/(main)/(account)/settings/layout.tsx` 對它的呼叫**（帳號設定頁仍需要它）。完成後 `/course` 不再看到管理選單、`/admin/course` 只剩一套選單、帳號設定頁的 `SettingsMenu` 顯示不受影響，並以 `NavBar`／admin layout component test 與 `settings/layout.tsx` 既有 component test（確認未受影響）驗證。
- [x] 3.2 依「Navigation supports one-level parent and child menus without duplicates」接上課程一級／子級選單與 active route，course 改用 App manifest 產生而非硬編碼；完成後課程、測驗、作業、複習各 href 只出現一次，0.2 盤點出的 6 組重複標籤全數消失，並以 1.4 的 model assertion 驗證。
- [x] 3.3 依「removing the duplicate menu also fixes the mobile overflow it caused」確認 3.1 移除 `admin/layout.tsx` 對 `SettingsMenu` 的呼叫後，`/admin/course` 在 `390px` 手機寬度的內容寬度回到 `390px` 以內（既有實測約 `730px`）；完成後以 component test 斷言容器寬度、並附前後截圖對照驗證。若移除後仍有溢出，另外記錄為獨立 responsive 問題，不得與本 task 混報。
- [x] 3.4 依「locale switch updates the sidebar, not only the main content」確認切換 `zh-tw`／`zh-cn`／`en` 時側欄選單標籤與主內容同步切換，修正既有「英文切換後側欄仍中文」的 bug；完成後以 component test 或 ego-browser 截圖對照驗證三種語言下側欄與主內容一致。

## 4. 把 demo 對齊 runtime

- [x] 4.1 依「The demo and runtime consume one navigation truth」（設計決策「The demo is an app preview over the same navigation model, not a second implementation」）讓 `docs/ux/startkiter-sr-architecture-focus.html` 改讀 runtime navigation model 或其生成 fixture；完成後 demo 的 `workspace`、href、label key、children 結構不再自行維護，並以 demo consistency test 驗證。
- [x] 4.2 依「demo has no unregistered App or module」拒絕 demo 出現 registry 外的 `appId`、module id 或 href；完成後不一致會讓 check 失敗，並以 registry/model comparison command 驗證。

## 5. 既有測試遷移與分層驗收

- [x] 5.1 依「2026-09-21 現況盤點證據」第 6 點與「Risks / Trade-offs」，把 0.1 列出的所有斷言 `isOperator`／`course-admin-menu` 的既有測試檔改寫為斷言 `WorkspaceContext`／`resolveNavigation` 輸出；完成後測試套件不再有新舊兩套矛盾斷言並存，重跑整套測試並記錄新的通過數字（不得沿用舊的「430 通過」）。
- [x] 5.2 依「Workspace skeleton changes have layered verification」與「Acceptance criteria」完成 manifest、resolver、label、component test 的可重複指令；完成後測試報告能分辨 contract failure 與 app failure，並以 focused test command 驗證。
- [x] 5.3 **依賴 0.3 完成**（若 0.3 結論是「需建立新帳號」，本 task 在帳號建立前不得開始）。依「pure contract checks pass」與「a concrete workspace-boundary regression」example，以 ego-browser 在部署後驗收使用者、App 管理員、總管理員三種角色骨架，其中「使用者」（app-user）視角必須用 0.3 確認的真實非管理員帳號登入驗證，不得只憑型別或 mock capability 推定畫面正確；完成後逐一點擊可見入口且沒有 duplicate menu、越權入口或 forbidden noun，並保留桌面 `1440px` 與手機 `390px` 截圖證據。若真實非管理員帳號驗證尚未完成，明確標記「未驗證」，不得標記完成。

	**2026-09-24 補充驗證與更正**：原本這項的驗收沒有涵蓋「總管理員在 App 前台路由（如 `/course`）是否顯示管理員身份」這個情境，只測了 `/admin/*` 底下。2026-09-23 用 fish@fishot.com 實測雲端 `/course`，發現側邊欄沒有任何身份標籤（應顯示「課程管理員」），跟 `/admin/newsletter` 底下正確顯示「總管理員」不一致，是真實回歸，不是設計如此。根因：`getMountNavigationContext` 把「目前路由是否需要 app-admin」跟「使用者的實際角色」混為一談，導致總管理員在使用者路由被降級成 app-user。已透過 PR #12（commit d15fbb8）修復並部署，2026-09-24 用 ego-browser 重新登入雲端正式站確認 `/course` 側邊欄正確顯示「課程管理員」。完整根因分析見 `evidence/task-5.3-course-admin-label-regression.md`。

## 6. Review、風險與交付

- [x] 6.1 依「Scope boundaries」檢查 diff 只涉及 workspace 型別、resolver、NavBar／admin layout 骨架與 demo 對齊，不觸碰帳號選單內容、App 加入規則、各 App 功能畫面或跨 App 全量驗收；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [x] 6.2 依「Risks / Trade-offs」逐項確認 **BREAKING** 型別變更、稱呼樣板寫死、forbidden-noun 掃描範圍、demo CSS drift、既有測試遷移與「app-user 視角未驗證」風險都有對應 mitigation；完成後以 code review checklist 記錄證據，不用 build 綠燈替代風險檢查。
- [ ] 6.3 依「Migration Plan」完成 adapter → App manifest → shell → 測試遷移 → demo 的分階段切換與 rollback 證據；完成後 TEST/preview 失敗能回到 route 可用且 adapter 存在的 commit，並以 deploy diff、health check 與 rollback rehearsal 驗證。
- [x] 6.4 依「Open Questions」確認 `app-extension-contract` 對 `displayName` 儲存機制的決定與本次型別假設一致；不一致時以 `spectra ingest` 回頭同步本 change 的型別定義，並以文件 link check 驗證沒有未標記的模糊規則。
- [x] 6.5 完成 self-review、`spectra analyze role-based-workspace-navigation` 與 `spectra validate role-based-workspace-navigation`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試與瀏覽器驗收輸出，明確列出尚未驗證的項目（不得留白假裝沒有）。
