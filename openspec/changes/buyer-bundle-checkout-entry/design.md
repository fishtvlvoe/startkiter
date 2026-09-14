## Context

排查確認後端商品目錄與結帳邏輯已經完整支援 Bundle：`packages/payments/catalog.ts` 的 `getProduct(productId)`、`/api/checkout`、`/api/coupons/validate` 三者都已經是 productId 驅動（不限定 MVP SKU），`packages/bundles/src/catalog.ts` 甚至已經有一個明確為了這個頁面預先寫好的函式：

```
/**
 * 公開 bundle 銷售頁（`/bundles/[slug]`，Phase 2 尚未實作該頁面，屬於 tasks.md 7.2）用的查詢邏輯：
 * 只有 status="published" 才視為「找得到」，draft／archived／不存在皆回傳 null，
 * 頁面拿到 null 時呼叫 notFound() 即對應 Requirement「Draft bundle is not publicly visible」的 404。
 */
export async function getBundleBySlug(slug: string): Promise<Bundle | null>
```

這個函式的行為（draft/archived/不存在都回傳 null）已經完全對應這次要做的頁面需求，不需要修改。`listPublishedBundles()` 也已存在，回傳所有 `status === "published"` 的 Bundle。

唯一缺的是買家端頁面本身：`checkout-button.tsx` 目前寫死 `sku`／`productId` 為 `"startkiter-mvp"`，沒有任何頁面呼叫 `getBundleBySlug`／`listPublishedBundles`。

## Goals / Non-Goals

**Goals:**

- 買家能瀏覽已發布的 Bundle 清單，點進去看詳情，並完成購買
- `CheckoutButton` 元件能重複用於 MVP 商品與任意 Bundle，不寫死商品資訊
- 已經對某 Bundle 所有課程都有存取權的使用者，看到「已擁有」而不是重複購買按鈕

**Non-Goals:**

- 不修改任何後端 API（`/api/checkout`、`/api/coupons/validate`、`packages/bundles`、`packages/payments/catalog.ts`），這些都已經是 productId 驅動且行為正確
- 不做公開（未登入）瀏覽，這次的瀏覽列表與詳情頁一律要求登入（比照現有 `/checkout` 頁面用 `AuthWrapper` 的模式），登入牆本身不是這次的討論重點
- 不做 Bundle 行銷/促銷版位、精選推薦排序邏輯

## Decisions

### CheckoutButton 改成接收 product prop，呼叫端負責提供商品資訊

`CheckoutButton` 目前內部寫死三處：`startCheckout()` 送給 `/api/checkout` 的 `sku: "startkiter-mvp"`、`handleApplyCoupon()` 送給 `/api/coupons/validate` 的 `productId: "startkiter-mvp"`、`displayAmount` 預設值 `8800`。改成 `CheckoutButton({ product }: { product: { productId: string; title: string; amount: number } })`，元件內部三處全部改用 `product.productId`／`product.amount`，按鈕文字改成 `購買${product.title} NT$${displayAmount}`（原本寫死「購買開站包」）。`startCheckout()` 送給 `/api/checkout` 的 body 改成只送 `productId: product.productId`，不再送 `sku` 欄位（`/api/checkout` 的 `if ("sku" in body)` 檢查只在 body 包含 `sku` 時才驗證是否為 MVP_SKU，不送這個欄位就不會誤擋 bundle 購買，這是既有 route.ts 邏輯本來就支援的行為，不需要修改 route.ts）。`/checkout/page.tsx` 呼叫 `CheckoutButton` 時明確傳入 `product: { productId: MVP_SKU, title: "開站包", amount: MVP_AMOUNT_TWD }`（從 `@startkiter/payments` import 既有常數，不重新寫死數字）。

**Alternatives Considered:**
- 另外寫一個 `BundleCheckoutButton` 新元件，`CheckoutButton` 保留給 MVP 專用不動：否決，兩者的結帳邏輯（coupon 驗證、建立訂單、導向金流頁）完全相同，只有商品資訊不同，重複寫兩份元件會造成之後金流邏輯異動要改兩處，違反 DRY

### Bundle 詳情頁用 canAccessCourseId 逐一檢查 bundle 內每堂課，全部通過才顯示「已擁有」

Bundle 詳情頁（`bundles/[slug]/page.tsx`）判斷「這個使用者要不要顯示購買按鈕」時，不是查「有沒有一筆 sku=這個bundle id 的訂單」（那只能證明「透過這個 bundle 買過」，查不到透過訂閱／邀請／其他 bundle 涵蓋到同樣課程的情境），而是對 `bundle.courseIds` 裡每一個 courseId 呼叫既有的 `userCanAccessCourseId(userId, courseId)`（`packages/api/modules/course/lib/course-access.ts`），全部回傳 `true` 才視為「已擁有」顯示課程連結，只要有一堂課沒有權限就顯示購買按鈕（顯示金額仍是整個 bundle 的價格，這次不做「補差額購買缺少的那幾堂課」這種部分購買邏輯）。這樣寫的附加好處：`admin-role-full-access-bypass` SR 完成後，admin 角色的使用者造訪任何 Bundle 詳情頁都會自動判定為「已擁有」，行為一致不需要額外處理。

