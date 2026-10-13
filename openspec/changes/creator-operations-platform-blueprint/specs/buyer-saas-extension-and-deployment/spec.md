## Purpose

This capability defines how a buyer uses the CodePackage as a source foundation for a buyer-owned SaaS or membership application. It separates the buyer's downstream users, billing, permissions, deployment, credentials, updates, and support responsibilities from StartKiter course access and CodePackage purchase entitlements.

## ADDED Requirements

### Requirement: A CodePackage product SHALL grant a buyer-owned SaaS source license

A published CodePackage Product SHALL be sellable independently or included in a Course or Bundle Offer. A successful qualifying purchase SHALL grant the buyer a source repository entitlement with an explicit license scope, permitted app or workspace count, commercial-use status, update policy, and support tier. The source license SHALL remain separate from Course and Bundle learning entitlements.

The license SHALL distinguish delivered source-use rights, future update access, hosted-service access, and GitHub repository grants. Ending a subscription SHALL apply its declared policy to those distinct outcomes and SHALL NOT claim to erase source files already downloaded. An unspecified app count, update term, or cancellation policy SHALL prevent publication of the affected new license Offer.

#### Scenario: Buyer purchases a standalone CodePackage

- **WHEN** an authenticated buyer completes a qualifying one-time or subscription Offer for a standalone CodePackage Product
- **THEN** the system records the CodePackage license and makes the buyer's dedicated source repository available without granting unrelated Course access

##### Example: Concrete acceptance fixture 1

- **GIVEN** buyer B1 buys CodePackage Offer K1 with explicit app-count and update policy and no Course linkage
- **WHEN** payment for K1 succeeds
- **THEN** B1 receives the source license and dedicated repo eligibility with no Course entitlement

#### Scenario: Buyer receives a CodePackage with a Bundle

- **WHEN** a buyer completes a Bundle Offer whose delivery policy includes the CodePackage
- **THEN** the system records both the Bundle course entitlements and the separate CodePackage license outcome

##### Example: Concrete acceptance fixture 2

- **GIVEN** Bundle Offer P1 snapshots courses A/B and includes perpetual CodePackage policy
- **WHEN** B1 pays P1
- **THEN** A/B entitlements and a distinct CodePackage license are stored, not one merged access flag

### Requirement: A buyer-built SaaS SHALL own its downstream access model

The buyer's deployed application SHALL be able to define its own end-user authentication, organization or workspace membership, permissions, subscription plans, billing records, and protected pages using the delivered source foundation. These downstream records SHALL NOT be treated as StartKiter learner accounts, Course entitlements, or StartKiter Orders.

#### Scenario: Buyer creates a protected SaaS page

- **WHEN** the buyer configures a deployed application page as accessible only to an active buyer-defined plan
- **THEN** the buyer's application checks its own downstream session and subscription entitlement and does not call StartKiter Course access as the authorization source

##### Example: Concrete acceptance fixture 3

- **GIVEN** buyer app X1 has protected page /reports and its own plan S1; end user E1 is unpaid
- **WHEN** E1 requests /reports
- **THEN** X1 denies access using its own billing/session, regardless of B1 StartKiter course access

#### Scenario: Buyer manages an organization member

- **WHEN** a downstream customer invites a member to the buyer's SaaS organization
- **THEN** the buyer's deployed application stores and evaluates that membership using its own organization and permission boundary

##### Example: Concrete acceptance fixture 4

- **GIVEN** X1 organization XOrg1 invites downstream user E2
- **WHEN** E2 accepts the invitation
- **THEN** membership exists in X1 data only and creates no StartKiter workspace membership

### Requirement: Buyer deployments SHALL use an explicit hosting tier

A buyer deployment SHALL be classified as exactly one of `self-hosted`, `managed`, or `advanced`. The selected tier SHALL define deployment ownership, infrastructure responsibility, credential ownership, update path, and StartKiter support obligation. A deployment SHALL NOT silently switch tiers without a recorded transition.

