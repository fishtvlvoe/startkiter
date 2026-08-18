## ADDED Requirements

### Requirement: Buyers are routed into exactly one of three hosting tiers
StartKiter SHALL classify every buyer's deployment into exactly one of three tiers at purchase or onboarding time: `self-hosted` (buyer deploys and maintains their own instance with no StartKiter involvement), `managed` (buyer's instance runs on StartKiter's centrally-managed Coolify fleet), or `advanced` (buyer takes the source code for their own unrelated use). A buyer's deployment MUST NOT span more than one tier simultaneously.

#### Scenario: Buyer selects self-hosted tier
- **WHEN** a buyer chooses "I'll deploy it myself" during onboarding
- **THEN** the system MUST direct them to the existing README Zeabur one-click deploy path and MUST NOT provision any StartKiter-managed Coolify resource for them

#### Scenario: Buyer selects managed tier
- **WHEN** a buyer chooses "handle it for me" during onboarding
- **THEN** the system MUST route them through the VPS-handoff-and-Coolify-fleet flow defined in `coolify-fleet-management`

### Requirement: StartKiter's support obligation is scoped to the managed tier only
StartKiter SHALL NOT be obligated to provide infrastructure-level support (server uptime, deploy failures, hosting issues) to buyers in the `self-hosted` or `advanced` tiers. StartKiter SHALL provide infrastructure-level support to buyers in the `managed` tier, because StartKiter owns and operates the underlying VPS-to-Coolify connection for that tier.

#### Scenario: Self-hosted buyer's server goes down
- **WHEN** a `self-hosted` tier buyer's own deployment becomes unreachable
- **THEN** StartKiter support channels MUST NOT be the required remediation path; the buyer is responsible for their own infrastructure

#### Scenario: Managed tier buyer's deployment fails to build
- **WHEN** a `managed` tier buyer's Coolify deployment enters an error state
- **THEN** StartKiter MUST be able to diagnose and remediate the issue using its own Coolify access, without requesting any credential from the buyer

### Requirement: Tier selection does not require the buyer to disclose technical proficiency
The tier selection step SHALL be framed in plain, non-technical language (e.g. "I want to handle the technical setup myself" vs "I want everything set up for me") and MUST NOT require the buyer to answer questions about programming experience, DevOps knowledge, or server administration.

#### Scenario: Tier selection copy avoids jargon
- **WHEN** a buyer reaches the tier-selection step
- **THEN** the presented choices MUST be phrased in outcome terms ("I'll do the technical setup" / "set it up for me"), not in infrastructure terms ("VPS" / "Coolify" / "self-hosted")
