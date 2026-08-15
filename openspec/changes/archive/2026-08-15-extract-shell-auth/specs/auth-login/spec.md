## ADDED Requirements

### Requirement: Email password auth works

The auth package SHALL support email/password sign-up and sign-in through Better Auth mounted at /api/auth/*. Empty email or empty password MUST fail closed.

#### Scenario: Sign-up with email and password

- **WHEN** a client sends POST /api/auth/sign-up/email with a non-empty email and password that meets the configured minimum length
- **THEN** the response MUST be HTTP 200 and a user row MUST exist for that email

##### Example: 成功註冊

- POST /api/auth/sign-up/email body email=alice@example.com password=StartKiter1!
- 回應 200，user.email=alice@example.com 存在

#### Scenario: Sign-in with email and password

- **WHEN** an existing user sends POST /api/auth/sign-in/email with correct email and password
- **THEN** the response MUST be HTTP 200 and a session MUST be established

#### Scenario: Empty credentials are rejected

- **WHEN** a client sends POST /api/auth/sign-up/email with email "" or password ""
- **THEN** the response MUST be HTTP 400 and MUST NOT create a user row

##### Example: 空密碼拒絕

| Input email | Input password | Expected |
| ----- | ----- | ----- |
| "" | StartKiter1! | HTTP 400, no user |
| alice@example.com | "" | HTTP 400, no user |

### Requirement: Google login when configured

Google social login SHALL use Better Auth socialProviders.google. Missing Google client credentials MUST fail closed without sending the user to a broken OAuth URL.

#### Scenario: Google callback path exists when configured

- **WHEN** GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set and a user completes Google OAuth
- **THEN** GET /api/auth/callback/google MUST complete sign-in and MUST create or link an account with provider_id google

##### Example: Google provider is configured

- `GOOGLE_CLIENT_ID=google-id` and `GOOGLE_CLIENT_SECRET=google-secret` enable the Better Auth Google provider and its `/api/auth/callback/google` callback path

#### Scenario: Unconfigured Google is not offered as a working control

- **WHEN** GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing
- **THEN** the login page MUST NOT present Google as an enabled, clickable success path

##### Example: Incomplete Google credentials

- With `GOOGLE_CLIENT_ID=google-id` and an empty `GOOGLE_CLIENT_SECRET`, `GET /login` contains no enabled Google login control

### Requirement: LINE login uses Login Channel only

LINE login SHALL use Better Auth socialProviders.line with LINE Login Channel ID and Channel Secret. Messaging API tokens MUST NOT be required to sign in. PHP, LIFF, and Bot clients MUST NOT be ported.

#### Scenario: LINE callback succeeds with Login Channel credentials

- **WHEN** LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are set and a user completes LINE OAuth
- **THEN** GET /api/auth/callback/line MUST complete sign-in and MUST create or link an account with provider_id line

##### Example: 只用 Login Channel

- 後台或 env 僅有 LINE_CHANNEL_ID=1234567890 與 LINE_CHANNEL_SECRET=abcd1234efgh5678
- 系統不要求 Messaging Channel Access Token，學員仍可完成 LINE 登入

#### Scenario: Missing LINE email is allowed

- **WHEN** the LINE id_token contains no email
- **THEN** account linking MUST key off the LINE userId and MUST NOT fail solely because email is empty

##### Example: 無 email 仍可登入

- LINE userId=U1234567890abcdef 完成登入，id_token 無 email
- account.provider_id=line、account.account_id=U1234567890abcdef 被建立或連結，登入成功

#### Scenario: Unconfigured LINE is not offered as a working control

- **WHEN** LINE_CHANNEL_ID or LINE_CHANNEL_SECRET is missing
- **THEN** the login page MUST NOT present LINE as an enabled, clickable success path

##### Example: Incomplete LINE credentials

- With `LINE_CHANNEL_ID=1234567890` and an empty `LINE_CHANNEL_SECRET`, `GET /login` contains no enabled LINE login control

### Requirement: Auth secrets fail closed

Missing DATABASE_URL or BETTER_AUTH_SECRET MUST prevent treating the caller as authenticated. The system MUST NOT mint a valid session without those values.

#### Scenario: Missing BETTER_AUTH_SECRET blocks session creation

- **WHEN** BETTER_AUTH_SECRET is unset and a client calls POST /api/auth/sign-in/email
- **THEN** the request MUST fail closed and MUST NOT establish a valid session

##### Example: Secret missing

- `POST /api/auth/sign-in/email` with no `BETTER_AUTH_SECRET` returns HTTP 503 and no `Set-Cookie` header

#### Scenario: Missing DATABASE_URL blocks persistence

- **WHEN** DATABASE_URL is unset and a client calls POST /api/auth/sign-up/email
- **THEN** the request MUST fail closed and MUST NOT claim the user was created

##### Example: Database URL missing

- `POST /api/auth/sign-up/email` with no `DATABASE_URL` returns HTTP 503 and the database contains no new user row
