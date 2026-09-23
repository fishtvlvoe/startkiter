# account-settings-theme-language Specification

## Purpose

StartKiter SHALL provide a single account menu contract that exposes role-scoped settings entries, moves theme and locale controls out of the primary navigation, and pairs every icon with light and dark SVG variants using semantic color tokens.

## Requirements

### Requirement: Account menu settings entries are derived from WorkspaceContext

The account menu MUST always show a "使用者設定" entry regardless of `WorkspaceContext`. It MUST show a "{displayName}管理員設定" entry only when the current `WorkspaceContext` is `{ scope: "app", role: "app-admin" }`, using that App's `displayName`. It MUST show a "總管理員設定" entry only when the current `WorkspaceContext` is `{ scope: "platform" }`. Visibility MUST be derived from the same `WorkspaceContext` produced by the navigation resolver, not a separately computed permission check.

#### Scenario: app-user sees only user settings

- **WHEN** a user with `{ scope: "app", role: "app-user" }` opens the account menu
- **THEN** the menu shows "使用者設定" and does not show any admin settings entry

#### Scenario: app-admin sees an App-named settings entry

- **GIVEN** App `course` has `displayName` "課程"
- **WHEN** a user with `{ scope: "app", appId: "course", role: "app-admin" }` opens the account menu
- **THEN** the menu shows "使用者設定" and "課程管理員設定", and does not show "總管理員設定"

#### Scenario: super-admin sees platform settings

- **WHEN** a user with `{ scope: "platform" }` opens the account menu
- **THEN** the menu shows "使用者設定" and "總管理員設定"

##### Example: entry visibility matrix

| WorkspaceContext | 使用者設定 | {App}管理員設定 | 總管理員設定 |
| --- | :---: | :---: | :---: |
| app / app-user | shown | hidden | hidden |
| app / app-admin | shown | shown | hidden |
| platform | shown | hidden | shown |


<!-- @trace
source: account-settings-theme-language
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - packages/newsletter/package.json
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/file-text.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/shield-user.light.svg
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/nav/image.light.svg
  - packages/i18n/translations/zh-cn/saas.json
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - package.json
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/user-cog.light.svg
  - docs/verification/launch-evidence-report.mjs
  - packages/newsletter/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/mail/provider/nodemailer.ts
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - packages/i18n/translations/de/saas.json
  - apps/saas/public/icons/account/shield-user.dark.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/course/lib/course-instructor-access.ts
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/package.light.svg
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/public/icons/nav/message-square.dark.svg
  - packages/i18n/translations/es/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/home.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/database/prisma/queries/users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/i18n/translations/en/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/platform/src/workspace/registry.ts
  - tooling/tailwind/theme.css
  - packages/i18n/translations/zh-tw/saas.json
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/database/prisma/zod/index.ts
  - AGENTS.md
  - apps/saas/public/icons/account/settings.dark.svg
  - tooling/scripts/package.json
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - packages/mail/types.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/home.light.svg
  - packages/i18n/translations/fr/saas.json
  - packages/platform/package.json
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/platform/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/api/modules/course/router.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/api/modules/quiz/router.ts
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/settings.light.svg
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/modules/admin/component/users/UserList.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/public/icons/nav/book-open.dark.svg
tests:
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/platform/src/workspace/navigation.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->

---
### Requirement: Theme and locale controls live only inside user settings

Color mode (dark/light/system) and locale controls MUST render only within the "使用者設定" page. They SHALL NOT render in the first-level navigation or as a top-level account menu item.

#### Scenario: first-level navigation has no theme or locale control

- **WHEN** the shell renders the first-level navigation for any workspace
- **THEN** no color-mode toggle or locale switcher is present in that navigation surface

#### Scenario: user settings page exposes both controls

- **WHEN** a user opens "使用者設定"
- **THEN** the page renders a color-mode toggle and a locale switcher, and changes take effect immediately


