## ADDED Requirements

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

### Requirement: Providers send with supplied credentials

Each provider (ZSend, ToSend, Resend, SMTP) SHALL send using credentials passed in by the router instead of reading `process.env` directly. The environment-variable path SHALL build those credentials from the same variable names used today (`ZSEND_API_KEY`, `TOSEND_API_KEY`, `TOSEND_API_BASE_URL`, `TOSEND_FROM_EMAIL`, `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`).

#### Scenario: Resend client per key

- **WHEN** two sends use Resend with different API keys
- **THEN** each send authenticates with its own key

##### Example: Two keys, two clients

- **GIVEN** stored settings use `resendApiKey=re_db_key` and a later send runs with no stored settings and `RESEND_API_KEY=re_env_key`
- **WHEN** both sends complete
- **THEN** the first request is authenticated with `re_db_key` and the second with `re_env_key`

### Requirement: Stored settings cache

The router SHALL cache decoded stored settings in process for at most 30 seconds and SHALL clear the cache after a successful save, so the next send after a save uses the new settings.

#### Scenario: Save clears cache

- **WHEN** settings were read within the last 30 seconds and an administrator saves a new provider
- **THEN** the next send uses the newly saved provider
