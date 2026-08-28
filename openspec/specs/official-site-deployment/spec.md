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

The `apps/marketing` application SHALL be reachable at the official domain `startkiter.dev`, and the deployed resource's underlying container health SHALL be verified as part of any deployment acceptance check, not only the domain's DNS resolution.

#### Scenario: The official domain serves the marketing site

- **WHEN** an HTTP request is made to `https://startkiter.dev`
- **THEN** the response MUST be a successful status or a valid redirect (not a connection failure), and MUST NOT be an HTTP 5xx status

##### Example: A 503 with a plain-text body is a failing deployment, not a passing one

- **GIVEN** `curl -I https://startkiter.dev` returns `HTTP/2 503` with `content-type: text/plain`
- **WHEN** this response is evaluated against the acceptance check
- **THEN** the deployment MUST be recorded as failing, and the underlying Coolify resource's container status MUST be inspected before the deployment is marked complete

#### Scenario: A deployment acceptance check records the underlying resource state, not only the HTTP status code

- **WHEN** a deployment of `apps/marketing` is verified as part of any change's task completion
- **THEN** the verification record MUST include both the HTTP response check and the Coolify resource's running/stopped/crashed state at the time of verification, so a later regression can be distinguished from a check that was never actually run against live infrastructure


<!-- @trace
source: vps-production-deployment
updated: 2026-08-28
code:
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - apps/docs/mdx-components.tsx
  - apps/marketing/content/posts/second-post.mdx
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/content/docs/deployment/meta.json
  - apps/saas/app/api/payuni/period-notify/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - apps/docs/app/[[...slug]]/page.tsx
  - apps/marketing/content/legal/privacy-policy.md
  - apps/docs/package.json
  - apps/marketing/content/legal/terms.de.md
  - apps/docs/source.config.ts
  - apps/saas/app/api/checkout/status/route.ts
  - apps/saas/lib/orders.ts
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - packages/database/prisma/zod/index.ts
  - apps/saas/lib/checkout-gateway-settings.ts
  - tooling/scripts/promote-clean-package.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - packages/payments/provider/shopline/gateway.ts
  - packages/payments/index.ts
  - apps/docs/next.config.ts
  - packages/payments/credentials.ts
  - packages/i18n/translations/en/marketing.json
  - apps/docs/postcss.config.mjs
  - pnpm-workspace.yaml
  - apps/docs/content/docs/getting-started/local-development.mdx
  - packages/payments/provider/payuni/crypto.ts
  - packages/api/modules/course/lib/send-welcome-email.ts
  - apps/marketing/config.ts
  - AGENTS.md
  - packages/payments/gateway-settings.ts
  - apps/docs/CLAUDE.md
  - apps/docs/content/docs/getting-started/meta.json
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - apps/marketing/Dockerfile
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/stripe/gateway.ts
  - apps/docs/app/api/search/route.ts
  - packages/i18n/translations/fr/marketing.json
  - apps/docs/app/global.css
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/marketing/content/posts/first-post.de.mdx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/marketing/modules/home/components/FeaturePreview.tsx
  - packages/payments/provider/payuni/gateway.ts
  - apps/docs/vitest.config.ts
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - docs/vps-deployment-sop.md
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - apps/docs/content/docs/deployment/overview.mdx
  - packages/i18n/translations/es/marketing.json
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/marketing/content/legal/terms.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - apps/docs/app/layout.tsx
  - packages/api/modules/course/lib/webhook-events.ts
  - apps/saas/lib/invoice-settings.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - packages/ui/components/logo.tsx
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/clean-package-promotion-guide.md
  - packages/payments/provider/invoice-query-errors.ts
  - apps/docs/tsconfig.json
  - packages/payments/provider/ezpay/invoice-provider.ts
  - apps/docs/lib/search-tokenizer.ts
  - apps/docs/content/docs/meta.json
  - apps/docs/lib/source.ts
  - apps/docs/global.d.ts
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - README.md
  - packages/payments/types.ts
  - packages/payments/lib/invoice-issue-input.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - docs/dashboard/status.html
  - packages/payments/provider/ecpay/invoice-provider.ts
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - packages/i18n/lib/get-messages.ts
  - packages/i18n/translations/de/marketing.json
  - docs/deploy-and-public-url.md
  - packages/database/prisma/schema.prisma
  - apps/docs/content/docs/index.mdx
  - apps/marketing/content/posts/guest-access.mdx
  - packages/i18n/translations/zh-tw/marketing.json
  - vitest.config.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - apps/docs/AGENTS.md
  - apps/saas/app/api/shopline/notify/route.ts
  - packages/payments/config.ts
  - docs/coolify-vps-setup-runbook.md
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - apps/marketing/modules/home/components/PricingSection.tsx
tests:
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/i18n/marketing-demo-content.test.ts
  - apps/marketing/tests/home.spec.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/payments/config.test.ts
  - apps/docs/content.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - packages/i18n/i18n.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - apps/marketing/tests/blog.spec.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/ui/components/ui.test.tsx
  - apps/marketing/tests/changelog.spec.ts
  - packages/payments/checkout-gateway.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/payments/gateway-settings.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
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