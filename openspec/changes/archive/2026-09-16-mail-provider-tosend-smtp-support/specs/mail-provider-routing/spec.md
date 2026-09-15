## Purpose

Mail provider routing selects which outbound email transport (Resend, SMTP, ZSend, or ToSend) `packages/mail` uses to send a message, based on the `EMAIL_PROVIDER` environment variable and the credentials actually available at runtime, so a missing or misconfigured provider degrades to another usable provider instead of silently failing every send.

## ADDED Requirements

### Requirement: Provider selection by EMAIL_PROVIDER

The system SHALL select the email provider named by the `EMAIL_PROVIDER` environment variable (`resend`, `smtp`, `zsend`, or `tosend`) when that provider's required credential is present.

#### Scenario: Explicit provider with valid credential

- **WHEN** `EMAIL_PROVIDER=tosend` and `TOSEND_API_KEY` is set
- **THEN** the system SHALL send the message through the ToSend provider

#### Scenario: Explicit provider value is not a recognized provider name

- **WHEN** `EMAIL_PROVIDER` is set to a value other than `resend`, `smtp`, `zsend`, or `tosend`
- **THEN** the system SHALL treat the provider as unspecified and SHALL apply the fallback chain in Requirement: Provider fallback chain

### Requirement: Provider fallback chain

When the provider named by `EMAIL_PROVIDER` is unspecified, or its required credential is missing, the system SHALL check providers in the order ZSend, ToSend, Resend, SMTP, and SHALL use the first provider whose required credential is present.

#### Scenario: Named provider missing credential falls back to next available

- **WHEN** `EMAIL_PROVIDER=tosend`, `TOSEND_API_KEY` is unset, and `RESEND_API_KEY` is set
- **THEN** the system SHALL send the message through the Resend provider

#### Scenario: No EMAIL_PROVIDER set, first available in fallback order wins

- **WHEN** `EMAIL_PROVIDER` is unset, `ZSEND_API_KEY` is unset, `TOSEND_API_KEY` is set, and `RESEND_API_KEY` is set
- **THEN** the system SHALL send the message through the ToSend provider

##### Example: fallback chain resolution

| EMAIL_PROVIDER | ZSEND_API_KEY | TOSEND_API_KEY | RESEND_API_KEY | SMTP_HOST | Selected provider |
| --- | --- | --- | --- | --- | --- |
| tosend | absent | present | present | absent | tosend |
| tosend | absent | absent | present | absent | resend |
| unset | absent | absent | absent | present | smtp |
| zsend | absent | present | present | present | tosend |

### Requirement: No provider configured in production

The system SHALL raise an error when no provider in the fallback chain has its required credential present and `NODE_ENV` is `production`.

#### Scenario: Production environment with zero configured providers

- **WHEN** `NODE_ENV=production`, and `ZSEND_API_KEY`, `TOSEND_API_KEY`, `RESEND_API_KEY`, `SMTP_HOST` are all unset
- **THEN** the system SHALL throw an error identifying that no email provider is configured, and SHALL NOT silently discard the message

### Requirement: No provider configured outside production

The system SHALL fall back to the console provider (log the message instead of sending it) when no provider in the fallback chain has its required credential present and `NODE_ENV` is not `production`.

#### Scenario: Development environment with zero configured providers

- **WHEN** `NODE_ENV` is not `production`, and `ZSEND_API_KEY`, `TOSEND_API_KEY`, `RESEND_API_KEY`, `SMTP_HOST` are all unset
- **THEN** the system SHALL send the message through the console provider and SHALL NOT throw an error

### Requirement: ToSend provider sends via REST API

The system SHALL send email through the ToSend provider by issuing `POST {TOSEND_API_BASE_URL}/emails` (default base URL `https://api.tosend.com/v2` when `TOSEND_API_BASE_URL` is unset) with an `Authorization: Bearer {TOSEND_API_KEY}` header.

#### Scenario: ToSend API returns a non-2xx status

- **WHEN** the ToSend provider is selected and the API responds with a non-2xx HTTP status
- **THEN** the system SHALL throw an error containing the response status code

#### Scenario: ToSend API returns a 2xx status

- **WHEN** the ToSend provider is selected and the API responds with a 2xx HTTP status
- **THEN** the system SHALL resolve successfully regardless of the response body shape

### Requirement: ZSend provider sends via REST API

The system SHALL send email through the ZSend provider by issuing `POST https://api.zeabur.com/api/v1/zsend/emails` with an `Authorization: Bearer {ZSEND_API_KEY}` header.

#### Scenario: ZSend API returns a non-2xx status

- **WHEN** the ZSend provider is selected and the API responds with a non-2xx HTTP status
- **THEN** the system SHALL throw an error containing the response status code

### Requirement: SMTP provider connection configuration

The system SHALL configure the SMTP transport from `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE` environment variables, treating `SMTP_SECURE` as true only when its value is exactly `"true"`.

#### Scenario: SMTP_HOST unset means SMTP provider unavailable

- **WHEN** `SMTP_HOST` is unset
- **THEN** the system SHALL treat the SMTP provider as having no required credential present, for the purpose of Requirement: Provider fallback chain
