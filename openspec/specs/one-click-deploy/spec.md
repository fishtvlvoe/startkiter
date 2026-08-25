# one-click-deploy Specification

## Purpose

Provide a provider-independent deployment path for the StartKiter SaaS application while preserving the existing Zeabur one-click deployment configuration.

## Requirements

### Requirement: Repository provides a one-click deploy path

The repository SHALL provide a deploy configuration file compatible with at least one one-click deploy provider (Zeabur, Vercel, or Coolify) and a corresponding deploy button or documented deploy URL in the repository README. The repository SHALL additionally provide a standard Dockerfile at `apps/saas/Dockerfile` so the same application can be built and run on any platform or VPS that supports Docker, independent of any single named provider.

#### Scenario: Deploy configuration file exists and is valid

- **WHEN** the deploy configuration file (for example deploy/zeabur.yaml or an equivalent provider manifest) is read
- **THEN** it MUST declare the PostgreSQL database dependency and MUST declare BETTER_AUTH_URL, DATABASE_URL as required environment variables

##### Example: Zeabur manifest declares the required pieces

- **GIVEN** deploy/zeabur.yaml is parsed as YAML
- **WHEN** its `services` or `dependencies` section is inspected
- **THEN** it MUST list a PostgreSQL service and its `env` section MUST list `BETTER_AUTH_URL` and `DATABASE_URL` as required (non-optional) variables

#### Scenario: README documents the deploy path

- **WHEN** README.md is read
- **THEN** it MUST contain a deploy button image or link pointing to the one-click deploy provider's deploy URL for this repository, AND MUST contain a documented Docker-based deploy path that does not name a single required hosting provider

##### Example: Deploy button markdown

- **GIVEN** README.md contains a markdown image link such as `[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/XXXXX)`
- **WHEN** README.md is scanned for the substring `zeabur.com`
- **THEN** the scan MUST find at least one match pointing to a deploy template URL, not just a plain-text mention of Zeabur

#### Scenario: Dockerfile builds and runs on any Docker-compatible host

- **WHEN** `apps/saas/Dockerfile` is built with `docker build -f apps/saas/Dockerfile .`
- **THEN** the resulting image MUST start successfully with `docker run` and MUST serve HTTP responses on the exposed port, independent of which hosting provider runs the container

##### Example: Local Docker build and run

- **GIVEN** a machine with Docker installed and no StartKiter-specific configuration beyond the repository itself
- **WHEN** `docker build -f apps/saas/Dockerfile . -t startkiter` then `docker run -p 3000:3000 startkiter` are executed
- **THEN** `curl -I http://localhost:3000` MUST return an HTTP response (200 or a valid redirect), not a connection failure


<!-- @trace
source: universal-one-click-deploy
updated: 2026-08-25
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
-->

---
### Requirement: One-click deploy succeeds without payment or OAuth keys configured

A fresh one-click deploy with no PAYUNi, Google, or LINE credentials configured SHALL boot successfully and serve the public pages without returning HTTP 500.

#### Scenario: Fresh deploy boots with only the database connected

- **WHEN** a new deploy is created with only DATABASE_URL and BETTER_AUTH_SECRET set
- **THEN** GET / on the deployed instance MUST return HTTP 200 and MUST NOT return HTTP 500

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