## Purpose

This capability defines how StartKiter adds future creator-platform modules and releases updates without breaking the platform core, existing buyer applications, historical data, or buyer custom code. It coordinates extension points, compatibility, migrations, release channels, AI skills, and rollback across the platform and CodePackage lifecycle.

## ADDED Requirements

### Requirement: Official modules SHALL attach through stable extension contracts

An official module SHALL register through the existing App or plugin extension contract and SHALL declare its mount point, capability, permission scope, page-state contract, data owner, events, provider adapters, and UI handoff. A module SHALL NOT modify an unrelated module's internal truth source to expose its feature.

#### Scenario: Creator adds a CRM module

- **WHEN** the platform enables the CRM module
- **THEN** the module registers its own routes, capabilities, permissions, screens, data owner, and events through the extension contract while existing Course and Payment authorities remain unchanged

##### Example: Concrete acceptance fixture 1

- **GIVEN** Course and Payments own their existing models and CRM manifest M1 declares required fields
- **WHEN** M1 is enabled through AppRegistrationManifest
- **THEN** CRM routes/permissions/events register under CRM owner without replacing Course or Payment truth

#### Scenario: Module registration is incomplete

- **WHEN** a module omits a required mount, capability, owner, or permission declaration
- **THEN** the platform rejects the registration before the module becomes available in a workspace

##### Example: Concrete acceptance fixture 2

- **GIVEN** CRM manifest M1 omits its required permission declaration
- **WHEN** registration is validated
- **THEN** M1 is rejected before availability and existing manifests remain active

### Requirement: Core and module changes SHALL preserve compatibility before contraction

A breaking change SHALL use expand, migrate, contract sequencing. New fields, events, routes, or adapters SHALL be introduced alongside the old contract; data SHALL be migrated and read back; consumers SHALL be updated; only then SHALL the old contract be removed. A feature flag or release channel SHALL control new behavior when a buyer update cannot be atomic.

#### Scenario: CRM adds a contact identity field

- **WHEN** a new CRM identity representation is introduced
- **THEN** the platform can read the old and new representation during migration, records migration results, and does not remove the old representation until all consumers pass compatibility checks

##### Example: Concrete acceptance fixture 3

- **GIVEN** W1 contacts use identity v1 and v2 is introduced additively
- **WHEN** a migration batch and read-back run
- **THEN** v1/v2 remain readable and v1 is retained until all consumers and read-back pass

#### Scenario: A buyer has not accepted a new module

- **WHEN** an official module version is available but a buyer has not accepted its feature flag or release channel
- **THEN** the buyer's existing application continues using its previous compatible behavior without receiving an unreviewed breaking change

##### Example: Concrete acceptance fixture 4

- **GIVEN** buyer B1 runs module v1 and has not accepted v2 release channel
- **WHEN** official v2 is published
- **THEN** B1 remains on compatible v1 behavior without automatic breaking activation

### Requirement: Buyer updates SHALL protect buyer custom code

An upstream CodePackage update SHALL distinguish core files, official modules, generated files, and buyer custom files. The update flow SHALL produce a preview of changed files, migrations, conflicts, required environment changes, test requirements, and rollback point. The system SHALL NOT silently overwrite buyer custom code.

#### Scenario: Buyer reviews a platform update

- **WHEN** a new upstream CodePackage version is offered
- **THEN** the buyer can see the affected core, official module, generated, and custom file groups before accepting the update

##### Example: Concrete acceptance fixture 5

- **GIVEN** upstream version V2 touches core A, official B, generated C and custom D
- **WHEN** buyer previews update U1
- **THEN** the preview lists all four categories, migrations/env changes and rollback point before acceptance

#### Scenario: Upstream update conflicts with buyer customization

- **WHEN** an upstream update conflicts with a buyer-owned customization
- **THEN** the update pauses with a conflict report and preserves the buyer application at its previous working version

##### Example: Concrete acceptance fixture 6

- **GIVEN** buyer custom D differs from upstream and merge conflicts
- **WHEN** U1 is attempted
- **THEN** U1 pauses with conflict details and previous working version plus D remain intact

### Requirement: AI operation skills SHALL be versioned with the platform contract

Buyer-facing `AGENTS.md`, `CLAUDE.md`, Codex／Claude Code skills, onboarding, update, troubleshooting, and deployment instructions SHALL declare the compatible platform version and SHALL be updated with the same release contract as the CodePackage. A skill SHALL check the project version and required permissions before performing a state-changing operation.

#### Scenario: Buyer asks AI to add a future module

- **WHEN** a buyer asks Codex or Claude Code to add a supported CRM or Funnel capability
- **THEN** the AI uses the project's compatible skill, preserves the extension contract, shows the planned files and migration boundary, and verifies the result before reporting success

##### Example: Concrete acceptance fixture 7

- **GIVEN** B1 version V1 has compatible extension Skill and asks for CRM
- **WHEN** the AI prepares CRM addition
- **THEN** planned files/migration and manifest boundary are shown before mutation; verification evidence is required before success claim

#### Scenario: Buyer uses an outdated skill

- **WHEN** a buyer's project skill version is incompatible with the installed CodePackage version
- **THEN** the AI reports the incompatibility and stops before modifying the project

##### Example: Concrete acceptance fixture 8

- **GIVEN** B1 installed package V2 and local Skill declares only V1 compatibility
- **WHEN** AI is asked to update B1
- **THEN** incompatibility is reported and no project or migration is modified

### Requirement: Every platform update SHALL have a rollback and evidence contract

A platform or official-module release SHALL define migration steps, feature-flag state, compatibility checks, browser and API smoke checks, deployment evidence, rollback behavior, and the owner for unresolved failures. A release SHALL NOT be marked successful from build output alone.

#### Scenario: Platform update passes verification

- **WHEN** the updated buyer application passes type-check, focused tests, migration read-back, API smoke checks, and desktop/mobile browser checks
- **THEN** the release records the evidence and becomes eligible for the buyer's selected release channel

##### Example: Concrete acceptance fixture 9

- **GIVEN** release V2 has passing type, behavior, migration read-back, API and desktop/mobile evidence
- **WHEN** the release owner reviews it
- **THEN** evidence references are retained and V2 becomes eligible for the selected channel, not auto-approved by build alone

#### Scenario: Platform update fails after migration

- **WHEN** an update fails during migration, startup, API smoke, or browser verification
- **THEN** the system preserves the failure evidence, disables the new release channel or feature flag, and exposes the documented rollback or forward-fix path

##### Example: Concrete acceptance fixture 10

- **GIVEN** V2 startup fails after additive migration and V1 remains compatible
- **WHEN** deployment checks run
- **THEN** failure evidence is retained, new channel is disabled and rollback/forward-fix guidance preserves new transaction data

