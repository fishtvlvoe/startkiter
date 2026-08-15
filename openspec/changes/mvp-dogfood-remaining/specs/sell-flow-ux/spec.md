## ADDED Requirements

### Requirement: Buyer-visible errors use plain Traditional Chinese
Learner-facing UI for agent, checkout, demo grant, and kit panels SHALL map failures to plain Traditional Chinese. Raw provider codes such as provider_failed or HTTP status numbers MUST NOT be the primary user-visible message.

#### Scenario: Agent failure without jargon
- **WHEN** the site agent chat fails for a non-auth reason
- **THEN** the UI MUST show a plain Traditional Chinese error and MUST NOT require the learner to understand provider_failed

### Requirement: Support email is visible when configured
When SUPPORT_EMAIL or EMAIL_FROM is configured, sell-flow pages SHALL expose a mailto support contact in the footer or account surface.

#### Scenario: Footer shows support mailto
- **WHEN** SUPPORT_EMAIL is set and a visitor opens the home page
- **THEN** a mailto link to that address MUST be visible
