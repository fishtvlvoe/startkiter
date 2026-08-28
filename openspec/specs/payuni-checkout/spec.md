# payuni-checkout Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: PAYUNi is the only MVP gateway

MVP checkout SHALL use one of PAYUNi, Shopline, or Stripe for one-time TWD payments, determined by the operator's currently enabled gateway setting. Polar MUST NOT accept MVP funds. The checkout amount and sku MUST be server-locked to 8800 TWD and startkiter-mvp. Exactly one gateway is enabled at any given time; the checkout endpoint MUST NOT let a buyer choose among multiple gateways.

#### Scenario: Checkout uses the currently enabled gateway

- **WHEN** a signed-in buyer submits POST /api/checkout for sku startkiter-mvp
- **THEN** the server MUST start a payment session with whichever of PAYUNi, Shopline, or Stripe is currently configured as the enabled gateway, and MUST NOT redirect to Polar or to any gateway other than the enabled one

##### Example: 買家送出結帳建立啟用金流的 session

- 已登入買家 alice@example.com 對 POST /api/checkout 送出 sku=startkiter-mvp，後台啟用金流設定為 PAYUNi
- 伺服器建立 PAYUNi 一次性 TWD 8800 元付款 session，不導向 Shopline、Stripe 或 Polar

#### Scenario: Unconfigured enabled gateway fails closed

- **WHEN** the currently enabled gateway's keys are missing and a signed-in client calls POST /api/checkout
- **THEN** the response MUST be HTTP 503 with an explicit configuration error and MUST NOT be HTTP 500

#### Scenario: Client-supplied alternate sku is rejected

- **WHEN** a signed-in buyer submits POST /api/checkout with a sku other than startkiter-mvp
- **THEN** the server MUST reject the request and MUST NOT start a payment session for the supplied sku


