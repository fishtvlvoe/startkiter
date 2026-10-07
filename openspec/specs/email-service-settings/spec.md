# email-service-settings Specification

## Purpose

Email service settings let a platform administrator choose the outbound email provider, enter its credentials, and set sender and newsletter details from the admin UI, so a non-technical site owner can make the site send email without editing deployment environment variables.

## Requirements

### Requirement: Platform admin saves email provider settings

The system SHALL let a platform administrator save the email provider (`zsend`, `tosend`, `resend`, or `smtp`) and that provider's credentials through a server action invoked as `POST /admin/email-settings`. The system SHALL store the settings as encrypted JSON in the `site_setting` row with id `email-provider-config`, using `SETTINGS_ENCRYPTION_KEY`. A credential field submitted as an empty string SHALL keep the previously stored value. Non-admin requests SHALL be redirected by `requireGlobalAdmin` and SHALL NOT write any row.

#### Scenario: Save ToSend credentials

- **WHEN** a platform administrator selects ToSend, enters API key `tsend_abcd1234`, and submits
- **THEN** the `site_setting` row `email-provider-config` exists with ciphertext that decrypts to JSON containing `"provider":"tosend"` and `"tosendApiKey":"tsend_abcd1234"`, and the page status shows that ToSend is in use

#### Scenario: Empty credential keeps previous value

- **WHEN** a stored ToSend API key exists and the administrator submits the form with the API key field empty
- **THEN** the stored `tosendApiKey` remains unchanged

#### Scenario: Missing encryption key

- **WHEN** `SETTINGS_ENCRYPTION_KEY` is empty and an administrator submits the form
- **THEN** the action returns `{ ok: false, error: "settings_unavailable" }`, the page shows that the server is missing its encryption key, and no row is written

#### Scenario: Non-admin cannot save

- **WHEN** a signed-in user without `admin.access` permission requests `/admin/email-settings`
- **THEN** the request is redirected to `/` and the `email-provider-config` row is unchanged


<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Settings input validation

The system SHALL reject a save with `{ ok: false, error: "invalid_input" }` when `fromEmail`, `newsletterReplyTo`, or `footerEmail` is non-empty and not a valid email address, when `smtpPort` is outside 1–65535, or when `newsletterRatePerMinute` is outside 1–600. Empty optional fields SHALL be accepted.

##### Example: Validation boundaries

| Field | Input | Result |
| ----- | ----- | ------ |
| smtpPort | 0 | invalid_input |
| smtpPort | 65535 | ok |
| smtpPort | 65536 | invalid_input |
| newsletterRatePerMinute | 600 | ok |
| newsletterRatePerMinute | 601 | invalid_input |
| fromEmail | not-an-email | invalid_input |
| fromEmail | (empty) | ok |

#### Scenario: Invalid sender email rejected

- **WHEN** an administrator submits `fromEmail` as `not-an-email`
- **THEN** the action returns `invalid_input` and the stored settings are unchanged


<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Stored secrets are never returned in plain text

The settings summary returned to the page SHALL expose each credential only as a boolean presence flag and a `maskSecret` hint showing at most the last 4 characters. No server action response or rendered HTML SHALL contain a stored API key or SMTP password in plain text.

#### Scenario: Masked hint

- **WHEN** the stored ToSend API key is `tsend_abcd1234` and the administrator opens `/admin/email-settings`
- **THEN** the page shows a hint ending in `1234` and the full string `tsend_abcd1234` does not appear in the HTML or the summary JSON


<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Test email uses saved settings

The system SHALL send a test email to an administrator-entered address using the currently saved provider settings and SHALL report success with the provider name, or failure with the provider error message (including HTTP status when available) and without credential content. When no provider has been saved, the test button SHALL be disabled with a prompt to save settings first.

#### Scenario: Test email succeeds

- **WHEN** ToSend settings are saved and the administrator sends a test email to `fish@fishot.com`
- **THEN** the action returns `{ ok: true, provider: "tosend" }` and the page shows that the test email was sent to `fish@fishot.com`

#### Scenario: Test email fails

- **WHEN** the saved ToSend key is rejected by ToSend with HTTP 401
- **THEN** the action returns `ok: false` with an error message containing `401`, and the message does not contain the API key

#### Scenario: Nothing saved yet

- **WHEN** no `email-provider-config` row exists
- **THEN** the test email button is disabled and the page tells the administrator to save settings first


<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Email settings page layout

`/admin/email-settings` SHALL show a status banner and four tabs in this order: email service, sender and newsletter, welcome email template, delivery log. The status banner SHALL show a warning when no provider is usable and SHALL show the active provider name otherwise. The welcome email template and delivery log tabs SHALL keep their existing behavior. The platform navigation SHALL label this page "Email 設定" in the system settings group.

#### Scenario: Unconfigured site

- **WHEN** no DB settings exist and no provider environment credential exists
- **THEN** the banner shows a warning that the site cannot send email

##### Example: Banner state by configuration

| Stored provider | Environment credentials | Banner |
| --------------- | ----------------------- | ------ |
| none | none | warning: the site cannot send email |
| none | TOSEND_API_KEY set | active provider: ToSend (from environment) |
| tosend with tosendApiKey | none | active provider: ToSend |
| smtp without smtpHost | none | warning: the site cannot send email |

#### Scenario: Provider selection shows matching fields

- **WHEN** the administrator selects the SMTP card
- **THEN** only host, port, user, password, and SSL fields are shown, and ZSend, ToSend, and Resend fields are hidden

##### Example: Visible fields per provider card

| Selected card | Visible fields |
| ------------- | -------------- |
| ZSend | ZSend API key, verified domain |
| ToSend | ToSend API key, API base URL (default `https://api.tosend.com/v2`) |
| Resend | Resend API key |
| SMTP | host, port, user, password, SSL |

<!-- @trace
source: email-settings-admin-ui
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->