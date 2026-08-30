## Why

`route-adapter-security-hardening` SR 的 codex 交叉審查（2026-08-30）發現既有代碼3項漏洞：coupon兌換次數未持久化消耗（可重複使用超過上限）、匿名coupon rate-limit可被偽造x-forwarded-for繞過、course studio錯誤訊息洩漏內部細節。這些是生產環境已存在的安全缺口，需要實際修復（跟之前純補測試的SR不同）。

## What Changes

- `packages/coupons/src/validate.ts`／`apps/saas/app/api/checkout/route.ts`／`apps/saas/lib/orders.ts`：checkout流程中，coupon驗證通過後在同一DB transaction內原子性地檢查並遞增`timesRedeemed`，訂單保存coupon id/code關聯，防止並行/重複呼叫繞過兌換上限
- `apps/saas/app/api/coupons/validate/route.ts`／`apps/saas/lib/rate-limit.ts`：rate-limit改用可信來源的client IP（不直接信任客户端可控的x-forwarded-for完整字串），若部署環境有反向代理需正規化取最左/最右可信段，或改用其他無法被客戶端偽造的識別方式
- `apps/saas/app/api/course/studio/route.ts`：500錯誤回應改為固定`INTERNAL_ERROR`訊息，完整例外內容寫入server log（不外洩）

## Non-Goals (optional)

- 不重構coupon/rate-limit整體架構
- 不引入新的rate-limit基礎設施（如Redis-based distributed limiter），除非現有DB-based方式無法在單一transaction內解決race condition
- 不處理總表其他項目

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected specs: 無（修復既有安全缺口，行為更嚴謹而非改變產品規則）
- Affected code:
  - Modified:
    - `packages/coupons/src/validate.ts`
    - `apps/saas/app/api/checkout/route.ts`
    - `apps/saas/lib/orders.ts`
    - `apps/saas/app/api/coupons/validate/route.ts`
    - `apps/saas/lib/rate-limit.ts`
    - `apps/saas/app/api/course/studio/route.ts`
  - New（測試）：對應上述檔案的並行競態測試、rate-limit偽造測試、錯誤訊息不外洩測試
