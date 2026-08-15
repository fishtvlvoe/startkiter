# course-media-playback Specification

## Purpose

TBD - created by archiving change 'mvp-dogfood-remaining'. Update Purpose after archive.

## Requirements

### Requirement: Entitled lessons play configured Bunny media
When a learner has course access, each MVP lesson SHALL play media from the configured Bunny Stream library when video identifiers are available. The player MUST NOT expose media URLs to learners without course access.

#### Scenario: Entitled learner gets Bunny embed
- **WHEN** a signed-in entitled learner opens an MVP lesson that has a Bunny video id configured
- **THEN** the lesson page MUST render a Bunny embed (or equivalent playable Bunny URL) for that video id

#### Scenario: Missing Bunny config falls back safely
- **WHEN** Bunny library or video id is not configured
- **THEN** the lesson page MUST still render a playable fallback media and MUST show plain-language notice that the clip is a temporary demo


<!-- @trace
source: mvp-dogfood-remaining
updated: 2026-08-15
code:
  - apps/saas/app/globals.css
  - apps/saas/app/course/kit-claim-panel.tsx
  - packages/course/src/catalog.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/.env.example
  - apps/saas/lib/support-email.ts
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/components/site-footer.tsx
  - apps/saas/lib/public-base-url.ts
  - docs/deploy-and-public-url.md
  - apps/saas/app/layout.tsx
  - vitest.config.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/app/api/checkout/route.ts
tests:
  - apps/saas/lib/support-email.test.ts
  - apps/saas/lib/public-base-url.test.ts
  - packages/course/src/catalog.test.ts
-->

---
### Requirement: Unauthorized learners do not receive media URLs
Lesson APIs and pages MUST withhold Bunny or fallback media URLs when the learner lacks course access.

#### Scenario: Locked lesson omits media URL
- **WHEN** an authenticated learner without purchase requests lesson media metadata
- **THEN** the response or page MUST NOT include the playable media URL

<!-- @trace
source: mvp-dogfood-remaining
updated: 2026-08-15
code:
  - apps/saas/app/globals.css
  - apps/saas/app/course/kit-claim-panel.tsx
  - packages/course/src/catalog.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/.env.example
  - apps/saas/lib/support-email.ts
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/components/site-footer.tsx
  - apps/saas/lib/public-base-url.ts
  - docs/deploy-and-public-url.md
  - apps/saas/app/layout.tsx
  - vitest.config.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/app/api/checkout/route.ts
tests:
  - apps/saas/lib/support-email.test.ts
  - apps/saas/lib/public-base-url.test.ts
  - packages/course/src/catalog.test.ts
-->