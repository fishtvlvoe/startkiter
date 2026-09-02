## MODIFIED Requirements

### Requirement: Issued invoices can be voided within the same billing period or credited with an allowance across periods

The system SHALL allow an operator to void an `ISSUED` invoice only when it has not crossed into a later calendar month than its issue date, transitioning it to `VOIDED`. The system SHALL allow an operator to issue an allowance against an `ISSUED` invoice at any time (including after crossing months or after the invoice has been included in a lottery draw), transitioning it to `ALLOWANCE` and accumulating `allowanceTotal`.

When a refund is processed for an invoice whose issue date has crossed into an earlier calendar month, the system SHALL automatically issue an allowance for the full remaining creditable amount (`amount` minus `allowanceTotal`) instead of leaving the invoice for manual operator action. If that automatic allowance fails with a definite error, the system SHALL restore the invoice to the manual `REFUND_NEEDS_ALLOWANCE` state so an operator can complete it; if the provider result is ambiguous, the system SHALL mark the invoice `ALLOWANCE_NEEDS_REVIEW` and MUST NOT retry automatically.

#### Scenario: Void succeeds within the same month

- **WHEN** an operator voids an `ISSUED` invoice whose issue date is in the current calendar month
- **THEN** the invoice status MUST become `VOIDED`

#### Scenario: Void is rejected after crossing into a later month

- **WHEN** an operator attempts to void an `ISSUED` invoice whose issue date is in an earlier calendar month than the current date
- **THEN** the request MUST be rejected and the invoice status MUST remain `ISSUED`

#### Scenario: Allowance succeeds regardless of month

- **WHEN** an operator issues an allowance against an `ISSUED` invoice, whether in the same month or a later month
- **THEN** the invoice status MUST become `ALLOWANCE` and `allowanceTotal` MUST increase by the allowance amount

#### Scenario: Cross-month refund issues a full allowance automatically

- **WHEN** a refund is processed for an `ISSUED` invoice whose issue date is in an earlier calendar month than the current date
- **THEN** the system MUST issue an allowance for `amount` minus `allowanceTotal` without operator action, the invoice status MUST become `ALLOWANCE`, and `attentionReason` MUST be cleared

#### Scenario: Automatic cross-month allowance falls back to manual on definite failure

- **WHEN** the automatic allowance for a cross-month refund fails with a definite provider error
- **THEN** the invoice `attentionReason` MUST be `REFUND_NEEDS_ALLOWANCE` with the provider error recorded in `failReason`, so an operator can complete the allowance from the admin UI

#### Scenario: Automatic cross-month allowance with an ambiguous provider result is held for review

- **WHEN** the automatic allowance for a cross-month refund returns an ambiguous result
- **THEN** the invoice `attentionReason` MUST be `ALLOWANCE_NEEDS_REVIEW` and the system MUST NOT automatically retry the allowance

#### Scenario: Cross-month refund on a fully credited invoice issues no further allowance

- **WHEN** a refund is processed for an invoice whose `allowanceTotal` already equals `amount`
- **THEN** the system MUST NOT call the provider allowance API and MUST leave the invoice without a pending `attentionReason`

##### Example: partial allowance across two requests

| Invoice amount | First allowance | Second allowance | Resulting allowanceTotal | Notes |
| --- | --- | --- | --- | --- |
| 1499 | 500 | 999 | 1499 | fully credited across two allowances |
| 1499 | 1499 | (none) | 1499 | full allowance in one request |
