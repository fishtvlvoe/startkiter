# buyer-docs-site Specification

## Purpose

TBD - created by archiving change 'buyer-docs-site'. Update Purpose after archive.

## Requirements

### Requirement: A dedicated docs app renders buyer-facing technical documentation

The system SHALL provide a standalone `apps/docs` Next.js application, built with Fumadocs, that renders MDX content from `content/docs/**/*.mdx` with sidebar navigation and full-text search, independent from the `apps/marketing` and `apps/saas` applications.

#### Scenario: Visitor loads the docs home page

- **WHEN** a visitor requests the docs app root path `/`
- **THEN** the server MUST return a rendered page listing the available documentation sections in a sidebar navigation

#### Scenario: Visitor navigates into a documentation page

- **WHEN** a visitor clicks a sidebar link to any page under `content/docs/**/*.mdx`
- **THEN** the corresponding MDX content MUST render, including tables and syntax-highlighted code blocks

#### Scenario: Visitor searches documentation content

- **WHEN** a visitor enters a query into the docs search UI
- **THEN** the system MUST return matching documentation pages ranked by relevance


<!-- @trace
source: buyer-docs-site
updated: 2026-08-28
code:
  - apps/saas/lib/orders.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/api/checkout/status/route.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/dashboard/status.html
  - apps/docs/source.config.ts
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/marketing/Dockerfile
  - apps/saas/app/api/payuni/period-notify/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - apps/docs/content/docs/index.mdx
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/marketing/config.ts
  - apps/docs/lib/search-tokenizer.ts
  - apps/docs/AGENTS.md
  - apps/docs/app/global.css
  - apps/docs/app/layout.tsx
  - apps/docs/postcss.config.mjs
  - apps/docs/next.config.ts
  - vitest.config.ts
  - docs/deploy-and-public-url.md
  - apps/docs/content/docs/deployment/meta.json
  - apps/saas/app/api/shopline/notify/route.ts
  - packages/payments/provider/payuni/gateway.ts
  - AGENTS.md
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - packages/payments/provider/payuni/period-gateway.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/database/prisma/zod/index.ts
  - apps/marketing/content/posts/guest-access.mdx
  - apps/docs/vitest.config.ts
  - apps/marketing/content/legal/terms.de.md
  - packages/payments/provider/payuni/crypto.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/i18n/translations/fr/marketing.json
  - packages/i18n/lib/get-messages.ts
  - apps/docs/lib/source.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/docs/CLAUDE.md
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/lib/invoice-issue-input.ts
  - apps/docs/global.d.ts
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - packages/ui/components/logo.tsx
  - apps/marketing/content/posts/second-post.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/send-welcome-email.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - packages/i18n/translations/es/marketing.json
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - apps/docs/mdx-components.tsx
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/package.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/clean-package-promotion-guide.md
  - packages/payments/config.ts
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - docs/coolify-vps-setup-runbook.md
  - packages/api/modules/course/lib/invoice-events.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - README.md
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/content/docs/deployment/overview.mdx
  - apps/docs/content/docs/meta.json
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/i18n/translations/zh-tw/marketing.json
  - packages/payments/gateway-settings.ts
  - pnpm-workspace.yaml
  - packages/payments/provider/stripe/gateway.ts
  - packages/i18n/translations/de/marketing.json
  - apps/saas/lib/invoice-settings.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/marketing/content/legal/terms.md
  - packages/payments/provider/ezpay/invoice-provider.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - apps/marketing/content/legal/privacy-policy.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - packages/payments/index.ts
  - packages/payments/credentials.ts
  - apps/docs/app/api/search/route.ts
  - docs/vps-deployment-sop.md
  - apps/docs/tsconfig.json
  - apps/saas/lib/checkout-gateway-settings.ts
  - packages/payments/provider/invoice-query-errors.ts
  - packages/i18n/translations/en/marketing.json
  - apps/marketing/modules/home/components/FeaturePreview.tsx
