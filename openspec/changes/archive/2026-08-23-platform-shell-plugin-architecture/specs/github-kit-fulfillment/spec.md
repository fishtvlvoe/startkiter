## MODIFIED Requirements

### Requirement: In-site GitHub claim after payment

A user with a paid MVP order (kitClaimEligible true) SHALL claim kit access from the course site by signing in with GitHub. Claiming MUST be a POST request; checking claim status MUST be a separate GET request with no side effects, since a GET that mutates state can be triggered by prefetch, retry, or scanners. The system SHALL generate a dedicated private repository for that GitHub account from the `GITHUB_KIT_TEMPLATE_REPO` template repository via GitHub App, and grant that account `write` permission on the newly generated repository. Manual operator invites MUST NOT be required for the happy path. The generated repository MUST NOT be shared with any other buyer.

#### Scenario: Paid user claims successfully

- **WHEN** a paid user with kitClaimEligible true completes GitHub OAuth and POST /api/github/claim runs
- **THEN** the response MUST be HTTP 200 and a github_kit_grants row MUST exist with permission write and status invited, referencing a repository dedicated to that user

#### Scenario: Unauthenticated claim is rejected

- **WHEN** POST /api/github/claim is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Unpaid claim is rejected

- **WHEN** a signed-in user with no Order.kitClaimEligible true for sku startkiter-mvp calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub API MUST NOT be called to generate a repository or add a collaborator

#### Scenario: Claim status can be queried without side effects

- **WHEN** GET /api/github/claim-status is called, regardless of how many times or by whom (including prefetch or retry)
- **THEN** the response MUST reflect current grant state and MUST NOT call the GitHub API to generate a repository, add a collaborator, or remove one

##### Example: 瀏覽器預抓不會誤觸邀請

- 瀏覽器對 GET /api/github/claim-status 連續預抓兩次，使用者尚未按下領取按鈕
- 兩次回應皆回報 status=not_claimed，GitHub API 未被呼叫，github_kit_grants 未新增任何列

### Requirement: Claim entitlement reads Order.kitClaimEligible

POST /api/github/claim SHALL require a Better Auth session whose user owns at least one Order with sku startkiter-mvp and kitClaimEligible true. Users without that flag MUST receive HTTP 403 and the GitHub repository-generation API MUST NOT be called.

#### Scenario: kitClaimEligible false blocks claim

- **WHEN** a signed-in user with only kitClaimEligible false orders calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub template-generate API MUST NOT be invoked

##### Example: 退款後再領取

- userId=user_refunded 的 Order status=refunded、kitClaimEligible=false
- POST /api/github/claim 回 403，測試 spy 記錄 GitHub template-generate 為零次

#### Scenario: kitClaimEligible true allows claim path to proceed

- **WHEN** a signed-in user with kitClaimEligible true and a linked GitHub identity calls POST /api/github/claim with GitHub App configured
- **THEN** the system MUST attempt to generate a dedicated repository from the template and grant write access, and MUST persist a github_kit_grants row on success

##### Example: 有權學員成功送出邀請

- userId=user_paid、Order.kitClaimEligible=true、已綁定 githubLogin=bob-dev
- POST /api/github/claim 回 200，github_kit_grants 出現 permission=write、status=invited，關聯一個專屬於 bob-dev 的 repo

## REMOVED Requirements

### Requirement: Invite is read-only on an organization repository

**Reason**: 買家倉庫拓樸從「全買家共用單一唯讀 repo」改為「每位買家專屬可寫 repo」（見 platform-shell-plugin-architecture 的 buyer-repo-upstream-sync 決策）。這個 Requirement 的標題與內容本身明講 pull-only、共用組織倉庫，跟新拓樸直接矛盾，保留舊標題會誤導讀者以為系統仍是唯讀模式。取代此 Requirement 的規則見下方新增的「Invite grants write access on a dedicated per-buyer organization repository」。

## ADDED Requirements

### Requirement: Invite grants write access on a dedicated per-buyer organization repository

Kit access SHALL use an organization-owned private repository generated per buyer from a template repository. The granted GitHub role MUST be `write`. Personal-account repositories MUST NOT be used for kit delivery. No two buyers MUST share the same delivered repository.

#### Scenario: Grant permission is write

- **WHEN** a kit grant is written
- **THEN** permission MUST equal write and MUST NOT equal pull, maintain, or admin

##### Example: 寫入 per-buyer write 授權紀錄

- 使用者 bob@example.com（GitHub 帳號 bob-dev）完成 MVP 付款並通過 GitHub OAuth
- 系統寫入 github_kit_grants: user_id=usr_1001, github_login=bob-dev, repo=org/kit-ord_9001, permission=write, status=invited

#### Scenario: GitHub API failure stays unclaimed

- **WHEN** GitHub returns an error while generating the repository or adding the collaborator
- **THEN** POST /api/github/claim MUST return HTTP 502 and MUST NOT mark the grant accepted

#### Scenario: No two buyers share a delivered repository

- **WHEN** two different paid users each complete a successful claim
- **THEN** their github_kit_grants rows MUST reference two different repository names
