## ADDED Requirements

### Requirement: Operator settings hub registers every backend settings page

The `operator-settings` capability SHALL serve as the single registry of every backend settings page accessible under `/admin/settings`. Each backend settings page SHALL have a corresponding Requirement in this spec describing what it configures. A change that adds a new backend settings page SHALL add a corresponding Requirement to this spec as part of that change.

#### Scenario: Existing settings pages are registered

- **WHEN** the operator-settings capability is consulted for the list of backend settings pages
- **THEN** it MUST include both the PAYUNi checkout settings page and the Taiwan e-invoice settings page

##### Example: Registered pages as of this change

| Settings page | Path | Setting ID | Fields | Validation |
| --- | --- | --- | --- | --- |
| PAYUNi checkout | apps/saas/app/(authenticated)/(main)/(account)/admin/settings/page.tsx | `payuni` | `merchantId`, `hashKey`, `hashIV`, `apiUrl` | `merchantId` and `apiUrl` are non-blank when supplied; `hashKey` is 32 characters; `hashIV` is 16 characters; blank secrets preserve the stored value |
| Taiwan e-invoice | apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx | `einvoice` | `provider`, `merchantId`, `hashKey`, `hashIV`, `testMode`, `sellerName`, `sellerTaxId`, `autoIssueEnabled`, `einvoiceEnabled` | `provider` is `ecpay` or `ezpay`; `merchantId`, `sellerName`, and `sellerTaxId` are non-blank; `hashKey` is 16 or 32 characters; `hashIV` is 16 characters |

Each registry entry SHALL use the stable setting ID as the database row key, list the fields persisted in its encrypted payload, and state the validation rule for every credential-bearing field. A new settings page MUST add one registry row and one corresponding Requirement before its implementation is considered complete.
