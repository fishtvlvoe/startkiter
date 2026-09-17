# ai-chatbot-ui Specification

## Purpose

TBD - created by archiving change 'ai-chatbot-frontend-wireup'. Update Purpose after archive.

## Requirements

### Requirement: Authenticated users can open an AI chat window
The system SHALL provide a navigation entry visible to any signed-in user (no admin/operator role required) that opens a chat interface for conversing with the ChatGPT-backed AI assistant.

#### Scenario: Signed-in user finds the AI chat entry in navigation
- **WHEN** a signed-in user with role `user` views the app navigation
- **THEN** an "AI 助手" entry is visible and clicking it opens the chat page

#### Scenario: Signed-out user cannot reach the chat page content
- **WHEN** a signed-out visitor requests the chat page route
- **THEN** the system redirects to login (same behavior as other authenticated-only routes), consistent with the existing `(authenticated)` route group


<!-- @trace
source: ai-chatbot-frontend-wireup
updated: 2026-09-17
code:
  - packages/mail/provider/index.ts
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/tsconfig.json
  - packages/newsletter/lib/unsubscribe-token.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - apps/saas/modules/auth/components/SignupForm.tsx
  - packages/mail/provider/nodemailer.ts
  - packages/newsletter/lib/render.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - packages/platform/src/mount-points.ts
  - packages/mail/provider/tosend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/package.json
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/lib/audience.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - apps/saas/.env.example
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - apps/saas/app/api/unsubscribe/route.ts
  - packages/mail/provider/zsend.ts
  - packages/newsletter/vitest.config.ts
  - apps/saas/lib/newsletter-settings.ts
  - packages/database/prisma/schema.prisma
  - packages/newsletter/package.json
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/index.ts
tests:
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/mail/provider/zsend.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider/tosend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/newsletter/lib/audience.test.ts
-->

---
### Requirement: Chat UI streams responses from the existing /ai/stream endpoint
The system SHALL render assistant responses incrementally as they stream from the existing `/ai/stream` procedure, without introducing a new backend endpoint or changing its authorization.

#### Scenario: User sends a message and sees a streamed reply
- **WHEN** a signed-in user types a message and submits it
- **THEN** the message is sent to `/ai/stream` and the assistant's reply appears incrementally in the message list as stream chunks arrive

#### Scenario: Unauthenticated request to /ai/stream is rejected
- **WHEN** a request to `/ai/stream` is made without a valid session
- **THEN** the existing `protectedProcedure` authorization rejects it (this scenario verifies existing behavior is unchanged, not a new check)


<!-- @trace
source: ai-chatbot-frontend-wireup
updated: 2026-09-17
code:
  - packages/mail/provider/index.ts
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/tsconfig.json
  - packages/newsletter/lib/unsubscribe-token.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - apps/saas/modules/auth/components/SignupForm.tsx
  - packages/mail/provider/nodemailer.ts
  - packages/newsletter/lib/render.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - packages/platform/src/mount-points.ts
  - packages/mail/provider/tosend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/package.json
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/lib/audience.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - apps/saas/.env.example
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - apps/saas/app/api/unsubscribe/route.ts
  - packages/mail/provider/zsend.ts
  - packages/newsletter/vitest.config.ts
  - apps/saas/lib/newsletter-settings.ts
  - packages/database/prisma/schema.prisma
  - packages/newsletter/package.json
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/index.ts
tests:
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/mail/provider/zsend.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider/tosend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/newsletter/lib/audience.test.ts
-->

---
### Requirement: No chat history is persisted
The system SHALL NOT persist chat messages to a database; the chat window holds only the current in-memory session's messages, consistent with the existing `stream-message` procedure's "without storing the chat" behavior.

#### Scenario: Reloading the chat page clears prior messages
- **WHEN** a user has an active chat conversation and reloads the page
- **THEN** no prior messages are restored; the chat window starts empty

<!-- @trace
source: ai-chatbot-frontend-wireup
updated: 2026-09-17
code:
  - packages/mail/provider/index.ts
  - packages/newsletter/lib/promo-blocks.ts
  - packages/newsletter/tsconfig.json
  - packages/newsletter/lib/unsubscribe-token.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.tsx
  - apps/saas/modules/auth/components/SignupForm.tsx
  - packages/mail/provider/nodemailer.ts
  - packages/newsletter/lib/render.ts
  - packages/newsletter/lib/compliance.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/new/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.ts
  - packages/platform/src/mount-points.ts
  - packages/mail/provider/tosend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/newsletter/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/package.json
  - packages/database/prisma/migrations/20260915221513_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/[id]/page.tsx
  - packages/newsletter/lib/email-consent.ts
  - packages/newsletter/lib/audience.ts
  - apps/saas/app/(main)/unsubscribe/page.tsx
  - apps/saas/.env.example
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/content-types.ts
  - packages/auth/auth.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/page.tsx
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - apps/saas/app/api/unsubscribe/route.ts
  - packages/mail/provider/zsend.ts
  - packages/newsletter/vitest.config.ts
  - apps/saas/lib/newsletter-settings.ts
  - packages/database/prisma/schema.prisma
  - packages/newsletter/package.json
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/newsletter/index.ts
tests:
  - apps/saas/app/(main)/unsubscribe/page.test.tsx
  - packages/mail/provider/zsend.test.ts
  - packages/newsletter/lib/compliance.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/composer.test.tsx
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/auth/components/SignupForm.consent.test.tsx
  - packages/newsletter/lib/wave2-integration.test.ts
  - packages/newsletter/lib/render.test.ts
  - packages/mail/provider/tosend.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/email-consent.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts
  - packages/mail/provider/index.test.ts
  - packages/newsletter/lib/unsubscribe-token.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/checkout/marketing-consent.test.ts
  - packages/newsletter/lib/promo-blocks.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/api/unsubscribe/route.test.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.test.tsx
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/lib/newsletter-settings.test.ts
  - packages/newsletter/lib/audience.test.ts
-->