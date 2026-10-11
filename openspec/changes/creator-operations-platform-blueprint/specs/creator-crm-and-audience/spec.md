## Purpose

This capability defines the first-party contact and audience foundation for creator relationships. It supports contacts who do not have accounts and keeps consent, identity linking, segmentation, and activity history auditable.

## ADDED Requirements

### Requirement: A contact SHALL be independent from a user account

The system SHALL create and manage a contact without requiring a StartKiter user account. A contact MAY link to one user account through verified identity evidence, but contact lifecycle operations SHALL NOT delete or disable the user account.

#### Scenario: A visitor submits a creator form

- **WHEN** a visitor submits a valid email or phone number without signing in
- **THEN** the system creates or updates a contact inside the creator workspace

#### Scenario: A contact later creates an account

- **WHEN** a contact verifies an identity that matches an account
- **THEN** the system records an identity link and preserves the contact activity history

### Requirement: Creators SHALL manage tags and deterministic segments

The system SHALL support workspace-scoped tags and saved segments based on deterministic filters over contact attributes, consent, events, purchases, course access, and tags.

#### Scenario: A creator filters paying learners

- **WHEN** a creator selects purchase status and course access filters
- **THEN** the system returns the matching contacts and displays the applied filters

#### Scenario: A segment rule is invalid

- **WHEN** a creator submits an unsupported field or operator
- **THEN** the system rejects the rule with a validation message and SHALL NOT create a partial segment

### Requirement: Consent and suppression SHALL control outreach eligibility

The system SHALL record consent type, action, source, timestamp, policy version, and evidence. A revoked marketing consent or hard bounce SHALL suppress the contact from marketing delivery until an explicit valid re-authorization.

#### Scenario: A contact unsubscribes

- **WHEN** a contact uses a valid unsubscribe action
- **THEN** the system records a revocation event and excludes the contact from future marketing sends

#### Scenario: A campaign targets suppressed contacts

- **WHEN** a campaign audience includes contacts without valid marketing eligibility
- **THEN** the system excludes those contacts and reports the exclusion count before send

### Requirement: Contact imports and exports SHALL be safe and reviewable

The system SHALL validate CSV imports before commit, report row-level errors, deduplicate by configured identity keys, and record who performed the operation. Exports SHALL respect workspace authorization and SHALL exclude fields the requester cannot access.

#### Scenario: An import contains invalid rows

- **WHEN** a creator uploads a CSV containing valid and invalid rows
- **THEN** the system previews accepted, duplicate, and rejected rows before commit

#### Scenario: A creator exports a segment

- **WHEN** an authorized creator exports a segment
- **THEN** the system generates a file containing only the segment fields permitted for that workspace