tests:
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - packages/i18n/marketing-demo-content.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/marketing/tests/home.spec.ts
  - apps/marketing/tests/blog.spec.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/i18n/i18n.test.ts
  - packages/payments/checkout-gateway.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - apps/docs/content.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/payments/config.test.ts
-->

---
### Requirement: Documentation covers environment variables, local development, Core/Plugin boundaries, and upstream sync

The system SHALL publish documentation pages that explain how to configure environment variables, start local development, understand the Core/Plugin extension boundary, and use the upstream sync mechanism, derived from the existing `apps/saas/.env.example`, `README.md`, and `docs/core-boundary-and-extension-guide.md` source material.

#### Scenario: Buyer looks up whether an environment variable is required

- **WHEN** a buyer opens the environment variables documentation page
- **THEN** the page MUST list each variable from `apps/saas/.env.example` with a required-or-optional marker determined by whether the codebase provides a fallback default for that variable

#### Scenario: Buyer looks up the Core/Plugin boundary rules

- **WHEN** a buyer opens the Core/Plugin boundary documentation page
- **THEN** the page MUST list the same Core modules, Mount Point kinds (`route`, `menu`, `content`), and `dataSpec` values (`"content"`, `"none"`) as defined in `docs/core-boundary-and-extension-guide.md` and enforced by `packages/platform/src/types.ts`

#### Scenario: Buyer looks up how to pull upstream updates

- **WHEN** a buyer opens the upstream sync documentation page
- **THEN** the page MUST describe the `git fetch startkiter-upstream` and `git merge` workflow and state that merge conflicts from buyer-modified Core files are the buyer's responsibility


<!-- @trace
source: buyer-docs-site
updated: 2026-08-28
code:
  - apps/saas/lib/orders.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/api/checkout/status/route.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/dashboard/status.html
  - apps/docs/source.config.ts
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/marketing/Dockerfile
  - apps/saas/app/api/payuni/period-notify/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - apps/docs/content/docs/index.mdx
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/marketing/config.ts
  - apps/docs/lib/search-tokenizer.ts
  - apps/docs/AGENTS.md
  - apps/docs/app/global.css
  - apps/docs/app/layout.tsx
  - apps/docs/postcss.config.mjs
  - apps/docs/next.config.ts
  - vitest.config.ts
  - docs/deploy-and-public-url.md
  - apps/docs/content/docs/deployment/meta.json
  - apps/saas/app/api/shopline/notify/route.ts
  - packages/payments/provider/payuni/gateway.ts
  - AGENTS.md
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - packages/payments/provider/payuni/period-gateway.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/database/prisma/zod/index.ts
  - apps/marketing/content/posts/guest-access.mdx
  - apps/docs/vitest.config.ts
  - apps/marketing/content/legal/terms.de.md
  - packages/payments/provider/payuni/crypto.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/i18n/translations/fr/marketing.json
  - packages/i18n/lib/get-messages.ts
  - apps/docs/lib/source.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/docs/CLAUDE.md
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/lib/invoice-issue-input.ts
  - apps/docs/global.d.ts
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - packages/ui/components/logo.tsx
  - apps/marketing/content/posts/second-post.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/send-welcome-email.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - packages/i18n/translations/es/marketing.json
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - apps/docs/mdx-components.tsx
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/package.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/clean-package-promotion-guide.md
  - packages/payments/config.ts
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - docs/coolify-vps-setup-runbook.md
  - packages/api/modules/course/lib/invoice-events.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - README.md
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/content/docs/deployment/overview.mdx
  - apps/docs/content/docs/meta.json
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/i18n/translations/zh-tw/marketing.json
  - packages/payments/gateway-settings.ts
  - pnpm-workspace.yaml
  - packages/payments/provider/stripe/gateway.ts
  - packages/i18n/translations/de/marketing.json
  - apps/saas/lib/invoice-settings.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/marketing/content/legal/terms.md
  - packages/payments/provider/ezpay/invoice-provider.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - apps/marketing/content/legal/privacy-policy.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - packages/payments/index.ts
  - packages/payments/credentials.ts
  - apps/docs/app/api/search/route.ts
  - docs/vps-deployment-sop.md
  - apps/docs/tsconfig.json
  - apps/saas/lib/checkout-gateway-settings.ts
  - packages/payments/provider/invoice-query-errors.ts
  - packages/i18n/translations/en/marketing.json
  - apps/marketing/modules/home/components/FeaturePreview.tsx
