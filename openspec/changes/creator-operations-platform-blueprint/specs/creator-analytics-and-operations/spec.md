## Purpose

This capability defines the operational visibility layer for creator workspaces. It turns domain events and provider outcomes into actionable dashboards, reports, alerts, exports, and audit records without exposing unauthorized personal data.

## ADDED Requirements

### Requirement: The operations home SHALL show actionable creator status

The system SHALL show workspace-scoped revenue, orders, audience growth, delivery health, pending tasks, and configuration warnings. Every metric SHALL identify its time range, data freshness, and drill-down route.

#### Scenario: A creator opens the operations home

- **WHEN** a creator opens the operations home
- **THEN** the system shows current metrics, pending actions, and configuration warnings for the selected workspace and period

##### Example: Concrete acceptance fixture 1

- **GIVEN** W1 period 2026-11-01 to 2026-11-30 has 2 paid orders and task T1
- **WHEN** U1 opens the dashboard for W1 and that period
- **THEN** the metrics identify that period and freshness, task T1 links to its operation, and W2 is excluded

#### Scenario: A metric source is unavailable

- **WHEN** one metric source cannot be queried
- **THEN** the system marks that metric unavailable, preserves other metrics, and displays the affected source and retry path

##### Example: Concrete acceptance fixture 2

- **GIVEN** orders source responds while audience source times out
- **WHEN** the dashboard loads W1
- **THEN** orders remain visible; audience is unavailable with source and retry, not displayed as zero

### Requirement: Domain events SHALL support deterministic reporting

The system SHALL record normalized events for contact creation, consent change, page conversion, checkout, payment, refund, content access, campaign delivery, automation execution, and support activity. Events SHALL include workspace scope, event time, source, actor or subject reference, and deduplication key.

#### Scenario: A paid order updates revenue

- **WHEN** a paid order event is committed
- **THEN** the revenue report includes the event exactly once and links back to the order

##### Example: Concrete acceptance fixture 3

- **GIVEN** O1 has paid amount TWD 8800 and event E1 is processed once
- **WHEN** E1 is replayed into the report
- **THEN** O1 contributes 8800 once and the displayed contribution links to O1

#### Scenario: An event arrives without workspace scope

- **WHEN** an event lacks a valid workspace scope
- **THEN** the system rejects it before reporting and records an ingestion error

##### Example: Concrete acceptance fixture 4

- **GIVEN** event E1 has no workspace identity
- **WHEN** the event ingestion step runs
- **THEN** E1 is rejected with missing-workspace error and changes no workspace report

### Requirement: Exports SHALL be permission-aware and reproducible

The system SHALL provide CSV or spreadsheet-compatible exports for contacts, orders, revenue, campaign delivery, and audit records. Each export SHALL record requester, filters, locale, timezone, generated time, and field policy.

#### Scenario: An operator exports order data

- **WHEN** an authorized operator exports orders for a date range
- **THEN** the export contains the selected scope and records the exact filter and field policy used

##### Example: Concrete acceptance fixture 5

- **GIVEN** U1 can export W1 orders; O1 is November and O2 is December
- **WHEN** U1 exports November in Asia/Taipei
- **THEN** only O1 is included and export metadata retains requester, period, timezone and field policy

#### Scenario: A user lacks export permission

- **WHEN** a user requests an export outside their capability
- **THEN** the system denies the request without revealing row counts or field names

##### Example: Concrete acceptance fixture 6

- **GIVEN** U2 lacks W1 export capability
- **WHEN** U2 requests W1 orders export
- **THEN** the operation is denied without returning row counts, column names or generated file

### Requirement: Operational failures SHALL produce actionable alerts

The system SHALL surface failed payments, invoice failures, delivery failures, automation dead letters, webhook signature failures, and configuration gaps through in-app notifications and operator logs.

#### Scenario: A webhook signature fails

- **WHEN** an external webhook fails signature verification
- **THEN** the system rejects state changes, records a security event, and shows an operator alert without exposing secrets

##### Example: Concrete acceptance fixture 7

- **GIVEN** order O1 is pending and webhook H1 has invalid signature
- **WHEN** H1 is processed
- **THEN** O1 stays pending, no entitlement is granted and a redacted operator alert records H1 failure

#### Scenario: An automation enters dead-letter state

- **WHEN** an automation exceeds its retry policy
- **THEN** the system marks it dead-lettered, shows the failed step and normalized reason, and exposes a controlled retry action

##### Example: Concrete acceptance fixture 8

- **GIVEN** workflow step S1 retry limit is 3 and three attempts failed
- **WHEN** the retry policy is exhausted
- **THEN** S1 is dead-lettered with normalized reason and controlled retry entry, without automatic attempt 4

