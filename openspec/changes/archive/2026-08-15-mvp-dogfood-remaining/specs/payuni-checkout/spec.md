## ADDED Requirements

### Requirement: Checkout callback URLs use the public HTTPS base
PAYUNi ReturnURL and NotifyURL SHALL be built from BETTER_AUTH_URL when set, so TEST deployments on the custom domain receive browser return and server notify on the same public origin.

#### Scenario: Base URL prefers BETTER_AUTH_URL
- **WHEN** checkout creates a PAYUNi session and BETTER_AUTH_URL is https://startkiter.aiver.me
- **THEN** ReturnURL and NotifyURL MUST start with https://startkiter.aiver.me/api/payuni/
