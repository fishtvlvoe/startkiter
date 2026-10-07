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