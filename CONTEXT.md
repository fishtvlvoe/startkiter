updated: 2026-09-21
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

## 未解問題

- 無。若 `app-extension-contract` 實作時發現 `displayName` 儲存機制與 `role-based-workspace-navigation` 的型別假設不符，需回頭 `spectra ingest` 同步。

## 下一步

5 張 SR 文件已全數 `spectra validate` 通過，等 Fish 確認方向後才進入 `spectra apply` 實作；本輪不改任何正式產品程式碼、不部署。
