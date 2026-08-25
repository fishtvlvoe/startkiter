# official-site-deployment Specification

## Purpose

TBD - created by archiving change 'startkiter-official-site-cleanup'. Update Purpose after archive.

## Requirements

### Requirement: The SaaS application is deployed on Coolify-managed VPS infrastructure

The `apps/saas` application SHALL be served from the Coolify-managed VPS fleet at the domain `app.startkiter.dev`, and SHALL NOT depend on the previously used Vercel deployment for production traffic.

#### Scenario: The production SaaS domain responds successfully

- **WHEN** an HTTP request is made to `https://app.startkiter.dev`
- **THEN** the response MUST be a successful status or a valid redirect (not a connection failure or 5xx error)


<!-- @trace
source: startkiter-official-site-cleanup
updated: 2026-08-25
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/auth/client.ts
  - packages/database/prisma/migrations/20260825150000_enforce_organization_member_roles/migration.sql
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/lib/course-access.ts
  - packages/database/prisma/queries/index.ts
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - packages/database/drizzle/schema/sqlite.ts
  - packages/database/prisma/zod/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/auth/lib/organization-roles.ts
  - packages/database/prisma/migrations/20260825170000_add_order_organization/migration.sql
  - packages/i18n/translations/fr/saas.json
  - apps/marketing/Dockerfile
  - packages/api/modules/payments/procedures/list-purchases.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/i18n/translations/de/saas.json
  - apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - packages/database/prisma/migrations/20260825160000_enforce_one_organization_owner/migration.sql
  - packages/auth/lib/organization-role-hooks.ts
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/queries/orders.ts
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - packages/i18n/translations/en/saas.json
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - packages/permissions/definition.ts
  - apps/marketing/next.config.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/api/modules/organizations/router.ts
  - packages/i18n/translations/es/saas.json
  - packages/api/modules/course/lib/course-access.ts
  - packages/permissions/create-permission-rules.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/lib/github-kit.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/auth/auth.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/auth/lib/organization-member-role-order.ts
  - packages/database/drizzle/schema/mysql.ts
  - packages/i18n/translations/zh-tw/saas.json
  - packages/auth/lib/organization-invitation-email.ts
  - packages/database/drizzle/schema/postgres.ts
tests:
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/auth/lib/organization-role-hooks.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/auth/lib/organization-roles.test.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.test.ts
  - packages/api/modules/organizations/lib/membership.test.ts
  - packages/auth/lib/better-auth-organization-probe.test.ts
  - packages/permissions/create-permission-rules.test.ts
  - packages/auth/lib/organization-invitation-email.test.ts
  - packages/api/modules/payments/procedures/list-purchases.test.ts
  - apps/saas/modules/organizations/lib/organization-role.test.ts
  - packages/database/prisma/queries/orders.test.ts
-->

---
### Requirement: The marketing site is deployed under the official domain

The `apps/marketing` application SHALL be reachable at the official domain `startkiter.dev`.

#### Scenario: The official domain serves the marketing site

- **WHEN** an HTTP request is made to `https://startkiter.dev`
- **THEN** the response MUST be a successful status or a valid redirect (not a connection failure)


