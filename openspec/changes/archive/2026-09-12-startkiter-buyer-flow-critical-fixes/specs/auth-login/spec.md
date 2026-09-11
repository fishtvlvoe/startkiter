## ADDED Requirements

### Requirement: OAuth provider redirect URI matches the deployed domain

For every OAuth social login provider enabled on the production deployment (GitHub, Google), the provider's registered Authorization callback / redirect URI SHALL match the deployed callback path `https://app.startkiter.dev/api/auth/callback/<provider>` exactly.

#### Scenario: GitHub OAuth completes without a redirect URI error

- **WHEN** a user on `https://app.startkiter.dev/login` clicks the GitHub login control and completes the GitHub authorization prompt
- **THEN** the browser MUST land back on `https://app.startkiter.dev` with an established session, and MUST NOT show GitHub's `Invalid Redirect URI` error page

#### Scenario: Google OAuth completes without a redirect URI mismatch error

- **WHEN** a user on `https://app.startkiter.dev/login` clicks the Google login control and completes the Google consent screen
- **THEN** the browser MUST land back on `https://app.startkiter.dev` with an established session, and MUST NOT show Google's `Error 400: redirect_uri_mismatch` error page

### Requirement: GitHub login when configured

GitHub social login SHALL use Better Auth socialProviders.github. Missing GitHub client credentials MUST fail closed without sending the user to a broken OAuth URL.

#### Scenario: GitHub callback path exists when configured

- **WHEN** GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set and a user completes GitHub OAuth
- **THEN** GET /api/auth/callback/github MUST complete sign-in and MUST create or link an account with provider_id github

#### Scenario: Unconfigured GitHub is not offered as a working control

- **WHEN** GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing
- **THEN** the login page MUST NOT present GitHub as an enabled, clickable success path