<!-- @trace
source: multi-gateway-checkout
updated: 2026-08-28
code:
  - apps/saas/app/api/course/studio/route.ts
  - packages/api/modules/course/lib/course-operator.ts
  - pnpm-workspace.yaml
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/auth/lib/organization-role-hooks.ts
  - docs/buyer-extension-convention.md
  - apps/saas/package.json
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - apps/saas/app/(authenticated)/assignment/[pluginContentId]/assignment-learner.tsx
  - packages/database/prisma/migrations/20260824200500_add_course_video_watermark_setting/migration.sql
  - packages/api/modules/course/procedures/assign-course-instructor.ts
  - docs/verification/lesson-watch-time-tracking/13-code-review.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/page.tsx
  - packages/api/modules/course/procedures/list-email-delivery-log.ts
  - packages/api/modules/course/procedures/register-media.ts
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - apps/saas/Dockerfile
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/mail/emails/CourseWelcome.tsx
  - packages/payments/types.ts
  - packages/course-quiz/quiz-grading.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/page.tsx
  - packages/database/prisma/migrations/20260824190603_add_course_media_library/migration.sql
  - apps/saas/app/api/assignment/upload/route.ts
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/database/scripts/backfill-lesson-media.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - packages/payments/memory-store.ts
  - packages/course-assignment/tsconfig.json
  - README.md
  - packages/database/prisma/migrations/20260825150000_enforce_organization_member_roles/migration.sql
  - apps/saas/lib/orders.ts
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/api/modules/review/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - packages/database/prisma/queries/index.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/payments/gateway-settings.ts
  - packages/api/modules/quiz/router.ts
  - packages/payments/checkout.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - .dockerignore
  - packages/storage/provider/s3/index.ts
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - apps/saas/app/api/payuni/period-notify/route.ts
  - docs/verification/course-media-library/15-e2e.md
  - apps/saas/lib/payuni-credentials.ts
  - apps/saas/lib/admin-access.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/api/checkout/status/route.ts
  - packages/api/modules/course/procedures/record-watch-time.ts
  - packages/api/modules/course/router.ts
  - packages/course/index.ts
  - apps/saas/lib/checkout-gateway-settings.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - packages/payments/package.json
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - apps/saas/app/api/stripe/webhook/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/[id]/page.tsx
  - apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - packages/api/modules/course/procedures/list-media.ts
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/checkout-gateway/page.tsx
  - packages/course-review/review-summary.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx
  - packages/payments/provider/payuni/crypto.ts
  - packages/course-quiz/vitest.config.ts
  - packages/api/orpc/router.ts
  - packages/api/modules/course/procedures/set-course-cover-media.ts
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - packages/i18n/translations/de/saas.json
  - packages/database/prisma/migrations/20260825020000_add_lesson_private_message/migration.sql
  - apps/saas/lib/schedule-after.ts
  - packages/course-assignment/package.json
  - packages/auth/client.ts
  - packages/database/prisma/queries/orders.ts
  - packages/payments/provider/payuni/gateway.ts
  - apps/saas/app/api/course/lesson-messages/upload/route.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/design-canvas/anson-manual-redesign-direction.html
  - packages/api/modules/course/procedures/list-course-packs.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/api/modules/course/procedures/remove-course-instructor.ts
  - packages/database/drizzle/schema/postgres.ts
  - apps/saas/app/api/cron/lesson-message-upload-cleanup/route.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - packages/payments/credentials.ts
  - packages/course-quiz/package.json
  - packages/course-assignment/index.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - packages/api/package.json
  - packages/database/prisma/migrations/20260824105109_add_course_onboarding_survey_course_fk/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - apps/saas/lib/github-kit.ts
  - packages/course-quiz/tsconfig.json
  - packages/i18n/translations/en/saas.json
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - packages/api/modules/course/errors.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/api/modules/course/lib/course-invite-auth.ts
  - docs/verification/lesson-private-message/14-e2e.md
  - packages/auth/lib/organization-member-role-order.ts
  - packages/course-quiz/quiz-session.ts
  - packages/api/modules/assignment/router.ts
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - apps/saas/.dockerignore
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - docs/dispatch-board.md
  - docs/verification/course-media-library/15-code-review.md
  - apps/saas/app/(authenticated)/assignment/[pluginContentId]/page.tsx
  - apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx
  - packages/auth/login-attempt.ts
  - packages/api/modules/payments/procedures/list-purchases.ts
  - packages/i18n/translations/zh-tw/saas.json
  - packages/database/prisma/migrations/20260824215500_add_assignment_upload_intents/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/onboarding-survey-modal.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/database/prisma/migrations/20260824103241_add_course_onboarding_survey/migration.sql
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/api/modules/review/lesson-comment.ts
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - docs/woomin-integration-master-plan.md
  - packages/course-review/tsconfig.json
  - packages/payments/index.ts
  - apps/saas/.env.example
  - packages/database/prisma/migrations/20260825160000_enforce_one_organization_owner/migration.sql
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - packages/course/src/player/watermark-overlay.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/page.tsx
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - packages/course-assignment/sanitize-html.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - apps/saas/app/api/cron/assignment-upload-cleanup/route.ts
  - packages/permissions/definition.ts
  - packages/api/modules/course/procedures/create-course-invite.ts
  - docs/verification/lesson-watch-time-tracking/13-e2e.md
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/auth/lib/organization-roles.ts
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/course-assignment/assignment-definition.ts
  - packages/database/prisma/migrations/20260824165414_add_watch_time_log/migration.sql
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/lib/course-access.ts
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/storage/types.ts
  - docs/dashboard/status.html
  - packages/payments/provider/stripe/gateway.ts
  - packages/database/prisma/migrations/20260824225000_add_assignment_upload_cleanup_claim/migration.sql
  - packages/database/prisma/migrations/20260825170000_add_order_organization/migration.sql
  - packages/course-review/package.json
  - packages/database/prisma/migrations/20260824223000_add_assignment_submission_revision_unique/migration.sql
  - packages/payments/provider/index.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - packages/api/modules/organization/procedures/assign-instructor-role.ts
  - apps/saas/app/(authenticated)/checkout/page.tsx
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - packages/platform/src/mount-points.ts
  - apps/saas/lib/invoice-settings.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/database/drizzle/schema/mysql.ts
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/course-quiz/index.ts
  - apps/saas/app/invite/[token]/invite-redeem-panel.tsx
  - packages/i18n/translations/es/saas.json
  - packages/api/modules/organizations/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - packages/database/prisma/migrations/20260824182322_add_lesson_message_upload_intent/migration.sql
  - packages/storage/config.ts
  - packages/course-quiz/quiz-definition.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - packages/course-assignment/vitest.config.ts
  - packages/course/src/course-pack/schema.ts
  - packages/api/modules/course/procedures/update-welcome-email-settings.ts
  - packages/platform/src/admin-log.ts
  - AGENTS.md
  - packages/auth/lib/organization-invitation-email.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/database/prisma/migrations/20260825160000_course_lifecycle_email/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/revenue/page.tsx
  - packages/api/modules/assignment/assignment-draft.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/users/page.tsx
  - packages/api/modules/assignment/assignment-upload.ts
  - packages/payments/order.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/database/prisma/migrations/20260824231000_add_assignment_draft_revision/migration.sql
  - packages/mail/lib/course-lifecycle.ts
  - docs/cr-report-extract-supastarter-design-system.md
  - apps/saas/app/api/payuni/return/route.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - packages/api/modules/course/procedures/submit-onboarding-survey.ts
  - packages/database/prisma/migrations/20260824132306_add_course_assignments/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - packages/auth/auth.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - apps/saas/app/image-proxy/[...path]/route.ts
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - packages/database/prisma/migrations/20260824090022_add_course_invites/migration.sql
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx
  - packages/api/modules/course/lib/invoice-settings.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/api/modules/course/procedures/invoice-operations.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/course/src/player/FluentPlayer.tsx
  - docs/verification/lesson-private-message/14-code-review.md
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - packages/payments/lib/invoice-preference.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - packages/api/modules/course/procedures/lesson-message-upload-cleanup.ts
  - packages/payments/provider/shopline/gateway.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/modules/course/lib/invoice-operations.ts
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - packages/database/prisma/migrations/20260824184149_lesson_message_upload_cleanup_lifecycle/migration.sql
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - apps/saas/app/invite/[token]/page.tsx
  - apps/marketing/Dockerfile
  - apps/saas/app/api/cron/course-expiration/route.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - packages/api/modules/course/procedures/lesson-message-upload.ts
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - packages/api/modules/assignment/assignment-lifecycle.ts
  - packages/mail/index.ts
  - packages/course-assignment/submission-rules.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - packages/database/prisma/migrations/20260824184722_lesson_message_upload_retention_index/migration.sql
  - packages/database/prisma/migrations/20260824094111_add_login_attempt_admin_log/migration.sql
  - packages/auth/index.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - packages/platform/index.ts
  - packages/database/drizzle/schema/sqlite.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - packages/database/prisma/migrations/20260824193000_add_course_instructors/migration.sql
  - packages/i18n/translations/fr/saas.json
  - apps/saas/app/api/shopline/notify/route.ts
  - packages/api/modules/course/procedures/delete-media.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/api/modules/course/procedures/media-upload-url.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/lib/send-welcome-email.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/course/access.ts
  - packages/payments/provider/invoice-query-errors.ts
  - apps/saas/next.config.ts
  - packages/course-review/index.ts
  - packages/payments/lib/invoice-issue-input.ts
  - packages/api/modules/course/procedures/redeem-course-invite.ts
  - packages/course-review/vitest.config.ts
  - packages/database/prisma/migrations/20260824195500_remove_redundant_course_instructor_course_id_index/migration.sql
  - apps/marketing/next.config.ts
  - packages/payments/factory.ts
  - packages/permissions/create-permission-rules.ts
