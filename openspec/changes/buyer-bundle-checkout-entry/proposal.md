## Why

排查發現後端結帳邏輯其實已經完整支援 Bundle 購買：`/api/checkout`（`apps/saas/app/api/checkout/route.ts`）與 `/api/coupons/validate` 都已經接受任意 `productId`，透過 `packages/payments/catalog.ts` 的 `getProduct(productId)` 查詢——傳 `startkiter-mvp` 得到固定 8800 商品，傳其他值會查 `packages/bundles` 的 `getBundleById`，回傳該 bundle 自己的 `priceTwd`。這是先前 `core-module-bundles-coupons` SR 已經做好的商品目錄抽象。

但買家端完全沒有入口能觸發這條路徑：`/checkout` 頁面與其 `CheckoutButton` 元件把 `sku`／`productId` 寫死成 `"startkiter-mvp"`，顯示金額也寫死 `8800`；沒有任何頁面能讓買家瀏覽已發布的 Bundle、看到 Bundle 詳情、或用某個 Bundle 的 id 發起結帳。等於「能建商品、能設價格」跟「買家能實際買到」中間斷了一截——這是這次要補的唯一缺口，後端不需要新增邏輯。

## What Changes

- 修改 `apps/saas/app/(authenticated)/checkout/checkout-button.tsx`：改成接收 `product: { productId, title, amount }` 這樣的 prop，內部用這個 prop 決定送給 `/api/checkout`／`/api/coupons/validate` 的 `productId`（不再寫死 `"startkiter-mvp"`），MVP 商品維持用同一個元件、傳入 MVP 的 productId/title/amount 作為預設值，`/checkout` 頁面既有行為不變
- 修改 `apps/saas/app/(authenticated)/checkout/page.tsx`：改用新的 prop 傳法呼叫 `CheckoutButton`（傳入 MVP 商品資訊），行為不變，只是把原本內部寫死的字串改成明確傳入
- 新增 `apps/saas/app/(authenticated)/bundles/[slug]/page.tsx`：買家可存取的 Bundle 詳情頁，顯示 Bundle 標題、描述、價格、包含的課程清單（用 `packages/bundles` 既有的 `getBundleBySlug`，此函式已經是為了這個頁面預先寫好，之前的 SR 明確標註「Phase 2 尚未實作該頁面」），未發布（`status !== "published"`）的 bundle 回 404；已購買過此 Bundle 的使用者顯示「已擁有」狀態並連結去看課程，未購買則顯示 `CheckoutButton`（傳入該 bundle 的 productId/title/amount）
- 新增 `apps/saas/app/(authenticated)/bundles/page.tsx`：Bundle 瀏覽列表頁，列出所有 `status === "published"` 的 Bundle（用既有的 `listPublishedBundles()`），每個顯示標題/價格/簡述，連結到對應的 `bundles/[slug]` 詳情頁
- 新增測試驗證：草稿（`draft`）與封存（`archived`）狀態的 Bundle 不會出現在瀏覽列表，且直接訪問其詳情頁回 404
- 新增測試驗證：已購買某 Bundle 的買家再次造訪該 Bundle 詳情頁，看到的是「已擁有」狀態而不是重複購買按鈕

## Non-Goals (optional)

- 不修改 `/api/checkout`、`/api/coupons/validate` 這兩個 API route 的邏輯，後端商品目錄查詢與訂單建立邏輯已經完整支援 bundle，這次只是把前端接上既有的 API 介面
- 不新增 Bundle 的行銷/促銷展示（例如首頁 banner、精選推薦），只做最基本的瀏覽列表 + 詳情頁 + 購買入口
- 不處理 Bundle 折扣碼以外的定價策略（滿額折扣、限時優惠等），優惠券機制沿用既有 `/api/coupons/validate`
- 不新增 Bundle 購買後的專屬歡迎流程（例如訂閱制常見的 onboarding），購買後行為比照現有 MVP 購買：`courseAccess` 生效、可進對應課程

## Capabilities

### Modified Capabilities

- `course-bundles`: 新增買家可存取的瀏覽/詳情/購買入口需求（既有的「Bundle purchase grants access to all included courses」「Bundle listing API returns published bundles only」等後端行為需求不變，這次新增的是前端可達性）

## Impact

- Affected specs: course-bundles
- Affected code:
  - Modified: `apps/saas/app/(authenticated)/checkout/checkout-button.tsx`、`apps/saas/app/(authenticated)/checkout/page.tsx`
  - New: `apps/saas/app/(authenticated)/bundles/[slug]/page.tsx`、`apps/saas/app/(authenticated)/bundles/page.tsx`
  - Removed: (none)
