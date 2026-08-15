## ADDED Requirements

### Requirement: Operator identity matches ADMIN_EMAIL
A signed-in user is an operator only when ADMIN_EMAIL is non-empty and equals the session email after trim and ASCII case folding. An empty ADMIN_EMAIL MUST grant operator status to nobody.

#### Scenario: Matching email is operator
- **WHEN** ADMIN_EMAIL is Fish@Aiver.me and the session email is fish@aiver.me
- **THEN** operator checks MUST return true

#### Scenario: Empty ADMIN_EMAIL grants nobody
- **WHEN** ADMIN_EMAIL is unset or blank and any signed-in user calls GET /api/admin/settings/payuni
- **THEN** the response MUST be HTTP 403 and MUST NOT include ciphertext or full hashKey

##### Example: case-insensitive match
- **GIVEN** ADMIN_EMAIL=ops@startkiter.test and session email Ops@Startkiter.test
- **WHEN** the server evaluates operator status
- **THEN** the user is treated as operator

### Requirement: Unauthenticated admin settings fail closed
GET /api/admin/settings/payuni and PUT /api/admin/settings/payuni MUST require a session. Missing session MUST return HTTP 401. A signed-in non-operator MUST receive HTTP 403. GET /admin/settings for a non-operator MUST NOT render the PAYUNi key form.

#### Scenario: Anonymous GET settings API
- **WHEN** a client without a session sends GET /api/admin/settings/payuni
- **THEN** the response MUST be HTTP 401

#### Scenario: Learner is denied the settings page
- **WHEN** a signed-in user whose email is not ADMIN_EMAIL requests GET /admin/settings
- **THEN** the response MUST NOT include merchantId, hashKey, or hashIV input fields

### Requirement: Operator can read masked PAYUNi settings
GET /api/admin/settings/payuni as an operator MUST return HTTP 200 JSON with merchantId, hashKeyMasked, hashIVMasked, apiUrl, and source equal to settings, env, or none. The JSON MUST NOT contain the full hashKey or hashIV values.

#### Scenario: Masked response from settings
- **WHEN** an operator loads GET /api/admin/settings/payuni and a settings row exists with hashKey of 32 characters
- **THEN** hashKeyMasked MUST include asterisks and MUST NOT equal the stored hashKey, and source MUST be settings

#### Scenario: Source env when settings empty
- **WHEN** an operator loads GET /api/admin/settings/payuni with no settings row and PAYUNI_MERCHANT_ID set in env
- **THEN** source MUST be env and HTTP status MUST be 200

### Requirement: Operator can write encrypted PAYUNi settings
PUT /api/admin/settings/payuni as an operator MUST persist merchantId, hashKey, hashIV, and apiUrl encrypted at rest when SETTINGS_ENCRYPTION_KEY is configured. Missing SETTINGS_ENCRYPTION_KEY MUST return HTTP 503 and MUST NOT write plaintext. hashKey of length other than 32 or hashIV of length other than 16 when provided MUST return HTTP 400. Empty hashKey or hashIV on PUT MUST keep the previously stored secret. clear true MUST delete the payuni settings row so checkout falls back to env.

#### Scenario: Successful write
- **WHEN** an operator PUTs valid merchantId, 32-character hashKey, 16-character hashIV, and apiUrl with SETTINGS_ENCRYPTION_KEY set
- **THEN** the response MUST be HTTP 200 and a later GET MUST report source settings

#### Scenario: Write without encryption key
- **WHEN** an operator PUTs valid PAYUNi fields and SETTINGS_ENCRYPTION_KEY is unset
- **THEN** the response MUST be HTTP 503 and no site_setting row MUST be inserted

#### Scenario: Clear returns to env
- **WHEN** an operator PUTs clear true
- **THEN** the payuni settings row MUST be removed and GET source MUST be env if env keys exist otherwise none
