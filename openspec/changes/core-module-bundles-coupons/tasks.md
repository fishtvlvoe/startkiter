## Phase 1：抽取對應建立 packages/bundles、packages/coupons 型別與資料表（抽取對應：THE-TU → StartKiter）

### 1. 紅燈測試：Bundle／Coupon 資料表

- [x] 1.1 [P] 撰寫測試驗證 Requirement「Courses can be grouped into a priced bundle」——插入含 status="published" 與兩個有效 courseId 的 Bundle 後可查回，courseIds 對應寫入 BundleCourse
- [x] 1.2 [P] 撰寫測試驗證同一 Requirement 的「Bundle referencing a nonexistent course is rejected」scenario——courseIds 含不存在課程 id 時建立函式回傳失敗且不寫入資料庫
- [x] 1.3 [P] 撰寫測試驗證 Requirement「Bundle listing API returns published bundles only」——status="draft" 的 Bundle 不出現在查詢結果

### 2. 實作：Bundle／BundleCourse／Coupon 資料表與型別

- [x] 2.1 新增 Prisma migration 建立 `Bundle`、`BundleCourse`、`Coupon` 三張表（design.md DB DDL），驗證：1.1、1.2、1.3 轉綠燈
- [x] 2.2 新增 `packages/bundles/src/types.ts`、`packages/bundles/package.json`、`packages/bundles/tsconfig.json`，依 `docs/buyer-extension-convention.md` 慣例，匯出 `Bundle` 型別（design.md Interface 定義）
- [x] 2.3 新增 `packages/coupons/src/types.ts`、`packages/coupons/package.json`、`packages/coupons/tsconfig.json`，匯出 `Coupon` 型別（design.md Interface 定義）

### 3. Phase 1 Review 與驗收

- [x] 3.1 對 `packages/bundles/`、`packages/coupons/`、新 migration 跑 correctness / security code review，Critical 為零（PM 覆核：schema DDL 逐欄比對 design.md 一致，courseIds 驗證邏輯用交易＋事前查詢擋不存在課程 id，無 SQL injection 風險，secrets 掃描無匹配）
- [x] 3.2 `pnpm type-check` 通過（PM 自行重跑確認：database/bundles/coupons 三個套件皆 Done，另跑 database 全套測試 3 files/8 tests 全綠，無回歸）

## Phase 2：實作 Bundle CRUD 與存取權整合（抽取對應：THE-TU → StartKiter）

### 4. 紅燈測試：Bundle CRUD 與存取權

- [ ] 4.1 [P] 撰寫測試驗證 Requirement「Courses can be grouped into a priced bundle」的「Operator creates a published bundle」scenario——operator 送出合法 bundle 後，公開 bundle 頁面對該 slug 回 200
- [ ] 4.2 [P] 撰寫測試驗證同一 Requirement 的「Draft bundle is not publicly visible」scenario——status="draft" 的 bundle 公開頁面回 404
- [ ] 4.3 [P] 撰寫測試驗證 Requirement「Bundle purchase grants access to all included courses」——模擬 PAYUNi 標記 bundle 訂單已付款後，買家對 bundle 內每一個 courseId 皆取得存取權（含兩堂課的具體範例）
- [ ] 4.4 [P] 撰寫測試驗證同一 Requirement 的「Refunded bundle revokes access to all its courses」scenario——退款後 bundle 內所有課程存取權一併撤銷
- [ ] 4.5 [P] 撰寫測試驗證 Requirement「Bundle listing API returns published bundles only」——未登入請求 GET /api/bundles 回 200 且僅含已發布項目

### 5. 實作：Bundle CRUD API 與課程存取權整合

- [ ] 5.1 新增 `packages/bundles/src/catalog.ts`，實作建立/查詢 bundle 邏輯，courseIds 驗證比照 THE-TU `model Bundle` 設計但簡化欄位（design.md「抽取對應」表），驗證：1.1、1.2 轉綠燈
- [ ] 5.2 新增 `apps/saas/app/api/bundles/route.ts`（GET 公開、POST operator 限定），驗證：4.1、4.2、4.5、1.3 轉綠燈
- [ ] 5.3 修改課程存取權判斷邏輯（`packages/course/src/access.ts` 的 `canAccessCourse` 或對應授權查詢），擴充為「buyer 已購買的 bundle 若包含該課程，亦視為有存取權」，驗證：4.3 轉綠燈
- [ ] 5.4 修改退款流程，退款 bundle 訂單時撤銷該 bundle 內所有課程的存取權，驗證：4.4 轉綠燈

