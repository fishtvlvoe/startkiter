## ADDED Requirements

### Requirement: Buyers see deployment status through StartKiter's own interface, never Coolify's
A `managed` tier buyer SHALL view their deployment status through a page hosted within StartKiter's own platform (e.g. `/deployment`). The buyer MUST NOT be linked to, embedded with, or otherwise exposed to Coolify's own dashboard UI.

#### Scenario: Buyer checks their deployment status
- **WHEN** a `managed` tier buyer navigates to their deployment status page
- **THEN** the page MUST be served from StartKiter's own domain and MUST NOT iframe, redirect to, or expose any Coolify-hosted URL

### Requirement: Status panel shows a fixed minimal set of fields
The status panel SHALL display exactly: whether the site is currently reachable (live/down), the public URL, and the timestamp of the last successful deployment. The panel MUST NOT expose infrastructure-level details (server IP, container logs, resource metrics, Coolify project/app identifiers).

#### Scenario: Panel renders for a live deployment
- **WHEN** a buyer's deployment is healthy
- **THEN** the panel MUST show a live/reachable indicator, the public URL, and the last-deployed timestamp, and MUST NOT show the underlying server IP or any Coolify-internal identifier

### Requirement: Status data source failures do not falsely report site-down
If StartKiter's backend cannot reach the Coolify API to retrieve status, the panel SHALL display a distinct "status temporarily unavailable" state and MUST NOT report the buyer's site as down.

#### Scenario: Coolify API is unreachable
- **WHEN** the backend's call to the Coolify API for status fails (timeout, auth failure, or API outage)
- **THEN** the status panel MUST show "status temporarily unavailable" and MUST NOT show the site as "down"