**Alternatives Considered:**
- 查訂單表裡 `sku === bundle.id` 的付款記錄：否決，語意上「已經能看到這些課程內容」比「有沒有透過這個特定 bundle 付過款」更貼近使用者實際關心的問題（使用者關心「要不要花錢」，不是「透過哪個管道取得的」），且這種寫法查不到訂閱/邀請/其他 bundle 涵蓋的情境，會讓已經能看課程的使用者被要求重複付款

## Implementation Contract

**行為：**
- 已登入使用者造訪 `/bundles` 看到所有 `status === "published"` 的 Bundle 清單（標題、價格、簡述），draft/archived 的 Bundle 不出現
- 已登入使用者造訪 `/bundles/[slug]`：slug 對應已發布 Bundle 時顯示詳情（標題、描述、價格、包含課程清單）；slug 對應不存在、draft 或 archived 的 Bundle 時回 404（`notFound()`）
- 使用者對 Bundle 內所有課程都已有存取權時，詳情頁顯示「已擁有」與前往課程的連結；否則顯示 `CheckoutButton`，點擊後走既有結帳流程（`/api/checkout` 建立訂單 → 導向金流頁 → 付款完成後透過既有的 PAYUNi webhook 與 `course-bundles` capability 既有的「Bundle purchase grants access to all included courses」需求授權）
- `/checkout`（MVP 商品）既有行為完全不變：畫面文字、金額、購買後行為都跟這次改動前一致

**驗證方式：**
- 新增測試：`CheckoutButton` 傳入不同 `product` prop 時，送給 `/api/checkout`／`/api/coupons/validate` 的 body 正確反映該 product 的 productId，不會意外送出寫死的 `"startkiter-mvp"`
- 新增測試：`/bundles` 頁面只列出 published 狀態的 Bundle，draft／archived 不出現（用 mock `listPublishedBundles` 驗證，或整合測試建立三種狀態的 Bundle 各一筆後驗證頁面渲染結果）
- 新增測試：`/bundles/[slug]` 對 draft／archived／不存在的 slug 回 404
- 新增測試：使用者對 bundle 內所有課程都有存取權時顯示「已擁有」，缺任一堂課的權限時顯示購買按鈕
- 既有 `/checkout`（MVP）相關測試全部維持通過，逐一比對這次改動前後行為一致
- 手動驗證：正式站建立一個測試用途的低調測試 Bundle（例如把既有的 course-pack 相關課程綁一個 Bundle），走一次完整瀏覽 → 詳情 → 購買 → 付款 → 看到「已擁有」的流程

**範圍邊界：**
- 只新增買家端的瀏覽/詳情/購買入口，不改動任何後端 API 或 Bundle 資料模型
- 不做未登入瀏覽、行銷版位、精選排序
- 不處理部分擁有（缺幾堂課）的差額購買邏輯

## Risks / Trade-offs

[Risk] `CheckoutButton` 改變 props 介面是破壞性變更（若有其他地方直接引用這個元件且沒有同步更新），可能導致 build 失敗或執行期錯誤 → Mitigation: 這次改動範圍內先 grep 確認 `CheckoutButton` 只有 `/checkout/page.tsx` 這一個既有呼叫點（新增的 `/bundles/[slug]/page.tsx` 是這次新寫的），修改元件簽章的同時一併更新這唯一的既有呼叫點，TypeScript 型別檢查會在編譯期抓到任何遺漏的呼叫點

[Risk] Bundle 詳情頁對每堂課都呼叫 `userCanAccessCourseId`，如果一個 Bundle 包含很多堂課，會產生對應數量的資料庫查詢，在極端情況下可能有效能疑慮 → Mitigation: 這次規模下 Bundle 通常只包含少數幾堂課（產品設計上是課程組合，不是整個課程庫），查詢量可忽略；若之後 Bundle 規模變大，`userCanAccessCourseId` 內部的存取判斷（`packages/course/access.ts`）本身可以之後再做批次化優化，不影響這次的正確性

## Migration Plan

- 純新增頁面 + 修改既有元件簽章，走正常 CI/CD（合併 main → Coolify 自動部署），沒有資料庫變更
- 回滾策略：如果新頁面有問題，直接 revert 該次 commit 重新部署；`CheckoutButton` 的 prop 變更若需要回滾，連同呼叫端一起 revert，不會有資料層面需要清理的東西
