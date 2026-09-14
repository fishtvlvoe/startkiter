## ADDED Requirements

### Requirement: Authenticated users can open an AI chat window
The system SHALL provide a navigation entry visible to any signed-in user (no admin/operator role required) that opens a chat interface for conversing with the ChatGPT-backed AI assistant.

#### Scenario: Signed-in user finds the AI chat entry in navigation
- **WHEN** a signed-in user with role `user` views the app navigation
- **THEN** an "AI 助手" entry is visible and clicking it opens the chat page

#### Scenario: Signed-out user cannot reach the chat page content
- **WHEN** a signed-out visitor requests the chat page route
- **THEN** the system redirects to login (same behavior as other authenticated-only routes), consistent with the existing `(authenticated)` route group

### Requirement: Chat UI streams responses from the existing /ai/stream endpoint
The system SHALL render assistant responses incrementally as they stream from the existing `/ai/stream` procedure, without introducing a new backend endpoint or changing its authorization.

#### Scenario: User sends a message and sees a streamed reply
- **WHEN** a signed-in user types a message and submits it
- **THEN** the message is sent to `/ai/stream` and the assistant's reply appears incrementally in the message list as stream chunks arrive

#### Scenario: Unauthenticated request to /ai/stream is rejected
- **WHEN** a request to `/ai/stream` is made without a valid session
- **THEN** the existing `protectedProcedure` authorization rejects it (this scenario verifies existing behavior is unchanged, not a new check)

### Requirement: No chat history is persisted
The system SHALL NOT persist chat messages to a database; the chat window holds only the current in-memory session's messages, consistent with the existing `stream-message` procedure's "without storing the chat" behavior.

#### Scenario: Reloading the chat page clears prior messages
- **WHEN** a user has an active chat conversation and reloads the page
- **THEN** no prior messages are restored; the chat window starts empty
