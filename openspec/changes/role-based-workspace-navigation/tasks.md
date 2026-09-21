<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試與契約檢查

- [ ] 1.1 [P] 讓「UI modules declare a typed platform manifest」在空 id、空 route、未知 workspace、重複 id、重複 route、非有限 order 與未知 parent 時失敗；先建立 manifest validation test，並以 `pnpm test` 的失敗案例確認測試會抓到每一種錯誤。
- [ ] 1.2 [P] 讓「The resolver selects exactly one workspace」在 learner、course-admin、super-admin、無權限與直接進入未授權 route 的案例產生預期 navigation model；先建立 resolver test，並以 workspace、capability 與 pathname fixture 驗證只輸出一個 workspace。
- [ ] 1.3 [P] 讓「Navigation supports one-level parent and child menus without duplicates」在子選單排序、空 menu registry、重複 id/href/parent-child 關係時有明確結果；先建立 navigation model test，並以 assertion 驗證失敗訊息包含衝突 module id。
- [ ] 1.4 [P] 讓「Visible navigation uses complete locale catalogs」在 `zh-tw`、`zh-cn`、`en` 缺 key、空字串與正常切換時有明確結果；先建立 locale completeness test，並以三份 catalog fixture 驗證 raw key 不會成為顯示文字。
- [ ] 1.5 [P] 讓「Shared navigation uses semantic theme and responsive contracts」拒絕 shared navigation 的深色 hardcoded text color，並保護 `1440px`／`390px` viewport 行為；先建立 token/static check 與 shell component test，再以測試輸出確認檢查可阻止回歸。
- [ ] 1.6 [P] 讓「The startkiter-dev Skill guides module development from the repository」有可驗證的 repo-local 入口、canonical spec 連結與 UI module preflight；先建立 Skill content check，並以 `python3 /Users/fishtv/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/startkiter-dev` 記錄預期失敗或通過結果。

## 2. 建立 module 與 workspace 核心

- [ ] 2.1 依「Module manifest owns UI relationships and the shell only composes them」加入 typed `UiModuleManifest`、`NavigationModel` 與 registry adapter；完成後既有 `MOUNT_POINTS` 可以轉成 manifest 而不增加第二份 menu literal，並以 1.1 的 validation test 與 TypeScript check 驗證。
- [ ] 2.2 依「Workspace resolver selects exactly one navigation context」實作 `resolveNavigation`，先判斷 route/capability 再過濾 module；完成後 learner 不會拿到管理選單，並以 1.2 的 resolver test 驗證。
- [ ] 2.3 依「Interface and data shape」固定 `workspace`、`menu.parentId`、`permission`、`i18nNamespace` 與 children 的型別；完成後錯誤 module 無法用 `as any` 繞過，並以 TypeScript compile 與 1.1/1.3 測試驗證。
- [ ] 2.4 依「Failure behavior」保留既有 route guard，並讓 manifest、duplicate、locale 與 permission 錯誤輸出可定位的 module id/field；完成後 direct unauthorized route 仍被拒絕，並以 resolver test 與既有 route-guard test 驗證。

## 3. 接上 shell、語系與主題

- [ ] 3.1 依「Observable behavior」讓 `NavBar` 只渲染目前 workspace 的一套 navigation surface，並移除 `/admin/course` 的平行水平管理選單；完成後 `/course` 不再看到管理選單，並以 `NavBar`／admin layout component test 驗證。
- [ ] 3.2 依「Translation keys and semantic tokens are module contracts」讓 menu、workspace heading、theme-control label 走 translation key 與 semantic token；完成後三種 locale 與 dark/light/system 都同步，並以 1.4、1.5 測試驗證。
- [ ] 3.3 依「Navigation supports one-level parent and child menus without duplicates」接上課程一級／子級選單與 active route；完成後課程、測驗、作業、複習各 href 只出現一次，並以 1.3 的 model assertion 驗證。

## 4. 把 Skill 與 demo 對齊

- [ ] 4.1 依「Extend the existing startkiter-dev Skill, but keep enforcement in code」與「Developer guidance contract」更新 `.agents/skills/startkiter-dev/SKILL.md`，要求新增 UI module 前先讀 spec、查找可重用 package、填 manifest、補 locale/token、跑 checks；完成後 Skill 不含第二份 menu literal，並以 1.6 的 content check 與 quick validator 驗證。
- [ ] 4.2 依「The startkiter-dev Skill guides module development from the repository」補 `AGENTS.md` 或同等 repo-local 入口，說明 Skill 可能未被某些 AI 自動載入但型別／測試／CI 仍是硬性邊界；完成後新開發者能從 repo 找到 canonical spec 與 Skill，並以 content review 與 link check 驗證。
- [ ] 4.3 依「The demo is an app preview over the same navigation model, not a second implementation」讓 `docs/ux/startkiter-navigation-focus.html` 改讀 runtime navigation model 或其生成 fixture；完成後 demo 的 workspace、href、label key、children 結構不再自行維護，並以 demo consistency test 驗證。
- [ ] 4.4 依「The demo and runtime consume one navigation truth」拒絕 demo 出現 registry 外的 module id、href 或角色；完成後不一致會讓 check 失敗，並以 registry/model comparison command 驗證。

## 5. 分層驗收

- [ ] 5.1 依「Implementation Contract」與「Acceptance criteria」完成 manifest、resolver、locale、component test 的可重複指令；完成後測試報告能分辨 contract failure 與 app failure，並以 focused test command 驗證。
- [ ] 5.2 依「Verification is layered from pure rules to deployed browser behavior」以 ego-browser 在部署後驗收 learner、course-admin、super-admin；完成後逐一點擊可見入口且沒有 duplicate menu、raw key、401/500，並保留桌面 `1440px` 與手機 `390px` 截圖證據。
- [ ] 5.3 依「Shared navigation uses semantic theme and responsive contracts」在部署後逐一切換 `zh-tw`、`zh-cn`、`en` 與 dark、light、system；完成後文字顏色、視窗大小、overflow 與 mobile fixed navigation 都正常，並以 ego-browser viewport assertions 驗證。

## 6. Review、風險與交付

- [ ] 6.1 依「Scope boundaries」檢查 diff 只涉及 module contract、workspace shell、Skill、demo 與驗收，不觸碰課程內容、金流、Email、GitHub kit 或客服邏輯；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [ ] 6.2 依「Risks / Trade-offs」逐項確認 Skill 未載入、既有 route 影響、locale 維護與 demo CSS drift 都有對應 mitigation；完成後以 code review checklist 記錄證據，不用 build 綠燈替代風險檢查。
- [ ] 6.3 依「Migration Plan」完成 adapter → manifest → shell → demo 的分階段切換與 rollback 證據；完成後 TEST/preview 失敗能回到 route 可用且 adapter 存在的 commit，並以 deploy diff、health check 與 rollback rehearsal 驗證。
- [ ] 6.4 依「Open Questions」確認 course-admin 的既有 capability mapping 與學生 AI 工具的 repo-local Skill discovery 限制；完成後決策寫入 spec/ADR，並以文件 link check 驗證沒有未標記的模糊規則。
- [ ] 6.5 依「Navigation changes have layered verification」完成 self-review、`spectra analyze role-based-workspace-navigation` 與 `spectra validate role-based-workspace-navigation`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試與瀏覽器驗收輸出。
