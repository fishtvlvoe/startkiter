# account-settings-theme-language Code Review

審查日期：2026-09-23

## 審查範圍與基準

- 基準：`origin/main`／`62a87b41`。
- 功能提交：`726de936`（`726de936^..726de936`）。
- 合併提交：`87b6b259`，父提交為 `f6d6ba4d` 與 `726de936`；本審查只採第一親的帳號設定差異 `87b6b259^1..87b6b259`。
- `git diff --stat 726de936^ 726de936`：`62 files changed, 578 insertions(+), 205 deletions(-)`。
- `git diff --name-status 726de936^ 726de936` 分類：帳號選單 8 個、主題／語言 5 個、icon registry／SVG／檢查 46 個、相關測試 1 個、套件與本 change tasks 2 個。

## 5.1 範圍檢查

### PASS：改動屬於本 change

- 帳號選單：`AuthWrapper.tsx`、`NavBar.tsx`、`UserMenu.tsx`、`account-menu.ts` 與其測試；新增 `ACCOUNT_MENU_ENTRIES`，並以既有 `navigation.model.workspace` 傳入 `UserMenu`。
- 主題／語言落腳位置：`settings/general/page.tsx` 掛載 `UserColorModeForm` 與既有 `UserLanguageForm`；`AuthWrapper`、`NavBar`、`UserMenu` 移除一級區域的主題／語言控制項。
- icon 資產：`icon-assets.json`、`icon-assets.tsx`、`public/icons/account/**`、`public/icons/nav/**`、`check-icon-assets.mjs` 及測試 fixture。
- 語意色：`NavBar.tsx` 與 `UserMenu.tsx` 將 hardcoded 深色 class 改為 `background`、`foreground`、`muted-foreground`、`accent`、`border` 等 token。

### PASS：明確排除的差異

- `87b6b259^2..87b6b259` 的課程路由搬移、`app-feature-surfaces` tasks、navigation fixture 與 mount-points 測試，屬另一張已合併 change，不列入本次帳號設定統計。
- `git diff --name-status 62a87b41 87b6b259` 顯示的 `docs/verification/launch-evidence-report.*` 刪除與 `platform-launch-verification-evidence/tasks.md` 變更，屬後續驗收報告 merge，不列入本 change。
- `git diff --name-only 726de936^ 726de936 | rg 'WorkspaceContext|resolveNavigation|app-extension-contract|packages/platform|docs/verification|course'`：無輸出。

### 邊界觀察（未修改產品程式）

- `WorkspaceContext`／resolver：`account-menu.ts:1,14,29,36` 只引用既有型別並讀取 `scope`／`role`；`NavBar.tsx` 只讀既有 `navigation.model.workspace`。本提交沒有改 `WorkspaceContext` 定義或 `resolveNavigation` 判斷。
- App 註冊規則：`NavBar.tsx` 以既有 `navigation.apps` 的 `displayName` 組合 `appDisplayName`，`UserMenu.tsx` 只接收該值；沒有修改 App registry、註冊契約或 `displayName` 設定規則。
- 設定頁業務選項：一般設定頁只新增主題表單掛載，既有頭像、姓名、Email、刪除帳號與語言表單沒有業務邏輯改動。

## 5.2 風險與 mitigation checklist

### PASS：型別同步

- `AccountMenuEntry.visibleWhen` 明確採用 `WorkspaceContext` 型別；`ACCOUNT_MENU_ENTRIES` 集中定義可見性，避免另算權限。
- `app-admin-settings` 僅接受 `scope === "app" && role === "app-admin"`；`platform-admin-settings` 僅接受 `scope === "platform"`。
- 風險處理：若 `WorkspaceContext` 型別變更，型別錯誤會集中落在 `account-menu.ts`，不分散複製判斷。

### PASS：icon 缺版本佔位與建置阻擋

- `icon-assets.tsx` 的 `IconAsset` 同時要求 `light`／`dark`；`check-icon-assets.mjs` 對每個 registry icon 逐一檢查兩個變體。
- `check-icon-assets.test.ts` 使用 `icon-assets-missing-dark.json`，並確認錯誤列出 `nav.fixture:dark`；缺版本不會被靜默略過。
- 目前 registry 20 筆：`missing_variants=none`；所有註冊 icon 的 light／dark 檔案存在，未發現完全相同的 light／dark 內容佔位。

### PASS：語言切換位置

- `settings/general/page.tsx:36-37` 在使用者設定頁同時呈現 `UserColorModeForm` 與 `UserLanguageForm`。
- `NavBar.test.tsx`、`UserMenu.test.tsx`、`UnifiedShell.test.tsx` 對一級導覽／帳號選單保留 `locale-switch` 不存在的斷言；`AuthWrapper` 與 `NavBar` 的一級主題控制項也已移除。
- 風險處理：使用者可在設定頁明顯位置找到兩項控制；幫助文件位置註記不在本提交的允許檔案範圍，留作部署／文件 change 的後續項目，未以文件或瀏覽器證據冒充本次完成。

## 審查結論

5.1 範圍檢查通過，5.2 三項風險均有程式或測試對應證據。沒有發現需要在本次 review 修改的產品程式；4.2 與 5.3 的真實瀏覽器驗收仍未完成，不能以自動化測試、靜態檢查或假截圖替代。
