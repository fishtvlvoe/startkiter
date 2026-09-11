# auth-login Specification

## Purpose

Define the StartKiter Better Auth email/password, optional Google, and LINE Login Channel contract, including fail-closed behavior and LINE identities without provider email.

## Requirements

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
### Requirement: Login and signup forms use the shared design system

The login and signup pages SHALL be composed from packages/ui design-system Input, Button, and Form components rather than page-local hand-written form markup.

#### Scenario: Login form fields are design-system components

- **WHEN** GET /login is rendered
- **THEN** the email input, password input, and submit button MUST carry design-system component marker attributes rather than page-local class names as their only styling source

##### Example: No page-local form classes remain

- **GIVEN** the pre-migration login form used classes like `className="input"` and `className="button"`
- **WHEN** the migrated GET /login DOM is inspected
- **THEN** no form control MUST have `input` or `button` as its only class name; each MUST instead carry a `data-slot` attribute identifying it as a design-system component


<!-- @trace
source: extract-supastarter-design-system
updated: 2026-08-17
code:
  - packages/ui/src/components/input.tsx
  - docs/reference/supastarter-nextjs-docs/tasks/meta.json
  - packages/ui/src/components/tooltip.tsx
  - docs/design-system-demo/screenshots/course-light.png
  - packages/ui/src/components/badge.tsx
  - docs/reference/supastarter-nextjs-docs/storage/upload-files.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/console.mdx
  - docs/reference/supastarter-nextjs-docs/customization/dashboard.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/queuebase.mdx
  - apps/saas/app/course/course-workspace.tsx
  - docs/design-system-demo/demo.js
  - docs/reference/supastarter-nextjs-docs/authentication/meta.json
  - docs/reference/supastarter-nextjs-docs/organizations/configure.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/posthog.mdx
  - docs/reference/supastarter-nextjs-docs/api/meta.json
  - docs/reference/supastarter-nextjs-docs/index.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/meta.json
  - docs/design-system-demo/screenshots/app-collapsed.png
  - docs/reference/supastarter-nextjs-docs/authentication/oauth.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/qstash.mdx
  - packages/i18n/src/translations/en/marketing.json
  - docs/reference/supastarter-nextjs-docs/internationalization.mdx
  - docs/reference/supastarter-nextjs-docs/api/openapi.mdx
  - packages/i18n/src/index.ts
  - docs/reference/supastarter-nextjs-docs/api/define-endpoint.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/user-and-session.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/supabase.mdx
  - docs/design-system-demo/screenshots/app-dark.png
  - docs/reference/supastarter-nextjs-docs/skills.mdx
  - packages/i18n/src/translations/zh-tw/marketing.json
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - docs/reference/supastarter-nextjs-docs/deployment/docker.mdx
  - package.json
  - docs/reference/supastarter-nextjs-docs/database/schema.mdx
  - apps/saas/lib/request-locale.ts
  - docs/design-system-demo/screenshots/10.3/real-home.png
  - docs/reference/supastarter-nextjs-docs/deployment/vercel.mdx
  - docs/reference/supastarter-nextjs-docs/payments/paywall.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/umami.mdx
  - docs/reference/supastarter-nextjs-docs/api/overview.mdx
  - apps/saas/package.json
  - docs/reference/supastarter-nextjs-docs/deployment/railway.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/turso.mdx
  - packages/ui/src/components/button.tsx
  - docs/reference/supastarter-nextjs-docs/database/update-schema.mdx
  - packages/i18n/src/types.ts
  - docs/design-system-demo/screenshots/6.3/real-app-dark.png
  - docs/design-system-demo/screenshots/login-light.png
  - docs/design-system-demo/tokens.css
  - docs/reference/supastarter-nextjs-docs/mailing/custom.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/overview.mdx
  - packages/ui/src/components/spinner.tsx
  - docs/design-system-demo/screenshots/6.5/real-course-lesson-02.png
  - docs/reference/supastarter-nextjs-docs/storage/aws-s3.mdx
  - docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx
  - packages/ui/tsconfig.json
  - docs/reference/supastarter-nextjs-docs/deployment/coolify.mdx
  - apps/saas/app/design-system.css
  - packages/i18n/src/translations/en/saas.json
  - apps/saas/next-env.d.ts
  - docs/design-system-demo/screenshots/home-dark.png
  - AGENTS.md
  - docs/reference/supastarter-nextjs-docs/analytics/plausible.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/pirsch.mdx
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - docs/design-system-demo/screenshots/2.7/checkout.png
  - docs/reference/supastarter-nextjs-docs/codebase/meta.json
  - docs/discuss/README.md
  - docs/reference/supastarter-nextjs-docs/payments/check-purchases.mdx
  - docs/design-system-demo/screenshots/course-comments.png
  - docs/design-system-demo/screenshots/login-dark.png
  - packages/ui/src/components/card.tsx
  - vitest.config.ts
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - docs/reference/supastarter-nextjs-docs/analytics/google.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta-tags.mdx
  - docs/reference/supastarter-nextjs-docs/storage/overview.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/permissions.mdx
  - docs/design-system-demo/screenshots/home-light.png
  - docs/reference/supastarter-nextjs-docs/organizations/overview.mdx
  - packages/i18n/src/translations/zh-cn/shared.json
  - apps/saas/app/app/sign-out-button.tsx
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - docs/buyer-extension-convention.md
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/design-system-demo/screenshots/6.3/real-app-collapsed.png
  - docs/reference/supastarter-nextjs-docs/database/client.mdx
  - docs/reference/supastarter-nextjs-docs/api/use-locale.mdx
  - apps/saas/app/components/site-nav.tsx
  - docs/reference/supastarter-nextjs-docs/seo/sitemap.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/standalone-api.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/dependencies.mdx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/login/login-form.tsx
  - docs/design-system-demo/screenshots/6.5/real-course.png
  - docs/reference/supastarter-nextjs-docs/e2e.mdx
  - docs/reference/supastarter-nextjs-docs/ai/chatbot.mdx
  - docs/reference/supastarter-nextjs-docs/tech-stack.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/sentry.mdx
  - docs/reference/supastarter-nextjs-docs/storage/cloudflare-r2.mdx
  - docs/design-system-demo/screenshots/course-dark.png
  - docs/reference/supastarter-nextjs-docs/blog.mdx
  - docs/reference/supastarter-nextjs-docs/storage/access-files.mdx
  - docs/reference/supastarter-nextjs-docs/customization/onboarding.mdx
  - packages/ui/vitest.config.ts
  - packages/ui/src/components/label.tsx
  - docs/reference/supastarter-nextjs-docs/analytics/overview.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/flydotio.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/polar.mdx
  - docs/design-system-demo/screenshots/10.3/comparison.txt
  - docs/reference/supastarter-nextjs-docs/payments/usage-based-billing.mdx
  - docs/reference/supastarter-nextjs-docs/setup.mdx
  - docs/design-system-demo/screenshots/10.3/real-login.png
  - docs/reference/supastarter-nextjs-docs/analytics/meta.json
  - docs/reference/supastarter-nextjs-docs/database/providers/railway.mdx
  - docs/design-system-demo/login.html
  - packages/i18n/src/translations/zh-tw/saas.json
  - docs/design-system-demo/screenshots/10.3/real-app.png
  - docs/design-system-demo/screenshots/6.3/demo-app.png
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - packages/i18n/package.json
  - docs/reference/2026-08-17-supastarter-docs-analysis.md
  - docs/reference/supastarter-nextjs-docs/codebase/update.mdx
  - docs/design-system-demo/screenshots/app-light.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/recipes/meta.json
  - docs/reference/supastarter-nextjs-docs/storage/setup.mdx
  - packages/ui/src/components/form.tsx
  - docs/reference/supastarter-nextjs-docs/tasks/trigger-dev.mdx
  - docs/reference/supastarter-nextjs-docs/database/studio.mdx
  - docs/design-system-demo/course.html
  - packages/ui/src/components/color-mode-toggle.tsx
  - packages/i18n/src/translations/zh-cn/marketing.json
  - docs/reference/supastarter-nextjs-docs/analytics/vercel.mdx
  - apps/saas/app/components/locale-switcher.tsx
  - docs/design-system-demo/screenshots/2.7/admin_settings.png
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - docs/reference/supastarter-nextjs-docs/analytics/custom.mdx
  - docs/design-system-demo/app.html
  - docs/reference/supastarter-nextjs-docs/storage/uploadthing.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/stripe.mdx
  - apps/saas/app/components/app-shell.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/postmark.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/store-data-for-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/local-development.mdx
  - docs/discuss/organizations.md
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/ui/package.json
  - docs/reference/supastarter-nextjs-docs/mailing/overview.mdx
  - playwright.config.ts
  - docs/reference/supastarter-nextjs-docs/troubleshooting.mdx
  - docs/reference/supastarter-nextjs-docs/storage/meta.json
  - docs/reference/supastarter-nextjs-docs/database/providers/planetscale.mdx
  - docs/reference/supastarter-nextjs-docs/payments/overview.mdx
  - docs/design-system-demo/screenshots/6.2/real-home.png
  - packages/i18n/src/translations/en/shared.json
  - docs/design-system-demo/screenshots/2.7/course.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/creem.mdx
  - docs/reference/supastarter-nextjs-docs/api/streaming.mdx
  - apps/saas/app/agent/page.tsx
  - apps/saas/app/course/page.tsx
  - packages/ui/src/index.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/resend.mdx
  - docs/design-system-demo/screenshots/2.7/agent.png
  - docs/reference/supastarter-nextjs-docs/database/providers/meta.json
  - packages/i18n/src/config.ts
  - apps/saas/app/components/mobile-tabbar.tsx
  - docs/reference/supastarter-nextjs-docs/ai/meta.json
  - docs/reference/supastarter-nextjs-docs/meta.json
  - docs/reference/supastarter-nextjs-docs/analytics/vemetric.mdx
  - docs/reference/supastarter-nextjs-docs/payments/plans.mdx
  - docs/reference/supastarter-nextjs-docs/customization/styling.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/build-a-feedback-widget.mdx
  - docs/design-system-demo/screenshots/10.3/demo-login.png
  - docs/design-system-demo/home.html
  - docs/reference/supastarter-nextjs-docs/mailing/nodemailer.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/overview.mdx
  - docs/reference/supastarter-nextjs-docs/documentation.mdx
  - docs/reference/supastarter-nextjs-docs/customization/meta.json
  - apps/saas/app/components/theme-provider.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/render.mdx
  - apps/saas/app/layout.tsx
  - docs/design-system-demo/components.css
  - docs/design-system-demo/screenshots/10.3/demo-home.png
  - docs/design-system-demo/screenshots/6.3/real-app.png
  - apps/saas/app/admin/settings/page.tsx
  - docs/reference/supastarter-nextjs-docs/authentication/superadmin.mdx
  - deploy/zeabur.yaml
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - docs/reference/supastarter-nextjs-docs/codebase/structure.mdx
  - apps/saas/app/course/demo-grant-button.tsx
  - packages/ui/src/lib/index.ts
  - docs/design-system-demo/screenshots/course-collapsed.png
  - docs/reference/supastarter-nextjs-docs/recipes/supabase-setup.mdx
  - docs/reference/supastarter-nextjs-docs/storage/digitalocean-spaces.mdx
  - docs/design-system-demo/screenshots/6.5/demo-course.png
  - docs/reference/supastarter-nextjs-docs/seo/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/meta.json
  - docs/design-system-demo/screenshots/3.3/home.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/lemonsqueezy.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/formatting-and-linting.mdx
  - docs/design-system-demo/screenshots/6.2/demo-home.png
  - docs/reference/supastarter-nextjs-docs/customization/overview.mdx
  - apps/saas/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/organizations/meta.json
  - docs/reference/supastarter-nextjs-docs/database/overview.mdx
  - docs/reference/supastarter-nextjs-docs/configuration.mdx
  - docs/reference/supastarter-nextjs-docs/api/usage-in-frontend.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/neon.mdx
  - docs/design-system-demo/index.html
  - docs/reference/supastarter-nextjs-docs/deployment/netlify.mdx
  - packages/i18n/src/translations/zh-cn/saas.json
  - docs/reference/supastarter-nextjs-docs/organizations/use-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/payments/meta.json
  - apps/saas/app/signup/page.tsx
  - docs/design-system-demo/screenshots/10.3/demo-app.png
  - packages/i18n/vitest.config.ts
  - docs/reference/supastarter-nextjs-docs/database/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/overview.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/dodopayments.mdx
  - docs/reference/supastarter-nextjs-docs/ai/overview.mdx
  - packages/i18n/src/lib/get-messages.ts
  - packages/i18n/src/translations/zh-tw/shared.json
  - docs/reference/supastarter-nextjs-docs/analytics/mixpanel.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/overview.mdx
  - README.md
  - docs/reference/supastarter-nextjs-docs/ai/prompts.mdx
  - apps/saas/app/globals.css
  - docs/reference/supastarter-nextjs-docs/launch.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/vscode.mdx
