## MODIFIED Requirements

### Requirement: Forbidden extract targets

MVP SHALL NOT include: THE-TU newsletter, coupon, NextAuth, or Apple flows; Lemon Squeezy, Polar, Dodo, or Creem as cashiers; passkeys or two-factor; any libon.me source. Course playback UI from THE-TU is allowed. Site-agent is allowed. GitHub OAuth for kit claim is allowed. Organization, Member, and Invitation tenancy tables are REQUIRED (see the organization-tenancy capability), reversing the prior exclusion.

#### Scenario: Organization tables are present

- **WHEN** the MVP database schema is created
- **THEN** it MUST introduce Organization, Member, and Invitation tables consistent with the organization-tenancy capability's role matrix

##### Example: Schema inspection finds the three tables

- **GIVEN** the Prisma schema for the MVP database
- **WHEN** its model list is inspected
- **THEN** it MUST contain models named `Organization`, `Member`, and `Invitation`, and the `Member` model's `role` field MUST only accept `owner`, `admin`, `instructor`, or `user`

#### Scenario: Libon source is absent

- **WHEN** the StartKiter tree is searched for copied libon.me application source
- **THEN** that source MUST NOT be present

##### Example: Repo-wide search finds no libon.me source

- **GIVEN** the StartKiter repository at its current commit
- **WHEN** `grep -ril "libon" apps/ packages/` is run
- **THEN** the command MUST return no matches