tests:
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - apps/saas/app/api/cron/course-expiration/route.test.ts
  - packages/permissions/create-permission-rules.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - packages/auth/lib/organization-roles.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - packages/api/modules/assignment/assignment-draft.test.ts
  - packages/auth/better-auth-hook-experiment.test.ts
  - packages/course-review/review-summary.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - packages/auth/lib/better-auth-organization-probe.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/database/src/assignment/assignment-draft.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - packages/auth/lib/organization-role-hooks.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
  - packages/auth/lib/organization-invitation-email.test.ts
  - packages/api/modules/payments/procedures/list-purchases.test.ts
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/api/modules/course/procedures/submit-onboarding-survey.test.ts
  - packages/api/modules/assignment/assignment-lifecycle.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.test.ts
  - apps/saas/modules/organizations/lib/organization-role.test.ts
  - packages/api/modules/course/procedures/redeem-course-invite.test.ts
  - packages/auth/login-attempt.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/course/access.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/course/src/player/FluentPlayer.test.tsx
  - apps/saas/app/api/course/studio/route.test.ts
  - packages/course-assignment/assignment-definition.test.ts
  - packages/course/src/player/watermark-overlay.test.tsx
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/payments/factory.test.ts
  - packages/course-assignment/submission-rules.test.ts
  - packages/api/modules/course/procedures/assign-course-instructor.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/database/prisma/queries/orders.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/create-course-invite.test.ts
  - packages/course-assignment/sanitize-html.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/api/modules/course/procedures/delete-media.test.ts
  - packages/api/modules/course/procedures/register-media.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/api/modules/organizations/lib/membership.test.ts
  - packages/api/modules/review/router.test.ts
  - packages/payments/checkout-gateway.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - apps/saas/app/api/checkout/route.test.ts
  - packages/api/modules/course/procedures/record-watch-time.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/platform/src/admin-log.test.ts
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - packages/api/modules/assignment/assignment-upload.test.ts
-->

---
### Requirement: Webhook marks a single order paid

POST /api/payuni/notify SHALL verify the PAYUNi payload and mark at most one matching order paid. Duplicate notifications MUST be idempotent. On first paid transition the order MUST set courseAccess true and kitClaimEligible true. If electronic invoicing is enabled with auto-issue on, the first paid transition SHALL also trigger invoice issuance for that order; invoice issuance failure MUST NOT change the order's paid status or entitlement flags.

#### Scenario: First successful notify pays the order

- **WHEN** a valid PAYUNi paid notify arrives for a pending order
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and the order status MUST become paid and courseAccess MUST be true and kitClaimEligible MUST be true

#### Scenario: Duplicate notify does not double-grant

- **WHEN** the same valid paid notify is posted again
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and MUST NOT create a second order and MUST NOT flip entitlement flags from a consistent paid state into a duplicate grant side effect

#### Scenario: Invalid notify is rejected

- **WHEN** POST /api/payuni/notify receives a payload that fails signature or trade-no matching
- **THEN** the response MUST be HTTP 400 and the order MUST remain pending

#### Scenario: Invoice issuance failure does not affect order paid status

- **WHEN** electronic invoicing is enabled with auto-issue on and the first paid transition's invoice issuance call fails
- **THEN** the order status MUST still become paid with courseAccess true and kitClaimEligible true, and the response MUST still be HTTP 200


