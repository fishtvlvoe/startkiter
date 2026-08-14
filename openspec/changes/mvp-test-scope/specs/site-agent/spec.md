## ADDED Requirements

### Requirement: Conversation can use configured model providers

The site-agent module SHALL send learner messages to one configured provider among Gemini, OpenAI, and Claude. Missing provider keys MUST fail closed.

#### Scenario: Chat with a configured provider

- **WHEN** a signed-in user posts POST /api/agent/chat with a non-empty message and a provider key is present
- **THEN** the response MUST be HTTP 200 and MUST include an assistant message

#### Scenario: Empty message is rejected

- **WHEN** POST /api/agent/chat is called with an empty string message
- **THEN** the response MUST be HTTP 400

#### Scenario: Unconfigured provider fails closed

- **WHEN** POST /api/agent/chat is called and no provider key is configured
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

### Requirement: V1 tools are read-only self-scoped

The agent tool registry SHALL contain exactly two tools in MVP: get_my_orders and get_my_course_progress. Both MUST read only the authenticated user's data. Write tools MUST NOT be registered.

#### Scenario: Orders tool returns only the caller

- **WHEN** get_my_orders runs for user A
- **THEN** the tool result MUST include only user A's orders and MUST NOT include another user's orders

##### Example: user A 只看到自己的訂單

- user_alice_001（alice@example.com）有訂單 order_id=ord_1001
- user_bob_002（bob@example.com）有訂單 order_id=ord_2002
- get_my_orders 以 user_alice_001 身分執行 → 只回傳 [ord_1001]，不含 ord_2002

#### Scenario: Progress tool returns only the caller

- **WHEN** get_my_course_progress runs for user A
- **THEN** the tool result MUST include only user A's lesson progress

##### Example: user A 只看到自己的課程進度

- user_alice_001 完成 lesson_02（狀態 completed）
- user_bob_002 完成 lesson_05（狀態 completed）
- get_my_course_progress 以 user_alice_001 身分執行 → 只回傳 alice 的 lesson_02 進度，不含 bob 的 lesson_05

#### Scenario: Unauthenticated tool call is rejected

- **WHEN** a tool call is attempted without a session
- **THEN** the agent MUST refuse the tool and MUST NOT query orders or course_progress

##### Example: 未登入訪客呼叫工具被拒絕

- 訪客未攜帶 session cookie，直接觸發 get_my_orders 工具呼叫
- agent 拒絕執行該工具，且不對 orders 或 course_progress 資料表發出任何查詢

#### Scenario: Unknown tool is rejected

- **WHEN** the model requests a tool other than get_my_orders or get_my_course_progress
- **THEN** the server MUST reject that tool call and MUST NOT execute it

##### Example: 模型嘗試呼叫未註冊工具

- 模型輸出 tool call 要求執行 delete_user_account
- 伺服器比對工具白名單（僅 get_my_orders、get_my_course_progress）→ 拒絕該 tool call，不執行任何動作
