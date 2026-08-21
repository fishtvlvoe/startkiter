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

- [x] 4.1 [P] 撰寫測試驗證 Requirement「Courses can be grouped into a priced bundle」的「Operator creates a published bundle」scenario——operator 送出合法 bundle 後，公開 bundle 頁面對該 slug 回 200（7.2 頁面未落地前，測試對象是 `getBundleBySlug` 查詢契約，非真實 HTTP 200；等 7.2/8.2 頁面實作後要再用真實頁面驗一次）
- [x] 4.2 [P] 撰寫測試驗證同一 Requirement 的「Draft bundle is not publicly visible」scenario——status="draft" 的 bundle 公開頁面回 404（同上，測試對象是查詢契約回傳 null，7.2 頁面要用 `notFound()` 接手才是真的 404）
- [x] 4.3 [P] 撰寫測試驗證 Requirement「Bundle purchase grants access to all included courses」——模擬 PAYUNi 標記 bundle 訂單已付款後，買家對 bundle 內每一個 courseId 皆取得存取權（含兩堂課的具體範例）；`packages/bundles/src/access-integration.test.ts`，真實 DB 驗證
- [x] 4.4 [P] 撰寫測試驗證同一 Requirement 的「Refunded bundle revokes access to all its courses」scenario——退款後 bundle 內所有課程存取權一併撤銷；同上測試檔
- [x] 4.5 [P] 撰寫測試驗證 Requirement「Bundle listing API returns published bundles only」——未登入請求 GET /api/bundles 回 200 且僅含已發布項目

### 5. 實作：Bundle CRUD API 與課程存取權整合

- [x] 5.1 新增 `packages/bundles/src/catalog.ts`，實作建立/查詢 bundle 邏輯，courseIds 驗證比照 THE-TU `model Bundle` 設計但簡化欄位（design.md「抽取對應」表），驗證：1.1、1.2 轉綠燈
- [x] 5.2 新增 `apps/saas/app/api/bundles/route.ts`（GET 公開、POST operator 限定），驗證：4.1、4.2、4.5、1.3 轉綠燈
- [x] 5.3 修改課程存取權判斷邏輯（`packages/course/src/access.ts` 的 `canAccessCourse` 或對應授權查詢），擴充為「buyer 已購買的 bundle 若包含該課程，亦視為有存取權」，驗證：4.3 轉綠燈（新增 `canAccessCourseId`，`canAccessCourse` 保留不動以維持既有行為；**尚未接進 `apps/saas/lib/course-access.ts` 等真實課程頁面/API**，追蹤於新增的 15.4）
- [x] 5.4 修改退款流程，退款 bundle 訂單時撤銷該 bundle 內所有課程的存取權，驗證：4.4 轉綠燈（既有 `markOrderRefundedInDb` 本來就不分 sku，無需改邏輯，只補文件註解）

### 6. Demo-first：Bundle 前後台頁面靜態 HTML demo

- [x] 6.1 為 bundle 管理頁（operator 後台）與 bundle 銷售頁（前台）各製作一份靜態 HTML demo 放入 `docs/design-system-demo/`，後台頁沿用 platform-shell-plugin-architecture 定案的 WordPress Admin 視覺語彙，老闆確認後才進下一步 React 實作（已產出並發布 Artifact，等老闆視覺確認才可進 7.1/7.2）

### 7. 實作：Bundle 前後台頁面

