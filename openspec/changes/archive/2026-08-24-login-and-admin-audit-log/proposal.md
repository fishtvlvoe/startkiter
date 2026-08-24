## Why

StartKiter 沒有登入嘗試紀錄跟管理員操作日誌，無法偵測異常登入（暴力破解、可疑 IP）、也無法在事後稽核 operator 對敏感操作（退款、刪除課程、修改發票狀態）做了什麼。woomin 的 `LoginAttempt`／`AdminLog` 是輕量的安全基礎設施，這次補上。

## What Changes

- 新增 `LoginAttempt` model（`email`／`ipAddress`／`success`／`userAgent`）：在 `packages/auth/auth.ts` 既有的 `hooks.after`（`createAuthMiddleware`）新增判斷 `ctx.path.startsWith("/sign-in")` 的分支，記錄每次登入嘗試
- 新增 `AdminLog` model（`adminId`／`action`／`targetType`／`targetId`／`details`／`ipAddress`）：新增共用函式 `recordAdminAction(adminId, action, target, details)`，MVP 範圍先在三個高風險 operator 操作點呼叫：退款（`subscriptions-invoice` change 的退款分派邏輯，若已 apply）、發票作廢/折讓、課程/單元刪除
- Operator 後台新增稽核紀錄查詢頁（依 email/IP 查登入紀錄、依管理員/操作類型查管理日誌）

## Non-Goals

- 不做自動封鎖機制（偵測到多次失敗登入自動鎖帳號/IP），這次只記錄不主動阻擋，封鎖機制風險較高（誤鎖真實使用者）留給未來評估
- 不做全站所有 operator 操作點的日誌覆蓋，MVP 範圍只覆蓋退款/發票作廢折讓/課程刪除三個高風險點，其餘操作點留給未來個別 change 補上
- 不做登入異常的即時警報通知

## Capabilities

### New Capabilities

- `login-admin-audit-log`：登入嘗試紀錄與管理員操作日誌

## Impact

- Affected specs: `login-admin-audit-log`（新增）
- Affected code：
  - New:
    - `packages/auth/login-attempt.ts`
    - `packages/auth/login-attempt.test.ts`
    - `packages/platform/src/admin-log.ts`
    - `packages/platform/src/admin-log.test.ts`
    - `apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx`
    - `packages/database/prisma/migrations/`（新增 `LoginAttempt`／`AdminLog` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/auth/auth.ts`（`hooks.after` 新增登入紀錄分支）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無

## Open Questions

- Better Auth 的 `hooks.after`（`createAuthMiddleware`）是否在登入失敗（例如密碼錯誤）時也會被觸發，還是只在成功回應時觸發？這影響「失敗登入」是否能透過同一個 hook 記錄，還是需要額外的 `hooks.before` 或錯誤處理路徑捕捉失敗案例。這需要在 apply 階段第一步先寫一個實際測試驗證 Better Auth 的行為，若 `after` hook 不會在失敗時觸發，改在 `hooks.before` 判斷請求後、`hooks.after` 判斷成功後分別記錄成功/失敗兩種結果。
