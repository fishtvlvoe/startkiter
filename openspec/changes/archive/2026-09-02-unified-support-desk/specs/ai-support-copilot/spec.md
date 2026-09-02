## ADDED Requirements

### Requirement: Webhook signature verification

The system SHALL verify the authenticity of every inbound Chatwoot webhook request before processing it. Since self-hosted Chatwoot's webhook configuration does not support custom headers or HMAC signing, verification SHALL be performed via a shared-secret token embedded in the webhook URL's query string (`?token=<CHATWOOT_WEBHOOK_SECRET>`), compared using a timing-safe equality check.

#### Scenario: Valid webhook token

- **WHEN** `POST /support/webhook/chatwoot` receives a request whose `token` query parameter matches the configured `CHATWOOT_WEBHOOK_SECRET`
- **THEN** the endpoint SHALL process the event and return `200`

#### Scenario: Invalid or missing webhook token

- **WHEN** `POST /support/webhook/chatwoot` receives a request with a missing or mismatching `token` query parameter
- **THEN** the endpoint SHALL return `401` and SHALL NOT process the event or modify any `SupportTicket`

### Requirement: AI auto-reply on new ticket messages

When a new message arrives on a ticket, the AI SHALL attempt to answer directly when it has sufficient confidence, and SHALL otherwise escalate to a human.

#### Scenario: AI answers with sufficient confidence

- **WHEN** the AI evaluates a new buyer message and determines it can answer directly
- **THEN** the system SHALL post the AI-generated reply as a visible message in the Chatwoot conversation

#### Scenario: AI cannot answer confidently

- **WHEN** the AI evaluates a new buyer message and cannot answer with sufficient confidence
- **THEN** the system SHALL mark the conversation for human follow-up (Chatwoot assignment/label) and SHALL NOT post an AI-generated reply to the buyer

#### Scenario: AI model call fails or times out

- **WHEN** the call to the underlying AI model fails or exceeds the configured timeout
- **THEN** the system SHALL leave `SupportTicket.status` unchanged (remaining `OPEN` if it was `OPEN`) and SHALL mark the conversation for human follow-up

### Requirement: Read-only Coolify deployment context

When a ticket is linked to a `BuyerDeployment` managed via Coolify, the AI SHALL pull a read-only status/log summary and attach it as an internal note visible only to the StartKiter team.

#### Scenario: Coolify status pulled successfully

- **WHEN** a new ticket is created for a `BuyerDeployment` with `tier = managed`
- **THEN** the system SHALL call the existing read-only Coolify client from `coolify-managed-deployment`, and SHALL post the returned status/log summary as a Chatwoot internal note

#### Scenario: Coolify API unreachable

- **WHEN** the Coolify API call fails or times out
- **THEN** the system SHALL post an internal note stating the status is temporarily unavailable and SHALL NOT report a false "healthy" or "broken" state

#### Scenario: Ticket has no linked deployment

- **WHEN** a new ticket's `buyerDeploymentId` is null
- **THEN** the system SHALL NOT call the Coolify API and SHALL post an internal note stating "no deployment data, requires manual handling" instead of a status/log summary

#### Scenario: No write operations performed

- **WHEN** the AI processes any ticket linked to a Coolify-managed deployment
- **THEN** the system SHALL NOT call any Coolify API endpoint that creates, modifies, restarts, or redeploys a resource

### Requirement: AI-generated remediation suggestions are advisory only

The AI SHALL generate suggested remediation steps for human engineers, and these suggestions SHALL NOT be automatically executed or sent to the buyer.

#### Scenario: Suggestion posted as internal note

- **WHEN** the AI generates a suggested remediation step after reading the Coolify status/log summary
- **THEN** the system SHALL post the suggestion as a Chatwoot internal note prefixed with an "AI suggestion, unverified" label, visible only to the StartKiter team

#### Scenario: Suggestion never sent to buyer automatically

- **WHEN** an AI-generated remediation suggestion exists for a ticket
- **THEN** the system SHALL NOT include that suggestion text in any message sent to the buyer unless a human engineer manually copies and sends it

#### Scenario: No auto-execution of remediation steps

- **WHEN** an AI-generated remediation suggestion is created
- **THEN** the system SHALL NOT automatically execute the suggested steps against the buyer's deployment; execution SHALL require explicit manual action by a human engineer outside this automated flow

### Requirement: Ticket status transition triggers

The AI's resolved-suggestion behavior SHALL only set `SupportTicket.status` to `AI_SUGGESTED_RESOLVED`; it SHALL NOT set `status` directly to `RESOLVED`.

#### Scenario: AI suggests resolution

- **WHEN** the AI determines that a buyer's issue appears resolved based on the conversation content
- **THEN** the system SHALL set `SupportTicket.status = AI_SUGGESTED_RESOLVED` and SHALL post a confirmation prompt visible to the buyer

#### Scenario: AI does not have authority to fully resolve

- **WHEN** any AI process attempts to set `SupportTicket.status = RESOLVED` directly (bypassing buyer confirmation or the timeout job)
- **THEN** the system SHALL reject that transition; only the buyer-confirmation endpoint or the scheduled timeout job SHALL be permitted to set `status = RESOLVED`
