## ADDED Requirements

### Requirement: MVP SKU constant is startkiter-mvp

The only purchasable MVP sku SHALL be the string startkiter-mvp. Checkout and Order persistence MUST store this exact value.

#### Scenario: Created order stores canonical sku

- **WHEN** checkout succeeds for the MVP product
- **THEN** the Order.sku MUST equal startkiter-mvp

##### Example: 成功結帳寫入 canonical sku

- 已登入使用者對 POST /api/checkout 送出 sku=startkiter-mvp 且金鑰已設定
- 建立的 Order.sku 等於 startkiter-mvp

## MODIFIED Requirements

### Requirement: Single MVP SKU price

The MVP product SHALL be one SKU that includes the course and lifetime private-kit updates. Checkout SHALL charge 8800 TWD and MUST NOT offer a second paid tier. The server MUST ignore client-supplied amounts and MUST write amount 8800 currency TWD on the Order.

#### Scenario: Checkout amount is 8800 TWD

- **WHEN** a signed-in buyer starts checkout for the MVP SKU
- **THEN** the order amount MUST be 8800 and the currency MUST be TWD

#### Scenario: Empty or zero price is rejected

- **WHEN** checkout order-building logic receives amount 0 or a missing amount
- **THEN** the request MUST fail closed and MUST NOT create a paid order

##### Example: 內部建單拒絕 amount 0

- 呼叫建單輔助函式時傳入 amount=0 或省略 amount
- 函式失敗且資料庫不出現 paid 狀態的 Order

#### Scenario: Client-supplied alternate amount is ignored

- **WHEN** a signed-in buyer posts POST /api/checkout with a body amount other than 8800
- **THEN** the created Order amount MUST still be 8800 and currency MUST be TWD

### Requirement: Course and kit are the same purchase

Payment of the MVP SKU SHALL grant course access and kit-claim eligibility together as boolean flags on the paid Order. The system MUST NOT sell the kit without the course or the course without kit eligibility. This change MUST set both flags true on paid and MUST NOT implement course playback or GitHub invitation APIs.

#### Scenario: Paid user receives both entitlement flags

- **WHEN** PAYUNi marks the MVP order paid
- **THEN** the order MUST have courseAccess true and kitClaimEligible true

##### Example: PAYUNi 通知付款完成後同時開通兩項旗標

- PAYUNi webhook 通知 orderNo 對應的 pending 訂單變為 paid
- 該 Order 的 courseAccess 與 kitClaimEligible 皆為 true

#### Scenario: Partial entitlement is forbidden

- **WHEN** an MVP order is marked paid
- **THEN** the system MUST NOT leave exactly one of courseAccess or kitClaimEligible true

##### Example: paid 不得只開一旗標

- notify 將 orderNo=SK-8800-003 標為 paid
- 資料列不得出現 (courseAccess=true, kitClaimEligible=false) 或相反組合；兩旗標皆必須為 true
