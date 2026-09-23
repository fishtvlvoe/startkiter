updated: 2026-09-21（第二輪：加入實際程式碼盤點證據）
change: role-based-workspace-navigation, app-extension-contract, account-settings-theme-language, app-feature-surfaces, platform-launch-verification-evidence

## 這個專案在幹嘛

StartKiter：課 + 終身代碼包，對外課名「開站包」。產品定位是「平台＋多個獨立 App」，不是單一固定功能的 SaaS——課程只是第一個接入的 App，之後可加入設計、社群等 App，每個 App 各自獨立管理內容、資料、選單、使用資格、文字、圖示與測試。

## 目前討論到哪

依 `docs/ux/startkiter-sr-architecture-focus.html` 對焦稿，把「平台＋App＋角色」骨架拆成 5 張依序相依的 Spectra change，已完成 SR 文件撰寫（proposal/design/spec/tasks），尚未實作：

1. `role-based-workspace-navigation`（延伸既有 change，0/25 → 已重寫成 App-scoped 骨架）：`WorkspaceContext` 從固定三值 enum（`learner | course-admin | super-admin`）改成 `{ scope: "platform" } | { scope: "app"; appId; role }`，固定總管理員／{App 名稱}管理員／使用者三種可見稱呼，修正課程使用者看到管理介面的既有 bug。**BREAKING**：型別重寫，但尚未實作，不影響已上線功能。
2. `app-extension-contract`：定義新 App 如何加入平台（`AppRegistrationManifest`）、`displayName` 由該 App 的 app-admin 設定與驗證規則、延伸 `startkiter-dev` Skill、AI 專用術語隔離規則。
3. `account-settings-theme-language`：帳號選單三層設定入口（使用者設定／{App}管理員設定／總管理員設定）、主題與語言切換移到帳號設定、SVG icon 淺深色版本規則、語意色彩 token 取代 hardcoded 深色 class。
4. `app-feature-surfaces`：把課程 App 遷移到新的 App registration 契約，盤點並移除誤植在總管理員介面的課程專屬功能，固定「使用者／管理員介面是兩棵獨立路由樹」「總管理員介面不內嵌單一 App 管理明細」邊界規則。
5. `platform-launch-verification-evidence`：上線前 36 組合驗收矩陣（角色 × 主題 × 語言 × 裝置）、逐一按鈕連結驗收、錯誤狀況驗收、部署後瀏覽器驗證、回滾排練、固定格式的交付證據報告。

依賴順序：1 → 2 → 3 → 4 → 5（3 依賴 1；4 依賴 1+2+3；5 依賴 1~4 全部完成）。

關鍵架構決策見 `docs/adr/0001-workspace-context-is-app-scoped-not-a-fixed-enum.md`。

### 2026-09-21 第二輪：實際程式碼盤點證據（已寫入 SR-01／SR-03，非推測）

- `packages/platform/src/mount-points.ts` 與 `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`（呼叫 `SettingsMenu`）是兩套互不相干的選單真相來源；`/admin/course`、`/admin/users`、`/admin/orders`、`/admin/revenue`、`/admin/organizations`、`/admin/settings/checkout-gateway` 六個路由各自出現兩套不一致的中文標籤（例：`/admin/orders`「訂單管理」vs「訂單列表」）。
- `mount-points.ts` 的選單文字 100% 是硬編碼中文字串，沒有任何 `labelKey`／i18n key——這是「切換 English 後主內容變英文、側欄仍中文」的根因，已寫入 SR-01 新增的「Menu labels resolve through the active locale catalog」requirement。
- `SettingsMenu.tsx` 用不換行的水平 flex 排列，在 390px 手機寬度造成約 730px 的水平溢出；預期移除平行選單即可一併解決。
- `NavBar.tsx` 多處寫死 `bg-[#1d2327]`、`bg-[#2271b1] text-white`、`text-[#c3c4c7]` 等色碼，管理頂列與側欄不隨 color mode 切換——已寫入 SR-03。
- 既有 106 個測試檔、430 個測試通過，但仍以 `isOperator`／`course-admin-menu` 舊模型為主，尚未驗證新的「平台／App／角色」規則；SR-01 新增 task 0.1／5.1 要求遷移時逐一改寫這批測試，不得新舊斷言並存、不得沿用舊的「430 通過」當作本次驗證證據。
- 非管理員（app-user）真實登入視角尚未經人工或 ego-browser 驗證；SR-01 spec／design／tasks 已明確標記這項為「未驗證」，禁止用型別正確推定畫面正確。

## 未解問題

- 無。若 `app-extension-contract` 實作時發現 `displayName` 儲存機制與 `role-based-workspace-navigation` 的型別假設不符，需回頭 `spectra ingest` 同步。

## 下一步

5 張 SR 文件（含本輪加入的實際程式碼證據）已全數 `spectra validate` 通過，等 Fish 確認方向後才進入 `spectra apply` 實作 SR-01；本輪仍未改動任何正式產品程式碼、未部署。
