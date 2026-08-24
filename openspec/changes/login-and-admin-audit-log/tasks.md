## 1. 紅燈測試（TDD）

- [x] 1.1 為 `packages/auth/login-attempt.ts` 寫紅燈測試，涵蓋 Requirement「Every login attempt is recorded regardless of outcome」：成功登入記錄 `success: true`、失敗登入記錄 `success: false`、記錄寫入失敗不阻擋登入流程。驗證目標：`pnpm --filter @startkiter/auth test login-attempt.test.ts` FAIL。證據：實作前因 `./login-attempt` 不存在而 exit 1；實作後同一命令 2 tests passed。
- [x] 1.2 [P] 為 `packages/platform/src/admin-log.ts` 寫紅燈測試，涵蓋 Requirement「High-risk operator actions are recorded in AdminLog」：`recordAdminAction` 正確寫入退款與課程刪除兩種情境的記錄。驗證目標：`pnpm --filter @startkiter/platform test admin-log.test.ts` FAIL。證據：實作前因 `./admin-log` 不存在而 exit 1；實作後同一命令 2 tests passed。

## 2. Database schema 與記錄函式

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `LoginAttempt`／`AdminLog` model（DDL 見 design.md），產生 migration；實作 `recordLoginAttempt`／`recordAdminAction` 兩個函式（寫入失敗時捕捉例外不拋出）。驗證目標：task 1.1／1.2 全數轉綠燈。證據：migration `20260824094111_add_login_attempt_admin_log` 與 Prisma generate exit 0；auth/platform focused tests 全綠。

## 3. 登入流程 Hook 整合

- [x] 3.1 **前置驗證**：先寫一個獨立的實驗性測試確認 Better Auth 的 `hooks.after`（`createAuthMiddleware`）是否在登入失敗時也會被觸發（見 design.md Open Questions）；依驗證結果決定是在單一 `hooks.after` 分支判斷成功/失敗，還是需要 `hooks.before`／`hooks.after` 各自處理。依 design.md Decision: 登入紀錄透過既有 Better Auth hooks 機制新增分支，不引入新的中介層，修改 `packages/auth/auth.ts`，在既有 `hooks.after`（或依驗證結果調整的位置）新增 `ctx.path.startsWith("/sign-in")` 分支呼叫 `recordLoginAttempt`。驗證目標：實際登入成功與密碼錯誤兩種情境都能在資料庫看到對應的 `LoginAttempt` 記錄。證據：`better-auth-hook-experiment.test.ts` 1 test passed，確認 APIError 仍執行 after hook；讀 Better Auth 1.6.29 `dispatch.mjs` 交叉確認；ego-browser 實測密碼錯誤 2 次、成功登入，資料庫讀回 2 筆 `success:false` 與 1 筆 `success:true`；另實測 magic-link 申請及 `/magic-link/verify`，資料庫讀回 2 筆同 email 的 `success:true`。

## 4. Operator 操作點記錄

- [x] 4.1 依 design.md Decision: AdminLog 呼叫點限定三個高風險操作，不做全站覆蓋，在退款分派邏輯、發票作廢/折讓 procedure、課程刪除 procedure 三處呼叫 `recordAdminAction`（若 `subscriptions-invoice`／`multi-gateway-checkout` 尚未 apply，退款與發票相關呼叫點標記為阻塞，等待對應 change 完成後補上，不自行重新設計退款/發票邏輯）。驗證目標：三個操作點觸發後皆能在資料庫看到對應的 `AdminLog` 記錄。證據：refund/invoice/studio focused tests 4+6 passed；ego-browser 真實 operator 退款後，資料庫讀回 `REFUND_ORDER`、Order target、amount 8800、operator IP，details 未含敏感資訊。

## 5. 稽核查詢頁

- [x] 5.1 新增 `apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx`：依 email/IP 查詢登入紀錄、依管理員/操作類型查詢管理日誌。驗證目標：手動驗證查詢功能正確運作。證據：ego-browser operator 頁面依 `REFUND_ORDER` 篩選顯示 1 筆 AdminLog；一般學員直接進 `/audit-log` 實際被導回 `/`。

## 6. Review 與驗證

- [ ] 6.1 派 Codex 或等效工具對本次全部 diff（task 1-5）做 Code Review（correctness／security／performance 三角度）：correctness 確認退款/發票作廢折讓/課程刪除三處呼叫點都正確傳入 `AdminLog` 所需欄位；security 確認記錄寫入失敗真的不會阻擋登入/操作流程本身、`AdminLog.details` 沒有意外寫入敏感資訊（密碼、金鑰片段）、稽核查詢頁只有 operator 角色能存取；performance 確認 `LoginAttempt` 寫入不會拖慢登入回應（非同步或至少不阻塞主流程）。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 6.2 用 ego-browser skill 跑一次完整 e2e：以錯誤密碼登入某帳號兩次 → 以 operator 身分進入 `/audit-log` 依該帳號 email 查詢，確認看到兩筆失敗登入紀錄 → operator 對一筆訂單執行退款操作 → 回到 `/audit-log` 依操作類型查詢，確認看到一筆退款的 `AdminLog` 記錄且內容不含敏感資訊 → 以一般學員帳號直接存取 `/audit-log` 確認被擋。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成。證據：ego-browser 全流程實跑通過；截圖 `/tmp/startkiter-audit-log-refund-clean.png`、`/tmp/startkiter-audit-log-action-clean.png`。
- [ ] 6.3 跑 `spectra analyze login-and-admin-audit-log --json` 與 `spectra validate login-and-admin-audit-log`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [ ] 6.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/auth test`／`pnpm --filter @startkiter/platform test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
