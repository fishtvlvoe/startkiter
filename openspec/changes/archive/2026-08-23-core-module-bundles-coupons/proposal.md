## Why

StartKiter 目前只有一個固定商品：SKU 恆為 `startkiter-mvp`、金額恆為 8800 TWD。老闆已定案要把 THE-TU 的 bundles（課程綁定包）與 coupons（優惠券）當「核心基本模組」抽取進來，這是「多課程要不要分開賣」這個急迫問題風險最低的解法——不依賴訂閱制或 PAYUNi 定期扣款開發（那是另一張 `payuni-recurring-billing` change 的範圍），現在就能動工。

## What Changes

- 新增 `packages/bundles/`：課程綁定包資料模型與定價邏輯，抽取自 THE-TU（`dev/thetu/app/(admin)/admin/bundles`、`dev/thetu/app/(main)/bundles`）
- 新增 `packages/coupons/`：折扣碼驗證與套用邏輯，抽取自 THE-TU（`dev/thetu/app/api/coupon/validate`、`dev/thetu/app/(admin)/admin/coupons`）
- **BREAKING** 修改 `packages/payments/constants.ts`：`MVP_SKU`／`MVP_AMOUNT_TWD` 從寫死常數改為可查詢的商品目錄，結帳時依商品 id（單一 MVP SKU 或某個 bundle id）查價
- 修改 `packages/payments/order.ts` 與 `apps/saas/app/api/checkout/route.ts`：結帳流程支援帶入 coupon code，驗證後套用折扣計算實付金額
- 修改 `packages/platform/src/mount-points.ts`：新增 bundles 管理頁與 coupons 管理頁兩個 operator-only 選單項目
- 新增資料庫遷移：`Bundle`、`BundleItem`（bundle 內含哪些課程）、`Coupon` 三張表

## Non-Goals

- 不做訂閱制定價與週期扣款（另一張 change：`payuni-recurring-billing`）
- 不做多幣別，v1 仍只有 TWD
- 不做「首購限定」「會員等級限定」等複雜 coupon 規則，v1 coupon 只支援：固定金額折扣或百分比折扣、可選有效期限、可選最大使用次數
- 不做 bundle 內課程內容本身的編輯功能（章節/單元編輯屬於另一張「課程管理後台編輯器」change）
- 不做電子報、發票、作業、課程邀請等其他 THE-TU 模組（各自獨立 change，見 `docs/discuss/2026-08-21-thetu-core-modules-architecture.html` 排程表）

## Capabilities

### New Capabilities

- `course-bundles`: 多個課程可以被組成一個「綁定包」商品，有自己獨立於單一課程的定價
- `checkout-coupons`: 結帳時可輸入折扣碼，系統驗證有效性（存在／未過期／未達使用上限）並套用折扣計算實付金額

### Modified Capabilities

- `mvp-offer`: 「Single MVP SKU price」與「MVP SKU constant is startkiter-mvp」這兩條 Requirement 放寬——v1 原本鎖死「只有一個 SKU、金額恆為 8800」，改為「商品目錄可包含多個 bundle，各自獨立定價，原本的 MVP SKU 商品維持 8800 TWD 不變」
- `v1-scope-boundary`: 「v1 take-home capabilities」裡「currency MUST be TWD and amount MUST be 8800」這條，放寬為「currency MUST be TWD，amount 依商品目錄（含原 MVP SKU 與新增 bundle）決定，非任意商品皆可自訂價格」

## Impact

- Affected specs: `course-bundles`（新）、`checkout-coupons`（新）、`mvp-offer`（改）、`v1-scope-boundary`（改）
- Affected code:
  - New: `packages/bundles/src/index.ts`、`packages/bundles/src/catalog.ts`、`packages/bundles/package.json`、`packages/bundles/tsconfig.json`、`packages/coupons/src/index.ts`、`packages/coupons/src/validate.ts`、`packages/coupons/package.json`、`packages/coupons/tsconfig.json`、`apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx`、`apps/saas/app/(authenticated)/(main)/(account)/admin/coupons/page.tsx`、`apps/saas/app/api/bundles/route.ts`、`apps/saas/app/api/coupons/validate/route.ts`、`packages/database/prisma/migrations/`（新 migration：Bundle／BundleItem／Coupon 三張表）
  - Modified: `packages/payments/constants.ts`、`packages/payments/order.ts`、`apps/saas/app/api/checkout/route.ts`、`packages/platform/src/mount-points.ts`、`packages/database/prisma/schema.prisma`
  - Removed: 無
- Dependencies 新增：無新套件依賴，沿用既有 `packages/payments`、`packages/course`、`packages/platform` 的既有 workspace 相依
- 環境變數新增：無
