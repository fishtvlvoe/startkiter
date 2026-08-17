# v1-scope-boundary Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: v1 take-home capabilities

A completed MVP take-home SHALL include Traditional Chinese public pages, an authenticated area, email/password auth, Google login, LINE login, PAYUNi one-time TWD checkout, an in-site course module, GitHub kit claim, and a site-agent with two read-only tools. Complete code with unused modules present but not required to finish first purchase is a valid MVP shape.

#### Scenario: Site boots without payment keys

- **WHEN** an operator deploys with no PAYUNi keys configured
- **THEN** the public pages MUST boot and MUST NOT return HTTP 500

#### Scenario: Currency is TWD

- **WHEN** the MVP price is stored for checkout
- **THEN** the currency MUST be TWD and the amount MUST be 8800


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Allowed extract sources

MVP SHALL extract the SaaS shell from supastarter-nextjs-main (apps/saas, Better Auth, packages/ai, zh-TW). MVP SHALL extract PAYUNi and order abstractions from THE-TU-Project/dev/thetu. MVP SHALL extract course playback and access UI from THE-TU-Project/dev/thetu as a module. LINE login SHALL be new work using Better Auth socialProviders.line and LINE Login Channel credentials. LINE PHP clients, LIFF, and Messaging API MUST NOT be ported. GitHub kit invite SHALL be new work using the GitHub API.

#### Scenario: LINE login uses Login Channel only

- **WHEN** a student configures LINE
- **THEN** the product MUST accept LINE Login Channel ID and Channel Secret and MUST NOT require a Messaging API token to sign in

##### Example: 老師設定 LINE Login Channel

- 老師在後台填入 LINE_CHANNEL_ID=1234567890、LINE_CHANNEL_SECRET=abcd1234efgh5678（Login Channel 憑證）
- 系統不要求填寫 Messaging API 的 Channel Access Token，學員即可完成 LINE 登入

#### Scenario: Missing LINE email is allowed

- **WHEN** LINE id_token contains no email
- **THEN** account linking MUST key off LINE userId and MUST NOT fail solely because email is empty

##### Example: 學員未授權 email 仍可登入

- 學員 LINE userId=U1234567890abcdef 完成登入，id_token 不含 email 欄位
- 系統以 userId=U1234567890abcdef 建立/連結帳號，登入不因缺少 email 而失敗


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Forbidden extract targets

MVP SHALL NOT include: THE-TU newsletter, coupon, NextAuth, or Apple flows; Lemon Squeezy, Polar, Dodo, or Creem as cashiers; passkeys or two-factor; any libon.me source. Course playback UI from THE-TU is allowed. Site-agent is allowed. GitHub OAuth for kit claim is allowed. Organization, Member, and Invitation tenancy tables are REQUIRED (see the organization-tenancy capability), reversing the prior exclusion.

#### Scenario: Organization tables are present

- **WHEN** the MVP database schema is created
- **THEN** it MUST introduce Organization, Member, and Invitation tables consistent with the organization-tenancy capability's role matrix

##### Example: Schema inspection finds the three tables

- **GIVEN** the Prisma schema for the MVP database
- **WHEN** its model list is inspected
- **THEN** it MUST contain models named `Organization`, `Member`, and `Invitation`, and the `Member` model's `role` field MUST only accept `owner`, `admin`, `instructor`, or `user`

#### Scenario: Libon source is absent

- **WHEN** the StartKiter tree is searched for copied libon.me application source
- **THEN** that source MUST NOT be present

##### Example: Repo-wide search finds no libon.me source

- **GIVEN** the StartKiter repository at its current commit
- **WHEN** `grep -ril "libon" apps/ packages/` is run
- **THEN** the command MUST return no matches


