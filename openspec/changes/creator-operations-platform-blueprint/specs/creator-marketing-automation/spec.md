## Purpose

This capability defines creator-owned email campaigns and event-driven automation without coupling domain rules to one delivery provider. It extends the existing newsletter and consent foundations with a consistent campaign, workflow, delivery, retry, and audit contract.

## ADDED Requirements

### Requirement: A creator SHALL compose and schedule a campaign

The system SHALL support draft, scheduled, sending, paused, sent, partial-failed, failed, and cancelled campaign states. A campaign SHALL record its audience definition, content revision, sender identity, schedule timezone, and delivery summary.

#### Scenario: A creator schedules a campaign

- **WHEN** an authorized creator schedules a valid campaign for a valid audience
- **THEN** the system stores the campaign revision, resolved timezone, audience estimate, and scheduled state

#### Scenario: A scheduled campaign has no eligible recipients

- **WHEN** the resolved audience has zero eligible recipients
- **THEN** the system refuses scheduling and explains that consent or audience conditions produced an empty audience

### Requirement: Automation SHALL be driven by durable events

The system SHALL accept domain events through a transactional outbox and SHALL execute automation steps with idempotency keys. Supported actions SHALL include tagging, segment enrollment, email delivery, delay, notification, and webhook dispatch only when an explicit adapter is configured.

#### Scenario: A purchase starts a welcome workflow

- **WHEN** a paid order event is committed
- **THEN** the system creates one automation enrollment and executes each eligible step at most once per idempotency key

#### Scenario: The same event is delivered twice

- **WHEN** the worker receives a duplicate event
- **THEN** the system acknowledges the duplicate without creating a second enrollment or sending a duplicate message

### Requirement: Provider delivery SHALL expose observable outcomes

Email and future SMS delivery SHALL use a provider port that returns accepted, rejected, deferred, bounced, complained, or unknown outcomes. The system SHALL store provider reference, attempt count, timestamps, and normalized error code.

#### Scenario: A provider returns a transient failure

- **WHEN** the provider returns a retryable failure
- **THEN** the system schedules a bounded retry and shows the delivery as pending or deferred

#### Scenario: A provider returns a permanent failure

- **WHEN** the provider returns a permanent rejection or hard bounce
- **THEN** the system marks the delivery failed, updates suppression state when applicable, and SHALL NOT retry indefinitely

### Requirement: Marketing actions SHALL honor consent and unsubscribe

The system SHALL resolve marketing eligibility immediately before delivery. A valid unsubscribe request SHALL be processed idempotently and SHALL apply to future campaigns and automation steps.

#### Scenario: A contact unsubscribes during a scheduled campaign

- **WHEN** the contact revokes marketing consent before delivery
- **THEN** the delivery is skipped and the campaign summary records the suppression reason

#### Scenario: An automation has no configured sender

- **WHEN** an automation step has no valid sender identity or provider
- **THEN** the step fails with an actionable configuration error and SHALL NOT silently drop the event

