# role-based-workspace-navigation Specification

## Purpose

`role-based-workspace-navigation`（SR-01）已經把 `resolveNavigation` 邏輯寫好測試過，但沒有真的接到 `NavBar.tsx`。這份補上「真的接上」這一步，讓總管理員進不同 App 時，選單能顯示對應的管理員身份。

## Requirements

### Requirement: NavBar 呼叫 resolveNavigation 決定選單內容

`NavBar.tsx` 不再用單一布林值判斷「是不是總管理員」，改為呼叫 `resolveNavigation` 取得目前的 `WorkspaceContext`，據此決定選單顯示內容。

#### Scenario: 總管理員進入課程 App 顯示課程管理員身份

- **GIVEN** 使用者是平台總管理員，目前路徑在課程 App 底下（如 `/admin/course`）
- **WHEN** `NavBar` 渲染選單
- **THEN** 選單顯示「課程管理員」對應的身份標籤與管理設定項目，不是原本單純的「總管理員」全域標籤

#### Scenario: 一般會員看不到任何管理選單

- **GIVEN** 使用者是一般會員角色
- **WHEN** `NavBar` 渲染選單
- **THEN** 不顯示任何管理員身份或管理設定項目（維持既有行為，不因這次改動而破壞）

##### Example: WorkspaceContext 對應的選單標籤

| WorkspaceContext | 選單身份標籤 |
| ----- | --------------- |
| `{ scope: "platform" }` | 總管理員 |
| `{ scope: "app", appId: "course", role: "app-admin" }` | 課程管理員 |
| `{ scope: "app", appId: "course", role: "app-user" }` | 使用者（無管理選單） |

<!-- @trace
source: fix-navbar-avatar-widget-newsletter
updated: 2026-09-24
code:
  - apps/saas/public/icons/nav/list-checks.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/assignment-admin-form.tsx
  - apps/saas/modules/course/components/MediaPicker.tsx
  - apps/saas/public/icons/nav/sparkles.light.svg
  - apps/saas/modules/shared/components/NavBar.tsx
  - packages/database/prisma/queries/users.ts
  - apps/saas/public/icons/nav/file-pen-line.light.svg
  - packages/platform/src/mount-points.ts
  - apps/saas/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/page.tsx
  - packages/platform/package.json
  - apps/saas/modules/shared/lib/account-menu.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/assignment/page.tsx
  - docs/ux/startkiter-navigation-fixture.json
  - packages/api/modules/course/lib/course-instructor-access.ts
  - apps/saas/public/icons/nav/list-checks.light.svg
  - packages/api/modules/course/procedures/list-manageable-courses.ts
  - apps/saas/public/icons/nav/message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/course-invites-panel.tsx
  - packages/platform/src/workspace/navigation.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/media/page.tsx
  - packages/newsletter/lib/sender-address.ts
  - apps/saas/app/(authenticated)/(operator)/course-invites/page.tsx
  - apps/saas/public/icons/nav/package.dark.svg
  - packages/newsletter/package.json
  - packages/api/modules/course/router.ts
  - tooling/scripts/package.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/page.tsx
  - apps/saas/public/icons/account/credit-card.dark.svg
  - apps/saas/public/icons/account/log-out.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/course/course-review-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - apps/saas/public/icons/nav/sparkles.dark.svg
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/assignment-admin-form.tsx
  - packages/newsletter/lib/send-engine.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/review/review-admin-panel.tsx
  - packages/api/modules/quiz/quiz-results.ts
  - apps/saas/modules/settings/components/UserColorModeForm.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/layout.tsx
  - apps/saas/public/icons/nav/settings.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.tsx
  - apps/saas/modules/shared/components/UserMenu.tsx
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - apps/saas/public/icons/nav/file-pen-line.dark.svg
  - docs/verification/launch-evidence-report.mjs
  - apps/saas/public/icons/nav/mail.light.svg
  - packages/api/modules/admin/router.ts
  - apps/saas/public/icons/nav/shield-user.dark.svg
  - .agents/skills/startkiter-dev/SKILL.md
  - apps/saas/public/icons/nav/user-cog.light.svg
  - apps/saas/app/globals.css
  - apps/saas/public/icons/nav/image.light.svg
  - apps/saas/public/icons/account/shield-user.dark.svg
  - tooling/scripts/src/create-instructor-noninteractive.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/bundles/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx
  - apps/saas/public/icons/nav/file-text.light.svg
  - packages/i18n/translations/zh-tw/saas.json
  - packages/database/prisma/migrations/20260916034800_add_newsletter_recipient_attempt_token/migration.sql
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.tsx
  - apps/saas/public/icons/nav/mail.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/quiz-admin-form.tsx
  - packages/platform/index.ts
  - tooling/scripts/forbidden-term-scan.ts
  - apps/saas/public/icons/nav/bot-message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/invites/page.tsx
  - apps/saas/public/icons/nav/shield-user.light.svg
  - package.json
  - packages/mail/provider/resend.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.tsx
  - apps/saas/app/api/course/studio/route.ts
  - apps/saas/modules/shared/lib/icon-assets.json
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx
  - packages/api/modules/course/lib/course-dashboard.ts
  - apps/saas/public/icons/account/shield-user.light.svg
  - apps/saas/modules/deployment/components/SupportWidget.tsx
  - packages/i18n/translations/zh-cn/saas.json
  - packages/api/modules/quiz/router.ts
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx
  - apps/saas/public/icons/nav/bot-message-square.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/onboarding-surveys/page.tsx
  - .github/workflows/app-registry.yml
  - apps/saas/app/(authenticated)/(operator)/lesson-messages/lesson-messages-operator-panel.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/page.tsx
  - apps/saas/public/icons/nav/settings.dark.svg
  - apps/saas/public/icons/nav/image.dark.svg
  - apps/saas/public/icons/nav/clipboard-list.dark.svg
  - packages/mail/types.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/dashboard/page.tsx
  - apps/saas/public/icons/account/credit-card.light.svg
  - packages/platform/src/app-registration.ts
  - packages/api/modules/admin/procedures/list-users.ts
  - apps/saas/public/icons/nav/user-cog.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/messages/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/attempt/[attemptId]/page.tsx
  - packages/i18n/translations/fr/saas.json
  - apps/saas/public/icons/nav/clipboard-list.light.svg
  - apps/saas/modules/admin/component/users/UserList.tsx
  - packages/api/modules/course/procedures/send-lesson-message.ts
  - apps/saas/public/icons/nav/home.dark.svg
  - packages/i18n/translations/en/saas.json
  - AGENTS.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/layout.tsx
  - packages/mail/lib/abort.ts
  - apps/saas/app/(authenticated)/(operator)/review-admin/review-admin-panel.tsx
  - packages/i18n/translations/de/saas.json
  - packages/database/prisma/zod/index.ts
  - apps/saas/app/(authenticated)/(operator)/assignment-admin/page.tsx
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - apps/saas/public/icons/account/bot-message-square.light.svg
  - packages/mail/lib/send.ts
  - tooling/tailwind/theme.css
  - apps/saas/app/api/cron/newsletter-dispatch/route.ts
  - apps/saas/public/icons/nav/file-text.dark.svg
  - apps/saas/app/(authenticated)/(operator)/course-invites/course-invites-panel.tsx
  - apps/saas/app/api/newsletter/consent/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - apps/saas/public/icons/account/bot-message-square.dark.svg
  - apps/saas/scripts/fixtures/icon-assets-missing-dark.json
  - apps/saas/public/icons/nav/package.light.svg
  - apps/saas/public/icons/nav/message-square.dark.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.tsx
  - packages/mail/provider/nodemailer.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx
  - apps/saas/public/icons/account/log-out.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/comments/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.tsx
  - apps/saas/public/icons/nav/book-open.dark.svg
  - apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - apps/saas/public/icons/account/settings.dark.svg
  - packages/newsletter/index.ts
  - apps/saas/public/icons/account/settings.light.svg
  - docs/verification/launch-evidence-report.test.mjs
  - apps/saas/app/(authenticated)/(operator)/review-admin/page.tsx
  - apps/saas/public/icons/nav/home.light.svg
  - apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx
  - packages/api/modules/admin/procedures/set-instructor-role.ts
  - packages/i18n/translations/es/saas.json
  - packages/platform/src/workspace/registry.ts
  - tooling/scripts/src/grant-instructor-course-access.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/scripts/check-icon-assets.mjs
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/page.tsx
  - packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql
  - apps/saas/public/icons/nav/book-open.light.svg
  - apps/saas/app/(authenticated)/(operator)/quiz-admin/quiz-admin-form.tsx
  - apps/saas/modules/shared/lib/icon-assets.tsx
