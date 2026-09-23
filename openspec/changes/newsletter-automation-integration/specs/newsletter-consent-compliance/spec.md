## Purpose

Newsletter consent compliance is the legal foundation of the newsletter system: it records each user's marketing and general-email consent as the single source of truth, gates every outbound newsletter send through one function, and gives users an always-working, login-free way to withdraw consent — so promotional email is never sent to someone who has not opted in, and transactional email is never blocked by mistake.

## ADDED Requirements

### Requirement: User consent fields as single source of truth

The system SHALL store `marketingConsent`, `marketingConsentAt`, `marketingConsentSource`, `marketingConsentIp`, `generalEmailConsent`, `generalEmailConsentAt`, `unsubscribedAt`, `emailInvalidAt`, `emailBounceState`, and `emailBounceCount` on the `User` model, and every send path SHALL read these fields rather than any external list.

#### Scenario: New user has no explicit marketing consent

- **WHEN** a user record is created without an explicit marketing consent value
- **THEN** the system SHALL store `marketingConsent` as `null`

### Requirement: Unified consent gate assertEmailConsent

The system SHALL provide a single function `assertEmailConsent(userId, type)` where `type` is `transactional`, `general`, or `marketing`, and every code path that sends a newsletter or general email SHALL call it before dispatch.

#### Scenario: Transactional type is always allowed

- **WHEN** `assertEmailConsent` is called with `type="transactional"` for a user whose `emailInvalidAt` is `null`
- **THEN** the system SHALL return `allowed: true` regardless of `marketingConsent` or `generalEmailConsent` value

#### Scenario: Hard-bounced user blocks even transactional type

- **WHEN** `assertEmailConsent` is called with `type="transactional"` for a user whose `emailInvalidAt` is not `null`
- **THEN** the system SHALL return `allowed: false`

#### Scenario: Marketing type requires explicit true

- **WHEN** `assertEmailConsent` is called with `type="marketing"` for a user whose `marketingConsent` is `null` or `false`
- **THEN** the system SHALL return `allowed: false`

#### Scenario: General type follows opt-out default

- **WHEN** `assertEmailConsent` is called with `type="general"` for a user whose `generalEmailConsent` is `true` and `unsubscribedAt` is `null`
- **THEN** the system SHALL return `allowed: true`

### Requirement: Consent gate is not embedded in the mail transport layer

The system SHALL invoke `assertEmailConsent` at the business-logic call site immediately before a newsletter send, and SHALL NOT invoke it inside `packages/mail`'s provider routing or transport code.

#### Scenario: Transactional welcome email bypasses the newsletter consent gate entirely

- **WHEN** the existing course welcome-email flow sends a transactional email
- **THEN** the system SHALL NOT route that call through `assertEmailConsent` for `type="marketing"` or `type="general"`, and the email SHALL send exactly as it did before this capability existed

### Requirement: Consent audit log

The system SHALL append an immutable `EmailConsentLog` record for every consent grant or revocation, capturing `userId`, `email`, `consentType`, `action`, `source`, and `createdAt`.

#### Scenario: Checkout consent checkbox writes an audit record

- **WHEN** a user checks the marketing-consent checkbox during checkout and submits
- **THEN** the system SHALL create an `EmailConsentLog` record with `consentType="MARKETING"`, `action="GRANTED"`, and `source="checkout"`

### Requirement: HMAC unsubscribe token

The system SHALL generate unsubscribe links using an HMAC-SHA256 token computed as `HMAC(NEWSLETTER_UNSUBSCRIBE_SECRET, userId + ":" + email + ":" + scope)` where `scope` is `all`, `marketing`, or `general`, and SHALL NOT persist the token in the database.

#### Scenario: Token scope is bound into the signature

- **WHEN** a valid token computed for `scope="marketing"` is presented with its scope parameter changed to `"all"`
- **THEN** the system SHALL reject the token as invalid

#### Scenario: Unsubscribe secret is independent of the auth secret

- **WHEN** the system computes an unsubscribe token
- **THEN** the system SHALL use the `NEWSLETTER_UNSUBSCRIBE_SECRET` environment variable and SHALL NOT use `BETTER_AUTH_SECRET` or any authentication session secret

### Requirement: Unsubscribe page separates read from write

The system SHALL render the unsubscribe preference page on `GET` without writing to the database, and SHALL only persist an unsubscribe action on `POST`.

#### Scenario: Email client link prefetch does not unsubscribe the user

- **WHEN** an email client prefetches the unsubscribe link with a `GET` request before the user clicks it
- **THEN** the system SHALL NOT change any consent field, and the user's consent state SHALL remain unchanged until they submit the page

#### Scenario: General unsubscribe does not affect marketing or transactional consent

- **WHEN** a user submits the unsubscribe page with `scope="general"`
- **THEN** the system SHALL set `generalEmailConsent` to `false` and SHALL NOT change `marketingConsent`, and `assertEmailConsent(userId, "transactional")` SHALL still return `allowed: true`

### Requirement: Compliant footer with sender address gate

The system SHALL require a sender physical address to be configured before any promotional campaign can be activated, and SHALL inject the address and an unsubscribe link into every general and marketing email footer.

#### Scenario: Missing sender address blocks campaign activation

- **WHEN** an operator attempts to send or schedule a promotional campaign while the sender physical address setting is empty
- **THEN** the system SHALL block the action and SHALL display the reason
