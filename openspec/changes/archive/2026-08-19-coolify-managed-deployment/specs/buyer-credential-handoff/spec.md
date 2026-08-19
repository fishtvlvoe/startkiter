## ADDED Requirements

### Requirement: Third-party service accounts are owned and paid for by the buyer
For email delivery, payment gateway, and custom domain registration/DNS services used by a buyer's deployed instance, the buyer SHALL be the account holder and billing party. StartKiter MUST NOT apply for, purchase, or hold these accounts on the buyer's behalf.

#### Scenario: Buyer needs email sending capability
- **WHEN** a buyer's deployed SaaS needs to send transactional email
- **THEN** the buyer MUST sign up for their own email-provider account; StartKiter MUST NOT provision or share a StartKiter-owned email account for the buyer's use

### Requirement: Credential handoff happens through the AI conversation interface only
A buyer SHALL provide third-party credentials (email API key, payment gateway key, Cloudflare DNS-scoped token) directly through the AI conversation interface used to manage their deployment. StartKiter MUST NOT provide a form, support-ticket flow, or human-staffed channel for buyers to submit these credentials.

#### Scenario: Buyer provides a payment gateway key
- **WHEN** a buyer wants to connect their own payment gateway account
- **THEN** they MUST do so by providing the key through the AI conversation interface, and the system MUST NOT surface any StartKiter human-staff-facing intake point for this credential

### Requirement: Credential values are never persisted in StartKiter's own database or logs
Third-party credential values handled through this flow MUST be written directly into the target buyer deployment's environment variables (via the Coolify API) and MUST NOT be stored in StartKiter's own database, application logs, or error-reporting systems in plaintext or recoverable form.

#### Scenario: Credential submitted through AI conversation
- **WHEN** a buyer submits a credential value through the AI conversation interface
- **THEN** the backend MUST forward it to the buyer's deployment environment variables and MUST NOT write the raw value to any StartKiter-controlled log, database row, or error report

#### Scenario: Audit of credential-handling code paths
- **WHEN** the `/api/deployment/credentials` endpoint's code and its logging output are inspected
- **THEN** no code path may print, log, or persist the credential value outside of the single write to the target environment variable

### Requirement: Target environment variable keys are restricted to a fixed allowlist
The `targetEnvKey` accepted by the credential-handoff mechanism SHALL be restricted to a predefined allowlist of environment variable names. The system MUST reject any credential-handoff request specifying a key outside this allowlist.

#### Scenario: Handoff request with an unrecognized key
- **WHEN** a credential-handoff request specifies a `targetEnvKey` not present in the predefined allowlist
- **THEN** the system MUST reject the request and MUST NOT write any value to the buyer's deployment environment