<!-- @trace
source: organization-role-model
updated: 2026-08-17
code:
  - docs/design-system-demo/screenshots/2.7/admin_settings.png
  - docs/reference/supastarter-nextjs-docs/storage/uploadthing.mdx
  - docs/buyer-extension-convention.md
  - docs/reference/2026-08-17-supastarter-docs-analysis.md
  - docs/reference/supastarter-nextjs-docs/storage/digitalocean-spaces.mdx
  - apps/saas/app/components/locale-switcher.tsx
  - docs/reference/supastarter-nextjs-docs/storage/cloudflare-r2.mdx
  - packages/i18n/src/index.ts
  - docs/reference/supastarter-nextjs-docs/authentication/overview.mdx
  - docs/reference/supastarter-nextjs-docs/customization/dashboard.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/meta.json
  - docs/reference/supastarter-nextjs-docs/analytics/google.mdx
  - docs/design-system-demo/course.html
  - docs/design-system-demo/screenshots/3.3/home.png
  - apps/saas/app/layout.tsx
  - docs/reference/supastarter-nextjs-docs/codebase/formatting-and-linting.mdx
  - docs/reference/supastarter-nextjs-docs/database/update-schema.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/standalone-api.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/meta.json
  - docs/design-system-demo/screenshots/course-comments.png
  - docs/reference/supastarter-nextjs-docs/organizations/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/providers/lemonsqueezy.mdx
  - docs/reference/supastarter-nextjs-docs/tasks/meta.json
  - docs/reference/supastarter-nextjs-docs/seo/meta.json
  - packages/i18n/src/translations/zh-cn/saas.json
  - docs/design-system-demo/screenshots/10.3/demo-login.png
  - docs/reference/supastarter-nextjs-docs/recipes/supabase-setup.mdx
  - docs/design-system-demo/screenshots/6.5/real-course-lesson-02.png
  - docs/reference/supastarter-nextjs-docs/codebase/structure.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/dependencies.mdx
  - packages/ui/vitest.config.ts
  - docs/design-system-demo/screenshots/home-dark.png
  - docs/reference/supastarter-nextjs-docs/recipes/build-a-feedback-widget.mdx
  - apps/saas/app/components/app-shell.tsx
  - packages/i18n/src/types.ts
  - docs/design-system-demo/screenshots/10.3/real-home.png
  - docs/reference/supastarter-nextjs-docs/skills.mdx
  - apps/saas/lib/request-locale.ts
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - docs/reference/supastarter-nextjs-docs/ai/chatbot.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/overview.mdx
  - apps/saas/package.json
  - docs/design-system-demo/components.css
  - docs/reference/supastarter-nextjs-docs/api/overview.mdx
  - docs/reference/supastarter-nextjs-docs/database/meta.json
  - packages/i18n/src/translations/en/marketing.json
  - apps/saas/app/app/sign-out-button.tsx
  - docs/reference/supastarter-nextjs-docs/tasks/queuebase.mdx
  - docs/reference/supastarter-nextjs-docs/storage/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/check-purchases.mdx
  - docs/design-system-demo/screenshots/2.7/course.png
  - docs/reference/supastarter-nextjs-docs/customization/onboarding.mdx
  - docs/design-system-demo/screenshots/login-dark.png
  - packages/i18n/src/lib/get-messages.ts
  - apps/saas/app/signup/page.tsx
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - docs/reference/supastarter-nextjs-docs/customization/styling.mdx
  - docs/design-system-demo/screenshots/6.3/real-app.png
  - docs/reference/supastarter-nextjs-docs/authentication/user-and-session.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/vercel.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/mixpanel.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/superadmin.mdx
  - apps/saas/app/course/[lessonId]/page.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/render.mdx
  - docs/design-system-demo/screenshots/2.7/checkout.png
  - docs/reference/supastarter-nextjs-docs/ai/meta.json
  - packages/i18n/src/translations/en/shared.json
  - apps/saas/app/course/page.tsx
  - docs/reference/supastarter-nextjs-docs/database/overview.mdx
  - packages/ui/src/index.tsx
  - docs/reference/supastarter-nextjs-docs/e2e.mdx
  - packages/ui/src/components/form.tsx
  - docs/reference/supastarter-nextjs-docs/mailing/nodemailer.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/umami.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/overview.mdx
  - docs/design-system-demo/screenshots/6.5/real-course.png
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - packages/i18n/src/translations/zh-tw/saas.json
  - docs/design-system-demo/screenshots/6.5/demo-course.png
  - packages/i18n/src/translations/zh-cn/shared.json
  - docs/reference/supastarter-nextjs-docs/api/openapi.mdx
  - packages/ui/tsconfig.json
  - docs/reference/supastarter-nextjs-docs/codebase/local-development.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/overview.mdx
  - docs/design-system-demo/screenshots/6.3/real-app-dark.png
  - packages/i18n/vitest.config.ts
  - packages/i18n/src/config.ts
  - package.json
  - docs/reference/supastarter-nextjs-docs/storage/access-files.mdx
  - apps/saas/next-env.d.ts
  - packages/ui/src/components/button.tsx
  - docs/design-system-demo/app.html
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - docs/reference/supastarter-nextjs-docs/ai/overview.mdx
  - packages/i18n/package.json
  - docs/reference/supastarter-nextjs-docs/deployment/flydotio.mdx
  - docs/reference/supastarter-nextjs-docs/storage/upload-files.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/custom.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/docker.mdx
  - docs/design-system-demo/tokens.css
  - docs/design-system-demo/screenshots/course-light.png
  - docs/reference/supastarter-nextjs-docs/database/providers/meta.json
  - docs/reference/supastarter-nextjs-docs/deployment/netlify.mdx
  - docs/reference/supastarter-nextjs-docs/recipes/meta.json
  - docs/reference/supastarter-nextjs-docs/launch.mdx
  - docs/reference/supastarter-nextjs-docs/storage/aws-s3.mdx
  - docs/design-system-demo/screenshots/10.3/demo-home.png
  - packages/ui/src/components/input.tsx
  - docs/reference/supastarter-nextjs-docs/tasks/trigger-dev.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/meta.json
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/reference/supastarter-nextjs-docs/organizations/configure.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/creem.mdx
  - docs/reference/supastarter-nextjs-docs/payments/providers/dodopayments.mdx
  - docs/reference/supastarter-nextjs-docs/index.mdx
  - docs/reference/supastarter-nextjs-docs/payments/paywall.mdx
  - apps/saas/app/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx
  - apps/saas/app/globals.css
  - docs/design-system-demo/home.html
  - packages/ui/src/components/badge.tsx
  - packages/i18n/src/translations/zh-cn/marketing.json
  - docs/design-system-demo/index.html
  - docs/reference/supastarter-nextjs-docs/organizations/use-organizations.mdx
  - docs/design-system-demo/screenshots/app-light.png
  - docs/design-system-demo/screenshots/app-dark.png
  - docs/reference/supastarter-nextjs-docs/authentication/permissions.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/overview.mdx
  - docs/reference/supastarter-nextjs-docs/payments/meta.json
  - docs/reference/supastarter-nextjs-docs/api/meta.json
  - apps/saas/app/login/login-form.tsx
  - docs/reference/supastarter-nextjs-docs/database/providers/supabase.mdx
  - docs/reference/supastarter-nextjs-docs/storage/setup.mdx
  - packages/ui/src/components/spinner.tsx
  - docs/discuss/organizations.md
  - docs/design-system-demo/screenshots/10.3/real-app.png
  - docs/reference/supastarter-nextjs-docs/analytics/vemetric.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/meta.json
  - docs/reference/supastarter-nextjs-docs/codebase/vscode.mdx
  - docs/reference/supastarter-nextjs-docs/seo/meta-tags.mdx
  - docs/reference/supastarter-nextjs-docs/troubleshooting.mdx
  - packages/i18n/src/translations/en/saas.json
  - docs/design-system-demo/screenshots/10.3/comparison.txt
  - docs/reference/supastarter-nextjs-docs/authentication/meta.json
  - docs/reference/supastarter-nextjs-docs/mailing/console.mdx
  - apps/saas/app/course/demo-grant-button.tsx
  - docs/reference/supastarter-nextjs-docs/blog.mdx
  - packages/i18n/src/translations/zh-tw/shared.json
  - docs/reference/supastarter-nextjs-docs/analytics/plausible.mdx
  - docs/reference/supastarter-nextjs-docs/api/use-locale.mdx
  - docs/reference/supastarter-nextjs-docs/seo/sitemap.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/turso.mdx
  - docs/reference/supastarter-nextjs-docs/database/studio.mdx
  - docs/reference/supastarter-nextjs-docs/payments/usage-based-billing.mdx
  - docs/reference/supastarter-nextjs-docs/configuration.mdx
  - docs/design-system-demo/screenshots/6.2/real-home.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/stripe.mdx
  - docs/design-system-demo/screenshots/6.2/demo-home.png
  - docs/reference/supastarter-nextjs-docs/database/client.mdx
  - packages/ui/src/components/color-mode-toggle.tsx
  - docs/design-system-demo/screenshots/6.3/real-app-collapsed.png
  - docs/reference/supastarter-nextjs-docs/organizations/overview.mdx
  - docs/reference/supastarter-nextjs-docs/tech-stack.mdx
  - docs/design-system-demo/screenshots/app-collapsed.png
  - docs/reference/supastarter-nextjs-docs/api/usage-in-frontend.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/railway.mdx
  - docs/reference/supastarter-nextjs-docs/setup.mdx
  - docs/design-system-demo/demo.js
  - packages/ui/package.json
  - docs/reference/supastarter-nextjs-docs/mailing/postmark.mdx
  - docs/reference/supastarter-nextjs-docs/mailing/custom.mdx
  - docs/design-system-demo/screenshots/6.3/demo-app.png
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - docs/design-system-demo/login.html
  - docs/discuss/README.md
  - vitest.config.ts
  - docs/reference/supastarter-nextjs-docs/mailing/resend.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/planetscale.mdx
  - apps/saas/app/page.tsx
  - docs/reference/supastarter-nextjs-docs/storage/overview.mdx
  - apps/saas/app/course/course-workspace.tsx
  - deploy/zeabur.yaml
  - docs/reference/supastarter-nextjs-docs/codebase/update.mdx
  - apps/saas/app/components/theme-provider.tsx
  - docs/design-system-demo/screenshots/login-light.png
  - packages/ui/src/lib/index.ts
  - playwright.config.ts
  - docs/reference/supastarter-nextjs-docs/api/streaming.mdx
  - docs/reference/supastarter-nextjs-docs/database/schema.mdx
  - docs/reference/supastarter-nextjs-docs/monitoring/sentry.mdx
  - docs/design-system-demo/screenshots/course-dark.png
  - docs/reference/supastarter-nextjs-docs/tasks/overview.mdx
  - docs/reference/supastarter-nextjs-docs/api/define-endpoint.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/pirsch.mdx
  - packages/i18n/src/translations/zh-tw/marketing.json
  - packages/ui/src/components/tooltip.tsx
  - apps/saas/app/components/site-nav.tsx
  - docs/design-system-demo/screenshots/2.7/agent.png
  - packages/ui/src/components/label.tsx
  - docs/reference/supastarter-nextjs-docs/deployment/railway.mdx
  - docs/reference/supastarter-nextjs-docs/documentation.mdx
  - docs/reference/supastarter-nextjs-docs/authentication/oauth.mdx
  - packages/ui/src/components/card.tsx
  - docs/reference/supastarter-nextjs-docs/organizations/store-data-for-organizations.mdx
  - docs/reference/supastarter-nextjs-docs/internationalization.mdx
  - docs/reference/supastarter-nextjs-docs/analytics/vercel.mdx
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - docs/reference/supastarter-nextjs-docs/tasks/qstash.mdx
  - docs/reference/supastarter-nextjs-docs/meta.json
  - docs/reference/supastarter-nextjs-docs/payments/overview.mdx
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - docs/reference/supastarter-nextjs-docs/payments/plans.mdx
  - docs/design-system-demo/screenshots/home-light.png
  - docs/design-system-demo/screenshots/10.3/demo-app.png
  - docs/reference/supastarter-nextjs-docs/ai/prompts.mdx
  - docs/reference/supastarter-nextjs-docs/customization/meta.json
  - AGENTS.md
  - docs/design-system-demo/screenshots/course-collapsed.png
  - apps/saas/app/design-system.css
  - README.md
  - docs/reference/supastarter-nextjs-docs/analytics/posthog.mdx
  - docs/reference/supastarter-nextjs-docs/codebase/meta.json
  - docs/reference/supastarter-nextjs-docs/customization/overview.mdx
  - docs/reference/supastarter-nextjs-docs/deployment/coolify.mdx
  - docs/reference/supastarter-nextjs-docs/database/providers/neon.mdx
  - docs/design-system-demo/screenshots/10.3/real-login.png
  - docs/reference/supastarter-nextjs-docs/payments/providers/polar.mdx
