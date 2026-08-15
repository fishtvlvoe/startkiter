## ADDED Requirements

### Requirement: Single MVP SKU price

The MVP product SHALL be one SKU that includes the course and lifetime private-kit updates. Checkout SHALL charge 8800 TWD and MUST NOT offer a second paid tier.

#### Scenario: Checkout amount is 8800 TWD

- **WHEN** a buyer starts checkout for the MVP SKU
- **THEN** the order amount MUST be 8800 and the currency MUST be TWD

#### Scenario: Empty or zero price is rejected

- **WHEN** checkout is created with amount 0 or a missing amount
- **THEN** the request MUST fail closed and MUST NOT create a paid order

### Requirement: Course and kit are the same purchase

Payment of the MVP SKU SHALL grant course access and kit-claim eligibility together. The system MUST NOT sell the kit without the course or the course without kit eligibility.

#### Scenario: Paid user receives both entitlements

- **WHEN** PAYUNi marks the MVP order paid
- **THEN** the user MUST have course access and MUST be allowed to open the in-site GitHub claim page

##### Example: PAYUNi 通知付款完成後同時開通兩項權益

- PAYUNi webhook 通知 order_id=ord_8800_001（買家 alice@example.com）狀態變為已付款
- 系統將該 user 的課程存取權設為開通，且允許其開啟站內 GitHub claim 頁面（頁面用 POST /api/github/claim 執行邀請，用 GET /api/github/claim-status 查狀態）

#### Scenario: Unpaid user is denied both

- **WHEN** a signed-in user has no paid MVP order
- **THEN** course playback MUST be denied and POST /api/github/claim MUST return 403
