## Why

StartKiter 目前取得課程存取權只有三種管道：一次買斷 Order、Bundle、訂閱（`payuni-recurring-billing` 已完成）。woomin 的 `CourseInvite` 提供第四種管道：operator 產生邀請連結（token 以 hash 存放，不存明文，避免資料庫洩漏時邀請碼被直接使用），可限定 email、使用次數、有效期限，讓買家能免費贈送課程存取權（促銷、合作、售後補償等情境）。這次要接進既有 `canAccessCourseId` 授權判斷架構，跟 `bundle-aware-course-access`／`payuni-recurring-billing` 兩次擴充 `BundleCourseAccessReader` 的模式一致。

這是修改 `course-module` capability（課程存取權判斷）的既有 Core 邏輯，不是獨立 Plugin——授予課程存取權的機制屬於 `platform-core-boundary` 明文列為 Core 能力的範疇。

## What Changes

- 新增 `CourseInvite` model：`courseId`、`tokenHash`（unique，token 本身只在建立時明文回傳一次）、`email`（null 代表不限特定信箱）、`maxUses`、`usedCount`、`expiresAt`、`active`、`createdBy`
- 新增 `CourseInviteRedemption` model：記錄 `userId`、`courseId`、`inviteId`、`redeemedAt`，`@@unique([userId, courseId])` 防止同一使用者對同一課程重複兌換
- `BundleCourseAccessReader`（`packages/course/access.ts`）新增方法 `hasRedeemedInvite: (userId, courseId) => Promise<boolean>`，`canAccessCourseId` 在既有判斷都不成立時最後呼叫此方法，比照 `payuni-recurring-billing` 那次新增 `hasActiveSubscription` 的同一模式
- 新增兌換流程：買家點擊邀請連結（`/invite/[token]`）→ 若未登入先導向登入/註冊 → 驗證 token（hash 比對、檢查 `active`／`expiresAt`／`maxUses`／`email` 限制）→ 成功建立 `CourseInviteRedemption`，`usedCount` 遞增
- Operator 後台新增邀請連結管理頁：建立邀請（設定限制條件）、查看兌換記錄、停用邀請

## Non-Goals

- 不做邀請連結的批量產生（CSV 匯入信箱清單一次產生多個邀請）
- 不做邀請到期前的自動提醒信
- 不修改 `payuni-checkout`／`subscription-billing` 既有付費路徑
- 不做邀請碼撤銷後已兌換記錄的回收（一旦兌換成功即永久生效，停用邀請只影響尚未兌換的部分）

## Capabilities

### Modified Capabilities

- `course-module`：`canAccessCourseId` 新增「透過邀請碼兌換」的授權來源

## Impact

- Affected specs: `course-module`（修改）
- Affected code：
  - New:
    - `apps/saas/app/(authenticated)/invite/[token]/page.tsx`
    - `apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx`
    - `packages/api/modules/course/procedures/redeem-course-invite.ts`
    - `packages/api/modules/course/procedures/redeem-course-invite.test.ts`
    - `packages/api/modules/course/procedures/create-course-invite.ts`
    - `packages/api/modules/course/procedures/create-course-invite.test.ts`
    - `packages/database/prisma/migrations/`（新增 `CourseInvite`／`CourseInviteRedemption` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/course/access.ts`（`BundleCourseAccessReader` 新增方法）
    - `packages/api/modules/course/lib/course-access.ts`（production reader 實作新方法）
    - `packages/course/access.test.ts`
  - Removed: 無
- Dependencies 新增：無（token hash 用既有 `node:crypto`）
- 環境變數新增：無