tests:
  - apps/saas/lib/home-shell.test.ts
  - apps/saas/lib/design-tokens.test.ts
  - docs/design-system-demo/demo.test.ts
  - apps/saas/lib/app-home.test.ts
  - packages/ui/src/version-gap.test.ts
  - e2e/startkiter.spec.ts
  - apps/saas/lib/auth-providers.test.ts
  - packages/ui/src/components.test.tsx
  - apps/saas/lib/login-design-system.test.ts
  - apps/saas/lib/font-fallback.test.ts
  - apps/saas/lib/site-nav.test.tsx
  - apps/saas/lib/course-shell.test.ts
  - packages/i18n/src/i18n.test.ts
-->

---
### Requirement: Payments and invoice policy

The primary MVP payment gateway SHALL be PAYUNi using one-time TWD checkout. Shopline and Stripe MUST NOT collect MVP funds. Polar MUST NOT collect MVP funds and MUST NOT be required to invite GitHub collaborators. MVP SHALL sell one-time TWD purchases only. Payment secrets SHALL be stored in admin settings with environment-variable fallback. Unconfigured payment checkout MUST fail closed without HTTP 500. E-invoice SHALL stay out of MVP.

#### Scenario: Unconfigured checkout fails closed

- **WHEN** a user starts checkout and PAYUNi keys are missing
- **THEN** POST /api/checkout MUST return HTTP 503 with an explicit configuration error and MUST NOT return HTTP 500

