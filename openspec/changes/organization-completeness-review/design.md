# Design: organization-completeness-review

## Organization checkout → member course access

When a signed-in user has `session.activeOrganizationId` set and is a verified member of that organization, `/api/checkout` stamps `Order.organizationId` with the active organization id. Course access queries (`getCourseAccessOrdersForUser`) already union personal orders with orders whose `organizationId` matches any organization the user belongs to, so other members inherit access without extra revocation logic.

Personal checkout (no active organization) continues to create user-scoped orders with `organizationId = null`.

## Delete organization policy

Deleting an organization is owner-only (`organization.delete`). Behavior is explicit and fail-safe:

- **Members**: `Member` rows cascade-delete with the organization. Removed members immediately stop matching org-scoped orders in `getOrganizationIdsForUser`.
- **Orders**: `Order.organization` uses `onDelete: SetNull`. Paid orders remain on the purchasing user's `userId`; `organizationId` is cleared but `courseAccess` is unchanged. The buyer keeps personal entitlement; former org members lose shared access because the order no longer matches their org membership scope.
- **Subscriptions**: `auth.ts` hooks cancel active organization `Purchase` subscriptions before delete (existing behavior).
- **No explicit course-access revocation job**: membership-scoped queries are the source of truth; we do not mutate `courseAccess` on delete or member removal.

This policy preserves financial records and buyer entitlement while ending team-wide sharing when the org is removed.
