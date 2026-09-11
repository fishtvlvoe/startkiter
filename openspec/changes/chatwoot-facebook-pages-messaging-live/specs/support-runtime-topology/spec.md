## ADDED Requirements

### Requirement: Facebook Messenger channel facts are part of support topology docs
Support topology documentation MUST record the Chatwoot Facebook Messenger integration facts needed for operations: Meta app identity, webhook callback URL, connected Page identity for the Fishtv channel, and whether the Meta app is in development or Live mode.

#### Scenario: Operator finds Messenger facts in topology docs
- **WHEN** an operator opens `docs/support-runtime-topology.md` after this change is applied
- **THEN** that document MUST include the Meta app id or name, the webhook callback `https://support.startkiter.dev/bot`, the Fishtv Page channel name or Page id, and the current development-versus-Live statement

#### Scenario: Product channel remains email by default
- **WHEN** an operator reads support topology docs for customer-facing support channel policy
- **THEN** the docs MUST still state that the product default support channel remains email unless explicitly changed, even if Chatwoot Facebook messaging is operational for the support host

##### Example: email remains default after Messenger ops docs
- **GIVEN** Chatwoot Facebook messaging facts are documented in `docs/support-runtime-topology.md`
- **WHEN** an operator searches that document for the product support channel policy
- **THEN** the document still states the product default support channel is email unless explicitly changed
