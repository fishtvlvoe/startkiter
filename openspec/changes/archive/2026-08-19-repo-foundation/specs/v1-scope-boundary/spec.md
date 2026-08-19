## ADDED Requirements

### Requirement: v1 take-home capabilities

A completed v1 take-home SHALL include Traditional Chinese public pages and an authenticated back office, email/password auth, Google login, LINE login, one Taiwan payment provider able to take a test payment in TWD, and e-invoice on the same order. Complete code with features default-off until a lesson turns them on is a valid v1 shape.

#### Scenario: Lesson one does not require payments

- **WHEN** a student deploys with no payment keys configured
- **THEN** the site MUST boot and MUST NOT return HTTP 500 on the public pages

#### Scenario: Currency is TWD

- **WHEN** a plan price is stored for v1 checkout
- **THEN** the currency MUST be TWD and MUST NOT be USD as the default

### Requirement: Allowed extract sources

v1 SHALL extract the SaaS shell from supastarter-nextjs-main (apps/saas, Better Auth without organization plugin, zh-TW only). v1 SHALL extract Taiwan payments, invoice abstractions, and Simple-first activation from THE-TU-Project/dev/thetu. LINE login SHALL be new work using Better Auth socialProviders.line and LINE Login Channel credentials. LINE PHP clients, LIFF, and Messaging API MUST NOT be ported.

#### Scenario: LINE login uses Login Channel only

- **WHEN** a student configures LINE
- **THEN** the product MUST accept LINE Login Channel ID and Channel Secret and MUST NOT require a Messaging API token to sign in

#### Scenario: Missing LINE email is allowed

- **WHEN** LINE id_token contains no email
- **THEN** account linking MUST key off LINE userId and MUST NOT fail solely because email is empty

### Requirement: Forbidden extract targets

v1 SHALL NOT include: THE-TU course/video/homework/newsletter/coupon/NextAuth/Apple flows; supastarter apps/marketing and apps/docs; Lemon Squeezy, Polar, Dodo, or Creem; Organization, Member, or Invitation; passkeys, two-factor, GitHub OAuth, AI chatbot, or notification modules; any libon.me code.

#### Scenario: Organization tables are absent

- **WHEN** the v1 database schema is created
- **THEN** it MUST NOT introduce organization, member, or invitation tables and billing MUST attach to user

#### Scenario: Course fulfillment is not copied

- **WHEN** a payment succeeds
- **THEN** fulfillment MUST grant a SaaS plan on the user and MUST NOT copy THE-TU course-access post-payment actions

### Requirement: Payments and invoice policy

The primary v1 payment gateway SHALL be SHOPLINE Payments using hosted checkout redirect. PAYUNi SHALL remain in the template as an advanced second gateway. Stripe is optional and MUST NOT be the beginner lesson path. v1 SHALL sell one-time TWD purchases only. Recurring subscriptions MUST NOT be taught on SHOPLINE. Payment and invoice secrets SHALL be stored in admin settings with environment-variable fallback. Unconfigured payment checkout MUST fail closed without HTTP 500. E-invoice SHALL default off, map one-to-one with an order, and issue only after the order is paid.

#### Scenario: Unconfigured checkout fails closed

- **WHEN** a user starts checkout and SHOPLINE keys are missing
- **THEN** the request MUST fail closed with an explicit configuration error and MUST NOT return HTTP 500

#### Scenario: Invoice stays off by default

- **WHEN** invoice is not enabled in admin settings
- **THEN** checkout MUST NOT require carrier, tax ID, or donation fields and MUST NOT call an invoice provider

#### Scenario: SHOPLINE subscription is rejected

- **WHEN** a change proposes monthly billing on SHOPLINE
- **THEN** the change MUST be rejected because SHOPLINE does not support subscriptions in this product

### Requirement: Four-lesson unlock order

Course unlock order SHALL be: (1) zh-TW front and back office online, (2) Google then LINE login, (3) one SHOPLINE test payment visible as an order, (4) e-invoice on that same order. Later extract changes MUST preserve this order in docs and default-off flags.

#### Scenario: Lesson three does not require invoice

- **WHEN** a student completes a SHOPLINE test payment
- **THEN** the back office MUST show the order status even if invoice is disabled

#### Scenario: Lesson four binds invoice to the paid order

- **WHEN** invoice is enabled and a paid order exists
- **THEN** the system MUST issue at most one invoice for that order (idempotent) covering personal carrier, company tax ID, or donation