<!-- @trace
source: startkiter-official-site-cleanup
updated: 2026-08-25
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/auth/client.ts
  - packages/database/prisma/migrations/20260825150000_enforce_organization_member_roles/migration.sql
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/lib/course-access.ts
  - packages/database/prisma/queries/index.ts
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - packages/database/drizzle/schema/sqlite.ts
  - packages/database/prisma/zod/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/auth/lib/organization-roles.ts
  - packages/database/prisma/migrations/20260825170000_add_order_organization/migration.sql
  - packages/i18n/translations/fr/saas.json
  - apps/marketing/Dockerfile
  - packages/api/modules/payments/procedures/list-purchases.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/i18n/translations/de/saas.json
  - apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - packages/database/prisma/migrations/20260825160000_enforce_one_organization_owner/migration.sql
  - packages/auth/lib/organization-role-hooks.ts
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/queries/orders.ts
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - packages/i18n/translations/en/saas.json
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - packages/permissions/definition.ts
  - apps/marketing/next.config.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/api/modules/organizations/router.ts
  - packages/i18n/translations/es/saas.json
  - packages/api/modules/course/lib/course-access.ts
  - packages/permissions/create-permission-rules.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/lib/github-kit.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/auth/auth.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/auth/lib/organization-member-role-order.ts
  - packages/database/drizzle/schema/mysql.ts
  - packages/i18n/translations/zh-tw/saas.json
  - packages/auth/lib/organization-invitation-email.ts
  - packages/database/drizzle/schema/postgres.ts
tests:
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/auth/lib/organization-role-hooks.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/auth/lib/organization-roles.test.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.test.ts
  - packages/api/modules/organizations/lib/membership.test.ts
  - packages/auth/lib/better-auth-organization-probe.test.ts
  - packages/permissions/create-permission-rules.test.ts
  - packages/auth/lib/organization-invitation-email.test.ts
  - packages/api/modules/payments/procedures/list-purchases.test.ts
  - apps/saas/modules/organizations/lib/organization-role.test.ts
  - packages/database/prisma/queries/orders.test.ts
-->

---
### Requirement: The legacy Vercel deployment is decommissioned

The previously used Vercel deployment (`test-startkiter.vercel.app`) SHALL NOT remain configured for automatic deployment from this repository once the Coolify deployment is confirmed stable.

#### Scenario: The legacy Vercel project no longer auto-deploys

- **WHEN** a new commit is pushed to the repository's default branch after this change is applied
- **THEN** the legacy Vercel project MUST NOT trigger a new deployment

<!-- @trace
source: startkiter-official-site-cleanup
updated: 2026-08-25
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/auth/client.ts
  - packages/database/prisma/migrations/20260825150000_enforce_organization_member_roles/migration.sql
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/lib/course-access.ts
  - packages/database/prisma/queries/index.ts
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - packages/database/drizzle/schema/sqlite.ts
  - packages/database/prisma/zod/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/auth/lib/organization-roles.ts
  - packages/database/prisma/migrations/20260825170000_add_order_organization/migration.sql
  - packages/i18n/translations/fr/saas.json
  - apps/marketing/Dockerfile
  - packages/api/modules/payments/procedures/list-purchases.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/i18n/translations/de/saas.json
  - apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - packages/database/prisma/migrations/20260825160000_enforce_one_organization_owner/migration.sql
  - packages/auth/lib/organization-role-hooks.ts
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/queries/orders.ts
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - packages/i18n/translations/en/saas.json
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - packages/permissions/definition.ts
  - apps/marketing/next.config.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/api/modules/organizations/router.ts
  - packages/i18n/translations/es/saas.json
  - packages/api/modules/course/lib/course-access.ts
  - packages/permissions/create-permission-rules.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/lib/github-kit.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/auth/auth.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/auth/lib/organization-member-role-order.ts
  - packages/database/drizzle/schema/mysql.ts
  - packages/i18n/translations/zh-tw/saas.json
  - packages/auth/lib/organization-invitation-email.ts
  - packages/database/drizzle/schema/postgres.ts
tests:
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/auth/lib/organization-role-hooks.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/auth/lib/organization-roles.test.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.test.ts
  - packages/api/modules/organizations/lib/membership.test.ts
  - packages/auth/lib/better-auth-organization-probe.test.ts
  - packages/permissions/create-permission-rules.test.ts
  - packages/auth/lib/organization-invitation-email.test.ts
  - packages/api/modules/payments/procedures/list-purchases.test.ts
  - apps/saas/modules/organizations/lib/organization-role.test.ts
  - packages/database/prisma/queries/orders.test.ts
-->