## MODIFIED Requirements

### Requirement: Operator identity matches ADMIN_EMAIL
A signed-in user is an operator when either (a) ADMIN_EMAIL is non-empty and equals the session email after trim and ASCII case folding, or (b) the user's role equals `admin`. An empty ADMIN_EMAIL and a non-admin role together MUST grant operator status to nobody.

#### Scenario: Matching email is operator
- **WHEN** ADMIN_EMAIL is Fish@Aiver.me and the session email is fish@aiver.me
- **THEN** operator checks MUST return true

#### Scenario: Admin role is operator even when email does not match ADMIN_EMAIL
- **WHEN** ADMIN_EMAIL is fish@aiver.me and a signed-in user's email is teammate@aiver.me with role `admin`
- **THEN** operator checks MUST return true

#### Scenario: Neither condition grants nobody
- **WHEN** ADMIN_EMAIL is unset or blank and any signed-in user with role other than `admin` calls GET /api/admin/settings/payuni
- **THEN** the response MUST be HTTP 403 and MUST NOT include ciphertext or full hashKey

##### Example: case-insensitive match
- **GIVEN** ADMIN_EMAIL=ops@startkiter.test and session email Ops@Startkiter.test
- **WHEN** the server evaluates operator status
- **THEN** the user is treated as operator
