## Context

Better Auth 的 `organization` plugin 已經在 `packages/auth/auth.ts` 啟用，`Organization`／`Member`／`Invitation` 資料表是 supastarter 原生存在的既有 schema。`Member.role` 目前是不受任何限制的 `String` 欄位，沒有任何程式碼強制 `organization-tenancy` 規格定義的四值角色矩陣。`Order` model 目前完全是 `userId`-scoped，沒有 `organizationId` 欄位，代表一家企業買一次帳，員工無法共享存取權。既有的 `updateSeatsInOrganizationSubscription`（`packages/auth/lib/organization.ts`）是 supastarter 原生的座位制訂閱 hook，目前沒有任何座位制商品會觸發它（因為 `organization.purchases.length` 為 0 時提早 return）。`admin/organizations` 頁面目前只是 supastarter 原生的 `OrganizationList` 元件殼，沒有講師指派功能。

## Goals / Non-Goals

**Goals:**

- 落實 `organization-tenancy` 既有 5 條 Requirement（角色矩陣、owner 唯一性、講師指派權限、講師內容權限、個人購買不受角色影響）
- 讓企業帳號購買的課程存取權能被組織內所有成員共享
- 解決 `organization-role-model` 遺留的 3 個 Open Question

**Non-Goals:**

- 不改變座位制訂閱 hook 的現狀（休眠，不啟用）
- 不做企業帳號專屬定價
- 不做組織層級發票／統編歸戶
- 不做組織成員人數上限

## Decisions

### 角色四值強制優先嘗試 Prisma enum，若與 Better Auth plugin 行為衝突才退回應用層 hook 檢查

`Member.role` 目前是自由字串，改成 Prisma enum（`owner`／`admin`／`instructor`／`user`）能在資料庫層直接擋非法值，比應用層檢查更安全。但 Better Auth `organization` plugin 內部建立 Organization／Member 時可能寫入自己預設的角色字串值，需要先在 apply 階段實測 plugin 原生行為（建立一個測試 organization、加一個 member，查看 DB 實際寫入的 role 值），確認相容才能採用 enum；若 plugin 行為與四值 enum 衝突，退回在角色寫入路徑（`packages/auth/auth.ts` 的 hook）加應用層檢查。

Alternatives Considered：
- 一開始就採用應用層字串檢查，不嘗試 enum——否決，enum 在資料庫層更安全，值得先嘗試，只有實測衝突才放棄
- 完全不做任何強制，只在 UI 層限制輸入選項——否決，UI 限制擋不住直接呼叫 API 或未來新增的呼叫路徑，不符合既有 Requirement「must be rejected」的強制語意

### courseAccess 查詢即時聯集 Organization 層級的 Order，不在建立時複製寫入每個 Member

買家查詢自己的課程存取權時，除了查自己名下的 `Order`，也要查「自己所屬 Organization 的 `Order`（`organizationId` 非空）」聯集判斷，而不是在企業 Order 建立當下就把 `courseAccess: true` 逐一寫進每個現有 Member 各自的記錄。

Alternatives Considered：
- Order 建立時複製寫入每個現有 Member——否決，之後 Organization 新增成員時，舊有的企業 Order 不會自動反映到新成員身上，資料會不同步，需要額外的「補寫」邏輯且容易漏掉
- 完全不支援組織層級的存取權繼承，企業帳號的每個員工還是要個別購買——否決，這樣就不是真正的「企業帳號」，跟老闆的需求（一次買、全員共用）不符

### Invitation 通知沿用既有 Better Auth organization plugin 內建的 email 事件，不新增 LINE 通知

`Invitation` 的通知走 email（透過既有 `packages/mail`），LINE 保留給既有的學員社群邀請連結與客服用途（Chatwoot），不混用兩種通知管道處理不同性質的邀請。

Alternatives Considered：
- 用 LINE Messaging 發送組織邀請——否決，LINE Messaging 目前的用途邊界（v1 硬規則）限定在客服，組織邀請是正式商務情境，email 更符合既有企業邀請慣例，也不需要額外申請 LINE 權限範圍
- 兩種管道都做——否決，範圍膨脹且沒有明確需求支撐，先做一種

## Implementation Contract

