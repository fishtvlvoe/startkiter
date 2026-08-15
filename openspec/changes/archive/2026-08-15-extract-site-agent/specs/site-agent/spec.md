## MODIFIED Requirements

### Requirement: Conversation can use configured model providers

The site-agent module SHALL send learner messages to one configured provider among Gemini, OpenAI, and Claude (Anthropic). Missing provider keys MUST fail closed with HTTP 503 on chat. Unauthenticated requests MUST NOT reach any provider.

#### Scenario: Chat with a configured provider

- **WHEN** a signed-in user posts POST /api/agent/chat with a non-empty message and a provider key is present
- **THEN** the response MUST be HTTP 200 and MUST include an assistant message

##### Example: OpenAI key 存在

- OPENAI_API_KEY 已設、user 已登入、message="你好"
- POST /api/agent/chat → 200 含 assistantMessage

#### Scenario: Empty message is rejected

- **WHEN** POST /api/agent/chat is called with an empty string message
- **THEN** the response MUST be HTTP 400

#### Scenario: Unconfigured provider fails closed

- **WHEN** POST /api/agent/chat is called and no provider key is configured
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

#### Scenario: Unauthenticated chat is rejected

- **WHEN** POST /api/agent/chat is called without a session
- **THEN** the response MUST be HTTP 401 and no provider MUST be called

##### Example: 未登入呼叫 chat

- 請求無 session cookie，message="你好"
- POST /api/agent/chat → 401，測試 spy 記錄 provider 呼叫零次

### Requirement: V1 tools are read-only self-scoped

The agent tool registry SHALL contain exactly two tools in MVP: get_my_orders and get_my_course_progress. Both MUST read only the authenticated user's data. Write tools MUST NOT be registered.

#### Scenario: Orders tool returns only the caller

- **WHEN** get_my_orders runs for user A
- **THEN** the tool result MUST include only user A's orders and MUST NOT include another user's orders

#### Scenario: Progress tool returns only the caller

- **WHEN** get_my_course_progress runs for user A
- **THEN** the tool result MUST include only user A's lesson progress (or not_tracked entries scoped to user A)

#### Scenario: Unauthenticated tool call is rejected

- **WHEN** a tool call is attempted without a session
- **THEN** the agent MUST refuse the tool and MUST NOT query orders or course_progress

#### Scenario: Unknown tool is rejected

- **WHEN** the model requests a tool other than get_my_orders or get_my_course_progress
- **THEN** the server MUST reject that tool call and MUST NOT execute it
