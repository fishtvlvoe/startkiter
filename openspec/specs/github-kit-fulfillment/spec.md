# github-kit-fulfillment Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: In-site GitHub claim after payment

A user with a paid MVP order (kitClaimEligible true) SHALL claim kit access from the course site by signing in with GitHub. Claiming (inviting the collaborator) MUST be a POST request; checking claim status MUST be a separate GET request with no side effects, since a GET that mutates state can be triggered by prefetch, retry, or scanners. The system SHALL invite that GitHub account to the configured organization private repository with pull permission via GitHub App. Manual operator invites MUST NOT be required for the happy path.

#### Scenario: Paid user claims successfully

- **WHEN** a paid user with kitClaimEligible true completes GitHub OAuth and POST /api/github/claim runs
- **THEN** the response MUST be HTTP 200 and a github_kit_grants row MUST exist with permission pull and status invited

#### Scenario: Unauthenticated claim is rejected

- **WHEN** POST /api/github/claim is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Unpaid claim is rejected

- **WHEN** a signed-in user with no Order.kitClaimEligible true for sku startkiter-mvp calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub API MUST NOT be called to add a collaborator

#### Scenario: Claim status can be queried without side effects

- **WHEN** GET /api/github/claim-status is called, regardless of how many times or by whom (including prefetch or retry)
- **THEN** the response MUST reflect current grant state and MUST NOT call the GitHub API to add or remove a collaborator

##### Example: 瀏覽器預抓不會誤觸邀請

- 瀏覽器對 GET /api/github/claim-status 連續預抓兩次，使用者尚未按下領取按鈕
- 兩次回應皆回報 status=not_claimed，GitHub API 未被呼叫，github_kit_grants 未新增任何列


<!-- @trace
source: extract-github-kit-fulfillment
updated: 2026-08-15
code:
  - packages/utils/package.json
  - apps/saas/app/login/login-form.tsx
  - packages/payments/src/constants.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/tsconfig.json
  - packages/github-kit/src/types.ts
  - vitest.config.ts
  - apps/saas/package.json
  - apps/saas/lib/course-access.ts
  - packages/payments/src/index.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - apps/saas/app/course/page.tsx
  - apps/saas/app/checkout/result/page.tsx
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/layout.tsx
  - packages/auth/src/auth.ts
  - packages/auth/src/test-auth.ts
  - apps/saas/app/not-found.tsx
  - packages/database/tsconfig.json
  - packages/github-kit/src/revoke.ts
  - packages/ui/tsconfig.json
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - packages/github-kit/tsconfig.json
  - packages/course/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/src/notify.ts
  - packages/utils/tsconfig.json
  - tsconfig.json
  - apps/saas/app/login/page.tsx
  - AGENTS.md
  - docs/discuss/architecture-draft.md
  - packages/auth/src/providers.ts
  - apps/saas/lib/orders.ts
  - tooling/typescript/base.json
  - docs/autonomous-apply-loop.md
  - packages/course/package.json
  - package.json
  - apps/saas/app/api/orders/refund/route.ts
  - README.md
  - packages/course/src/access.ts
  - turbo.json
  - packages/i18n/tsconfig.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/github-kit/src/config.ts
  - packages/i18n/package.json
  - apps/saas/app/globals.css
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - apps/saas/lib/demo-grant.ts
  - docs/discuss/2026-08-14-alignment.md
  - packages/course/src/catalog.ts
  - packages/i18n/src/index.ts
  - packages/ui/package.json
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/.env.example
  - docs/discuss/2026-08-14-thetu-source.md
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/api/github/claim/route.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/course/src/playback.ts
  - packages/github-kit/package.json
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/payments/src/refund.ts
  - packages/github-kit/src/index.ts
  - packages/payments/src/checkout.ts
  - packages/ui/src/index.tsx
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/next-env.d.ts
  - docs/discuss/README.md
  - packages/course/src/index.ts
  - packages/database/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/auth/package.json
  - packages/payments/src/factory.ts
  - apps/saas/app/api/github/claim-status/route.ts
  - packages/github-kit/src/github-app-client.ts
  - pnpm-workspace.yaml
  - packages/auth/tsconfig.json
  - packages/payments/src/memory-store.ts
  - packages/auth/src/index.ts
  - apps/saas/app/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/lib/github-kit.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/utils/src/index.ts
  - docs/discuss/payment-and-deploy.md
  - docs/discuss/extract-map.md
  - packages/database/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/github-kit/src/claim.ts
  - docs/deploy-and-public-url.md
