## ADDED Requirements

### Requirement: Admin can configure the AI assistant's provider and model
The system SHALL provide an admin-only settings page where an operator selects the AI assistant's active provider (OpenAI or Gemini) and, for the selected provider, the active text model. Only an operator (same authorization level as the checkout-gateway settings page) can access this page.

#### Scenario: Non-operator user cannot access the settings page
- **WHEN** a signed-in user without operator/admin permission requests the AI provider settings page
- **THEN** they are redirected away, consistent with the existing checkout-gateway settings page's authorization behavior

#### Scenario: Admin selects OpenAI and a model
- **WHEN** an admin selects "OpenAI" as the provider and picks a supported OpenAI text model, then saves
- **THEN** the setting is persisted and a subsequent AI chat request uses that model

#### Scenario: Admin selects Gemini, provides an API key, and a model
- **WHEN** an admin selects "Gemini" as the provider, enters a Gemini API key, picks a Gemini text model, and saves
- **THEN** the API key is stored encrypted (never rendered in plaintext on any page load), and a subsequent AI chat request uses the Gemini model with that key

#### Scenario: Settings page never displays a stored API key in plaintext
- **WHEN** an admin reopens the settings page after a Gemini API key was previously saved
- **THEN** the page shows only a configured/not-configured status for the key field, never the key value itself, consistent with the existing Gemini course-notes settings page's display convention

### Requirement: Text model resolution falls back safely when configuration is missing or invalid
The system SHALL resolve `textModel` at request time from the stored provider/model configuration, and SHALL fall back to the existing default (`openai("gpt-4o-mini")`) whenever the configuration is absent, malformed, or (for Gemini) the stored API key fails to decrypt.

#### Scenario: No configuration has ever been saved
- **WHEN** the AI chat endpoint resolves `textModel` and no provider/model setting row exists
- **THEN** it uses `openai("gpt-4o-mini")` and the chat request succeeds

#### Scenario: Gemini is configured but the stored key fails to decrypt
- **WHEN** the AI chat endpoint resolves `textModel`, the stored provider is Gemini, and decrypting the stored API key fails (e.g. `SETTINGS_ENCRYPTION_KEY` changed)
- **THEN** it falls back to `openai("gpt-4o-mini")` rather than throwing an unhandled error that breaks the chat request

### Requirement: The configuration is a single site-wide setting
The system SHALL store the provider/model configuration as one shared row, not scoped per user or per instructor, distinguishing it from the existing per-instructor Gemini course-notes API key setting.

#### Scenario: Two different admins see the same configuration
- **WHEN** admin A saves "Gemini + gemini-1.5-flash" and admin B later opens the settings page
- **THEN** admin B sees "Gemini" and "gemini-1.5-flash" as the current configuration, not their own separate setting
