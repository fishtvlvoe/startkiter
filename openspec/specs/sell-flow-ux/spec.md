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