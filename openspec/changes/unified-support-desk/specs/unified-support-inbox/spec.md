## ADDED Requirements

### Requirement: Ticket creation from the site-wide support widget

The system SHALL allow any authenticated buyer to open a support ticket from a floating support widget available on every page.

#### Scenario: Buyer opens the widget and sends a message

- **WHEN** an authenticated buyer clicks the floating support widget and submits a message
- **THEN** the system SHALL create a Chatwoot conversation and a corresponding `SupportTicket` record with `channel = WEB_WIDGET` and `status = OPEN`

#### Scenario: Buyer has exactly one BuyerDeployment

- **WHEN** the buyer's account has exactly one `BuyerDeployment` record
- **THEN** the system SHALL set `SupportTicket.buyerDeploymentId` to that deployment automatically without prompting the buyer to choose

#### Scenario: Buyer has multiple BuyerDeployment records

- **WHEN** the buyer's account has more than one `BuyerDeployment` record
- **THEN** the system SHALL require the buyer to select which deployment the ticket concerns before the ticket is created

#### Scenario: Buyer has no BuyerDeployment record

- **WHEN** the buyer's account has zero `BuyerDeployment` records
- **THEN** the system SHALL NOT create a `SupportTicket` through this widget flow and SHALL show a message directing the buyer to the existing email support channel

#### Scenario: Empty message submission

- **WHEN** the buyer submits the widget form with an empty message body
- **THEN** the system SHALL reject the submission client-side and SHALL NOT create a Chatwoot conversation or `SupportTicket`

### Requirement: Ticket creation from the deployment status page

The system SHALL provide a "Report an issue with this deployment" button on the `/deployment` page that pre-fills the associated `BuyerDeployment` context.

#### Scenario: Buyer reports an issue from the deployment page

- **WHEN** an authenticated buyer clicks "Report an issue with this deployment" on `/deployment` and submits a message
- **THEN** the system SHALL create a `SupportTicket` with `buyerDeploymentId` set to the deployment shown on that page, without requiring manual selection

#### Scenario: POST /support/tickets endpoint contract

- **WHEN** the client calls `POST /support/tickets` with `{ buyerDeploymentId?: string, message: string }` while authenticated
- **THEN** the endpoint SHALL return `201` with the created `SupportTicket` id on success, `400` when `message` is empty, `403` when `buyerDeploymentId` does not belong to the authenticated user, and `503` when the Chatwoot API is unreachable

### Requirement: LINE channel ingestion

The system SHALL accept buyer messages sent to the StartKiter LINE Official Account (Messaging Channel) and route them into the same unified inbox as other channels.

#### Scenario: Buyer sends a LINE message

- **WHEN** a buyer sends a message to the LINE Official Account
- **THEN** the system SHALL create or append to a Chatwoot conversation and a `SupportTicket` with `channel = LINE`

#### Scenario: LINE Messaging Channel not configured

- **WHEN** the `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` environment variable is unset
- **THEN** the system SHALL NOT expose the LINE channel as an option in any buyer-facing UI and SHALL NOT attempt to call the LINE Messaging API

#### Scenario: Invalid LINE webhook signature

- **WHEN** an inbound LINE webhook request fails signature verification
- **THEN** the endpoint SHALL return `401` and SHALL NOT create or modify any `SupportTicket`

### Requirement: Telegram channel ingestion

The system SHALL accept buyer messages sent to the StartKiter Telegram Bot and route them into the same unified inbox as other channels.

#### Scenario: Buyer sends a Telegram message

- **WHEN** a buyer sends a message to the Telegram Bot
- **THEN** the system SHALL create or append to a Chatwoot conversation and a `SupportTicket` with `channel = TELEGRAM`

#### Scenario: Telegram Bot not configured

- **WHEN** the `TELEGRAM_BOT_TOKEN` environment variable is unset
- **THEN** the system SHALL NOT expose the Telegram channel as an option in any buyer-facing UI and SHALL NOT attempt to call the Telegram Bot API

#### Scenario: Invalid Telegram webhook secret

- **WHEN** an inbound Telegram webhook request does not include the configured secret token
- **THEN** the endpoint SHALL return `401` and SHALL NOT create or modify any `SupportTicket`

### Requirement: Ticket-to-deployment linkage

Every `SupportTicket` SHALL be linked to exactly one `BuyerDeployment` via a required foreign key.

#### Scenario: Database constraint enforcement

- **WHEN** the system attempts to insert a `SupportTicket` row without a `buyerDeploymentId`
- **THEN** the database SHALL reject the insert due to the `NOT NULL` foreign key constraint

#### Scenario: Chatwoot conversation deduplication

- **WHEN** a Chatwoot webhook reports a `message_created` event for a `chatwootConversationId` that already has a matching `SupportTicket`
- **THEN** the system SHALL update the existing `SupportTicket` instead of creating a duplicate row, keyed by the unique `chatwootConversationId`

### Requirement: Hybrid resolved-confirmation workflow

The system SHALL NOT close a ticket automatically the moment the AI determines the issue looks resolved. It SHALL wait for buyer confirmation or a timeout.

#### Scenario: AI marks a ticket as suggested-resolved

- **WHEN** the AI determines a conversation appears resolved
- **THEN** the system SHALL set `SupportTicket.status = AI_SUGGESTED_RESOLVED` and `aiSuggestedResolvedAt` to the current timestamp, and SHALL NOT set `status = RESOLVED`

#### Scenario: Buyer confirms resolution

- **WHEN** the buyer calls `POST /support/tickets/:id/confirm-resolved` while `status = AI_SUGGESTED_RESOLVED`
- **THEN** the system SHALL set `status = RESOLVED` and `resolvedBy = BUYER_CONFIRMED` and `resolvedAt` to the current timestamp

#### Scenario: Timeout auto-close

- **WHEN** a ticket has `status = AI_SUGGESTED_RESOLVED` and `aiSuggestedResolvedAt` is more than 3 days in the past with no buyer reply
- **THEN** a scheduled job SHALL set `status = RESOLVED` and `resolvedBy = AUTO_TIMEOUT`

#### Scenario: Buyer replies during the waiting window

- **WHEN** the buyer sends a new message on a ticket with `status = AI_SUGGESTED_RESOLVED` before confirmation or timeout
- **THEN** the system SHALL set `status = OPEN` and clear `aiSuggestedResolvedAt`

#### Scenario: Confirm-resolved called on a non-pending ticket

- **WHEN** `POST /support/tickets/:id/confirm-resolved` is called while `status` is `OPEN`, `RESOLVED`, or `ESCALATED`
- **THEN** the endpoint SHALL return `409` and SHALL NOT change the ticket status
