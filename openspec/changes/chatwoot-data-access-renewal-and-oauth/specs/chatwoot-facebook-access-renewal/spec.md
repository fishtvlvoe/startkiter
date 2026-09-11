## ADDED Requirements

### Requirement: Facebook page channel token maintains a valid data access window

The Fishtv Facebook page channel connected to Chatwoot SHALL have a `data_access_expires_at` value later than the current execution time after an operator completes an interactive OAuth reconnect.

#### Scenario: Token renewed after OAuth reconnect

- **WHEN** the page administrator completes the interactive OAuth reconnect flow for the Fishtv page channel inside Chatwoot
- **THEN** the channel's `data_access_expires_at` SHALL be later than the current execution time

#### Scenario: Stale token before reconnect

- **WHEN** the page administrator inspects the Fishtv page channel before running OAuth reconnect
- **THEN** the system SHALL report the existing `data_access_expires_at` value as stale (dated in the past) rather than silently treating it as valid

### Requirement: Meta data access renewal assessment reaches a completed state

The `opcos` Meta App SHALL complete the "data access renewal assessment" flow in Meta Developer Console before the app can be switched to Live mode.

#### Scenario: Assessment completed unblocks Live switch

- **WHEN** the operator completes the "data access renewal assessment" flow in Meta Developer Console for the `opcos` App
- **THEN** Meta Developer Console SHALL no longer display a data-access block preventing the App from switching to Live mode

#### Scenario: Assessment incomplete keeps Live switch blocked

- **WHEN** the "data access renewal assessment" flow has not been completed
- **THEN** the App switch to Live mode SHALL remain blocked and MUST NOT be reported as available

### Requirement: pages_messaging allowed-usage form completes and reaches submission

The `pages_messaging` App Review "允許的使用方式" (allowed use case) form SHALL persist the selected Fishtv page and confirmed usage checkboxes across a page reload, and the submission SHALL reach the "提交檢閱" (submit for review) action.

#### Scenario: Page selection persists after save

- **WHEN** the operator selects the Fishtv page and confirms the required usage checkboxes in the allowed-usage form and saves
- **THEN** reloading the form SHALL show the Fishtv page still selected and the Requests section SHALL show all required items as completed

#### Scenario: Submission for review succeeds

- **WHEN** the Requests section shows all required items as completed
- **THEN** the operator SHALL be able to click "提交檢閱" and the submission SHALL be accepted by Meta without an incomplete-requests error

### Requirement: Real Facebook tester account assigned for App Review

The `opcos` Meta App SHALL have at least one real Facebook account (not an App-internal test user) assigned the Tester role for `pages_messaging` review purposes.

#### Scenario: Tester role assignment accepted

- **WHEN** the operator adds a real Facebook account as Tester in the `opcos` App's Roles settings
- **THEN** Meta SHALL accept the account as a valid reviewer/tester distinct from App-internal test users

#### Scenario: App-internal test user rejected for review

- **WHEN** only an App-internal test user exists without a real Tester account
- **THEN** Meta App Review SHALL NOT treat the submission's tester requirement as satisfied
