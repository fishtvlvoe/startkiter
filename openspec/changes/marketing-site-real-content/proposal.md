## Why

行銷網站（`apps/marketing`）首頁目前渲染的是 supastarter 原始模板的展示假資料：定價區塊因為 i18n 缺 `pricing` key 而整段空白、Hero/Features/Testimonials/FAQ 區塊的文案與範例引言（`Acme`／`Maya Chen`／訂閱制帳單）跟 StartKiter 實際賣的「NT$8800 一次買斷課＋終身代碼包」完全無關，訪客第一眼看到的是壞掉或錯誤的產品資訊，直接影響能不能賣。README 的一鍵部署段落也還留著已作廢的 Zeabur 選項，跟 2026-08-22 已定案改用 Coolify+VPS 的方向不同步。

## What Changes

- 修改 `packages/payments/config.ts`：把 supastarter demo 的 `pro`／`lifetime`／`enterprise` 訂閱制方案定義，換成 StartKiter 實際商品（`startkiter-mvp` 一次買斷 8800 TWD，對應 `mvp-offer` spec 既有的商品邊界），供行銷頁定價區塊正確渲染
- 新增 `packages/i18n/translations/{zh-tw,zh-cn,en,de,fr,es}/marketing.json` 的 `pricing` 區塊翻譯 key（`pricing.badge`／`title`／`description`／`products.<planId>.{title,description,features}`／`getStarted`／`contactSales` 等 `PricingSection.tsx` 實際會讀取的 key），修正定價區塊目前渲染空白的問題
- 修改同幾份語言檔的 `home.hero`（含 `preview` 子物件）、`home.features`、`home.testimonials`、`home.faq` 內容：把 supastarter demo 文案（多租戶登入/帳單/組織功能、`Acme`／`Maya Chen`／`Jonas Weber`／`Amelia Ortiz` 假使用者與假引言、訂閱制退款/試用問答）換成描述 StartKiter 實際產品（課程＋終身代碼包、GitHub 私有 repo 交付、可掛載模組平台架構）的內容
- 修改根目錄 `README.md`「一鍵部署」段落：移除已作廢的 Zeabur 部署按鈕/連結，改成指向現行 Coolify+VPS 部署方向的說明文字（不含實際部署步驟，實際步驟由另一張 change 負責）
- 掃描 `apps/marketing` 其餘頁面（`blog`／`changelog`／`course`／`legal`／`contact`）對應的 i18n 內容，標記是否同樣殘留未替換的 demo 資料，若發現則列入本次 Impact 一併修正；若內容本身中性（不涉及具體產品事實，例如版權聲明格式）則不動

## Capabilities

### New Capabilities

- `marketing-site-content`：`apps/marketing` 對外呈現的產品內容（定價、首頁賣點、常見問題）必須反映 StartKiter 實際商品事實，不得殘留未替換的範本展示資料

### Modified Capabilities

(none)

## Impact

- Affected specs: `marketing-site-content`（新增）
- Affected code：
  - Modified:
    - `apps/marketing/config.ts`
    - `apps/marketing/content/legal/privacy-policy.de.md`
    - `apps/marketing/content/legal/privacy-policy.md`
    - `apps/marketing/content/legal/terms.de.md`
    - `apps/marketing/content/legal/terms.md`
    - `apps/marketing/content/posts/first-post.de.mdx`
    - `apps/marketing/content/posts/first-post.mdx`
    - `apps/marketing/content/posts/guest-access.mdx`
    - `apps/marketing/content/posts/second-post.mdx`
    - `apps/marketing/modules/changelog/components/ChangelogSection.tsx`
    - `apps/marketing/modules/home/components/FeaturePreview.tsx`
    - `apps/marketing/modules/home/components/FeaturesSection.tsx`
    - `apps/marketing/modules/home/components/HeroWireframe.tsx`
    - `apps/marketing/modules/home/components/PricingSection.tsx`
    - `apps/marketing/modules/home/components/TestimonialsSection.tsx`
    - `apps/marketing/modules/shared/components/Footer.tsx`
    - `apps/marketing/tests/blog.spec.ts`
    - `apps/marketing/tests/home.spec.ts`
    - `packages/payments/config.ts`
    - `packages/i18n/translations/zh-tw/marketing.json`
    - `packages/i18n/translations/zh-cn/marketing.json`
    - `packages/i18n/translations/en/marketing.json`
    - `packages/i18n/translations/de/marketing.json`
    - `packages/i18n/translations/fr/marketing.json`
    - `packages/i18n/translations/es/marketing.json`
    - `packages/ui/components/logo.tsx`
    - `packages/ui/components/ui.test.tsx`
    - `README.md`
  - New:
    - `apps/marketing/tests/changelog.spec.ts`
    - `packages/i18n/marketing-demo-content.test.ts`
    - `packages/i18n/marketing-pricing-keys.test.ts`
    - `packages/payments/config.test.ts`
    - `openspec/changes/marketing-site-real-content/implementation-notes.md`
  - Removed:
    - `apps/marketing/modules/home/lib/dummy-portraits.ts`
- Dependencies 新增：無
- 環境變數新增：無