#### Scenario: Buyer chooses self-hosted deployment

- **WHEN** a buyer chooses self-hosted deployment for the CodePackage
- **THEN** the buyer owns the target infrastructure and third-party service accounts, and StartKiter does not treat infrastructure uptime as a managed support obligation

##### Example: Concrete acceptance fixture 5

- **GIVEN** B1 selects self-hosted instance X1 on buyer-owned infrastructure
- **WHEN** X1 deployment is prepared
- **THEN** B1 is recorded as infrastructure/service-account owner and managed uptime is not promised

#### Scenario: Buyer chooses managed deployment

- **WHEN** a buyer chooses managed deployment
- **THEN** the buyer instance is attached to the managed hosting workflow and StartKiter can diagnose infrastructure failures using the managed provider boundary

##### Example: Concrete acceptance fixture 6

- **GIVEN** B1 selects managed instance X1 through the supported hosting workflow
- **WHEN** X1 deployment is prepared
- **THEN** managed provider and support responsibility are recorded and diagnostics stay within X1 scope

### Requirement: Buyer credentials and third-party accounts SHALL remain buyer-owned

A buyer's deployed SaaS SHALL use buyer-owned email, payment, DNS, Cloudflare, database, and other third-party accounts where the hosting tier requires them. Credential handoff SHALL use the approved handoff channel, SHALL restrict target keys to an allowlist, and SHALL NOT persist raw credential values in StartKiter's database, logs, or error reports.

#### Scenario: Buyer configures a payment provider

- **WHEN** a buyer connects a payment provider for the buyer-built SaaS
- **THEN** the credential is written only to the buyer deployment's approved environment target and the raw value is absent from StartKiter persistence and logs

##### Example: Concrete acceptance fixture 7

- **GIVEN** B1 is authorized to configure an allowlisted payment environment key on X1
- **WHEN** credential handoff is accepted
- **THEN** the value reaches only X1 approved environment; StartKiter records the handoff reference, not raw credential

#### Scenario: Buyer submits a non-allowlisted credential key

- **WHEN** a credential handoff request names a target environment key outside the allowlist
- **THEN** the request is rejected and no value is written to the buyer deployment

##### Example: Concrete acceptance fixture 8

- **GIVEN** handoff request for X1 uses non-allowlisted key UNRECOGNIZED_PAYMENT_KEY
- **WHEN** the request is validated
- **THEN** it is rejected and no environment value or secret-bearing log is written

### Requirement: Buyer source updates SHALL be reviewable and support boundaries SHALL be explicit

Upstream CodePackage updates SHALL be offered through a reviewable update path that records the source version, target buyer repository, conflicts, acceptance result, and rollback point. StartKiter SHALL NOT silently overwrite buyer changes. Support documentation SHALL distinguish source-package guidance from managed infrastructure remediation.

#### Scenario: Buyer reviews an upstream update

- **WHEN** a new CodePackage version is available for a buyer's repository
- **THEN** the buyer can inspect the update, see conflicts or required migrations, and accept or decline it without losing buyer-owned changes

##### Example: Concrete acceptance fixture 9

- **GIVEN** B1 repo is version 1 and proposed upstream version 2 touches custom file C1
- **WHEN** B1 reviews update U1
- **THEN** U1 lists C1 conflict and migration requirements, permits decline and preserves version 1 until acceptance

#### Scenario: Buyer deployment update fails

- **WHEN** an accepted CodePackage update fails to build or deploy
- **THEN** the system records the failed update and exposes the documented rollback or support path for the buyer's hosting tier

##### Example: Concrete acceptance fixture 10

- **GIVEN** X1 accepted update U1 has rollback point V1 and version 2 fails startup
- **WHEN** U1 is processed
- **THEN** failure evidence is retained and the tier-specific rollback/support path is exposed without reporting successful deploy

