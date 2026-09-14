▋ Bug 1 手動驗證紀錄

• 個人版 `/settings/billing`：`apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx` 渲染 `ChangePlan` → `PricingTable` → `usePlanData()`。

• 組織版 `[organizationSlug]/settings/billing`：同路徑用同一個 `ChangePlan` / `usePlanData()` hook。

• 單元測試 `apps/saas/modules/payments/hooks/plan-data.test.tsx` 對 zh-tw / zh-cn / en 三語系斷言 `startkiter-mvp.title` 不是原始 key、features 不是逐字元拆散、`free.title` 仍可用（來自 shared.json merge）。三語系全綠。

• `pricing.products.free`：`requireActiveSubscription === false`，但 free 文案已存在於 `packages/i18n/translations/*/shared.json`，saas scope merge 後可讀，無需在 saas.json 重複補。

• 預期畫面文案（zh-tw）：標題「StartKiter 開站包」、說明含課與終身 GitHub 代碼包、features 三條完整句子，不會再出現 `pricing.products.startkiter-mvp.title` 或單字元列表。
