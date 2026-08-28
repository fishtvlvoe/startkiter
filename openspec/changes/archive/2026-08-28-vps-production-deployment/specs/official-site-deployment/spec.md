## MODIFIED Requirements

### Requirement: The marketing site is deployed under the official domain

The `apps/marketing` application SHALL be reachable at the official domain `startkiter.dev`, and the deployed resource's underlying container health SHALL be verified as part of any deployment acceptance check, not only the domain's DNS resolution.

#### Scenario: The official domain serves the marketing site

- **WHEN** an HTTP request is made to `https://startkiter.dev`
- **THEN** the response MUST be a successful status or a valid redirect (not a connection failure), and MUST NOT be an HTTP 5xx status

##### Example: A 503 with a plain-text body is a failing deployment, not a passing one

- **GIVEN** `curl -I https://startkiter.dev` returns `HTTP/2 503` with `content-type: text/plain`
- **WHEN** this response is evaluated against the acceptance check
- **THEN** the deployment MUST be recorded as failing, and the underlying Coolify resource's container status MUST be inspected before the deployment is marked complete

#### Scenario: A deployment acceptance check records the underlying resource state, not only the HTTP status code

- **WHEN** a deployment of `apps/marketing` is verified as part of any change's task completion
- **THEN** the verification record MUST include both the HTTP response check and the Coolify resource's running/stopped/crashed state at the time of verification, so a later regression can be distinguished from a check that was never actually run against live infrastructure