- [x] 7.1 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx`（operator 後台管理頁），依 6.1 確認過的 demo 實作（列表+新增/編輯表單，用 `@startkiter/ui` 元件；實作時發現 Phase 2 只做了 CREATE，demo 卻有編輯/刪除，補了 `updateBundle`/`deleteBundle`（`packages/bundles/src/catalog.ts`）+ `PUT`/`DELETE /api/bundles/:id` + `GET /api/bundles/admin`（operator 專用列表，`GET /api/bundles` 依 spec 只能回已發布不能共用），design.md 已同步補這幾支端點）
- [x] 7.2 新增 `apps/saas/app/(main)/bundles/[slug]/page.tsx`（前台銷售頁），依 `docs/design-canvas/bundle-sales-page/Main.dc.html`／`Dark.dc.html` 定案版本實作（比 6.1 demo 更新，用真實 olive/primary token，深色模式沿用專案既有 `next-themes` 機制自動運作）。結帳按鈕與優惠券暫時 disabled 顯示「準備中」——Phase 3（Coupon）、Phase 4（結帳支援 productId）還沒做，先放行會讓買家以為買 bundle 卻被結帳成 MVP 單一課程，money-integrity 風險，故意擋住
- [x] 7.3 修改 `packages/platform/src/mount-points.ts`，新增 bundles 管理頁選單項目（`requiresOperator: true`），並補一則單元測試（`mount-points.test.ts`）

### 8. Phase 2 Review 與驗收

- [x] 8.1 對 Phase 2 全部變更跑 correctness / security / performance code review，特別檢查 bundle 存取權整合是否有遺漏，Critical 為零（PM 覆核：無 SQL injection、operator gate 在 body 解析前執行、draft bundle 不可枚舉、退款是整筆 all-or-nothing 撤銷無 partial-revocation 漏洞。發現 5.3 新函式未接進真實課程頁面的缺口，已補 15.4 追蹤）
- [x] 8.2 用真實資料行為驗證取代截圖比對（PM 執行）：`pnpm dev` 啟動後灌一筆真實 Bundle+2 門課，curl 驗證 `GET /api/bundles` 回真資料、`GET /bundles/<slug>` 200 且頁面含正確標題/金額/課程 id、`GET /bundles/<不存在slug>` 404、`GET /api/bundles/admin` 未登入 401、`GET /admin/bundles` 未登入 307 導去登入頁；驗證後清除測試資料，`GET /api/bundles` 確認回空陣列
- [x] 8.3 `pnpm build` 與 `pnpm test` 通過（PM 自行重跑：bundles 7/7、course 48/48、saas 71/71 全綠；`pnpm build`/`type-check` 唯一失敗點是既有未 commit 的 `apps/saas/app/api/repo-version/route.ts`，與本次改動無關，非本輪範圍）

## Phase 3：實作 Coupon 驗證與結帳整合（抽取對應：THE-TU → StartKiter；Coupon 驗證邏輯放進獨立 packages/coupons/，不放進 packages/payments/）

### 9. 紅燈測試：Coupon 驗證邏輯

- [x] 9.1 [P] 撰寫測試驗證 Requirement「Coupon validation endpoint checks code validity without leaking existence via status code」的「Valid unexpired coupon under redemption limit」scenario——固定金額折扣範例（SAVE100 折抵 100 元，原價 8800 → 8700）
- [x] 9.2 [P] 撰寫測試驗證同一 scenario 的百分比折扣範例——SAVE20PCT 20% 折扣但 maxDiscountAmount=500 上限，原價 8800 → 8300（非 7040）
- [x] 9.3 [P] 撰寫測試驗證「Nonexistent code returns 200 with not_found reason」——不存在的 code 回 200 而非 404，reason="not_found"
- [x] 9.4 [P] 撰寫測試驗證「Expired coupon is rejected」——expiresAt 早於現在回 reason="expired"
- [x] 9.5 [P] 撰寫測試驗證「Coupon not yet started is rejected」——startsAt 晚於現在回 reason="not_started"
- [x] 9.6 [P] 撰寫測試驗證「Coupon at redemption limit is rejected」——timesRedeemed 等於非 null 非零的 maxRedemptions 時回 reason="max_redemptions_reached"

### 10. 實作：Coupon 驗證邏輯與 API

- [x] 10.1 依 design.md 決策「Coupon 驗證邏輯放進獨立 `packages/coupons/`，不放進 `packages/payments/`」，新增 `packages/coupons/src/validate.ts`，實作折扣計算邏輯（固定金額／百分比＋上限），不 import `packages/payments/` 內部檔案，驗證：9.1、9.2 轉綠燈
- [x] 10.2 補齊 not_found／expired／not_started／max_redemptions_reached 四種失敗分支，一律回傳 valid:false + reason，不用 404，驗證：9.3、9.4、9.5、9.6 轉綠燈
- [x] 10.3 新增 `apps/saas/app/api/coupons/validate/route.ts`，串接 10.1／10.2 的驗證函式

### 11. 紅燈測試：Rate limit 與結帳整合

- [x] 11.1 [P] 撰寫測試驗證 Requirement「Rate limit protects against brute-force enumeration」——同一 client identifier 短時間超過門檻後續請求回 429
- [x] 11.2 [P] 撰寫測試驗證 Requirement「Checkout applies a validated coupon to compute the charged amount」的「Checkout with valid coupon charges discounted amount」scenario——帶合法 couponCode 結帳，Order 金額為折扣後金額
- [x] 11.3 [P] 撰寫測試驗證同一 Requirement 的「Checkout with invalid coupon code fails closed」scenario——帶失效 couponCode 結帳回 400 且不建立 Order
- [x] 11.4 [P] 撰寫測試驗證同一 Requirement 的「Checkout without a coupon code charges full price」scenario——未帶 couponCode 時金額不變，行為與改造前一致

### 12. 實作：Rate limit 與結帳整合

- [x] 12.1 對 `POST /api/coupons/validate` 加上 rate-limit（比照既有 StartKiter API 慣例；若尚無既有慣例則本任務一併建立最小可用版本），驗證：11.1 轉綠燈
- [x] 12.2 修改 `apps/saas/app/api/checkout/route.ts`，接受可選 `couponCode`，伺服器端重新驗證（不信任前端算好的折扣），驗證：11.2、11.3、11.4 轉綠燈

### 13. Phase 3 Review 與驗收

- [x] 13.1 對 `packages/coupons/`、checkout 路由變更跑 correctness / security / performance code review，特別檢查是否有信任前端折扣金額的漏洞，Critical 為零（PM 覆核：checkout 一律伺服器端重呼叫 `validateCoupon` 取 `finalAmount`，不信任前端數字；`buildPendingOrderInput` 只守上限 `<= MVP_AMOUNT_TWD`；PAYUNi notify 改比對 `order.amount`（下單當下鎖定）而非寫死常數，堵住折扣訂單付款金額對不上的漏洞；rate-limit 用 `x-forwarded-for` 當 key，v1 已知限制是可被偽造，非本輪要解的問題，記錄於此）
- [x] 13.2 `curl -X POST /api/coupons/validate` 對有效碼與無效碼分別驗證回傳格式符合 spec 範例（PM 執行：`pnpm dev` port 3001，灌真實 coupon `E2ETEST100`，驗證大小寫皆命中、原價 8800→8700、不存在碼回 200+not_found、缺 code 回 400，驗證後清除測試資料）
- [x] 13.3 `pnpm build` 與 `pnpm test` 通過（PM 自行重跑：coupons/payments/bundles/checkout/rate-limit 相關 12 files/51 tests 全綠；`pnpm --filter @startkiter/saas build` 成功，`/api/coupons/validate` 正確註冊；`nav-menu-items.test.ts` 6/7 失敗為既有 platform-shell WIP 遺留，非本輪改動造成，已記錄於 platform-shell-plugin-architecture/tasks.md 50.4）

## Phase 4：商品目錄改造取代寫死常數（商品目錄取代寫死常數）

### 14. 紅燈測試：商品目錄與既有行為相容性

- [x] 14.1 [P] 撰寫測試驗證 Requirement「Single MVP SKU price」的「Checkout amount is 8800 TWD for the MVP SKU」scenario——未帶 productId 或 productId="startkiter-mvp" 時金額恆為 8800（改造前後行為一致）
- [x] 14.2 [P] 撰寫測試驗證同一 Requirement 的「Checkout amount for a bundle product uses the bundle's configured price」scenario——帶已發布 bundle 的 productId 時金額等於該 bundle 價格，非 8800
- [x] 14.3 [P] 撰寫測試驗證 Requirement「MVP SKU constant is startkiter-mvp」的「Created order for a bundle stores the bundle's own product id」scenario——bundle 訂單的 productId 欄位等於該 bundle id

### 15. 實作：商品目錄

- [x] 15.1 新增 `packages/payments/catalog.ts`（實際檔案結構是 flat，不是 design.md 寫的 `src/`，跟既有 payments 套件慣例一致），實作 `getProduct(productId)`：未傳入或傳入 "startkiter-mvp" 時回傳既有 MVP_SKU/MVP_AMOUNT_TWD/MVP_CURRENCY 常數組成的結果，其餘視為 bundle id 查 `packages/bundles`（未發布/不存在回傳 null），驗證：14.1、14.2 轉綠燈
- [x] 15.2 修改 `apps/saas/app/api/checkout/route.ts`，改為呼叫 15.1 的 `getProduct` 取得金額與 sku，`productId` 預設值 "startkiter-mvp"，商品不存在回 404；同步把 `packages/payments/order.ts` 的 `buildPendingOrderInput` 上限檢查改成只對 `sku === MVP_SKU` 生效（bundle 價格是動態的，不能套 8800 上限），並把回傳物件的 `sku` 改成真的用傳入值而非寫死 `MVP_SKU`；`/api/coupons/validate` 也一併改用 `getProduct` 取代原本自己重複寫的 `resolveOriginalAmount`（DRY），驗證：14.3 轉綠燈
- [x] 15.3 確認既有 `packages/payments/order.test.ts`、`packages/payments/notify.test.ts`（不帶 productId 的情境）全數仍為綠燈，行為與改造前一致（PM 執行：13/13 通過，含新增的 discounted-amount 案例）
- [ ] 15.4（2026-08-21 老闆裁決：本輪不做，等買家播放頁做出來才接）PM 審查時發現：`packages/course/access.ts` 的 `canAccessCourseId`（bundle-aware 存取權判斷）目前只有測試呼叫；深入排查發現問題比原本描述的更根本——`Bundle.courseIds` 指向 `db.course`（真的資料庫課程/章節，operator 專用的 `/admin/course` studio 在編這個），但買家實際看到的 `/course` 頁面與 `/api/course/lessons` 完全是另一套系統，只服務 `packages/course/catalog.ts` 寫死的 `MVP_LESSON_SEEDS`（3 堂固定課），跟 `db.course` 完全無關。也就是說**目前沒有任何買家看得到的頁面會渲染 `db.course` 的內容**，`canAccessCourseId` 想接的「course/page.tsx 對 bundle 內每堂課顯示」這個頁面根本不存在。要接上必須先新建一個買家版 `db.course` 內容播放頁（讀 Chapter/Lesson），這是新功能不是「改幾行」，範圍已超出本輪 Phase 4，留到那個買家播放頁做出來後再回頭接 `canAccessCourseId`

### 16. Phase 4 Review 與驗收

- [x] 16.1 對商品目錄改造跑 correctness / security review，特別檢查 **BREAKING** 變更是否真的向後相容（未傳 productId 時行為不變），Critical 為零（PM 覆核：未帶 productId 時 `getProduct()` 預設回傳 MVP 固定值，行為與改造前逐位元相同；`buildPendingOrderInput` 的 8800 上限只在 `sku === MVP_SKU` 生效，bundle 訂單不受這條擋，也不會反過來讓 MVP 訂單金額失控；金額全程來自伺服器端 `getProduct` 查表結果，不信任任何客戶端輸入，符合 spec「Client-supplied alternate amount is ignored」）
- [x] 16.2 `pnpm build` 與 `pnpm test` 全專案通過（PM 自行重跑：`packages/` 52 files/274 tests 全綠；`pnpm --filter @startkiter/saas build` 成功（這輪特別重跑，因為上一輪只跑了 test/type-check 沒跑 build，漏掉一個真的 server/client boundary bug，見 platform-shell tasks.md 50.5）；`apps/saas` 全套測試僅 2 個失敗，屬 platform-shell 既有測試期望值過時（見 50.7），非 Phase 4 改動造成，`git status` 確認相關檔案不在本輪 diff 內）

## Phase 5：既有 spec 對齊與全面驗收（v1 take-home capabilities）

### 17. 既有規則對齊確認

- [ ] 17.1 對照 mvp-offer 的「Single MVP SKU price」與「MVP SKU constant is startkiter-mvp」修訂後內容，逐一檢查既有測試斷言（`packages/payments/src/order.test.ts` 等）是否需要調整為「MVP SKU 固定 8800，但商品目錄可有其他項目」，需要調整的逐一修正並保持綠燈
- [ ] 17.2 對照 v1-scope-boundary 的「v1 take-home capabilities」修訂後內容，確認新增的 bundle/coupon 能力已在實際代碼中對應存在

### 18. 全面驗收

- [ ] 18.1 `pnpm build` 與 `pnpm test` 全專案通過
- [ ] 18.2 用假資料跑一次完整流程：建立 bundle → 建立 coupon → 買家用 coupon 折扣價完成 bundle 結帳 → 確認取得 bundle 內全部課程存取權 → 退款 → 確認存取權撤銷，保存實際輸出
- [ ] 18.3 `spectra validate core-module-bundles-coupons` 通過，0 warnings
