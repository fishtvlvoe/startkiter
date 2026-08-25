# Code Review：organization-enterprise-account

日期：2026-08-25

## Verdict

- Critical：0
- High：0
- Medium：0
- Low：0

## Correctness

- `Member.role` 的 Better Auth hook、Prisma CHECK constraint 與 partial unique owner index 共同保護四值角色與單一 owner。
- `assignInstructorRole` 先驗證 actor 是同組織 owner/admin，再驗證 target member 屬於同組織且只允許 `user`／`instructor` 互換。
- 課程存取查詢集中在 `getCourseAccessOrdersForUser`，以個人 `userId` 與所有 membership 的 `organizationId` 聯集；`courseAccess=false` 的退款訂單不會進入結果。
- `kitClaimEligible` 使用同一個 User-or-Organization scope。
- 組織訂單列表拒絕 `instructor`；個人訂單查詢仍維持原本的本人 scope。
- invitation 只呼叫既有 `@startkiter/mail` 的 `organizationInvitation` template，沒有新增 LINE 發送路徑。

## Security

- API procedure 與 UI `organization.manage` 檢查形成雙層邊界；UI 隱藏不等於授權，API 仍拒絕 instructor/user/跨組織 target。
- `Order.organizationId` 為 nullable，外鍵使用 `ON DELETE SET NULL`，不會因刪除組織刪除歷史訂單。
- migration、測試與 diff 未新增 secrets。

## Performance

- `member.userId`、`order.userId`、`order.organizationId` 皆有索引；訂單查詢只 select `sku`／權限欄位。
- 每次存取權判斷先取得使用者的組織 ID，再以單一 Order query 做聯集，沒有逐 member 複製授權資料。

## Regression check

- `updateSeatsInOrganizationSubscription` 與其 invitation/remove-member hook 未被改動。
- Focused tests、type-check、migration status 與既有 course access tests 已通過；`pnpm build` 已通過。全域 `pnpm test` 只剩既有 design-system token 測試失敗，依 Fish 裁定不修改該全域資源，改以 organization/course/payment focused tests 驗收。
