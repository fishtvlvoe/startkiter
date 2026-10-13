## Purpose

This capability defines live events and evergreen webinars as separate creator workflows. It connects registration, attendance, replay, offers, CRM, automation, analytics, and replaceable video providers without treating video transport as a purchase entitlement.

## ADDED Requirements

### Requirement: Creator webinars SHALL distinguish live events from evergreen webinars

The system SHALL model a live event and an evergreen webinar as distinct delivery modes with separate scheduling, playback, attendance, replay, and lifecycle states. A webinar record SHALL identify its workspace, owner, delivery mode, registration policy, schedule policy, content source, and publication state. Schedule/access policy SHALL remain independent from delivery mode and media provider; choosing an immediate, scheduled, or always-available access pattern MUST NOT change a live event into a prerecorded evergreen webinar.

#### Scenario: A creator configures a live event and an evergreen webinar

- **WHEN** a creator chooses the delivery mode for a webinar
- **THEN** the system presents the matching schedule, provider, replay, and attendee settings without labeling a prerecorded session as a live broadcast

##### Example: Concrete acceptance fixture 1

- **GIVEN** W1 has draft event L1 and prerecorded event E1
- **WHEN** the creator selects live for L1 and evergreen for E1
- **THEN** L1 shows live provider/session controls and E1 uses its prerecorded source without relabeling E1 as live

#### Scenario: A creator opens a webinar that is still a draft

- **WHEN** a creator opens an unpublished webinar
- **THEN** the system shows its draft state and does not expose a public registration or attendee URL

##### Example: Concrete acceptance fixture 2

- **GIVEN** L1 is an unpublished draft
- **WHEN** the creator opens L1
- **THEN** draft state is visible and no public registration/join URL is issued

#### Scenario: A creator selects a scheduled live event

- **WHEN** an authorized creator schedules a live event and selects an active media provider
- **THEN** the system retains the live delivery mode, the scheduled access policy, and the provider as separate values without treating the event as prerecorded evergreen content

##### Example: Concrete acceptance fixture 3

- **GIVEN** L1 deliveryMode is live, scheduled time is 2026-11-01 19:30 Asia/Taipei, adapter P1 is active
- **WHEN** the schedule is saved
- **THEN** live mode, scheduled access and P1 adapter identity remain three independent values

### Requirement: Live streaming SHALL use an explicit provider adapter

The system SHALL deliver live video through an explicitly configured provider adapter. StartKiter SHALL store provider identifiers, sanitized join references, recording state, webhook references, and normalized session outcomes; it SHALL NOT claim to provide native video transport when the configured provider owns that transport.

#### Scenario: A live event is published with a configured provider

- **WHEN** an authorized creator publishes a valid live event with an active provider connection
- **THEN** the system records the provider session reference, creator join route, attendee join route, scheduled state, and provider configuration version

##### Example: Concrete acceptance fixture 4

- **GIVEN** L1 valid schedule and provider connection P1 version V1 are configured
- **WHEN** authorized creator publishes L1
- **THEN** provider session S1 and creator/attendee routes are recorded with V1 and scheduled state

#### Scenario: A live provider is unavailable

- **WHEN** a creator publishes a live event without a valid provider connection
- **THEN** the system refuses publication and explains the missing provider setup without issuing a false attendee join link

##### Example: Concrete acceptance fixture 5

- **GIVEN** L1 is draft and provider P1 is disconnected
- **WHEN** the creator attempts publication
- **THEN** L1 remains unpublished with setup error and no fabricated attendee join URL

#### Scenario: A provider sends a duplicate session event

- **WHEN** a provider webhook repeats a session or attendance event with the same provider event identity
- **THEN** the system acknowledges the duplicate without duplicating attendance, replay, or analytics records

##### Example: Concrete acceptance fixture 6

- **GIVEN** provider event H1 for S1/C1 attendance has been stored
- **WHEN** H1 is delivered again
- **THEN** one attendance outcome and one corresponding normalized event remain

