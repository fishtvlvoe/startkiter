## ADDED Requirements

### Requirement: Payment, notification, page-editing, and course-engine infrastructure are fixed Core capabilities
The payment/checkout system, Email/LINE notification integrations, the page-editing system, and the course engine SHALL be implemented and shipped as part of Core. The `PluginManifest` type's `dataSpec` field MUST NOT include a value representing payment, transactional checkout, or notification-sending capability. Customers MUST NOT be able to swap these Core capabilities for an alternative Plugin through the Marketplace or mount point mechanism.

#### Scenario: Payment dataSpec value does not type-check
- **WHEN** a Plugin manifest is written declaring `dataSpec: "payment"` or any transactional-storage value
- **THEN** the TypeScript compiler MUST reject the manifest, because `PluginManifest.dataSpec` only accepts `"content"` or `"none"`

#### Scenario: Marketplace never lists a payment-provider Plugin
- **WHEN** `GET /api/plugins` is called
- **THEN** the response array MUST NOT contain any entry representing an alternative payment or checkout provider

### Requirement: Plugin scope is limited to service-type capabilities
A Plugin SHALL represent one of: customer-authored SaaS business logic, customer-authored course content produced through the Core course engine, or customer-authored AI service logic. A Plugin manifest MUST NOT declare capability to modify Core infrastructure (Shell, mount point mechanism, authentication, payment, notification, or page-editing systems).

#### Scenario: Course content Plugin is valid
- **WHEN** a manifest declares `id: "course"` with `mount.content: { kind: "auto", boundTo: "/course" }` and `dataSpec: "content"`
- **THEN** the manifest MUST be accepted as a valid service-type Plugin

#### Scenario: Manifest cannot declare Core-infrastructure mount kinds
- **WHEN** a manifest attempts to declare a mount point kind outside the fixed set defined in `platform-mount-points` (e.g. attempting to register a new authentication provider or override the Shell layout)
- **THEN** the TypeScript compiler MUST reject the manifest, because no such mount point kind exists in the `PluginManifest` type

### Requirement: Customers may modify Core source code without platform restriction
StartKiter SHALL be distributed to customers as a complete, readable source code package. The platform MUST NOT implement any code-level access control that prevents a customer from editing Core source files. The official AI-guided extension path SHALL be the Plugin mechanism only; direct Core modification receives no official support or protection guarantee.

#### Scenario: No runtime restriction blocks Core file edits
- **WHEN** a customer edits a file under Core (e.g. `packages/platform`, `packages/auth`, `packages/payments`)
- **THEN** the application MUST build and run using the modified Core code without any license check, code-signing check, or runtime gate blocking the edit

#### Scenario: Documentation states the Plugin mechanism is the only officially guided path
- **WHEN** a reader consults the platform's extension documentation
- **THEN** the documentation MUST state that AI-guided extension is only officially supported through the Plugin mechanism, and that direct Core modification is unsupported and unprotected

### Requirement: Transaction-type data spec is documented but not scaffolded in v1
This specification SHALL document that a future transaction/high-frequency Plugin data category would require its own migration-based table rather than the shared `PluginContent` table, for reference by future changes. The v1 implementation MUST NOT ship scaffolding, CLI tooling, or code generation for this category, because no v1 Plugin uses it.

#### Scenario: No transaction-type scaffolding ships in v1
- **WHEN** the codebase for this change is inspected after implementation
- **THEN** it MUST NOT contain a code generator, CLI command, or scaffold template for creating a transaction-type Plugin's migration files
