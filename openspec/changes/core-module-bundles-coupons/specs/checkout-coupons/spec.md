## ADDED Requirements

### Requirement: Coupon validation endpoint checks code validity without leaking existence via status code

POST /api/coupons/validate SHALL accept a JSON body of code and productId, and SHALL respond with HTTP 200 for every syntactically valid request regardless of whether the code exists, is expired, or is exhausted. The response body MUST distinguish the outcome via a valid boolean and, when invalid, a reason field. The server MUST NOT use HTTP 404 to indicate a missing coupon code, to avoid leaking code-enumeration signal through status codes.

#### Scenario: Valid unexpired coupon under redemption limit

- **WHEN** POST /api/coupons/validate is called with a code that exists, is active, has not started in the future, has not expired, and has remaining redemptions
- **THEN** the response is HTTP 200 with valid true and a computed finalAmount

##### Example: 固定金額折扣

- **GIVEN** coupon `SAVE100`：discountType=amount, amountOff=100, active=true, 無到期日, 無使用上限
- **GIVEN** 商品 `startkiter-mvp` 原價 8800
- **WHEN** POST /api/coupons/validate 送出 `{ code: "SAVE100", productId: "startkiter-mvp" }`
- **THEN** 回傳 `{ valid: true, discountAmount: 100, finalAmount: 8700 }`

##### Example: 百分比折扣有上限

- **GIVEN** coupon `SAVE20PCT`：discountType=percent, percentOff=20, maxDiscountAmount=500
- **GIVEN** 商品原價 8800（20% = 1760，超過 500 上限）
- **WHEN** POST /api/coupons/validate 送出該 code
- **THEN** 回傳 `{ valid: true, discountAmount: 500, finalAmount: 8300 }`

#### Scenario: Nonexistent code returns 200 with not_found reason

- **WHEN** POST /api/coupons/validate is called with a code that does not exist in the database
- **THEN** the response is HTTP 200 with valid false and reason "not_found" (not HTTP 404)

#### Scenario: Expired coupon is rejected

- **WHEN** POST /api/coupons/validate is called with a code whose expiresAt is earlier than the current time
- **THEN** the response is HTTP 200 with valid false and reason "expired"

#### Scenario: Coupon not yet started is rejected

- **WHEN** POST /api/coupons/validate is called with a code whose startsAt is later than the current time
- **THEN** the response is HTTP 200 with valid false and reason "not_started"

#### Scenario: Coupon at redemption limit is rejected

- **WHEN** POST /api/coupons/validate is called with a code whose timesRedeemed equals a non-null non-zero maxRedemptions
- **THEN** the response is HTTP 200 with valid false and reason "max_redemptions_reached"

#### Scenario: Rate limit protects against brute-force enumeration

- **WHEN** the same client identifier sends coupon validation requests exceeding the configured rate limit within the configured window
- **THEN** subsequent requests within that window MUST receive HTTP 429

### Requirement: Checkout applies a validated coupon to compute the charged amount

POST /api/checkout SHALL accept an optional couponCode field. When present, the server MUST independently re-validate the coupon server-side (not trust a client-supplied discount amount) before creating the Order, and MUST write the discounted amount to the Order.

#### Scenario: Checkout with valid coupon charges discounted amount

- **WHEN** a signed-in buyer posts POST /api/checkout with a couponCode that is valid for the requested product
- **THEN** the created Order's amount MUST equal the product's price minus the coupon's discount, not the product's full price

#### Scenario: Checkout with invalid coupon code fails closed

- **WHEN** a signed-in buyer posts POST /api/checkout with a couponCode that fails validation (not found, expired, or exhausted)
- **THEN** the server MUST reject the request with HTTP 400 and MUST NOT create an Order

#### Scenario: Checkout without a coupon code charges full price

- **WHEN** a signed-in buyer posts POST /api/checkout with no couponCode field
- **THEN** the created Order's amount MUST equal the product's full price, unchanged from current behavior
