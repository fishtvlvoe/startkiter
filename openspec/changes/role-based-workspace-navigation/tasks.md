<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試與契約檢查

- [ ] 1.1 [P] 讓「Workspace is scoped to the platform or to a single App」在 `WorkspaceContext` 缺 `scope`、`scope: "app"` 缺 `appId`、未知 `appId` 時失敗；先建立型別與 resolver 的 validation test，並以 `pnpm test` 的失敗案例確認測試會抓到每一種錯誤。
- [ ] 1.2 [P] 讓「The resolver selects exactly one workspace context」在 app-user、app-admin、super-admin、無權限與直接進入未授權 route 的案例產生預期 navigation model；先建立 resolver test，並以 capability 與 pathname fixture 驗證只輸出一個 `WorkspaceContext`。
- [ ] 1.3 [P] 讓「A person can hold different roles in different Apps」在同一 session 對兩個不同 App 解析出不同角色、以及 super-admin 進入任一 App 都得到 app-admin 的案例有明確結果；先建立跨 App 角色 fixture test。
- [ ] 1.4 [P] 讓「Navigation supports one-level parent and child menus without duplicates」在子選單排序、空 menu registry、重複 id/href/parent-child 關係時有明確結果；先建立 navigation model test，並以 assertion 驗證失敗訊息包含衝突 module id。
- [ ] 1.5 [P] 讓「Visible role labels are data-driven and forbid legacy nouns」在總管理員／{App}管理員／使用者三種標籤解析正確，且掃描到「平台管理員」「模組管理員」「學員」時失敗；先建立 label resolver test 與 forbidden-noun static check script。

## 2. 建立 App-scoped workspace 核心

- [ ] 2.1 依「Workspace is scoped to the platform or to a single App」（設計決策「Workspace is app-scoped, not a fixed enum」）加入 `WorkspaceContext`、`AppManifestEntry`、`NavigationModel` 型別與 App registry adapter；完成後既有 `MOUNT_POINTS` 可以轉成 manifest 而不增加第二份 menu literal，並以 1.1 的 validation test 與 TypeScript check 驗證。
- [ ] 2.2 依「The resolver selects exactly one workspace context」與「A person can hold different roles in different Apps」實作 `resolveNavigation`，輸入以 `(userId, appId)` 為單位查權限；完成後 app-user 不會拿到管理選單、同一人跨 App 角色互不影響，並以 1.2、1.3 的 resolver test 驗證。
- [ ] 2.3 依「Interface and data shape」固定 `scope`、`appId`、`role`、`menu.parentId`、`requiredRole`、`i18nNamespace` 與 children 的型別；完成後錯誤 module 無法用 `as any` 繞過，並以 TypeScript compile 與 1.1/1.4 測試驗證。
- [ ] 2.4 依「Failure behavior」保留既有 route guard，並讓未知 App、duplicate、locale 與 permission 錯誤輸出可定位的 module id/field；完成後 direct unauthorized route 仍被拒絕，並以 resolver test 與既有 route-guard test 驗證。
- [ ] 2.5 依「Visible role labels are data-driven and forbid legacy nouns」實作 workspace label resolver（總管理員固定字串／`${displayName}管理員`／使用者固定字串）與 forbidden-noun static check；完成後 label 依 App registry 動態產生，且 CI 會擋下「平台管理員」「模組管理員」「學員」字面字串，並以 1.5 測試驗證。

## 3. 接上 shell，修正既有 bug

- [ ] 3.1 依「Observable behavior」讓 `NavBar` 只渲染目前 `WorkspaceContext` 的一套 navigation surface，並移除 `/admin/course` 的平行水平管理選單；完成後 `/course` 不再看到管理選單，並以 `NavBar`／admin layout component test 驗證。
- [ ] 3.2 依「Navigation supports one-level parent and child menus without duplicates」接上課程一級／子級選單與 active route，course 改用 App manifest 產生而非硬編碼；完成後課程、測驗、作業、複習各 href 只出現一次，並以 1.4 的 model assertion 驗證。
- [ ] 3.3 依「course learner route renders no admin menu」與「course admin route renders one menu, not two」修正既有已知 bug；完成後 `/course`、`/admin/course` 的既有畫面缺陷消失，並以 component test 截圖前後對照驗證。

## 4. 把 demo 對齊 runtime

- [ ] 4.1 依「The demo and runtime consume one navigation truth」（設計決策「The demo is an app preview over the same navigation model, not a second implementation」）讓 `docs/ux/startkiter-sr-architecture-focus.html` 改讀 runtime navigation model 或其生成 fixture；完成後 demo 的 `workspace`、href、label key、children 結構不再自行維護，並以 demo consistency test 驗證。
- [ ] 4.2 依「demo has no unregistered App or module」拒絕 demo 出現 registry 外的 `appId`、module id 或 href；完成後不一致會讓 check 失敗，並以 registry/model comparison command 驗證。

## 5. 分層驗收

- [ ] 5.1 依「Workspace skeleton changes have layered verification」與「Acceptance criteria」完成 manifest、resolver、label、component test 的可重複指令；完成後測試報告能分辨 contract failure 與 app failure，並以 focused test command 驗證。
- [ ] 5.2 依「pure contract checks pass」以 ego-browser 在部署後驗收使用者、App 管理員、總管理員三種角色骨架；完成後逐一點擊可見入口且沒有 duplicate menu、越權入口或 forbidden noun，並保留桌面 `1440px` 與手機 `390px` 截圖證據。

## 6. Review、風險與交付

- [ ] 6.1 依「Scope boundaries」檢查 diff 只涉及 workspace 型別、resolver、NavBar／admin layout 骨架與 demo 對齊，不觸碰帳號選單內容、App 加入規則、各 App 功能畫面或跨 App 全量驗收；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [ ] 6.2 依「Risks / Trade-offs」逐項確認 **BREAKING** 型別變更、稱呼樣板寫死、forbidden-noun 掃描範圍與 demo CSS drift 都有對應 mitigation；完成後以 code review checklist 記錄證據，不用 build 綠燈替代風險檢查。
- [ ] 6.3 依「Migration Plan」完成 adapter → App manifest → shell → demo 的分階段切換與 rollback 證據；完成後 TEST/preview 失敗能回到 route 可用且 adapter 存在的 commit，並以 deploy diff、health check 與 rollback rehearsal 驗證。
- [ ] 6.4 依「Open Questions」確認 `app-extension-contract` 對 `displayName` 儲存機制的決定與本次型別假設一致；不一致時以 `spectra ingest` 回頭同步本 change 的型別定義，並以文件 link check 驗證沒有未標記的模糊規則。
- [ ] 6.5 完成 self-review、`spectra analyze role-based-workspace-navigation` 與 `spectra validate role-based-workspace-navigation`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試與瀏覽器驗收輸出。
