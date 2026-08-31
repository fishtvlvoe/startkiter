# Tasks: organization-completeness-review

## Phase 1：稽核（先做，不改代碼）

- [ ] 1.1 建立組織流程驗證（`CreateOrganizationForm` → DB）
- [ ] 1.2 邀請成員流程驗證（發邀請 → 對方收到 → 接受 → 成為成員）
- [ ] 1.3 切換組織身分驗證（`ActiveOrganizationProvider`／`OrganizationSelect`）
- [ ] 1.4 用組織身分結帳驗證（`Order.organizationId` 是否真的被設定，checkout 流程有沒有讓使用者選「用哪個身分買」）
- [ ] 1.5 組織成員課程存取驗證（組織購買的課程，其他成員登入後能不能看到/進入）
- [ ] 1.6 權限邊界驗證（owner/admin/member 各自能做什麼，是否跟 `packages/permissions` 規則一致）
- [ ] 1.7 移除成員/刪除組織邊界情況驗證
- [ ] 1.8 產出稽核報告：每一項標「✅能／🔴不能／⚠️部分能」，附具體缺口清單，更新進本檔案 Phase 2

## Phase 2：修復（待 Phase 1 結果決定，先留空）

- [ ] （Phase 1 完成後補上具體修復項目）

## Phase 3：驗證

- [ ] 全部修復項目完成後，PM 親自跑完整測試+type-check
- [ ] PM 親自走一次端對端流程：建組織→邀請→用組織身分購買 0 元測試課程→其他成員登入確認能看到課程
