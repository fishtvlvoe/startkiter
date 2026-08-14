## ADDED Requirements

### Requirement: In-site GitHub claim after payment

A user with a paid MVP order SHALL claim kit access from the course site by signing in with GitHub. Claiming (inviting the collaborator) MUST be a POST request; checking claim status MUST be a separate GET request with no side effects, since a GET that mutates state can be triggered by prefetch, retry, or scanners. The system SHALL invite that GitHub account to the configured organization private repository with pull permission. Manual operator invites MUST NOT be required for the happy path.

#### Scenario: Paid user claims successfully

- **WHEN** a paid user completes GitHub OAuth and POST /api/github/claim runs
- **THEN** the response MUST be HTTP 200 and a github_kit_grants row MUST exist with permission pull and status invited

#### Scenario: Unauthenticated claim is rejected

- **WHEN** POST /api/github/claim is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Unpaid claim is rejected

- **WHEN** a signed-in user with no paid MVP order calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub API MUST NOT be called to add a collaborator

#### Scenario: Claim status can be queried without side effects

- **WHEN** GET /api/github/claim-status is called, regardless of how many times or by whom (including prefetch or retry)
- **THEN** the response MUST reflect current grant state and MUST NOT call the GitHub API to add or remove a collaborator

##### Example: 瀏覽器預抓不會誤觸邀請

- 瀏覽器對 GET /api/github/claim-status 連續預抓兩次，使用者尚未按下領取按鈕
- 兩次回應皆回報 status=not_claimed，GitHub API 未被呼叫，github_kit_grants 未新增任何列

### Requirement: Invite is read-only on an organization repository

Kit access SHALL use an organization-owned private repository. The granted GitHub role MUST be pull. Personal-account repositories MUST NOT be used for kit delivery.

#### Scenario: Grant permission is pull

- **WHEN** a kit grant is written
- **THEN** permission MUST equal pull and MUST NOT equal push, maintain, or admin

##### Example: 寫入 pull-only 授權紀錄

- 使用者 bob@example.com（GitHub 帳號 bob-dev）完成 MVP 付款並通過 GitHub OAuth
- 系統寫入 github_kit_grants: user_id=usr_1001, github_login=bob-dev, repo=org/startkiter-private-kit, permission=pull, status=invited

#### Scenario: GitHub API failure stays unclaimed

- **WHEN** GitHub returns an error while adding the collaborator
- **THEN** POST /api/github/claim MUST return HTTP 502 and MUST NOT mark the grant accepted

### Requirement: Refund revokes existing collaborator access

A refund on an order that already has a github_kit_grants row SHALL actively revoke GitHub access, not only block future claims. This covers both accepted collaborators and pending invitations that the learner has not accepted yet. Revocation MUST be attempted automatically when the order is marked refunded; a GitHub API failure during revocation MUST be logged and MUST NOT block the refund itself.

#### Scenario: Refund removes an already-accepted collaborator

- **WHEN** an order with an accepted github_kit_grants row (status=accepted, accepted_at set) is marked refunded
- **THEN** the system MUST call the GitHub API to remove that collaborator from the private repository and MUST set the grant's status to revoked with revoked_at set

##### Example: 已接受邀請的訂單退款後被移除

- 使用者 bob@example.com（GitHub 帳號 bob-dev）的 github_kit_grants 列 permission=pull、status=accepted、accepted_at=2026-08-10T10:00:00Z
- 訂單 order_id=ord_5001 被標記 refunded
- 系統呼叫 GitHub API 將 bob-dev 從 org/startkiter-private-kit 移除 collaborator，並把該筆 grant 的 status 更新為 revoked、revoked_at 寫入當下時間

#### Scenario: Refund cancels a pending invitation

- **WHEN** an order with a pending github_kit_grants row (status=invited, accepted_at null) is marked refunded
- **THEN** the system MUST call the GitHub API to cancel or remove that pending invitation and MUST set the grant's status to revoked with revoked_at set

##### Example: 邀請已送出但尚未接受就退款

- 使用者 dana@example.com（GitHub 帳號 dana-lin）的 github_kit_grants 列 status=invited、accepted_at=null
- 訂單 order_id=ord_5004 被標記 refunded
- 系統呼叫 GitHub API 取消 org/startkiter-private-kit 對 dana-lin 的 pending invitation，並把該筆 grant 的 status 更新為 revoked

#### Scenario: Refund with no prior grant needs no revocation call

- **WHEN** an order with no github_kit_grants row is marked refunded
- **THEN** the system MUST NOT call the GitHub API to remove a collaborator or cancel an invitation

##### Example: 從未領取過的訂單退款

- 訂單 order_id=ord_5002 從未有對應的 github_kit_grants 列（使用者從未完成 claim）
- 訂單被標記 refunded 時，系統不呼叫 GitHub API 移除任何 collaborator，也不取消任何 invitation

#### Scenario: Revocation failure does not block the refund

- **WHEN** the GitHub API returns an error while removing the collaborator or canceling the pending invitation
- **THEN** the refund MUST still complete and the failure MUST be recorded for manual follow-up

##### Example: GitHub API 暫時失敗不擋退款

- 訂單 order_id=ord_5003 標記 refunded，觸發移除 GitHub 帳號 carol-lin 的 collaborator 呼叫
- GitHub API 回傳 503，系統仍完成退款流程，並記錄一筆待人工複核的撤銷失敗事件

### Requirement: Learner still accepts the GitHub invitation

The product SHALL tell the learner to accept the GitHub invitation. The system MUST NOT treat the kit as fully delivered until GitHub reports the collaborator is active or accepted_at is set.

#### Scenario: Invite pending is visible

- **WHEN** GitHub has been invited but the learner has not accepted
- **THEN** the claim page MUST show a pending-accept state and MUST NOT claim that clone already works

##### Example: 邀請已送出但尚未接受

- 系統已對 GitHub 帳號 carol-lin 送出 org/startkiter-private-kit 的 collaborator 邀請，accepted_at 為 null
- carol-lin 打開 claim 頁面，畫面顯示「邀請待接受」狀態，不顯示「已可 clone」文字
