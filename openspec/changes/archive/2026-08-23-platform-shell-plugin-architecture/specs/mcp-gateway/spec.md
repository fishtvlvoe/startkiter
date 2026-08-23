## ADDED Requirements

### Requirement: MCP endpoint is reachable at a fixed path
The server SHALL expose an MCP-protocol-compliant endpoint at `GET/POST /api/mcp`. External MCP clients (e.g. Claude Desktop, IDEs, other agents) configuring this fixed path MUST be able to complete the MCP handshake without any per-client URL variation.

#### Scenario: Handshake succeeds with a valid session
- **WHEN** an external MCP client sends an initialize request to `/api/mcp` with a valid Better Auth session cookie
- **THEN** the server MUST respond with HTTP 200 and a JSON body including `serverInfo` and `capabilities` fields

#### Scenario: Handshake without session redirects to authorization
- **WHEN** an external MCP client sends an initialize request to `/api/mcp` without a valid session
- **THEN** the server MUST respond in a way that directs the client to the existing Better Auth login/authorization flow, and MUST NOT establish an MCP session

### Requirement: MCP Gateway authorizes via OAuth-style session flow, not API keys
The MCP Gateway SHALL reuse the existing Better Auth session mechanism for authorization. The system MUST NOT require a user to generate, copy, or paste an API key to connect an external MCP client.

#### Scenario: Connecting a client does not surface an API key
- **WHEN** a signed-in user completes the MCP authorization flow for an external client
- **THEN** no API key string MUST be displayed to the user as part of completing the connection

### Requirement: Successful authorization creates a revocable connection record
On successful MCP authorization, the server SHALL create an `McpConnection` record with `userId`, `clientName`, and `authorizedAt`. The user MUST be able to view all their `McpConnection` records and revoke any of them individually.

#### Scenario: Authorization creates a connection record
- **WHEN** a signed-in user completes MCP authorization for a client identifying itself as "Claude"
- **THEN** an `McpConnection` row MUST exist with that user's `userId`, `clientName: "Claude"`, and a non-null `authorizedAt`

#### Scenario: User views their connection list
- **WHEN** a signed-in user requests `GET /api/mcp/connections`
- **THEN** the response MUST include every non-revoked `McpConnection` row belonging to that user, and MUST NOT include another user's connections

#### Scenario: User revokes a connection
- **WHEN** a signed-in user sends `DELETE /api/mcp/connections/:id` for a connection they own
- **THEN** the server MUST set `revokedAt` on that record, MUST return HTTP 200, and a subsequent `GET /api/mcp/connections` MUST NOT list that connection

#### Scenario: User cannot revoke another user's connection
- **WHEN** a signed-in user sends `DELETE /api/mcp/connections/:id` for a connection owned by a different user
- **THEN** the server MUST return HTTP 404 and MUST NOT modify the `McpConnection` record

### Requirement: MCP Gateway exposes read-only operations only
The MCP Gateway's v1 tool surface SHALL be limited to read-only operations scoped to the requesting user's own data, matching the scope already granted to the two existing site-agent read-only tools. The Gateway MUST NOT register any write, delete, or mutating tool in v1.

#### Scenario: Read-only tool call succeeds
- **WHEN** an authorized external client calls a registered read tool scoped to the connected user's own course progress
- **THEN** the server MUST return the requested data without mutating any record

#### Scenario: Write-style tool call is rejected
- **WHEN** an authorized external client attempts to invoke a tool that would create, update, or delete a record
- **THEN** the server MUST return an MCP protocol error indicating the tool is not available, and MUST NOT perform the mutation

### Requirement: MCP Gateway fails closed when auth configuration is missing
When `DATABASE_URL` or `BETTER_AUTH_SECRET` is not configured, the MCP Gateway endpoints SHALL return HTTP 503 for every request, matching the existing fail-closed behavior of `packages/auth`. The endpoints MUST NOT return HTTP 500 in this case.

#### Scenario: Missing auth secret returns 503
- **WHEN** `BETTER_AUTH_SECRET` is unset and a client sends any request to `/api/mcp`
- **THEN** the server MUST return HTTP 503 and MUST NOT return HTTP 500
