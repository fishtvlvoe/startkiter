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

The saas shell SHALL ship zh-TW, zh-CN, and en as the supported product locales at launch, with an architecture that allows additional locales to be added without component changes. zh-TW MUST remain the fallback locale for missing translation keys in any other locale.

#### Scenario: Boot does not depend on unconfigured locales

- **WHEN** apps/saas starts
- **THEN** missing message catalogs for locales other than zh-TW, zh-CN, and en MUST NOT cause HTTP 500 on GET /

#### Scenario: All three launch locales serve the public homepage

- **WHEN** a client requests GET /zh-tw, GET /zh-cn, and GET /en
- **THEN** each request MUST return HTTP 200 with page text rendered in the corresponding locale


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

---
### Requirement: Shell pages use the shared design system

apps/saas pages SHALL be composed from packages/ui design-system components (see the design-system capability) rather than page-local hand-written CSS classes for buttons, cards, badges, and form controls.

#### Scenario: Public homepage does not use bespoke button classes

- **WHEN** GET / is rendered
- **THEN** the DOM MUST NOT contain elements whose only styling comes from a page-local class named "button" or "hero" and MUST instead contain design-system component marker attributes


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
### Requirement: Marketing surface and app surface are not required to share identical layout

The public marketing pages (equivalent to supastarter.dev's presentation) and the authenticated app pages (equivalent to demo.supastarter.dev's presentation) SHALL NOT be required to use identical layout density or visual emphasis. Both SHALL draw their colors, typography, and components from the same shared design-system tokens defined in the design-system capability.

#### Scenario: Marketing and app pages share design tokens despite different layouts

- **WHEN** the computed CSS custom properties for color tokens are compared between GET / (marketing) and GET /app (authenticated app area)
- **THEN** the token values MUST be identical even if the two pages arrange components differently

##### Example: Same accent token, different layout density

- **GIVEN** GET / renders a centered single-column hero with generous vertical spacing, and GET /app renders a dense sidebar-plus-content-grid layout
- **WHEN** the `--accent` (or equivalently named accent color) CSS custom property is read from both pages' document roots
- **THEN** both pages MUST report the same hex value for `--accent`, even though the two pages' component arrangement differs

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
### Requirement: Operator role determines visible permission-gated navigation

The AppShell SHALL determine which navigation items and page-level actions are visible using a typed permission check (`usePermissions`) against the four-value role set defined in the `organization-tenancy` capability (owner/admin/instructor/user), rather than the single boolean `requiresOperator` check used previously. A user whose role lacks a given permission MUST NOT see the navigation item or action gated by that permission.

#### Scenario: Instructor sees content management but not billing navigation

- **WHEN** a signed-in user with the `instructor` role views the AppShell sidebar
- **THEN** the sidebar MUST show course content management navigation and MUST NOT show organization billing or member management navigation

#### Scenario: Owner sees all permission-gated navigation

- **WHEN** a signed-in user with the `owner` role views the AppShell sidebar
- **THEN** the sidebar MUST show organization billing, member management, and course content management navigation

#### Scenario: Permission check fails closed when role is unknown

- **WHEN** `usePermissions` cannot resolve a role for the current session
- **THEN** the AppShell MUST treat the user as having no permissions and MUST NOT show any permission-gated navigation item, and MUST NOT throw an unhandled exception


