## Purpose

This capability defines the Taiwan-first localization, payment, invoice, identity, messaging, and personal-data safeguards required by the creator platform. It keeps regulatory and provider details behind explicit adapters and auditable contracts.

## ADDED Requirements

### Requirement: Workspace display defaults SHALL be Taiwan-ready

The system SHALL default new Taiwan creator workspaces to Traditional Chinese, TWD integer display, and Asia/Taipei timezone. Locale, currency, and timezone SHALL be explicit workspace settings and SHALL be available to pages, emails, schedules, and exports.

#### Scenario: A Taiwan creator creates a workspace

- **WHEN** a new workspace is created with Taiwan defaults
- **THEN** pages, dates, amounts, and creator-facing messages use zh-TW, TWD, and Asia/Taipei unless the creator changes settings

##### Example: Concrete acceptance fixture 1

- **GIVEN** a new W1 is created with Taiwan defaults
- **WHEN** its page/email/schedule/export context is resolved
- **THEN** locale is zh-TW, currency is TWD integer and timezone is Asia/Taipei

#### Scenario: A creator changes locale

- **WHEN** a creator changes the workspace locale to en
- **THEN** supported labels, dates, emails, and exports use the selected locale while stored monetary amounts remain exact

##### Example: Concrete acceptance fixture 2

- **GIVEN** W1 stores order amount 8800 TWD and locale zh-TW
- **WHEN** creator changes W1 locale to en
- **THEN** translated labels change while stored amount remains exactly 8800 TWD

### Requirement: Payment and invoice providers SHALL be isolated behind adapters

The system SHALL use a payment port for PAYUNi and an invoice port for the selected Taiwan e-invoice adapter. Each external request SHALL carry an idempotency key and SHALL persist provider references and normalized state transitions.

Invoice applicability and the effect of invoice failure on entitlement SHALL be explicit policy for each applicable Offer or an inherited validated policy reference. Payment success SHALL remain distinct from invoice issuance success. An unresolved new invoice policy SHALL block publishing the affected new Offer; this blueprint SHALL NOT silently change the existing MVP invoice scope or existing payment adapter.

#### Scenario: A payment webhook is replayed

- **WHEN** the same signed webhook is received more than once
- **THEN** the system acknowledges the replay without duplicating an order, invoice, refund, or entitlement transition

##### Example: Concrete acceptance fixture 3

- **GIVEN** signed notification H1 already paid O1
- **WHEN** H1 is replayed
- **THEN** one paid transition and configured invoice/entitlement outcomes remain, with no duplicate refund

#### Scenario: Invoice issuance fails after payment

- **WHEN** payment succeeds but invoice issuance fails
- **THEN** the order remains paid, invoice state is marked pending or failed, the failure is visible to the operator, and entitlement handling follows the configured business rule

##### Example: Concrete acceptance fixture 4

- **GIVEN** O1 payment is paid and invoice adapter returns issuance failure
- **WHEN** invoice processing runs
- **THEN** O1 remains paid, invoice failure/pending is visible and access follows the explicitly selected policy

### Requirement: Personal-data processing SHALL be consented and auditable

The system SHALL record collection purpose, data category, notice version, consent action, source, timestamp, and processor or provider boundary for personal data used by CRM, marketing, checkout, support, and analytics. The system SHALL provide an operator workflow for correction, export, suppression, and deletion requests.

#### Scenario: A contact withdraws marketing consent

- **WHEN** a contact withdraws marketing consent
- **THEN** the system records the withdrawal, suppresses marketing delivery, and preserves the audit record

##### Example: Concrete acceptance fixture 5

- **GIVEN** C1 consent purpose email-marketing was granted
- **WHEN** C1 withdraws that purpose
- **THEN** revocation source/version/time are retained and marketing delivery is suppressed

#### Scenario: An operator requests contact deletion

- **WHEN** an authorized operator approves a deletion request
- **THEN** the system removes or anonymizes eligible personal data while retaining legally or operationally required transaction evidence

##### Example: Concrete acceptance fixture 6

- **GIVEN** C1 has deletable profile data and Order O1 retained under applicable policy
- **WHEN** authorized operator approves deletion request D1
- **THEN** eligible profile data is removed/anonymized while O1 necessary evidence and D1 audit remain

### Requirement: LINE identity and messaging SHALL keep separate purposes

The system SHALL distinguish LINE Login identity, course community invite links, and customer-service messaging. The platform SHALL NOT silently add a learner to a LINE group and SHALL NOT use a login identity as marketing consent.

#### Scenario: A paid learner opens the community entry

- **WHEN** a buyer has the required course entitlement
- **THEN** the platform shows the configured LINE invite link and records the access decision without silently joining the learner

##### Example: Concrete acceptance fixture 7

- **GIVEN** buyer B1 owns Course A and A has invite URL I1; B1 does not own Course B
- **WHEN** B1 opens A community entry
- **THEN** I1 is shown after A access decision, no silent join occurs and B invite is not exposed

#### Scenario: A creator uses customer-service messaging

- **WHEN** a support message is sent through the configured LINE customer-service channel
- **THEN** the message is recorded as support communication and SHALL NOT become a marketing consent event

##### Example: Concrete acceptance fixture 8

- **GIVEN** configured LINE support channel sends response M1 to customer C1
- **WHEN** support delivery is recorded
- **THEN** M1 purpose is support and no marketing consent is created

