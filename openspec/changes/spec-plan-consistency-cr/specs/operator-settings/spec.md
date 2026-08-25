## ADDED Requirements

### Requirement: Operator settings hub registers every backend settings page

The `operator-settings` capability SHALL serve as the single registry of every backend settings page accessible under `/admin/settings`. Each backend settings page SHALL have a corresponding Requirement in this spec describing what it configures. A change that adds a new backend settings page SHALL add a corresponding Requirement to this spec as part of that change.

#### Scenario: Existing settings pages are registered

- **WHEN** the operator-settings capability is consulted for the list of backend settings pages
- **THEN** it MUST include both the PAYUNi checkout settings page and the Taiwan e-invoice settings page

##### Example: Registered pages as of this change

| Settings page | Path | Configures |
| --- | --- | --- |
| PAYUNi checkout | apps/saas/app/(authenticated)/(main)/(account)/admin/settings/page.tsx | PAYUNi merchant credentials |
| Taiwan e-invoice | apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx | ECPay/ezPay provider selection and credentials |