<!-- @trace
source: account-settings-theme-language
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - packages/newsletter/package.json
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/file-text.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/shield-user.light.svg
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/nav/image.light.svg
  - packages/i18n/translations/zh-cn/saas.json
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - package.json
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/user-cog.light.svg
  - docs/verification/launch-evidence-report.mjs
  - packages/newsletter/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/mail/provider/nodemailer.ts
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - packages/i18n/translations/de/saas.json
  - apps/saas/public/icons/account/shield-user.dark.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/course/lib/course-instructor-access.ts
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/package.light.svg
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/public/icons/nav/message-square.dark.svg
  - packages/i18n/translations/es/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/home.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/database/prisma/queries/users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/i18n/translations/en/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/platform/src/workspace/registry.ts
  - tooling/tailwind/theme.css
  - packages/i18n/translations/zh-tw/saas.json
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/database/prisma/zod/index.ts
  - AGENTS.md
  - apps/saas/public/icons/account/settings.dark.svg
  - tooling/scripts/package.json
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - packages/mail/types.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/home.light.svg
  - packages/i18n/translations/fr/saas.json
  - packages/platform/package.json
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/platform/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/api/modules/course/router.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/api/modules/quiz/router.ts
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/settings.light.svg
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/modules/admin/component/users/UserList.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/public/icons/nav/book-open.dark.svg
tests:
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/platform/src/workspace/navigation.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->

---
### Requirement: Icons ship as paired light and dark SVG assets

Every menu or account-area icon MUST provide both a `light` and a `dark` SVG asset. The shell MUST select the asset matching the resolved color mode. The system SHALL NOT derive a dark-mode icon from a single asset via CSS filter inversion.

#### Scenario: dark mode selects the dark icon asset

- **WHEN** the resolved color mode is dark
- **THEN** every rendered menu and account icon loads its `dark` SVG variant

#### Scenario: missing icon variant fails the build

- **WHEN** an icon registration provides only `light` or only `dark`
- **THEN** the icon asset check fails and lists the icon id and the missing variant

##### Example: icon asset check

| Icon id | light | dark | Result |
| --- | :---: | :---: | --- |
| `nav.course` | ✓ | ✓ | pass |
| `nav.settings` | ✓ | — | fail: missing `dark` |


<!-- @trace
source: account-settings-theme-language
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - packages/newsletter/package.json
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/file-text.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/shield-user.light.svg
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/nav/image.light.svg
  - packages/i18n/translations/zh-cn/saas.json
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - package.json
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/user-cog.light.svg
  - docs/verification/launch-evidence-report.mjs
  - packages/newsletter/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/mail/provider/nodemailer.ts
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - packages/i18n/translations/de/saas.json
  - apps/saas/public/icons/account/shield-user.dark.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/course/lib/course-instructor-access.ts
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/package.light.svg
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/public/icons/nav/message-square.dark.svg
  - packages/i18n/translations/es/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/home.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/database/prisma/queries/users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/i18n/translations/en/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/platform/src/workspace/registry.ts
  - tooling/tailwind/theme.css
  - packages/i18n/translations/zh-tw/saas.json
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/database/prisma/zod/index.ts
  - AGENTS.md
  - apps/saas/public/icons/account/settings.dark.svg
  - tooling/scripts/package.json
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - packages/mail/types.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/home.light.svg
  - packages/i18n/translations/fr/saas.json
  - packages/platform/package.json
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/platform/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/api/modules/course/router.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/api/modules/quiz/router.ts
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/settings.light.svg
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/modules/admin/component/users/UserList.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/public/icons/nav/book-open.dark.svg
tests:
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/platform/src/workspace/navigation.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->

---
### Requirement: Shared navigation and account components use semantic color tokens

Shared navigation and account menu components MUST use semantic tokens (`background`, `foreground`, `muted-foreground`, `border`, `accent`) for all text and surface colors. They SHALL NOT declare a hardcoded dark-mode-only text color class.

#### Scenario: hardcoded dark text class is rejected

- **WHEN** a static check scans shared navigation and account components for a hardcoded dark-mode-only text color class
- **THEN** the check fails and lists the file and line

#### Scenario: color mode switch preserves readable text

- **WHEN** a user switches among dark, light, and system color modes
- **THEN** the account menu and navigation foreground, background, and border colors resolve from the active semantic token set and remain readable


