## Why

已封存的 `organization-role-model` change 定義了完整的四值角色矩陣（owner/admin/instructor/user）與權限邊界（`organization-tenancy` 規格），但該張 change 明講「不接資料庫 migration、不改任何一行程式碼」。目前底層 Better Auth `organization` plugin 與 `Organization`／`Member`／`Invitation` 資料表已經是 supastarter 原生存在，`Member.role` 目前是不受任何限制的自由字串，沒有程式碼強制四值角色矩陣；後台 `admin/organizations` 頁面只是 supastarter 原生列表元件，沒有講師指派、沒有課程存取權歸屬邏輯。老闆已確認未來要有「企業帳號」功能，這張 change 就是把既有規格真正落地實作，而不是繞過既有系統另外兜一套。

## What Changes

- 在角色寫入路徑（Better Auth `organization` plugin hook 或對應 API procedure）強制 `Member.role` 只能是 `owner`／`admin`／`instructor`／`user` 四值，落實既有 Requirement「Organization membership roles are a fixed four-value set」
- 落實既有 Requirement「Only owner or admin can assign or revoke the instructor role」：修改 `admin/organizations` 頁面，新增「指派／撤銷講師」操作，僅 `owner`／`admin` 可操作
- 落實既有 Requirement「Instructor role grants course content permissions but not billing visibility」：講師角色可編輯課程內容、不可查看組織訂單/買家名單
- `Order` model 新增可為空的 `organizationId` 欄位；當一筆 Order 設定 `organizationId` 時，該 Organization 目前所有 Member 皆繼承此 Order 的 `courseAccess`／`kitClaimEligible`（解決 `organization-role-model` 遺留的 Open Question：courseAccess 掛在 Organization 還是 Member 層級）
- Invitation 通知沿用既有 `packages/mail` 的 email 機制（解決遺留 Open Question：邀請通知走 email 還是 LINE——email 較符合企業帳號情境，LINE 保留給既有的學員社群與客服用途，不混用）
- 明確允許買家在自己帳號底下建立 Organization（企業帳號）；StartKiter 自己的官方站不強制使用 Organization，維持單一 User 身份即可運作（解決遺留 Open Question：StartKiter 自己的站要不要開放多組織）

## Non-Goals (optional)

- 不修改 `organization-tenancy` 既有 5 條 Requirement 的行為定義本身，本次只新增落地執行所需的補充 Requirement
- 不處理既有 `updateSeatsInOrganizationSubscription`（supastarter 原生座位制訂閱 hook）——目前沒有任何座位制訂閱商品會觸發這條路徑，維持原樣休眠，本次不移除也不啟用
- 不新增企業帳號專屬定價方案，仍是同一個 8800 TWD SKU，只是同組織成員可共享存取權
- 不做組織層級的統一發票／統編歸戶，發票欄位維持在 Order 個人層級，本次不擴充成組織層級發票
- 不做組織成員數量上限或計費邏輯（既有座位制訂閱 hook 休眠，本次不啟用故不需要）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `organization-tenancy`: 新增落地執行相關的 Requirement——角色寫入時強制四值檢查、courseAccess 可由 Organization 層級的 Order 繼承給全體 Member、邀請通知機制明確定為 email

## Impact

- Affected specs: Modified: `organization-tenancy`
- Affected code:
  - New: packages/api/modules/organization/procedures/assign-instructor-role.ts, packages/api/modules/organization/procedures/assign-instructor-role.test.ts
  - Modified:
    - packages/auth/auth.ts（角色寫入路徑新增四值檢查）
    - packages/database/prisma/schema.prisma（`Order` 新增可為空的 `organizationId` 欄位）
    - apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx（新增講師指派/撤銷操作入口）
    - packages/course/（課程內容編輯權限檢查新增 instructor 角色判斷）
  - Removed: （無）
- Dependencies 新增：無
- 環境變數新增：無
