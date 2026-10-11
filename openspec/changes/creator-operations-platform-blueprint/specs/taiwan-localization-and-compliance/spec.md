## Purpose

This capability defines the Taiwan-first localization, payment, invoice, identity, messaging, and personal-data safeguards required by the creator platform. It keeps regulatory and provider details behind explicit adapters and auditable contracts.

## ADDED Requirements

### Requirement: Workspace display defaults SHALL be Taiwan-ready

The system SHALL default new Taiwan creator workspaces to Traditional Chinese, TWD integer display, and Asia/Taipei timezone. Locale, currency, and timezone SHALL be explicit workspace settings and SHALL be available to pages, emails, schedules, and exports.

#### Scenario: A Taiwan creator creates a workspace

- **WHEN** a new workspace is created with Taiwan defaults
- **THEN** pages, dates, amounts, and creator-facing messages use zh-TW, TWD, and Asia/Taipei unless the creator changes settings

#### Scenario: A creator changes locale

- **WHEN** a creator changes the workspace locale to en
- **THEN** supported labels, dates, emails, and exports use the selected locale while stored monetary amounts remain exact

### Requirement: Payment and invoice providers SHALL be isolated behind adapters

The system SHALL use a payment port for PAYUNi and an invoice port for the selected Taiwan e-invoice adapter. Each external request SHALL carry an idempotency key and SHALL persist provider references and normalized state transitions.

#### Scenario: A payment webhook is replayed

- **WHEN** the same signed webhook is received more than once
- **THEN** the system acknowledges the replay without duplicating an order, invoice, refund, or entitlement transition

#### Scenario: Invoice issuance fails after payment

- **WHEN** payment succeeds but invoice issuance fails
- **THEN** the order remains paid, invoice state is marked pending or failed, the failure is visible to the operator, and entitlement handling follows the configured business rule

### Requirement: Personal-data processing SHALL be consented and auditable

The system SHALL record collection purpose, data category, notice version, consent action, source, timestamp, and processor or provider boundary for personal data used by CRM, marketing, checkout, support, and analytics. The system SHALL provide an operator workflow for correction, export, suppression, and deletion requests.

#### Scenario: A contact withdraws marketing consent

- **WHEN** a contact withdraws marketing consent
- **THEN** the system records the withdrawal, suppresses marketing delivery, and preserves the audit record

#### Scenario: An operator requests contact deletion

- **WHEN** an authorized operator approves a deletion request
- **THEN** the system removes or anonymizes eligible personal data while retaining legally or operationally required transaction evidence

### Requirement: LINE identity and messaging SHALL keep separate purposes

The system SHALL distinguish LINE Login identity, course community invite links, and customer-service messaging. The platform SHALL NOT silently add a learner to a LINE group and SHALL NOT use a login identity as marketing consent.

#### Scenario: A paid learner opens the community entry

- **WHEN** a buyer has the required course entitlement
- **THEN** the platform shows the configured LINE invite link and records the access decision without silently joining the learner

#### Scenario: A creator uses customer-service messaging

- **WHEN** a support message is sent through the configured LINE customer-service channel
- **THEN** the message is recorded as support communication and SHALL NOT become a marketing consent event

