# course-review-plugin Specification

## Purpose

TBD - created by archiving change 'course-review-plugin'. Update Purpose after archive.

## Requirements

### Requirement: Reviews and comments are stored in dedicated transaction-type tables, not PluginContent

The system SHALL persist `CourseReview`, `ReviewHelpful`, `ReviewReport`, and `LessonComment` as dedicated database tables, not as `PluginContent` records.

#### Scenario: Review is queryable and sortable by structured columns

- **WHEN** a course's reviews are listed sorted by helpful count
- **THEN** the system MUST query the dedicated `CourseReview`/`ReviewHelpful` tables using a database-level sort, not a JSON body scan


<!-- @trace
source: course-review-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/course-review/tsconfig.json
  - packages/course-review/package.json
  - packages/platform/src/mount-points.ts
  - packages/course-quiz/vitest.config.ts
  - packages/course-quiz/quiz-session.ts
  - apps/saas/lib/invoice-settings.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/buyer-extension-convention.md
  - packages/api/modules/quiz/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/api/modules/course/router.ts
  - apps/saas/lib/orders.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/dashboard/status.html
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - packages/api/orpc/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - apps/saas/lib/schedule-after.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/database/prisma/zod/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - packages/payments/package.json
  - packages/course-quiz/package.json
  - docs/woomin-integration-master-plan.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/course-review/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - packages/api/package.json
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/types.ts
  - AGENTS.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/course-quiz/tsconfig.json
  - packages/course-quiz/index.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/payments/lib/invoice-preference.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-review/review-summary.ts
  - packages/api/modules/review/lesson-comment.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/api/modules/review/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
tests:
  - packages/api/modules/review/router.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/course-review/review-summary.test.ts
-->

---
### Requirement: A learner can rate a course exactly once

The system SHALL enforce at most one `CourseReview` per `(userId, courseId)` pair.

#### Scenario: Duplicate review for the same course is rejected

- **WHEN** a learner who has already reviewed a course submits a second review for the same course
- **THEN** the system MUST reject the duplicate at the database level and MUST NOT create a second `CourseReview` row


<!-- @trace
source: course-review-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/course-review/tsconfig.json
  - packages/course-review/package.json
  - packages/platform/src/mount-points.ts
  - packages/course-quiz/vitest.config.ts
  - packages/course-quiz/quiz-session.ts
  - apps/saas/lib/invoice-settings.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/buyer-extension-convention.md
  - packages/api/modules/quiz/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/api/modules/course/router.ts
  - apps/saas/lib/orders.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/dashboard/status.html
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - packages/api/orpc/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - apps/saas/lib/schedule-after.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/database/prisma/zod/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - packages/payments/package.json
  - packages/course-quiz/package.json
  - docs/woomin-integration-master-plan.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/course-review/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - packages/api/package.json
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/types.ts
  - AGENTS.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/course-quiz/tsconfig.json
  - packages/course-quiz/index.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/payments/lib/invoice-preference.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-review/review-summary.ts
  - packages/api/modules/review/lesson-comment.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/api/modules/review/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
tests:
  - packages/api/modules/review/router.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/course-review/review-summary.test.ts
-->

---
### Requirement: Course review summary is computed on demand, not cached on the Course model

The system SHALL expose `getCourseReviewSummary(courseId)` returning the average rating and review count, computed at query time. The system MUST NOT add a cached rating field to the `Course` model.

#### Scenario: Summary reflects current reviews without a cached column

- **WHEN** `getCourseReviewSummary` is called for a course with existing reviews
- **THEN** the returned average and count MUST match the current `CourseReview` rows for that course, and the `Course` model's schema MUST NOT have gained a new rating-related column


<!-- @trace
source: course-review-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/course-review/tsconfig.json
  - packages/course-review/package.json
  - packages/platform/src/mount-points.ts
  - packages/course-quiz/vitest.config.ts
  - packages/course-quiz/quiz-session.ts
  - apps/saas/lib/invoice-settings.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/buyer-extension-convention.md
  - packages/api/modules/quiz/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/api/modules/course/router.ts
  - apps/saas/lib/orders.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/dashboard/status.html
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - packages/api/orpc/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - apps/saas/lib/schedule-after.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/database/prisma/zod/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - packages/payments/package.json
  - packages/course-quiz/package.json
  - docs/woomin-integration-master-plan.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/course-review/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - packages/api/package.json
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/types.ts
  - AGENTS.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/course-quiz/tsconfig.json
  - packages/course-quiz/index.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/payments/lib/invoice-preference.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-review/review-summary.ts
  - packages/api/modules/review/lesson-comment.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/api/modules/review/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
tests:
  - packages/api/modules/review/router.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/course-review/review-summary.test.ts
-->

---
### Requirement: Anonymous comments retain the real author for operator review while hiding it from other learners

The system SHALL allow a learner to post a `LessonComment` with `isAnonymous: true`, storing the real `userId` regardless. Display surfaces for other learners MUST NOT reveal the author's identity when `isAnonymous` is true; operator-facing surfaces MAY reveal it.

#### Scenario: Anonymous comment hides identity from other learners

- **WHEN** another learner views a comment with `isAnonymous: true`
- **THEN** the response MUST NOT include the commenting user's identifying information

#### Scenario: Operator can still see the real author of an anonymous comment

- **WHEN** an operator views the same comment through an operator-facing surface
- **THEN** the response MAY include the real `userId` for moderation purposes

<!-- @trace
source: course-review-plugin
updated: 2026-08-24
code:
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - docs/design-canvas/anson-manual-redesign-direction.html
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/course-review/tsconfig.json
  - packages/course-review/package.json
  - packages/platform/src/mount-points.ts
  - packages/course-quiz/vitest.config.ts
  - packages/course-quiz/quiz-session.ts
  - apps/saas/lib/invoice-settings.ts
  - packages/api/modules/course/lib/invoice-settings.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/buyer-extension-convention.md
  - packages/api/modules/quiz/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/api/modules/course/router.ts
  - apps/saas/lib/orders.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - docs/dashboard/status.html
  - packages/api/modules/course/procedures/invoice-operations.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - packages/api/orpc/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - apps/saas/lib/schedule-after.ts
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/database/prisma/zod/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - packages/payments/package.json
  - packages/course-quiz/package.json
  - docs/woomin-integration-master-plan.md
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/course-review/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - packages/api/package.json
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/package.json
  - packages/payments/types.ts
  - AGENTS.md
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/course-quiz/tsconfig.json
  - packages/course-quiz/index.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - packages/payments/provider/ezpay/invoice-provider.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - packages/payments/index.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/payments/lib/invoice-preference.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - packages/database/prisma/schema.prisma
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-review/review-summary.ts
  - packages/api/modules/review/lesson-comment.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - packages/api/modules/review/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
tests:
  - packages/api/modules/review/router.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/course-review/review-summary.test.ts
-->