tests:
  - apps/saas/lib/site-nav.test.tsx
  - packages/i18n/src/i18n.test.ts
  - apps/saas/lib/platform-shell.test.tsx
  - apps/saas/lib/course-shell.test.ts
  - apps/saas/lib/font-fallback.test.ts
  - e2e/startkiter.spec.ts
  - apps/saas/lib/home-shell.test.ts
  - apps/saas/lib/auth-providers.test.ts
  - apps/saas/lib/design-tokens.test.ts
  - apps/saas/lib/app-home.test.ts
  - packages/ui/src/version-gap.test.ts
  - apps/saas/lib/login-design-system.test.ts
  - apps/saas/lib/mobile-tabbar.test.tsx
  - docs/design-system-demo/demo.test.ts
  - packages/ui/src/components.test.tsx
-->

---
### Requirement: Auth provider list is structurally extensible

The set of enabled social login providers SHALL be defined as a list that can be extended with a new provider by adding a configuration entry, without requiring changes to the login page's layout markup.

#### Scenario: A new provider is enabled without layout changes

- **WHEN** a new social provider configuration entry is added to the provider list
- **THEN** the login page MUST render an additional provider button using the existing provider button layout, without any edit to the page's JSX structure outside the provider list iteration

##### Example: Adding GitHub as a third social provider

