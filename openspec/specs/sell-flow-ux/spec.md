# sell-flow-ux Specification

## Purpose

TBD - created by archiving change 'mvp-sell-flow-usable'. Update Purpose after archive.

## Requirements

### Requirement: Landing presents a sellable first viewport
The home page SHALL present the product brand as the primary signal, one headline, one short supporting sentence, one primary CTA and at most one secondary CTA in the first viewport. Competing equal-weight CTA clusters of three or more SHALL NOT appear in the first viewport.

#### Scenario: First viewport CTA budget
- **WHEN** a visitor opens /
- **THEN** the first viewport MUST show brand, one headline, one supporting sentence, and at most two CTAs with a single primary action


<!-- @trace
source: mvp-sell-flow-usable
updated: 2026-08-15
code:
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/page.tsx
  - apps/saas/app/agent/page.tsx
  - packages/i18n/src/index.ts
  - apps/saas/app/course/page.tsx
  - AGENTS.md
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/layout.tsx
  - apps/saas/app/login/page.tsx
  - docs/deploy-and-public-url.md
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/course/line-community-panel.tsx
-->

---
### Requirement: Authenticated navigation reaches core surfaces
When a learner is signed in, primary navigation SHALL include links to course, checkout (or purchase status), site agent, and account. The site agent page MUST be reachable without typing the URL.

#### Scenario: Signed-in nav includes agent
- **WHEN** a signed-in user views any authenticated shell page with primary nav
- **THEN** a link to /agent MUST be visible and MUST navigate to the site agent UI


<!-- @trace
source: mvp-sell-flow-usable
updated: 2026-08-15
code:
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/page.tsx
  - apps/saas/app/agent/page.tsx
  - packages/i18n/src/index.ts
  - apps/saas/app/course/page.tsx
  - AGENTS.md
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/layout.tsx
  - apps/saas/app/login/page.tsx
  - docs/deploy-and-public-url.md
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/course/line-community-panel.tsx
-->

---
### Requirement: Design tokens drive sell-flow surfaces
Sell-flow pages (home, login, signup, checkout, course, agent, account) SHALL use DESIGN.md color and spacing tokens rather than ad-hoc accent colors unrelated to the design system.

#### Scenario: Accent color matches design system primary
- **WHEN** an operator inspects the CSS custom properties used by sell-flow pages
- **THEN** the primary accent MUST match DESIGN.md primary blue (#3b82f6) or its token alias, not the legacy teal accent


<!-- @trace
source: mvp-sell-flow-usable
updated: 2026-08-15
code:
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/page.tsx
  - apps/saas/app/agent/page.tsx
  - packages/i18n/src/index.ts
  - apps/saas/app/course/page.tsx
  - AGENTS.md
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/layout.tsx
  - apps/saas/app/login/page.tsx
  - docs/deploy-and-public-url.md
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/course/line-community-panel.tsx
-->

---
### Requirement: Buyer-facing copy hides internal field names
Learner-visible copy SHALL NOT expose internal identifiers such as courseAccess, kitClaimEligible, or raw HTTP status jargon as the primary explanation. Unavailable features MUST use plain-language unavailable states.

#### Scenario: Course locked state is plain language
- **WHEN** a signed-in user without purchase opens /course
- **THEN** the page MUST explain purchase is required in plain Traditional Chinese and MUST NOT require the user to understand the token courseAccess

<!-- @trace
source: mvp-sell-flow-usable
updated: 2026-08-15
code:
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/page.tsx
  - apps/saas/app/agent/page.tsx
  - packages/i18n/src/index.ts
  - apps/saas/app/course/page.tsx
  - AGENTS.md
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/layout.tsx
  - apps/saas/app/login/page.tsx
  - docs/deploy-and-public-url.md
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/course/line-community-panel.tsx
-->

---
### Requirement: Buyer-visible errors use plain Traditional Chinese
Learner-facing UI for agent, checkout, demo grant, and kit panels SHALL map failures to plain Traditional Chinese. Raw provider codes such as provider_failed or HTTP status numbers MUST NOT be the primary user-visible message.

#### Scenario: Agent failure without jargon
- **WHEN** the site agent chat fails for a non-auth reason
- **THEN** the UI MUST show a plain Traditional Chinese error and MUST NOT require the learner to understand provider_failed


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
### Requirement: Support email is visible when configured
When SUPPORT_EMAIL or EMAIL_FROM is configured, sell-flow pages SHALL expose a mailto support contact in the footer or account surface.

#### Scenario: Footer shows support mailto
- **WHEN** SUPPORT_EMAIL is set and a visitor opens the home page
- **THEN** a mailto link to that address MUST be visible

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