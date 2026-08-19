## ADDED Requirements

### Requirement: Buyer-owned VPS is the billing unit, not a StartKiter-owned server
For every `managed` tier buyer, the underlying VPS SHALL be rented and paid for by the buyer directly with a third-party VPS provider. StartKiter MUST NOT hold billing responsibility for any buyer's VPS.

#### Scenario: Buyer's VPS bill goes to the buyer
- **WHEN** a `managed` tier buyer's VPS provider issues a monthly invoice
- **THEN** that invoice MUST be addressed to the buyer's own account, not StartKiter's

### Requirement: Exactly one Coolify account centrally manages all managed-tier buyer servers
StartKiter SHALL operate exactly one Coolify account. Every `managed` tier buyer's VPS SHALL be connected to this single account as a "server" resource, once the buyer has provided SSH access during onboarding.

#### Scenario: A new managed-tier buyer's VPS is connected
- **WHEN** a buyer completes VPS handoff (provides IP and one-time SSH access)
- **THEN** StartKiter's backend MUST register that VPS as a new server under StartKiter's single Coolify account, and MUST NOT create or use a separate Coolify account per buyer

### Requirement: Buyers never receive Coolify login credentials
No buyer, regardless of tier, SHALL receive a username, password, API token, or any other credential granting direct access to StartKiter's Coolify account or dashboard.

#### Scenario: Buyer asks for Coolify access
- **WHEN** a buyer requests direct access to view or manage their deployment through Coolify's own interface
- **THEN** the system MUST NOT issue Coolify credentials to the buyer; the buyer is directed to the `buyer-status-panel` instead

### Requirement: StartKiter can remediate a managed-tier buyer's deployment without requesting further access
Because the buyer's VPS is already connected to StartKiter's own Coolify account, StartKiter staff or an authorized AI agent SHALL be able to inspect logs, restart services, or redeploy a `managed` tier buyer's application using StartKiter's existing Coolify access, without any additional credential request to the buyer.

#### Scenario: Support intervenes on a broken deployment
- **WHEN** a `managed` tier buyer's deployment enters an error state
- **THEN** StartKiter MUST be able to use its own Coolify account access to diagnose and fix the issue, and MUST NOT need to ask the buyer for a password, SSH key, or any other new credential to do so
