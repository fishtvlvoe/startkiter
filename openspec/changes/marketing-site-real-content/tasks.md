## 1. 紅燈測試

- [x] 1.1 `packages/payments/config.test.ts` 斷言只有 `startkiter-mvp`，且價格恰好為 one-time／8800／TWD；涵蓋 Requirement「Pricing section displays the actual product offer」。
- [x] 1.2 `packages/i18n/marketing-pricing-keys.test.ts` 斷言 zh-tw／zh-cn／en／de／fr／es 六語 pricing 文案完整且非空。
- [x] 1.3 `packages/i18n/marketing-demo-content.test.ts` 掃描 i18n 與 marketing 內容，禁止模板身份與可見模板文案殘留。

## 2. 商品定價資料源頭

- [x] 2.1 Decision: 定價區塊改用單一商品卡片，不比照 supastarter 三層訂閱方案排版硬套。`packages/payments/config.ts` 只保留 `startkiter-mvp` 一次買斷 8800 TWD；已核對具體 plan key 呼叫點與型別契約。

## 3. 行銷網站 i18n 內容修正

- [x] 3.1 [P] Decision: i18n 內容改動涵蓋全部六個語言檔，但以 zh-tw 為準稿、其餘語言先用直譯佔位。zh-tw 首頁 Hero／Features／Testimonials／FAQ 與 pricing 文案改為 StartKiter 真實產品內容；涵蓋 Requirement「Home page hero, features, testimonials, and FAQ content reflects the real product」。
- [x] 3.2 [P] zh-cn 完成對應簡體中文內容。
- [x] 3.3 [P] en 完成對應英文內容。
- [x] 3.4 [P] de 完成對應德文內容。
- [x] 3.5 [P] fr 完成對應法文內容。
- [x] 3.6 [P] es 完成對應西文內容。

## 4. README 部署段落修正

- [x] 4.1 Decision: README 部署段落改為文字說明現行 Coolify+VPS 方向，不放尚未完成的具體操作步驟。README 已移除 Zeabur，改成 Coolify + VPS 說明並指向 `docs/coolify-vps-setup-runbook.md`；涵蓋 Requirement「README deployment instructions do not reference a retired deploy target」。

## 5. 掃描其餘行銷頁面

- [x] 5.1 已掃描 Blog／Changelog／Course／Legal／Contact 對應內容；修正檔案與不需修改項目見 `implementation-notes.md`。

## 6. Review 與驗證

- [x] 6.1 payments／i18n／UI／marketing 測試、marketing type-check 與 build 全部 exit 0；全 repo test 為 20/20。
- [x] 6.2 完成兩輪獨立 Codex Code Review；最終 Critical／High／Medium／Low 均為 0，原 Medium findings 已修正並重審。
- [ ] 6.3 用 ego-browser 驗證 zh-tw／zh-cn／en production 首頁，確認單一 NT$8,800 一次買斷商品與真實文案，留下三張截圖。
- [x] 6.4 `spectra analyze marketing-site-real-content --json` 的 Coverage／Consistency／Gaps 為 Clean、僅 Ambiguity Suggestions；`spectra validate` 通過，0 warnings／0 errors。
- [x] 6.5 已核對 design.md acceptance／scope：模板身份 grep 為空、未觸碰 `apps/saas`，實測暴露的 `PricingSection.tsx`／`HeroWireframe.tsx` 修正均在範圍內。
