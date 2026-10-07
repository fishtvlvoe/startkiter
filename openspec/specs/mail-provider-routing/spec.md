# mail-provider-routing Specification

## Purpose

Mail provider routing selects which outbound email transport (Resend, SMTP, ZSend, or ToSend) `packages/mail` uses to send a message, based on the `EMAIL_PROVIDER` environment variable and the credentials actually available at runtime, so a missing or misconfigured provider degrades to another usable provider instead of silently failing every send.

## Requirements

### Requirement: Provider selection by EMAIL_PROVIDER

The system SHALL select the email provider named by the `EMAIL_PROVIDER` environment variable (`resend`, `smtp`, `zsend`, or `tosend`) when that provider's required credential is present.

#### Scenario: Explicit provider with valid credential

- **WHEN** `EMAIL_PROVIDER=tosend` and `TOSEND_API_KEY` is set
- **THEN** the system SHALL send the message through the ToSend provider

#### Scenario: Explicit provider value is not a recognized provider name

- **WHEN** `EMAIL_PROVIDER` is set to a value other than `resend`, `smtp`, `zsend`, or `tosend`
- **THEN** the system SHALL treat the provider as unspecified and SHALL apply the fallback chain in Requirement: Provider fallback chain


<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
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


<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
### Requirement: No provider configured in production

The system SHALL raise an error when no provider in the fallback chain has its required credential present and `NODE_ENV` is `production`.

#### Scenario: Production environment with zero configured providers

- **WHEN** `NODE_ENV=production`, and `ZSEND_API_KEY`, `TOSEND_API_KEY`, `RESEND_API_KEY`, `SMTP_HOST` are all unset
- **THEN** the system SHALL throw an error identifying that no email provider is configured, and SHALL NOT silently discard the message


<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
### Requirement: No provider configured outside production

The system SHALL fall back to the console provider (log the message instead of sending it) when no provider in the fallback chain has its required credential present and `NODE_ENV` is not `production`.

#### Scenario: Development environment with zero configured providers

- **WHEN** `NODE_ENV` is not `production`, and `ZSEND_API_KEY`, `TOSEND_API_KEY`, `RESEND_API_KEY`, `SMTP_HOST` are all unset
- **THEN** the system SHALL send the message through the console provider and SHALL NOT throw an error


<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
### Requirement: ToSend provider sends via REST API

The system SHALL send email through the ToSend provider by issuing `POST {TOSEND_API_BASE_URL}/emails` (default base URL `https://api.tosend.com/v2` when `TOSEND_API_BASE_URL` is unset) with an `Authorization: Bearer {TOSEND_API_KEY}` header.

#### Scenario: ToSend API returns a non-2xx status

- **WHEN** the ToSend provider is selected and the API responds with a non-2xx HTTP status
- **THEN** the system SHALL throw an error containing the response status code

#### Scenario: ToSend API returns a 2xx status

- **WHEN** the ToSend provider is selected and the API responds with a 2xx HTTP status
- **THEN** the system SHALL resolve successfully regardless of the response body shape


<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
### Requirement: ZSend provider sends via REST API

The system SHALL send email through the ZSend provider by issuing `POST https://api.zeabur.com/api/v1/zsend/emails` with an `Authorization: Bearer {ZSEND_API_KEY}` header.

#### Scenario: ZSend API returns a non-2xx status

- **WHEN** the ZSend provider is selected and the API responds with a non-2xx HTTP status
- **THEN** the system SHALL throw an error containing the response status code


<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
### Requirement: SMTP provider connection configuration

The system SHALL configure the SMTP transport from `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE` environment variables, treating `SMTP_SECURE` as true only when its value is exactly `"true"`.

#### Scenario: SMTP_HOST unset means SMTP provider unavailable

- **WHEN** `SMTP_HOST` is unset
- **THEN** the system SHALL treat the SMTP provider as having no required credential present, for the purpose of Requirement: Provider fallback chain

<!-- @trace
source: mail-provider-tosend-smtp-support
updated: 2026-09-16
code:
  - apps/saas/.env.example
  - packages/mail/provider/index.ts
  - packages/mail/provider/nodemailer.ts
  - packages/mail/provider/zsend.ts
  - packages/mail/provider/tosend.ts
tests:
  - packages/mail/provider/index.test.ts
  - packages/mail/provider/zsend.test.ts
  - packages/mail/provider/nodemailer.test.ts
  - packages/mail/provider.test.ts
  - packages/mail/provider/tosend.test.ts
-->

---
### Requirement: Stored settings take precedence over environment

The mail provider router SHALL first read the `email-provider-config` stored settings. When the stored `provider` is set and that provider's required credential is present in the stored settings, the router SHALL send through that provider using the stored credentials. Otherwise the router SHALL apply the existing environment-variable selection, fallback chain, production error, and non-production console behavior unchanged. When a stored provider lacks its credential, the router SHALL log a warning through `logger.warn` before falling back.

##### Example: Precedence

| Stored settings | Environment | Selected provider |
| --------------- | ----------- | ----------------- |
| provider=tosend, tosendApiKey set | EMAIL_PROVIDER=resend, RESEND_API_KEY set | tosend (stored credentials) |
| provider=smtp, smtpHost empty | TOSEND_API_KEY set | tosend (env), warning logged |
| none | ZSEND_API_KEY set | zsend (env) |
| decryption fails | RESEND_API_KEY set | resend (env), warning logged |

#### Scenario: Stored ToSend overrides env

- **WHEN** stored settings contain `provider=tosend` with `tosendApiKey` and the environment sets `EMAIL_PROVIDER=resend` with `RESEND_API_KEY`
- **THEN** the email is sent through ToSend with the stored API key and Resend is not called

#### Scenario: Stored provider missing credential

- **WHEN** stored settings contain `provider=smtp` without `smtpHost` and the environment has `TOSEND_API_KEY`
- **THEN** the email is sent through ToSend using environment credentials and `logger.warn` is called once

#### Scenario: Unreadable stored settings

- **WHEN** the stored ciphertext cannot be decrypted
- **THEN** the router treats stored settings as absent, logs a warning, and does not throw because of the decryption failure

##### Example: Decryption failure falls back to environment

- **GIVEN** the `email-provider-config` row was encrypted with an old `SETTINGS_ENCRYPTION_KEY` and the environment sets `RESEND_API_KEY=re_env_key`
- **WHEN** the router sends a welcome email
- **THEN** Resend is called with `re_env_key`, `logger.warn` is called once, and the send resolves without error


<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Providers send with supplied credentials

Each provider (ZSend, ToSend, Resend, SMTP) SHALL send using credentials passed in by the router instead of reading `process.env` directly. The environment-variable path SHALL build those credentials from the same variable names used today (`ZSEND_API_KEY`, `TOSEND_API_KEY`, `TOSEND_API_BASE_URL`, `TOSEND_FROM_EMAIL`, `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`).

#### Scenario: Resend client per key

- **WHEN** two sends use Resend with different API keys
- **THEN** each send authenticates with its own key

##### Example: Two keys, two clients

- **GIVEN** stored settings use `resendApiKey=re_db_key` and a later send runs with no stored settings and `RESEND_API_KEY=re_env_key`
- **WHEN** both sends complete
- **THEN** the first request is authenticated with `re_db_key` and the second with `re_env_key`


<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Stored settings cache

The router SHALL cache decoded stored settings in process for at most 30 seconds and SHALL clear the cache after a successful save, so the next send after a save uses the new settings.

#### Scenario: Save clears cache

- **WHEN** settings were read within the last 30 seconds and an administrator saves a new provider
- **THEN** the next send uses the newly saved provider

<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->