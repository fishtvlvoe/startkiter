## 1. Bug 1：billing 頁翻譯亂碼

- [x] 1.1 為「/settings/billing 頁面顯示的方案標題不是原始翻譯 key」寫紅燈測試：對 `usePlanData()`（或整合測試渲染該頁面）斷言 `planData["startkiter-mvp"].title` 不等於字串 `"pricing.products.startkiter-mvp.title"`、且 `features` 陣列不是逐字元拆散的結果，交付：測試檔案存在且執行後為紅燈（目前 `saas.json` 缺這個 key，斷言會失敗）。驗證：跑該測試觀察到失敗，失敗內容顯示回傳值就是原始 key 字串。
- [x] 1.2 [after: 1.1] 修改 `packages/i18n/translations/zh-tw/saas.json`：新增 `pricing.products.startkiter-mvp`（`title`／`description`／`features`，`features` 用物件包多個字串比照 `usePlanData()` 的 `Object.values()` 讀法）與（若 `requireActiveSubscription` 為 false 則一併補）`pricing.products.free` 對應內容，文案內容比照 `packages/i18n/translations/zh-tw/marketing.json` 既有的 `pricing.products.startkiter-mvp` 段落調整用詞使其適合帳單頁情境，交付：「/settings/billing 頁面顯示正確翻譯內容」成立。驗證：1.1 的紅燈測試轉綠燈。
- [x] 1.3 [after: 1.2] 對 `packages/i18n/translations/zh-cn/saas.json`、`packages/i18n/translations/en/saas.json`（CLAUDE.md 記載的既有支援語系）比照 1.2 補上對應翻譯內容，交付：非 zh-tw 語系造訪 `/settings/billing` 也不會顯示原始 key。驗證：跑 `packages/i18n` 既有的翻譯完整性測試（若有，例如檢查所有語系 key 集合一致的測試）確認通過；若無這類既有測試，手動核對三個語系檔案都新增了相同結構的 key。
- [x] 1.4 手動驗證 `/settings/billing`（個人版）與 `[organizationSlug]/settings/billing`（組織版，若該頁面也用同一個 `usePlanData()` hook）畫面顯示正常的商品名稱、說明、功能清單，不再出現原始 key 或逐字元拆散的文字，交付：Bug 1 修復完成。驗證：記錄手動驗證的畫面截圖或明確文字描述。

## 2. Bug 2：側邊欄帳號 email 深色模式看不見

- [x] 2.1 用瀏覽器開發工具（或等效方式）在深色模式下檢查 `apps/saas/modules/shared/components/UserMenu.tsx` 渲染出的 email `<span>` 元素，找出實際生效的文字顏色值與其繼承來源（是哪個祖先元素或全域 CSS 規則決定了這個顏色），交付：一份記錄根因（哪個檔案哪行 CSS／class 決定了這個顏色、為什麼深色模式下對比度不足）的筆記，存放於 `openspec/changes/startkiter-ui-polish-bugs/dark-mode-email-color-notes.md`。驗證：筆記內容有具體的元素/class/顏色值佐證，不是憑空猜測。
- [x] 2.2 [after: 2.1] 依 2.1 找到的根因，修改 `apps/saas/modules/shared/components/UserMenu.tsx`（或根因所在的其他檔案），讓 email 文字在深色模式與淺色模式下都跟背景有足夠對比（比照專案既有的 `text-muted-foreground` 或等效語意化顏色 class 寫法，不要寫死固定色碼），交付：Bug 2 修復完成。驗證：手動在深色模式與淺色模式下分別截圖側邊欄帳號區塊，確認 email 文字在兩種模式下都清楚可讀。

## 3. Review 與收尾

- [x] 3.1 跑一次完整測試套件（pnpm --filter saas test），交付：測試全數通過，確認這次改動沒有破壞其他頁面的翻譯或樣式。驗證：測試輸出顯示 0 failed。
- [x] 3.2 [after: 3.1] commit 並 push 到 origin/main，觸發 Coolify 部署，交付：新版本真正上線運行。驗證：SSH 確認正式站容器運行的 image tag 與 git HEAD commit 一致；並在正式站實際造訪 `/settings/billing` 與側邊欄（深色模式）確認兩個 bug 都已修復。**實際結果**：代碼早已包含在目前正式站運行的 image（`1da01fde`，經 `git merge-base --is-ancestor` 確認）不需重新部署。ego-browser 實際造訪 `/settings/billing`，方案名稱/說明正常顯示中文文案（無翻譯 key 亂碼），側邊欄帳號區塊 email 文字在深色模式下清楚可讀，兩個 bug 皆確認修復。截圖 /tmp/ui-polish-billing.png。
