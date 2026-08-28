# vps-production-deployment Specification

## Purpose

TBD - created by archiving change 'vps-production-deployment'. Update Purpose after archive.

## Requirements

### Requirement: A repeatable production deployment SOP exists for the Coolify-managed VPS

A document SHALL exist at `docs/vps-deployment-sop.md` that describes a repeatable procedure for deploying `apps/saas` and `apps/marketing` to a Coolify-managed VPS, covering prerequisites, Coolify resource creation, environment variable configuration, DNS and SSL verification, and troubleshooting for known failure modes.

#### Scenario: The SOP document covers all required sections

- **WHEN** `docs/vps-deployment-sop.md` is read
- **THEN** it MUST contain sections covering prerequisites, Coolify resource creation steps, an environment variable classification list, DNS/SSL verification steps, and a troubleshooting section that documents the root cause of the 2026-08-26 `startkiter.dev` 503 incident

#### Scenario: The SOP replaces the prior non-final runbook status

- **WHEN** `docs/coolify-vps-setup-runbook.md` is read after this change is applied
- **THEN** it MUST NOT contain the self-declared caveat that the recorded procedure is not the final procedure to teach buyers


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
### Requirement: VPS-level secrets are classified and never recorded in plaintext within deployment documentation or scripts

Deployment documentation and any deployment scripts SHALL classify every environment variable as either secret or non-secret, and secret values MUST NOT appear in plaintext in any committed file, including example values in documentation.

#### Scenario: The SOP documents which variables are secret

- **WHEN** `docs/vps-deployment-sop.md`'s environment variable section is read
- **THEN** it MUST explicitly mark `SETTINGS_ENCRYPTION_KEY` and `DATABASE_URL` as secret variables that MUST be set through the Coolify secret-variable interface, not committed to any repository file

##### Example: A secret variable reference in documentation

| Variable | Classification | How it is set |
| --- | --- | --- |
| `SETTINGS_ENCRYPTION_KEY` | secret | Coolify secret environment variable, value never appears in this document |
| `NEXT_PUBLIC_SITE_URL` | non-secret | Coolify plain environment variable; an example value SHALL be permitted to appear in this document |


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
### Requirement: The database hosting strategy and VPS sizing are recorded as an explicit decision, not left as an open discussion

The system's database hosting strategy (external Neon versus self-hosted PostgreSQL on the VPS) and the production VPS's CPU/memory tier SHALL be recorded as an explicit, dated decision in `docs/vps-deployment-sop.md`, replacing the prior undecided "leaning toward" language in discussion notes.

#### Scenario: The SOP states the current database strategy unambiguously

- **WHEN** `docs/vps-deployment-sop.md` is read
- **THEN** it MUST state whether the database is hosted on external Neon or self-hosted on the VPS, and MUST NOT contain unresolved hedging phrases such as "leaning toward" or an unfilled placeholder marker

#### Scenario: The SOP states the current VPS tier and the reasoning for it

- **WHEN** `docs/vps-deployment-sop.md` is read
- **THEN** it MUST state the VPS's current vCPU/memory tier and record the reasoning for that tier given the known concurrent workloads (`apps/saas`, `apps/marketing`, and Chatwoot if already deployed by the `unified-support-desk` change)

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