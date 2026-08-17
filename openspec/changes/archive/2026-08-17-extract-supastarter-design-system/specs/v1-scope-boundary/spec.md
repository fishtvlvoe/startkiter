## MODIFIED Requirements

### Requirement: v1 take-home capabilities

A completed MVP take-home SHALL include public pages available in zh-TW, zh-CN, and en, an authenticated area, email/password auth, Google login, LINE login, PAYUNi one-time TWD checkout, an in-site course module, GitHub kit claim, and a site-agent with two read-only tools. All pages MUST be composed from the shared design system defined in the design-system capability rather than page-local hand-written styling. Complete code with unused modules present but not required to finish first purchase is a valid MVP shape.

#### Scenario: Site boots without payment keys

- **WHEN** an operator deploys with no PAYUNi keys configured
- **THEN** the public pages MUST boot and MUST NOT return HTTP 500

#### Scenario: Currency is TWD

- **WHEN** the MVP price is stored for checkout
- **THEN** the currency MUST be TWD and the amount MUST be 8800

## ADDED Requirements

### Requirement: Feature scope expansion beyond this change requires an explicit decision record

Extracting further THE-TU-Project business capabilities (coupons, subscriptions, newsletters, bundles, analytics, instructors, comments, messages, media management) or reintroducing organization multi-tenancy into StartKiter MUST NOT proceed based on this change alone. Each such expansion MUST be proposed as its own change with an explicit decision recorded in that change's proposal before any extraction code is written.

#### Scenario: A follow-up change proposes extracting coupons

- **WHEN** a new change proposes extracting THE-TU's coupon capability
- **THEN** that change's proposal MUST explicitly state the decision to include coupons rather than assuming it from this change's broader direction

##### Example: Explicit decision required

- **GIVEN** this change (merge-supastarter-ui-course-platform) establishes the design-system foundation only
- **WHEN** a later change proposes implementing subscriptions
- **THEN** that later change's proposal.md MUST contain a Why section justifying subscriptions specifically, not a reference to "the general direction agreed in merge-supastarter-ui-course-platform"
