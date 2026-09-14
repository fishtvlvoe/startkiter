## Why

Fish 在驗收 `course-page-ssr-fanout-optimization` SR 時，順手走過其他頁面，發現兩個既有 UI 問題：(1) `/settings/billing`（個人版）與 `[organizationSlug]/settings/billing`（組織版）方案選擇頁整頁顯示原始翻譯 key 與逐字拆散的亂碼文字，而不是正常的商品名稱/說明；(2) 側邊欄底部帳號區塊的 email 文字在深色模式下幾乎看不見（文字顏色跟背景色太接近）。這兩個都是既有 bug，跟目前進行中的其他 SR 無關，先記錄下來排入修復佇列。

排查已確認兩個問題的根因：

1. **billing 頁翻譯亂碼**：`apps/saas/modules/payments/hooks/plan-data.tsx` 的 `usePlanData()` 讀取 `pricing.products.${planId}.title` 等翻譯 key，`packages/payments/config.ts` 定義的方案 id 是 `startkiter-mvp`。查證 `packages/i18n/translations/{locale}/saas.json`（`apps/saas` 實際載入的翻譯檔，見 `apps/saas/modules/i18n/lib/messages.ts` 的 `getMessages(locale, "saas")`）完全沒有 `pricing.products.startkiter-mvp` 這個 key——這組翻譯內容只存在於 `packages/i18n/translations/{locale}/marketing.json`（`apps/marketing` 讀的檔案，不是 `apps/saas` 讀的檔案）。next-intl 找不到 key 時 fallback 顯示原始 key 字串，`t.raw()` 對不存在的 key 回傳字串本身，`Object.values()` 對字串逐字元拆解，就是畫面上看到的亂碼成因。
2. **側邊欄 email 深色模式看不見**：`apps/saas/modules/shared/components/UserMenu.tsx` 顯示 email 的 `<span className="text-xs block opacity-70">{email}</span>` 沒有設定任何顯式文字顏色 class，依賴從父層 `<button>` 繼承顏色；根因需要在 apply 階段實際用瀏覽器開發工具檢查深色模式下實際套用的顏色值來源（可能是 button 元素預設顏色未被 Tailwind 正確重置，或某個祖先容器有寫死顏色），這裡先記錄現象與已知的排查起點，不預設最終修法。

## What Changes

- 修改 `packages/i18n/translations/zh-tw/saas.json`（以及其他既有支援語系檔：`zh-cn`、`en`，依專案 i18n 範圍決定，見 CLAUDE.md「i18n 起跳 zh-tw／zh-cn／en」）：新增 `pricing.products.startkiter-mvp`（`title`／`description`／`features`）與 `pricing.products.free`（若 `usePlanData()` 邏輯需要）對應的翻譯內容，內容比照 `marketing.json` 既有的 `pricing.products.startkiter-mvp` 文案（避免兩邊文案不一致，直接複製調整）
- 修改 `apps/saas/modules/shared/components/UserMenu.tsx`：修正側邊欄帳號區塊 email 文字在深色模式下的顏色，確保與背景有足夠對比（實際 class 或修法待 apply 階段依實際排查結果決定）

## Non-Goals (optional)

- 不處理 `/settings/billing`（訂閱方案選擇頁）本身是否應該存在的問題：這個頁面是 supastarter 範本原生的訂閱方案 UI，這次只修翻譯顯示 bug，不評估這個頁面在這個產品（一次性買斷為主）裡的定位是否需要調整或移除，那是產品範疇的決策，不在這次 bug fix 範圍
- 不做深色模式的全站配色審查，只修這次回報的側邊欄 email 這一個具體問題點；如果之後發現其他深色模式對比度問題，另開 change 處理
- 不修改 `usePlanData()` 本身的翻譯 key 查詢邏輯，只補齊缺少的翻譯內容資料

## Impact

- Affected specs: none（純翻譯內容補齊與 CSS 顏色修正，不改變任何功能行為，屬於視覺呈現修復）
- Affected code:
  - Modified: `packages/i18n/translations/zh-tw/saas.json`（及其他語系對應檔案）、`apps/saas/modules/shared/components/UserMenu.tsx`
  - New: (none)
  - Removed: (none)
- Compatibility: no capability-level observable behavior changes
