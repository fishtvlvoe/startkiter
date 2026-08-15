# line-learner-community Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: Paid learners see a LINE community join control

After a paid MVP order (sku startkiter-mvp with Order.courseAccess true), the course area SHALL show a join control for the configured LINE community invite URL. The URL SHALL come from environment configuration `LINE_COMMUNITY_INVITE_URL` in this change. This community is a peer discussion group for paid StartKiter learners. It MUST NOT be described as customer support. It MUST NOT be implemented as LINE Login for the take-home SaaS. It MUST NOT silently add users to a group.

#### Scenario: Paid user can fetch the invite URL

- **WHEN** a user with Order.courseAccess true for sku startkiter-mvp calls GET /api/community/line-invite
- **THEN** the response MUST be HTTP 200 and the JSON body MUST include inviteUrl as a non-empty https URL

##### Example: 付費學員取得邀請

- userId=user_paid、courseAccess=true、LINE_COMMUNITY_INVITE_URL=https://line.me/ti/g/example
- GET /api/community/line-invite → 200 `{ "inviteUrl": "https://line.me/ti/g/example" }`

#### Scenario: Unpaid user cannot fetch the invite URL

- **WHEN** a signed-in user with no Order.courseAccess true for sku startkiter-mvp calls GET /api/community/line-invite
- **THEN** the response MUST be HTTP 403 and the body MUST NOT include inviteUrl

##### Example: 未付費

- userId=user_free 無 courseAccess
- GET → 403，JSON 無 inviteUrl

#### Scenario: Unauthenticated request is rejected

- **WHEN** GET /api/community/line-invite is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Missing invite configuration fails closed

- **WHEN** a paid user calls GET /api/community/line-invite and no invite URL is configured or the value is not https
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

##### Example: 未設 env

- courseAccess=true、LINE_COMMUNITY_INVITE_URL 空
- GET → 503


<!-- @trace
source: extract-line-learner-community
updated: 2026-08-15
code:
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/layout.tsx
  - apps/saas/app/course/kit-claim-panel.tsx
  - packages/auth/src/providers.ts
  - packages/course/src/line-invite.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/ui/package.json
  - packages/i18n/tsconfig.json
  - packages/payments/src/checkout.ts
  - packages/course/tsconfig.json
  - packages/payments/src/order.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/github-kit/package.json
  - apps/saas/app/api/github/claim-status/route.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/app/login/page.tsx
  - packages/database/tsconfig.json
  - packages/utils/src/index.ts
  - apps/saas/app/api/orders/refund/route.ts
  - apps/saas/.env.example
  - apps/saas/app/api/community/line-invite/route.ts
  - apps/saas/app/api/auth/[...all]/route.ts
  - docs/discuss/extract-map.md
  - apps/saas/app/api/demo/grant-course/route.ts
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/package.json
  - packages/payments/src/constants.ts
  - tooling/typescript/base.json
  - turbo.json
  - packages/auth/tsconfig.json
  - docs/discuss/payment-and-deploy.md
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - apps/saas/app/api/github/claim/route.ts
  - apps/saas/app/page.tsx
  - apps/saas/app/course/page.tsx
  - packages/utils/tsconfig.json
  - packages/github-kit/src/config.ts
  - packages/course/src/playback.ts
  - apps/saas/app/checkout/result/page.tsx
  - apps/saas/app/course/line-community-panel.tsx
  - AGENTS.md
  - apps/saas/app/globals.css
  - apps/saas/lib/course-access.ts
  - packages/auth/src/test-auth.ts
  - packages/auth/package.json
  - packages/github-kit/src/github-app-client.ts
  - packages/i18n/src/index.ts
  - packages/github-kit/src/index.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - packages/payments/src/refund.ts
  - packages/ui/src/index.tsx
  - packages/github-kit/tsconfig.json
  - apps/saas/lib/github-kit.ts
  - tooling/typescript/package.json
  - apps/saas/tsconfig.json
  - packages/auth/src/auth.ts
  - packages/course/package.json
  - packages/course/src/index.ts
  - pnpm-workspace.yaml
  - README.md
  - docs/discuss/v1-boundary.md
  - packages/course/src/access.ts
  - package.json
  - apps/saas/app/api/course/lessons/route.ts
  - apps/saas/next.config.ts
  - packages/course/src/catalog.ts
  - packages/payments/src/credentials.ts
  - packages/auth/src/index.ts
  - packages/payments/src/factory.ts
  - vitest.config.ts
  - packages/i18n/package.json
  - packages/payments/src/memory-store.ts
  - packages/github-kit/src/revoke.ts
  - tsconfig.json
  - apps/saas/package.json
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/database/prisma/schema.prisma
  - packages/github-kit/src/claim.ts
  - apps/saas/app/not-found.tsx
  - packages/payments/src/index.ts
  - packages/ui/tsconfig.json
  - docs/autonomous-apply-loop.md
  - packages/utils/package.json
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/github-kit/src/types.ts
  - docs/deploy-and-public-url.md
  - docs/discuss/README.md
  - docs/discuss/architecture-draft.md
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - packages/database/src/index.ts
  - apps/saas/lib/demo-grant.ts
  - apps/saas/app/login/login-form.tsx
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - apps/saas/next-env.d.ts
  - apps/saas/app/app/page.tsx
  - docs/discuss/2026-08-14-alignment.md
  - packages/database/package.json
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/payments/src/notify.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
tests:
  - packages/payments/src/checkout.test.ts
  - packages/course/src/access.test.ts
  - packages/auth/src/auth.test.ts
  - packages/payments/src/factory.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/course/src/catalog.test.ts
  - packages/course/src/playback.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/course/src/line-invite.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/github-kit/src/config.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/order.test.ts
