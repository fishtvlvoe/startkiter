## ADDED Requirements

### Requirement: Taiwan e-invoices are issued through a provider-agnostic InvoiceProvider

The system SHALL define an `InvoiceProvider` interface with `issue`, `void`, and `allowance` methods. `packages/payments/provider/ecpay/invoice-provider.ts` and `packages/payments/provider/ezpay/invoice-provider.ts` SHALL each fully implement this interface. All invoice-issuing, void, and allowance code paths MUST call these methods through the `InvoiceProvider` type, not through a concrete provider class.

#### Scenario: Invoice issuance depends on the interface, not a concrete provider class

- **WHEN** a payment-success handler calls `InvoiceProvider.issue`
- **THEN** the call site MUST reference the `InvoiceProvider` type, and switching the configured provider between `ecpay` and `ezpay` MUST NOT require changes to the payment-success handler's call site

### Requirement: Invoice records support both one-time orders and subscription period payments

The system SHALL model an `Invoice` as a record referencing either a one-time `Order` (via `orderId`) or a subscription period payment (via `subscriptionId` and `periodNumber`), with exactly one of these two reference groups populated. The system SHALL prevent issuing more than one invoice for the same subscription period.

#### Scenario: Invoice for a one-time order references only orderId

- **WHEN** a one-time `Order` payment succeeds and electronic invoicing is enabled with auto-issue on
- **THEN** the system MUST create an `Invoice` row with `orderId` set and both `subscriptionId` and `periodNumber` null

#### Scenario: Invoice for a subscription period references subscriptionId and periodNumber, not orderId

- **WHEN** a `CourseSubscription` period payment succeeds and electronic invoicing is enabled with auto-issue on
- **THEN** the system MUST create an `Invoice` row with `subscriptionId` and `periodNumber` set and `orderId` null

#### Scenario: Duplicate invoice for the same subscription period is rejected

- **WHEN** a second attempt is made to create an `Invoice` for a `subscriptionId` and `periodNumber` pair that already has an invoice
- **THEN** the system MUST reject the duplicate at the database level and MUST NOT create a second `Invoice` row for that period

### Requirement: Electronic invoicing is off by default and does not alter existing payment flows

The system SHALL default the electronic invoicing feature to disabled. While disabled, no `Invoice` row SHALL be created and existing one-time-order and subscription-payment webhook behavior MUST remain unchanged from before this change.

#### Scenario: Disabled invoicing leaves payment webhooks unaffected

- **WHEN** electronic invoicing is disabled and a payment-success webhook (one-time order or subscription period) is processed
- **THEN** the webhook MUST complete with the same response and side effects as before this change, and MUST NOT create any `Invoice` row

#### Scenario: Enabling invoicing does not require re-processing past payments

- **WHEN** electronic invoicing is enabled after a payment has already succeeded
- **THEN** the system MUST NOT automatically issue an invoice for that already-completed past payment; invoicing only applies to payments processed after enabling

### Requirement: Invoice issuance failure does not block payment success

The system SHALL record a failed invoice attempt (`status: FAILED` with `failReason`) without reversing or blocking the underlying payment's success state.

#### Scenario: Invoice provider error does not roll back a successful payment

- **WHEN** a one-time order or subscription period payment succeeds but the configured `InvoiceProvider.issue` call fails or throws
- **THEN** the payment webhook MUST still return its normal success response, the order or subscription status MUST remain in its paid/active state, and the system MUST create an `Invoice` row with `status: FAILED` and a `failReason`

### Requirement: Issued invoices can be voided within the same billing period or credited with an allowance across periods

The system SHALL allow an operator to void an `ISSUED` invoice only when it has not crossed into a later calendar month than its issue date, transitioning it to `VOIDED`. The system SHALL allow an operator to issue an allowance against an `ISSUED` invoice at any time (including after crossing months or after the invoice has been included in a lottery draw), transitioning it to `ALLOWANCE` and accumulating `allowanceTotal`.

#### Scenario: Void succeeds within the same month

- **WHEN** an operator voids an `ISSUED` invoice whose issue date is in the current calendar month
- **THEN** the invoice status MUST become `VOIDED`

#### Scenario: Void is rejected after crossing into a later month

- **WHEN** an operator attempts to void an `ISSUED` invoice whose issue date is in an earlier calendar month than the current date
- **THEN** the request MUST be rejected and the invoice status MUST remain `ISSUED`

#### Scenario: Allowance succeeds regardless of month

- **WHEN** an operator issues an allowance against an `ISSUED` invoice, whether in the same month or a later month
- **THEN** the invoice status MUST become `ALLOWANCE` and `allowanceTotal` MUST increase by the allowance amount

##### Example: partial allowance across two requests

| Invoice amount | First allowance | Second allowance | Resulting allowanceTotal | Notes |
| --- | --- | --- | --- | --- |
| 1499 | 500 | 999 | 1499 | fully credited across two allowances |
| 1499 | 1499 | (none) | 1499 | full allowance in one request |

### Requirement: Buyers select an invoice type at checkout for both one-time and subscription purchases

The system SHALL allow a buyer to specify an invoice preference (personal with carrier, company with tax ID, or donation) at checkout for both one-time `Order` purchases and subscription checkout. The preference SHALL be stored on the corresponding `Order` or `CourseSubscription` row.

#### Scenario: Company invoice preference requires a tax ID

- **WHEN** a buyer selects the company invoice type at checkout without providing a tax ID
- **THEN** the checkout request MUST be rejected with a validation error

#### Scenario: Personal invoice preference without an explicit carrier defaults to a member carrier

- **WHEN** a buyer selects the personal invoice type without specifying a mobile barcode carrier
- **THEN** the system MUST record a member (cloud) carrier preference so that invoice issuance does not fall back to paper invoicing requiring a mailing address
