## Purpose

Audience targeting lets a creator choose who receives a campaign — everyone, a manually checked list, or a single-layer AND/OR condition on purchase and activity data — with a live, deduplicated recipient-count estimate, so the creator always knows how many people will actually receive the email before they send it.

## ADDED Requirements

### Requirement: Send to all or manually selected recipients

The system SHALL support sending a campaign to the entire eligible user base with one action, or to a manually checked subset selected from a searchable, filterable table.

#### Scenario: Manual selection count is visible

- **WHEN** a creator checks a subset of rows in the recipient table
- **THEN** the system SHALL display the count of currently selected recipients

### Requirement: Single-layer AND/OR audience conditions

The system SHALL support combining audience conditions (purchased course, learner type, role, activity recency, coupon usage, registration date range, consent status) with a single logical operator applied uniformly, either AND or OR across all active conditions, and SHALL NOT support nested condition groups.

#### Scenario: AND combination narrows the audience

- **WHEN** a creator sets conditions "purchased course X" AND "logged in within 30 days"
- **THEN** the estimated recipient count SHALL only include users satisfying both conditions

### Requirement: Live deduplicated recipient estimate

The system SHALL recompute the estimated recipient count after a debounce period following any condition change, and SHALL report the estimate after deduplication and after excluding unsubscribed and invalid-email recipients.

#### Scenario: OR combination deduplicates overlapping matches

- **WHEN** condition A matches 200 users, condition B matches 150 users, and 80 users match both, combined with OR
- **THEN** the system SHALL report an estimated count of 270 distinct recipients

### Requirement: Automatic exclusion of unsubscribed and invalid recipients

The system SHALL exclude any user with `unsubscribedAt` set or `emailInvalidAt` set from every audience calculation and from actual dispatch, regardless of which other conditions match them.

#### Scenario: Unsubscribed user is excluded even when explicitly matched by a condition

- **WHEN** a user who has unsubscribed also matches an active audience condition
- **THEN** the system SHALL exclude that user from both the estimated count and the actual send

### Requirement: Deduplication by recipient email

The system SHALL deduplicate recipients by normalized email address so that a single person is counted and sent to only once per campaign, even if they match multiple audience conditions or appear via multiple account records sharing the same email.

#### Scenario: User matching two independent conditions receives one email

- **WHEN** a user matches both "purchased course A" and "purchased course B" conditions applied with AND
- **THEN** that user SHALL appear as exactly one `NewsletterRecipient` row for the campaign

### Requirement: Audience recomputed at dispatch time

The system SHALL apply the audience conditions and consent filters again at the moment of dispatch, not only at campaign creation time, so that the actual send reflects the current state rather than a stale snapshot.

#### Scenario: Estimate and actual send diverge when audience changes during the send window

- **WHEN** the recipient pool changes (e.g. a new unsubscribe) between campaign creation and dispatch
- **THEN** the actual dispatched recipient set SHALL reflect the state at dispatch time, not the state at creation time
