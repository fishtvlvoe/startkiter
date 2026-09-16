# newsletter-audience-targeting Specification

## Purpose

Audience targeting lets a creator choose who receives a campaign — everyone, a manually checked list, or a single-layer AND/OR condition on purchase and activity data — with a live, deduplicated recipient-count estimate, so the creator always knows how many people will actually receive the email before they send it.

## Requirements

### Requirement: Send to all or manually selected recipients

The system SHALL support sending a campaign to the entire eligible user base with one action, or to a manually checked subset selected from a searchable, filterable table.

#### Scenario: Manual selection count is visible

- **WHEN** a creator checks a subset of rows in the recipient table
- **THEN** the system SHALL display the count of currently selected recipients


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
### Requirement: Single-layer AND/OR audience conditions

The system SHALL support combining audience conditions (purchased course, learner type, role, activity recency, coupon usage, registration date range, consent status) with a single logical operator applied uniformly, either AND or OR across all active conditions, and SHALL NOT support nested condition groups.

#### Scenario: AND combination narrows the audience

- **WHEN** a creator sets conditions "purchased course X" AND "logged in within 30 days"
- **THEN** the estimated recipient count SHALL only include users satisfying both conditions


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
### Requirement: Live deduplicated recipient estimate

The system SHALL recompute the estimated recipient count after a debounce period following any condition change, and SHALL report the estimate after deduplication and after excluding unsubscribed and invalid-email recipients.

#### Scenario: OR combination deduplicates overlapping matches

- **WHEN** condition A matches 200 users, condition B matches 150 users, and 80 users match both, combined with OR
- **THEN** the system SHALL report an estimated count of 270 distinct recipients


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
### Requirement: Automatic exclusion of unsubscribed and invalid recipients

The system SHALL exclude any user with `unsubscribedAt` set or `emailInvalidAt` set from every audience calculation and from actual dispatch, regardless of which other conditions match them.

#### Scenario: Unsubscribed user is excluded even when explicitly matched by a condition

- **WHEN** a user who has unsubscribed also matches an active audience condition
- **THEN** the system SHALL exclude that user from both the estimated count and the actual send


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
### Requirement: Deduplication by recipient email

The system SHALL deduplicate recipients by normalized email address so that a single person is counted and sent to only once per campaign, even if they match multiple audience conditions or appear via multiple account records sharing the same email.

#### Scenario: User matching two independent conditions receives one email

- **WHEN** a user matches both "purchased course A" and "purchased course B" conditions applied with AND
- **THEN** that user SHALL appear as exactly one `NewsletterRecipient` row for the campaign


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
### Requirement: Audience recomputed at dispatch time

The system SHALL apply the audience conditions and consent filters again at the moment of dispatch, not only at campaign creation time, so that the actual send reflects the current state rather than a stale snapshot.

#### Scenario: Estimate and actual send diverge when audience changes during the send window

- **WHEN** the recipient pool changes (e.g. a new unsubscribe) between campaign creation and dispatch
- **THEN** the actual dispatched recipient set SHALL reflect the state at dispatch time, not the state at creation time

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