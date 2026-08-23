## 1. 紅燈測試（TDD，先寫測試不寫實作）

- [x] 1.1 為 `packages/database/prisma/schema.prisma` 新增的 `CourseSubscriptionPlan`／`CourseSubscription`／`PaymentWebhookEvent` 三個 model 寫型別/查詢測試（`packages/database` 對應 test 檔），涵蓋 Requirement「Subscription plans are course-scoped, not hardcoded to a single course」與「Subscription records reserve invoice fields without implementing invoicing」：驗證 `courseId` 為一般外鍵可指向任意 Course、`invoice*` 系列欄位皆為 nullable。驗證：`pnpm test` 與 `pnpm type-check` 通過。
- [x] 1.2 [P] 為 `packages/payments/types.ts` 的 `SubscriptionGateway` interface 與 `packages/payments/provider/payuni/period-gateway.ts` 的 `PayUniPeriodGateway` 寫三個測試案例：(a) `createSubscriptionSession` 回傳 PAYUNi form_post payload；(b) `cancelSubscription` 呼叫 mdfStatus 成功回傳 `{ success: true }`；(c) `cancelSubscription` 呼叫失敗回傳 `{ success: false, error }`，涵蓋 Requirement「Subscription gateway calls are made through a provider-agnostic interface」。驗證：`@startkiter/payments` 10 files／35 tests 通過。
- [x] 1.3 [P] 為訂閱結帳 API 寫測試案例：(a) 已登入買家對啟用中的 plan 送出訂閱請求 → 建立 `CourseSubscription` status=PENDING 並回傳 PAYUNi 表單資料；(b) 未登入請求 → 拒絕且不建立記錄；(c) 已有 PENDING/ACTIVE 訂閱或競態唯一鍵衝突 → 409 且不建立第二筆記錄。對應 Requirement「Buyers can subscribe to a course via PAYUNi recurring billing」。驗證：`@startkiter/api` 20 files／93 tests 通過。
- [x] 1.4 [P] 為 `apps/saas/app/api/payuni/period-notify/route.ts` 寫測試案例：重複事件、錯誤簽章、首次成功通知、較早 `currentPeriodEnd` 不回退，以及 FAILED webhook 可重試。對應 Requirement「Webhook events are deduplicated via a claim-based inbox before processing」與「Successful period payment activates the subscription and grants course access」。驗證：`@startkiter/saas` 28 files／147 tests 通過。
- [x] 1.5 [P] 為取消訂閱寫測試案例：(a) ACTIVE 訂閱成功呼叫 PAYUNi mdfStatus 終止 → status 立即轉 CANCELED；(b) mdfStatus 呼叫失敗 → status 維持不變且錯誤訊息回傳給呼叫端，涵蓋 Requirement「Canceling a subscription revokes course access immediately」。驗證：取消 procedure 測試包含於 `@startkiter/api` 全套 93 tests。
- [x] 1.6 [P] 為 `BundleCourseAccessReader` 新增方法 `hasActiveSubscription` 與 `canAccessCourseId` 新增測試案例，涵蓋 active、canceled 與既有買斷並存情境。驗證：`@startkiter/course` 12 files／73 tests 通過。

## 2. Database schema：CourseSubscriptionPlan／CourseSubscription／PaymentWebhookEvent

- [x] 2.1 依 design.md Decision: CourseSubscriptionPlan.courseId 為通用外鍵，MVP 範圍先為 MVP 課程建一筆 plan；新增三個 model 與 migration，含 `course_subscription_active_unique` partial unique index（`userId`,`courseId` WHERE status IN PENDING/ACTIVE）。依 design.md Decision: CourseSubscription 預留 invoice* 欄位，不做發票邏輯。驗證：Prisma migration deploy 成功，`prisma migrate status` 回報 `Database schema is up to date!`，database tests 4 files／10 tests 通過。

## 3. SubscriptionGateway interface 與 PayUniPeriodGateway

- [x] 3.1 依 design.md Decision: 新增 SubscriptionGateway interface，PayUniPeriodGateway 是首個實作；完成 provider-agnostic `SubscriptionGateway` interface 與 `PayUniPeriodGateway` class，支援 create／cancel／query 與 PAYUNi 加解密 API envelope。驗證：payments tests 10 files／35 tests、type-check、build 通過。

## 4. Webhook claim-based 冪等入帳

- [x] 4.1 依 design.md Decision: 新增簡化版 PaymentWebhookEvent 表做 claim-based 冪等；完成 `PaymentWebhookEvent` claim-based 冪等 inbox 與 `period-notify` route，完成驗簽、狀態轉換、paidPeriods 累加、currentPeriodEnd max 保護、交易一致性與 FAILED 事件重試。驗證：route、webhook event tests 與全 repo test/type-check/build 通過。

## 5. 訂閱結帳頁與 API

- [x] 5.1 依 design.md Decision: 新增獨立 SKU startkiter-mvp-subscription，不修改 startkiter-mvp 定價規則；完成 protected `createSubscriptionCheckout` procedure、PENDING 訂閱建立與獨立 PAYUNi 訂閱結帳頁（月繳／年繳選擇＋form_post）。驗證：API tests、SaaS tests、type-check、build 通過。

## 6. 取消訂閱

- [x] 6.1 新增 `cancelCourseSubscription` protected procedure，驗證訂閱擁有者、呼叫 `SubscriptionGateway.cancelSubscription`，成功立即更新 CANCELED／canceledAt，失敗維持原狀；帳號 billing 頁已加入取消操作。驗證：API tests 與 SaaS build 通過。

## 7. 課程存取權整合

- [x] 7.1 依 design.md Decision: canAccessCourseId 新增訂閱分支，取消後立即收回權限；完成 Prisma reader 查詢。依 design.md Decision: 訂閱不建立 Order 記錄，不授予 GitHub kit 領取資格；既有 orders／github-kit／coupon validate 檔案未修改。對應 Requirement「Playback entitlement reads Order.courseAccess」。驗證：course/API tests 通過。

## 8. Review 與回歸驗證

- [x] 8.1 已檢查 `MVP_SKU`／`startkiter-mvp`／`canAccessCourseId`／`packages/payments/factory.ts` 既有引用與 fail-closed 一次買斷流程；payments tests 10 files／35 tests 通過，既有 checkout 未改動。
- [x] 8.2 已完成 correctness/security review：PAYUNi secrets 不進 log、驗簽沿用 timing-safe compare、未登入與跨使用者取消均拒絕。CC 複審：Critical=0、High=0、Medium=0。
- [x] 8.3 已跑 `spectra analyze payuni-recurring-billing --json --no-color` 與 `spectra validate payuni-recurring-billing --no-color`；四維度 Clean，validate 0 warnings／0 errors。
- [x] 8.4 已跑 `pnpm test`（17 tasks successful）、`pnpm type-check`（23 tasks successful）、`pnpm build`（2 tasks successful），並確認 migration up to date、Stripe/factory 與既有 entitlement 檔案未修改。