- **GIVEN** the provider list constant contains entries for `google` and `line`, each rendering a button via a `.map()` over the list
- **WHEN** a `github` entry is appended to the provider list constant
- **THEN** GET /login MUST render three provider buttons (google, line, github), and `git diff` for this change MUST show only the provider list constant file changed, not the login page's JSX layout file

<!-- @trace
source: extract-supastarter-design-system
updated: 2026-08-17
code:
  - packages/ui/src/components/input.tsx
  - docs/reference/supastarter-nextjs-docs/tasks/meta.json
  - packages/ui/src/components/tooltip.tsx
  - docs/design-system-demo/screenshots/course-light.png
  - packages/ui/src/components/badge.tsx
  - docs/reference/supastarter-nextjs-docs/storage/upload-files.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/console.mdx
  - docs/reference/supastarter-nextjs-docs/customization/dashboard.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/queuebase.mdx
  - apps/saas/app/course/course-workspace.tsx
  - docs/design-system-demo/demo.js
  - docs/reference/supastarter-nextjs-docs/authentication/meta.json
  - docs/reference/supastarter-nextjs-docs/organizations/configure.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/posthog.mdx
  - docs/reference/supastarter-nextjs-docs/api/meta.json
  - docs/reference/supastarter-nextjs-docs/index.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/meta.json
  - docs/design-system-demo/screenshots/app-collapsed.png
  - docs/reference/supastarter-nextjs-docs/authentication/oauth.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/qstash.mdx
  - packages/i18n/src/translations/en/marketing.json
  - docs/reference/supastarter-nextjs-docs/internationalization.mdx
  - docs/reference/supastarter-nextjs-docs/api/openapi.mdx
  - packages/i18n/src/index.ts
  - docs/reference/supastarter-nextjs-docs/api/define-endpoint.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/user-and-session.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/supabase.mdx
  - docs/design-system-demo/screenshots/app-dark.png
  - docs/reference/supastarter-nextjs-docs/skills.mdx
  - packages/i18n/src/translations/zh-tw/marketing.json
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - docs/reference/supastarter-nextjs-docs/deployment/docker.mdx
  - package.json
  - docs/reference/supastarter-nextjs-docs/database/schema.mdx
  - apps/saas/lib/request-locale.ts
  - docs/design-system-demo/screenshots/10.3/real-home.png
  - docs/reference/supastarter-nextjs-docs/deployment/vercel.mdx
  - docs/reference/supastarter-nextjs-docs/payments/paywall.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/umami.mdx
  - docs/reference/supastarter-nextjs-docs/api/overview.mdx
  - apps/saas/package.json
  - docs/reference/supastarter-nextjs-docs/deployment/railway.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/turso.mdx
  - packages/ui/src/components/button.tsx
  - docs/reference/supastarter-nextjs-docs/database/update-schema.mdx
  - packages/i18n/src/types.ts
  - docs/design-system-demo/screenshots/6.3/real-app-dark.png
  - docs/design-system-demo/screenshots/login-light.png
  - docs/design-system-demo/tokens.css
  - docs/reference/supastarter-nextjs-docs/mailing/custom.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/overview.mdx
  - packages/ui/src/components/spinner.tsx
  - docs/design-system-demo/screenshots/6.5/real-course-lesson-02.png
  - docs/reference/supastarter-nextjs-docs/storage/aws-s3.mdx
  - docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx
  - packages/ui/tsconfig.json
  - docs/reference/supastarter-nextjs-docs/deployment/coolify.mdx
  - apps/saas/app/design-system.css
  - packages/i18n/src/translations/en/saas.json
  - apps/saas/next-env.d.ts
  - docs/design-system-demo/screenshots/home-dark.png
  - AGENTS.md
  - docs/reference/supastarter-nextjs-docs/analytics/plausible.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/pirsch.mdx
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - docs/design-system-demo/screenshots/2.7/checkout.png
  - docs/reference/supastarter-nextjs-docs/codebase/meta.json
  - docs/discuss/README.md
  - docs/reference/supastarter-nextjs-docs/payments/check-purchases.mdx
  - docs/design-system-demo/screenshots/course-comments.png
  - docs/design-system-demo/screenshots/login-dark.png
  - packages/ui/src/components/card.tsx
  - vitest.config.ts
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - docs/reference/supastarter-nextjs-docs/analytics/google.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta-tags.mdx
  - docs/reference/supastarter-nextjs-docs/storage/overview.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/permissions.mdx
  - docs/design-system-demo/screenshots/home-light.png
  - docs/reference/supastarter-nextjs-docs/organizations/overview.mdx
  - packages/i18n/src/translations/zh-cn/shared.json
  - apps/saas/app/app/sign-out-button.tsx
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - docs/buyer-extension-convention.md
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/design-system-demo/screenshots/6.3/real-app-collapsed.png
  - docs/reference/supastarter-nextjs-docs/database/client.mdx
  - docs/reference/supastarter-nextjs-docs/api/use-locale.mdx
  - apps/saas/app/components/site-nav.tsx
  - docs/reference/supastarter-nextjs-docs/seo/sitemap.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/standalone-api.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/dependencies.mdx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/login/login-form.tsx
  - docs/design-system-demo/screenshots/6.5/real-course.png
  - docs/reference/supastarter-nextjs-docs/e2e.mdx
  - docs/reference/supastarter-nextjs-docs/ai/chatbot.mdx
  - docs/reference/supastarter-nextjs-docs/tech-stack.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/sentry.mdx
  - docs/reference/supastarter-nextjs-docs/storage/cloudflare-r2.mdx
  - docs/design-system-demo/screenshots/course-dark.png
  - docs/reference/supastarter-nextjs-docs/blog.mdx
  - docs/reference/supastarter-nextjs-docs/storage/access-files.mdx
  - docs/reference/supastarter-nextjs-docs/customization/onboarding.mdx
  - packages/ui/vitest.config.ts
  - packages/ui/src/components/label.tsx
  - docs/reference/supastarter-nextjs-docs/analytics/overview.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/flydotio.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/polar.mdx
  - docs/design-system-demo/screenshots/10.3/comparison.txt
  - docs/reference/supastarter-nextjs-docs/payments/usage-based-billing.mdx
  - docs/reference/supastarter-nextjs-docs/setup.mdx
  - docs/design-system-demo/screenshots/10.3/real-login.png
  - docs/reference/supastarter-nextjs-docs/analytics/meta.json
  - docs/reference/supastarter-nextjs-docs/database/providers/railway.mdx
  - docs/design-system-demo/login.html
  - packages/i18n/src/translations/zh-tw/saas.json
  - docs/design-system-demo/screenshots/10.3/real-app.png
  - docs/design-system-demo/screenshots/6.3/demo-app.png
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - packages/i18n/package.json
  - docs/reference/2026-08-17-supastarter-docs-analysis.md
  - docs/reference/supastarter-nextjs-docs/codebase/update.mdx
  - docs/design-system-demo/screenshots/app-light.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/recipes/meta.json
  - docs/reference/supastarter-nextjs-docs/storage/setup.mdx
  - packages/ui/src/components/form.tsx
  - docs/reference/supastarter-nextjs-docs/tasks/trigger-dev.mdx
  - docs/reference/supastarter-nextjs-docs/database/studio.mdx
  - docs/design-system-demo/course.html
  - packages/ui/src/components/color-mode-toggle.tsx
  - packages/i18n/src/translations/zh-cn/marketing.json
  - docs/reference/supastarter-nextjs-docs/analytics/vercel.mdx
  - apps/saas/app/components/locale-switcher.tsx
  - docs/design-system-demo/screenshots/2.7/admin_settings.png
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - docs/reference/supastarter-nextjs-docs/analytics/custom.mdx
  - docs/design-system-demo/app.html
  - docs/reference/supastarter-nextjs-docs/storage/uploadthing.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/stripe.mdx
  - apps/saas/app/components/app-shell.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/postmark.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/store-data-for-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/local-development.mdx
  - docs/discuss/organizations.md
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/ui/package.json
  - docs/reference/supastarter-nextjs-docs/mailing/overview.mdx
  - playwright.config.ts
  - docs/reference/supastarter-nextjs-docs/troubleshooting.mdx
  - docs/reference/supastarter-nextjs-docs/storage/meta.json
  - docs/reference/supastarter-nextjs-docs/database/providers/planetscale.mdx
  - docs/reference/supastarter-nextjs-docs/payments/overview.mdx
  - docs/design-system-demo/screenshots/6.2/real-home.png
  - packages/i18n/src/translations/en/shared.json
  - docs/design-system-demo/screenshots/2.7/course.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/creem.mdx
  - docs/reference/supastarter-nextjs-docs/api/streaming.mdx
  - apps/saas/app/agent/page.tsx
  - apps/saas/app/course/page.tsx
  - packages/ui/src/index.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/resend.mdx
  - docs/design-system-demo/screenshots/2.7/agent.png
  - docs/reference/supastarter-nextjs-docs/database/providers/meta.json
  - packages/i18n/src/config.ts
  - apps/saas/app/components/mobile-tabbar.tsx
  - docs/reference/supastarter-nextjs-docs/ai/meta.json
  - docs/reference/supastarter-nextjs-docs/meta.json
  - docs/reference/supastarter-nextjs-docs/analytics/vemetric.mdx
  - docs/reference/supastarter-nextjs-docs/payments/plans.mdx
  - docs/reference/supastarter-nextjs-docs/customization/styling.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/build-a-feedback-widget.mdx
  - docs/design-system-demo/screenshots/10.3/demo-login.png
  - docs/design-system-demo/home.html
  - docs/reference/supastarter-nextjs-docs/mailing/nodemailer.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/overview.mdx
  - docs/reference/supastarter-nextjs-docs/documentation.mdx
  - docs/reference/supastarter-nextjs-docs/customization/meta.json
  - apps/saas/app/components/theme-provider.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/render.mdx
  - apps/saas/app/layout.tsx
  - docs/design-system-demo/components.css
  - docs/design-system-demo/screenshots/10.3/demo-home.png
  - docs/design-system-demo/screenshots/6.3/real-app.png
  - apps/saas/app/admin/settings/page.tsx
  - docs/reference/supastarter-nextjs-docs/authentication/superadmin.mdx
  - deploy/zeabur.yaml
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - docs/reference/supastarter-nextjs-docs/codebase/structure.mdx
  - apps/saas/app/course/demo-grant-button.tsx
  - packages/ui/src/lib/index.ts
  - docs/design-system-demo/screenshots/course-collapsed.png
  - docs/reference/supastarter-nextjs-docs/recipes/supabase-setup.mdx
  - docs/reference/supastarter-nextjs-docs/storage/digitalocean-spaces.mdx
  - docs/design-system-demo/screenshots/6.5/demo-course.png
  - docs/reference/supastarter-nextjs-docs/seo/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/meta.json
  - docs/design-system-demo/screenshots/3.3/home.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/lemonsqueezy.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/formatting-and-linting.mdx
  - docs/design-system-demo/screenshots/6.2/demo-home.png
  - docs/reference/supastarter-nextjs-docs/customization/overview.mdx
  - apps/saas/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/organizations/meta.json
  - docs/reference/supastarter-nextjs-docs/database/overview.mdx
  - docs/reference/supastarter-nextjs-docs/configuration.mdx
  - docs/reference/supastarter-nextjs-docs/api/usage-in-frontend.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/neon.mdx
  - docs/design-system-demo/index.html
  - docs/reference/supastarter-nextjs-docs/deployment/netlify.mdx
  - packages/i18n/src/translations/zh-cn/saas.json
  - docs/reference/supastarter-nextjs-docs/organizations/use-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/payments/meta.json
  - apps/saas/app/signup/page.tsx
  - docs/design-system-demo/screenshots/10.3/demo-app.png
  - packages/i18n/vitest.config.ts
  - docs/reference/supastarter-nextjs-docs/database/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/overview.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/dodopayments.mdx
  - docs/reference/supastarter-nextjs-docs/ai/overview.mdx
  - packages/i18n/src/lib/get-messages.ts
  - packages/i18n/src/translations/zh-tw/shared.json
  - docs/reference/supastarter-nextjs-docs/analytics/mixpanel.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/overview.mdx
  - README.md
  - docs/reference/supastarter-nextjs-docs/ai/prompts.mdx
  - apps/saas/app/globals.css
  - docs/reference/supastarter-nextjs-docs/launch.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/vscode.mdx
