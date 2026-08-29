# lesson-tool-embed Specification

## Purpose

TBD - created by archiving change 'lesson-tool-embed'. Update Purpose after archive.

## Requirements

### Requirement: Instructor can configure an embedded tool for a lesson
The system SHALL allow an instructor or operator with management permission over a course to set an optional `toolUrl` and `toolTitle` on a `Lesson` record.

#### Scenario: Instructor with course management permission saves a tool URL
- **WHEN** an instructor who can manage the course calls the tool config API with a valid public `toolUrl` and `toolTitle`
- **THEN** the system SHALL persist both fields on the `Lesson` record and return the updated values

#### Scenario: Non-manager cannot configure a tool
- **WHEN** a user without management permission over the course calls the tool config API
- **THEN** the system SHALL respond with HTTP 403 and SHALL NOT modify the `Lesson` record

---
### Requirement: Tool URL must not resolve to a private or local address
The system SHALL reject a `toolUrl` whose hostname resolves to localhost, loopback, RFC1918 private ranges, or the 169.254.0.0/16 link-local range, both when the instructor saves it and each time a token is issued for it.

#### Scenario: Save is rejected for a private-range URL
- **WHEN** an instructor submits a `toolUrl` with hostname `localhost`, `127.0.0.1`, `10.1.2.3`, `192.168.1.1`, or `169.254.169.254`
- **THEN** the system SHALL reject the request with HTTP 400 and error code `TOOL_URL_PRIVATE`, and SHALL NOT persist the value

##### Example: hostname classification
| Hostname | Classified as private/local |
| --- | --- |
| `localhost` | true |
| `127.0.0.1` | true |
| `10.1.2.3` | true |
| `192.168.1.1` | true |
| `169.254.169.254` | true |
| `tools.example.com` | false |

#### Scenario: Re-check happens at token issuance time, not only at save time
- **WHEN** a token is issued for a lesson whose stored `toolUrl` currently resolves to a private-range address (even if it did not at save time)
- **THEN** the system SHALL refuse to issue the token and SHALL NOT embed the tool

---
### Requirement: Learner accesses the embedded tool through a short-lived signed token
The system SHALL sign a lesson-tool access token bound to the specific `lessonId` and `userId`, valid for 2 hours, using the existing HMAC-SHA256 signing convention, and SHALL verify this token before serving the embedded tool or the new-tab entry page.

#### Scenario: Valid token within TTL is accepted
- **WHEN** a request presents a token signed for the requesting `lessonId` and `userId` within 2 hours of issuance
- **THEN** the system SHALL accept the token and SHALL serve the tool embed

#### Scenario: Expired, tampered, or mismatched token is rejected
- **WHEN** a request presents a token that is older than 2 hours, has a tampered payload, or was signed for a different `lessonId` or `userId`
- **THEN** the system SHALL reject the token and SHALL NOT serve the tool embed

---
### Requirement: New-tab entry page re-validates course access on every load
The system SHALL re-run the existing course access check (enrollment or instructor scope) every time the `/lesson-tool/[lessonId]/[encodedOrigin]` page loads, regardless of token validity, and SHALL NOT cache a prior access result.

#### Scenario: Access revoked after link was shared
- **WHEN** a user who previously had course access (now revoked, e.g. after a refund) opens a previously valid lesson-tool link within the token's TTL
- **THEN** the system SHALL respond with HTTP 404 and SHALL NOT reveal whether the lesson exists

#### Scenario: Currently-enrolled user opens the link
- **WHEN** a user with current, valid course access opens the lesson-tool link with a non-expired token
- **THEN** the system SHALL render the sandboxed tool embed

---
### Requirement: Embedded tool renders in a sandboxed iframe alongside lesson content
The system SHALL render a configured lesson's tool in an iframe with `sandbox="allow-scripts allow-forms allow-popups allow-downloads"`, displayed alongside the existing video and content areas on the lesson player.

#### Scenario: Lesson with a configured tool shows the embed
- **WHEN** a learner with valid access views a lesson that has `toolUrl` set
- **THEN** the player SHALL display a sandboxed iframe with the configured `toolTitle`, in addition to any existing video and text content

#### Scenario: Lesson without a configured tool shows no embed
- **WHEN** a learner views a lesson with no `toolUrl` set
- **THEN** the player SHALL NOT render any tool embed area