tests:
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - packages/i18n/marketing-demo-content.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/marketing/tests/home.spec.ts
  - apps/marketing/tests/blog.spec.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/i18n/i18n.test.ts
  - packages/payments/checkout-gateway.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - apps/docs/content.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/payments/config.test.ts
-->

---
### Requirement: Deployment documentation is scaffolded but explicitly marked incomplete

The system SHALL publish a deployment documentation section with section headings and a placeholder notice, and SHALL NOT publish specific deployment operational steps as finalized content until those steps have been validated by a separate change.

#### Scenario: Buyer opens the deployment section before it is filled in

- **WHEN** a buyer opens the deployment documentation section
- **THEN** the page MUST display an explicit notice stating that detailed deployment steps are pending and MUST NOT present unvalidated deployment commands as authoritative instructions


<!-- @trace
source: buyer-docs-site
updated: 2026-08-28
code:
  - apps/saas/lib/orders.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/api/checkout/status/route.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/dashboard/status.html
  - apps/docs/source.config.ts
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/marketing/Dockerfile
  - apps/saas/app/api/payuni/period-notify/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - apps/docs/content/docs/index.mdx
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/marketing/config.ts
  - apps/docs/lib/search-tokenizer.ts
  - apps/docs/AGENTS.md
  - apps/docs/app/global.css
  - apps/docs/app/layout.tsx
  - apps/docs/postcss.config.mjs
  - apps/docs/next.config.ts
  - vitest.config.ts
  - docs/deploy-and-public-url.md
  - apps/docs/content/docs/deployment/meta.json
  - apps/saas/app/api/shopline/notify/route.ts
  - packages/payments/provider/payuni/gateway.ts
  - AGENTS.md
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - packages/payments/provider/payuni/period-gateway.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/database/prisma/zod/index.ts
  - apps/marketing/content/posts/guest-access.mdx
  - apps/docs/vitest.config.ts
  - apps/marketing/content/legal/terms.de.md
  - packages/payments/provider/payuni/crypto.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/i18n/translations/fr/marketing.json
  - packages/i18n/lib/get-messages.ts
  - apps/docs/lib/source.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/docs/CLAUDE.md
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/lib/invoice-issue-input.ts
  - apps/docs/global.d.ts
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - packages/ui/components/logo.tsx
  - apps/marketing/content/posts/second-post.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/send-welcome-email.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - packages/i18n/translations/es/marketing.json
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - apps/docs/mdx-components.tsx
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/package.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/clean-package-promotion-guide.md
  - packages/payments/config.ts
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - docs/coolify-vps-setup-runbook.md
  - packages/api/modules/course/lib/invoice-events.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - README.md
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/content/docs/deployment/overview.mdx
  - apps/docs/content/docs/meta.json
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/i18n/translations/zh-tw/marketing.json
  - packages/payments/gateway-settings.ts
  - pnpm-workspace.yaml
  - packages/payments/provider/stripe/gateway.ts
  - packages/i18n/translations/de/marketing.json
  - apps/saas/lib/invoice-settings.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/marketing/content/legal/terms.md
  - packages/payments/provider/ezpay/invoice-provider.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - apps/marketing/content/legal/privacy-policy.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - packages/payments/index.ts
  - packages/payments/credentials.ts
  - apps/docs/app/api/search/route.ts
  - docs/vps-deployment-sop.md
  - apps/docs/tsconfig.json
  - apps/saas/lib/checkout-gateway-settings.ts
  - packages/payments/provider/invoice-query-errors.ts
  - packages/i18n/translations/en/marketing.json
  - apps/marketing/modules/home/components/FeaturePreview.tsx
