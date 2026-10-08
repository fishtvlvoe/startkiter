# platform-admin-dashboard Specification

## Purpose

The platform admin dashboard gives a platform administrator a single overview page at `/admin/dashboard` with site-wide numbers, pending work, configuration health, recent orders, and quick links.

## Requirements

### Requirement: Dashboard page access

`GET /admin/dashboard` SHALL render the dashboard with HTTP 200 for a platform administrator. A signed-in user without platform admin permission SHALL be redirected to `/`, and an anonymous visitor SHALL be redirected to `/login`.

#### Scenario: Platform admin opens dashboard

- **WHEN** a platform administrator requests `/admin/dashboard`
- **THEN** the response is HTTP 200 and shows the overview, pending work, configuration check, recent orders, and quick actions sections

#### Scenario: Learner opens dashboard

- **WHEN** a signed-in learner requests `/admin/dashboard`
- **THEN** the learner is redirected to `/`


<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Overview numbers

The overview SHALL show revenue of paid orders in the last 30 days, the count of paid orders in the last 30 days, the student count, and the published course count. Zero values SHALL display as `0` or `NT$ 0`.

##### Example: Thirty-day window

| Order | Status | paidAt (now = 2026-10-07) | Counted |
| ----- | ------ | ------------------------- | ------- |
| A, 8800 | paid | 2026-10-06 | yes |
| B, 30 | paid | 2026-09-08 | yes |
| C, 500 | paid | 2026-09-06 | no |
| D, 900 | pending | 2026-10-05 | no |

Result: revenue `8830`, paid orders `2`.

#### Scenario: Empty site

- **WHEN** there are no orders and no courses
- **THEN** the overview shows `NT$ 0`, `0`, `0`, `0`


<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Pending work counts

The pending section SHALL show unread private messages (`readByTeacher = false`), unread lesson comments (`isRead = false` and not deleted), visible reviews without a reply, and email deliveries with status `FAILED` created in the last 7 days. Each row SHALL link to its management page.

##### Example: Rows and links

| Row | Count rule | Link |
| --- | ---------- | ---- |
| 未讀學員私訊 | LessonPrivateMessage.readByTeacher = false | /admin/course/messages |
| 未讀課程留言 | LessonComment.isRead = false AND deletedAt IS NULL | /admin/course/comments |
| 未回覆評價 | CourseReview.replyContent IS NULL AND isVisible = true | /admin/course/review |
| 寄送失敗信件 | EmailDeliveryLog.status = FAILED AND createdAt within 7 days | /admin/email-settings |

#### Scenario: Deleted comment not counted

- **WHEN** one unread comment has `deletedAt` set and another unread comment does not
- **THEN** the unread comment count is `1`


<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Configuration check

The configuration check SHALL list email, payment gateway, e-invoice, support email, and AI assistant, each with an ok flag, a status label, and a link to its settings page. The returned data SHALL NOT contain any credential value.

##### Example: Check states

| Item | ok when | Link |
| ---- | ------- | ---- |
| 寄信服務 | email summary has an active provider | /admin/email-settings |
| 金流 | loadCheckoutGatewayCredentials returns non-null | /admin/settings/checkout-gateway |
| 電子發票 | invoice settings einvoiceEnabled is true | /admin/settings/einvoice |
| 客服信箱 | NEXT_PUBLIC_SUPPORT_EMAIL is non-empty | /admin/email-settings |
| AI 助手 | AI provider settings report a usable key | /admin/settings/ai-provider |

#### Scenario: Credentials never returned

- **WHEN** the payment gateway is configured with hash key `test_hash_key_9999`
- **THEN** the dashboard data serialized as JSON does not contain `test_hash_key_9999`


<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Recent orders

The recent orders section SHALL list up to 5 paid orders, newest `paidAt` first, with masked buyer email, course title, and amount. When there are no paid orders it SHALL show `還沒有訂單`.

##### Example: Email masking

| Email | Displayed |
| ----- | --------- |
| alice@gmail.com | a***@gmail.com |
| b@x.tw | b***@x.tw |

#### Scenario: Six paid orders

- **WHEN** six paid orders exist
- **THEN** the five with the latest `paidAt` are shown in descending order


