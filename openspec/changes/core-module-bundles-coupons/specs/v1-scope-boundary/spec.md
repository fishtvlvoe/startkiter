## MODIFIED Requirements

### Requirement: v1 take-home capabilities

A completed MVP take-home SHALL include public pages available in zh-TW, zh-CN, and en, an authenticated area, email/password auth, Google login, LINE login, PAYUNi one-time TWD checkout, an in-site course module, GitHub kit claim, a site-agent with two read-only tools, and a product catalog supporting the fixed MVP SKU plus operator-defined course Bundles with coupon discounts. All pages MUST be composed from the shared design system defined in the design-system capability rather than page-local hand-written styling. Complete code with unused modules present but not required to finish first purchase is a valid MVP shape.

#### Scenario: Site boots without payment keys

- **WHEN** an operator deploys with no PAYUNi keys configured
- **THEN** the public pages MUST boot and MUST NOT return HTTP 500

#### Scenario: Currency is TWD for every product in the catalog

- **WHEN** any product (the MVP SKU or a course Bundle) price is stored for checkout
- **THEN** the currency MUST be TWD

#### Scenario: MVP SKU price remains fixed at 8800

- **WHEN** the MVP SKU specifically is priced for checkout
- **THEN** the amount MUST be 8800

#### Scenario: Bundle prices are independently configured, not fixed at 8800

- **WHEN** a course Bundle is priced for checkout
- **THEN** the amount MUST equal that Bundle's own configured priceTwd, which MAY differ from 8800