#### Scenario: Invoice is not in MVP

- **WHEN** a PAYUNi payment succeeds
- **THEN** the system MUST NOT require carrier, tax ID, or donation fields and MUST NOT call an invoice provider

##### Example: 付款成功不觸發發票流程

- 訂單 order_id=ord_8800_001 的 PAYUNi 付款成功
- 系統不要求填寫發票載具、統一編號或捐贈碼欄位，也不呼叫任何電子發票 API

#### Scenario: Polar is not a cashier

- **WHEN** a change proposes charging the MVP SKU through Polar
- **THEN** the change MUST be rejected

##### Example: 用 Polar 收款的提案被拒絕

- 有人提出 change proposal「改用 Polar 收 MVP SKU 8800 元」
- 該提案在 SDD review 階段被拒絕，理由為 Polar 不得作為 MVP 收款方


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Four-lesson SHOPLINE path is not MVP

MVP SHALL NOT use a four-lesson unlock order keyed to SHOPLINE. Extract and teaching docs MUST follow the sellable-site path: sales page, PAYUNi, in-site course, GitHub claim, site-agent.

#### Scenario: SHOPLINE lesson-three proposal is rejected

- **WHEN** a later change proposes restoring lesson three as a SHOPLINE test payment as the MVP primary path
- **THEN** that change MUST be rejected in favor of PAYUNi checkout on the dogfood site

##### Example: 恢復 SHOPLINE 測試付款提案被拒絕

- 有人提出 change「用 SHOPLINE 1 元測試付款解鎖 lesson_03，作為 MVP 主要付款路徑」
- 該提案被拒絕，改採 PAYUNi 於 dogfood 站以 8800 元一次性結帳作為主路徑

<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->