# Proposal: organization-completeness-review

## 背景

Fish 已裁決：Organization（多人組織/團隊帳號）是必要功能，因為未來公司行號客戶需要團隊帳號購買/管理課程。`openspec/config.yaml` 舊有「不做 Organization」規則已刪除，改記錄為必要功能。

實際查證：
- Schema 已有 `Organization`／`Member`／`Invitation` 表，`Order`／`Purchase` 都有 `organizationId`（可選欄位）
- UI 元件已有 10 個檔案：邀請、成員列表、logo、建立組織、切換組織等
- API 有 `organizations/router.ts`、instructor role 指派、admin 端組織查詢

**但沒有人完整驗證過這整套從「建組織 → 邀請成員 → 用組織身分購課 → 組織內成員共享課程存取」是否真的端對端能跑。**

## 這張 change 做什麼

**這是一張「先稽核、再修復」的 change**，不是預先寫死要改哪幾個檔案。因為目前不知道缺口在哪，範圍會在稽核完成後具體化：

### Phase 1：稽核（不改代碼）
逐項驗證以下流程，記錄每一項「能／不能／部分能」：
1. 建立組織（`CreateOrganizationForm`）→ 資料庫正確寫入
2. 邀請成員（`OrganizationInvitationsList`）→ 對方收到邀請、能接受、正確成為成員
3. 切換組織身分（`ActiveOrganizationProvider`／`OrganizationSelect`）
4. 用組織身分結帳（`Order.organizationId` 是否真的在結帳流程被設定）
5. 組織內其他成員是否能存取該組織購買的課程（`courseAccess` 邏輯是否考慮 organization 成員關係）
6. 權限邊界：owner／admin／member 各自能做什麼，是否跟 `packages/permissions` 的規則一致
7. 移除成員、刪除組織的邊界情況

### Phase 2：修復
根據 Phase 1 找到的缺口，逐項修復，缺口清單會在稽核完成後更新進這張 change 的 tasks.md

## 不做什麼

- 不重新設計 Organization 的角色模型（沿用既有 owner/admin/member/user 四級）
- 不做進階功能（組織層級的用量分析、帳單合併發票等），先求「基本流程真的能跑」

## 影響範圍

Phase 1 純稽核零風險。Phase 2 修復範圍待 Phase 1 結果決定，可能涉及 checkout、course-access、organizations procedures，屬中風險（涉及金流歸屬與課程存取權限），修復階段要走完整驗證流程。
