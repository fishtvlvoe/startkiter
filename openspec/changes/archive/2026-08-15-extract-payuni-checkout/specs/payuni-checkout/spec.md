## ADDED Requirements

### Requirement: Checkout requires an authenticated session

POST /api/checkout SHALL require a valid Better Auth session bound to a user. Unauthenticated requests MUST NOT create an Order.

#### Scenario: Unauthenticated checkout is rejected

- **WHEN** POST /api/checkout is called without a session
- **THEN** the response MUST be HTTP 401 and MUST NOT create an Order row

#### Scenario: Authenticated checkout creates a pending order

- **WHEN** a signed-in user calls POST /api/checkout with sku startkiter-mvp and PAYUNi keys are configured
- **THEN** the response MUST be HTTP 200 and an Order MUST exist with status pending, amount 8800, currency TWD, sku startkiter-mvp, and paymentGateway payuni

### Requirement: Refund clears entitlement flags on the order

When an MVP order status becomes refunded, the system SHALL set courseAccess to false and kitClaimEligible to false on that order. This change MUST NOT call the GitHub API. Enforcement of POST /api/github/claim HTTP 403 is deferred to the github-kit-fulfillment implementation that reads kitClaimEligible.

#### Scenario: Refund clears both flags

- **WHEN** a paid MVP order is marked refunded
- **THEN** the order status MUST be refunded and courseAccess MUST be false and kitClaimEligible MUST be false

##### Example: paid 訂單退款後雙旗標關閉

- Order orderNo=SK-8800-001 原為 paid、courseAccess=true、kitClaimEligible=true
- 執行退款標記後 status=refunded，且 courseAccess=false、kitClaimEligible=false

#### Scenario: Refund does not call GitHub in this change

- **WHEN** a paid MVP order is marked refunded
- **THEN** the refund path MUST NOT invoke the GitHub collaborator API

##### Example: 退款路徑無 GitHub HTTP

- 對 orderNo=SK-8800-001 執行退款標記，測試 spy 監看 GitHub API
- 退款完成且 spy 記錄為零次 collaborator add／remove 呼叫

## MODIFIED Requirements

### Requirement: PAYUNi is the only MVP gateway

MVP checkout SHALL use PAYUNi for one-time TWD payments. Shopline, Stripe, and Polar MUST NOT accept MVP funds. The checkout amount and sku MUST be server-locked to 8800 TWD and startkiter-mvp.

#### Scenario: Checkout uses PAYUNi

- **WHEN** a signed-in buyer submits POST /api/checkout for sku startkiter-mvp
- **THEN** the server MUST start a PAYUNi one-time TWD session and MUST NOT redirect to Shopline, Stripe, or Polar

##### Example: 買家送出結帳建立 PAYUNi session

- 已登入買家 alice@example.com 對 POST /api/checkout 送出 sku=startkiter-mvp
- 伺服器建立 PAYUNi 一次性 TWD 8800 元付款 session，不導向 Shopline、Stripe 或 Polar

#### Scenario: Unconfigured PAYUNi fails closed

- **WHEN** PAYUNi keys are missing and a signed-in client calls POST /api/checkout
- **THEN** the response MUST be HTTP 503 with an explicit configuration error and MUST NOT be HTTP 500

#### Scenario: Client-supplied alternate sku is rejected

- **WHEN** a signed-in buyer submits POST /api/checkout with a sku other than startkiter-mvp
- **THEN** the response MUST be HTTP 400 and MUST NOT create a paid order

### Requirement: Webhook marks a single order paid

POST /api/payuni/notify SHALL verify the PAYUNi payload and mark at most one matching order paid. Duplicate notifications MUST be idempotent. On first paid transition the order MUST set courseAccess true and kitClaimEligible true.

#### Scenario: First successful notify pays the order

- **WHEN** a valid PAYUNi paid notify arrives for a pending order
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and the order status MUST become paid and courseAccess MUST be true and kitClaimEligible MUST be true

#### Scenario: Duplicate notify does not double-grant

- **WHEN** the same valid paid notify is posted again
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and MUST NOT create a second order and MUST NOT flip entitlement flags from a consistent paid state into a duplicate grant side effect

#### Scenario: Invalid notify is rejected

- **WHEN** POST /api/payuni/notify receives a payload that fails signature or trade-no matching
- **THEN** the response MUST be HTTP 400 and the order MUST remain pending

### Requirement: Refund revokes kit eligibility

A refunded MVP order SHALL revoke kit claim eligibility and course access on the order record via kitClaimEligible false and courseAccess false. Course playback and GitHub collaborator revocation that depend on those flags MUST be implemented by later changes that read the same flags. While POST /api/github/claim is not implemented in this change, any future claim handler MUST treat refunded orders as ineligible.

#### Scenario: Refunded order loses kit eligibility flag

- **WHEN** the MVP order status is refunded
- **THEN** kitClaimEligible MUST be false and courseAccess MUST be false

##### Example: refunded 列可被後續 claim 讀取

- Order orderNo=SK-8800-002 status=refunded、kitClaimEligible=false、courseAccess=false
- 查詢該列時兩旗標皆為 false

#### Scenario: Refunded eligibility is durable for later claim handlers

- **WHEN** the MVP order status is refunded and a later change implements POST /api/github/claim
- **THEN** that handler MUST deny claims for the refunded order by reading kitClaimEligible

##### Example: 未來 claim 依旗標拒絕

- Order orderNo=SK-8800-002 kitClaimEligible=false
- 未來 POST /api/github/claim 讀到該旗標後 MUST 拒絕（預期 HTTP 403），不得呼叫 GitHub 邀請 API
