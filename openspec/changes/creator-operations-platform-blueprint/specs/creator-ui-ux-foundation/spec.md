## Purpose

This capability defines the reusable UI and UX contracts that let StartKiter creators complete platform tasks consistently across modules. It separates task flow, page states, responsive behavior, accessibility, and design handoff from any single feature implementation.

## ADDED Requirements

### Requirement: Local navigation previews SHALL show contextual submenus

The local creator preview SHALL show top-level module navigation, a contextual submenu, and a content region with the current location. Changing the module SHALL replace the submenu; changing a product subtype SHALL filter the existing local products without changing their saved records. Platform administrator sketches and buyer previews SHALL be explicitly distinguished from creator operations and SHALL NOT imply real authorization. Unimplemented module screens SHALL identify their design-only status. Mobile SHALL expose the same submenu destinations through an expandable control.

#### Scenario: Creator moves from products to settings

- **WHEN** the creator switches from products to settings in the local demo
- **THEN** the left submenu changes from product destinations to settings destinations and the right region identifies the selected setting without discarding local products

##### Example: Independent code product then payment setting

- **GIVEN** four seeded local product types exist
- **WHEN** the creator selects products and standalone code, then settings and payment
- **THEN** the product list first shows only the code product, and the settings sketch shows payment configuration with an unconnected status

#### Scenario: Mobile and role previews retain clear boundaries

- **WHEN** the user opens a mobile submenu or switches to the platform administrator sketch or buyer preview
- **THEN** the selected destination remains visible, the role is labeled, and no real permission or provider mutation occurs

##### Example: Administrator role sketch

- **GIVEN** the creator product workflow is open
- **WHEN** platform administrator preview is selected
- **THEN** platform user and module destinations replace the creator submenu and the screen states that administration is a layout preview, not a real authenticated role

### Requirement: A local acceptance workspace SHALL support isolated product workflows

The local acceptance workspace SHALL support course, bundle, standalone code package, and SaaS demonstration products with one-time or monthly, quarterly, yearly billing. It SHALL validate explicit resource selection, persist versioned demonstration records in a dedicated browser storage key, and restore saved values after reload. It SHALL NOT access production accounts, orders, providers, or credentials. Failed or corrupt storage SHALL prevent writes and display an actionable explanation without replacing stored data.

#### Scenario: Creator saves and reopens a bundle

- **WHEN** the creator saves a valid demonstration bundle and reloads the page
- **THEN** the list and editor preserve its name, price, interval, and selected courses

##### Example: Quarterly bundle persists

- **GIVEN** a bundle named Creator Bundle selects course-ai and course-saas, priced at 1200 TWD per quarter
- **WHEN** it is saved and reopened after reload
- **THEN** both selected courses and the quarterly price remain unchanged, and no production mutation occurs

#### Scenario: Invalid input or storage prevents saving

- **WHEN** product input is invalid or versioned browser storage cannot be safely read or written
- **THEN** the workspace preserves entered values, displays an error, and does not report success or overwrite corrupt storage

##### Example: Invalid course count and corrupt storage

- **GIVEN** a course product selects two courses, or the dedicated storage contains invalid JSON
- **WHEN** a save is attempted
- **THEN** validation or storage failure blocks the save and the previous stored bytes remain unchanged

### Requirement: Local buyer and operations previews SHALL be explicitly simulated

The buyer preview SHALL start without acquired content, allow explicitly simulated acquisition of a published demonstration product, and display only its selected resource snapshot. Later product edits SHALL NOT modify previously acquired snapshots. CRM and live demonstration screens SHALL provide search, filters, detail and return paths without sending messages, streaming media, or granting real access. Every preview SHALL visibly identify its local simulated boundary.

#### Scenario: Buyer acquires selected content without global access

- **WHEN** the user simulates acquisition of a published demonstration product
- **THEN** only that product's selected resources appear in the buyer library and no real authorization or payment is performed

