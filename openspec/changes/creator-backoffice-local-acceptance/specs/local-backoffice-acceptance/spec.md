## Purpose

This capability defines a browser-local acceptance workspace for platform administrators, creators, and buyers. It provides consistent navigation and isolated demonstration workflows without implying production authentication, payments, delivery, or provider integration.

## ADDED Requirements

### Requirement: The local shell SHALL distinguish roles and contextual navigation

The local shell SHALL label administrator sketches, creator operations, and buyer previews distinctly. Creator and administrator workspaces SHALL show top-level modules, a module-specific submenu, and the current content location. Buyers SHALL have a distinct entry and SHALL NOT receive administrator controls. Unknown role or navigation identifiers SHALL produce an actionable unsupported-state response without data writes. Mobile SHALL expose the same submenu destinations through an expandable control.

#### Scenario: Module selection replaces the submenu

- **WHEN** a creator switches from products to settings
- **THEN** product destinations are replaced by settings destinations and the current selected destination is visible

##### Example: Products then payment

- **GIVEN** the products submenu contains all, course, bundle, code, and saas
- **WHEN** settings then payment is selected
- **THEN** the submenu contains profile, account, payment, subscription, email, domains, and integrations, with payment selected

#### Scenario: Unsupported navigation cannot mutate data

- **WHEN** a local command specifies an unsupported role or destination
- **THEN** the shell reports the unsupported destination and preserves stored products and acquisition snapshots

##### Example: Invalid role

- **GIVEN** local records exist and role intruder is unsupported
- **WHEN** navigation requests intruder
- **THEN** no role view or protected-looking records appear and stored bytes remain unchanged

### Requirement: Parallel role views SHALL share a single rendering and action contract

Administrator, creator, and buyer views SHALL render from the documented RoleViewContext and shared helpers. They SHALL escape input, return HTML content, and delegate actions to the main shell. They SHALL NOT mutate browser storage, issue network requests, or redefine navigation or provider policies. The shell SHALL retain the working legacy path until all three views have registered callers and passed integration checks.

#### Scenario: A role view is missing during migration

- **WHEN** a new role view is absent or fails rendering during migration
- **THEN** the shell retains a verified legacy path or an actionable failure without replacing saved data or presenting a partial view as complete

##### Example: Buyer registration absent

- **GIVEN** administrator and creator views are registered but buyer is absent
- **WHEN** the proposed new shell is evaluated
- **THEN** it does not become the default acceptance entry and the legacy buyer path remains available

#### Scenario: User-controlled text is rendered as text

- **WHEN** a role view renders fixture or product text containing markup
- **THEN** the text is escaped and cannot execute code

##### Example: Markup product name

- **GIVEN** a product name is `<img src=x onerror=alert(1)>`
- **WHEN** its card or editor is rendered
- **THEN** the name remains literal text and no executable image element is created

### Requirement: Administrator previews SHALL provide isolated fixture workflows

The administrator preview SHALL provide a platform overview, fixture user lists with role filtering and detail/return paths, and module/version lists with detail/return paths. Settings and provider connections SHALL show their unconnected design-only status. No role selection, user detail, or module action SHALL change real accounts, permissions, packages, or services.

#### Scenario: Administrator filters users and returns from detail

- **WHEN** a preview administrator filters fixture users by role and opens a matching user
- **THEN** the detail shows that fixture, provides a return path preserving the filter, and performs no real authorization change

##### Example: Two fixture users

- **GIVEN** Demo Creator has role creator and Demo Buyer has role buyer
- **WHEN** creator is selected and Demo Creator detail is opened then closed
- **THEN** only Demo Creator remains in the filtered list and both fixture records are unchanged

#### Scenario: Administrator inspects a module version

- **WHEN** a preview administrator opens a module version detail
- **THEN** fixture version and compatibility information appear without running an update or rollback

##### Example: Course module

- **GIVEN** a fixture course module has version demo-1
- **WHEN** its version detail is opened
- **THEN** demo-1 is shown with a demonstration label and no package files are changed

### Requirement: Creator workflows SHALL preserve product editing and selected delivery

Creator views SHALL support course, bundle, standalone code package, and SaaS demonstration products with one-time or monthly, quarterly, yearly billing. They SHALL preserve the existing model validation, saved-record restoration, exact resource selection, search/filter composition, and error input retention. Names SHALL contain 1–100 trimmed characters and prices SHALL be integer TWD values from 1 to 2147483647. A course SHALL select exactly one known course, a bundle at least two, and standalone code or SaaS SHALL NOT require course membership. CRM/live fixtures SHALL support list, filter, detail and return paths without provider actions.

