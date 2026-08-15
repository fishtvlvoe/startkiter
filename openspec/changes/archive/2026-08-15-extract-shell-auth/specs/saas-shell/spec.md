## ADDED Requirements

### Requirement: Monorepo shell boots locally

The StartKiter workspace SHALL provide a pnpm monorepo with apps/saas that serves Traditional Chinese public pages without requiring PAYUNi keys. Source repositories MUST NOT be modified by this change.

#### Scenario: Public home responds without payment keys

- **WHEN** an operator starts apps/saas with DATABASE_URL and BETTER_AUTH_SECRET set and without PAYUNi keys
- **THEN** GET / MUST return HTTP 200 and MUST NOT return HTTP 500

##### Example: 無金流金鑰仍能開首頁

- 環境變數含 DATABASE_URL 與 BETTER_AUTH_SECRET，缺少任何 PAYUNi 相關鍵
- 開發伺服器啟動後對 GET / 回應 200，body 為繁中公開頁

#### Scenario: Workspace root has the shell packages

- **WHEN** the extract-shell-auth change is applied
- **THEN** package.json, pnpm-workspace.yaml, apps/saas, packages/auth, and packages/database MUST exist at the workspace root

##### Example: Required workspace entries

- `test -f package.json`, `test -f pnpm-workspace.yaml`, `test -d apps/saas`, `test -d packages/auth`, and `test -d packages/database` all return success

### Requirement: Authenticated area requires a session

Unauthenticated users MUST NOT view the authenticated account area. Authenticated users SHALL reach a Traditional Chinese account area after sign-in.

#### Scenario: Anonymous user is redirected from the account area

- **WHEN** a browser without a session requests GET /app
- **THEN** the response MUST redirect to the login page and MUST NOT render account settings content

##### Example: No session cookie

- `GET /app` without a `better-auth.session_token` cookie returns HTTP 307 with `Location: /login`

#### Scenario: Signed-in user reaches the account area

- **WHEN** a user with a valid session requests GET /app
- **THEN** the response MUST be HTTP 200 and MUST render Traditional Chinese account UI

### Requirement: Locale is zh-TW only

The saas shell SHALL ship zh-TW as the only product locale. en, de, es, and fr locale packs MUST NOT be required to boot the app.

#### Scenario: Boot does not depend on non-zh locales

- **WHEN** apps/saas starts
- **THEN** missing en/de/es/fr message catalogs MUST NOT cause HTTP 500 on GET /

### Requirement: Organization tenancy is absent

The shell MUST NOT expose organization create, invitation, or org-scoped product routes. Billing and identity MUST attach to user.

#### Scenario: Organization routes are not product features

- **WHEN** a client requests GET /new-organization or GET /organization-invitation
- **THEN** the app MUST NOT expose those paths as working product features

##### Example: 組織路由不存在或明確不可用

- 未登入或已登入使用者請求 GET /new-organization
- 系統回傳 404，或不存在可建立組織的成功流程

#### Scenario: Database has no organization tables

- **WHEN** the Prisma schema for this change is inspected
- **THEN** it MUST NOT define organization, member, or invitation models

##### Example: Auth-only Prisma models

- The schema models are `User`, `Session`, `Account`, and `Verification`; no model or table named `organization`, `member`, or `invitation` exists
