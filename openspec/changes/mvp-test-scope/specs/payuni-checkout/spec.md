## ADDED Requirements

### Requirement: PAYUNi is the only MVP gateway

MVP checkout SHALL use PAYUNi for one-time TWD payments. Shopline, Stripe, and Polar MUST NOT accept MVP funds.

#### Scenario: Checkout uses PAYUNi

- **WHEN** a buyer submits POST /api/checkout
- **THEN** the server MUST start a PAYUNi one-time TWD session and MUST NOT redirect to Shopline, Stripe, or Polar

##### Example: 買家送出結帳建立 PAYUNi session

- 買家 alice@example.com 對 POST /api/checkout 送出 sku=mvp_kit_001
- 伺服器建立 PAYUNi 一次性 TWD 8800 元付款 session（trade_no=PU20260814000123），不導向 Shopline、Stripe 或 Polar

#### Scenario: Unconfigured PAYUNi fails closed

- **WHEN** PAYUNi keys are missing and a client calls POST /api/checkout
- **THEN** the response MUST be HTTP 503 with an explicit configuration error and MUST NOT be HTTP 500

### Requirement: Webhook marks a single order paid

POST /api/payuni/notify SHALL verify the PAYUNi payload and mark at most one matching order paid. Duplicate notifications MUST be idempotent.

#### Scenario: First successful notify pays the order

- **WHEN** a valid PAYUNi paid notify arrives for a pending order
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and the order status MUST become paid

#### Scenario: Duplicate notify does not double-grant

- **WHEN** the same valid paid notify is posted again
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and MUST NOT create a second order or a second kit grant

#### Scenario: Invalid notify is rejected

- **WHEN** POST /api/payuni/notify receives a payload that fails signature or trade-no matching
- **THEN** the response MUST be HTTP 400 and the order MUST remain pending

### Requirement: Refund revokes kit eligibility

A refunded MVP order SHALL revoke kit claim eligibility. Course access policy for refunds SHALL deny playback after refund.

#### Scenario: Refunded order cannot claim kit

- **WHEN** the MVP order status is refunded
- **THEN** GET /api/github/claim MUST return 403
