# operator-settings Specification

## Purpose

TBD - created by archiving change 'operator-payuni-settings'. Update Purpose after archive.

## Requirements

### Requirement: Operator identity matches ADMIN_EMAIL
A signed-in user is an operator when either (a) ADMIN_EMAIL is non-empty and equals the session email after trim and ASCII case folding, or (b) the user's role equals `admin`. An empty ADMIN_EMAIL and a non-admin role together MUST grant operator status to nobody.

#### Scenario: Matching email is operator
- **WHEN** ADMIN_EMAIL is Fish@Aiver.me and the session email is fish@aiver.me
- **THEN** operator checks MUST return true

#### Scenario: Admin role is operator even when email does not match ADMIN_EMAIL
- **WHEN** ADMIN_EMAIL is fish@aiver.me and a signed-in user's email is teammate@aiver.me with role `admin`
- **THEN** operator checks MUST return true

#### Scenario: Neither condition grants nobody
- **WHEN** ADMIN_EMAIL is unset or blank and any signed-in user with role other than `admin` calls GET /api/admin/settings/payuni
- **THEN** the response MUST be HTTP 403 and MUST NOT include ciphertext or full hashKey

##### Example: case-insensitive match
- **GIVEN** ADMIN_EMAIL=ops@startkiter.test and session email Ops@Startkiter.test
- **WHEN** the server evaluates operator status
- **THEN** the user is treated as operator


<!-- @trace
source: operator-payuni-settings
updated: 2026-08-15
code:
  - apps/saas/app/admin/settings/payuni-settings-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/lib/orders.ts
  - apps/saas/lib/site-settings.ts
  - apps/saas/lib/settings-crypto.ts
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/api/admin/settings/payuni/route.ts
  - apps/saas/app/admin/settings/page.tsx
  - apps/saas/lib/payuni-settings-view.ts
  - apps/saas/.env.example
  - apps/saas/lib/operator.ts
  - packages/database/prisma/migrations/20260815040000_add_site_setting/migration.sql
  - packages/database/prisma/schema.prisma
  - docs/deploy-and-public-url.md
  - packages/payments/src/index.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/lib/payuni-settings.ts
tests:
  - apps/saas/lib/operator.test.ts
  - apps/saas/lib/orders-credentials.test.ts
  - apps/saas/lib/payuni-settings-view.test.ts
  - apps/saas/lib/payuni-settings.test.ts
  - apps/saas/lib/site-settings.test.ts
  - apps/saas/lib/settings-crypto.test.ts
-->

---
### Requirement: Unauthenticated admin settings fail closed
GET /api/admin/settings/payuni and PUT /api/admin/settings/payuni MUST require a session. Missing session MUST return HTTP 401. A signed-in non-operator MUST receive HTTP 403. GET /admin/settings for a non-operator MUST NOT render the PAYUNi key form.

#### Scenario: Anonymous GET settings API
- **WHEN** a client without a session sends GET /api/admin/settings/payuni
- **THEN** the response MUST be HTTP 401

#### Scenario: Learner is denied the settings page
- **WHEN** a signed-in user whose email is not ADMIN_EMAIL requests GET /admin/settings
- **THEN** the response MUST NOT include merchantId, hashKey, or hashIV input fields


<!-- @trace
source: operator-payuni-settings
updated: 2026-08-15
code:
  - apps/saas/app/admin/settings/payuni-settings-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/lib/orders.ts
  - apps/saas/lib/site-settings.ts
  - apps/saas/lib/settings-crypto.ts
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/api/admin/settings/payuni/route.ts
  - apps/saas/app/admin/settings/page.tsx
  - apps/saas/lib/payuni-settings-view.ts
  - apps/saas/.env.example
  - apps/saas/lib/operator.ts
  - packages/database/prisma/migrations/20260815040000_add_site_setting/migration.sql
  - packages/database/prisma/schema.prisma
  - docs/deploy-and-public-url.md
  - packages/payments/src/index.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/lib/payuni-settings.ts
tests:
  - apps/saas/lib/operator.test.ts
  - apps/saas/lib/orders-credentials.test.ts
  - apps/saas/lib/payuni-settings-view.test.ts
  - apps/saas/lib/payuni-settings.test.ts
  - apps/saas/lib/site-settings.test.ts
  - apps/saas/lib/settings-crypto.test.ts
-->

---
### Requirement: Operator can read masked PAYUNi settings
GET /api/admin/settings/payuni as an operator MUST return HTTP 200 JSON with merchantId, hashKeyMasked, hashIVMasked, apiUrl, and source equal to settings, env, or none. The JSON MUST NOT contain the full hashKey or hashIV values.

#### Scenario: Masked response from settings
- **WHEN** an operator loads GET /api/admin/settings/payuni and a settings row exists with hashKey of 32 characters
- **THEN** hashKeyMasked MUST include asterisks and MUST NOT equal the stored hashKey, and source MUST be settings

#### Scenario: Source env when settings empty
- **WHEN** an operator loads GET /api/admin/settings/payuni with no settings row and PAYUNI_MERCHANT_ID set in env
- **THEN** source MUST be env and HTTP status MUST be 200


