## ADDED Requirements

### Requirement: A repeatable production deployment SOP exists for the Coolify-managed VPS

A document SHALL exist at `docs/vps-deployment-sop.md` that describes a repeatable procedure for deploying `apps/saas` and `apps/marketing` to a Coolify-managed VPS, covering prerequisites, Coolify resource creation, environment variable configuration, DNS and SSL verification, and troubleshooting for known failure modes.

#### Scenario: The SOP document covers all required sections

- **WHEN** `docs/vps-deployment-sop.md` is read
- **THEN** it MUST contain sections covering prerequisites, Coolify resource creation steps, an environment variable classification list, DNS/SSL verification steps, and a troubleshooting section that documents the root cause of the 2026-08-26 `startkiter.dev` 503 incident

#### Scenario: The SOP replaces the prior non-final runbook status

- **WHEN** `docs/coolify-vps-setup-runbook.md` is read after this change is applied
- **THEN** it MUST NOT contain the self-declared caveat that the recorded procedure is not the final procedure to teach buyers

### Requirement: VPS-level secrets are classified and never recorded in plaintext within deployment documentation or scripts

Deployment documentation and any deployment scripts SHALL classify every environment variable as either secret or non-secret, and secret values MUST NOT appear in plaintext in any committed file, including example values in documentation.

#### Scenario: The SOP documents which variables are secret

- **WHEN** `docs/vps-deployment-sop.md`'s environment variable section is read
- **THEN** it MUST explicitly mark `SETTINGS_ENCRYPTION_KEY` and `DATABASE_URL` as secret variables that MUST be set through the Coolify secret-variable interface, not committed to any repository file

##### Example: A secret variable reference in documentation

| Variable | Classification | How it is set |
| --- | --- | --- |
| `SETTINGS_ENCRYPTION_KEY` | secret | Coolify secret environment variable, value never appears in this document |
| `NEXT_PUBLIC_SITE_URL` | non-secret | Coolify plain environment variable; an example value SHALL be permitted to appear in this document |

### Requirement: The database hosting strategy and VPS sizing are recorded as an explicit decision, not left as an open discussion

The system's database hosting strategy (external Neon versus self-hosted PostgreSQL on the VPS) and the production VPS's CPU/memory tier SHALL be recorded as an explicit, dated decision in `docs/vps-deployment-sop.md`, replacing the prior undecided "leaning toward" language in discussion notes.

#### Scenario: The SOP states the current database strategy unambiguously

- **WHEN** `docs/vps-deployment-sop.md` is read
- **THEN** it MUST state whether the database is hosted on external Neon or self-hosted on the VPS, and MUST NOT contain unresolved hedging phrases such as "leaning toward" or an unfilled placeholder marker

#### Scenario: The SOP states the current VPS tier and the reasoning for it

- **WHEN** `docs/vps-deployment-sop.md` is read
- **THEN** it MUST state the VPS's current vCPU/memory tier and record the reasoning for that tier given the known concurrent workloads (`apps/saas`, `apps/marketing`, and Chatwoot if already deployed by the `unified-support-desk` change)