##### Example: Bundle acquisition survives product editing

- **GIVEN** bundle B contains course-ai and course-saas, while course-product is not included
- **WHEN** B is simulated as acquired, then B is edited to select course-product instead of course-saas
- **THEN** the acquired library still shows only course-ai and course-saas; repeated acquisition of B does not duplicate the snapshot

#### Scenario: Operations previews remain isolated

- **WHEN** the user filters and opens a demonstration contact or webinar
- **THEN** the detail shows the selected fixture and a return action, with no external service request

##### Example: Evergreen details without streaming

- **GIVEN** the local activity fixtures include one live and one evergreen event
- **WHEN** evergreen is selected and its detail opened
- **THEN** only the evergreen fixture is listed, detail identifies simulated delivery, and no provider is invoked

### Requirement: Creator screens SHALL expose a task-oriented screen contract

Every creator-facing screen SHALL declare its purpose, primary task, primary action, required inputs, next step, permission boundary, and recovery path before implementation. A screen SHALL NOT require the user to understand internal route names or module ownership to complete its primary task.

#### Scenario: Creator opens a management screen

- **WHEN** a creator opens a supported management screen
- **THEN** the screen presents a plain-language purpose, one primary action, the relevant records, and a visible next step or recovery action

##### Example: Concrete acceptance fixture 1

- **GIVEN** U1 can manage W1 offers and Offer A exists
- **WHEN** U1 opens offer management
- **THEN** purpose, Offer A, create action and edit/return path are visible without exposing internal ownership

#### Scenario: Creator lacks permission for a task

- **WHEN** a signed-in member opens a screen outside the member's capability scope
- **THEN** the screen returns the platform permission-denied state with an actionable explanation and does not expose unauthorized records or mutation controls

##### Example: Concrete acceptance fixture 2

- **GIVEN** U2 lacks W1 offer mutation capability
- **WHEN** U2 enters the offer editor
- **THEN** permission-denied explanation appears, protected values and mutation controls are absent

### Requirement: Creator management screens SHALL use a shared interaction contract

Lists, forms, detail views, and action menus SHALL use shared contracts for search, filter, sort, pagination, validation, save status, destructive-action confirmation, and post-action feedback. A module SHALL extend the shared contract only when the extension is documented with its additional behavior.

#### Scenario: Creator views an empty list

- **WHEN** a permitted creator opens a list with no records
- **THEN** the list explains what belongs there and presents the single valid creation or recovery action without rendering a misleading empty table

##### Example: Concrete acceptance fixture 3

- **GIVEN** W1 has zero published Offers and U1 can create an Offer
- **WHEN** U1 opens the valid list
- **THEN** the empty state explains Offers and exposes create rather than an empty success table

#### Scenario: Creator submits invalid form data

- **WHEN** a creator submits a form with invalid or incomplete required data
- **THEN** field-level errors identify the invalid values, the form remains available for correction, and no partial mutation is reported as successful

##### Example: Concrete acceptance fixture 4

- **GIVEN** a draft Offer has price 0 and an empty name
- **WHEN** U1 submits the draft
- **THEN** both invalid fields are identified, the entered data remains and no Offer is created

#### Scenario: Creator completes a save action

- **WHEN** a creator successfully saves a record
- **THEN** the screen shows a success result, preserves the saved values, and provides the next relevant task without requiring a full-page reload to discover the result

##### Example: Concrete acceptance fixture 5

- **GIVEN** Offer A draft name is Beginner and price TWD 8800
- **WHEN** U1 saves valid edits
- **THEN** success displays persisted name Beginner and 8800 with the next task, without requiring reload

### Requirement: Creator workflows SHALL preserve the same core task on desktop and mobile

Every supported creator workflow SHALL define a desktop path and a 390 CSS pixel mobile path. Responsive behavior SHALL preserve access to the primary action, required fields, status feedback, and recovery action without horizontal scrolling.

#### Scenario: Creator completes a workflow on a 390 CSS pixel viewport