**Behavior**：`owner`／`admin` 在 `admin/organizations` 頁面能把某個 Member 的角色在 `instructor`／`user` 之間切換；`instructor` 能編輯所屬組織的課程內容、看不到組織的訂單列表或買家名單；當一筆 `Order` 填了 `organizationId`，該組織當下的所有 Member 查詢課程存取權時都得到 `courseAccess: true`；新加入組織的 Member 立即繼承既有企業 Order 的存取權，不需要重新購買。

**Interface / data shape**：

```typescript
// packages/api/modules/organization/procedures/assign-instructor-role.ts
type AssignInstructorRoleInput = {
  organizationId: string
  memberId: string
  role: "instructor" | "user"
}
// 僅 organizationId 對應組織的 owner/admin 可呼叫；其餘角色呼叫回傳 403
```

```sql
-- packages/database/prisma/schema.prisma 對應 migration
ALTER TABLE "order" ADD COLUMN "organizationId" TEXT REFERENCES "organization"("id") ON DELETE SET NULL;
CREATE INDEX "order_organization_id_idx" ON "order" ("organizationId");
```

**Failure modes**：
- 非 `owner`／`admin` 呼叫 `assignInstructorRole` → HTTP 403，角色不變
- 呼叫時 `role` 不是 `instructor` 或 `user`（例如試圖指派 `owner`／`admin`，那不屬於這個 procedure 的職責）→ HTTP 400
- `instructor` 嘗試查看組織訂單列表 → 拒絕，回傳既有 API 層一致的權限錯誤

**Acceptance criteria**：
- 對應 `organization-tenancy` 既有 5 條 Requirement 與本次新增 Requirement 的所有 Scenario 各自有一個測試案例
- `pnpm test`／`pnpm type-check`／`pnpm build` 全數通過
- 手動測試：建立測試組織 → 用 Order 設定 `organizationId` → 加入新 Member → 確認新 Member 立即能看課程

**Scope boundaries**：範圍內＝角色矩陣強制、講師指派 UI、`Order.organizationId`、courseAccess 聯集查詢、Invitation email；範圍外＝座位制訂閱 hook、企業定價、組織發票、成員人數上限。

## Risks / Trade-offs

- [Risk] Better Auth `organization` plugin 自己寫入 `role` 字串的行為若跟四值 enum 不相容，migration 會卡住 → Mitigation：apply 階段先在測試環境跑一次 plugin 原生流程觀察實際寫入值，再決定 enum 或 hook 檢查
- [Risk] `Order.organizationId` 加上去後，既有所有查詢 `courseAccess` 的地方如果沒有全部更新去檢查 Organization 聯集，會出現「企業帳號付了錢、員工卻進不去」的假象 bug → Mitigation：`grep -rn "courseAccess" packages/ apps/` 找出所有查詢點，逐一確認都改成 User-or-Organization 聯集查詢，CR 階段列成檢查清單逐項核對
- [Risk] 既有座位制訂閱 hook（`updateSeatsInOrganizationSubscription`）在 `accept-invitation`／`remove-member` 事件仍會被觸發執行，若未來意外真的有座位制購買記錄，可能呼叫到未正確設定的 payments provider → Mitigation：本次不動這段程式碼，但 CR 階段確認目前 `organization.purchases.length === 0` 時提早 return 的安全機制仍然成立，不因本次改動而失效

## Migration Plan

1. apply 階段先實測 Better Auth plugin 對 `Member.role` 的原生寫入行為，決定 enum 或 hook 檢查方案
2. 實作角色四值強制
3. `Order` 新增可為空的 `organizationId` 欄位與 migration（不影響既有資料，既有 Order 皆為 `null`）
4. 修改所有查詢 `courseAccess` 的地方加入 Organization 聯集判斷
5. `admin/organizations` 頁面新增講師指派/撤銷 UI
6. 驗證 Invitation email 通知正常送達
7. Rollback：全部為新增欄位與新增邏輯分支，未修改既有 User-only 購買行為；回滾＝revert commit，既有買家不受影響

## Open Questions

- 角色欄位最終採用 DB enum 還是應用層字串檢查，待 apply 階段實測 Better Auth plugin 行為後決定
- 企業帳號的成員人數是否需要上限或分級定價，本次不定義，若未來有需求另開 change
