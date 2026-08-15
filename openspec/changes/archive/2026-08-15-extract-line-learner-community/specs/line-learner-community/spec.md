## MODIFIED Requirements

### Requirement: Paid learners see a LINE community join control

After a paid MVP order (sku startkiter-mvp with Order.courseAccess true), the course area SHALL show a join control for the configured LINE community invite URL. The URL SHALL come from environment configuration `LINE_COMMUNITY_INVITE_URL` in this change. This community is a peer discussion group for paid StartKiter learners. It MUST NOT be described as customer support. It MUST NOT be implemented as LINE Login for the take-home SaaS. It MUST NOT silently add users to a group.

#### Scenario: Paid user can fetch the invite URL

- **WHEN** a user with Order.courseAccess true for sku startkiter-mvp calls GET /api/community/line-invite
- **THEN** the response MUST be HTTP 200 and the JSON body MUST include inviteUrl as a non-empty https URL

##### Example: 付費學員取得邀請

- userId=user_paid、courseAccess=true、LINE_COMMUNITY_INVITE_URL=https://line.me/ti/g/example
- GET /api/community/line-invite → 200 `{ "inviteUrl": "https://line.me/ti/g/example" }`

#### Scenario: Unpaid user cannot fetch the invite URL

- **WHEN** a signed-in user with no Order.courseAccess true for sku startkiter-mvp calls GET /api/community/line-invite
- **THEN** the response MUST be HTTP 403 and the body MUST NOT include inviteUrl

##### Example: 未付費

- userId=user_free 無 courseAccess
- GET → 403，JSON 無 inviteUrl

#### Scenario: Unauthenticated request is rejected

- **WHEN** GET /api/community/line-invite is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Missing invite configuration fails closed

- **WHEN** a paid user calls GET /api/community/line-invite and no invite URL is configured or the value is not https
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

##### Example: 未設 env

- courseAccess=true、LINE_COMMUNITY_INVITE_URL 空
- GET → 503
