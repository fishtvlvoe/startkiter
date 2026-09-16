## Purpose

The newsletter send engine reliably delivers a campaign to potentially thousands of recipients despite short-lived serverless request windows and container restarts, by separating a cron-driven scheduler (which only performs atomic state transitions) from a resumable batch dispatcher (which does the actual sending), so a campaign never sends twice, never gets stuck, and never silently fails.

## ADDED Requirements

### Requirement: Campaign state machine with atomic transitions

The system SHALL model each campaign's lifecycle as `DRAFT → SCHEDULED → QUEUED → SENDING → (SENT | PARTIAL_FAILED | FAILED)`, with `PAUSED` and `CANCELLED` as additional reachable states, and SHALL perform every state transition as an atomic database update conditioned on the expected current state.

#### Scenario: Double-click on immediate send only sends once

- **WHEN** two "send now" requests for the same `DRAFT` campaign arrive concurrently
- **THEN** the system SHALL transition exactly one of them into the sending path, and SHALL reject the second with an explicit error

#### Scenario: Terminal states cannot be reverted

- **WHEN** a request attempts to change a campaign whose status is `SENT`, `FAILED`, or `CANCELLED` back to `DRAFT` or `SCHEDULED`
- **THEN** the system SHALL reject the request

### Requirement: Idempotent recipient dispatch with resume

The system SHALL create one `NewsletterRecipient` row per intended recipient before dispatch begins, enforce uniqueness on `(campaignId, userId)` and `(campaignId, toEmail)`, and SHALL resume dispatch from the first `PENDING` recipient after an interruption without re-sending already-`SENT` recipients.

#### Scenario: Container restart mid-campaign does not duplicate sends

- **WHEN** a campaign has sent 300 of 1000 recipients and the process is killed and restarted
- **THEN** the system SHALL continue from recipient 301 and SHALL NOT re-send any of the first 300

### Requirement: Cron performs only atomic scheduling transitions

The system SHALL use a cron-triggered endpoint that atomically transitions due `SCHEDULED` campaigns to `QUEUED` using a conditional update, and SHALL NOT perform the actual email sending inside that same atomic transition.

#### Scenario: Near-simultaneous cron triggers do not double-queue

- **WHEN** the cron endpoint is invoked twice within the same minute for a campaign whose `scheduledAt` has just passed
- **THEN** the system SHALL transition the campaign to `QUEUED` exactly once

### Requirement: Rate-limited dispatch

The system SHALL enforce a maximum number of sends per minute per campaign, tracked in persistent storage across batch windows, independent of any concurrency control on individual send calls.

#### Scenario: Rate limit spans multiple dispatch batches

- **WHEN** a campaign is rate-limited to 60 sends per minute and has 200 recipients
- **THEN** the system SHALL send no more than 60 recipients within any rolling 60-second window across however many batch invocations that requires

### Requirement: Consent re-checked at dispatch time, not at campaign creation

The system SHALL re-evaluate each recipient's consent and unsubscribe status immediately before sending to them, and SHALL NOT rely solely on a snapshot taken when the campaign was created or queued.

#### Scenario: Recipient unsubscribes after queueing but before their turn to send

- **WHEN** a recipient unsubscribes after the campaign enters `SENDING` but before the dispatcher reaches them
- **THEN** the system SHALL mark that recipient `SKIPPED` and SHALL NOT send them the email

### Requirement: Pause, resume, and cancel

The system SHALL support pausing a `SENDING` campaign (stopping new batches while the current batch finishes), resuming a `PAUSED` campaign from its last cursor, and cancelling a non-terminal campaign (stopping all further sends while preserving already-sent recipients).

#### Scenario: Resume does not re-send completed recipients

- **WHEN** a `PAUSED` campaign that had sent 400 of 1000 recipients is resumed
- **THEN** the system SHALL continue from recipient 401 and SHALL NOT re-send recipients 1 through 400

### Requirement: Zero eligible recipients blocks send

The system SHALL block a campaign from entering `SCHEDULED` or `SENDING` when the computed eligible-recipient count is zero, and SHALL display the reason.

#### Scenario: All recipients unsubscribed

- **WHEN** every candidate recipient for a campaign has `unsubscribedAt` set or fails the consent check
- **THEN** the system SHALL prevent the campaign from being scheduled or sent and SHALL state that zero recipients are eligible

### Requirement: Sender configuration snapshot locked at send time

The system SHALL capture the active mail provider configuration into `senderSnapshot` when a campaign enters `SENDING`, and SHALL use that snapshot for the remainder of the campaign's dispatch even if the global provider configuration changes mid-send.

#### Scenario: Provider changed while a campaign is sending

- **WHEN** an operator changes the email provider configuration while a campaign is in `SENDING`
- **THEN** the system SHALL continue dispatching the in-progress campaign using the provider configuration captured at the moment it entered `SENDING`
