# subscription-billing Specification

## Purpose

TBD - created by archiving change 'payuni-recurring-billing'. Update Purpose after archive.

## Requirements

### Requirement: Subscription plans are course-scoped, not hardcoded to a single course

The system SHALL model a `CourseSubscriptionPlan` as a generic record referencing any `Course` by `courseId`. The system MUST NOT hardcode a specific course identifier in gateway, checkout, or webhook code paths. The system SHALL allow zero, one, or multiple subscription plans to exist for any given course without requiring code changes.

#### Scenario: A second course can get a subscription plan without code changes

- **WHEN** an operator creates a new `CourseSubscriptionPlan` row referencing a course other than the MVP course
- **THEN** the checkout, gateway, and webhook code paths MUST process it identically to the MVP course's plan, using only the plan's `courseId` field


<!-- @trace
source: payuni-recurring-billing
updated: 2026-08-23
code:
  - packages/database/prisma/schema.prisma
  - packages/payments/subscription-factory.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/crypto.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/database/prisma/index.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/subscription-gateway.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260823170000_add_payuni_recurring_billing/migration.sql
  - apps/saas/modules/payments/components/SubscriptionCancellationList.tsx
tests:
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/database/src/subscriptions/subscription-schema.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
-->

---
### Requirement: Buyers can subscribe to a course via PAYUNi recurring billing

The system SHALL allow a signed-in buyer to start a monthly or yearly subscription for a course that has an enabled `CourseSubscriptionPlan`, using PAYUNi's background transaction (period) API. The subscription SHALL be created under a separate SKU from the course's one-time purchase SKU. The system MUST NOT modify the pricing rule of an existing one-time-purchase SKU to add a second tier.

#### Scenario: Signed-in buyer starts a monthly subscription

- **WHEN** a signed-in buyer submits a subscription checkout request for an enabled `CourseSubscriptionPlan` with interval MONTH
- **THEN** the server MUST create a `CourseSubscription` row with status PENDING and MUST return a PAYUNi form-post payload for the buyer to complete first-period authorization

#### Scenario: Unauthenticated user cannot start a subscription

- **WHEN** a request without a valid session submits a subscription checkout request
- **THEN** the server MUST reject the request with HTTP 401 and MUST NOT create any `CourseSubscription` row

#### Scenario: Duplicate active subscription for the same course is rejected

- **WHEN** a signed-in buyer who already has a `CourseSubscription` in status PENDING or ACTIVE for a course submits another subscription checkout request for the same course
- **THEN** the server MUST reject the request with HTTP 409 and MUST NOT create a second `CourseSubscription` row for that user and course


<!-- @trace
source: payuni-recurring-billing
updated: 2026-08-23
code:
  - packages/database/prisma/schema.prisma
  - packages/payments/subscription-factory.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/crypto.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/database/prisma/index.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/subscription-gateway.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260823170000_add_payuni_recurring_billing/migration.sql
  - apps/saas/modules/payments/components/SubscriptionCancellationList.tsx
tests:
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/database/src/subscriptions/subscription-schema.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
-->

---
### Requirement: Subscription gateway calls are made through a provider-agnostic interface

The system SHALL define a `SubscriptionGateway` interface with `createSubscriptionSession`, `cancelSubscription`, and `queryPeriod` methods. All checkout, webhook, and cancellation code paths MUST call these methods through the `SubscriptionGateway` type, not through a concrete gateway class. `PayUniPeriodGateway` SHALL be the first implementation of this interface.

#### Scenario: Checkout code depends on the interface, not the concrete class

- **WHEN** the subscription checkout handler calls `createSubscriptionSession`
- **THEN** the call site MUST reference the `SubscriptionGateway` type, and adding a second gateway implementation MUST NOT require changes to the checkout handler's call site


<!-- @trace
source: payuni-recurring-billing
updated: 2026-08-23
code:
  - packages/database/prisma/schema.prisma
  - packages/payments/subscription-factory.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/crypto.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/database/prisma/index.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/subscription-gateway.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260823170000_add_payuni_recurring_billing/migration.sql
  - apps/saas/modules/payments/components/SubscriptionCancellationList.tsx
tests:
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/database/src/subscriptions/subscription-schema.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
-->

---
### Requirement: Webhook events are deduplicated via a claim-based inbox before processing

The system SHALL persist every incoming PAYUNi period-notify webhook event into a `PaymentWebhookEvent` record before executing any subscription state change, keyed by a unique `(gateway, eventId)` pair. A duplicate delivery of the same event MUST NOT be processed twice.

#### Scenario: Duplicate webhook delivery is ignored

- **WHEN** PAYUNi sends the same period-notify event twice (identical `(gateway, eventId)`)
- **THEN** the second delivery MUST return HTTP 200 with no further state change, and the system MUST NOT double-count the payment toward `paidPeriods`

#### Scenario: Signature verification failure is rejected before any state change

- **WHEN** a period-notify request has an invalid `HashInfo` signature
- **THEN** the server MUST return HTTP 400 and MUST NOT write to `CourseSubscription` or `PaymentWebhookEvent`


<!-- @trace
source: payuni-recurring-billing
updated: 2026-08-23
code:
  - packages/database/prisma/schema.prisma
  - packages/payments/subscription-factory.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/crypto.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/database/prisma/index.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/subscription-gateway.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260823170000_add_payuni_recurring_billing/migration.sql
  - apps/saas/modules/payments/components/SubscriptionCancellationList.tsx
tests:
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/database/src/subscriptions/subscription-schema.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
-->

---
### Requirement: Successful period payment activates the subscription and grants course access

