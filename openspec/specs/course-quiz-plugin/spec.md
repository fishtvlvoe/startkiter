# course-quiz-plugin Specification

## Purpose

TBD - created by archiving change 'course-quiz-plugin'. Update Purpose after archive.

## Requirements

### Requirement: Quiz definitions are stored through the shared PluginContent table

The system SHALL persist quiz definitions (settings and questions) as `PluginContent` records with `pluginId: "quiz"` and `type: "quiz-definition"`. The system MUST NOT create a Plugin-specific table for storing quiz definitions or questions.

#### Scenario: Quiz definition is retrievable through PluginContent

- **WHEN** an operator creates a quiz definition via the quiz admin page
- **THEN** the system MUST insert a `PluginContent` row with `pluginId: "quiz"` and `type: "quiz-definition"`, and the quiz MUST be retrievable by querying `pluginId = "quiz" AND type = "quiz-definition"`


<!-- @trace
source: course-quiz-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-quiz/tsconfig.json
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/course-quiz/quiz-session.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course-quiz/quiz-grading.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/course-quiz/quiz-definition.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/course-quiz/vitest.config.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - docs/woomin-integration-master-plan.md
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/course-quiz/package.json
  - apps/saas/lib/schedule-after.ts
  - apps/saas/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/buyer-extension-convention.md
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/api/modules/course/router.ts
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/api/orpc/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/database/prisma/schema.prisma
  - packages/api/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/package.json
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - apps/saas/lib/orders.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - packages/course-quiz/index.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/mount-points.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
tests:
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/course-quiz/quiz-session.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-definition.test.ts
-->

---
### Requirement: Quiz attempts are recorded in a dedicated transaction-type table

The system SHALL record each learner's quiz submission as a `QuizAttempt` row in its own database table, separate from the shared `PluginContent` table.

#### Scenario: Submitting a quiz creates a QuizAttempt row

- **WHEN** a signed-in learner submits answers for a quiz
- **THEN** the system MUST create a `QuizAttempt` row with the learner's `userId`, the quiz's `pluginContentId`, submitted `answers`, computed `score`, and `passed` boolean


<!-- @trace
source: course-quiz-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-quiz/tsconfig.json
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/course-quiz/quiz-session.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course-quiz/quiz-grading.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/course-quiz/quiz-definition.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/course-quiz/vitest.config.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - docs/woomin-integration-master-plan.md
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/course-quiz/package.json
  - apps/saas/lib/schedule-after.ts
  - apps/saas/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/buyer-extension-convention.md
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/api/modules/course/router.ts
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/api/orpc/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/database/prisma/schema.prisma
  - packages/api/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/package.json
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - apps/saas/lib/orders.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - packages/course-quiz/index.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/mount-points.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
tests:
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/course-quiz/quiz-session.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-definition.test.ts
-->

---
### Requirement: Four question types are graded using verified logic

The system SHALL grade `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, and `FILL_IN_BLANK` question types. Multiple-choice answers SHALL be compared as sets (order-independent); fill-in-blank answers SHALL accept any of multiple predefined acceptable strings.

#### Scenario: Multiple-choice answer order does not affect grading

- **WHEN** a learner selects options in a different order than the stored `correctAnswer` array but the same set of options
- **THEN** the question MUST be graded as correct

##### Example: order-independent multiple choice

| correctAnswer | submitted answer | Result |
| --- | --- | --- |
| ["a", "b"] | ["b", "a"] | Correct |
| ["a", "b"] | ["a"] | Incorrect |

#### Scenario: Fill-in-blank accepts any predefined acceptable answer

- **WHEN** a learner's submitted text matches any one of the question's predefined acceptable answer strings
- **THEN** the question MUST be graded as correct


<!-- @trace
source: course-quiz-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-quiz/tsconfig.json
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/course-quiz/quiz-session.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course-quiz/quiz-grading.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/course-quiz/quiz-definition.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/course-quiz/vitest.config.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - docs/woomin-integration-master-plan.md
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/course-quiz/package.json
  - apps/saas/lib/schedule-after.ts
  - apps/saas/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/buyer-extension-convention.md
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/api/modules/course/router.ts
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/api/orpc/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/database/prisma/schema.prisma
  - packages/api/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/package.json
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - apps/saas/lib/orders.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - packages/course-quiz/index.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/mount-points.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
tests:
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/course-quiz/quiz-session.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-definition.test.ts
-->

---
### Requirement: Quiz pages render through the auto-mode mount point, not embedded in lesson content

The quiz Plugin's manifest entry in `MOUNT_POINTS` SHALL declare `mount.content.kind: "auto"` bound to `/quiz`. The system MUST NOT rely on `"block"` mode for rendering quiz pages, since v1 does not guarantee block-mode rendering.

#### Scenario: Quiz page is reachable via its own auto-mounted route

- **WHEN** a signed-in learner navigates to `/quiz/{pluginContentId}` for an existing quiz definition
- **THEN** the quiz page MUST render without requiring any block-mode content placement


<!-- @trace
source: course-quiz-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-quiz/tsconfig.json
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/course-quiz/quiz-session.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course-quiz/quiz-grading.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/course-quiz/quiz-definition.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/course-quiz/vitest.config.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - docs/woomin-integration-master-plan.md
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/course-quiz/package.json
  - apps/saas/lib/schedule-after.ts
  - apps/saas/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/buyer-extension-convention.md
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/api/modules/course/router.ts
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/api/orpc/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/database/prisma/schema.prisma
  - packages/api/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/package.json
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - apps/saas/lib/orders.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - packages/course-quiz/index.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/mount-points.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
tests:
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/course-quiz/quiz-session.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-definition.test.ts
-->

---
### Requirement: Pass status is queryable without modifying the course engine's unlock logic

The system SHALL expose a `hasPassedQuiz(userId, pluginContentId)` function returning whether a learner has passed a given quiz. The system MUST NOT modify the course engine's existing lesson-unlock logic to automatically enforce quiz results.

#### Scenario: hasPassedQuiz reflects the latest passing attempt

- **WHEN** a learner has at least one `QuizAttempt` with `passed: true` for a given `pluginContentId`
- **THEN** `hasPassedQuiz(userId, pluginContentId)` MUST return true

#### Scenario: hasPassedQuiz returns false with no passing attempt

- **WHEN** a learner has no `QuizAttempt` with `passed: true` for a given `pluginContentId`
- **THEN** `hasPassedQuiz(userId, pluginContentId)` MUST return false

<!-- @trace
source: course-quiz-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-quiz/tsconfig.json
  - packages/api/modules/course/lib/order-refunds.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/course-quiz/quiz-session.ts
  - packages/payments/lib/invoice-issue-input.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course-quiz/quiz-grading.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/course-quiz/quiz-definition.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/course-quiz/vitest.config.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - docs/woomin-integration-master-plan.md
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/payments/lib/invoice-preference.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/course-quiz/package.json
  - apps/saas/lib/schedule-after.ts
  - apps/saas/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/buyer-extension-convention.md
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - packages/api/modules/course/router.ts
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/api/orpc/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/database/prisma/schema.prisma
  - packages/api/package.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/payments/package.json
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - apps/saas/lib/orders.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - packages/course-quiz/index.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/mount-points.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
tests:
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/course-quiz/quiz-session.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/payments/invoice-provider.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/course-quiz/quiz-definition.test.ts
-->