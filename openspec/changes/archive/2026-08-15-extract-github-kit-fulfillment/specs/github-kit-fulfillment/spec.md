## ADDED Requirements

### Requirement: Claim entitlement reads Order.kitClaimEligible

POST /api/github/claim SHALL require a Better Auth session whose user owns at least one Order with sku startkiter-mvp and kitClaimEligible true. Users without that flag MUST receive HTTP 403 and the GitHub collaborator invite API MUST NOT be called.

#### Scenario: kitClaimEligible false blocks claim

- **WHEN** a signed-in user with only kitClaimEligible false orders calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub invite API MUST NOT be invoked

##### Example: 退款後再領取

- userId=user_refunded 的 Order status=refunded、kitClaimEligible=false
- POST /api/github/claim 回 403，測試 spy 記錄 GitHub invite 為零次

#### Scenario: kitClaimEligible true allows claim path to proceed

- **WHEN** a signed-in user with kitClaimEligible true and a linked GitHub identity calls POST /api/github/claim with GitHub App configured
- **THEN** the system MUST attempt an org private-repo pull invite and MUST persist a github_kit_grants row on success

##### Example: 有權學員成功送出邀請

- userId=user_paid、Order.kitClaimEligible=true、已綁定 githubLogin=bob-dev
- POST /api/github/claim 回 200，github_kit_grants 出現 permission=pull、status=invited

### Requirement: GitHub App performs collaborator invites

Collaborator add and revoke SHALL use a GitHub App installation token for the configured organization repository. Learner GitHub OAuth tokens MUST NOT be used as organization admin credentials. Missing App or OAuth configuration MUST fail closed with HTTP 503 on claim.

#### Scenario: Missing App config fails closed

- **WHEN** GITHUB_APP_ID or installation or private key or GITHUB_KIT_ORG or GITHUB_KIT_REPO is missing and POST /api/github/claim is called by an entitled user
- **THEN** the response MUST be HTTP 503 and MUST NOT create an accepted grant

##### Example: 未設定 org／repo

- 環境缺少 GITHUB_KIT_REPO
- 有權使用者 POST claim → 503

### Requirement: Refund revokes existing collaborator access

When an MVP order transitions to refunded and a github_kit_grants row exists for that user with status invited or accepted, the system SHALL call the GitHub App collaborator removal API for the configured repository and MUST set the grant status to revoked on success. A refund with no existing grant row for that user and repo MUST NOT call the GitHub API. A GitHub API failure during revoke MUST NOT block the refund from completing and MUST set the grant status to failed for observability.

#### Scenario: Refund revokes an existing invited or accepted grant

- **WHEN** an MVP order transitions to refunded and a github_kit_grants row for that user exists with status invited or accepted
- **THEN** the system MUST call the GitHub App collaborator removal API for that repo and MUST set the grant status to revoked on success

##### Example: 已邀請學員退款後撤權

- Order orderNo=SK-8800-002 轉為 refunded，該 user 的 github_kit_grants 列 status=invited、repo=startkiter/kit
- 退款流程呼叫 GitHub App 移除該 collaborator，成功後 grant status 改為 revoked

#### Scenario: Refund with no existing grant does not call GitHub

- **WHEN** an MVP order transitions to refunded and no github_kit_grants row exists for that user and repo
- **THEN** the refund path MUST NOT call the GitHub collaborator API

##### Example: 未領取者退款不觸發 GitHub

- Order orderNo=SK-8800-003 轉為 refunded，該 user 無任何 github_kit_grants 列
- 退款流程完成，測試 spy 記錄 GitHub API 呼叫零次

#### Scenario: GitHub revoke failure does not block the refund

- **WHEN** the GitHub App collaborator removal API call fails during a refund revoke attempt
- **THEN** the refund status change MUST still complete and the grant row MUST be set to failed for observability

##### Example: GitHub API 暫時性失敗不擋退款

- 退款流程呼叫 GitHub App 移除 collaborator 時遇到 5xx
- Order 仍成功轉為 refunded，github_kit_grants 該列 status 改為 failed，供之後人工排查

## MODIFIED Requirements

### Requirement: In-site GitHub claim after payment

A user with a paid MVP order (kitClaimEligible true) SHALL claim kit access from the course site by signing in with GitHub. Claiming (inviting the collaborator) MUST be a POST request; checking claim status MUST be a separate GET request with no side effects, since a GET that mutates state can be triggered by prefetch, retry, or scanners. The system SHALL invite that GitHub account to the configured organization private repository with pull permission via GitHub App. Manual operator invites MUST NOT be required for the happy path.

#### Scenario: Paid user claims successfully

- **WHEN** a paid user with kitClaimEligible true completes GitHub OAuth and POST /api/github/claim runs
- **THEN** the response MUST be HTTP 200 and a github_kit_grants row MUST exist with permission pull and status invited

#### Scenario: Unauthenticated claim is rejected

- **WHEN** POST /api/github/claim is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Unpaid claim is rejected

- **WHEN** a signed-in user with no Order.kitClaimEligible true for sku startkiter-mvp calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub API MUST NOT be called to add a collaborator

#### Scenario: Claim status can be queried without side effects

- **WHEN** GET /api/github/claim-status is called, regardless of how many times or by whom (including prefetch or retry)
- **THEN** the response MUST reflect current grant state and MUST NOT call the GitHub API to add or remove a collaborator

##### Example: 瀏覽器預抓不會誤觸邀請

- 瀏覽器對 GET /api/github/claim-status 連續預抓兩次，使用者尚未按下領取按鈕
- 兩次回應皆回報 status=not_claimed，GitHub API 未被呼叫，github_kit_grants 未新增任何列
