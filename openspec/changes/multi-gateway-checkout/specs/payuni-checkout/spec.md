## MODIFIED Requirements

### Requirement: PAYUNi is the only MVP gateway

MVP checkout SHALL use one of PAYUNi, Shopline, or Stripe for one-time TWD payments, determined by the operator's currently enabled gateway setting. Polar MUST NOT accept MVP funds. The checkout amount and sku MUST be server-locked to 8800 TWD and startkiter-mvp. Exactly one gateway is enabled at any given time; the checkout endpoint MUST NOT let a buyer choose among multiple gateways.

#### Scenario: Checkout uses the currently enabled gateway

- **WHEN** a signed-in buyer submits POST /api/checkout for sku startkiter-mvp
- **THEN** the server MUST start a payment session with whichever of PAYUNi, Shopline, or Stripe is currently configured as the enabled gateway, and MUST NOT redirect to Polar or to any gateway other than the enabled one

##### Example: 買家送出結帳建立啟用金流的 session

- 已登入買家 alice@example.com 對 POST /api/checkout 送出 sku=startkiter-mvp，後台啟用金流設定為 PAYUNi
- 伺服器建立 PAYUNi 一次性 TWD 8800 元付款 session，不導向 Shopline、Stripe 或 Polar

#### Scenario: Unconfigured enabled gateway fails closed

- **WHEN** the currently enabled gateway's keys are missing and a signed-in client calls POST /api/checkout
- **THEN** the response MUST be HTTP 503 with an explicit configuration error and MUST NOT be HTTP 500

#### Scenario: Client-supplied alternate sku is rejected

- **WHEN** a signed-in buyer submits POST /api/checkout with a sku other than startkiter-mvp
- **THEN** the server MUST reject the request and MUST NOT start a payment session for the supplied sku