<!-- @trace
source: subscriptions-invoice
updated: 2026-08-28
code:
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - apps/saas/modules/course/components/MediaPicker.tsx
  - packages/api/modules/course/lib/expiration-reminder-scan.ts
  - packages/course-quiz/quiz-grading.ts
  - apps/saas/app/invite/[token]/page.tsx
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/payments/index.ts
  - packages/course-review/tsconfig.json
  - packages/database/prisma/migrations/20260824120000_add_einvoice/migration.sql
  - packages/payments/types.ts
  - apps/saas/lib/github-kit.ts
  - packages/database/prisma/migrations/20260827133000_add_refund_and_cancellation_leases/migration.sql
  - apps/saas/app/(authenticated)/checkout/payuni/page.tsx
  - packages/database/prisma/migrations/20260825170000_add_order_organization/migration.sql
  - packages/payments/provider/ezpay/invoice-provider.ts
  - packages/payments/gateway-settings.ts
  - packages/auth/lib/organization-roles.ts
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - packages/api/modules/course/procedures/register-media.ts
  - packages/api/modules/review/lesson-comment.ts
  - apps/saas/app/api/assignment/upload/route.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - apps/saas/app/(authenticated)/checkout/checkout-button.tsx
  - packages/database/prisma/queries/index.ts
  - packages/database/drizzle/schema/postgres.ts
  - apps/saas/app/api/checkout/status/route.ts
  - packages/api/modules/course/procedures/record-watch-time.ts
  - apps/saas/lib/checkout-gateway-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - apps/saas/lib/course-access.ts
  - packages/storage/config.ts
  - docs/verification/course-quiz-plugin/6.3-hidden-answers.png
  - docs/discuss/2026-08-18-handoff-coolify-plugin-architecture.md
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/revenue/page.tsx
  - apps/saas/.dockerignore
  - packages/api/modules/course/lib/invoice-operations.ts
  - packages/database/prisma/queries/orders.ts
  - packages/database/prisma/migrations/20260824080400_add_course_review_rating_constraint/migration.sql
  - packages/payments/provider/payuni/crypto.ts
  - apps/saas/Dockerfile
  - apps/saas/modules/admin/component/OrderRefundButton.tsx
  - packages/api/modules/quiz/router.ts
  - docs/discuss/2026-08-17-handoff-to-startkiter-session.md
  - apps/saas/app/api/payuni/return/route.ts
  - docs/verification/lesson-private-message/14-e2e.md
  - docs/verification/lesson-watch-time-tracking/13-code-review.md
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - packages/course-review/index.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - packages/auth/lib/organization-member-role-order.ts
  - packages/payments/provider/invoice-query-errors.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/page.tsx
  - apps/saas/app/api/cron/lesson-message-upload-cleanup/route.ts
  - apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - docs/cr-report-extract-supastarter-design-system.md
  - packages/database/prisma/schema.prisma
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/payments/credentials.ts
  - packages/auth/login-attempt.ts
  - packages/database/prisma/migrations/20260824225000_add_assignment_upload_cleanup_claim/migration.sql
  - pnpm-workspace.yaml
  - packages/database/prisma/migrations/20260824215500_add_assignment_upload_intents/migration.sql
  - packages/api/modules/course/procedures/update-welcome-email-settings.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - packages/api/modules/course/procedures/create-course-invite.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/page.tsx
  - packages/api/orpc/router.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - packages/database/prisma/migrations/20260824231000_add_assignment_draft_revision/migration.sql
  - packages/payments/provider/shopline/gateway.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/users/page.tsx
  - apps/saas/app/api/course/lesson-messages/upload/route.ts
  - packages/database/prisma/zod/index.ts
  - packages/i18n/translations/de/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/page.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - apps/saas/app/(authenticated)/checkout-return/page.tsx
  - packages/database/prisma/migrations/20260824190603_add_course_media_library/migration.sql
  - packages/course-assignment/submission-rules.ts
  - packages/platform/src/mount-points.ts
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - packages/api/modules/course/lib/invoice-settings.ts
  - apps/saas/app/(authenticated)/assignment/[pluginContentId]/assignment-learner.tsx
  - packages/payments/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260824184722_lesson_message_upload_retention_index/migration.sql
  - packages/course-review/vitest.config.ts
  - packages/database/prisma/migrations/20260824193000_add_course_instructors/migration.sql
  - docs/woomin-integration-master-plan.md
  - packages/course/src/player/watermark-overlay.tsx
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - packages/course-quiz/package.json
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - packages/api/modules/course/procedures/invoice-operations.ts
  - packages/database/drizzle/schema/sqlite.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - docs/verification/course-quiz-plugin/6.3-e2e.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - packages/i18n/translations/es/saas.json
  - .dockerignore
  - packages/auth/lib/organization-invitation-email.ts
  - packages/database/prisma/migrations/20260827130000_add_invoice_operation_leases/migration.sql
  - packages/mail/emails/CourseWelcome.tsx
  - apps/saas/next.config.ts
  - packages/api/modules/course/lib/order-refunds.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/onboarding-survey-modal.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - packages/api/modules/course/procedures/remove-course-instructor.ts
  - packages/api/modules/course/procedures/assign-course-instructor.ts
  - apps/saas/lib/schedule-after.ts
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - packages/database/prisma/migrations/20260824184149_lesson_message_upload_cleanup_lifecycle/migration.sql
  - packages/database/prisma/migrations/20260824182322_add_lesson_message_upload_intent/migration.sql
  - apps/saas/app/(authenticated)/assignment/[pluginContentId]/page.tsx
  - apps/saas/app/api/stripe/webhook/route.ts
  - packages/api/modules/course/lib/send-welcome-email.ts
  - packages/api/modules/course/procedures/set-course-cover-media.ts
  - packages/api/modules/assignment/assignment-lifecycle.ts
  - packages/storage/types.ts
  - packages/api/modules/course/procedures/list-media.ts
  - apps/marketing/next.config.ts
  - packages/database/prisma/migrations/20260824165414_add_watch_time_log/migration.sql
  - packages/api/modules/payments/procedures/list-purchases.ts
  - docs/verification/course-quiz-plugin/6.3-passed-final.png
  - packages/api/modules/course/errors.ts
  - apps/saas/app/invite/[token]/invite-redeem-panel.tsx
  - packages/payments/provider/stripe/gateway.ts
  - apps/saas/lib/invoice-settings.ts
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - packages/payments/factory.ts
  - apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - packages/course-quiz/index.ts
  - packages/payments/package.json
  - packages/auth/client.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/database/prisma/migrations/20260824195500_remove_redundant_course_instructor_course_id_index/migration.sql
  - packages/api/modules/course/procedures/list-email-delivery-log.ts
  - packages/database/prisma/migrations/20260825020000_add_lesson_private_message/migration.sql
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx
  - packages/platform/index.ts
  - packages/payments/provider/ecpay/invoice-provider.ts
  - packages/api/modules/review/router.ts
  - packages/course/index.ts
  - packages/database/drizzle/schema/mysql.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - packages/payments/memory-store.ts
  - apps/saas/package.json
  - packages/api/modules/course/procedures/refund-order.ts
  - packages/payments/checkout.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/marketing/Dockerfile
  - packages/database/prisma/migrations/20260824090022_add_course_invites/migration.sql
  - packages/database/prisma/migrations/20260825160000_course_lifecycle_email/migration.sql
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/modules/payments/components/InvoicePreferenceFields.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - docs/discuss/2026-08-27-product-delivery-master-roadmap.md
  - apps/saas/lib/payuni-credentials.ts
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - apps/saas/app/api/cron/course-expiration/route.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/course-quiz/quiz-session.ts
  - packages/api/modules/course/procedures/redeem-course-invite.ts
  - packages/api/modules/course/procedures/delete-media.ts
  - packages/api/modules/course/lib/taiwan-billing-month.ts
  - packages/payments/order.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - packages/payments/lib/invoice-issue-input.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - apps/saas/app/api/shopline/notify/route.ts
  - docs/verification/lesson-watch-time-tracking/13-e2e.md
  - packages/api/modules/assignment/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - packages/api/modules/organizations/router.ts
  - packages/course-review/review-summary.ts
  - packages/database/prisma/migrations/20260824132306_add_course_assignments/migration.sql
  - apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/verification/course-quiz-plugin/6.3-hidden-answers-final.png
  - packages/api/modules/course/procedures/submit-onboarding-survey.ts
  - apps/saas/app/image-proxy/[...path]/route.ts
  - packages/payments/lib/invoice-preference.ts
  - apps/saas/.env.example
  - apps/saas/app/api/course/studio/route.ts
  - packages/payments/provider/index.ts
  - patches/@paid-tw__einvoice-ezpay@0.5.0.patch
  - packages/mail/lib/course-lifecycle.ts
  - apps/saas/lib/admin-access.ts
  - packages/api/modules/course/lib/course-operator.ts
  - packages/course-quiz/quiz-definition.ts
  - packages/database/prisma/migrations/20260824094111_add_login_attempt_admin_log/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/page.tsx
  - packages/database/prisma/migrations/20260824103241_add_course_onboarding_survey/migration.sql
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - README.md
  - packages/auth/index.ts
  - apps/saas/app/api/cron/invoice-retry/route.ts
  - docs/verification/course-quiz-plugin/6.1-architecture-review.md
  - packages/course-assignment/index.ts
  - packages/mail/index.ts
  - apps/saas/app/(authenticated)/(operator)/audit-log/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx
  - packages/i18n/translations/fr/saas.json
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/api/modules/course/procedures/list-course-packs.ts
  - docs/verification/course-media-library/15-e2e.md
  - packages/permissions/create-permission-rules.ts
  - docs/verification/course-media-library/15-code-review.md
  - docs/verification/course-quiz-plugin/6.2-code-review.md
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/course-assignment/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/api/modules/course/lib/invoice-events.ts
  - packages/api/package.json
  - packages/course-assignment/vitest.config.ts
  - packages/course-review/package.json
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/quiz-taking.tsx
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx
  - packages/api/modules/assignment/assignment-draft.ts
  - packages/database/prisma/migrations/20260827120000_add_invoice_allowance_operation/migration.sql
  - packages/storage/provider/s3/index.ts
  - apps/saas/lib/orders.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - packages/api/modules/assignment/assignment-upload.ts
  - packages/api/modules/course/procedures/lesson-message-upload-cleanup.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/app/api/cron/assignment-upload-cleanup/route.ts
  - docs/buyer-extension-convention.md
  - packages/auth/auth.ts
  - packages/database/prisma/migrations/20260824080326_add_course_review_plugin/migration.sql
  - docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md
  - docs/dashboard/status.html
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260824200500_add_course_video_watermark_setting/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - packages/platform/src/admin-log.ts
  - packages/api/modules/course/lib/course-invite-auth.ts
  - packages/course-quiz/tsconfig.json
  - packages/database/prisma/migrations/20260824142000_add_quiz_attempt/migration.sql
  - apps/saas/app/(authenticated)/checkout/page.tsx
  - packages/api/modules/course/procedures/media-upload-url.ts
  - packages/course/src/course-pack/schema.ts
  - packages/course-assignment/assignment-definition.ts
  - packages/auth/lib/organization-role-hooks.ts
  - docs/design-canvas/anson-manual-redesign-direction.html
  - packages/database/scripts/backfill-lesson-media.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/settings/checkout-gateway/page.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/[id]/page.tsx
  - packages/database/prisma/migrations/20260825160000_enforce_one_organization_owner/migration.sql
  - docs/verification/course-quiz-plugin/6.3-passed.png
  - packages/api/modules/course/lib/course-access.ts
  - packages/api/modules/course/procedures/lesson-message-upload.ts
  - docs/verification/course-quiz-plugin/6.3-admin-form.png
  - packages/course/src/player/FluentPlayer.tsx
  - packages/i18n/translations/zh-tw/saas.json
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260824223000_add_assignment_submission_revision_unique/migration.sql
  - packages/course-assignment/sanitize-html.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - packages/database/prisma/migrations/20260825150000_enforce_organization_member_roles/migration.sql
  - packages/course-assignment/tsconfig.json
  - packages/course-quiz/vitest.config.ts
  - packages/permissions/definition.ts
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - packages/database/prisma/migrations/20260824105109_add_course_onboarding_survey_course_fk/migration.sql
  - packages/i18n/translations/en/saas.json
  - docs/dispatch-board.md
  - apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-comments-panel.tsx
  - docs/verification/lesson-private-message/14-code-review.md
