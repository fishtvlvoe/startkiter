# marketing-site-content Specification

## Purpose

TBD - created by archiving change 'marketing-site-real-content'. Update Purpose after archive.

## Requirements

### Requirement: Pricing section displays the actual product offer

The marketing site's pricing section SHALL display the actual StartKiter product offer (a single one-time purchase priced 8800 TWD) and SHALL NOT display placeholder subscription plans unrelated to the real checkout logic.

#### Scenario: Pricing section shows the real one-time offer

- **WHEN** a visitor opens the marketing site home page in any supported locale
- **THEN** the pricing section MUST display exactly one plan card priced 8800 TWD as a one-time purchase, and MUST NOT display any USD-denominated recurring subscription plan

#### Scenario: Pricing section text is not empty

- **WHEN** a visitor opens the marketing site home page in zh-tw, zh-cn, or en
- **THEN** the pricing section's title, description, and feature list MUST render non-empty text, and MUST NOT render an empty or undefined value caused by a missing translation key


<!-- @trace
source: marketing-site-real-content
updated: 2026-08-28
code:
  - apps/docs/postcss.config.mjs
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/database/prisma/schema.prisma
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - packages/payments/lib/invoice-issue-input.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/docs/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - packages/database/prisma/zod/index.ts
  - packages/payments/provider/invoice-query-errors.ts
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/docs/app/api/search/route.ts
  - packages/ui/components/logo.tsx
  - docs/dashboard/status.html
  - apps/docs/content/docs/deployment/overview.mdx
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/app/layout.tsx
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/lib/checkout-gateway-settings.ts
  - apps/docs/lib/source.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - packages/i18n/translations/de/marketing.json
  - apps/marketing/content/legal/terms.md
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - apps/marketing/content/posts/second-post.mdx
  - apps/docs/AGENTS.md
  - packages/payments/gateway-settings.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/i18n/translations/es/marketing.json
  - packages/payments/config.ts
  - packages/api/modules/course/lib/send-welcome-email.ts
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - docs/clean-package-promotion-guide.md
  - packages/api/modules/course/lib/invoice-settings.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/docs/next.config.ts
  - apps/docs/content/docs/index.mdx
  - packages/i18n/translations/fr/marketing.json
  - apps/docs/lib/search-tokenizer.ts
  - apps/saas/lib/orders.ts
  - packages/i18n/lib/get-messages.ts
  - packages/payments/provider/payuni/gateway.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - vitest.config.ts
  - apps/docs/app/global.css
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/mdx-components.tsx
  - docs/coolify-vps-setup-runbook.md
  - apps/saas/app/api/shopline/notify/route.ts
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/tsconfig.json
  - apps/saas/app/api/checkout/status/route.ts
  - AGENTS.md
  - packages/payments/provider/ecpay/invoice-provider.ts
  - apps/docs/global.d.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - apps/docs/content/docs/meta.json
  - docs/deploy-and-public-url.md
  - apps/marketing/Dockerfile
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - pnpm-workspace.yaml
  - packages/payments/provider/payuni/crypto.ts
  - apps/marketing/content/posts/guest-access.mdx
  - packages/payments/credentials.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - README.md
  - apps/saas/lib/invoice-settings.ts
  - apps/marketing/modules/home/components/FeaturePreview.tsx
  - apps/marketing/config.ts
  - apps/marketing/content/legal/terms.de.md
  - apps/docs/CLAUDE.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - packages/api/modules/course/lib/order-refunds.ts
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/payments/provider/stripe/gateway.ts
  - docs/vps-deployment-sop.md
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/payments/types.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - apps/marketing/content/legal/privacy-policy.md
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/vitest.config.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/docs/source.config.ts
  - packages/i18n/translations/en/marketing.json
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/webhook-events.ts
  - apps/docs/content/docs/deployment/meta.json
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/i18n/translations/zh-tw/marketing.json
tests:
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/i18n/i18n.test.ts
  - apps/marketing/tests/blog.spec.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - apps/docs/content.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - packages/payments/checkout-gateway.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - apps/marketing/tests/home.spec.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - packages/payments/config.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-demo-content.test.ts
-->

---
### Requirement: Home page hero, features, testimonials, and FAQ content reflects the real product

The marketing site's hero, features, testimonials, and FAQ sections SHALL describe the actual StartKiter product (a course paired with a lifetime private code kit, delivered via a buyer-owned GitHub repository) and SHALL NOT retain unmodified template demo content describing an unrelated multi-tenant subscription SaaS product.

