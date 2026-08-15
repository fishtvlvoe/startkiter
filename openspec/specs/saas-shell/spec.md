# saas-shell Specification

## Purpose

Define the StartKiter zh-TW pnpm shell, authenticated `/app` area, and the absence of organization tenancy and payment routes in the shell extract.

## Requirements

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


<!-- @trace
source: extract-shell-auth
updated: 2026-08-15
code:
  - packages/utils/src/index.ts
  - AGENTS.md
  - packages/utils/tsconfig.json
  - apps/saas/app/globals.css
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/not-found.tsx
  - apps/saas/package.json
  - packages/i18n/src/index.ts
  - apps/saas/app/app/page.tsx
  - packages/auth/package.json
  - apps/saas/app/login/page.tsx
  - package.json
  - packages/auth/src/index.ts
  - apps/saas/app/signup/page.tsx
  - packages/auth/tsconfig.json
  - tsconfig.json
  - packages/database/package.json
  - packages/auth/src/auth.ts
  - apps/saas/app/page.tsx
  - apps/saas/.env.example
  - packages/ui/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - README.md
  - vitest.config.ts
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/ui/tsconfig.json
  - tooling/typescript/base.json
  - turbo.json
  - tooling/typescript/package.json
  - packages/auth/src/providers.ts
  - apps/saas/tsconfig.json
  - apps/saas/app/layout.tsx
  - packages/ui/src/index.tsx
  - pnpm-workspace.yaml
  - packages/auth/src/test-auth.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/next-env.d.ts
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/database/src/index.ts
  - packages/i18n/package.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/i18n/tsconfig.json
tests:
  - packages/auth/src/auth.test.ts
-->

---
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


<!-- @trace
source: extract-shell-auth
updated: 2026-08-15
code:
  - packages/utils/src/index.ts
  - AGENTS.md
  - packages/utils/tsconfig.json
  - apps/saas/app/globals.css
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/not-found.tsx
  - apps/saas/package.json
  - packages/i18n/src/index.ts
  - apps/saas/app/app/page.tsx
  - packages/auth/package.json
  - apps/saas/app/login/page.tsx
  - package.json
  - packages/auth/src/index.ts
  - apps/saas/app/signup/page.tsx
  - packages/auth/tsconfig.json
  - tsconfig.json
  - packages/database/package.json
  - packages/auth/src/auth.ts
  - apps/saas/app/page.tsx
  - apps/saas/.env.example
  - packages/ui/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - README.md
  - vitest.config.ts
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/ui/tsconfig.json
  - tooling/typescript/base.json
  - turbo.json
  - tooling/typescript/package.json
  - packages/auth/src/providers.ts
  - apps/saas/tsconfig.json
  - apps/saas/app/layout.tsx
  - packages/ui/src/index.tsx
  - pnpm-workspace.yaml
  - packages/auth/src/test-auth.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/next-env.d.ts
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/database/src/index.ts
  - packages/i18n/package.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/i18n/tsconfig.json
tests:
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Locale is zh-TW only

The saas shell SHALL ship zh-TW as the only product locale. en, de, es, and fr locale packs MUST NOT be required to boot the app.

#### Scenario: Boot does not depend on non-zh locales

- **WHEN** apps/saas starts
- **THEN** missing en/de/es/fr message catalogs MUST NOT cause HTTP 500 on GET /


<!-- @trace
source: extract-shell-auth
updated: 2026-08-15
code:
  - packages/utils/src/index.ts
  - AGENTS.md
  - packages/utils/tsconfig.json
  - apps/saas/app/globals.css
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/not-found.tsx
  - apps/saas/package.json
  - packages/i18n/src/index.ts
  - apps/saas/app/app/page.tsx
  - packages/auth/package.json
  - apps/saas/app/login/page.tsx
  - package.json
  - packages/auth/src/index.ts
  - apps/saas/app/signup/page.tsx
  - packages/auth/tsconfig.json
  - tsconfig.json
  - packages/database/package.json
  - packages/auth/src/auth.ts
  - apps/saas/app/page.tsx
  - apps/saas/.env.example
  - packages/ui/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - README.md
  - vitest.config.ts
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/ui/tsconfig.json
  - tooling/typescript/base.json
  - turbo.json
  - tooling/typescript/package.json
  - packages/auth/src/providers.ts
  - apps/saas/tsconfig.json
  - apps/saas/app/layout.tsx
  - packages/ui/src/index.tsx
  - pnpm-workspace.yaml
  - packages/auth/src/test-auth.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/next-env.d.ts
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/database/src/index.ts
  - packages/i18n/package.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/i18n/tsconfig.json
tests:
  - packages/auth/src/auth.test.ts
-->

---
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

<!-- @trace
source: extract-shell-auth
updated: 2026-08-15
code:
  - packages/utils/src/index.ts
  - AGENTS.md
  - packages/utils/tsconfig.json
  - apps/saas/app/globals.css
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/not-found.tsx
  - apps/saas/package.json
  - packages/i18n/src/index.ts
  - apps/saas/app/app/page.tsx
  - packages/auth/package.json
  - apps/saas/app/login/page.tsx
  - package.json
  - packages/auth/src/index.ts
  - apps/saas/app/signup/page.tsx
  - packages/auth/tsconfig.json
  - tsconfig.json
  - packages/database/package.json
  - packages/auth/src/auth.ts
  - apps/saas/app/page.tsx
  - apps/saas/.env.example
  - packages/ui/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - README.md
  - vitest.config.ts
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/ui/tsconfig.json
  - tooling/typescript/base.json
  - turbo.json
  - tooling/typescript/package.json
  - packages/auth/src/providers.ts
  - apps/saas/tsconfig.json
  - apps/saas/app/layout.tsx
  - packages/ui/src/index.tsx
  - pnpm-workspace.yaml
  - packages/auth/src/test-auth.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/next-env.d.ts
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/database/src/index.ts
  - packages/i18n/package.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/i18n/tsconfig.json
tests:
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Operator navigation reaches settings
When a signed-in operator views authenticated primary navigation, a link to /admin/settings MUST be visible. Learners MUST NOT see that link.

#### Scenario: Operator nav includes settings
- **WHEN** a signed-in operator views a page that renders SiteNav
- **THEN** a link targeting /admin/settings MUST be present

#### Scenario: Learner nav omits settings
- **WHEN** a signed-in learner whose email is not ADMIN_EMAIL views SiteNav
- **THEN** the document MUST NOT contain a hyperlink to /admin/settings

<!-- @trace
source: operator-payuni-settings
updated: 2026-08-15
code:
  - apps/saas/app/admin/settings/payuni-settings-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/lib/orders.ts
  - apps/saas/lib/site-settings.ts
  - apps/saas/lib/settings-crypto.ts
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/api/admin/settings/payuni/route.ts
  - apps/saas/app/admin/settings/page.tsx
  - apps/saas/lib/payuni-settings-view.ts
  - apps/saas/.env.example
  - apps/saas/lib/operator.ts
  - packages/database/prisma/migrations/20260815040000_add_site_setting/migration.sql
  - packages/database/prisma/schema.prisma
  - docs/deploy-and-public-url.md
  - packages/payments/src/index.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/lib/payuni-settings.ts
tests:
  - apps/saas/lib/operator.test.ts
  - apps/saas/lib/orders-credentials.test.ts
  - apps/saas/lib/payuni-settings-view.test.ts
  - apps/saas/lib/payuni-settings.test.ts
  - apps/saas/lib/site-settings.test.ts
  - apps/saas/lib/settings-crypto.test.ts
-->