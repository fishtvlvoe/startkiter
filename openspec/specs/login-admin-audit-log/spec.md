# login-admin-audit-log Specification

## Purpose

TBD - created by archiving change 'login-and-admin-audit-log'. Update Purpose after archive.

## Requirements

### Requirement: Every login attempt is recorded regardless of outcome

The system SHALL record a `LoginAttempt` row for every sign-in request, whether it succeeds or fails, including email, IP address, success flag, and user agent.

#### Scenario: Successful login is recorded

- **WHEN** a user successfully signs in
- **THEN** a `LoginAttempt` row MUST be created with `success: true`

#### Scenario: Failed login is recorded

- **WHEN** a sign-in request fails (e.g. wrong password)
- **THEN** a `LoginAttempt` row MUST be created with `success: false`

#### Scenario: Recording failure does not block sign-in

- **WHEN** writing a `LoginAttempt` row itself throws an error
- **THEN** the sign-in flow MUST still complete based on the actual authentication result, not fail solely due to the logging error


<!-- @trace
source: login-and-admin-audit-log
updated: 2026-08-24
code:
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/course-quiz/quiz-session.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/invite/[token]/invite-redeem-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - packages/api/modules/course/lib/course-access.ts
  - packages/database/prisma/migrations/20260824090022_add_course_invites/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - apps/saas/app/api/payuni/notify/route.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/auth/auth.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/platform/src/admin-log.ts
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - apps/saas/lib/orders.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/auth/login-attempt.ts
  - packages/course-review/review-summary.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/course-quiz/tsconfig.json
  - packages/course-review/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - apps/saas/app/invite/[token]/page.tsx
  - packages/course-quiz/index.ts
  - packages/course-quiz/package.json
  - packages/course-review/package.json
  - packages/database/prisma/migrations/20260824094111_add_login_attempt_admin_log/migration.sql
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - apps/saas/lib/schedule-after.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/platform/index.ts
  - packages/platform/src/mount-points.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - packages/payments/index.ts
  - packages/api/modules/quiz/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/api/modules/course/lib/invoice-operations.ts
  - packages/auth/index.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/api/modules/review/lesson-comment.ts
  - packages/api/package.json
  - packages/course-review/tsconfig.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/api/modules/course/lib/course-invite-auth.ts
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - packages/course/access.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - packages/payments/package.json
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - packages/api/modules/course/lib/course-operator.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/router.ts
  - packages/course-quiz/vitest.config.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/database/prisma/zod/index.ts
  - packages/payments/types.ts
  - docs/dashboard/status.html
  - packages/api/modules/review/router.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/orpc/router.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/api/modules/course/procedures/redeem-course-invite.ts
  - apps/saas/lib/invoice-settings.ts
  - apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/create-course-invite.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - docs/woomin-integration-master-plan.md
  - docs/buyer-extension-convention.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
tests:
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/course/access.test.ts
  - packages/auth/login-attempt.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/api/modules/review/router.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/procedures/redeem-course-invite.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/course-review/review-summary.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/auth/better-auth-hook-experiment.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/app/api/course/studio/route.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/course.test.ts
  - packages/api/modules/course/procedures/create-course-invite.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/platform/src/admin-log.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
-->

---
### Requirement: High-risk operator actions are recorded in AdminLog

The system SHALL record an `AdminLog` row for refunds, invoice void/allowance operations, and course deletions, including the acting admin, action type, target, and IP address.

#### Scenario: Refund action is logged

- **WHEN** an operator refunds an order
- **THEN** an `AdminLog` row MUST be created with `action` identifying the refund, `adminId` set to the acting operator, and `targetId` referencing the order

#### Scenario: Course deletion is logged

- **WHEN** an operator deletes a course
- **THEN** an `AdminLog` row MUST be created with `targetType: "Course"` and `targetId` referencing the deleted course

<!-- @trace
source: login-and-admin-audit-log
updated: 2026-08-24
code:
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/course-quiz/quiz-session.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/invite/[token]/invite-redeem-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - packages/api/modules/course/lib/course-access.ts
  - packages/database/prisma/migrations/20260824090022_add_course_invites/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - apps/saas/app/api/payuni/notify/route.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/auth/auth.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/platform/src/admin-log.ts
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - apps/saas/lib/orders.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/auth/login-attempt.ts
  - packages/course-review/review-summary.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/course-quiz/tsconfig.json
  - packages/course-review/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - apps/saas/app/invite/[token]/page.tsx
  - packages/course-quiz/index.ts
  - packages/course-quiz/package.json
  - packages/course-review/package.json
  - packages/database/prisma/migrations/20260824094111_add_login_attempt_admin_log/migration.sql
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - apps/saas/lib/schedule-after.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/platform/index.ts
  - packages/platform/src/mount-points.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - packages/payments/index.ts
  - packages/api/modules/quiz/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/api/modules/course/lib/invoice-operations.ts
  - packages/auth/index.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/api/modules/review/lesson-comment.ts
  - packages/api/package.json
  - packages/course-review/tsconfig.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/api/modules/course/lib/course-invite-auth.ts
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - packages/course/access.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - packages/payments/package.json
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - packages/api/modules/course/lib/course-operator.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - packages/api/modules/course/router.ts
  - packages/course-quiz/vitest.config.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/database/prisma/zod/index.ts
  - packages/payments/types.ts
  - docs/dashboard/status.html
  - packages/api/modules/review/router.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/orpc/router.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/api/modules/course/procedures/redeem-course-invite.ts
  - apps/saas/lib/invoice-settings.ts
  - apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/create-course-invite.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - docs/woomin-integration-master-plan.md
  - docs/buyer-extension-convention.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
tests:
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/course/access.test.ts
  - packages/auth/login-attempt.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/api/modules/review/router.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/procedures/redeem-course-invite.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/course-review/review-summary.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/auth/better-auth-hook-experiment.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/app/api/course/studio/route.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/course.test.ts
  - packages/api/modules/course/procedures/create-course-invite.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/platform/src/admin-log.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
-->