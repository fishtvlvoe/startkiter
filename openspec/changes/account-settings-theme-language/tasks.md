<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立失敗測試

- [ ] 1.1 [P] 讓「Account menu settings entries are derived from WorkspaceContext」在三種 `WorkspaceContext`（app/app-user、app/app-admin、platform）下產生對應的入口可見性矩陣；先建立 `ACCOUNT_MENU_ENTRIES` 的 visibility test。
- [ ] 1.2 [P] 讓「Theme and locale controls live only inside user settings」在一級選單找不到主題／語言控制項、使用者設定頁找得到時通過；先建立對應 component test。
- [ ] 1.3 [P] 讓「Icons ship as paired light and dark SVG assets」在缺 `light` 或 `dark` 版本時失敗；先建立 icon asset check script 與缺版本 fixture。
- [ ] 1.4 [P] 讓「Shared navigation and account components use semantic color tokens」在元件出現 hardcoded 深色文字 class 時失敗；先建立 token-usage static check。
- [ ] 1.5 [P] 讓「Account menu and settings entries stay usable at desktop and mobile widths」在 `1440px`／`390px` viewport 下有明確的無溢出斷言；先建立 responsive component test。

## 2. 建立帳號選單核心

- [ ] 2.1 依「Account menu settings entries are derived from WorkspaceContext」與「Interface and data shape」實作 `AccountMenuEntry` 型別與 `ACCOUNT_MENU_ENTRIES`，`visibleWhen` 直接讀 `role-based-workspace-navigation` 的 `WorkspaceContext`；完成後三種角色看到正確入口組合（「Observable behavior」的可見性矩陣），並以 1.1 測試驗證。
- [ ] 2.2 依「Theme and locale controls live only inside user settings」把既有主題／語言切換元件從一級選單移到使用者設定頁；完成後一級選單不再出現這兩個控制項，並以 1.2 測試驗證。
- [ ] 2.3 依「Shared navigation and account components use semantic color tokens」移除 `NavBar.tsx` 與帳號選單元件的 hardcoded 深色文字 class，改用語意 token；完成後 static check 通過，並以 1.4 測試驗證。

## 3. 補齊 icon 資產

- [ ] 3.1 依「Icons ship as paired light and dark SVG assets」與「Failure behavior」盤點既有 icon 清單，補齊缺少的 light／dark 版本並接上 icon asset check；完成後每個已註冊 icon 都有兩版，缺版本會被 CI 擋下，並以 1.3 測試驗證。
- [ ] 3.2 依「dark mode selects the dark icon asset」讓 shell 依目前 color mode 選用對應 icon 版本；完成後切換主題時 icon 隨之切換而非用 CSS filter 轉色，並以 component test 截圖對照驗證。

## 4. Responsive 與驗收

- [ ] 4.1 依「Account menu and settings entries stay usable at desktop and mobile widths」調整帳號選單在 `1440px`／`390px` 的版面；完成後不出現水平溢出或內容被遮住，並以 1.5 測試驗證。
- [ ] 4.2 依「Acceptance criteria」在部署後以 ego-browser 對三種角色各驗一次 dark／light／system 與 `zh-tw`／`zh-cn`／`en`；完成後帳號選單、文字顏色、icon 版本、桌面／手機皆正常，並保留截圖證據。

## 5. Review、風險與交付

- [ ] 5.1 依「Scope boundaries」檢查 diff 只涉及帳號選單、主題／語言落腳位置、icon 資產與語意 token，不觸碰 `WorkspaceContext`／resolver 邏輯本身、新 App 加入規則或各設定頁的真實業務選項內容；完成後以 `git diff --stat` 與檔案清單 review 驗證。
- [ ] 5.2 依「Risks / Trade-offs」逐項確認型別同步、icon 缺版本佔位與語言切換位置異動都有對應 mitigation；完成後以 code review checklist 記錄證據。
- [ ] 5.3 完成 self-review、`spectra analyze account-settings-theme-language` 與 `spectra validate account-settings-theme-language`；完成後 analyzer 無未處理 warning、validation exit 0，並附上測試與瀏覽器驗收輸出。
