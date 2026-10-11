## Purpose

This capability defines the operational visibility layer for creator workspaces. It turns domain events and provider outcomes into actionable dashboards, reports, alerts, exports, and audit records without exposing unauthorized personal data.

## ADDED Requirements

### Requirement: The operations home SHALL show actionable creator status

The system SHALL show workspace-scoped revenue, orders, audience growth, delivery health, pending tasks, and configuration warnings. Every metric SHALL identify its time range, data freshness, and drill-down route.

#### Scenario: A creator opens the operations home

- **WHEN** a creator opens the operations home
- **THEN** the system shows current metrics, pending actions, and configuration warnings for the selected workspace and period

#### Scenario: A metric source is unavailable

- **WHEN** one metric source cannot be queried
- **THEN** the system marks that metric unavailable, preserves other metrics, and displays the affected source and retry path

### Requirement: Domain events SHALL support deterministic reporting

The system SHALL record normalized events for contact creation, consent change, page conversion, checkout, payment, refund, content access, campaign delivery, automation execution, and support activity. Events SHALL include workspace scope, event time, source, actor or subject reference, and deduplication key.

#### Scenario: A paid order updates revenue

- **WHEN** a paid order event is committed
- **THEN** the revenue report includes the event exactly once and links back to the order

#### Scenario: An event arrives without workspace scope

- **WHEN** an event lacks a valid workspace scope
- **THEN** the system rejects it before reporting and records an ingestion error

### Requirement: Exports SHALL be permission-aware and reproducible

The system SHALL provide CSV or spreadsheet-compatible exports for contacts, orders, revenue, campaign delivery, and audit records. Each export SHALL record requester, filters, locale, timezone, generated time, and field policy.

#### Scenario: An operator exports order data

- **WHEN** an authorized operator exports orders for a date range
- **THEN** the export contains the selected scope and records the exact filter and field policy used

#### Scenario: A user lacks export permission

- **WHEN** a user requests an export outside their capability
- **THEN** the system denies the request without revealing row counts or field names

### Requirement: Operational failures SHALL produce actionable alerts

The system SHALL surface failed payments, invoice failures, delivery failures, automation dead letters, webhook signature failures, and configuration gaps through in-app notifications and operator logs.

#### Scenario: A webhook signature fails

- **WHEN** an external webhook fails signature verification
- **THEN** the system rejects state changes, records a security event, and shows an operator alert without exposing secrets

#### Scenario: An automation enters dead-letter state

- **WHEN** an automation exceeds its retry policy
- **THEN** the system marks it dead-lettered, shows the failed step and normalized reason, and exposes a controlled retry action