<!-- @trace
source: account-settings-theme-language
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - packages/newsletter/package.json
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/file-text.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/shield-user.light.svg
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/nav/image.light.svg
  - packages/i18n/translations/zh-cn/saas.json
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - package.json
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/user-cog.light.svg
  - docs/verification/launch-evidence-report.mjs
  - packages/newsletter/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/mail/provider/nodemailer.ts
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - packages/i18n/translations/de/saas.json
  - apps/saas/public/icons/account/shield-user.dark.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/course/lib/course-instructor-access.ts
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/package.light.svg
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/public/icons/nav/message-square.dark.svg
  - packages/i18n/translations/es/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/home.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/database/prisma/queries/users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/i18n/translations/en/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/platform/src/workspace/registry.ts
  - tooling/tailwind/theme.css
  - packages/i18n/translations/zh-tw/saas.json
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/database/prisma/zod/index.ts
  - AGENTS.md
  - apps/saas/public/icons/account/settings.dark.svg
  - tooling/scripts/package.json
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - packages/mail/types.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/home.light.svg
  - packages/i18n/translations/fr/saas.json
  - packages/platform/package.json
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/platform/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/api/modules/course/router.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/api/modules/quiz/router.ts
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/settings.light.svg
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/modules/admin/component/users/UserList.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/public/icons/nav/book-open.dark.svg
tests:
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/platform/src/workspace/navigation.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->

---
### Requirement: Account menu and settings entries stay usable at desktop and mobile widths

The account menu and its settings entries MUST render without horizontal overflow at desktop width `1440px` and mobile width `390px`, and content MUST NOT be hidden behind the account menu when open.

#### Scenario: desktop account menu fits the viewport

- **WHEN** the account menu opens at a `1440px` viewport
- **THEN** the menu and its entries fit without horizontal overflow

#### Scenario: mobile account menu fits the viewport

- **WHEN** the account menu opens at a `390px` viewport
- **THEN** the menu remains usable, does not cover the page's primary content permanently, and the document has no horizontal overflow

#### Scenario: locale switch updates the account menu labels

- **WHEN** an authenticated user switches between `zh-tw`, `zh-cn`, and `en`
- **THEN** the account menu entry labels use the selected locale without leaving any entry in a previous locale

<!-- @trace
source: account-settings-theme-language
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - packages/newsletter/package.json
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/public/icons/nav/file-text.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - packages/mail/lib/send.ts
  - apps/saas/public/icons/nav/shield-user.light.svg
  - apps/saas/modules/shared/lib/account-menu.ts
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/nav/image.light.svg
  - packages/i18n/translations/zh-cn/saas.json
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - package.json
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/nav/user-cog.light.svg
  - docs/verification/launch-evidence-report.mjs
  - packages/newsletter/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/mail/provider/nodemailer.ts
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - packages/i18n/translations/de/saas.json
  - apps/saas/public/icons/account/shield-user.dark.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/course/lib/course-instructor-access.ts
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/nav/package.light.svg
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/public/icons/nav/message-square.dark.svg
  - packages/i18n/translations/es/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/home.dark.svg
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/database/prisma/queries/users.ts
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - packages/i18n/translations/en/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - packages/newsletter/lib/send-engine.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - packages/platform/src/workspace/registry.ts
  - tooling/tailwind/theme.css
  - packages/i18n/translations/zh-tw/saas.json
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/database/prisma/zod/index.ts
  - AGENTS.md
  - apps/saas/public/icons/account/settings.dark.svg
  - tooling/scripts/package.json
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - packages/mail/types.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/app/api/course/studio/route.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/home.light.svg
  - packages/i18n/translations/fr/saas.json
  - packages/platform/package.json
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - packages/platform/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/api/modules/course/router.ts
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/public/icons/account/settings.light.svg
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - packages/api/modules/quiz/router.ts
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/settings.light.svg
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/modules/admin/component/users/UserList.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - apps/saas/public/icons/nav/book-open.dark.svg
tests:
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/mail/provider.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/platform/src/workspace/navigation.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - packages/mail/lib/send.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/modules/deployment/support-widget.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->