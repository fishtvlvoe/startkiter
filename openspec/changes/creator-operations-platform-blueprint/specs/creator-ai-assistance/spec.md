## Purpose

This capability defines AI assistance for creator operations under the same workspace, permission, consent, and audit boundaries as deterministic platform workflows. It allows AI to draft and explain work while keeping financial, access, publishing, and external communication decisions reviewable.

## ADDED Requirements

### Requirement: AI SHALL operate within the actor's workspace permissions

Every AI request SHALL execute with an authenticated actor, selected workspace, and explicit capability scope. Retrieval and tool calls SHALL enforce the actor's existing permission and data-owner boundaries and SHALL NOT use another workspace's records as context.

#### Scenario: An actor requests a summary from an authorized workspace

- **WHEN** an actor requests an AI summary for records they can read in the selected workspace
- **THEN** the system limits retrieval to those records and identifies the workspace scope of the response

##### Example: Concrete acceptance fixture 1

- **GIVEN** U1 can read W1 registrations R1/R2 and cannot read W2 R9
- **WHEN** U1 requests an attendance summary in W1
- **THEN** only R1/R2 are retrieved and output names W1 as its scope

#### Scenario: An actor requests another workspace's data

- **WHEN** an actor requests records outside their workspace or capability scope
- **THEN** the system denies that retrieval and does not reveal whether matching records exist

##### Example: Concrete acceptance fixture 2

- **GIVEN** U1 has no membership or read capability in W2
- **WHEN** U1 asks for W2 contacts
- **THEN** retrieval is denied without revealing record existence or values

### Requirement: AI-generated external and consequential actions SHALL require human review

AI SHALL NOT independently send marketing messages, publish pages or recordings, change prices, issue refunds, create invoices, grant or revoke entitlements, or alter consent. The system SHALL present generated drafts and proposed changes with their target, affected records, and deterministic validation results before an authorized human confirms execution.

#### Scenario: AI drafts a webinar follow-up message

- **WHEN** AI creates a follow-up draft from an authorized webinar summary
- **THEN** the draft remains unsent until an authorized creator reviews the audience, content, consent eligibility, and send time and confirms delivery

##### Example: Concrete acceptance fixture 3

- **GIVEN** authorized L1 attendance source is available and AI generates draft D1
- **WHEN** D1 is shown to the creator
- **THEN** D1 stays unsent; preview contains audience/content/consent/send-time and requires authorized confirmation

#### Scenario: AI proposes a refund or entitlement change

- **WHEN** AI suggests a refund or access change
- **THEN** the system presents the proposal for human review and leaves payment and entitlement state unchanged

##### Example: Concrete acceptance fixture 4

- **GIVEN** O1 paid state grants Course A and AI suggests refund F1
- **WHEN** F1 is generated
- **THEN** O1 and A entitlement remain unchanged pending human approval and deterministic validation

### Requirement: AI outputs SHALL preserve source and decision provenance

The system SHALL record the actor, workspace, capability, source record references, prompt or workflow version, provider and model identity when available, generated artifact, review decision, and resulting action reference. Secrets and unnecessary personal data SHALL be excluded or redacted from retained records.

#### Scenario: A creator reviews an AI-generated attendance summary

- **WHEN** the creator opens an AI-generated webinar summary
- **THEN** the system links the summary to the authorized attendance and transcript sources, displays its generation and review state, and preserves the human approval record

##### Example: Concrete acceptance fixture 5

- **GIVEN** summary D1 references allowed attendance R1 and transcript T1
- **WHEN** U1 reviews and approves D1
- **THEN** D1 shows source links and generation/review state with U1 decision reference

#### Scenario: A sensitive source is outside the AI data policy

- **WHEN** a requested source is not approved for the selected AI workflow
- **THEN** the system excludes that source and explains the restriction without silently sending it to the provider

##### Example: Concrete acceptance fixture 6

- **GIVEN** T1 contains a data category excluded by the selected model workflow policy
- **WHEN** the AI workflow requests T1
- **THEN** T1 is excluded with explanation and no T1 payload reaches the provider

### Requirement: Creator AI assistance SHALL remain separate from buyer CodePackage development agents

Creator-side AI context, tools, credentials, and audit records SHALL remain separate from buyer-owned CodePackage repositories and their development agents. Buyer project instructions and skills SHALL be versioned with the CodePackage and SHALL operate only on the buyer's authorized project files and deployment targets.

#### Scenario: A creator uses an AI operations assistant

- **WHEN** an authorized creator requests a CRM, campaign, analytics, or webinar operation
- **THEN** the system uses creator workspace tools and does not expose buyer repository contents, credentials, or downstream customer data

##### Example: Concrete acceptance fixture 7

- **GIVEN** creator U1 asks for W1 CRM summary and buyer repo B1 has downstream records
- **WHEN** the creator assistant retrieves context
- **THEN** only W1 creator tools run and B1 code, credentials and downstream data are absent

#### Scenario: A buyer uses Codex CLI or Claude Desktop Code mode

- **WHEN** a buyer asks a supported code assistant to install, modify, test, deploy, or update the buyer's CodePackage project
- **THEN** the assistant follows the versioned buyer project instructions and does not call StartKiter creator-side tools with buyer downstream data

##### Example: Concrete acceptance fixture 8

- **GIVEN** buyer B1 project version 2 has compatible local Skill and its own deployment X1
- **WHEN** B1 asks a supported desktop Code agent to modify X1
- **THEN** the agent uses versioned B1 instructions and sends no downstream records to creator-side tools