#### Scenario: Saved quarterly bundle is restored

- **WHEN** a valid quarterly bundle is saved and reopened after reload
- **THEN** name, amount, interval, selected courses, status, and attachments are restored

##### Example: Explicit bundle resources

- **GIVEN** Creator Bundle selects course-ai and course-saas at 1200 TWD per quarter
- **WHEN** it is saved, reloaded, and edited
- **THEN** its price is 1200, interval is quarter, and course-product remains unselected

#### Scenario: Invalid product preserves entered data

- **WHEN** a product has an empty name, a name longer than 100 characters, invalid amount, unknown resource, or invalid course count
- **THEN** saving is blocked, the first invalid field is identified and focused, entered values remain present, and stored records are unchanged

##### Example: Single course cannot grant two courses

- **GIVEN** a course form selects course-ai and course-saas with valid name and amount
- **WHEN** save is submitted
- **THEN** the course selection error appears and neither selection is silently discarded

### Requirement: Buyer previews SHALL show acquired snapshots rather than global access

Buyers SHALL see published demonstration products and explicitly simulate acquisition without payment or real entitlement writes. The acquired library SHALL show only stored resource snapshots, provide clear course/code/SaaS detail and return paths, start empty before acquisition, and preserve existing grants after later product edits. Duplicate acquisition SHALL NOT duplicate the snapshot. Draft products SHALL NOT be acquired.

#### Scenario: Buyer sees only acquired resources

- **WHEN** a buyer simulates acquisition of a published bundle
- **THEN** only that bundle's resources appear in the acquired library and login or role switching does not unlock all courses

##### Example: Acquisition survives later editing

- **GIVEN** bundle B grants course-ai and course-saas
- **WHEN** B is acquired twice, then its current product replaces course-saas with course-product
- **THEN** one stored acquisition remains, containing course-ai and course-saas but not course-product

#### Scenario: Independent code or SaaS does not force course access

- **WHEN** a buyer simulates acquisition of a standalone code package or SaaS product
- **THEN** its corresponding demonstration entry appears without unrelated courses or a real download/login action

##### Example: SaaS-only product

- **GIVEN** published product S grants a SaaS service entry with no courses or code attachment
- **WHEN** S is acquired
- **THEN** only the SaaS entry is added and its detail explains downstream access is separate from platform course access

### Requirement: Unconnected workflows SHALL disclose their acceptance boundary

Every local role and screen SHALL visibly distinguish operable fixture workflows from design-only configuration and unconnected external services. A visible control SHALL perform its documented local action or disclose why it is unavailable. No screen SHALL report a real payment, message, stream, deployment, permission update, or settings save that was not executed.

#### Scenario: Creator inspects an unconnected setting

- **WHEN** a creator opens payment or domain settings
- **THEN** the screen identifies its design-only status, does not read credentials, and cannot falsely report a provider connection or saved setting

##### Example: Payment settings sketch

- **GIVEN** no local payment provider is connected
- **WHEN** the payment settings view is opened
- **THEN** PAYUNi is described as the existing production integration reference and the local status is unconnected, with no credential or charge request

### Requirement: Shell transitions and storage failures SHALL preserve recoverability

The main shell SHALL preserve version 1 records under the existing dedicated key, fail closed on corrupt/unsupported storage, and retain entered values on write failure. Navigation away from a dirty editor SHALL provide stay/discard choices before switching. Role/module/submenu transitions SHALL expose their selected location, restore an actionable focus target, and preserve the core task at desktop and mobile sizes.

#### Scenario: User stays in an unsaved editor

- **WHEN** navigation is requested after editing a product without saving
- **THEN** the user can remain in the editor with entered data intact or explicitly discard and navigate

##### Example: Unsaved product name

- **GIVEN** a new form contains Unsaved Product and no successful save has occurred
- **WHEN** settings is selected and the user chooses stay
- **THEN** Unsaved Product remains entered and no settings view or stored product replaces it

#### Scenario: Storage failure cannot masquerade as success

- **WHEN** browser storage rejects a write or contains invalid JSON or an unsupported version
- **THEN** the shell reports the failure without overwriting data or displaying save success

##### Example: Unsupported storage version

- **GIVEN** the dedicated storage contains version 2 data
- **WHEN** a version 1 save is attempted
- **THEN** the original stored bytes remain unchanged and an actionable storage-version error is shown
