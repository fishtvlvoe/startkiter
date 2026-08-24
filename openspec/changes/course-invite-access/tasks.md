## 1. 紅燈測試（TDD）

- [x] 1.1 為 `CourseInvite` 建立與 token hash 邏輯寫紅燈測試，涵蓋 Requirement「Token 以 hash 存放」：建立邀請回傳明文 token 一次，資料庫只存 hash；相同明文 token 兌換時能查到對應記錄。驗證目標：`pnpm --filter @startkiter/api test create-course-invite.test.ts` FAIL
- [x] 1.2 [P] 為兌換流程寫五個紅燈測試案例：(a) 正常兌換成功並建立 `CourseInviteRedemption`；(b) token 無效；(c) 已過期；(d) 已達 `maxUses`；(e) email 不符。驗證目標：`pnpm --filter @startkiter/api test redeem-course-invite.test.ts` FAIL
- [x] 1.3 [P] 為 `canAccessCourseId` 新增紅燈測試案例，涵蓋 Requirement「Playback entitlement reads Order.courseAccess」新增的邀請相關 Scenario：mock `hasRedeemedInvite` 回傳 true 時放行，回傳 false 且無其他來源時拒絕。驗證目標：`pnpm --filter @startkiter/api test course.test.ts`／`packages/course/access.test.ts` FAIL

## 2. Database schema

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `CourseInvite`／`CourseInviteRedemption` 兩個 model（DDL 見 design.md），產生 migration。驗證目標：`pnpm --filter @startkiter/database type-check` 通過，task 1.1 轉綠燈

## 3. 建立與兌換邏輯

- [x] 3.1 依 design.md Decision: Token 以 hash 存放，查詢走資料庫索引比對而非逐字元比對，新增 `create-course-invite.ts`（產生高熵 token、算 hash 存入、明文只在回應回傳一次）與 `redeem-course-invite.ts`（驗證 token hash、`active`／`expiresAt`／`maxUses`／`email` 條件，同一 transaction 內遞增 `usedCount` 並建立 `CourseInviteRedemption`）。驗證目標：task 1.1／1.2 全數轉綠燈

## 4. 課程存取權整合

- [x] 4.1 依 design.md Decision: canAccessCourseId 新增 hasRedeemedInvite 分支，延續既有依賴注入模式，在 `packages/course/access.ts` 的 `BundleCourseAccessReader` 新增方法簽章 `hasRedeemedInvite`，`canAccessCourseId` 在既有判斷都不成立時呼叫此方法；在 `packages/api/modules/course/lib/course-access.ts` 的 production reader 實作此方法（查詢 `db.courseInviteRedemption.findFirst`）。驗證目標：task 1.3 全數轉綠燈

## 5. 頁面

- [x] 5.1 新增 `apps/saas/app/invite/[token]/page.tsx`（買家點擊邀請連結後的兌換流程頁；置於 authenticated group 外以支援未登入導向登入）與 `apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx`（operator 建立/管理邀請）。驗證目標：ego-browser 實測頁面正常運作

## 6. Review 與驗證

- [x] 6.1 grep `BundleCourseAccessReader`／`canAccessCourseId` 所有既有引用點，確認本次新增分支未破壞既有 MVP／bundle／訂閱三種授權來源的既有測試斷言。驗證目標：既有測試（不含本次新增案例）全數維持綠燈，無回歸
- [ ] 6.2 派 Codex 或等效工具對本次全部 diff（task 1-5）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `hasRedeemedInvite` 與既有三種授權來源正確 OR 組合、`maxUses`/`expiresAt` 邊界判斷正確；security 確認 token 用足夠高熵的隨機來源產生、資料庫只存 hash（`tokenHash`）、未登入使用者點擊邀請連結會先導向登入而非直接暴露課程資訊；performance 確認 `usedCount` 遞增與兌換記錄建立在同一 transaction 內，避免併發兌換超賣。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 6.3 用 ego-browser skill 跑一次完整 e2e：operator 建立一個限 1 次使用的邀請連結 → 以一個新學員帳號點擊連結完成兌換 → 確認能播放對應課程單元 → 再次用同一連結嘗試兌換 → 確認顯示已達使用上限。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [ ] 6.4 跑 `spectra analyze course-invite-access --json` 與 `spectra validate course-invite-access`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [ ] 6.5 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
