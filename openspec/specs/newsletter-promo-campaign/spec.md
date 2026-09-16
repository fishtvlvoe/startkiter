# newsletter-promo-campaign Specification

## Purpose

Promo campaign features add the promotional-newsletter-only building blocks — a coupon block that can't be typo'd, a course/bundle CTA card pulled live from catalog data, a static countdown, and automatic UTM tagging — so a creator can build a converting promotional email without hand-typing a price, a link, or a coupon code that could drift from the source of truth.

## Requirements

### Requirement: Coupon block bound to an existing coupon

The system SHALL let a creator insert a coupon block by selecting an existing `Coupon` record, auto-populating the code and expiry from that record, and SHALL NOT allow the coupon code to be manually typed or edited in the block.

#### Scenario: Coupon code field is read-only

- **WHEN** a creator inserts a coupon block and selects a coupon
- **THEN** the rendered code field SHALL display that coupon's code and SHALL NOT be editable as free text


<!-- @trace
source: newsletter-automation-integration
updated: 2026-09-17
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/mail/provider/index.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/lib/render.ts
  - packages/database/prisma/schema.prisma
  - packages/mail/provider/tosend.ts
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/package.json
  - packages/mail/provider/zsend.ts
  - packages/newsletter/tsconfig.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - packages/newsletter/lib/audience.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/.env.example
  - apps/saas/lib/newsletter-settings.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/vitest.config.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/package.json
tests:
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/mail/provider/tosend.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
-->

---
### Requirement: Coupon validity checked before send

The system SHALL validate the bound coupon's active status, expiry, and redemption limit both when the block is inserted and again immediately before the campaign is sent, and SHALL block sending if the coupon has expired, been deactivated, or reached its redemption limit.

#### Scenario: Expired coupon blocks send

- **WHEN** a promotional campaign's bound coupon has an `expiresAt` in the past at send-confirmation time
- **THEN** the system SHALL block the send and SHALL indicate the coupon is invalid


<!-- @trace
source: newsletter-automation-integration
updated: 2026-09-17
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/mail/provider/index.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/lib/render.ts
  - packages/database/prisma/schema.prisma
  - packages/mail/provider/tosend.ts
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/package.json
  - packages/mail/provider/zsend.ts
  - packages/newsletter/tsconfig.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - packages/newsletter/lib/audience.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/.env.example
  - apps/saas/lib/newsletter-settings.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/vitest.config.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/package.json
tests:
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/mail/provider/tosend.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
-->

---
### Requirement: Course/bundle CTA card pulled from catalog data

The system SHALL let a creator insert a course or bundle CTA card by selecting a `Course` or `Bundle` record, auto-populating the cover image, title, and price from that record, and SHALL NOT allow the price or link to be manually typed.

#### Scenario: Price field is not editable

- **WHEN** a creator inserts a course CTA card
- **THEN** the rendered price SHALL match the selected course's current price and SHALL NOT be a free-text field


<!-- @trace
source: newsletter-automation-integration
updated: 2026-09-17
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/mail/provider/index.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/lib/render.ts
  - packages/database/prisma/schema.prisma
  - packages/mail/provider/tosend.ts
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/package.json
  - packages/mail/provider/zsend.ts
  - packages/newsletter/tsconfig.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - packages/newsletter/lib/audience.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/.env.example
  - apps/saas/lib/newsletter-settings.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/vitest.config.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/package.json
tests:
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/mail/provider/tosend.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
-->

---
### Requirement: Static countdown text

The system SHALL render the countdown block as static localized text derived from the bound coupon's `expiresAt`, and SHALL NOT use client-side JavaScript or an animated image to render it.

#### Scenario: Countdown reflects coupon expiry as static text

- **WHEN** a countdown block is bound to a coupon expiring on a given date
- **THEN** the rendered email SHALL contain static text stating that date, with no script-driven or animated countdown element


<!-- @trace
source: newsletter-automation-integration
updated: 2026-09-17
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/mail/provider/index.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/lib/render.ts
  - packages/database/prisma/schema.prisma
  - packages/mail/provider/tosend.ts
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/package.json
  - packages/mail/provider/zsend.ts
  - packages/newsletter/tsconfig.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - packages/newsletter/lib/audience.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/.env.example
  - apps/saas/lib/newsletter-settings.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/vitest.config.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/package.json
tests:
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/mail/provider/tosend.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
-->

---
### Requirement: Automatic UTM tagging on promotional links

The system SHALL automatically append `utm_source=newsletter`, `utm_medium=email`, `utm_campaign`, and `utm_content` parameters to every link in a promotional campaign, without requiring the creator to enter them manually.

#### Scenario: Course CTA link carries UTM parameters

- **WHEN** a promotional campaign containing a course CTA card is rendered
- **THEN** the CTA link SHALL include `utm_source=newsletter`, `utm_medium=email`, `utm_campaign`, and `utm_content` query parameters


<!-- @trace
source: newsletter-automation-integration
updated: 2026-09-17
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/mail/provider/index.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/lib/render.ts
  - packages/database/prisma/schema.prisma
  - packages/mail/provider/tosend.ts
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/package.json
  - packages/mail/provider/zsend.ts
  - packages/newsletter/tsconfig.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - packages/newsletter/lib/audience.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/.env.example
  - apps/saas/lib/newsletter-settings.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/vitest.config.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/package.json
tests:
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/mail/provider/tosend.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
-->

---
### Requirement: Marketing consent lock on promotional audience

The system SHALL force every promotional-campaign audience query to include a marketing-consent condition that requires `marketingConsent = true`, and SHALL reject at the API level any promotional send request whose computed audience was not filtered by that condition.

#### Scenario: API-level bypass attempt is rejected

- **WHEN** a request to send a promotional campaign is constructed without the marketing-consent filter applied
- **THEN** the system SHALL reject the request with an error and SHALL NOT dispatch any email

<!-- @trace
source: newsletter-automation-integration
updated: 2026-09-17
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - packages/mail/provider/index.ts
  - apps/saas/modules/auth/components/SignupForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/platform/src/mount-points.ts
  - packages/newsletter/index.ts
  - packages/newsletter/lib/unsubscribe-token.ts
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/newsletter/lib/render.ts
  - packages/database/prisma/schema.prisma
  - packages/mail/provider/tosend.ts
  - apps/saas/app/api/unsubscribe/route.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/package.json
  - packages/mail/provider/zsend.ts
  - packages/newsletter/tsconfig.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - packages/newsletter/lib/audience.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/.env.example
  - apps/saas/lib/newsletter-settings.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/vitest.config.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/package.json
tests:
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/mail/provider/tosend.test.ts
  - packages/newsletter/lib/audience.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/zsend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
-->