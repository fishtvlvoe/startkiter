## MODIFIED Requirements

### Requirement: Subscription records reserve invoice fields without implementing invoicing

The system SHALL include invoice-related fields (`invoiceType`, `invoiceCarrierType`, `invoiceCarrierId`, `invoiceTaxId`, `invoiceTitle`, `invoiceAddress`, `invoiceLoveCode`) on `CourseSubscription`. When electronic invoicing is disabled, checkout is permitted to populate these fields, but doing so MUST NOT trigger any invoicing API call. When electronic invoicing is enabled with auto-issue on, a successful subscription period payment SHALL use these fields to issue an invoice for that period.

#### Scenario: Invoice fields remain unused while electronic invoicing is disabled

- **WHEN** electronic invoicing is disabled and a subscription is created, activated, renewed, or canceled
- **THEN** no invoicing API call MUST occur, regardless of whether invoice-related fields are populated

#### Scenario: Enabled invoicing issues an invoice per successful period payment

- **WHEN** electronic invoicing is enabled with auto-issue on and a subscription period payment succeeds
- **THEN** the system MUST create an `Invoice` row referencing that subscription and period number, using the subscription's invoice-preference fields as issuance input
