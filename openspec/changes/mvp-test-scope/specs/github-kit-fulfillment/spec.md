## ADDED Requirements

### Requirement: In-site GitHub claim after payment

A user with a paid MVP order SHALL claim kit access from the course site by signing in with GitHub. The system SHALL invite that GitHub account to the configured organization private repository with pull permission. Manual operator invites MUST NOT be required for the happy path.

#### Scenario: Paid user claims successfully

- **WHEN** a paid user completes GitHub OAuth and GET /api/github/claim runs
- **THEN** the response MUST be HTTP 200 and a github_kit_grants row MUST exist with permission pull

#### Scenario: Unauthenticated claim is rejected

- **WHEN** GET /api/github/claim is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Unpaid claim is rejected

- **WHEN** a signed-in user with no paid MVP order calls GET /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub API MUST NOT be called to add a collaborator

### Requirement: Invite is read-only on an organization repository

Kit access SHALL use an organization-owned private repository. The granted GitHub role MUST be pull. Personal-account repositories MUST NOT be used for kit delivery.

#### Scenario: Grant permission is pull

- **WHEN** a kit grant is written
- **THEN** permission MUST equal pull and MUST NOT equal push, maintain, or admin

##### Example: 寫入 pull-only 授權紀錄

- 使用者 bob@example.com（GitHub 帳號 bob-dev）完成 MVP 付款並通過 GitHub OAuth
- 系統寫入 github_kit_grants: user_id=usr_1001, github_login=bob-dev, repo=org/startkiter-private-kit, permission=pull

#### Scenario: GitHub API failure stays unclaimed

- **WHEN** GitHub returns an error while adding the collaborator
- **THEN** GET /api/github/claim MUST return HTTP 502 and MUST NOT mark the grant accepted

### Requirement: Learner still accepts the GitHub invitation

The product SHALL tell the learner to accept the GitHub invitation. The system MUST NOT treat the kit as fully delivered until GitHub reports the collaborator is active or accepted_at is set.

#### Scenario: Invite pending is visible

- **WHEN** GitHub has been invited but the learner has not accepted
- **THEN** the claim page MUST show a pending-accept state and MUST NOT claim that clone already works

##### Example: 邀請已送出但尚未接受

- 系統已對 GitHub 帳號 carol-lin 送出 org/startkiter-private-kit 的 collaborator 邀請，accepted_at 為 null
- carol-lin 打開 claim 頁面，畫面顯示「邀請待接受」狀態，不顯示「已可 clone」文字
