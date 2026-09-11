## ADDED Requirements

### Requirement: Split-host support runtime is the canonical topology
StartKiter SHALL treat the SaaS and marketing applications as hosted on the existing Vultr Coolify fleet host, and SHALL treat self-hosted Chatwoot as hosted on the Oracle Cloud Compute instance named `chatwoot-oracle-01` in region `ap-singapore-2`. Agents and operators MUST NOT assume Chatwoot shares the Vultr application host.

#### Scenario: Topology discovery from project docs
- **WHEN** an agent or operator reads the project session entry docs for infrastructure
- **THEN** those docs MUST state that the application fleet remains on Vultr Coolify and Chatwoot runtime targets Oracle `chatwoot-oracle-01`

#### Scenario: Reject co-located Chatwoot assumption
- **WHEN** an agent plans Chatwoot container, volume, or firewall work
- **THEN** the plan MUST target the Oracle support host and MUST NOT modify the Vultr application host for Chatwoot runtime changes


<!-- @trace
source: oracle-chatwoot-runtime-topology
updated: 2026-09-10
code:
  - docs/assets/course-engine-v2/open-world-course-engine.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - UIUX-CODE-AUDIT.md
  - AGENTS.md
  - docs/vps-deployment-sop.md
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/deploy-and-public-url.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html
  - docs/support-runtime-topology.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
-->

### Requirement: SSH-first operator access to the Oracle support host
The Oracle support host MUST accept SSH login as user `opc` with the operator workstation SSH public key already provisioned on the instance. Day-to-day Chatwoot host operations MUST prefer SSH over Oracle Console MFA workflows.

#### Scenario: BatchMode SSH health check
- **WHEN** an operator runs `ssh -o BatchMode=yes opc@<documented-public-ip> hostname`
- **THEN** the command MUST succeed and MUST return the configured support-host hostname

#### Scenario: SSH failure triage order
- **WHEN** SSH to the documented public IP fails
- **THEN** operators MUST first verify instance state, NSG or security-list ingress for TCP 22, and host firewall rules before changing application-host settings


<!-- @trace
source: oracle-chatwoot-runtime-topology
updated: 2026-09-10
code:
  - docs/assets/course-engine-v2/open-world-course-engine.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - UIUX-CODE-AUDIT.md
  - AGENTS.md
  - docs/vps-deployment-sop.md
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/deploy-and-public-url.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html
  - docs/support-runtime-topology.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
-->

### Requirement: Support runtime topology SSOT lives in versioned project files
The project MUST keep a versioned support-runtime runbook and a normative `support-runtime-topology` spec. `AGENTS.md` and `openspec/config.yaml` MUST include a short summary that points to the runbook. The runbook MUST record tenancy label, region, instance name, shape, OS architecture, SSH user, NSG name, current public IPv4 with ephemeral-or-reserved marker, private IPv4, DNS hostname for Chatwoot, and verification commands. Secrets such as private keys, API tokens, and Chatwoot credentials MUST NOT be committed.

#### Scenario: Runbook contains required topology fields
- **WHEN** a reviewer opens `docs/support-runtime-topology.md`
- **THEN** the file MUST include the required topology fields listed above and MUST omit private keys and API tokens

#### Scenario: Session entry points to the runbook
- **WHEN** a new session reads `AGENTS.md`
- **THEN** it MUST find a summary of the split-host topology and a pointer to `docs/support-runtime-topology.md`


<!-- @trace
source: oracle-chatwoot-runtime-topology
updated: 2026-09-10
code:
  - docs/assets/course-engine-v2/open-world-course-engine.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - UIUX-CODE-AUDIT.md
  - AGENTS.md
  - docs/vps-deployment-sop.md
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/deploy-and-public-url.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html
  - docs/support-runtime-topology.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
-->

### Requirement: Network rules for SSH and Chatwoot HTTP(S)
The Oracle support host network security configuration MUST allow inbound TCP 22 from the public internet for operator SSH. Before Chatwoot serves public traffic on the Oracle host, inbound TCP 80 and TCP 443 MUST be allowed. Host-local firewall rules MUST not silently drop the same ports after NSG allows them.

