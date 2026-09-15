## Why

`/settings/billing` 帳單頁的「選擇方案」按鈕（`apps/saas/modules/payments/components/PricingTable.tsx`）呼叫的是 supastarter 原廠內建、給 Stripe/LemonSqueezy/Creem/DodoPayments 用的通用訂閱制結帳流程（`createCheckoutLink` → 需要 `packages/payments/config.ts` 的 `plans["startkiter-mvp"].prices[].priceId`），但這個產品實際販售、真正接了金流的購買入口是 `/checkout` 頁面，走的是 PAYUNi（台灣金流）。這兩套系統從未接上，`config.ts` 裡也從未設定過 `priceId`。結果是帳單頁按鈕點了永遠失敗（QA 巡查 BUG-02，`site-wide-functional-qa-sweep` SR 已補上前端錯誤提示讓使用者至少看得到失敗訊息，但沒解決根本問題：這顆按鈕本來就接錯系統，不是「priceId 沒填」）。

## What Changes

- `/settings/billing` 頁面的「選擇方案」按鈕，行為從「呼叫 `createCheckoutLink`」改成「導向 `/checkout`」（真正能用 PAYUNi 結帳的頁面）。
- 若使用者已經買過（`userHasCourseAccess` 回傳 true），帳單頁比照 `/checkout` 頁面自己的邏輯，顯示已擁有狀態並提供連結導向 `/course`，不顯示購買按鈕。
- 確認改動後帳單頁不再出現任何呼叫失敗的錯誤提示（因為不再呼叫那個沒接上的系統）。

## Non-Goals

- 不移除 `packages/payments/provider/{stripe,lemonsqueezy,creem,dodopayments}/` 底下的 provider 程式碼本身，也不移除 `apps/saas/app/api/stripe` webhook route——這些牽涉的範圍比單一頁面的按鈕行為大（webhook route 還在，移除是否安全需要額外調查），留到後續視情況另開 SR 處理，這次只改前端導頁行為。
- 不修改 `/checkout` 頁面本身既有邏輯、`CheckoutButton`、PAYUNi 串接、收款閘道設定頁。
- 不新增優惠券、訂閱制、多方案選擇等新功能，帳單頁維持顯示單一 `startkiter-mvp` 方案。

## Capabilities

### New Capabilities

- `billing-page-purchase-entry`: `/settings/billing` 頁面的購買入口導向真正接通金流的 `/checkout` 頁面，而不是呼叫未接通的通用訂閱制結帳流程

### Modified Capabilities

(none)

## Impact

- Affected specs: `billing-page-purchase-entry`（新增）
- Affected code:
  - Modified: `apps/saas/modules/payments/components/PricingTable.tsx`（或在 `/settings/billing` 頁面層級改，實作時依現有元件邊界判斷放在哪一層較合理）
  - Verified/Unchanged: `apps/saas/app/(authenticated)/checkout/page.tsx`、`packages/payments/provider/*`（僅讀取確認邏輯，不修改）