tests:
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/github-kit/src/config.test.ts
  - packages/course/src/playback.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/order.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Invite is read-only on an organization repository

Kit access SHALL use an organization-owned private repository. The granted GitHub role MUST be pull. Personal-account repositories MUST NOT be used for kit delivery.

#### Scenario: Grant permission is pull

- **WHEN** a kit grant is written
- **THEN** permission MUST equal pull and MUST NOT equal push, maintain, or admin

##### Example: 寫入 pull-only 授權紀錄

- 使用者 bob@example.com（GitHub 帳號 bob-dev）完成 MVP 付款並通過 GitHub OAuth
- 系統寫入 github_kit_grants: user_id=usr_1001, github_login=bob-dev, repo=org/startkiter-private-kit, permission=pull, status=invited

#### Scenario: GitHub API failure stays unclaimed

- **WHEN** GitHub returns an error while adding the collaborator
- **THEN** POST /api/github/claim MUST return HTTP 502 and MUST NOT mark the grant accepted


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
### Requirement: Refund revokes existing collaborator access

A refund on an order that already has a github_kit_grants row SHALL actively revoke GitHub access, not only block future claims. This covers both accepted collaborators and pending invitations that the learner has not accepted yet. Revocation MUST be attempted automatically when the order is marked refunded; a GitHub API failure during revocation MUST be logged and MUST NOT block the refund itself.

#### Scenario: Refund removes an already-accepted collaborator

- **WHEN** an order with an accepted github_kit_grants row (status=accepted, accepted_at set) is marked refunded
- **THEN** the system MUST call the GitHub API to remove that collaborator from the private repository and MUST set the grant's status to revoked with revoked_at set

##### Example: 已接受邀請的訂單退款後被移除

- 使用者 bob@example.com（GitHub 帳號 bob-dev）的 github_kit_grants 列 permission=pull、status=accepted、accepted_at=2026-08-10T10:00:00Z
- 訂單 order_id=ord_5001 被標記 refunded
- 系統呼叫 GitHub API 將 bob-dev 從 org/startkiter-private-kit 移除 collaborator，並把該筆 grant 的 status 更新為 revoked、revoked_at 寫入當下時間

#### Scenario: Refund cancels a pending invitation

- **WHEN** an order with a pending github_kit_grants row (status=invited, accepted_at null) is marked refunded
- **THEN** the system MUST call the GitHub API to cancel or remove that pending invitation and MUST set the grant's status to revoked with revoked_at set

##### Example: 邀請已送出但尚未接受就退款

- 使用者 dana@example.com（GitHub 帳號 dana-lin）的 github_kit_grants 列 status=invited、accepted_at=null
- 訂單 order_id=ord_5004 被標記 refunded
- 系統呼叫 GitHub API 取消 org/startkiter-private-kit 對 dana-lin 的 pending invitation，並把該筆 grant 的 status 更新為 revoked

#### Scenario: Refund with no prior grant needs no revocation call

- **WHEN** an order with no github_kit_grants row is marked refunded
- **THEN** the system MUST NOT call the GitHub API to remove a collaborator or cancel an invitation

##### Example: 從未領取過的訂單退款

- 訂單 order_id=ord_5002 從未有對應的 github_kit_grants 列（使用者從未完成 claim）
- 訂單被標記 refunded 時，系統不呼叫 GitHub API 移除任何 collaborator，也不取消任何 invitation

#### Scenario: Revocation failure does not block the refund