#### Scenario: SSH ingress is open
- **WHEN** the support host is marked SSH-ready
- **THEN** NSG or equivalent security rules MUST allow inbound TCP 22 and SSH from the public IP MUST succeed

#### Scenario: Public Chatwoot ports before go-live
- **WHEN** Chatwoot is declared publicly reachable on the Oracle host
- **THEN** inbound TCP 80 and TCP 443 MUST be allowed end-to-end from the public internet to the Chatwoot listener


<!-- @trace
source: oracle-chatwoot-runtime-topology
updated: 2026-09-10
code:
  - docs/assets/course-engine-v2/open-world-course-engine.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - UIUX-CODE-AUDIT.md
  - AGENTS.md
  - docs/vps-deployment-sop.md
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/deploy-and-public-url.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html
  - docs/support-runtime-topology.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
-->

### Requirement: DNS truth for support.startkiter.dev is explicit
The runbook MUST state the current DNS target for `support.startkiter.dev` as either the Oracle support-host public IP or the previous host, with no ambiguous wording. After Chatwoot cutover validation, DNS MUST point at the Oracle public IP then recorded in the runbook.

#### Scenario: Pre-cutover honesty
- **WHEN** Chatwoot has not finished cutover validation on Oracle
- **THEN** the runbook MUST explicitly state that DNS still points at the previous host or that cutover is incomplete

#### Scenario: Post-cutover DNS
- **WHEN** cutover validation has passed
- **THEN** `support.startkiter.dev` MUST resolve to the documented Oracle public IP and the runbook MUST match that target


<!-- @trace
source: oracle-chatwoot-runtime-topology
updated: 2026-09-10
code:
  - docs/assets/course-engine-v2/open-world-course-engine.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - UIUX-CODE-AUDIT.md
  - AGENTS.md
  - docs/vps-deployment-sop.md
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/deploy-and-public-url.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html
  - docs/support-runtime-topology.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
-->

### Requirement: Product support channel remains independent of host topology
Completing the Oracle Chatwoot host topology MUST NOT by itself change the product default support channel away from email. Re-enabling Chatwoot in the product MUST require an explicit product decision outside this topology change.

#### Scenario: Default channel stays email after topology docs land
- **WHEN** this topology change is applied and archived
- **THEN** project policy docs MUST still describe the default support channel as email unless a separate product change flips it

#### Scenario: Runtime ready does not imply widget enabled
- **WHEN** the Oracle Chatwoot host is healthy
- **THEN** agents MUST NOT treat that as authorization to set `NEXT_PUBLIC_SUPPORT_CHANNEL=chatwoot` without a separate decision record

## Requirements


<!-- @trace
source: oracle-chatwoot-runtime-topology
updated: 2026-09-10
code:
  - docs/assets/course-engine-v2/open-world-course-engine.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - UIUX-CODE-AUDIT.md
  - AGENTS.md
  - docs/vps-deployment-sop.md
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/deploy-and-public-url.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html
  - docs/support-runtime-topology.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
-->

### Requirement: Split-host support runtime is the canonical topology
StartKiter SHALL treat the SaaS and marketing applications as hosted on the existing Vultr Coolify fleet host, and SHALL treat self-hosted Chatwoot as hosted on the Oracle Cloud Compute instance named `chatwoot-oracle-01` in region `ap-singapore-2`. Agents and operators MUST NOT assume Chatwoot shares the Vultr application host.

#### Scenario: Topology discovery from project docs
- **WHEN** an agent or operator reads the project session entry docs for infrastructure
- **THEN** those docs MUST state that the application fleet remains on Vultr Coolify and Chatwoot runtime targets Oracle `chatwoot-oracle-01`

#### Scenario: Reject co-located Chatwoot assumption
- **WHEN** an agent plans Chatwoot container, volume, or firewall work
- **THEN** the plan MUST target the Oracle support host and MUST NOT modify the Vultr application host for Chatwoot runtime changes

