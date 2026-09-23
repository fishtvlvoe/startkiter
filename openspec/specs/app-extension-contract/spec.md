# app-extension-contract Specification

## Purpose

StartKiter SHALL provide a typed, CI-enforced registration contract for adding a new App to the platform, and SHALL keep developer-only vocabulary out of learner-facing surfaces.

## Requirements

### Requirement: A new App registers through a typed manifest validated at CI time

Every new App MUST submit an `AppRegistrationManifest` containing a unique `appId`, a `displayName`, a `route.basePath`, menu metadata with light and dark icon identifiers, eligibility rules, an i18n namespace, supported locales, and test references. CI MUST validate the manifest before the App enters the App registry; the system SHALL NOT accept a partially registered App.

#### Scenario: valid registration is accepted

- **WHEN** an App manifest declares a unique `appId`, a non-reserved `displayName`, a non-conflicting `route.basePath`, both icon variants, and all three supported locale keys
- **THEN** CI accepts the manifest and the App registry includes it

#### Scenario: missing required field is rejected

- **WHEN** an App manifest is missing `displayName`, `route.basePath`, `icon.light`, `icon.dark`, or any of the three supported locale keys
- **THEN** CI fails and lists each missing field

##### Example: rejected registrations

| Missing field | Expected CI result |
| --- | --- |
| `icon.dark` | reject, list `icon.dark` |
| `route.basePath` | reject, list `route.basePath` |
| `supportedLocales` missing `en` | reject, list `en` |

#### Scenario: duplicate appId or route is rejected

- **WHEN** a new manifest declares an `appId` or `route.basePath` already used by a registered App
- **THEN** CI fails and reports the conflicting App id


<!-- @trace
source: app-extension-contract
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/package.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - packages/i18n/translations/en/saas.json
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/database/prisma/queries/users.ts
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/workspace/registry.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/public/icons/account/credit-card.dark.svg
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - docs/verification/launch-evidence-report.mjs
  - package.json
  - packages/platform/index.ts
  - apps/saas/public/icons/nav/home.light.svg
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - packages/i18n/translations/es/saas.json
  - .agents/skills/startkiter-dev/SKILL.md
  - packages/platform/src/app-registration.ts
  - apps/saas/public/icons/nav/mail.dark.svg
  - packages/mail/provider/resend.ts
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/api/modules/quiz/quiz-results.ts
  - packages/mail/types.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/i18n/translations/de/saas.json
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - packages/platform/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/credit-card.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/public/icons/account/settings.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/newsletter/index.ts
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/tailwind/theme.css
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - packages/i18n/translations/zh-tw/saas.json
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - packages/newsletter/package.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/app/globals.css
  - packages/api/modules/course/router.ts
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
tests:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
-->

---
### Requirement: displayName is owned by the App's own admin and blocks reserved words

`displayName` MUST be settable only by a user with `app-admin` role for that specific App. `displayName` MUST be 1 to 20 characters, non-blank, and MUST NOT equal a reserved workspace noun ("總管理員" or "使用者"). Updating `displayName` MUST NOT require a redeploy for the new value to appear in resolved navigation labels.

#### Scenario: app-admin updates displayName

- **GIVEN** an app-admin for App `design`
- **WHEN** they set `displayName` to "圖片設計"
- **THEN** the change is accepted and the next navigation resolve for that App shows workspace label "圖片設計管理員"

#### Scenario: non-admin cannot set displayName

- **WHEN** a user with only `app-user` role for an App attempts to set `displayName`
- **THEN** the request is rejected by the existing permission layer

#### Scenario: reserved word is rejected

- **WHEN** a `displayName` update submits the value "總管理員" or "使用者"
- **THEN** validation rejects the update and the previous `displayName` remains in effect

##### Example: reserved word rejection

| Submitted value | Expected result |
| --- | --- |
| `"總管理員"` | reject |
| `"使用者"` | reject |
| `""` | reject (blank) |
| `"圖片設計"` | accept |


<!-- @trace
source: app-extension-contract
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/package.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - packages/i18n/translations/en/saas.json
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/database/prisma/queries/users.ts
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/workspace/registry.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/public/icons/account/credit-card.dark.svg
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - docs/verification/launch-evidence-report.mjs
  - package.json
  - packages/platform/index.ts
  - apps/saas/public/icons/nav/home.light.svg
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - packages/i18n/translations/es/saas.json
  - .agents/skills/startkiter-dev/SKILL.md
  - packages/platform/src/app-registration.ts
  - apps/saas/public/icons/nav/mail.dark.svg
  - packages/mail/provider/resend.ts
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/api/modules/quiz/quiz-results.ts
  - packages/mail/types.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/i18n/translations/de/saas.json
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - packages/platform/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/credit-card.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/public/icons/account/settings.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/newsletter/index.ts
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/tailwind/theme.css
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - packages/i18n/translations/zh-tw/saas.json
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - packages/newsletter/package.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/app/globals.css
  - packages/api/modules/course/router.ts
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
tests:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
-->