- **WHEN** the GitHub API returns an error while removing the collaborator or canceling the pending invitation
- **THEN** the refund MUST still complete and the failure MUST be recorded for manual follow-up

##### Example: GitHub API 暫時失敗不擋退款

- 訂單 order_id=ord_5003 標記 refunded，觸發移除 GitHub 帳號 carol-lin 的 collaborator 呼叫
- GitHub API 回傳 503，系統仍完成退款流程，並記錄一筆待人工複核的撤銷失敗事件


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


<!-- @trace
source: extract-github-kit-fulfillment
updated: 2026-08-15
code:
  - packages/utils/package.json
  - apps/saas/app/login/login-form.tsx
  - packages/payments/src/constants.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/tsconfig.json
  - packages/github-kit/src/types.ts
  - vitest.config.ts
  - apps/saas/package.json
  - apps/saas/lib/course-access.ts
  - packages/payments/src/index.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - apps/saas/app/course/page.tsx
  - apps/saas/app/checkout/result/page.tsx
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/layout.tsx
  - packages/auth/src/auth.ts
  - packages/auth/src/test-auth.ts
  - apps/saas/app/not-found.tsx
  - packages/database/tsconfig.json
  - packages/github-kit/src/revoke.ts
  - packages/ui/tsconfig.json
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - packages/github-kit/tsconfig.json
  - packages/course/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/src/notify.ts
  - packages/utils/tsconfig.json
  - tsconfig.json
  - apps/saas/app/login/page.tsx
  - AGENTS.md
  - docs/discuss/architecture-draft.md
  - packages/auth/src/providers.ts
  - apps/saas/lib/orders.ts
  - tooling/typescript/base.json
  - docs/autonomous-apply-loop.md
  - packages/course/package.json
  - package.json
  - apps/saas/app/api/orders/refund/route.ts
  - README.md
  - packages/course/src/access.ts
  - turbo.json
  - packages/i18n/tsconfig.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/github-kit/src/config.ts
  - packages/i18n/package.json
  - apps/saas/app/globals.css
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - apps/saas/lib/demo-grant.ts
  - docs/discuss/2026-08-14-alignment.md
  - packages/course/src/catalog.ts
  - packages/i18n/src/index.ts
  - packages/ui/package.json
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/.env.example
  - docs/discuss/2026-08-14-thetu-source.md
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/api/github/claim/route.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/course/src/playback.ts
  - packages/github-kit/package.json
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/payments/src/refund.ts
  - packages/github-kit/src/index.ts
  - packages/payments/src/checkout.ts
  - packages/ui/src/index.tsx
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/next-env.d.ts
  - docs/discuss/README.md
  - packages/course/src/index.ts
  - packages/database/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/auth/package.json
  - packages/payments/src/factory.ts
  - apps/saas/app/api/github/claim-status/route.ts
  - packages/github-kit/src/github-app-client.ts
  - pnpm-workspace.yaml
  - packages/auth/tsconfig.json
  - packages/payments/src/memory-store.ts
  - packages/auth/src/index.ts
  - apps/saas/app/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/lib/github-kit.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/utils/src/index.ts
  - docs/discuss/payment-and-deploy.md
  - docs/discuss/extract-map.md
  - packages/database/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/github-kit/src/claim.ts
  - docs/deploy-and-public-url.md
tests:
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/github-kit/src/config.test.ts
  - packages/course/src/playback.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/order.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Learner still accepts the GitHub invitation

The product SHALL tell the learner to accept the GitHub invitation. The system MUST NOT treat the kit as fully delivered until GitHub reports the collaborator is active or accepted_at is set.

#### Scenario: Invite pending is visible

- **WHEN** GitHub has been invited but the learner has not accepted
- **THEN** the claim page MUST show a pending-accept state and MUST NOT claim that clone already works

##### Example: 邀請已送出但尚未接受

- 系統已對 GitHub 帳號 carol-lin 送出 org/startkiter-private-kit 的 collaborator 邀請，accepted_at 為 null
- carol-lin 打開 claim 頁面，畫面顯示「邀請待接受」狀態，不顯示「已可 clone」文字

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
### Requirement: Claim entitlement reads Order.kitClaimEligible