<!-- @trace
source: rebuild-design-system-from-source
updated: 2026-08-18
code:
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - docs/reference/supastarter-nextjs-docs/database/update-schema.mdx
  - docs/reference/supastarter-nextjs-docs/payments/paywall.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-agent.png
  - apps/saas/app/components/organization-select.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/nodemailer.mdx
  - packages/tooling/tailwind/theme.css
  - docs/reference/supastarter-nextjs-docs/database/providers/planetscale.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-home.png
  - docs/reference/supastarter-nextjs-docs/organizations/configure.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/vscode.mdx
  - packages/ui/src/components/dropdown-menu.tsx
  - docs/verification/rebuild-design-system-from-source/9.3-login.png
  - docs/reference/supastarter-nextjs-docs/ai/prompts.mdx
  - docs/reference/supastarter-nextjs-docs/e2e.mdx
  - packages/ui/src/components/color-mode-toggle.tsx
  - docs/reference/supastarter-nextjs-docs/storage/access-files.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/umami.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/dependencies.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/console.mdx
  - docs/reference/supastarter-nextjs-docs/payments/meta.json
  - docs/reference/supastarter-nextjs-docs/monitoring/meta.json
  - docs/reference/supastarter-nextjs-docs/analytics/meta.json
  - packages/ui/src/components/label.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/resend.mdx
  - docs/reference/2026-08-17-supastarter-docs-analysis.md
  - packages/ui/src/index.tsx
  - apps/saas/app/components/site-nav.tsx
  - docs/reference/supastarter-nextjs-docs/payments/providers/lemonsqueezy.mdx
  - packages/ui/src/components/tooltip.tsx
  - docs/reference/supastarter-nextjs-docs/storage/overview.mdx
  - docs/reference/supastarter-nextjs-docs/api/define-endpoint.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-admin-settings.png
  - docs/reference/supastarter-nextjs-docs/api/use-locale.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/store-data-for-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/troubleshooting.mdx
  - docs/reference/supastarter-nextjs-docs/storage/upload-files.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/flydotio.mdx
  - apps/saas/app/components/mobile-tabbar.tsx
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/design-system.css
  - docs/reference/supastarter-nextjs-docs/analytics/vemetric.mdx
  - docs/reference/supastarter-nextjs-docs/seo/sitemap.mdx
  - docs/reference/supastarter-nextjs-docs/database/overview.mdx
  - apps/saas/lib/organization.ts
  - docs/reference/supastarter-nextjs-docs/documentation.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/permissions.mdx
  - docs/reference/supastarter-nextjs-docs/payments/plans.mdx
  - packages/ui/src/components/badge.tsx
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - docs/reference/supastarter-nextjs-docs/database/schema.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/overview.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/polar.mdx
  - docs/reference/supastarter-nextjs-docs/payments/usage-based-billing.mdx
  - docs/reference/supastarter-nextjs-docs/customization/onboarding.mdx
  - apps/saas/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/organizations/use-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/trigger-dev.mdx
  - docs/reference/supastarter-nextjs-docs/database/studio.mdx
  - docs/reference/supastarter-nextjs-docs/ai/meta.json
  - docs/reference/supastarter-nextjs-docs/storage/uploadthing.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/meta.json
  - docs/reference/supastarter-nextjs-docs/recipes/build-a-feedback-widget.mdx
  - AGENTS.md
  - docs/reference/supastarter-nextjs-docs/configuration.mdx
  - apps/saas/app/login/login-form.tsx
  - apps/saas/lib/agent-data.ts
  - docs/reference/supastarter-nextjs-docs/tech-stack.mdx
  - docs/verification/rebuild-design-system-from-source/2.3-home-inter-fallback.png
  - packages/ui/src/components/form.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/railway.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/posthog.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/pirsch.mdx
  - docs/reference/supastarter-nextjs-docs/api/meta.json
  - docs/reference/supastarter-nextjs-docs/codebase/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/check-purchases.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/meta.json
  - docs/reference/supastarter-nextjs-docs/database/meta.json
  - docs/reference/supastarter-nextjs-docs/setup.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/overview.mdx
  - packages/ui/src/components/button.tsx
  - docs/reference/supastarter-nextjs-docs/authentication/oauth.mdx
  - docs/reference/supastarter-nextjs-docs/api/overview.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-app.png
  - docs/reference/supastarter-nextjs-docs/customization/styling.mdx
  - docs/reference/supastarter-nextjs-docs/internationalization.mdx
  - apps/saas/app/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/dodopayments.mdx
  - docs/reference/supastarter-nextjs-docs/storage/aws-s3.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/meta.json
  - docs/reference/supastarter-nextjs-docs/monitoring/overview.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/user-and-session.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/turso.mdx
  - docs/reference/supastarter-nextjs-docs/ai/overview.mdx
  - docs/reference/supastarter-nextjs-docs/meta.json
  - docs/reference/supastarter-nextjs-docs/mailing/postmark.mdx
  - docs/reference/supastarter-nextjs-docs/skills.mdx
  - apps/saas/package.json
  - docs/reference/supastarter-nextjs-docs/monitoring/sentry.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/plausible.mdx
  - apps/saas/app/course/course-workspace.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/railway.mdx
  - docs/reference/supastarter-nextjs-docs/launch.mdx
  - docs/reference/supastarter-nextjs-docs/ai/chatbot.mdx
  - docs/reference/supastarter-nextjs-docs/customization/overview.mdx
  - packages/ui/src/components/logo.tsx
  - docs/reference/supastarter-nextjs-docs/analytics/custom.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/render.mdx
  - docs/cr-report-rebuild-design-system-from-source.md
  - docs/reference/supastarter-nextjs-docs/deployment/docker.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/queuebase.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/supabase-setup.mdx
  - docs/reference/supastarter-nextjs-docs/database/client.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/coolify.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/stripe.mdx
  - docs/reference/supastarter-nextjs-docs/index.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/creem.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/meta.json
  - docs/reference/supastarter-nextjs-docs/authentication/overview.mdx
  - apps/saas/app/components/app-shell.tsx
  - docs/reference/supastarter-nextjs-docs/codebase/structure.mdx
  - apps/saas/app/globals.css
  - docs/verification/rebuild-design-system-from-source/5.3-app-dark.png
  - docs/reference/supastarter-nextjs-docs/customization/dashboard.mdx
  - apps/saas/app/course/page.tsx
  - docs/reference/supastarter-nextjs-docs/codebase/update.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/custom.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/supabase.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/meta.json
  - docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/overview.mdx
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - docs/reference/supastarter-nextjs-docs/authentication/superadmin.mdx
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - docs/verification/rebuild-design-system-from-source/5.3-app-light.png
  - docs/reference/supastarter-nextjs-docs/authentication/meta.json
  - docs/reference/supastarter-nextjs-docs/codebase/formatting-and-linting.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/overview.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/overview.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta-tags.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/google.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/vercel.mdx
  - docs/reference/supastarter-nextjs-docs/api/usage-in-frontend.mdx
  - docs/reference/supastarter-nextjs-docs/api/streaming.mdx
  - docs/reference/supastarter-nextjs-docs/storage/meta.json
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - docs/verification/rebuild-design-system-from-source/9.3-course.png
  - docs/reference/supastarter-nextjs-docs/customization/meta.json
  - docs/reference/supastarter-nextjs-docs/tasks/qstash.mdx
  - docs/reference/supastarter-nextjs-docs/blog.mdx
  - packages/ui/package.json
  - apps/saas/lib/permissions.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/neon.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/standalone-api.mdx
  - docs/verification/rebuild-design-system-from-source/5.3-home-light.png
  - docs/reference/supastarter-nextjs-docs/analytics/mixpanel.mdx
  - docs/reference/supastarter-nextjs-docs/storage/cloudflare-r2.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/local-development.mdx
  - docs/reference/supastarter-nextjs-docs/storage/digitalocean-spaces.mdx
  - docs/reference/supastarter-nextjs-docs/payments/overview.mdx
  - docs/reference/supastarter-nextjs-docs/storage/setup.mdx
  - apps/saas/postcss.config.cjs
  - packages/ui/src/components/input.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/netlify.mdx
  - docs/reference/supastarter-nextjs-docs/api/openapi.mdx
  - apps/saas/app/layout.tsx
  - docs/verification/rebuild-design-system-from-source/5.3-home-dark.png
  - docs/reference/supastarter-nextjs-docs/analytics/vercel.mdx
