## 1. 紅燈測試：證明 CheckoutButton 目前寫死商品資訊

- [x] 1.1 在 `apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx`（若無則新建）為「CheckoutButton 應該用傳入的 product prop 決定送給 /api/checkout 的 productId」寫紅燈測試：render 時傳入 `product: { productId: "combo-a", title: "測試組合", amount: 5000 }`，模擬點擊購買，斷言 fetch 到 `/api/checkout` 的 body 包含 `productId: "combo-a"`，交付：測試檔案存在且執行後為紅燈（目前元件不接受 product prop，型別或執行都會失敗）。驗證：跑該測試觀察到失敗。

## 2. 實作：CheckoutButton 改成接收 product prop

- [x] 2.1 [after: 1.1] 修改 `apps/saas/app/(authenticated)/checkout/checkout-button.tsx`：元件簽章改成 `CheckoutButton({ product }: { product: { productId: string; title: string; amount: number } })`；`startCheckout()` 送給 `/api/checkout` 的 body 改成 `{ productId: product.productId, invoicePreference, couponCode }`（移除 `sku` 欄位）；`handleApplyCoupon()` 送給 `/api/coupons/validate` 的 body 改成 `{ code, productId: product.productId }`；`displayAmount` 的預設值改成 `product.amount`（有優惠券時仍用 `appliedCoupon.finalAmount`）；購買按鈕文字改成 `` `購買${product.title} NT$${displayAmount.toLocaleString()}` ``，交付：Decision「CheckoutButton 改成接收 product prop，呼叫端負責提供商品資訊」成立。驗證：1.1 的紅燈測試轉綠燈。
- [x] 2.2 [after: 2.1] 修改 `apps/saas/app/(authenticated)/checkout/page.tsx`：從 `@startkiter/payments` import `MVP_SKU`、`MVP_AMOUNT_TWD` 既有常數，呼叫 `<CheckoutButton product={{ productId: MVP_SKU, title: "開站包", amount: MVP_AMOUNT_TWD }} />`，交付：Implementation Contract 裡「/checkout（MVP 商品）既有行為完全不變」成立。驗證：既有的 checkout page 測試（若存在）維持通過；手動或自動化驗證頁面顯示文字、金額跟修改前一致。

## 3. 紅燈測試：證明 Bundle 詳情頁與瀏覽頁目前不存在

- [x] 3.1 為「/bundles/[slug] 對已發布 Bundle 回 200 並顯示標題/價格/課程清單」寫紅燈測試（新建 `apps/saas/app/(authenticated)/bundles/[slug]/page.test.tsx`），交付：測試檔案存在且執行後為紅燈（目前路由不存在，回 404 或找不到模組）。驗證：跑該測試觀察到失敗。
- [x] 3.2 為「/bundles/[slug] 對 draft／archived／不存在的 slug 回 404」寫紅燈測試，交付：測試檔案存在且執行後為紅燈。驗證：跑該測試觀察到失敗。
- [x] 3.3 為「/bundles 列表頁只列出 published 狀態的 Bundle」寫紅燈測試（新建 `apps/saas/app/(authenticated)/bundles/page.test.tsx`），交付：測試檔案存在且執行後為紅燈。驗證：跑該測試觀察到失敗。

## 4. 實作：Bundle 詳情頁

- [x] 4.1 [after: 3.1] 新增 `apps/saas/app/(authenticated)/bundles/[slug]/page.tsx`：用 `getSession()` 確認登入（未登入導向 `/login?next=/bundles/[slug]`，比照 `/checkout` 頁面模式），用 `getBundleBySlug(slug)`（`packages/bundles`）查詢，回傳 `null` 時呼叫 Next.js `notFound()`，交付：滿足 specs/course-bundles/spec.md 裡「Courses can be grouped into a priced bundle」需求下「Draft bundle is not publicly visible」與「Operator creates a published bundle」兩個既有 scenario 對應到這個實際頁面的行為。驗證：3.1、3.2 的紅燈測試轉綠燈。
- [x] 4.2 [after: 4.1] 在同一個頁面內，對 `bundle.courseIds` 每一個 courseId 呼叫 `userCanAccessCourseId(session.user.id, courseId)`（`packages/api/modules/course/lib/course-access.ts`），全部回傳 true 時顯示「已擁有」狀態與前往課程的連結，否則顯示 `CheckoutButton`（`product={{ productId: bundle.id, title: bundle.title, amount: bundle.priceTwd }}`），交付：Decision「Bundle 詳情頁用 canAccessCourseId 逐一檢查 bundle 內每堂課，全部通過才顯示已擁有」成立，同時滿足 specs/course-bundles/spec.md 新增的「Signed-in buyer without access sees a purchase entry point on the bundle page」「Signed-in buyer with access to every course in the bundle sees an owned state instead of a purchase entry point」「Signed-in buyer with access to only some courses in the bundle still sees a purchase entry point」三個 scenario。驗證：新增測試涵蓋「全部課程都有權限」「部分課程有權限」「完全沒權限」三種情境，斷言畫面內容符合預期。

## 5. 實作：Bundle 瀏覽列表頁

- [x] 5.1 [after: 3.3] 新增 `apps/saas/app/(authenticated)/bundles/page.tsx`：用 `getSession()` 確認登入，用 `listPublishedBundles()`（`packages/bundles`）取得清單，逐一渲染標題、價格、簡述，連結到 `/bundles/${bundle.slug}`，交付：滿足 specs/course-bundles/spec.md 新增的「Buyer-facing bundle browse page lists published bundles」需求。驗證：3.3 的紅燈測試轉綠燈。

## 6. Review

- [x] 6.1 Review：另一個 CLI（非實作 2、4、5 的那個）針對本次改動做獨立 code review，聚焦「CheckoutButton 的 productId 傳遞有沒有意外遺漏或寫錯」「已擁有判斷邏輯（4.2）有沒有正確涵蓋 bundle 內所有課程，不是只查第一堂」「/bundles/[slug] 對未發布 bundle 的 404 邊界情境是否確實涵蓋」，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆到 PM。
- [x] 6.2 全部確認沒問題後，跑一次完整測試套件（pnpm --filter saas test），交付：測試全數通過。驗證：測試輸出顯示 0 failed。

## 7. 部署與手動驗證

- [ ] 7.1 [after: 6.2] commit 並 push 到 origin/main，觸發 Coolify 部署，交付：新版本真正上線運行。驗證：SSH 確認正式站容器運行的 image tag 與 git HEAD commit 一致。
- [ ] 7.2 [after: 7.1] 在正式站後台（`admin/bundles`）建立一個測試用途的 Bundle（明確標註是測試資料，價格可以設低一點方便驗證，狀態設為 published），走一次完整流程：`/bundles` 看得到該 Bundle → 點進 `/bundles/[slug]` 看到詳情與購買按鈕 → 點擊購買完成一次真實或 sandbox 付款 → 付款後回到 `/bundles/[slug]` 看到「已擁有」狀態，交付：Success Criteria「買家能瀏覽、查看詳情並完成購買」成立。驗證：記錄手動驗證的操作步驟與觀察結果，並記錄測試用 Bundle 事後是否需要清理或標記為 archived。