<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Section failure isolation

If the data query for one section fails, that section SHALL show `暫時無法載入` and the other sections SHALL render normally with HTTP 200.

#### Scenario: Pending work query fails

- **WHEN** the unread message count query throws
- **THEN** the pending section shows `暫時無法載入`, the overview and configuration check still render, and the page status is 200

<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Quick actions open creation dialogs

The quick actions section SHALL list, in this order: `新增課程`, `新增單元`, `寫電子報`, `建立優惠券`, `查看前台`. `新增課程` SHALL link to `/admin/course?action=new-course` and `新增單元` SHALL link to `/admin/course?action=new-lesson`. When `GET /admin/course` loads with a supported `action` query value, the course studio SHALL open the matching dialog after course data finishes loading and SHALL remove the `action` query from the address bar without adding a history entry. The lesson dialog SHALL target the last chapter (highest `order`) of the course the studio selects first, and its description SHALL name that course title and chapter title. Unsupported `action` values SHALL be ignored.

#### Scenario: New lesson from dashboard

- **WHEN** a platform administrator clicks `新增單元` on `/admin/dashboard` and the first studio course has chapters
- **THEN** `/admin/course` opens the `新增單元` dialog targeting that course's last chapter, and the address bar shows `/admin/course` without `action`

#### Scenario: New course from dashboard

- **WHEN** a platform administrator clicks `新增課程` on `/admin/dashboard`
- **THEN** `/admin/course` opens the `新增課程` dialog

#### Scenario: New lesson with no chapter

- **WHEN** `/admin/course?action=new-lesson` loads and the first studio course has zero chapters
- **THEN** no dialog opens and the studio shows the error message `請先新增章節，再新增單元`

#### Scenario: New lesson with no course

- **WHEN** `/admin/course?action=new-lesson` loads and the studio has zero courses
- **THEN** no dialog opens and the studio shows the error message `請先新增課程，再新增單元`

#### Scenario: Refresh after dialog opened

- **WHEN** the dialog opened from `?action=` and the user reloads the page
- **THEN** no dialog opens automatically because the `action` query was removed

##### Example: Action resolution

| action | Courses / chapters (orders) | Result |
| ------ | --------------------------- | ------ |
| new-course | any | open course dialog |
| new-lesson | course A: chapters 1, 2, 3 | open lesson dialog, chapter order 3 of course A |
| new-lesson | course A: no chapters | error `請先新增章節，再新增單元` |
| new-lesson | no courses | error `請先新增課程，再新增單元` |
| delete-all | any | ignored, no dialog |
| (absent) | any | ignored, no dialog |


<!-- @trace
source: admin-dashboard-polish
updated: 2026-10-08
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Single dashboard heading

`/admin/dashboard` SHALL show exactly one page heading, `控制台`. The admin layout heading `後台管理` with subtitle `管理你的應用程式。` SHALL NOT render on `/admin/dashboard`, and SHALL continue to render on every other `/admin/...` page.

#### Scenario: Dashboard heading

- **WHEN** a platform administrator opens `/admin/dashboard`
- **THEN** the page shows `控制台` and does not show `後台管理`

#### Scenario: Other admin page heading unchanged

- **WHEN** a platform administrator opens `/admin/course/dashboard`
- **THEN** the page still shows `後台管理` above its own content


<!-- @trace
source: admin-dashboard-polish
updated: 2026-10-08
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Overview numbers fit on one line on mobile

At a 390px wide viewport, each overview number SHALL render on a single line without horizontal page scrolling, for revenue amounts up to `NT$ 999,999`. At widths of 1024px and above, the overview SHALL keep four cards in one row.

#### Scenario: Mobile revenue card

- **WHEN** the dashboard renders revenue `NT$ 8,830` at a 390px viewport
- **THEN** `NT$ 8,830` occupies one line and `document.documentElement.scrollWidth` equals 390

#### Scenario: Six-digit revenue on mobile

- **WHEN** the dashboard renders revenue `NT$ 999,999` at a 390px viewport
- **THEN** the amount occupies one line inside its card

<!-- @trace
source: admin-dashboard-polish
updated: 2026-10-08
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->