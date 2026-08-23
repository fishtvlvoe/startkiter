## Why

StartKiter 目前只有 `startkiter-mvp` 一次買斷 8800 TWD 一種付費方式，`mvp-offer`／v1 硬邊界都明文鎖死「不做月繳」。demo 內容只是參考範例，不是要死守的唯一商業模式：買家對高單價一次買斷有進入門檻，需要月繳/年繳訂閱制降低嘗試成本，同一門課才能同時服務兩種付費偏好的買家。

## What Changes

- 新增 SKU `startkiter-mvp-subscription`，指向與 `startkiter-mvp` 相同的課程內容，走月繳/年繳訂閱制，`startkiter-mvp` 本身維持 8800 一次買斷不變
- 新增 `CourseSubscriptionPlan`（`courseId` 為通用外鍵，架構上任何課程都能建立方案，不綁死單一課程；MVP 範圍內先為 MVP 課程建立月繳/年繳兩筆 plan 記錄）與 `CourseSubscription`（狀態機：PENDING → ACTIVE → CANCELED，MVP 版不做補扣重試與 PAST_DUE 提醒）兩個 Prisma model
- 新增 `packages/payments/provider/payuni/period-gateway.ts`：`PayUniPeriodGateway` 類別，實作 `createSubscriptionSession`（PAYUNi 幕後交易建立續期收款）與 `cancelSubscription`（mdfStatus ReviseTradeStatus=end），API 呼叫規格照抄已生產驗證的 `/Users/fishtv/Development/products/woomin/realms/lib/payment/payuni-gateway.ts`
- 新增 `apps/saas/app/api/payuni/period-notify/route.ts`：訂閱續期 webhook，驗證簽章、金額，冪等寫入 `CourseSubscription.paidPeriods`／`currentPeriodEnd`，首期成功時回寫 `gatewaySubscriptionId`（PAYUNi PeriodTradeNo）
- 新增 `apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx`：訂閱制結帳頁（月繳/年繳選擇 + PAYUNi 表單提交），透過 `planId` 查詢對應課程與方案，不寫死單一課程
- 新增取消訂閱的操作入口（買家帳號設定內），呼叫 `cancelSubscription`，取消後立即收回課程權限
- 修改 `packages/course/access.ts` 的 `canAccessCourseId`：新增「使用者有 ACTIVE 狀態的 `CourseSubscription` 對應此 courseId」分支，與現有 bundle-aware 判斷並列，判斷邏輯本身不限定課程
- 修改 `openspec/config.yaml` 的 v1 硬邊界：`startkiter-mvp` 一次買斷維持不變，新增訂閱制並存的商業模式（此變更已於本次 propose 階段完成，不在 tasks.md 內重複列出）

**BREAKING**：無破壞性變更——`startkiter-mvp` 既有一次買斷行為、既有 `canAccessCourseId` 判斷邏輯皆保持不變，新增的訂閱分支為純新增路徑。

## Non-Goals

- 不做多方案管理後台 UI（本次只透過資料庫直接建立 plan 記錄，之後要開新 change 才做後台介面）
- 不做補扣/重新授權（reauth）機制
- 不做 PAST_DUE 後續提醒流程
- 不做 Stripe 或其他 provider 的訂閱抽象層，僅 PAYUNi 一家
- 不做多堂課同時訂閱的購物車流程，一次訂閱對應一個 plan

## Capabilities

### New Capabilities

- `subscription-billing`：PAYUNi 定期定額訂閱制付費，涵蓋方案定義（通用課程外鍵）、訂閱生命週期狀態機、webhook 入帳、取消流程

### Modified Capabilities

- `course-module`：課程存取權判斷（`canAccessCourseId`）新增訂閱來源的授權分支

## Impact

- Affected specs: `subscription-billing`（新增）、`course-module`（修改）
- Affected code：
  - New:
    - `packages/payments/provider/payuni/period-gateway.ts`
    - `packages/payments/provider/payuni/period-gateway.test.ts`
    - `apps/saas/app/api/payuni/period-notify/route.ts`
    - `apps/saas/app/api/payuni/period-notify/route.test.ts`
    - `apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx`
    - `apps/saas/lib/subscription-access.ts`
    - `apps/saas/lib/subscription-access.test.ts`
    - `packages/database/prisma/migrations/`（新增 CourseSubscriptionPlan／CourseSubscription migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/course/access.ts`
    - `packages/course/access.test.ts`
    - `packages/payments/constants.ts`（新增 `SUBSCRIPTION_SKU` 常數）
    - `openspec/config.yaml`（v1 硬邊界，已於 propose 階段完成）
  - Removed: 無
- Dependencies 新增：無新套件，沿用既有 `node:crypto`（PAYUNi AES-256-GCM 加解密複用 `packages/payments/provider/payuni/crypto.ts`）
- 環境變數新增：無，沿用既有 `PAYUNI_MERCHANT_ID`／`PAYUNI_HASH_KEY`／`PAYUNI_HASH_IV`／`PAYUNI_API_URL`