tests:
  - packages/ui/src/components-source.test.ts
  - apps/saas/lib/organization-switcher.test.tsx
  - apps/saas/lib/mobile-tabbar.test.tsx
  - packages/ui/src/form-components-source.test.ts
  - apps/saas/lib/permissions.test.tsx
  - apps/saas/lib/design-tokens.test.ts
  - packages/ui/src/version-gap.test.ts
  - apps/saas/lib/css-architecture.test.ts
  - apps/saas/lib/platform-shell.test.tsx
  - apps/saas/lib/font-fallback.test.ts
  - packages/ui/src/interactive-components-source.test.tsx
  - packages/ui/src/components.test.tsx
-->

---
### Requirement: Multi-organization users can switch active organization from the shell

When a signed-in user belongs to more than one organization, the AppShell SHALL render an organization switcher control in the sidebar user area that lists the user's organizations and allows switching the active organization context.

#### Scenario: User with multiple organizations sees the switcher

- **WHEN** a signed-in user who is a member of two or more organizations views the AppShell sidebar
- **THEN** the sidebar user area MUST contain an organization switcher control listing all organizations the user belongs to

#### Scenario: User with exactly one organization does not see the switcher

- **WHEN** a signed-in user who belongs to exactly one organization views the AppShell sidebar
- **THEN** the sidebar user area MUST NOT render an organization switcher control

#### Scenario: Switching organization updates the active context

- **WHEN** a user with multiple organizations selects a different organization in the switcher
- **THEN** subsequent navigation and data queries MUST scope to the newly selected organization, and the previously active organization's data MUST NOT remain visible