#### Scenario: No placeholder demo identities remain

- **WHEN** the marketing site's translation files or rendered home page are inspected in any supported locale
- **THEN** they MUST NOT contain the placeholder demo names "Acme", "Maya Chen", "Jonas Weber", or "Amelia Ortiz", and MUST NOT contain FAQ content describing subscription cancellation or a free trial period that does not apply to StartKiter's one-time-purchase offer

#### Scenario: Hero copy names the real product

- **WHEN** a visitor opens the marketing site home page
- **THEN** the hero section's headline or supporting sentence MUST reference the course-plus-lifetime-code-kit offer, not a generic multi-tenant organization/billing SaaS pitch


<!-- @trace
source: marketing-site-real-content
updated: 2026-08-28
code:
  - apps/docs/postcss.config.mjs
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/database/prisma/schema.prisma
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - packages/payments/lib/invoice-issue-input.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/docs/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - packages/database/prisma/zod/index.ts
  - packages/payments/provider/invoice-query-errors.ts
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/docs/app/api/search/route.ts
  - packages/ui/components/logo.tsx
  - docs/dashboard/status.html
  - apps/docs/content/docs/deployment/overview.mdx
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/app/layout.tsx
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/lib/checkout-gateway-settings.ts
  - apps/docs/lib/source.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - packages/i18n/translations/de/marketing.json
  - apps/marketing/content/legal/terms.md
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - apps/marketing/content/posts/second-post.mdx
  - apps/docs/AGENTS.md
  - packages/payments/gateway-settings.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/i18n/translations/es/marketing.json
  - packages/payments/config.ts
  - packages/api/modules/course/lib/send-welcome-email.ts
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - docs/clean-package-promotion-guide.md
  - packages/api/modules/course/lib/invoice-settings.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/docs/next.config.ts
  - apps/docs/content/docs/index.mdx
  - packages/i18n/translations/fr/marketing.json
  - apps/docs/lib/search-tokenizer.ts
  - apps/saas/lib/orders.ts
  - packages/i18n/lib/get-messages.ts
  - packages/payments/provider/payuni/gateway.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - vitest.config.ts
  - apps/docs/app/global.css
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/mdx-components.tsx
  - docs/coolify-vps-setup-runbook.md
  - apps/saas/app/api/shopline/notify/route.ts
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/tsconfig.json
  - apps/saas/app/api/checkout/status/route.ts
  - AGENTS.md
  - packages/payments/provider/ecpay/invoice-provider.ts
  - apps/docs/global.d.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - apps/docs/content/docs/meta.json
  - docs/deploy-and-public-url.md
  - apps/marketing/Dockerfile
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - pnpm-workspace.yaml
  - packages/payments/provider/payuni/crypto.ts
  - apps/marketing/content/posts/guest-access.mdx
  - packages/payments/credentials.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - README.md
  - apps/saas/lib/invoice-settings.ts
  - apps/marketing/modules/home/components/FeaturePreview.tsx
  - apps/marketing/config.ts
  - apps/marketing/content/legal/terms.de.md
  - apps/docs/CLAUDE.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - packages/api/modules/course/lib/order-refunds.ts
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/payments/provider/stripe/gateway.ts
  - docs/vps-deployment-sop.md
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/payments/types.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - apps/marketing/content/legal/privacy-policy.md
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/vitest.config.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/docs/source.config.ts
  - packages/i18n/translations/en/marketing.json
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/webhook-events.ts
  - apps/docs/content/docs/deployment/meta.json
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/i18n/translations/zh-tw/marketing.json
tests:
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/i18n/i18n.test.ts
  - apps/marketing/tests/blog.spec.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - apps/docs/content.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - packages/payments/checkout-gateway.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - apps/marketing/tests/home.spec.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - packages/payments/config.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-demo-content.test.ts
-->

---
### Requirement: README deployment instructions do not reference a retired deploy target

The project README SHALL NOT present a one-click deploy link or button pointing to a deployment platform that the project has stopped using in production.

#### Scenario: No stale deploy button

- **WHEN** a reader opens README.md
- **THEN** it MUST NOT contain a Zeabur one-click-deploy link or button, and any deployment guidance present MUST describe the currently active deployment approach

