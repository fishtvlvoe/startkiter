# 實作與掃描紀錄

## Blog／Changelog／Course／Legal／Contact 掃描

| 範圍 | 判定 | 處理 |
| --- | --- | --- |
| `apps/marketing/content/posts/*.mdx` | 修正 | 移除模板 Blog 圖片與假產品敘事，改成 StartKiter 課程、代碼包與模組內容。 |
| `apps/marketing/content/legal/{privacy-policy,terms}{,.de}.md` | 修正 | 移除模板 placeholder，改成 StartKiter 帳號、訂單、付款、代碼交付與一次買斷條款摘要。 |
| `packages/i18n/translations/*/marketing.json` 的 `blog`／`changelog`／`contact` | 修正 | 六語描述改為實際產品、開發更新與聯絡用途。 |
| `packages/i18n/translations/*/marketing.json` 的 `home`／`pricing` | 修正 | 六語首頁賣點、FAQ、單一 NT$8,800 一次買斷商品與可掛載模組內容完成。 |
| `packages/i18n/translations/*/marketing.json` 的 `documentation` | 不需修改 | 頁面標籤與通用說明中性，未宣稱不存在的產品能力。 |
| `packages/i18n/translations/*/marketing.json` 的 `common`／`notFound` | 不需修改 | 導覽、錯誤頁與版權格式為中性 UI 文字；另已修正 Cookie consent 的模板語氣。 |
| `apps/marketing/app/[locale]/blog/**` 與 `modules/blog/**` | 不需修改 | 內容讀取、locale fallback 與 Blog UI 路徑正確，文案由 content／i18n 提供。 |
| `apps/marketing/app/[locale]/changelog/**` 與 `modules/changelog/**` | 修正 | 只保留實際 `packageLaunch` changelog entry，移除模板靜態 key。 |
| `apps/marketing/app/[locale]/course/**` | 不需修改 | 頁面路徑與課程預覽流程是既有功能；本 change 只更新其對外內容來源。 |
| `apps/marketing/app/[locale]/legal/**` 與 `app/[locale]/contact/**` | 不需修改 | 路由、表單與內容讀取流程無模板資料問題；內容檔與 i18n 已完成修正。 |

## 可見模板視覺

- `HeroWireframe`、`FeaturePreview`、`TestimonialsSection` 移除假數字、假客戶身份、假頭像與模板計費視覺。
- `PricingSection` 顯示單一 StartKiter 商品、`NT$8,800` 與各語言「一次買斷」標籤。
- `Logo` 的品牌文字改為 StartKiter；未修改 `apps/saas`。