### Requirement: Webinar registration and attendance SHALL integrate with CRM, offers, and automation

The system SHALL represent registration, attendance, no-show, and replay activity as workspace-scoped domain events linked to a Contact and webinar. Registration SHALL record applicable consent and SHALL NOT by itself grant Course, Bundle, or CodePackage access. Paid access SHALL depend on a successful Order and its explicit Offer entitlement mapping.

#### Scenario: A visitor registers for a free webinar

- **WHEN** a visitor submits a valid free-webinar registration
- **THEN** the system creates or updates the Contact, records the registration event and applicable consent, and grants no unrelated product entitlement

##### Example: Concrete acceptance fixture 7

- **GIVEN** visitor C1 registers for free event L1 in W1
- **WHEN** valid registration and applicable consent are submitted
- **THEN** C1 and registration R1 are stored, with no Course/Bundle/CodePackage grant

#### Scenario: A paid webinar attendee completes checkout

- **WHEN** a registered Contact completes payment for an Offer that grants webinar or course access
- **THEN** the system links the paid Order to the registration and grants only the entitlements declared by that Offer

##### Example: Concrete acceptance fixture 8

- **GIVEN** R1 links C1 to L1; paid Offer P1 grants L1 only
- **WHEN** C1 pays Order O1 for P1
- **THEN** O1 links to R1 and grants L1, with no unrelated Course or CodePackage

#### Scenario: A reminder workflow reaches a contact without marketing consent

- **WHEN** an automation attempts to send a marketing reminder to a registered Contact without the required consent
- **THEN** the system suppresses that message and records the reason while preserving necessary transactional event state

##### Example: Concrete acceptance fixture 9

- **GIVEN** C1 registered for L1 but lacks email-marketing consent
- **WHEN** a marketing reminder step targets C1
- **THEN** the message is suppressed with consent reason while registration remains recorded

### Requirement: Webinar session outcomes SHALL feed replay, analytics, and operations

The system SHALL normalize provider outcomes into scheduled, started, ended, canceled, recording-pending, replay-ready, failed, attended, and no-show states where applicable. The system SHALL expose the source, freshness, and failure reason for session and attendance data.

#### Scenario: A recording becomes available after a live event

- **WHEN** the provider confirms that an event recording is ready
- **THEN** the system records a replay-ready event, links the recording through the configured media policy, and makes the replay eligible for the creator's review and publication

##### Example: Concrete acceptance fixture 10

- **GIVEN** L1 ended and provider confirms recording media M1 ready
- **WHEN** recording event H2 is processed
- **THEN** replay-ready is stored with M1 policy and creator review required before publication

#### Scenario: Attendance data is delayed

- **WHEN** the provider has not delivered complete attendance data by the reporting deadline
- **THEN** the system marks attendance as pending or incomplete and does not report missing records as confirmed no-shows

##### Example: Concrete acceptance fixture 11

- **GIVEN** attendance reporting deadline passed and P1 data is incomplete
- **WHEN** the creator opens L1 attendance
- **THEN** pending/incomplete state and source freshness appear; missing C1 is not labeled no-show

### Requirement: Webinar analytics and registrant review SHALL use explicit filters

The system SHALL scope analytics and registrant queries to the actor's workspace and support Webinar, session, and event filters where those dimensions apply. Registrant review SHALL map active registration, attendance, replay, or purchase segments only to explicit StartKiter Contact and normalized domain-event semantics. Exports SHALL use the same filter and permission scope as the displayed result. Empty results SHALL be distinguishable from loading, provider delay, and query failure, and an empty result SHALL NOT be interpreted as confirmed no-shows.

#### Scenario: A creator filters webinar analytics

- **WHEN** an authorized creator selects a Webinar and optionally narrows the view by session and event
- **THEN** the analytics result and any export use that same workspace-scoped filter, with a distinct empty state when no records match

##### Example: Concrete acceptance fixture 12

