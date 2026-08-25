## 1. 角色四值強制（對應設計決策「角色四值強制優先嘗試 Prisma enum，若與 Better Auth plugin 行為衝突才退回應用層 hook 檢查」）

- [x] 1.1 在測試環境用 Better Auth `organization` plugin 原生流程建立一個 organization 與 member，查詢資料庫實際寫入的 `role` 值，記錄探測結果決定後續採 enum 或應用層 hook 檢查；驗證目標：探測結論寫入本次實作筆記，供 1.3 依循
- [x] 1.2 撰寫紅燈測試：`Member.role` 寫入四值以外的值（例如 `moderator`）會被拒絕，涵蓋既有 Requirement「Organization membership roles are a fixed four-value set」；驗證目標：`pnpm --filter database test`（或對應 api test）出現預期失敗
- [x] 1.3 依 1.1 探測結果實作角色四值強制（Prisma enum 或 `packages/auth/auth.ts` 的 hook 檢查），使 1.2 測試轉綠燈；驗證目標：對應測試全綠

## 2. Owner 唯一性與講師指派權限（對應既有 Requirement「Every organization has exactly one owner」與「Only owner or admin can assign or revoke the instructor role」）

- [x] 2.1 撰寫紅燈測試：轉移 owner 時前任 owner 自動降為 admin，且組織任何時刻都恰好一位 owner；驗證目標：`pnpm --filter api test` 出現預期失敗
- [x] 2.2 撰寫紅燈測試：`instructor` 或 `user` 嘗試變更任何成員角色（含自己）一律被拒絕，`owner`／`admin` 可以指派/撤銷 `instructor`；驗證目標同 2.1
- [x] 2.3 實作 `packages/api/modules/organization/procedures/assign-instructor-role.ts`，使 2.1、2.2 測試轉綠燈；驗證目標：`pnpm --filter api test` 全綠

## 3. 講師課程權限邊界（對應既有 Requirement「Instructor role grants course content permissions but not billing visibility」）

- [x] 3.1 撰寫紅燈測試：`instructor` 可編輯所屬組織的課程內容、不可查看組織訂單列表或買家名單；驗證目標：`pnpm --filter course test` 出現預期失敗
- [x] 3.2 修改 `packages/course/` 的課程內容編輯權限檢查與訂單列表查詢權限檢查，使 3.1 測試轉綠燈；驗證目標：對應測試全綠

## 4. 企業帳號課程存取權繼承（對應 Requirement「Organization-scoped course purchases grant access to all current members」）

- [x] 4.1 在 `packages/database/prisma/schema.prisma` 新增 `Order.organizationId`（可為空，外鍵指向 `Organization`）並產生 migration；驗證目標：`prisma migrate status` 顯示新 migration 已套用，既有 `Order` 資料 `organizationId` 皆為 null
- [x] 4.2 撰寫紅燈測試：Member 沒有個人 Order 但所屬 Organization 有 `courseAccess: true` 的 Order 時，存取權檢查成功；新加入的 Member 立即繼承既有企業 Order 的存取權，涵蓋 Requirement「Organization-scoped course purchases grant access to all current members」的兩個 Scenario；驗證目標：`pnpm --filter api test` 出現預期失敗
- [x] 4.3 落實設計決策「courseAccess 查詢即時聯集 Organization 層級的 Order，不在建立時複製寫入每個 Member」：`grep -rn "courseAccess" packages/ apps/` 找出所有既有查詢點，逐一修改為 User-or-Organization 聯集判斷，使 4.2 測試轉綠燈；驗證目標：`pnpm test` 全綠，且既有個人購買流程既有測試（不含本次新增）維持綠燈，無回歸

## 5. Invitation email 通知（對應 Requirement「Organization invitations are delivered by email」，落實設計決策「Invitation 通知沿用既有 Better Auth organization plugin 內建的 email 事件，不新增 LINE 通知」）

- [ ] 5.1 撰寫紅燈測試：涵蓋 Requirement「Organization invitations are delivered by email」——建立 Invitation 後觸發 email 通知、不觸發任何 LINE 訊息；驗證目標：`pnpm --filter api test` 出現預期失敗
- [ ] 5.2 串接既有 `packages/mail` 到 Better Auth Invitation 建立事件，使 5.1 測試轉綠燈；驗證目標：對應測試全綠

## 6. 後台 UI：講師指派入口

- [ ] 6.1 修改 `apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx` 新增「指派/撤銷講師」操作按鈕，僅 `owner`／`admin` 可見與可操作，串接第 2 節的 procedure；驗證目標：手動以三種角色（owner／instructor／user）登入測試，非 owner/admin 看不到此按鈕

## 7. Review 與驗收

- [ ] 7.1 派 Codex 或等效工具對第 1-6 節的 diff 做 Code Review（correctness／security／performance 三角度），重點檢查 courseAccess 聯集查詢是否真的涵蓋 4.3 節列出的所有查詢點、既有座位制訂閱 hook（`updateSeatsInOrganizationSubscription`）的休眠安全機制未被本次改動破壞；驗證方式：CR 報告 Critical 數量為 0
- [ ] 7.2 執行 `pnpm test`／`pnpm type-check`／`pnpm build` 確認全數通過；驗證方式：三個指令 exit code 皆為 0
- [ ] 7.3 執行 `spectra validate organization-enterprise-account` 確認產出物驗證通過；驗證方式：指令輸出無錯誤
