# newsletter-send-engine Specification

## Purpose

The newsletter send engine reliably delivers a campaign to potentially thousands of recipients despite short-lived serverless request windows and container restarts, by separating a cron-driven scheduler (which only performs atomic state transitions) from a resumable batch dispatcher (which does the actual sending), so a campaign never sends twice, never gets stuck, and never silently fails.

## Requirements

### Requirement: Campaign state machine with atomic transitions

The system SHALL model each campaign's lifecycle as `DRAFT → SCHEDULED → QUEUED → SENDING → (SENT | PARTIAL_FAILED | FAILED)`, with `PAUSED` and `CANCELLED` as additional reachable states, and SHALL perform every state transition as an atomic database update conditioned on the expected current state.

#### Scenario: Double-click on immediate send only sends once

- **WHEN** two "send now" requests for the same `DRAFT` campaign arrive concurrently
- **THEN** the system SHALL transition exactly one of them into the sending path, and SHALL reject the second with an explicit error

#### Scenario: Terminal states cannot be reverted

- **WHEN** a request attempts to change a campaign whose status is `SENT`, `FAILED`, or `CANCELLED` back to `DRAFT` or `SCHEDULED`
- **THEN** the system SHALL reject the request


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
### Requirement: Idempotent recipient dispatch with resume

The system SHALL create one `NewsletterRecipient` row per intended recipient before dispatch begins, enforce uniqueness on `(campaignId, userId)` and `(campaignId, toEmail)`, and SHALL resume dispatch from the first `PENDING` recipient after an interruption without re-sending already-`SENT` recipients.

#### Scenario: Container restart mid-campaign does not duplicate sends

- **WHEN** a campaign has sent 300 of 1000 recipients and the process is killed and restarted
- **THEN** the system SHALL continue from recipient 301 and SHALL NOT re-send any of the first 300


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
### Requirement: Cron performs only atomic scheduling transitions

The system SHALL use a cron-triggered endpoint that atomically transitions due `SCHEDULED` campaigns to `QUEUED` using a conditional update, and SHALL NOT perform the actual email sending inside that same atomic transition.

#### Scenario: Near-simultaneous cron triggers do not double-queue

- **WHEN** the cron endpoint is invoked twice within the same minute for a campaign whose `scheduledAt` has just passed
- **THEN** the system SHALL transition the campaign to `QUEUED` exactly once


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
### Requirement: Rate-limited dispatch

The system SHALL enforce a maximum number of sends per minute per campaign, tracked in persistent storage across batch windows, independent of any concurrency control on individual send calls.

#### Scenario: Rate limit spans multiple dispatch batches

- **WHEN** a campaign is rate-limited to 60 sends per minute and has 200 recipients
- **THEN** the system SHALL send no more than 60 recipients within any rolling 60-second window across however many batch invocations that requires


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
### Requirement: Consent re-checked at dispatch time, not at campaign creation

The system SHALL re-evaluate each recipient's consent and unsubscribe status immediately before sending to them, and SHALL NOT rely solely on a snapshot taken when the campaign was created or queued.

#### Scenario: Recipient unsubscribes after queueing but before their turn to send

- **WHEN** a recipient unsubscribes after the campaign enters `SENDING` but before the dispatcher reaches them
- **THEN** the system SHALL mark that recipient `SKIPPED` and SHALL NOT send them the email


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
### Requirement: Pause, resume, and cancel

The system SHALL support pausing a `SENDING` campaign (stopping new batches while the current batch finishes), resuming a `PAUSED` campaign from its last cursor, and cancelling a non-terminal campaign (stopping all further sends while preserving already-sent recipients).

#### Scenario: Resume does not re-send completed recipients

- **WHEN** a `PAUSED` campaign that had sent 400 of 1000 recipients is resumed
- **THEN** the system SHALL continue from recipient 401 and SHALL NOT re-send recipients 1 through 400


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
### Requirement: Zero eligible recipients blocks send

The system SHALL block a campaign from entering `SCHEDULED` or `SENDING` when the computed eligible-recipient count is zero, and SHALL display the reason.

#### Scenario: All recipients unsubscribed

- **WHEN** every candidate recipient for a campaign has `unsubscribedAt` set or fails the consent check
- **THEN** the system SHALL prevent the campaign from being scheduled or sent and SHALL state that zero recipients are eligible


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
### Requirement: Sender configuration snapshot locked at send time