tests:
  - packages/api/modules/course/procedures/invoice-operations.test.ts
  - packages/api/modules/course/procedures/record-watch-time.test.ts
  - packages/api/modules/course/lib/invoice-events.test.ts
  - packages/database/src/invoice/invoice-schema.test.ts
  - packages/payments/factory.test.ts
  - packages/payments/provider/invoice-query-errors.test.ts
  - packages/api/modules/course/lib/send-welcome-email.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/api/cron/invoice-retry/route.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/assignment/assignment-lifecycle.test.ts
  - apps/saas/app/api/payuni/return/route.test.ts
  - packages/payments/provider/ezpay/ezpay-adapter.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/redeem-course-invite.test.ts
  - apps/saas/app/api/stripe/webhook/route.test.ts
  - packages/auth/login-attempt.test.ts
  - packages/api/modules/course/procedures/refund-order.test.ts
  - packages/api/modules/course/lib/order-refunds.test.ts
  - packages/course-assignment/sanitize-html.test.ts
  - apps/saas/lib/invoice-settings.test.ts
  - packages/payments/checkout-gateway.test.ts
  - packages/api/modules/organizations/lib/membership.test.ts
  - packages/auth/lib/organization-roles.test.ts
  - packages/api/modules/course/procedures/assign-course-instructor.test.ts
  - packages/course-assignment/submission-rules.test.ts
  - packages/course-quiz/quiz-attempt.test.ts
  - packages/permissions/create-permission-rules.test.ts
  - packages/api/modules/course/procedures/submit-onboarding-survey.test.ts
  - packages/api/modules/review/router.test.ts
  - packages/api/modules/review/lesson-comment.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
  - packages/api/modules/assignment/assignment-upload.test.ts
  - packages/course-review/review-summary.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
  - packages/api/modules/course/lib/refund-invoice.test.ts
  - packages/api/modules/payments/procedures/list-purchases.test.ts
  - packages/api/modules/course/lib/invoice-settings.test.ts
  - packages/api/modules/course/procedures/create-course-invite.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/course-assignment/assignment-definition.test.ts
  - packages/payments/provider/payuni/gateway.test.ts
  - apps/saas/app/api/course/studio/route.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/api/modules/course/lib/webhook-events.test.ts
  - packages/auth/better-auth-hook-experiment.test.ts
  - packages/api/modules/course/lib/invoice-operations.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/api/cron/course-expiration/route.test.ts
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - apps/saas/app/api/checkout/status/route.test.ts
  - packages/database/prisma/queries/orders.test.ts
  - packages/payments/gateway-settings.test.ts
  - packages/payments/invoice-provider.test.ts
  - packages/api/modules/assignment/assignment-draft.test.ts
  - packages/api/modules/course/procedures/delete-media.test.ts
  - packages/course-quiz/quiz-definition.test.ts
  - packages/database/src/assignment/assignment-draft.test.ts
  - apps/saas/modules/organizations/lib/organization-role.test.ts
  - apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.test.tsx
  - packages/course/src/course-pack/schema.test.ts
  - packages/course/src/player/FluentPlayer.test.tsx
  - packages/auth/lib/organization-role-hooks.test.ts
  - packages/database/src/course-review/course-review.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - packages/course-quiz/quiz-grading.test.ts
  - packages/api/modules/organization/procedures/assign-instructor-role.test.ts
  - packages/platform/src/admin-log.test.ts
  - apps/saas/app/api/checkout/route.test.ts
  - packages/api/modules/course/procedures/register-media.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/course/src/player/watermark-overlay.test.tsx
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/course-quiz/quiz-session.test.ts
  - packages/auth/lib/organization-invitation-email.test.ts
  - packages/auth/lib/better-auth-organization-probe.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/api/payuni/notify/route.test.ts
  - packages/payments/lib/invoice-issue-input.test.ts
  - apps/saas/lib/orders-refund-dispatch.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - apps/saas/lib/checkout-gateway-settings.test.ts
  - packages/api/modules/course/lib/expiration-reminder-scan.test.ts
  - apps/saas/app/api/shopline/notify/route.test.ts