<!-- @trace
source: rebuild-design-system-from-source
updated: 2026-08-18
code:
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - docs/reference/supastarter-nextjs-docs/database/update-schema.mdx
  - docs/reference/supastarter-nextjs-docs/payments/paywall.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-agent.png
  - apps/saas/app/components/organization-select.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/nodemailer.mdx
  - packages/tooling/tailwind/theme.css
  - docs/reference/supastarter-nextjs-docs/database/providers/planetscale.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-home.png
  - docs/reference/supastarter-nextjs-docs/organizations/configure.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/vscode.mdx
  - packages/ui/src/components/dropdown-menu.tsx
  - docs/verification/rebuild-design-system-from-source/9.3-login.png
  - docs/reference/supastarter-nextjs-docs/ai/prompts.mdx
  - docs/reference/supastarter-nextjs-docs/e2e.mdx
  - packages/ui/src/components/color-mode-toggle.tsx
  - docs/reference/supastarter-nextjs-docs/storage/access-files.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/umami.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/dependencies.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/console.mdx
  - docs/reference/supastarter-nextjs-docs/payments/meta.json
  - docs/reference/supastarter-nextjs-docs/monitoring/meta.json
  - docs/reference/supastarter-nextjs-docs/analytics/meta.json
  - packages/ui/src/components/label.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/resend.mdx
  - docs/reference/2026-08-17-supastarter-docs-analysis.md
  - packages/ui/src/index.tsx
  - apps/saas/app/components/site-nav.tsx
  - docs/reference/supastarter-nextjs-docs/payments/providers/lemonsqueezy.mdx
  - packages/ui/src/components/tooltip.tsx
  - docs/reference/supastarter-nextjs-docs/storage/overview.mdx
  - docs/reference/supastarter-nextjs-docs/api/define-endpoint.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-admin-settings.png
  - docs/reference/supastarter-nextjs-docs/api/use-locale.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/store-data-for-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/troubleshooting.mdx
  - docs/reference/supastarter-nextjs-docs/storage/upload-files.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/flydotio.mdx
  - apps/saas/app/components/mobile-tabbar.tsx
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/design-system.css
  - docs/reference/supastarter-nextjs-docs/analytics/vemetric.mdx
  - docs/reference/supastarter-nextjs-docs/seo/sitemap.mdx
  - docs/reference/supastarter-nextjs-docs/database/overview.mdx
  - apps/saas/lib/organization.ts
  - docs/reference/supastarter-nextjs-docs/documentation.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/permissions.mdx
  - docs/reference/supastarter-nextjs-docs/payments/plans.mdx
  - packages/ui/src/components/badge.tsx
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - docs/reference/supastarter-nextjs-docs/database/schema.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/overview.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/polar.mdx
  - docs/reference/supastarter-nextjs-docs/payments/usage-based-billing.mdx
  - docs/reference/supastarter-nextjs-docs/customization/onboarding.mdx
  - apps/saas/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/organizations/use-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/trigger-dev.mdx
  - docs/reference/supastarter-nextjs-docs/database/studio.mdx
  - docs/reference/supastarter-nextjs-docs/ai/meta.json
  - docs/reference/supastarter-nextjs-docs/storage/uploadthing.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/meta.json
  - docs/reference/supastarter-nextjs-docs/recipes/build-a-feedback-widget.mdx
  - AGENTS.md
  - docs/reference/supastarter-nextjs-docs/configuration.mdx
  - apps/saas/app/login/login-form.tsx
  - apps/saas/lib/agent-data.ts
  - docs/reference/supastarter-nextjs-docs/tech-stack.mdx
  - docs/verification/rebuild-design-system-from-source/2.3-home-inter-fallback.png
  - packages/ui/src/components/form.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/railway.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/posthog.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/pirsch.mdx
  - docs/reference/supastarter-nextjs-docs/api/meta.json
  - docs/reference/supastarter-nextjs-docs/codebase/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/check-purchases.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/meta.json
  - docs/reference/supastarter-nextjs-docs/database/meta.json
  - docs/reference/supastarter-nextjs-docs/setup.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/overview.mdx
  - packages/ui/src/components/button.tsx
  - docs/reference/supastarter-nextjs-docs/authentication/oauth.mdx
  - docs/reference/supastarter-nextjs-docs/api/overview.mdx
  - docs/verification/rebuild-design-system-from-source/9.3-app.png
  - docs/reference/supastarter-nextjs-docs/customization/styling.mdx
  - docs/reference/supastarter-nextjs-docs/internationalization.mdx
  - apps/saas/app/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/dodopayments.mdx
  - docs/reference/supastarter-nextjs-docs/storage/aws-s3.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/meta.json
  - docs/reference/supastarter-nextjs-docs/monitoring/overview.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/user-and-session.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/turso.mdx
  - docs/reference/supastarter-nextjs-docs/ai/overview.mdx
  - docs/reference/supastarter-nextjs-docs/meta.json
  - docs/reference/supastarter-nextjs-docs/mailing/postmark.mdx
  - docs/reference/supastarter-nextjs-docs/skills.mdx
  - apps/saas/package.json
  - docs/reference/supastarter-nextjs-docs/monitoring/sentry.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/plausible.mdx
  - apps/saas/app/course/course-workspace.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/railway.mdx
  - docs/reference/supastarter-nextjs-docs/launch.mdx
  - docs/reference/supastarter-nextjs-docs/ai/chatbot.mdx
  - docs/reference/supastarter-nextjs-docs/customization/overview.mdx
  - packages/ui/src/components/logo.tsx
  - docs/reference/supastarter-nextjs-docs/analytics/custom.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/render.mdx
  - docs/cr-report-rebuild-design-system-from-source.md
  - docs/reference/supastarter-nextjs-docs/deployment/docker.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/queuebase.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/supabase-setup.mdx
  - docs/reference/supastarter-nextjs-docs/database/client.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/coolify.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/stripe.mdx
  - docs/reference/supastarter-nextjs-docs/index.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/creem.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/meta.json
  - docs/reference/supastarter-nextjs-docs/authentication/overview.mdx
  - apps/saas/app/components/app-shell.tsx
  - docs/reference/supastarter-nextjs-docs/codebase/structure.mdx
  - apps/saas/app/globals.css
  - docs/verification/rebuild-design-system-from-source/5.3-app-dark.png
  - docs/reference/supastarter-nextjs-docs/customization/dashboard.mdx
  - apps/saas/app/course/page.tsx
  - docs/reference/supastarter-nextjs-docs/codebase/update.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/custom.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/supabase.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/meta.json
  - docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/overview.mdx
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - docs/reference/supastarter-nextjs-docs/authentication/superadmin.mdx
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - docs/verification/rebuild-design-system-from-source/5.3-app-light.png
  - docs/reference/supastarter-nextjs-docs/authentication/meta.json
  - docs/reference/supastarter-nextjs-docs/codebase/formatting-and-linting.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/overview.mdx
  - docs/reference/supastarter-nextjs-docs/organizations/overview.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta-tags.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/google.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/vercel.mdx
  - docs/reference/supastarter-nextjs-docs/api/usage-in-frontend.mdx
  - docs/reference/supastarter-nextjs-docs/api/streaming.mdx
  - docs/reference/supastarter-nextjs-docs/storage/meta.json
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - docs/verification/rebuild-design-system-from-source/9.3-course.png
  - docs/reference/supastarter-nextjs-docs/customization/meta.json
  - docs/reference/supastarter-nextjs-docs/tasks/qstash.mdx
  - docs/reference/supastarter-nextjs-docs/blog.mdx
  - packages/ui/package.json
  - apps/saas/lib/permissions.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/neon.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/standalone-api.mdx
  - docs/verification/rebuild-design-system-from-source/5.3-home-light.png
  - docs/reference/supastarter-nextjs-docs/analytics/mixpanel.mdx
  - docs/reference/supastarter-nextjs-docs/storage/cloudflare-r2.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/local-development.mdx
  - docs/reference/supastarter-nextjs-docs/storage/digitalocean-spaces.mdx
  - docs/reference/supastarter-nextjs-docs/payments/overview.mdx
  - docs/reference/supastarter-nextjs-docs/storage/setup.mdx
  - apps/saas/postcss.config.cjs
  - packages/ui/src/components/input.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/netlify.mdx
  - docs/reference/supastarter-nextjs-docs/api/openapi.mdx
  - apps/saas/app/layout.tsx
  - docs/verification/rebuild-design-system-from-source/5.3-home-dark.png
  - docs/reference/supastarter-nextjs-docs/analytics/vercel.mdx
tests:
  - packages/ui/src/components-source.test.ts
  - apps/saas/lib/organization-switcher.test.tsx
  - apps/saas/lib/mobile-tabbar.test.tsx
  - packages/ui/src/form-components-source.test.ts
  - apps/saas/lib/permissions.test.tsx
  - apps/saas/lib/design-tokens.test.ts
  - packages/ui/src/version-gap.test.ts
  - apps/saas/lib/css-architecture.test.ts
  - apps/saas/lib/platform-shell.test.tsx
  - apps/saas/lib/font-fallback.test.ts
  - packages/ui/src/interactive-components-source.test.tsx
  - packages/ui/src/components.test.tsx
-->