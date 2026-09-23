# course-dashboard Specification

## Purpose

讓有課程管理權限的使用者（總管理員或被指派的講師）一進後台就能看到自己管理範圍內的營運概況，不用分頭點進多個子頁面拼湊數字。

## Requirements

### Requirement: 課程管理儀表板

總管理員與有課程管理權限的講師登入後台時，能在單一頁面看到課程營運概況（課程數、學員數、近期營收），不需要分別點進各個子頁面才能拼湊出全貌。

#### Scenario: 總管理員查看儀表板總覽

- **WHEN** 總管理員登入後台，進入課程管理儀表板頁面
- **THEN** 頁面顯示目前上架課程總數、累計學員人數、近 30 天營收金額三項核心指標，資料來自既有的課程/訂單資料表，不新增資料來源

##### Example: 指標卡片內容

| 指標 | 資料來源 | 顯示格式 |
| ----- | --------------- | ----- |
| 上架課程數 | `Course` where `published = true` | 整數 |
| 累計學員人數 | 課程購買/授權關聯表去重人數 | 整數 |
| 近 30 天營收 | 近 30 天內成功訂單金額加總 | 新台幣，千分位 |

#### Scenario: 講師查看儀表板（權限受限）

- **GIVEN** 登入者是講師角色，且只被指派管理特定課程
- **WHEN** 該講師進入課程管理儀表板
- **THEN** 指標只統計該講師被指派管理的課程範圍，不顯示其他講師課程或平台全站數字

<!-- @trace
source: course-platform-feature-parity
updated: 2026-09-24
code:
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - apps/saas/public/icons/nav/shield-user.light.svg
  - docs/verification/launch-evidence-report.mjs
  - apps/saas/modules/admin/component/users/UserList.tsx
  - apps/saas/public/icons/account/shield-user.dark.svg
  - packages/i18n/translations/de/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - packages/newsletter/package.json
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/mail.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/public/icons/nav/list-checks.light.svg
  - apps/saas/modules/shared/components/UserMenu.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - packages/i18n/translations/es/saas.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - apps/saas/public/icons/account/log-out.dark.svg
  - packages/i18n/translations/en/saas.json
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/platform/src/workspace/registry.ts
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/public/icons/nav/home.dark.svg
  - apps/saas/public/icons/nav/package.dark.svg
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - .github/workflows/app-registry.yml
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - packages/api/modules/admin/procedures/list-users.ts
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - apps/saas/public/icons/nav/package.light.svg
  - packages/api/modules/quiz/router.ts
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - apps/saas/public/icons/nav/sparkles.light.svg
  - packages/api/modules/quiz/quiz-results.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - packages/i18n/translations/zh-tw/saas.json
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - packages/mail/lib/send.ts
  - packages/mail/provider/resend.ts
  - packages/mail/types.ts
  - packages/i18n/translations/zh-cn/saas.json
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - packages/api/modules/course/router.ts
  - apps/saas/scripts/check-icon-assets.mjs
  - tooling/tailwind/theme.css
  - apps/saas/app/globals.css
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/modules/shared/lib/account-menu.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - packages/platform/index.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - packages/platform/src/mount-points.ts
  - packages/api/modules/admin/router.ts
  - apps/saas/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/public/icons/account/shield-user.light.svg
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - docs/verification/launch-evidence-report.test.mjs
  - packages/mail/lib/abort.ts
  - packages/api/modules/course/lib/course-dashboard.ts
  - packages/mail/provider/nodemailer.ts
  - packages/newsletter/index.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/public/icons/nav/file-text.light.svg
  - apps/saas/public/icons/account/credit-card.light.svg
  - package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
  - packages/database/prisma/queries/users.ts
  - apps/saas/public/icons/nav/home.light.svg
  - docs/ux/startkiter-navigation-fixture.json
  - apps/saas/public/icons/account/settings.light.svg
  - packages/platform/src/workspace/navigation.ts
  - tooling/scripts/package.json
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/public/icons/account/settings.dark.svg
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/public/icons/nav/image.dark.svg
  - packages/database/prisma/zod/index.ts
  - packages/platform/package.json
  - packages/platform/src/app-registration.ts
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
tests:
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
  - packages/mail/provider.test.ts
  - packages/platform/src/app-registration.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - packages/api/modules/quiz/quiz-results.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - packages/mail/lib/send.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - apps/saas/modules/deployment/support-widget.test.tsx
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - packages/platform/src/mount-points.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
-->