The system SHALL transition a `CourseSubscription` from PENDING to ACTIVE upon the first successful period-notify event, and SHALL increment `paidPeriods` and advance `currentPeriodEnd` (never regressing an existing later value) on every subsequent successful period-notify event.

#### Scenario: First period payment activates the subscription

- **WHEN** the first period-notify event for a PENDING subscription reports a successful authorization
- **THEN** the subscription's status MUST become ACTIVE, `paidPeriods` MUST become 1, and `gatewaySubscriptionId` MUST be recorded from the PAYUNi PeriodTradeNo

##### Example: currentPeriodEnd never regresses on a late-arriving webhook

| Existing currentPeriodEnd | Incoming period end from webhook | Resulting currentPeriodEnd | Notes |
| --- | --- | --- | --- |
| 2026-09-23 | 2026-10-23 | 2026-10-23 | normal in-order update |
| 2026-10-23 | 2026-09-23 | 2026-10-23 | late/out-of-order webhook MUST NOT regress the date |


<!-- @trace
source: payuni-recurring-billing
updated: 2026-08-23
code:
  - packages/database/prisma/schema.prisma
  - packages/payments/subscription-factory.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/crypto.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/database/prisma/index.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/subscription-gateway.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260823170000_add_payuni_recurring_billing/migration.sql
  - apps/saas/modules/payments/components/SubscriptionCancellationList.tsx
tests:
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/database/src/subscriptions/subscription-schema.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
-->

---
### Requirement: Canceling a subscription revokes course access immediately

The system SHALL allow a signed-in buyer who owns an ACTIVE or PENDING `CourseSubscription` to cancel it. Upon successful cancellation via the PAYUNi gateway, the system SHALL set the subscription's status to CANCELED immediately, with no grace period through the end of the current billing period. `canAccessCourseId` MUST stop granting access via that subscription record on the next evaluation after cancellation completes.

#### Scenario: Canceled subscription immediately loses course access

- **WHEN** a buyer's ACTIVE subscription is successfully canceled via the PAYUNi gateway
- **THEN** the subscription's status MUST become CANCELED, and a subsequent `canAccessCourseId` check for that user and course MUST return false unless another access source (one-time Order or bundle) grants it

#### Scenario: Gateway cancellation failure leaves the subscription unchanged

- **WHEN** the PAYUNi mdfStatus cancellation call fails
- **THEN** the subscription's status MUST remain unchanged and the system MUST surface the failure to the caller without silently marking the subscription as canceled

##### Example: PAYUNi rejects the termination request

- GIVEN userId=user_subscriber owns subscriptionId=sub-001 with status=ACTIVE and gatewaySubscriptionId=period-001
- WHEN PAYUNi mdfStatus returns Status=FAILED and Message="declined"
- THEN the API returns a cancellation error, subscriptionId=sub-001 remains status=ACTIVE, and the buyer retains the subscription-based course access


<!-- @trace
source: payuni-recurring-billing
updated: 2026-08-23
code:
  - packages/database/prisma/schema.prisma
  - packages/payments/subscription-factory.ts
  - packages/payments/index.ts
  - packages/api/modules/course/lib/course-access.ts
  - packages/payments/provider/payuni/crypto.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/checkout/payuni-subscription/page.tsx
  - packages/database/prisma/index.ts
  - packages/payments/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - packages/api/modules/course/procedures/create-subscription-checkout.ts
  - packages/api/modules/course/lib/subscription-gateway.ts
  - apps/saas/modules/payments/components/SubscriptionCheckoutForm.tsx
  - packages/api/modules/course/router.ts
  - packages/course/access.ts
  - packages/api/modules/course/lib/webhook-events.ts
  - packages/api/modules/course/procedures/cancel-course-subscription.ts
  - packages/payments/provider/payuni/period-gateway.ts
  - apps/saas/app/api/payuni/period-notify/route.ts
  - packages/database/prisma/migrations/20260823170000_add_payuni_recurring_billing/migration.sql
  - apps/saas/modules/payments/components/SubscriptionCancellationList.tsx
tests:
  - packages/api/modules/course/lib/webhook-events.test.ts
  - apps/saas/app/api/payuni/period-notify/route.test.ts
  - packages/api/modules/course/course.test.ts
  - packages/payments/provider/payuni/period-gateway.test.ts
  - packages/database/src/subscriptions/subscription-schema.test.ts
  - packages/course/access.test.ts
  - packages/api/modules/course/procedures/subscription-procedures.test.ts
-->

---
### Requirement: Subscription records reserve invoice fields without implementing invoicing

The system SHALL include invoice-related fields (`invoiceType`, `invoiceCarrierType`, `invoiceCarrierId`, `invoiceTaxId`, `invoiceTitle`, `invoiceAddress`, `invoiceLoveCode`) on `CourseSubscription`. When electronic invoicing is disabled, checkout is permitted to populate these fields, but doing so MUST NOT trigger any invoicing API call. When electronic invoicing is enabled with auto-issue on, a successful subscription period payment SHALL use these fields to issue an invoice for that period.

#### Scenario: Invoice fields remain unused while electronic invoicing is disabled

- **WHEN** electronic invoicing is disabled and a subscription is created, activated, renewed, or canceled
- **THEN** no invoicing API call MUST occur, regardless of whether invoice-related fields are populated

#### Scenario: Enabled invoicing issues an invoice per successful period payment

- **WHEN** electronic invoicing is enabled with auto-issue on and a subscription period payment succeeds
- **THEN** the system MUST create an `Invoice` row referencing that subscription and period number, using the subscription's invoice-preference fields as issuance input

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