---
### Requirement: SSH-first operator access to the Oracle support host
The Oracle support host MUST accept SSH login as user `opc` with the operator workstation SSH public key already provisioned on the instance. Day-to-day Chatwoot host operations MUST prefer SSH over Oracle Console MFA workflows.

#### Scenario: BatchMode SSH health check
- **WHEN** an operator runs `ssh -o BatchMode=yes opc@<documented-public-ip> hostname`
- **THEN** the command MUST succeed and MUST return the configured support-host hostname

#### Scenario: SSH failure triage order
- **WHEN** SSH to the documented public IP fails
- **THEN** operators MUST first verify instance state, NSG or security-list ingress for TCP 22, and host firewall rules before changing application-host settings

---
### Requirement: Support runtime topology SSOT lives in versioned project files
The project MUST keep a versioned support-runtime runbook and a normative `support-runtime-topology` spec. `AGENTS.md` and `openspec/config.yaml` MUST include a short summary that points to the runbook. The runbook MUST record tenancy label, region, instance name, shape, OS architecture, SSH user, NSG name, current public IPv4 with ephemeral-or-reserved marker, private IPv4, DNS hostname for Chatwoot, and verification commands. Secrets such as private keys, API tokens, and Chatwoot credentials MUST NOT be committed.

#### Scenario: Runbook contains required topology fields
- **WHEN** a reviewer opens `docs/support-runtime-topology.md`
- **THEN** the file MUST include the required topology fields listed above and MUST omit private keys and API tokens

#### Scenario: Session entry points to the runbook
- **WHEN** a new session reads `AGENTS.md`
- **THEN** it MUST find a summary of the split-host topology and a pointer to `docs/support-runtime-topology.md`

---
### Requirement: Network rules for SSH and Chatwoot HTTP(S)
The Oracle support host network security configuration MUST allow inbound TCP 22 from the public internet for operator SSH. Before Chatwoot serves public traffic on the Oracle host, inbound TCP 80 and TCP 443 MUST be allowed. Host-local firewall rules MUST not silently drop the same ports after NSG allows them.

#### Scenario: SSH ingress is open
- **WHEN** the support host is marked SSH-ready
- **THEN** NSG or equivalent security rules MUST allow inbound TCP 22 and SSH from the public IP MUST succeed

#### Scenario: Public Chatwoot ports before go-live
- **WHEN** Chatwoot is declared publicly reachable on the Oracle host
- **THEN** inbound TCP 80 and TCP 443 MUST be allowed end-to-end from the public internet to the Chatwoot listener

---
### Requirement: DNS truth for support.startkiter.dev is explicit
The runbook MUST state the current DNS target for `support.startkiter.dev` as either the Oracle support-host public IP or the previous host, with no ambiguous wording. After Chatwoot cutover validation, DNS MUST point at the Oracle public IP then recorded in the runbook.

#### Scenario: Pre-cutover honesty
- **WHEN** Chatwoot has not finished cutover validation on Oracle
- **THEN** the runbook MUST explicitly state that DNS still points at the previous host or that cutover is incomplete

#### Scenario: Post-cutover DNS
- **WHEN** cutover validation has passed
- **THEN** `support.startkiter.dev` MUST resolve to the documented Oracle public IP and the runbook MUST match that target

---
### Requirement: Product support channel remains independent of host topology
Completing the Oracle Chatwoot host topology MUST NOT by itself change the product default support channel away from email. Re-enabling Chatwoot in the product MUST require an explicit product decision outside this topology change.

#### Scenario: Default channel stays email after topology docs land
- **WHEN** this topology change is applied and archived
- **THEN** project policy docs MUST still describe the default support channel as email unless a separate product change flips it

#### Scenario: Runtime ready does not imply widget enabled
- **WHEN** the Oracle Chatwoot host is healthy
- **THEN** agents MUST NOT treat that as authorization to set `NEXT_PUBLIC_SUPPORT_CHANNEL=chatwoot` without a separate decision record