<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試

- [x] 1.1 [P] 讓「A new App registers through a typed manifest validated at CI time」在缺 `displayName`、`route.basePath`、icon 版本、語系 key，以及 `appId`／route 衝突時失敗；先建立 manifest validation test，列出每種缺失欄位的預期錯誤訊息。
- [x] 1.2 [P] 讓「displayName is owned by the App's own admin and blocks reserved words」在非 app-admin 嘗試修改、保留字「總管理員」「使用者」、空白字串時失敗；先建立 displayName 更新 test。
- [x] 1.3 [P] 讓「Developer-only vocabulary is excluded from learner-facing text」在使用者可見文案出現 `manifest`／`resolver`／`registry`／`workspace context` 時失敗，在程式碼註解與 Skill 檔案出現時不失敗；先建立 forbidden-term scan script 與 fixture。

## 2. 建立 App registration 核心

- [x] 2.1 依「A new App registers through a typed manifest validated at CI time」實作 `AppRegistrationManifest` 型別與 `registerApp` 驗證函式；完成後缺欄位或衝突的 App 無法進入 registry，並以 1.1 測試驗證。
- [x] 2.2 依「displayName is owned by the App's own admin and blocks reserved words」實作 `displayName` 更新 API，綁定既有 `app-admin` 權限檢查；完成後只有該 App 的 app-admin 能改名，且保留字被擋下，並以 1.2 測試驗證。
- [x] 2.3 依「Observable behavior」確認 `displayName` 更新後，navigation model 重新 resolve 立即反映新名稱，不需要重新部署；完成後以 fixture 測試模擬修改前後兩次 resolve 比對驗證。
- [x] 2.4 依「Interface and data shape」與「Failure behavior」接上 CI，讓任何新增或修改 App registry 的 PR 跑 `registerApp` 驗證；完成後 CI 會在缺欄位時擋下合併，並以 CI 設定檔與一次刻意失敗的 PR fixture 驗證。

## 3. 把 Skill 與詞彙隔離規則落地

- [x] 3.1 依「The startkiter-dev Skill guides new App registration from the repository」（設計決策「The startkiter-dev Skill is the single App-authoring entrypoint; enforcement stays in code」）更新 `.agents/skills/startkiter-dev/SKILL.md`，加入「新增 App」段落（查重用、填 manifest、補 icon／語系、補測試）；完成後 Skill 不含第二份欄位清單，並以 Skill content check 驗證。
- [x] 3.2 依「Developer-only vocabulary is excluded from learner-facing text」實作 forbidden-term static check，掃描 `apps/saas/modules/**` 與 `docs/tutorials/**`，排除 `.agents/skills/` 與程式碼註解；完成後掃描能正確分辨兩種情境，並以 1.3 測試驗證。
- [x] 3.3 更新 `AGENTS.md` 指向本 change 的 canonical spec，說明 App registration 是新增 App 的固定入口；完成後新開發者能從 repo 找到規則，並以 link check 驗證。

## 4. 示範與驗收

- [x] 4.1 依「Acceptance criteria」以一個假設的 `design` App fixture 走過整套 `AppRegistrationManifest`，不實作真實功能畫面；完成後確認 CI 能正確通過完整案例、擋下刻意缺欄位的案例，並以測試輸出附上兩種結果證據。
- [x] 4.2 回歸驗證既有 course App：套用本 change 的 registry 格式後，course 的選單、稱呼與既有測試仍全數通過；完成後以既有測試套件重跑結果驗證。

## 5. Review、風險與交付

- [x] 5.1 依「Scope boundaries」檢查 diff 只涉及 App registration manifest、`displayName` 規則、Skill 段落與詞彙掃描，不觸碰 `WorkspaceContext`／resolver 邏輯本身或任何一個實際 App 的功能實作；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [x] 5.2 依「Risks / Trade-offs」逐項確認 `displayName` 即時性、CI 規則擴充相容性與詞彙掃描誤傷風險都有對應 mitigation；完成後以 code review checklist 記錄證據。
- [x] 5.3 完成 self-review、`spectra analyze app-extension-contract` 與 `spectra validate app-extension-contract`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試輸出。