-->

---
### Requirement: Refund revokes kit eligibility

A refunded MVP order SHALL revoke kit claim eligibility and course access on the order record via kitClaimEligible false and courseAccess false. Course playback and GitHub collaborator revocation that depend on those flags MUST be implemented by later changes that read the same flags. While POST /api/github/claim is not implemented in this change, any future claim handler MUST treat refunded orders as ineligible.

#### Scenario: Refunded order loses kit eligibility flag

- **WHEN** the MVP order status is refunded
- **THEN** kitClaimEligible MUST be false and courseAccess MUST be false

##### Example: refunded 列可被後續 claim 讀取

- Order orderNo=SK-8800-002 status=refunded、kitClaimEligible=false、courseAccess=false
- 查詢該列時兩旗標皆為 false

#### Scenario: Refunded eligibility is durable for later claim handlers

- **WHEN** the MVP order status is refunded and a later change implements POST /api/github/claim
- **THEN** that handler MUST deny claims for the refunded order by reading kitClaimEligible

##### Example: 未來 claim 依旗標拒絕

- Order orderNo=SK-8800-002 kitClaimEligible=false
- 未來 POST /api/github/claim 讀到該旗標後 MUST 拒絕（預期 HTTP 403），不得呼叫 GitHub 邀請 API


<!-- @trace
source: extract-payuni-checkout
updated: 2026-08-15
code:
  - packages/ui/tsconfig.json
  - packages/database/tsconfig.json
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/payments/src/order.ts
  - apps/saas/app/checkout/result/page.tsx
  - docs/discuss/architecture-draft.md
  - packages/payments/src/refund.ts
  - apps/saas/.env.example
  - packages/auth/src/auth.ts
  - docs/discuss/2026-08-14-alignment.md
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/database/package.json
  - apps/saas/tsconfig.json
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - package.json
  - packages/i18n/package.json
  - tsconfig.json
  - apps/saas/app/globals.css
  - packages/auth/package.json
  - docs/discuss/README.md
  - packages/database/src/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/database/prisma/schema.prisma
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - packages/utils/package.json
  - apps/saas/app/layout.tsx
  - packages/payments/src/credentials.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/ui/package.json
  - apps/saas/next-env.d.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/not-found.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - README.md
  - docs/discuss/extract-map.md
  - apps/saas/app/api/payuni/return/route.ts
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - packages/i18n/tsconfig.json
  - pnpm-workspace.yaml
  - apps/saas/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/index.ts
  - packages/auth/src/index.ts
  - turbo.json
  - apps/saas/app/app/page.tsx
  - packages/utils/src/index.ts
  - packages/utils/tsconfig.json
  - packages/auth/src/providers.ts
  - packages/auth/tsconfig.json
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - AGENTS.md
  - apps/saas/app/login/page.tsx
  - apps/saas/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - packages/payments/package.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - packages/ui/src/index.tsx
  - vitest.config.ts
  - apps/saas/app/api/payuni/notify/route.ts