The system SHALL capture the active mail provider configuration into `senderSnapshot` when a campaign enters `SENDING`, and SHALL use that snapshot for the remainder of the campaign's dispatch even if the global provider configuration changes mid-send.

#### Scenario: Provider changed while a campaign is sending

- **WHEN** an operator changes the email provider configuration while a campaign is in `SENDING`
- **THEN** the system SHALL continue dispatching the in-progress campaign using the provider configuration captured at the moment it entered `SENDING`

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
### Requirement: 自動寄送引擎可正式運作

合併後，`main` 要有完整可運作的電子報自動寄送能力（Wave 1B send engine + dispatch cron），且不破壞 main 現有的退訂/同意權限邏輯。

#### Scenario: 排程觸發自動寄送

- **GIVEN** 有一批已排程的電子報待寄送
- **WHEN** cron 觸發 dispatch
- **THEN** 系統依既有的使用者同意紀錄（consent）判斷可寄送對象，成功寄出並記錄寄送結果


<!-- @trace
source: fix-navbar-avatar-widget-newsletter
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/database/prisma/queries/users.ts
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - packages/platform/package.json
  - apps/saas/modules/shared/lib/account-menu.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - docs/ux/startkiter-navigation-fixture.json
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/newsletter/package.json
  - packages/api/modules/course/router.ts
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - docs/verification/launch-evidence-report.mjs
  - apps/saas/public/icons/nav/mail.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/globals.css
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/i18n/translations/zh-tw/saas.json
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/platform/index.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - package.json
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - packages/api/modules/quiz/router.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - packages/mail/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - packages/i18n/translations/en/saas.json
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - packages/i18n/translations/de/saas.json
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - packages/mail/lib/send.ts
  - tooling/tailwind/theme.css
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/public/icons/account/settings.dark.svg
  - packages/newsletter/index.ts
  - apps/saas/public/icons/account/settings.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/public/icons/nav/home.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/i18n/translations/es/saas.json
  - packages/platform/src/workspace/registry.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
tests:
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/mail/lib/send.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/mail/provider.test.ts
  - packages/platform/src/app-registration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/mount-points.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->

---
### Requirement: 合併衝突時保留行為正確的一方

合併過程中，`packages/database/prisma/schema.prisma`、`packages/mail/provider/*` 這類技術實作衝突，採用 main 版本；但 `packages/newsletter/`、`unsubscribe`、`email-consent`、`SignupForm.tsx`、`checkout` 這類涉及使用者同意/退訂行為的衝突，必須先核對兩邊實際行為語意是否一致，才能決定，不可用「哪邊比較新」這種方式盲目二選一。

#### Scenario: 兩套退訂邏輯行為不一致時停下回報

- **GIVEN** newsletter 分支與 main 各自有一套退訂 token 驗證邏輯，行為細節（如 token 有效期）不一致
- **WHEN** 合併過程發現此不一致
- **THEN** 停止自動合併該部分，記錄兩邊差異，回報給人工決定，不自行選擇其中一套

<!-- @trace
source: fix-navbar-avatar-widget-newsletter
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/database/prisma/queries/users.ts
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - packages/platform/package.json
  - apps/saas/modules/shared/lib/account-menu.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - docs/ux/startkiter-navigation-fixture.json
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/newsletter/package.json
  - packages/api/modules/course/router.ts
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - docs/verification/launch-evidence-report.mjs
  - apps/saas/public/icons/nav/mail.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/globals.css
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/i18n/translations/zh-tw/saas.json
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/platform/index.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - package.json
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - packages/api/modules/quiz/router.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - packages/mail/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - packages/i18n/translations/en/saas.json
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - packages/i18n/translations/de/saas.json
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - packages/mail/lib/send.ts
  - tooling/tailwind/theme.css
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/public/icons/account/settings.dark.svg
  - packages/newsletter/index.ts
  - apps/saas/public/icons/account/settings.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/public/icons/nav/home.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/i18n/translations/es/saas.json
  - packages/platform/src/workspace/registry.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
tests:
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/mail/lib/send.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/mail/provider.test.ts
  - packages/platform/src/app-registration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/mount-points.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->