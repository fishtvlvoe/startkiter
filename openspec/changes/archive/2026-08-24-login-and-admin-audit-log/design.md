## Context

`packages/auth/auth.ts` 已有 `hooks.after`／`hooks.before`（用 `createAuthMiddleware`，依 `ctx.path` 判斷觸發哪個邏輯）的既有結構，這次新增登入紀錄分支延續同一模式，不引入新的 hook 機制。

`AdminLog` 的呼叫點涵蓋退款分派邏輯，若 `subscriptions-invoice` change 尚未 apply，`recordAdminAction` 在退款流程的呼叫點會找不到對應的既有退款函式可以掛載——這次跟 `multi-gateway-checkout` 依賴 `triggerInvoiceForOrder` 的情況類似，需要在 apply 階段做前置依賴檢查。

## Goals / Non-Goals

**Goals:**

- 記錄每次登入嘗試（成功/失敗、email、IP、userAgent）
- 記錄退款/發票作廢折讓/課程刪除三個高風險 operator 操作
- Operator 可查詢稽核紀錄

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: 登入紀錄透過既有 Better Auth hooks 機制新增分支，不引入新的中介層

延續 `packages/auth/auth.ts` 既有的 `hooks.after`（`ctx.path.startsWith(...)` 判斷模式），新增 `ctx.path.startsWith("/sign-in")` 分支呼叫 `recordLoginAttempt`。（見 Open Questions：成功/失敗的判斷時機需要 apply 階段先驗證 Better Auth 實際行為）

Alternatives Considered:
- 在每個登入表單元件（前端）送出後自行呼叫記錄 API → 否決：前端呼叫可以被繞過（直接呼叫 Better Auth API 而不經過前端表單），登入紀錄若能被繞過就失去稽核意義；後端 hook 是唯一可靠的攔截點

### Decision: AdminLog 呼叫點限定三個高風險操作，不做全站覆蓋

`recordAdminAction(adminId, action, target, details)` 這次只在退款、發票作廢/折讓、課程刪除三處呼叫。

Alternatives Considered:
- 用一個全域的 API middleware 自動記錄所有 operator 角色的請求 → 否決：大部分 operator 操作是唯讀查詢，全部記錄會製造大量噪音日誌，稀釋掉真正值得稽核的高風險操作；MVP 範圍先聚焦在會造成金錢/資料不可逆變化的操作點

## Implementation Contract

**Behavior:**
- 每次登入嘗試（成功或失敗）記錄一筆 `LoginAttempt`
- 退款/發票作廢折讓/課程刪除操作各自記錄一筆 `AdminLog`
- Operator 可在稽核紀錄頁依 email/IP/管理員/操作類型查詢

**Interface / data shape:**
- `recordLoginAttempt(email: string, ipAddress: string, success: boolean, userAgent?: string): Promise<void>`
- `recordAdminAction(adminId: string, action: string, target: { type: string; id: string }, details?: Record<string, unknown>, ipAddress?: string): Promise<void>`

**DB DDL:**
```sql
CREATE TABLE "login_attempt" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "login_attempt_email_createdAt_idx" ON "login_attempt"("email", "createdAt");
CREATE INDEX "login_attempt_ipAddress_createdAt_idx" ON "login_attempt"("ipAddress", "createdAt");

CREATE TABLE "admin_log" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" TEXT NOT NULL REFERENCES "user"("id"),
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "admin_log_adminId_idx" ON "admin_log"("adminId");
CREATE INDEX "admin_log_action_idx" ON "admin_log"("action");
CREATE INDEX "admin_log_createdAt_idx" ON "admin_log"("createdAt");
```

**Failure modes:**
- 記錄寫入失敗不得阻擋原本的登入/操作流程本身（記錄是輔助稽核功能，不是核心業務邏輯的前提條件）

**Acceptance criteria:**
- `pnpm --filter @startkiter/auth test login-attempt.test.ts` 涵蓋成功/失敗兩種登入結果的記錄正確性
- `pnpm --filter @startkiter/platform test admin-log.test.ts` 涵蓋 `recordAdminAction` 正確寫入
- `pnpm type-check`／`pnpm build` 全綠

**Scope boundaries:**
- In scope：`LoginAttempt`／`AdminLog` model；`packages/auth/auth.ts` 的 hook 新增分支；三個高風險操作點的記錄呼叫；稽核紀錄查詢頁
- Out of scope：自動封鎖機制；全站操作點覆蓋；即時警報

## Risks / Trade-offs

- [Risk] 記錄寫入本身若同步阻塞登入流程，可能造成登入變慢或失敗 → Mitigation: 記錄寫入失敗時捕捉例外不拋出，不阻擋登入流程本身完成
- [Risk] `AdminLog.details` 若不小心記錄了敏感資訊（如密碼、金鑰片段）→ Mitigation: 呼叫端在傳入 `details` 前自行過濾，這次呼叫點只記錄退款／折讓金額；目標 ID 存在 `targetId`，不把發票內容或憑證寫進 JSON