<!-- @trace
source: marketing-site-real-content
updated: 2026-08-28
code:
  - apps/docs/postcss.config.mjs
  - apps/marketing/modules/home/components/PricingSection.tsx
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - packages/database/prisma/schema.prisma
  - apps/marketing/modules/home/components/FeaturesSection.tsx
  - packages/payments/lib/invoice-issue-input.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - apps/marketing/content/posts/first-post.de.mdx
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - apps/docs/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - packages/database/prisma/zod/index.ts
  - packages/payments/provider/invoice-query-errors.ts
  - apps/docs/content/docs/core-and-plugins/meta.json
  - apps/docs/app/api/search/route.ts
  - packages/ui/components/logo.tsx
  - docs/dashboard/status.html
  - apps/docs/content/docs/deployment/overview.mdx
  - packages/i18n/translations/zh-cn/marketing.json
  - apps/marketing/content/legal/privacy-policy.de.md
  - apps/docs/app/layout.tsx
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/lib/checkout-gateway-settings.ts
  - apps/docs/lib/source.ts
  - apps/docs/content/docs/core-and-plugins/core-boundary.mdx
  - packages/i18n/translations/de/marketing.json
  - apps/marketing/content/legal/terms.md
  - apps/marketing/modules/home/components/HeroWireframe.tsx
  - apps/docs/content/docs/getting-started/environment-variables.mdx
  - apps/marketing/content/posts/second-post.mdx
  - apps/docs/AGENTS.md
  - packages/payments/gateway-settings.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/i18n/translations/es/marketing.json
  - packages/payments/config.ts
  - packages/api/modules/course/lib/send-welcome-email.ts
  - apps/marketing/modules/home/lib/dummy-portraits.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - docs/clean-package-promotion-guide.md
  - packages/api/modules/course/lib/invoice-settings.ts
  - apps/docs/app/[[...slug]]/page.tsx
  - apps/docs/content/docs/getting-started/local-development.mdx
  - apps/docs/next.config.ts
  - apps/docs/content/docs/index.mdx
  - packages/i18n/translations/fr/marketing.json
  - apps/docs/lib/search-tokenizer.ts
  - apps/saas/lib/orders.ts
  - packages/i18n/lib/get-messages.ts
  - packages/payments/provider/payuni/gateway.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - vitest.config.ts
  - apps/docs/app/global.css
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/docs/mdx-components.tsx
  - docs/coolify-vps-setup-runbook.md
  - apps/saas/app/api/shopline/notify/route.ts
  - tooling/scripts/promote-clean-package.ts
  - apps/docs/tsconfig.json
  - apps/saas/app/api/checkout/status/route.ts
  - AGENTS.md
  - packages/payments/provider/ecpay/invoice-provider.ts
  - apps/docs/global.d.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - apps/docs/content/docs/meta.json
  - docs/deploy-and-public-url.md
  - apps/marketing/Dockerfile
  - apps/docs/content/docs/core-and-plugins/upstream-sync.mdx
  - apps/marketing/modules/home/components/TestimonialsSection.tsx
  - pnpm-workspace.yaml
  - packages/payments/provider/payuni/crypto.ts
  - apps/marketing/content/posts/guest-access.mdx
  - packages/payments/credentials.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - README.md
  - apps/saas/lib/invoice-settings.ts
  - apps/marketing/modules/home/components/FeaturePreview.tsx
  - apps/marketing/config.ts
  - apps/marketing/content/legal/terms.de.md
  - apps/docs/CLAUDE.md
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - packages/api/modules/course/lib/order-refunds.ts
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/payments/provider/stripe/gateway.ts
  - docs/vps-deployment-sop.md
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/payments/types.ts
  - apps/marketing/modules/shared/components/Footer.tsx
  - apps/marketing/content/legal/privacy-policy.md
  - apps/marketing/content/posts/first-post.mdx
  - apps/docs/vitest.config.ts
  - packages/payments/provider/shopline/gateway.ts
  - apps/docs/source.config.ts
  - packages/i18n/translations/en/marketing.json
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/lib/webhook-events.ts
  - apps/docs/content/docs/deployment/meta.json
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/docs/content/docs/getting-started/meta.json
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/i18n/translations/zh-tw/marketing.json
tests:
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/i18n/i18n.test.ts
  - apps/marketing/tests/blog.spec.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - apps/docs/content.test.ts
  - packages/ui/components/ui.test.tsx
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/marketing/tests/changelog.spec.ts
  - packages/payments/checkout-gateway.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - tooling/scripts/promote-clean-package.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - apps/marketing/tests/home.spec.ts
  - packages/i18n/marketing-pricing-keys.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - packages/payments/config.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/i18n/marketing-demo-content.test.ts
-->