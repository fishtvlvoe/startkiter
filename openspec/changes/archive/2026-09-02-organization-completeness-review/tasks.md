# Tasks: organization-completeness-review

## Phase 1：稽核（先做，不改代碼）

- [x] 1.1 建立組織流程驗證（`CreateOrganizationForm` → DB）
- [x] 1.2 邀請成員流程驗證（發邀請 → 對方收到 → 接受 → 成為成員）
- [x] 1.3 切換組織身分驗證（`ActiveOrganizationProvider`／`OrganizationSelect`）
- [x] 1.4 用組織身分結帳驗證（`Order.organizationId` 是否真的被設定，checkout 流程有沒有讓使用者選「用哪個身分買」）
- [x] 1.5 組織成員課程存取驗證（組織購買的課程，其他成員登入後能不能看到/進入）
- [x] 1.6 權限邊界驗證（owner/admin/member 各自能做什麼，是否跟 `packages/permissions` 規則一致）
- [x] 1.7 移除成員/刪除組織邊界情況驗證
- [x] 1.8 產出稽核報告：每一項標「✅能／🔴不能／⚠️部分能」，附具體缺口清單，更新進本檔案 Phase 2

## Phase 2：修復（基於 Phase 1 稽核結果）

### 🔴 Critical (Must fix for org checkout to work)
- [x] 2.1 checkout 流程讀 activeOrganizationId：`apps/saas/app/api/checkout/route.ts` 已讀取 `session.session.activeOrganizationId` 並驗證 membership，非成員回 403
- [x] 2.2 createPendingOrderForUser 寫入 organizationId：`apps/saas/lib/orders.ts` 已支援 organizationId 參數，條件式寫入 order
- [x] 2.3 補充 checkout 測試：已加 10 個新測試（owner/admin/member 各身分結帳、非成員 403、個人結帳向後相容）

### ⚠️ Important (Closes security/UX gaps)
- [x] 2.4 禁止邀請 owner：`invite-member-form.schema.ts` role enum 改為 ["user", "admin", "instructor"]，測試驗證 owner 被 schema 擋
- [x] 2.5 補充 instructor 角色測試：`packages/permissions/create-permission-rules.test.ts` 已加 instructor 行（測試通過）
- [x] 2.6 添加 OrganizationInvitationModal 錯誤提示：已呼叫 `notifyOrganizationInvitationFailure()` 顯示 toast，6 語系補譯文
- [x] 2.7 定義刪除 org 後的政策：`design.md` 已記錄刪 org 的行為（Member 級聯刪、Order SetNull、成員立即失效訪問）

### 依賴關係
- 2.2、2.3 需在 2.1 完成後測試（checkout 改動必須先做）
- 2.4 端到端修復後才驗收（必須跑整合測試）

## Phase 3：驗證

- [x] PM 親自跑完整測試+type-check（687 tests passing: permissions 11, platform 114, api 252, saas 310）
- [x] PM 親自審檢：membership 驗證正確、organizationId 正確寫入、courseAccess 查詢正確聯合、permission 邊界鎖定、刪 org 政策明確
