## ADDED Requirements

### Requirement: The SaaS application is deployed on Coolify-managed VPS infrastructure

The `apps/saas` application SHALL be served from the Coolify-managed VPS fleet at the domain `app.startkiter.dev`, and SHALL NOT depend on the previously used Vercel deployment for production traffic.

#### Scenario: The production SaaS domain responds successfully

- **WHEN** an HTTP request is made to `https://app.startkiter.dev`
- **THEN** the response MUST be a successful status or a valid redirect (not a connection failure or 5xx error)

### Requirement: The marketing site is deployed under the official domain

The `apps/marketing` application SHALL be reachable at the official domain `startkiter.dev`.

#### Scenario: The official domain serves the marketing site

- **WHEN** an HTTP request is made to `https://startkiter.dev`
- **THEN** the response MUST be a successful status or a valid redirect (not a connection failure)

### Requirement: The legacy Vercel deployment is decommissioned

The previously used Vercel deployment (`test-startkiter.vercel.app`) SHALL NOT remain configured for automatic deployment from this repository once the Coolify deployment is confirmed stable.

#### Scenario: The legacy Vercel project no longer auto-deploys

- **WHEN** a new commit is pushed to the repository's default branch after this change is applied
- **THEN** the legacy Vercel project MUST NOT trigger a new deployment