---
### Requirement: The startkiter-dev Skill guides new App registration from the repository

The repository SHALL extend the existing `.agents/skills/startkiter-dev/SKILL.md` with an App-registration section that directs the developer or AI to check for a reusable existing App, fill the typed `AppRegistrationManifest`, provide both icon variants, cover all three supported locales, and attach unit and browser test references before implementation. The project SHALL NOT add a second Skill duplicating this flow.

#### Scenario: new App workflow starts with the manifest contract

- **WHEN** a developer asks the supported development workflow to add a new App
- **THEN** the startkiter-dev Skill directs the workflow to check reusable Apps, complete the registration manifest fields, and identify unit and browser checks before implementation

##### Example: new App checklist

- **GIVEN** `packages/` has no reusable App for `design`
- **WHEN** the developer follows the `新增 App` section of `startkiter-dev`
- **THEN** the workflow opens the canonical spec, requires `light` and `dark` icons, requires `zh-tw`, `zh-cn`, and `en`, and records both `tests.unit` and `tests.browser`

#### Scenario: unsupported Skill discovery does not weaken enforcement

- **WHEN** an AI tool does not automatically discover repo-local Skills
- **THEN** the CI-enforced manifest validation still blocks an incomplete App registration regardless of whether the Skill was read

##### Example: CI blocks unread Skill

- **GIVEN** an AI submits a `design` manifest without `displayName` and does not read `.agents/skills/startkiter-dev/SKILL.md`
- **WHEN** `pnpm --filter @startkiter/platform validate:app-registry` runs in CI
- **THEN** validation fails and lists `displayName` as missing


<!-- @trace
source: app-extension-contract
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/package.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - packages/i18n/translations/en/saas.json
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/database/prisma/queries/users.ts
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/workspace/registry.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/public/icons/account/credit-card.dark.svg
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - docs/verification/launch-evidence-report.mjs
  - package.json
  - packages/platform/index.ts
  - apps/saas/public/icons/nav/home.light.svg
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - packages/i18n/translations/es/saas.json
  - .agents/skills/startkiter-dev/SKILL.md
  - packages/platform/src/app-registration.ts
  - apps/saas/public/icons/nav/mail.dark.svg
  - packages/mail/provider/resend.ts
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/api/modules/quiz/quiz-results.ts
  - packages/mail/types.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/i18n/translations/de/saas.json
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - packages/platform/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/credit-card.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/public/icons/account/settings.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/newsletter/index.ts
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/tailwind/theme.css
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - packages/i18n/translations/zh-tw/saas.json
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - packages/newsletter/package.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/app/globals.css
  - packages/api/modules/course/router.ts
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
tests:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
-->

---
### Requirement: Developer-only vocabulary is excluded from learner-facing text

Terms `manifest`, `resolver`, `registry`, and `workspace context` MUST NOT appear in user-visible UI copy, `docs/tutorials/`, or marketing/help documentation. These terms SHALL be allowed in `.agents/skills/`, `openspec/`, source code, and code comments.

#### Scenario: forbidden developer term in UI copy is rejected

- **WHEN** a static check scans user-visible UI copy and `docs/tutorials/` for `manifest`, `resolver`, `registry`, or `workspace context`
- **THEN** the check fails and lists the offending file and term

#### Scenario: developer vocabulary in code comments is allowed

- **WHEN** the same scan encounters `manifest` inside a TypeScript code comment or `.agents/skills/startkiter-dev/SKILL.md`
- **THEN** the scan does not flag it

##### Example: scan scope

| Location | Scan result |
| --- | --- |
| `apps/saas/modules/**` UI copy | flagged if term found |
| `docs/tutorials/**` | flagged if term found |
| `.agents/skills/startkiter-dev/SKILL.md` | not scanned |
| `packages/platform/src/app-registry/*.ts` comments | not scanned |

<!-- @trace
source: app-extension-contract
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/package.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - packages/i18n/translations/en/saas.json
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/database/prisma/queries/users.ts
  - packages/api/modules/quiz/router.ts
  - packages/platform/src/workspace/registry.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/public/icons/account/credit-card.dark.svg
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - docs/verification/launch-evidence-report.mjs
  - package.json
  - packages/platform/index.ts
  - apps/saas/public/icons/nav/home.light.svg
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - packages/i18n/translations/es/saas.json
  - .agents/skills/startkiter-dev/SKILL.md
  - packages/platform/src/app-registration.ts
  - apps/saas/public/icons/nav/mail.dark.svg
  - packages/mail/provider/resend.ts
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/api/modules/quiz/quiz-results.ts
  - packages/mail/types.ts
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/i18n/translations/de/saas.json
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - packages/platform/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/credit-card.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/public/icons/account/settings.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/newsletter/index.ts
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/tailwind/theme.css
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - packages/i18n/translations/zh-tw/saas.json
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - packages/newsletter/package.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/app/globals.css
  - packages/api/modules/course/router.ts
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
tests:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
-->