<!-- @trace
source: operator-payuni-settings
updated: 2026-08-15
code:
  - apps/saas/app/admin/settings/payuni-settings-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/lib/orders.ts
  - apps/saas/lib/site-settings.ts
  - apps/saas/lib/settings-crypto.ts
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/api/admin/settings/payuni/route.ts
  - apps/saas/app/admin/settings/page.tsx
  - apps/saas/lib/payuni-settings-view.ts
  - apps/saas/.env.example
  - apps/saas/lib/operator.ts
  - packages/database/prisma/migrations/20260815040000_add_site_setting/migration.sql
  - packages/database/prisma/schema.prisma
  - docs/deploy-and-public-url.md
  - packages/payments/src/index.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/lib/payuni-settings.ts
tests:
  - apps/saas/lib/operator.test.ts
  - apps/saas/lib/orders-credentials.test.ts
  - apps/saas/lib/payuni-settings-view.test.ts
  - apps/saas/lib/payuni-settings.test.ts
  - apps/saas/lib/site-settings.test.ts
  - apps/saas/lib/settings-crypto.test.ts
-->

---
### Requirement: Operator can write encrypted PAYUNi settings
PUT /api/admin/settings/payuni as an operator MUST persist merchantId, hashKey, hashIV, and apiUrl encrypted at rest when SETTINGS_ENCRYPTION_KEY is configured. Missing SETTINGS_ENCRYPTION_KEY MUST return HTTP 503 and MUST NOT write plaintext. hashKey of length other than 32 or hashIV of length other than 16 when provided MUST return HTTP 400. Empty hashKey or hashIV on PUT MUST keep the previously stored secret. clear true MUST delete the payuni settings row so checkout falls back to env.

#### Scenario: Successful write
- **WHEN** an operator PUTs valid merchantId, 32-character hashKey, 16-character hashIV, and apiUrl with SETTINGS_ENCRYPTION_KEY set
- **THEN** the response MUST be HTTP 200 and a later GET MUST report source settings

#### Scenario: Write without encryption key
- **WHEN** an operator PUTs valid PAYUNi fields and SETTINGS_ENCRYPTION_KEY is unset
- **THEN** the response MUST be HTTP 503 and no site_setting row MUST be inserted

#### Scenario: Clear returns to env
- **WHEN** an operator PUTs clear true
- **THEN** the payuni settings row MUST be removed and GET source MUST be env if env keys exist otherwise none

<!-- @trace
source: operator-payuni-settings
updated: 2026-08-15
code:
  - apps/saas/app/admin/settings/payuni-settings-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/lib/orders.ts
  - apps/saas/lib/site-settings.ts
  - apps/saas/lib/settings-crypto.ts
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/api/admin/settings/payuni/route.ts
  - apps/saas/app/admin/settings/page.tsx
  - apps/saas/lib/payuni-settings-view.ts
  - apps/saas/.env.example
  - apps/saas/lib/operator.ts
  - packages/database/prisma/migrations/20260815040000_add_site_setting/migration.sql
  - packages/database/prisma/schema.prisma
  - docs/deploy-and-public-url.md
  - packages/payments/src/index.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/lib/payuni-settings.ts
tests:
  - apps/saas/lib/operator.test.ts
  - apps/saas/lib/orders-credentials.test.ts
  - apps/saas/lib/payuni-settings-view.test.ts
  - apps/saas/lib/payuni-settings.test.ts
  - apps/saas/lib/site-settings.test.ts
  - apps/saas/lib/settings-crypto.test.ts
-->

---
### Requirement: Operator settings hub registers every backend settings page

The `operator-settings` capability SHALL serve as the single registry of every backend settings page accessible under `/admin/settings`. Each backend settings page SHALL have a corresponding Requirement in this spec describing what it configures. A change that adds a new backend settings page SHALL add a corresponding Requirement to this spec as part of that change.

#### Scenario: Existing settings pages are registered

- **WHEN** the operator-settings capability is consulted for the list of backend settings pages
- **THEN** it MUST include both the PAYUNi checkout settings page and the Taiwan e-invoice settings page

##### Example: Registered pages as of this change

| Settings page | Path | Setting ID | Fields | Validation |
| --- | --- | --- | --- | --- |
| PAYUNi checkout | apps/saas/app/(authenticated)/(main)/(account)/admin/settings/page.tsx | `payuni` | `merchantId`, `hashKey`, `hashIV`, `apiUrl` | `merchantId` and `apiUrl` are non-blank when supplied; `hashKey` is 32 characters; `hashIV` is 16 characters; blank secrets preserve the stored value |
| Taiwan e-invoice | apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx | `einvoice` | `provider`, `merchantId`, `hashKey`, `hashIV`, `testMode`, `sellerName`, `sellerTaxId`, `autoIssueEnabled`, `einvoiceEnabled` | `provider` is `ecpay` or `ezpay`; `merchantId`, `sellerName`, and `sellerTaxId` are non-blank; `hashKey` is 16 or 32 characters; `hashIV` is 16 characters |

Each registry entry SHALL use the stable setting ID as the database row key, list the fields persisted in its encrypted payload, and state the validation rule for every credential-bearing field. A new settings page MUST add one registry row and one corresponding Requirement before its implementation is considered complete.

<!-- @trace
source: spec-plan-consistency-cr
updated: 2026-08-25
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - docs/design-canvas/anson-manual-redesign-direction.html
-->