### 6. Demo-first：Bundle 前後台頁面靜態 HTML demo

- [ ] 6.1 為 bundle 管理頁（operator 後台）與 bundle 銷售頁（前台）各製作一份靜態 HTML demo 放入 `docs/design-system-demo/`，後台頁沿用 platform-shell-plugin-architecture 定案的 WordPress Admin 視覺語彙，老闆確認後才進下一步 React 實作

### 7. 實作：Bundle 前後台頁面

- [ ] 7.1 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx`（operator 後台管理頁），依 6.1 確認過的 demo 實作
- [ ] 7.2 新增 `apps/saas/app/(main)/bundles/[slug]/page.tsx`（前台銷售頁），依 6.1 確認過的 demo 實作
- [ ] 7.3 修改 `packages/platform/src/mount-points.ts`，新增 bundles 管理頁選單項目（`requiresOperator: true`）

### 8. Phase 2 Review 與驗收

- [ ] 8.1 對 Phase 2 全部變更跑 correctness / security / performance code review，特別檢查 bundle 存取權整合是否有遺漏，Critical 為零
- [ ] 8.2 用 Chrome MCP 截圖 bundle 管理頁與銷售頁，比對 demo 確認一致
- [ ] 8.3 `pnpm build` 與 `pnpm test` 通過

## Phase 3：實作 Coupon 驗證與結帳整合（抽取對應：THE-TU → StartKiter；Coupon 驗證邏輯放進獨立 packages/coupons/，不放進 packages/payments/）

### 9. 紅燈測試：Coupon 驗證邏輯

- [ ] 9.1 [P] 撰寫測試驗證 Requirement「Coupon validation endpoint checks code validity without leaking existence via status code」的「Valid unexpired coupon under redemption limit」scenario——固定金額折扣範例（SAVE100 折抵 100 元，原價 8800 → 8700）
- [ ] 9.2 [P] 撰寫測試驗證同一 scenario 的百分比折扣範例——SAVE20PCT 20% 折扣但 maxDiscountAmount=500 上限，原價 8800 → 8300（非 7040）
- [ ] 9.3 [P] 撰寫測試驗證「Nonexistent code returns 200 with not_found reason」——不存在的 code 回 200 而非 404，reason="not_found"
- [ ] 9.4 [P] 撰寫測試驗證「Expired coupon is rejected」——expiresAt 早於現在回 reason="expired"
- [ ] 9.5 [P] 撰寫測試驗證「Coupon not yet started is rejected」——startsAt 晚於現在回 reason="not_started"
- [ ] 9.6 [P] 撰寫測試驗證「Coupon at redemption limit is rejected」——timesRedeemed 等於非 null 非零的 maxRedemptions 時回 reason="max_redemptions_reached"

### 10. 實作：Coupon 驗證邏輯與 API

- [ ] 10.1 依 design.md 決策「Coupon 驗證邏輯放進獨立 `packages/coupons/`，不放進 `packages/payments/`」，新增 `packages/coupons/src/validate.ts`，實作折扣計算邏輯（固定金額／百分比＋上限），不 import `packages/payments/` 內部檔案，驗證：9.1、9.2 轉綠燈
- [ ] 10.2 補齊 not_found／expired／not_started／max_redemptions_reached 四種失敗分支，一律回傳 valid:false + reason，不用 404，驗證：9.3、9.4、9.5、9.6 轉綠燈
- [ ] 10.3 新增 `apps/saas/app/api/coupons/validate/route.ts`，串接 10.1／10.2 的驗證函式

### 11. 紅燈測試：Rate limit 與結帳整合

- [ ] 11.1 [P] 撰寫測試驗證 Requirement「Rate limit protects against brute-force enumeration」——同一 client identifier 短時間超過門檻後續請求回 429
- [ ] 11.2 [P] 撰寫測試驗證 Requirement「Checkout applies a validated coupon to compute the charged amount」的「Checkout with valid coupon charges discounted amount」scenario——帶合法 couponCode 結帳，Order 金額為折扣後金額
- [ ] 11.3 [P] 撰寫測試驗證同一 Requirement 的「Checkout with invalid coupon code fails closed」scenario——帶失效 couponCode 結帳回 400 且不建立 Order
- [ ] 11.4 [P] 撰寫測試驗證同一 Requirement 的「Checkout without a coupon code charges full price」scenario——未帶 couponCode 時金額不變，行為與改造前一致

### 12. 實作：Rate limit 與結帳整合

- [ ] 12.1 對 `POST /api/coupons/validate` 加上 rate-limit（比照既有 StartKiter API 慣例；若尚無既有慣例則本任務一併建立最小可用版本），驗證：11.1 轉綠燈
- [ ] 12.2 修改 `apps/saas/app/api/checkout/route.ts`，接受可選 `couponCode`，伺服器端重新驗證（不信任前端算好的折扣），驗證：11.2、11.3、11.4 轉綠燈

### 13. Phase 3 Review 與驗收

- [ ] 13.1 對 `packages/coupons/`、checkout 路由變更跑 correctness / security / performance code review，特別檢查是否有信任前端折扣金額的漏洞，Critical 為零
- [ ] 13.2 `curl -X POST /api/coupons/validate` 對有效碼與無效碼分別驗證回傳格式符合 spec 範例
- [ ] 13.3 `pnpm build` 與 `pnpm test` 通過

## Phase 4：商品目錄改造取代寫死常數（商品目錄取代寫死常數）

### 14. 紅燈測試：商品目錄與既有行為相容性

- [ ] 14.1 [P] 撰寫測試驗證 Requirement「Single MVP SKU price」的「Checkout amount is 8800 TWD for the MVP SKU」scenario——未帶 productId 或 productId="startkiter-mvp" 時金額恆為 8800（改造前後行為一致）
- [ ] 14.2 [P] 撰寫測試驗證同一 Requirement 的「Checkout amount for a bundle product uses the bundle's configured price」scenario——帶已發布 bundle 的 productId 時金額等於該 bundle 價格，非 8800
- [ ] 14.3 [P] 撰寫測試驗證 Requirement「MVP SKU constant is startkiter-mvp」的「Created order for a bundle stores the bundle's own product id」scenario——bundle 訂單的 productId 欄位等於該 bundle id

### 15. 實作：商品目錄

- [ ] 15.1 新增 `packages/payments/src/catalog.ts`，實作 `getProduct(productId)`：未傳入或傳入 "startkiter-mvp" 時回傳既有 MVP_SKU/MVP_AMOUNT_TWD/MVP_CURRENCY 常數組成的結果，其餘視為 bundle id 查 `packages/bundles`，驗證：14.1、14.2 轉綠燈
- [ ] 15.2 修改 `apps/saas/app/api/checkout/route.ts`，改為呼叫 15.1 的 `getProduct` 取得金額與 sku，`productId` 預設值 "startkiter-mvp"，驗證：14.3 轉綠燈
- [ ] 15.3 確認既有 `packages/payments/src/order.ts`、`packages/payments/src/constants.ts` 的既有測試（不帶 productId 的情境）全數仍為綠燈，行為與改造前一致

### 16. Phase 4 Review 與驗收

- [ ] 16.1 對商品目錄改造跑 correctness / security review，特別檢查 **BREAKING** 變更是否真的向後相容（未傳 productId 時行為不變），Critical 為零
- [ ] 16.2 `pnpm build` 與 `pnpm test` 全專案通過（含既有 payuni-checkout 相關測試）

## Phase 5：既有 spec 對齊與全面驗收（v1 take-home capabilities）

### 17. 既有規則對齊確認

- [ ] 17.1 對照 mvp-offer 的「Single MVP SKU price」與「MVP SKU constant is startkiter-mvp」修訂後內容，逐一檢查既有測試斷言（`packages/payments/src/order.test.ts` 等）是否需要調整為「MVP SKU 固定 8800，但商品目錄可有其他項目」，需要調整的逐一修正並保持綠燈
- [ ] 17.2 對照 v1-scope-boundary 的「v1 take-home capabilities」修訂後內容，確認新增的 bundle/coupon 能力已在實際代碼中對應存在

### 18. 全面驗收

- [ ] 18.1 `pnpm build` 與 `pnpm test` 全專案通過
- [ ] 18.2 用假資料跑一次完整流程：建立 bundle → 建立 coupon → 買家用 coupon 折扣價完成 bundle 結帳 → 確認取得 bundle 內全部課程存取權 → 退款 → 確認存取權撤銷，保存實際輸出
- [ ] 18.3 `spectra validate core-module-bundles-coupons` 通過，0 warnings
