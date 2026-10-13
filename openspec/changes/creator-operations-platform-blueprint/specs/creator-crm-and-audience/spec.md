## Purpose

This capability defines the first-party contact and audience foundation for creator relationships. It supports contacts who do not have accounts and keeps consent, identity linking, segmentation, and activity history auditable.

## ADDED Requirements

### Requirement: A contact SHALL be independent from a user account

The system SHALL create and manage a contact without requiring a StartKiter user account. The system SHALL support linking a contact to one user account only through verified identity evidence, but contact lifecycle operations SHALL NOT delete or disable the user account.

#### Scenario: A visitor submits a creator form

- **WHEN** a visitor submits a valid email or phone number without signing in
- **THEN** the system creates or updates a contact inside the creator workspace

##### Example: Concrete acceptance fixture 1

- **GIVEN** Workspace W1 has no User for learner@example.test
- **WHEN** a visitor submits that email through form F1
- **THEN** Contact C1 is created in W1 with source F1 and no required User

#### Scenario: A contact later creates an account

- **WHEN** a contact verifies an identity that matches an account
- **THEN** the system records an identity link and preserves the contact activity history

##### Example: Concrete acceptance fixture 2

- **GIVEN** Contact C1 has event E1 and User U1 verifies learner@example.test
- **WHEN** verified identity linking runs
- **THEN** C1 links to U1, E1 remains, and Contact deletion does not disable U1

### Requirement: Creators SHALL manage tags and deterministic segments

The system SHALL support workspace-scoped tags and saved segments based on deterministic filters over contact attributes, consent, events, purchases, course access, and tags.

#### Scenario: A creator filters paying learners

- **WHEN** a creator selects purchase status and course access filters
- **THEN** the system returns the matching contacts and displays the applied filters

##### Example: Concrete acceptance fixture 3

- **GIVEN** C1 owns paid order O1 for course A; C2 owns only course B
- **WHEN** the creator filters paid access to A
- **THEN** the result contains C1 only and displays both applied filters

#### Scenario: A segment rule is invalid

- **WHEN** a creator submits an unsupported field or operator
- **THEN** the system rejects the rule with a validation message and SHALL NOT create a partial segment

##### Example: Concrete acceptance fixture 4

- **GIVEN** W1 has no segment S1
- **WHEN** a rule uses unsupported field arbitrarySecret and operator execute
- **THEN** the rule is rejected and S1 is not saved

### Requirement: Consent and suppression SHALL control outreach eligibility

The system SHALL record consent type, action, source, timestamp, policy version, and evidence. A revoked marketing consent SHALL suppress the affected purpose and channel until an explicit valid re-authorization. Hard-bounce, invalid-address, and complaint suppression SHALL remain an independent deliverability gate.

Consent re-authorization SHALL NOT clear invalid-address, hard-bounce, or complaint suppression by itself. Consent eligibility and channel deliverability SHALL be independently satisfied before delivery. Legacy User-level revocations and deliverability suppressions SHALL remain effective during Contact migration; a legacy positive consent flag SHALL NOT create consent for an unrelated workspace, purpose, or channel. Import, refund, subscription cancellation, and contact merge SHALL NOT manufacture a consent grant or revocation.

#### Scenario: A contact unsubscribes

- **WHEN** a contact uses a valid unsubscribe action
- **THEN** the system records a revocation event and excludes the contact from future marketing sends

##### Example: Concrete acceptance fixture 5

- **GIVEN** C1 has granted email-marketing consent v1
- **WHEN** C1 submits the same valid unsubscribe twice
- **THEN** one effective revocation is retained and all later marketing eligibility checks exclude C1

#### Scenario: A campaign targets suppressed contacts

- **WHEN** a campaign audience includes contacts without valid marketing eligibility
- **THEN** the system excludes those contacts and reports the exclusion count before send

##### Example: Concrete acceptance fixture 6

- **GIVEN** campaign P1 targets C1 eligible, C2 revoked, and C3 hard-bounced
- **WHEN** the creator previews P1 recipients
- **THEN** eligible count is 1, exclusion count is 2, and C2/C3 receive no marketing

### Requirement: Contact imports and exports SHALL be safe and reviewable

The system SHALL validate CSV imports before commit, report row-level errors, deduplicate by configured identity keys, and record who performed the operation. Exports SHALL respect workspace authorization and SHALL exclude fields the requester cannot access.

#### Scenario: An import contains invalid rows

- **WHEN** a creator uploads a CSV containing valid and invalid rows
- **THEN** the system previews accepted, duplicate, and rejected rows before commit

##### Example: Concrete acceptance fixture 7

- **GIVEN** W1 already has learner@example.test; CSV rows contain new@example.test, learner@example.test and invalid-email
- **WHEN** the creator previews the import
- **THEN** the preview shows one accepted, one duplicate, one rejected and writes no rows before commit

#### Scenario: A creator exports a segment

- **WHEN** an authorized creator exports a segment
- **THEN** the system generates a file containing only the segment fields permitted for that workspace

##### Example: Concrete acceptance fixture 8

- **GIVEN** operator U1 can export email and tag in W1 only; W2 contains C9
- **WHEN** U1 exports W1 segment S1
- **THEN** the export contains W1 matches and approved columns only, excludes C9, and records U1 and S1