POST /api/github/claim SHALL require a Better Auth session whose user owns at least one Order with sku startkiter-mvp and kitClaimEligible true. Users without that flag MUST receive HTTP 403 and the GitHub collaborator invite API MUST NOT be called.

#### Scenario: kitClaimEligible false blocks claim

- **WHEN** a signed-in user with only kitClaimEligible false orders calls POST /api/github/claim
- **THEN** the response MUST be HTTP 403 and the GitHub invite API MUST NOT be invoked

##### Example: 退款後再領取

- userId=user_refunded 的 Order status=refunded、kitClaimEligible=false
- POST /api/github/claim 回 403，測試 spy 記錄 GitHub invite 為零次

#### Scenario: kitClaimEligible true allows claim path to proceed

- **WHEN** a signed-in user with kitClaimEligible true and a linked GitHub identity calls POST /api/github/claim with GitHub App configured
- **THEN** the system MUST attempt an org private-repo pull invite and MUST persist a github_kit_grants row on success

##### Example: 有權學員成功送出邀請

- userId=user_paid、Order.kitClaimEligible=true、已綁定 githubLogin=bob-dev
- POST /api/github/claim 回 200，github_kit_grants 出現 permission=pull、status=invited


<!-- @trace
source: extract-github-kit-fulfillment
updated: 2026-08-15
code:
  - packages/utils/package.json
  - apps/saas/app/login/login-form.tsx
  - packages/payments/src/constants.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/tsconfig.json
  - packages/github-kit/src/types.ts
  - vitest.config.ts
  - apps/saas/package.json
  - apps/saas/lib/course-access.ts
  - packages/payments/src/index.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - apps/saas/app/course/page.tsx
  - apps/saas/app/checkout/result/page.tsx
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/layout.tsx
  - packages/auth/src/auth.ts
  - packages/auth/src/test-auth.ts
  - apps/saas/app/not-found.tsx
  - packages/database/tsconfig.json
  - packages/github-kit/src/revoke.ts
  - packages/ui/tsconfig.json
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - packages/github-kit/tsconfig.json
  - packages/course/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/src/notify.ts
  - packages/utils/tsconfig.json
  - tsconfig.json
  - apps/saas/app/login/page.tsx
  - AGENTS.md
  - docs/discuss/architecture-draft.md
  - packages/auth/src/providers.ts
  - apps/saas/lib/orders.ts
  - tooling/typescript/base.json
  - docs/autonomous-apply-loop.md
  - packages/course/package.json
  - package.json
  - apps/saas/app/api/orders/refund/route.ts
  - README.md
  - packages/course/src/access.ts
  - turbo.json
  - packages/i18n/tsconfig.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/github-kit/src/config.ts
  - packages/i18n/package.json
  - apps/saas/app/globals.css
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - apps/saas/lib/demo-grant.ts
  - docs/discuss/2026-08-14-alignment.md
  - packages/course/src/catalog.ts
  - packages/i18n/src/index.ts
  - packages/ui/package.json
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/.env.example
  - docs/discuss/2026-08-14-thetu-source.md
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/api/github/claim/route.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/course/src/playback.ts
  - packages/github-kit/package.json
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/payments/src/refund.ts
  - packages/github-kit/src/index.ts
  - packages/payments/src/checkout.ts
  - packages/ui/src/index.tsx
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/next-env.d.ts
  - docs/discuss/README.md
  - packages/course/src/index.ts
  - packages/database/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/auth/package.json
  - packages/payments/src/factory.ts
  - apps/saas/app/api/github/claim-status/route.ts
  - packages/github-kit/src/github-app-client.ts
  - pnpm-workspace.yaml
  - packages/auth/tsconfig.json
  - packages/payments/src/memory-store.ts
  - packages/auth/src/index.ts
  - apps/saas/app/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/lib/github-kit.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/utils/src/index.ts
  - docs/discuss/payment-and-deploy.md
  - docs/discuss/extract-map.md
  - packages/database/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/github-kit/src/claim.ts
  - docs/deploy-and-public-url.md
