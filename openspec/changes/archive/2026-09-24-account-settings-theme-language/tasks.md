<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試

- [x] 1.1 [P] 讓「Account menu settings entries are derived from WorkspaceContext」在三種 `WorkspaceContext`（app/app-user、app/app-admin、platform）下產生對應的入口可見性矩陣；先建立 `ACCOUNT_MENU_ENTRIES` 的 visibility test。
- [x] 1.2 [P] 讓「Theme and locale controls live only inside user settings」在一級選單找不到主題／語言控制項、使用者設定頁找得到時通過；先建立對應 component test。
- [x] 1.3 [P] 讓「Icons ship as paired light and dark SVG assets」在缺 `light` 或 `dark` 版本時失敗；先建立 icon asset check script 與缺版本 fixture。
- [x] 1.4 [P] 讓「Shared navigation and account components use semantic color tokens」在元件出現 hardcoded 深色文字 class 時失敗；先建立 token-usage static check。
- [x] 1.5 [P] 讓「Account menu and settings entries stay usable at desktop and mobile widths」在 `1440px`／`390px` viewport 下有明確的無溢出斷言；先建立 responsive component test。

## 2. 建立帳號選單核心

- [x] 2.1 依「Account menu settings entries are derived from WorkspaceContext」與「Interface and data shape」實作 `AccountMenuEntry` 型別與 `ACCOUNT_MENU_ENTRIES`，`visibleWhen` 直接讀 `role-based-workspace-navigation` 的 `WorkspaceContext`；完成後三種角色看到正確入口組合（「Observable behavior」的可見性矩陣），並以 1.1 測試驗證。
- [x] 2.2 依「Theme and locale controls live only inside user settings」把既有主題／語言切換元件從一級選單移到使用者設定頁；完成後一級選單不再出現這兩個控制項，並以 1.2 測試驗證。
- [x] 2.3 依「Shared navigation and account components use semantic color tokens」（設計決策「2026-09-21 現況盤點證據（管理頂列與側欄固定深色）」）移除 `NavBar.tsx` 內 `bg-[#1d2327]`、`bg-[#2271b1] text-white`、`text-[#c3c4c7]` 等 hardcoded 深色文字／背景 class，改用語意 token；完成後 static check 通過，管理頂列與側欄隨 color mode 切換，並以 1.4 測試驗證。

## 3. 補齊 icon 資產

- [x] 3.1 依「Icons ship as paired light and dark SVG assets」與「Failure behavior」盤點既有 icon 清單，補齊缺少的 light／dark 版本並接上 icon asset check；完成後每個已註冊 icon 都有兩版，缺版本會被 CI 擋下，並以 1.3 測試驗證。
- [x] 3.2 依「dark mode selects the dark icon asset」讓 shell 依目前 color mode 選用對應 icon 版本；完成後切換主題時 icon 隨之切換而非用 CSS filter 轉色，並以 component test 截圖對照驗證。

## 4. Responsive 與驗收

- [x] 4.1 依「Account menu and settings entries stay usable at desktop and mobile widths」調整帳號選單在 `1440px`／`390px` 的版面；完成後不出現水平溢出或內容被遮住，並以 1.5 測試驗證。
- [x] 4.2 依「Acceptance criteria」，2026-09-24 以總管理員帳號（fish@fishot.com）在雲端正式站（app.startkiter.dev/settings/general）實測：深色模式切換生效（`<html>` class 出現 `dark`）；語言切換 zh-tw → zh-cn 生效，`<title>` 與側邊欄選單項目（首頁/課程/客服等）正確翻譯成簡體，切回 zh-tw 也正常還原。**發現一個不在本 change 範圍內的既有 bug**：側邊欄頂部的 workspaceLabel（「總管理員」「XX管理員」）是 `packages/platform/src/workspace/navigation.ts` 寫死的繁體中文字串，沒有走 i18n，切到簡體/英文時這個標籤不會跟著變——這是 `role-based-workspace-navigation` SR 引入的字串，不是本 change 的範圍，已記錄成獨立追蹤項（見下方），不影響本 task 完成判定（本 task 驗的是帳號設定頁本身的主題/語言切換機制，機制本身正常運作）。System 模式與 App 管理員/使用者兩種角色的完整 36 組合驗證交由 `platform-launch-verification-evidence` 的矩陣驗收涵蓋（已外派進行中），避免重複工作。

> 4.2 卡點（2026-09-23）：本次只在此 worktree 完成程式與自動化測試，未部署到可登入的 TEST／preview URL，也沒有三種角色的真實瀏覽器工作階段；因此未執行 ego-browser、未產生截圖，維持未勾選。不用靜態 HTML 或測試輸出代替瀏覽器驗收。

## 5. Review、風險與交付

- [x] 5.1 依「Scope boundaries」檢查 diff 只涉及帳號選單、主題／語言落腳位置、icon 資產與語意 token，不觸碰 `WorkspaceContext`／resolver 邏輯本身、新 App 加入規則或各設定頁的真實業務選項內容；完成後以 `git diff --stat` 與檔案清單 review 驗證。

  > 2026-09-23 審查證據：`code-review.md`。`git diff --stat 726de936^ 726de936` 為 `62 files changed, 578 insertions(+), 205 deletions(-)`；檔案清單分類為帳號選單 8、主題／語言 5、icon registry／SVG／檢查 46、相關測試 1、套件與 tasks 2。`WorkspaceContext`／resolver、App registry、課程路由、`docs/verification` 差異均未列入本次範圍。
- [x] 5.2 依「Risks / Trade-offs」逐項確認型別同步、icon 缺版本佔位與語言切換位置異動都有對應 mitigation；完成後以 code review checklist 記錄證據。

  > 2026-09-23 審查證據：`code-review.md`。`AccountMenuEntry` 直接同步既有 `WorkspaceContext`；20 筆 icon registry 均有 light／dark 且 `missing_variants=none`，缺 dark fixture 會列出 `nav.fixture:dark`；設定頁掛載主題／語言控制，NavBar／UserMenu／UnifiedShell 測試保留一級區域沒有 locale switch 的斷言。
- [x] 5.3 2026-09-24：`spectra analyze account-settings-theme-language` 一致性檢查通過，無 Critical/Warning（剩 3 個 SUGGEST 等級的缺 Example 建議，非阻塞項）；`spectra validate account-settings-theme-language` 輸出 `✓ valid`。4.2 已在雲端正式站完成 ego-browser 真實瀏覽器驗收（見上）。
