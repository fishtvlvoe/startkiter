## ADDED Requirements

### Requirement: Meta page webhook remains subscribed for Chatwoot
The support stack MUST keep the Meta application page webhook callback at `https://support.startkiter.dev/bot` active with the `messages` field subscribed for the Facebook Page connected to Chatwoot.

#### Scenario: App subscription health check
- **WHEN** an operator queries the Meta app page subscriptions for the configured Facebook app
- **THEN** the response MUST show object `page`, callback URL `https://support.startkiter.dev/bot`, `active` true, and a `messages` field entry

#### Scenario: Page subscribed apps include messaging fields
- **WHEN** an operator queries subscribed apps for the connected Facebook Page
- **THEN** the configured Meta app MUST appear with `messages` among subscribed fields

### Requirement: Development mode restricts inbound senders
While the Meta application remains in development mode, Chatwoot Facebook messaging MUST document and treat inbound Messenger delivery as limited to Meta app role users (admin, developer, or tester).

#### Scenario: Document development gate
- **WHEN** an operator reads the Facebook messaging runbook while the app is in development mode
- **THEN** the runbook MUST state that non-role personal Facebook accounts are not expected to create Chatwoot conversations

##### Example: development gate wording
- **GIVEN** Meta app `opcos` is in development mode and the Fishtv Page inbox exists
- **WHEN** an operator opens `docs/chatwoot-facebook-messaging.md`
- **THEN** the document contains wording that only Meta app role users (admin, developer, or tester) are expected to create inbound Chatwoot conversations

### Requirement: Live mode accepts non-role fan messages on the connected page
After the Meta application is Live with approved `pages_messaging` (or equivalent messaging permission Meta requires), a personal Facebook user who is not listed in the app roles MUST be able to message the connected Page and create a conversation in the Chatwoot Facebook inbox for that Page.

#### Scenario: Non-role inbound acceptance
- **WHEN** the Meta app is Live with messaging permission approved AND a non-role personal account sends a new Messenger text to the connected Page
- **THEN** Chatwoot MUST create or update a conversation in that Page inbox containing the new text

##### Example: fan DM after Live
- **GIVEN** Meta app is Live with `pages_messaging` approved and sender account is absent from app roles
- **WHEN** that sender sends Messenger text `路人測試` to Page id `660594740619142`
- **THEN** Chatwoot inbox `Fishtv余啟彰 (fishotcom)` contains a conversation whose latest inbound message text is `路人測試`

### Requirement: Customer-owned pages bind as separate Chatwoot inboxes
The system MUST treat each Facebook Page OAuth connection in Chatwoot as its own inbox. Binding a customer-owned Page MUST NOT reuse the Fishtv Page inbox as a shared destination for that customer's Page traffic.

#### Scenario: Separate inbox per page
- **WHEN** an operator connects a second Facebook Page through Chatwoot Facebook channel setup using the shared Meta app after Live eligibility
- **THEN** Chatwoot MUST expose a distinct inbox for that Page separate from the Fishtv Page inbox

##### Example: second page gets own inbox
- **GIVEN** inbox `Fishtv余啟彰 (fishotcom)` already exists for Page id `660594740619142`
- **WHEN** an operator completes Facebook channel OAuth for a different Page id `P2`
- **THEN** Chatwoot lists a second Facebook inbox whose channel page id is `P2` and MUST NOT route `P2` traffic into the Fishtv inbox

### Requirement: Public legal URLs exist for Meta App Review
The Meta application used by Chatwoot MUST have publicly reachable HTTPS Privacy Policy and Terms of Service URLs suitable for App Review forms.

#### Scenario: Legal URLs return success
- **WHEN** an operator requests the configured Privacy Policy and Terms URLs over HTTPS
- **THEN** each URL MUST return HTTP 200 with an HTML document body