tests:
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Checkout requires an authenticated session

POST /api/checkout SHALL require a valid Better Auth session bound to a user. Unauthenticated requests MUST NOT create an Order.

#### Scenario: Unauthenticated checkout is rejected

- **WHEN** POST /api/checkout is called without a session
- **THEN** the response MUST be HTTP 401 and MUST NOT create an Order row

#### Scenario: Authenticated checkout creates a pending order

- **WHEN** a signed-in user calls POST /api/checkout with sku startkiter-mvp and PAYUNi keys are configured
- **THEN** the response MUST be HTTP 200 and an Order MUST exist with status pending, amount 8800, currency TWD, sku startkiter-mvp, and paymentGateway payuni


<!-- @trace
source: extract-payuni-checkout
updated: 2026-08-15
code:
  - packages/ui/tsconfig.json
  - packages/database/tsconfig.json
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/payments/src/order.ts
  - apps/saas/app/checkout/result/page.tsx
  - docs/discuss/architecture-draft.md
  - packages/payments/src/refund.ts
  - apps/saas/.env.example
  - packages/auth/src/auth.ts
  - docs/discuss/2026-08-14-alignment.md
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/database/package.json
  - apps/saas/tsconfig.json
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - package.json
  - packages/i18n/package.json
  - tsconfig.json
  - apps/saas/app/globals.css
  - packages/auth/package.json
  - docs/discuss/README.md
  - packages/database/src/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/database/prisma/schema.prisma
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - packages/utils/package.json
  - apps/saas/app/layout.tsx
  - packages/payments/src/credentials.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/ui/package.json
  - apps/saas/next-env.d.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/not-found.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - README.md
  - docs/discuss/extract-map.md
  - apps/saas/app/api/payuni/return/route.ts
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - packages/i18n/tsconfig.json
  - pnpm-workspace.yaml
  - apps/saas/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/index.ts
  - packages/auth/src/index.ts
  - turbo.json
  - apps/saas/app/app/page.tsx
  - packages/utils/src/index.ts
  - packages/utils/tsconfig.json
  - packages/auth/src/providers.ts
  - packages/auth/tsconfig.json
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - AGENTS.md
  - apps/saas/app/login/page.tsx
  - apps/saas/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - packages/payments/package.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - packages/ui/src/index.tsx
  - vitest.config.ts
  - apps/saas/app/api/payuni/notify/route.ts
tests:
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Refund clears entitlement flags on the order

When an MVP order status becomes refunded, the system SHALL set courseAccess to false and kitClaimEligible to false on that order. This change MUST NOT call the GitHub API. Enforcement of POST /api/github/claim HTTP 403 is deferred to the github-kit-fulfillment implementation that reads kitClaimEligible.