tests:
  - packages/api/modules/quiz/quiz-results.test.ts
  - packages/api/modules/admin/procedures/set-instructor-role.test.ts
  - packages/api/modules/course/procedures/list-manageable-courses.test.ts
  - packages/newsletter/lib/sender-address.test.ts
  - apps/saas/modules/shared/lib/icon-assets.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/page.test.tsx
  - apps/saas/app/api/newsletter/consent/route.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/course-pack/[coursePackId]/page.test.tsx
  - apps/saas/modules/shared/lib/account-menu.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/api/modules/course/lib/course-dashboard.test.ts
  - packages/platform/src/app-registry-ci.test.ts
  - apps/saas/modules/shared/components/UnifiedShell.test.tsx
  - packages/platform/src/workspace/feature-surfaces.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx
  - packages/platform/src/workspace/navigation.test.ts
  - packages/mail/lib/send.test.ts
  - packages/newsletter/lib/send-engine.test.ts
  - apps/saas/scripts/check-icon-assets.test.ts
  - apps/saas/modules/deployment/support-widget.test.tsx
  - packages/api/modules/course/lib/course-instructor-access.test.ts
  - packages/mail/provider.test.ts
  - packages/platform/src/app-registration.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/quiz/[courseId]/[lessonId]/quiz-results-table.test.ts
  - packages/platform/src/workspace/registry.test.ts
  - apps/saas/modules/shared/components/account-settings-theme-language.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - apps/saas/modules/shared/components/UserMenu.test.tsx
  - tooling/scripts/forbidden-term-scan.test.ts
  - apps/saas/app/api/cron/newsletter-dispatch/route.test.ts
  - packages/platform/src/mount-points.test.ts
  - packages/database/src/newsletter/newsletter-schema.test.ts
  - packages/api/modules/course/procedures/send-lesson-message.test.ts
-->