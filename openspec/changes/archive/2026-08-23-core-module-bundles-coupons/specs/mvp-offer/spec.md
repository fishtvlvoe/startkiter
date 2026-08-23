## MODIFIED Requirements

### Requirement: Single MVP SKU price

The MVP product SHALL be one SKU that includes the course and lifetime private-kit updates, priced at 8800 TWD. The product catalog MAY also include additional Bundle products (see course-bundles capability) each with their own independently configured price. Checkout for the MVP SKU specifically MUST always charge 8800 TWD and MUST NOT offer a second paid tier for that SKU. The server MUST ignore client-supplied amounts for any product and MUST derive the charged amount from the server-side product catalog (the MVP SKU's fixed 8800, or a Bundle's configured price), never from a client-supplied amount field.

#### Scenario: Checkout amount is 8800 TWD for the MVP SKU

- **WHEN** a signed-in buyer starts checkout for the MVP SKU (no productId supplied, or productId "startkiter-mvp")
- **THEN** the order amount MUST be 8800 and the currency MUST be TWD

#### Scenario: Checkout amount for a bundle product uses the bundle's configured price

- **WHEN** a signed-in buyer starts checkout with productId set to a published Bundle's id
- **THEN** the order amount MUST equal that Bundle's configured priceTwd, not 8800

#### Scenario: Empty or zero price is rejected

- **WHEN** checkout order-building logic receives amount 0 or a missing amount
- **THEN** the request MUST fail closed and MUST NOT create a paid order

##### Example: 內部建單拒絕 amount 0

- 呼叫建單輔助函式時傳入 amount=0 或省略 amount
- 函式失敗且資料庫不出現 paid 狀態的 Order

#### Scenario: Client-supplied alternate amount is ignored

- **WHEN** a signed-in buyer posts POST /api/checkout with a body amount other than the product's server-side catalog price
- **THEN** the created Order amount MUST still equal the server-side catalog price for the requested product, and currency MUST be TWD

### Requirement: MVP SKU constant is startkiter-mvp

The MVP SKU string SHALL remain the string startkiter-mvp when no other productId is supplied. Checkout and Order persistence MUST store this exact value for MVP SKU purchases. Bundle purchases (see course-bundles capability) MUST store the Bundle's own id as the Order's productId while the sku field continues to reflect the underlying product family.

#### Scenario: Created order stores canonical sku for the MVP SKU

- **WHEN** checkout succeeds for the MVP product (no productId, or productId "startkiter-mvp")
- **THEN** the Order.sku MUST equal startkiter-mvp

##### Example: 成功結帳寫入 canonical sku

- 已登入使用者對 POST /api/checkout 送出 sku=startkiter-mvp 且金鑰已設定
- 建立的 Order.sku 等於 startkiter-mvp

#### Scenario: Created order for a bundle stores the bundle's own product id

- **WHEN** checkout succeeds for a Bundle product
- **THEN** the Order's productId MUST equal that Bundle's id
