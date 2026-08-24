## MODIFIED Requirements

### Requirement: Webhook marks a single order paid

POST /api/payuni/notify SHALL verify the PAYUNi payload and mark at most one matching order paid. Duplicate notifications MUST be idempotent. On first paid transition the order MUST set courseAccess true and kitClaimEligible true. If electronic invoicing is enabled with auto-issue on, the first paid transition SHALL also trigger invoice issuance for that order; invoice issuance failure MUST NOT change the order's paid status or entitlement flags.

#### Scenario: First successful notify pays the order

- **WHEN** a valid PAYUNi paid notify arrives for a pending order
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and the order status MUST become paid and courseAccess MUST be true and kitClaimEligible MUST be true

#### Scenario: Duplicate notify does not double-grant

- **WHEN** the same valid paid notify is posted again
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and MUST NOT create a second order and MUST NOT flip entitlement flags from a consistent paid state into a duplicate grant side effect

#### Scenario: Invalid notify is rejected

- **WHEN** POST /api/payuni/notify receives a payload that fails signature or trade-no matching
- **THEN** the response MUST be HTTP 400 and the order MUST remain pending

#### Scenario: Invoice issuance failure does not affect order paid status

- **WHEN** electronic invoicing is enabled with auto-issue on and the first paid transition's invoice issuance call fails
- **THEN** the order status MUST still become paid with courseAccess true and kitClaimEligible true, and the response MUST still be HTTP 200