tests:
  - apps/saas/lib/site-nav.test.tsx
  - packages/i18n/src/i18n.test.ts
  - apps/saas/lib/platform-shell.test.tsx
  - apps/saas/lib/course-shell.test.ts
  - apps/saas/lib/font-fallback.test.ts
  - e2e/startkiter.spec.ts
  - apps/saas/lib/home-shell.test.ts
  - apps/saas/lib/auth-providers.test.ts
  - apps/saas/lib/design-tokens.test.ts
  - apps/saas/lib/app-home.test.ts
  - packages/ui/src/version-gap.test.ts
  - apps/saas/lib/login-design-system.test.ts
  - apps/saas/lib/mobile-tabbar.test.tsx
  - docs/design-system-demo/demo.test.ts
  - packages/ui/src/components.test.tsx
-->

---
### Requirement: OAuth provider redirect URI matches the deployed domain

For every OAuth social login provider enabled on the production deployment (GitHub, Google), the provider's registered Authorization callback / redirect URI SHALL match the deployed callback path `https://app.startkiter.dev/api/auth/callback/<provider>` exactly.

#### Scenario: GitHub OAuth completes without a redirect URI error

- **WHEN** a user on `https://app.startkiter.dev/login` clicks the GitHub login control and completes the GitHub authorization prompt
- **THEN** the browser MUST land back on `https://app.startkiter.dev` with an established session, and MUST NOT show GitHub's `Invalid Redirect URI` error page

#### Scenario: Google OAuth completes without a redirect URI mismatch error

- **WHEN** a user on `https://app.startkiter.dev/login` clicks the Google login control and completes the Google consent screen
- **THEN** the browser MUST land back on `https://app.startkiter.dev` with an established session, and MUST NOT show Google's `Error 400: redirect_uri_mismatch` error page


<!-- @trace
source: startkiter-buyer-flow-critical-fixes
updated: 2026-09-12
code:
  - apps/saas/config.ts
-->

---
### Requirement: GitHub login when configured

GitHub social login SHALL use Better Auth socialProviders.github. Missing GitHub client credentials MUST fail closed without sending the user to a broken OAuth URL.

#### Scenario: GitHub callback path exists when configured

- **WHEN** GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set and a user completes GitHub OAuth
- **THEN** GET /api/auth/callback/github MUST complete sign-in and MUST create or link an account with provider_id github

#### Scenario: Unconfigured GitHub is not offered as a working control

- **WHEN** GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing
- **THEN** the login page MUST NOT present GitHub as an enabled, clickable success path

<!-- @trace
source: startkiter-buyer-flow-critical-fixes
updated: 2026-09-12
code:
  - apps/saas/config.ts
-->