- **GIVEN** W1 has L1 sessions S1/S2 and W2 has event L9
- **WHEN** the creator filters L1/S1/attendance and exports
- **THEN** both view and export include only that W1 filter, not S2 or L9

#### Scenario: A creator reviews registrants by session outcomes

- **WHEN** an authorized creator filters registrants by attendance, replay, or purchase behavior
- **THEN** the system returns only Contacts linked to the selected Webinar/session and matching normalized outcomes, without exposing another workspace's records

##### Example: Concrete acceptance fixture 13

- **GIVEN** C1 attended L1/S1; C2 only watched replay; C9 is in W2
- **WHEN** the creator filters attended contacts for L1/S1
- **THEN** only C1 matches, C2 is excluded and C9 is not exposed

#### Scenario: A registrant query has no entries

- **WHEN** no registrants match the selected Webinar/session/event filters
- **THEN** the system displays an explicit empty state and does not infer a no-show, failed registration, or missing consent

##### Example: Concrete acceptance fixture 14

- **GIVEN** filter L1/S1/purchase has no matching registrations
- **WHEN** the creator runs the query
- **THEN** explicit empty results appear without inferring no-show or absence of consent

### Requirement: A creator SHALL manage webinar lifecycle safely

The system SHALL provide a workspace-scoped webinar list and a guided create/edit flow for authorized creators. The list SHALL make delivery mode, lifecycle state, schedule, and available operational actions distinguishable. The system SHALL support a full path for custom settings; if a quick path with safe defaults is exposed, both paths SHALL enforce the same permission, consent, offer, and provider validation. Webinar activity SHALL expose an auditable operational history without exposing provider secrets.

Cloning SHALL create a new draft from reusable configuration only. It SHALL NOT copy registrations, attendance, orders, entitlements, provider secrets, or provider session references. Removing a webinar with related business or audit records SHALL withdraw it from public registration and preserve those records through an auditable archive state rather than deleting their history.

#### Scenario: A creator chooses a guided setup path

- **WHEN** an authorized creator starts creating a webinar
- **THEN** the system offers a quick-default or full-custom setup path and validates both paths against the same delivery, consent, offer, and provider rules before publication

##### Example: Concrete acceptance fixture 15

- **GIVEN** creator U1 can create W1 webinar and live provider is absent
- **WHEN** U1 uses either quick or full setup then attempts live publication
- **THEN** both paths enforce the same provider/consent/Offer rules and refuse invalid publication

#### Scenario: A creator clones a webinar

- **WHEN** an authorized creator clones an existing webinar
- **THEN** the system creates an unpublished draft with reusable configuration only and no inherited registrations, attendance, orders, entitlements, provider secrets, or session references

##### Example: Concrete acceptance fixture 16

- **GIVEN** L1 has registration R1, order O1 and provider session S1
- **WHEN** the creator clones L1
- **THEN** new draft L2 copies reusable configuration but not R1/O1/S1 or secrets

#### Scenario: A creator removes a webinar with history

- **WHEN** an authorized creator removes a webinar associated with registrations, attendance, orders, or audit records
- **THEN** the system stops public registration, preserves linked business history, and records the actor and removal reason in the audit history

##### Example: Concrete acceptance fixture 17

- **GIVEN** L1 has registrations, orders and audit entries
- **WHEN** authorized creator archives L1 with reason retired
- **THEN** public registration stops and linked history plus actor/reason remain auditable

#### Scenario: A creator reviews webinar operations

- **WHEN** an authorized creator opens a webinar's operational history
- **THEN** the system shows time-ordered lifecycle and provider outcomes with source, actor where available, and actionable failure details while redacting secrets

##### Example: Concrete acceptance fixture 18

- **GIVEN** L1 history contains scheduled H1, failed provider call H2 and replay-ready H3
- **WHEN** the creator opens operational history
- **THEN** the ordered timeline shows source and actionable H2 reason while raw provider credentials are absent