tests:
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/github-kit/src/config.test.ts
  - packages/course/src/playback.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/order.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: GitHub App performs collaborator invites

Collaborator add and revoke SHALL use a GitHub App installation token for the configured organization repository. Learner GitHub OAuth tokens MUST NOT be used as organization admin credentials. Missing App or OAuth configuration MUST fail closed with HTTP 503 on claim.

#### Scenario: Missing App config fails closed

- **WHEN** GITHUB_APP_ID or installation or private key or GITHUB_KIT_ORG or GITHUB_KIT_REPO is missing and POST /api/github/claim is called by an entitled user
- **THEN** the response MUST be HTTP 503 and MUST NOT create an accepted grant

##### Example: 未設定 org／repo

- 環境缺少 GITHUB_KIT_REPO
- 有權使用者 POST claim → 503

<!-- @trace
source: extract-github-kit-fulfillment
updated: 2026-08-15
code:
  - packages/utils/package.json
  - apps/saas/app/login/login-form.tsx
  - packages/payments/src/constants.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/tsconfig.json
  - packages/github-kit/src/types.ts
  - vitest.config.ts
  - apps/saas/package.json
  - apps/saas/lib/course-access.ts
  - packages/payments/src/index.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - apps/saas/app/course/page.tsx
  - apps/saas/app/checkout/result/page.tsx
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/layout.tsx
  - packages/auth/src/auth.ts
  - packages/auth/src/test-auth.ts
  - apps/saas/app/not-found.tsx
  - packages/database/tsconfig.json
  - packages/github-kit/src/revoke.ts
  - packages/ui/tsconfig.json
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/package.json
  - apps/saas/app/api/payuni/return/route.ts
  - packages/github-kit/tsconfig.json
  - packages/course/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/src/notify.ts
  - packages/utils/tsconfig.json
  - tsconfig.json
  - apps/saas/app/login/page.tsx
  - AGENTS.md
  - docs/discuss/architecture-draft.md
  - packages/auth/src/providers.ts
  - apps/saas/lib/orders.ts
  - tooling/typescript/base.json
  - docs/autonomous-apply-loop.md
  - packages/course/package.json
  - package.json
  - apps/saas/app/api/orders/refund/route.ts
  - README.md
  - packages/course/src/access.ts
  - turbo.json
  - packages/i18n/tsconfig.json
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/github-kit/src/config.ts
  - packages/i18n/package.json
  - apps/saas/app/globals.css
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - apps/saas/lib/demo-grant.ts
  - docs/discuss/2026-08-14-alignment.md
  - packages/course/src/catalog.ts
  - packages/i18n/src/index.ts
  - packages/ui/package.json
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/.env.example
  - docs/discuss/2026-08-14-thetu-source.md
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/api/github/claim/route.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/course/src/playback.ts
  - packages/github-kit/package.json
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/payments/src/refund.ts
  - packages/github-kit/src/index.ts
  - packages/payments/src/checkout.ts
  - packages/ui/src/index.tsx
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/next-env.d.ts
  - docs/discuss/README.md
  - packages/course/src/index.ts
  - packages/database/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/auth/package.json
  - packages/payments/src/factory.ts
  - apps/saas/app/api/github/claim-status/route.ts
  - packages/github-kit/src/github-app-client.ts
  - pnpm-workspace.yaml
  - packages/auth/tsconfig.json
  - packages/payments/src/memory-store.ts
  - packages/auth/src/index.ts
  - apps/saas/app/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/lib/github-kit.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/utils/src/index.ts
  - docs/discuss/payment-and-deploy.md
  - docs/discuss/extract-map.md
  - packages/database/package.json
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/github-kit/src/claim.ts
  - docs/deploy-and-public-url.md
tests:
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/github-kit/src/config.test.ts
  - packages/course/src/playback.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/order.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/auth/src/auth.test.ts
-->