#### Scenario: Refund clears both flags

- **WHEN** a paid MVP order is marked refunded
- **THEN** the order status MUST be refunded and courseAccess MUST be false and kitClaimEligible MUST be false

##### Example: paid 訂單退款後雙旗標關閉

- Order orderNo=SK-8800-001 原為 paid、courseAccess=true、kitClaimEligible=true
- 執行退款標記後 status=refunded，且 courseAccess=false、kitClaimEligible=false

#### Scenario: Refund does not call GitHub in this change

- **WHEN** a paid MVP order is marked refunded
- **THEN** the refund path MUST NOT invoke the GitHub collaborator API

##### Example: 退款路徑無 GitHub HTTP

- 對 orderNo=SK-8800-001 執行退款標記，測試 spy 監看 GitHub API
- 退款完成且 spy 記錄為零次 collaborator add／remove 呼叫

<!-- @trace
source: extract-payuni-checkout
updated: 2026-08-15
code:
  - packages/ui/tsconfig.json
  - packages/database/tsconfig.json
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/payments/src/order.ts
  - apps/saas/app/checkout/result/page.tsx
  - docs/discuss/architecture-draft.md
  - packages/payments/src/refund.ts
  - apps/saas/.env.example
  - packages/auth/src/auth.ts
  - docs/discuss/2026-08-14-alignment.md
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/database/package.json
  - apps/saas/tsconfig.json
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - package.json
  - packages/i18n/package.json
  - tsconfig.json
  - apps/saas/app/globals.css
  - packages/auth/package.json
  - docs/discuss/README.md
  - packages/database/src/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/database/prisma/schema.prisma
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - packages/utils/package.json
  - apps/saas/app/layout.tsx
  - packages/payments/src/credentials.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/ui/package.json
  - apps/saas/next-env.d.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/not-found.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - README.md
  - docs/discuss/extract-map.md
  - apps/saas/app/api/payuni/return/route.ts
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - packages/i18n/tsconfig.json
  - pnpm-workspace.yaml
  - apps/saas/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/index.ts
  - packages/auth/src/index.ts
  - turbo.json
  - apps/saas/app/app/page.tsx
  - packages/utils/src/index.ts
  - packages/utils/tsconfig.json
  - packages/auth/src/providers.ts
  - packages/auth/tsconfig.json
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - AGENTS.md
  - apps/saas/app/login/page.tsx
  - apps/saas/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - packages/payments/package.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - packages/ui/src/index.tsx
  - vitest.config.ts
  - apps/saas/app/api/payuni/notify/route.ts
tests:
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Checkout callback URLs use the public HTTPS base
PAYUNi ReturnURL and NotifyURL SHALL be built from BETTER_AUTH_URL when set, so TEST deployments on the custom domain receive browser return and server notify on the same public origin.

#### Scenario: Base URL prefers BETTER_AUTH_URL
- **WHEN** checkout creates a PAYUNi session and BETTER_AUTH_URL is https://startkiter.aiver.me
- **THEN** ReturnURL and NotifyURL MUST start with https://startkiter.aiver.me/api/payuni/

<!-- @trace
source: mvp-dogfood-remaining
updated: 2026-08-15
code:
  - apps/saas/app/globals.css
  - apps/saas/app/course/kit-claim-panel.tsx
  - packages/course/src/catalog.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/.env.example
  - apps/saas/lib/support-email.ts
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/components/site-footer.tsx
  - apps/saas/lib/public-base-url.ts
  - docs/deploy-and-public-url.md
  - apps/saas/app/layout.tsx
  - vitest.config.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/app/api/checkout/route.ts
tests:
  - apps/saas/lib/support-email.test.ts
  - apps/saas/lib/public-base-url.test.ts
  - packages/course/src/catalog.test.ts
-->

---
### Requirement: Checkout credentials prefer admin settings then env
POST /api/checkout MUST resolve PAYUNi credentials by reading encrypted admin settings first and falling back to PAYUNI_MERCHANT_ID, PAYUNI_HASH_KEY, PAYUNI_HASH_IV, and PAYUNI_API_URL when settings are empty, missing, or undecryptable. Invalid decrypt MUST NOT cause HTTP 500. If both sources lack merchantId, hashKey, or hashIV, the response MUST remain HTTP 503 with an explicit configuration error.

#### Scenario: Settings override env
- **WHEN** admin settings store merchantId FROM_SETTINGS and env PAYUNI_MERCHANT_ID is FROM_ENV and remaining keys are valid
- **THEN** the PAYUNi session MUST use merchantId FROM_SETTINGS

##### Example: settings win
- **GIVEN** settings merchantId=FROM_SETTINGS and env PAYUNI_MERCHANT_ID=FROM_ENV with valid hashKey and hashIV in settings
- **WHEN** a signed-in buyer calls POST /api/checkout
- **THEN** EncryptInfo construction MUST use FROM_SETTINGS not FROM_ENV

#### Scenario: Env used when settings empty
- **WHEN** no payuni settings row exists and env has a complete valid key set
- **THEN** POST /api/checkout MUST return HTTP 200 and MUST NOT return HTTP 503

#### Scenario: Corrupt ciphertext falls back
- **WHEN** the payuni settings ciphertext cannot be decrypted and env has a complete valid key set
- **THEN** POST /api/checkout MUST return HTTP 200 using env and MUST NOT return HTTP 500

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