- **WHEN** a creator performs the documented primary task on a 390 CSS pixel viewport
- **THEN** the creator can reach the same successful outcome as on desktop without horizontal scrolling or hidden required controls

##### Example: Concrete acceptance fixture 6

- **GIVEN** Offer A is editable on both desktop and viewport width 390
- **WHEN** U1 changes its name, saves and returns on each viewport
- **THEN** both flows persist the same result and mobile status/action controls are accessible without horizontal scroll

#### Scenario: Creator encounters a long management form on mobile

- **WHEN** a mobile creator opens a form with advanced settings
- **THEN** required fields and the primary action remain visible in task order while advanced settings are progressively disclosed

##### Example: Concrete acceptance fixture 7

- **GIVEN** an Offer form has required name/price and advanced delivery settings
- **WHEN** U1 opens it at viewport width 390
- **THEN** name/price and primary action remain in task order while advanced settings can be expanded

### Requirement: Creator screens SHALL be keyboard and focus operable

Interactive creator screens SHALL expose a logical keyboard order, visible focus state, semantic labels, non-color-only validation feedback, and an accessible name for every action. Modal, menu, and error recovery controls SHALL return focus to a usable location after completion or dismissal.

#### Scenario: Keyboard user completes a form

- **WHEN** a keyboard-only user navigates a supported creator form
- **THEN** the user can reach every required field and action in logical order and can identify the focused control visually

##### Example: Concrete acceptance fixture 8

- **GIVEN** the Offer form has named inputs and Save/Cancel controls
- **WHEN** U1 uses Tab, Shift-Tab and Enter only
- **THEN** all required controls have visible focus and save can be completed with the keyboard

#### Scenario: Creator opens and closes an action menu

- **WHEN** a creator opens an action menu and closes it with Escape or a selection
- **THEN** focus returns to the triggering control or the next documented task control without leaving the workflow in an unusable state

##### Example: Concrete acceptance fixture 9

- **GIVEN** the product action trigger is focused and its menu is open
- **WHEN** U1 presses Escape
- **THEN** the menu closes and focus returns to the product trigger

### Requirement: UI design handoffs SHALL map screens to reusable StartKiter UI contracts

A UI handoff for a creator module SHALL identify the screen purpose, task flow, component contracts, page states, responsive changes, accessibility requirements, content labels, and browser acceptance assertions. The handoff SHALL use StartKiter design tokens and standard SVG icon assets and SHALL NOT introduce emoji icons or unexplained one-off interaction patterns.

An interactive HTML design preview SHALL be labeled as a proposal and SHALL NOT be used as proof that production routes, payment, email, or repository fulfillment work. The runtime shell SHALL derive authorized entries from the existing navigation/manifest contract; a visual top-menu proposal SHALL NOT introduce a second route or permission authority. Mobile management records SHALL expose their required status and primary action without horizontal scrolling, using a documented responsive presentation such as record cards.

#### Scenario: A new module receives a UI handoff

- **WHEN** a runtime SR proposes a new creator module screen
- **THEN** its design handoff maps the screen to the shared page, list, form, state, responsive, and accessibility contracts before implementation tasks begin

##### Example: Concrete acceptance fixture 10

- **GIVEN** SR-13 proposes webinar list and editor screens
- **WHEN** a UI handoff is submitted for review
- **THEN** it maps each screen to shared states, permissions, mobile flow and acceptance assertions before coding

#### Scenario: A screen uses a custom interaction

- **WHEN** a screen requires behavior outside the shared interaction contract
- **THEN** the handoff documents the reason, user-visible behavior, keyboard behavior, mobile behavior, failure states, and verification evidence required for the extension

##### Example: Concrete acceptance fixture 11

- **GIVEN** a webinar timeline needs an interaction outside the shared list contract
- **WHEN** its design handoff is reviewed
- **THEN** the exception records its reason, keyboard/mobile behavior, failure states and evidence gate

