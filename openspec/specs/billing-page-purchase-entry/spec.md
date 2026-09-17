# billing-page-purchase-entry Specification

## Purpose

TBD - created by archiving change 'billing-page-checkout-redirect-fix'. Update Purpose after archive.

## Requirements

### Requirement: Billing page purchase entry routes to the working checkout flow
The system SHALL route the `/settings/billing` page's plan-purchase action to the `/checkout` page (the payment flow actually wired to a live gateway), instead of invoking the unconnected generic subscription checkout flow (`createCheckoutLink`) that has no configured provider price ID for this product.

#### Scenario: A user without an existing purchase clicks the plan action on the billing page
- **WHEN** a signed-in user without course access opens `/settings/billing` and clicks the plan action
- **THEN** they are taken to `/checkout`, where the existing PAYUNi-backed purchase flow can complete

#### Scenario: A user who already purchased sees an owned state, not a purchase button
- **WHEN** a signed-in user with existing course access (per `userHasCourseAccess`) opens `/settings/billing`
- **THEN** the page shows an owned/entitled state and a link to `/course`, not a purchase action that would attempt to charge again

#### Scenario: No failed-checkout error appears on the billing page
- **WHEN** a user interacts with the billing page's plan action under this change
- **THEN** no "checkout failed" or provider-error message appears, because the page no longer calls the unconnected `createCheckoutLink` flow

<!-- @trace
source: billing-page-checkout-redirect-fix
updated: 2026-09-17
code:
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/package.json
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/compliance.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - packages/mail/provider/tosend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/vitest.config.ts
  - packages/newsletter/lib/render.ts
  - apps/saas/.env.example
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/newsletter/tsconfig.json
  - packages/newsletter/lib/audience.ts
  - apps/saas/lib/newsletter-settings.ts
  - packages/mail/provider/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/mail/provider/zsend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/index.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/api/checkout/route.ts
  - packages/mail/provider/nodemailer.ts
  - packages/newsletter/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - packages/newsletter/lib/email-consent.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/auth/auth.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
tests:
  - packages/mail/provider/tosend.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/api/unsubscribe/route.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/mail/provider/index.test.ts
-->