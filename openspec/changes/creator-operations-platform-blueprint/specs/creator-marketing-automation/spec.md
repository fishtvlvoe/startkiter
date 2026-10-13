## Purpose

This capability defines creator-owned email campaigns and event-driven automation without coupling domain rules to one delivery provider. It extends the existing newsletter and consent foundations with a consistent campaign, workflow, delivery, retry, and audit contract.

## ADDED Requirements

### Requirement: A creator SHALL compose and schedule a campaign

The system SHALL support draft, scheduled, sending, paused, sent, partial-failed, failed, and cancelled campaign states. A campaign SHALL record its audience definition, content revision, sender identity, schedule timezone, and delivery summary.

#### Scenario: A creator schedules a campaign

- **WHEN** an authorized creator schedules a valid campaign for a valid audience
- **THEN** the system stores the campaign revision, resolved timezone, audience estimate, and scheduled state

##### Example: Concrete acceptance fixture 1

- **GIVEN** campaign P1 revision R3 has 2 eligible contacts and timezone Asia/Taipei
- **WHEN** a permitted creator schedules P1 at 2026-11-01 09:00 local time
- **THEN** scheduled state references R3, estimate 2, and instant 2026-11-01T01:00:00Z

#### Scenario: A scheduled campaign has no eligible recipients

- **WHEN** the resolved audience has zero eligible recipients
- **THEN** the system refuses scheduling and explains that consent or audience conditions produced an empty audience

##### Example: Concrete acceptance fixture 2

- **GIVEN** P1 targets C1/C2 and both revoked email-marketing consent
- **WHEN** P1 is submitted for scheduling
- **THEN** scheduling is refused with eligible count 0, not marked scheduled or sent

### Requirement: Automation SHALL be driven by durable events

The system SHALL accept domain events through a transactional outbox and SHALL execute automation steps with idempotency keys. Supported actions SHALL include tagging, segment enrollment, email delivery, delay, notification, and webhook dispatch only when an explicit adapter is configured.

#### Scenario: A purchase starts a welcome workflow

- **WHEN** a paid order event is committed
- **THEN** the system creates one automation enrollment and executes each eligible step at most once per idempotency key

##### Example: Concrete acceptance fixture 3

- **GIVEN** order O1 commits order.paid event E1 in W1 and workflow V1 is enabled
- **WHEN** the outbox worker processes E1
- **THEN** one enrollment keyed to E1/V1 is stored with the configured welcome step

#### Scenario: The same event is delivered twice

- **WHEN** the worker receives a duplicate event
- **THEN** the system acknowledges the duplicate without creating a second enrollment or sending a duplicate message

##### Example: Concrete acceptance fixture 4

- **GIVEN** E1/V1 already produced enrollment N1 and accepted message D1
- **WHEN** E1 is replayed
- **THEN** N1 remains the only enrollment and no second D1/provider request is created

### Requirement: Provider delivery SHALL expose observable outcomes

Email and future SMS delivery SHALL use a provider port that returns accepted, delivered, rejected, deferred, bounced, complained, or unknown outcomes when supported by verified provider evidence. The system SHALL store provider reference, attempt count, timestamps, and normalized error code; unsupported delivery evidence SHALL remain unavailable rather than fabricated.

Provider acceptance SHALL NOT be represented as confirmed delivery or recipient engagement. A timeout after request dispatch SHALL remain an unknown outcome unless the adapter can establish that the request was not accepted. Unknown outcomes SHALL NOT trigger blind retries: the system SHALL reconcile the provider reference or use verified provider idempotency support, otherwise pause for authorized operator resolution. Retries SHALL preserve the original intent key; an intentional resend SHALL require a distinct audited action and a fresh eligibility check.

#### Scenario: A provider returns a transient failure

- **WHEN** the provider returns a retryable failure
- **THEN** the system schedules a bounded retry and shows the delivery as pending or deferred

##### Example: Concrete acceptance fixture 5

- **GIVEN** delivery D1 has retry limit 3 and attempts 0; the adapter confirms a retryable timeout occurred before provider acceptance
- **WHEN** the worker executes D1
- **THEN** D1 is deferred with attempt 1 and next retry; no sent/confirmed-delivered claim is recorded

#### Scenario: A provider returns a permanent failure

- **WHEN** the provider returns a permanent rejection or hard bounce
- **THEN** the system marks the delivery failed, updates suppression state when applicable, and SHALL NOT retry indefinitely

##### Example: Concrete acceptance fixture 6

- **GIVEN** D1 is rejected as invalid recipient with permanent status
- **WHEN** the worker records the provider outcome
- **THEN** D1 becomes failed, applicable suppression is recorded, and no infinite retry is queued

### Requirement: Marketing actions SHALL honor consent and unsubscribe

The system SHALL resolve marketing eligibility immediately before delivery. A valid unsubscribe request SHALL be processed idempotently and SHALL apply to future campaigns and automation steps.

#### Scenario: A contact unsubscribes during a scheduled campaign

- **WHEN** the contact revokes marketing consent before delivery
- **THEN** the delivery is skipped and the campaign summary records the suppression reason

##### Example: Concrete acceptance fixture 7

- **GIVEN** C1 was eligible in P1 audience snapshot but revokes before D1 executes
- **WHEN** the worker checks eligibility immediately before send
- **THEN** D1 is skipped with consent-revoked reason and no provider request

#### Scenario: An automation has no configured sender

- **WHEN** an automation step has no valid sender identity or provider
- **THEN** the step fails with an actionable configuration error and SHALL NOT silently drop the event

##### Example: Concrete acceptance fixture 8

- **GIVEN** step D1 has no sender identity or active provider
- **WHEN** the worker executes the email step
- **THEN** the step records a configuration failure and remains visible for operator correction