-->

---
### Requirement: Membership requires the learner to tap join

The product SHALL NOT state that payment alone adds the learner to the LINE community. The system MUST NOT call a LINE API that adds a user to a group or community without that user confirming in LINE.

#### Scenario: Payment success does not create LINE membership

- **WHEN** POST /api/payuni/notify marks the MVP order paid
- **THEN** the server MUST NOT call LINE group or community join APIs as a side effect of that notify

##### Example: 付款成功不觸發 LINE 群組加入

- POST /api/payuni/notify 收到 order_id=ord_8800_002 已付款通知
- 系統更新訂單狀態為 paid，但不呼叫任何 LINE 群組/社群加入 API


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
### Requirement: SKOOL-like community platform is out of MVP

MVP SHALL NOT ship a SKOOL-like hosted community (forums, points, feed) as the learner gathering place. The MVP gathering place SHALL be the LINE invite in the course.

#### Scenario: No community feed routes

- **WHEN** a client requests a SKOOL-like feed path such as GET /api/community/feed
- **THEN** MVP MUST NOT expose that as a product feature

##### Example: 沒有社群動態牆路由

- 客戶端呼叫 GET /api/community/feed
- 系統回傳 404，該路由不存在於產品功能中


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
### Requirement: LINE community is peer discussion only

Copy, UI labels, and course text for the LINE invite SHALL describe a learner discussion group. Those surfaces MUST NOT tell learners to send support requests into the LINE community.

#### Scenario: Join control is not labeled as support

- **WHEN** a paid user opens the course join control
- **THEN** the visible label MUST describe learner discussion and MUST NOT use support or customer-service wording as the primary label

##### Example: 加入按鈕文案為「加入學員討論群」

- 已付款用戶 dana@example.com 打開課程頁的社群加入區塊
- 畫面顯示文字為「加入學員討論群」，不含「客服」「支援」等字樣


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
### Requirement: Support contact is email

MVP support SHALL be an email address configured in site settings. The site SHALL display that address to visitors. Support MUST NOT be routed into the LINE learner community.

#### Scenario: Support email is visible

- **WHEN** a visitor opens a public site page that includes the footer or contact block
- **THEN** the configured support email MUST be visible as a mailto link

##### Example: 頁尾顯示客服信箱連結

- 訪客打開網站首頁，頁尾顯示 mailto:support@startkiter.com 連結
- 該信箱地址與 site settings 設定值一致

#### Scenario: Missing support email fails closed on the support endpoint

- **WHEN** GET /api/support/email is called and no support email is configured
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

#### Scenario: Support email endpoint returns the address

- **WHEN** GET /api/support/email is called and a support email is configured
- **THEN** the response MUST be HTTP 200 and the JSON body MUST include email as a non-empty address containing @

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