tests:
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - packages/i18n/marketing-demo-content.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/marketing/tests/home.spec.ts
  - apps/marketing/tests/blog.spec.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/i18n/i18n.test.ts
  - packages/payments/checkout-gateway.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - apps/docs/content.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/payments/config.test.ts
-->

---
### Requirement: Adding the docs app does not break existing monorepo builds

The system SHALL add `apps/docs` as an independent workspace package without modifying the build, type-check, or runtime behavior of `apps/marketing` or `apps/saas`.

#### Scenario: Monorepo-wide build succeeds after adding the docs app

- **WHEN** `pnpm build` runs at the repository root after `apps/docs` is added
- **THEN** the build MUST succeed for `apps/marketing`, `apps/saas`, and `apps/docs`, and no existing app's build output MUST change as a result of adding `apps/docs`

#### Scenario: Monorepo-wide type-check succeeds after adding the docs app

- **WHEN** `pnpm type-check` runs at the repository root after `apps/docs` is added
- **THEN** the check MUST pass for all workspace packages including the new `apps/docs` package

<!-- @trace
source: buyer-docs-site
updated: 2026-08-28
code:
  - apps/saas/lib/orders.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/api/checkout/status/route.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/dashboard/status.html
  - apps/docs/source.config.ts
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/marketing/Dockerfile
  - apps/saas/app/api/payuni/period-notify/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - apps/docs/content/docs/index.mdx
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/marketing/config.ts
  - apps/docs/lib/search-tokenizer.ts
  - apps/docs/AGENTS.md
  - apps/docs/app/global.css
  - apps/docs/app/layout.tsx
  - apps/docs/postcss.config.mjs
  - apps/docs/next.config.ts
  - vitest.config.ts
  - docs/deploy-and-public-url.md
  - apps/docs/content/docs/deployment/meta.json
  - apps/saas/app/api/shopline/notify/route.ts
  - packages/payments/provider/payuni/gateway.ts
  - AGENTS.md
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - packages/payments/provider/payuni/period-gateway.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/database/prisma/zod/index.ts
  - apps/marketing/content/posts/guest-access.mdx
  - apps/docs/vitest.config.ts
  - apps/marketing/content/legal/terms.de.md
  - packages/payments/provider/payuni/crypto.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/i18n/translations/fr/marketing.json
  - packages/i18n/lib/get-messages.ts
  - apps/docs/lib/source.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/docs/CLAUDE.md
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/lib/invoice-issue-input.ts
  - apps/docs/global.d.ts
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - packages/ui/components/logo.tsx
  - apps/marketing/content/posts/second-post.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/send-welcome-email.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - packages/i18n/translations/es/marketing.json
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - apps/docs/mdx-components.tsx
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/package.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/clean-package-promotion-guide.md
  - packages/payments/config.ts
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - docs/coolify-vps-setup-runbook.md
  - packages/api/modules/course/lib/invoice-events.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - README.md
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/content/docs/deployment/overview.mdx
  - apps/docs/content/docs/meta.json
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/i18n/translations/zh-tw/marketing.json
  - packages/payments/gateway-settings.ts
  - pnpm-workspace.yaml
  - packages/payments/provider/stripe/gateway.ts
  - packages/i18n/translations/de/marketing.json
  - apps/saas/lib/invoice-settings.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/marketing/content/legal/terms.md
  - packages/payments/provider/ezpay/invoice-provider.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - apps/marketing/content/legal/privacy-policy.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - packages/payments/index.ts
  - packages/payments/credentials.ts
  - apps/docs/app/api/search/route.ts
  - docs/vps-deployment-sop.md
  - apps/docs/tsconfig.json
  - apps/saas/lib/checkout-gateway-settings.ts
  - packages/payments/provider/invoice-query-errors.ts
  - packages/i18n/translations/en/marketing.json
  - apps/marketing/modules/home/components/FeaturePreview.tsx
tests:
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - packages/i18n/marketing-demo-content.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/marketing/tests/home.spec.ts
  - apps/marketing/tests/blog.spec.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/i18n/i18n.test.ts
  - packages/payments/checkout-gateway.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - apps/docs/content.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/payments/config.test.ts
-->