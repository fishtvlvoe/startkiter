## ADDED Requirements

### Requirement: Independent git repository

StartKiter SHALL exist as its own git repository at products/startkiter, separate from the Development workspace container git. The default branch SHALL be named main.

#### Scenario: Nested repo is independent

- **WHEN** an operator runs git rev-parse --show-toplevel inside products/startkiter
- **THEN** the command returns the products/startkiter directory and MUST NOT return the Development workspace root

#### Scenario: Empty application tree is allowed at foundation

- **WHEN** the repository contains no package.json
- **THEN** foundation SHALL still be valid and MUST NOT require an application scaffold

### Requirement: Source repositories stay read-only

Agents and operators SHALL NOT modify these source trees while working on StartKiter: supastarter-nextjs-main, THE-TU-Project, and 8-外掛/line-hub. StartKiter SHALL copy or rewrite files into its own tree only.

#### Scenario: Extract writes only inside StartKiter

- **WHEN** a later change extracts payment or auth code
- **THEN** new files MUST land under products/startkiter and the source repositories MUST remain unmodified

#### Scenario: Forbidden old snapshots

- **WHEN** an agent selects a Taiwan payment source
- **THEN** it MUST use THE-TU-Project/dev/thetu and MUST NOT use THE-TU-Project/code or realms-course-platform-v1.8.0

### Requirement: Zero coupling to libon.me

StartKiter SHALL NOT depend on libon.me domains, accounts, courses, or source code. Sales, auth, and deploy for this product MUST NOT route through libon.me.

#### Scenario: Domain fallback without libon

- **WHEN** startkiter.com and startkiter.me are not purchased
- **THEN** the project MUST use a dedicated host subdomain (Zeabur-class) and MUST NOT use a libon.me hostname

#### Scenario: Code import from libon is rejected

- **WHEN** an agent proposes importing modules from libon.me products such as anismile, so, or am
- **THEN** the change MUST be rejected

### Requirement: Spectra is the product requirement home

Product requirement changes SHALL live in this repository under openspec/changes/. The Development workspace openspec/changes/ MUST NOT hold StartKiter implementation changes. Architecture discussion history SHALL live in docs/discuss/.

#### Scenario: Change created in the product repo

- **WHEN** an operator runs spectra new change inside products/startkiter
- **THEN** the change directory MUST appear under products/startkiter/openspec/changes/

#### Scenario: Missing discuss history fails foundation

- **WHEN** docs/discuss/v1-boundary.md or docs/discuss/extract-map.md is absent
- **THEN** foundation MUST be treated as incomplete
