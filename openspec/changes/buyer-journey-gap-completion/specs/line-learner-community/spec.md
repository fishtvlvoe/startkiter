## MODIFIED Requirements

### Requirement: Paid learners see a LINE community join control

The course page SHALL show a join control for the LINE community invite URL stored on that course's `lineInviteUrl` field, for a user whose order has `Order.courseAccess` true for that course. This community is a peer discussion group for paid StartKiter learners. It MUST NOT be described as customer support. It MUST NOT be implemented as LINE Login for the take-home SaaS. It MUST NOT silently add users to a group. The control MUST NOT be backed by a dedicated API endpoint; the value SHALL be delivered as part of the course data already returned to the page.

#### Scenario: Paid learner sees a clickable join control

- **WHEN** a user with `Order.courseAccess` true for a course opens that course's page, and that course's `lineInviteUrl` is a non-empty `https://` URL
- **THEN** the page SHALL render a clickable control linking to that `lineInviteUrl`

##### Example: 付費學員看到連結

- courseId=course_academy、courseAccess=true、Course.lineInviteUrl=https://line.me/ti/g/example
- `/course` 渲染出可點擊的「加入 LINE 學習群」連結，連到 https://line.me/ti/g/example

#### Scenario: Unpaid user sees no join control

- **WHEN** a signed-in user with no `Order.courseAccess` true for that course opens the course page
- **THEN** the page MUST NOT render the join control, even if the course's `lineInviteUrl` is configured

#### Scenario: Missing or invalid invite configuration renders no control, not an error

- **WHEN** a paid learner opens the course page and that course's `lineInviteUrl` is empty, null, or does not start with `https://`
- **THEN** the page SHALL render without the join control and MUST NOT show an error message or a disabled/placeholder link

##### Example: 欄位未設定

- courseAccess=true、Course.lineInviteUrl=null
- `/course` 頁面正常渲染，不出現 LINE 連結區塊，不噴錯誤

## ADDED Requirements

### Requirement: Course admin can set the course's LINE invite URL

A person with `app-admin` role for the `course` App SHALL be able to set and save a course's `lineInviteUrl` through the existing course update action (`apps/saas/app/api/course/studio/route.ts`), without a dedicated new endpoint. The system SHALL reject a save when the submitted value is non-empty and does not start with `https://`.

#### Scenario: Course admin saves a valid invite URL

- **GIVEN** a person with `app-admin` role for the `course` App
- **WHEN** that person submits `lineInviteUrl: "https://line.me/ti/g/example"` through the course update action
- **THEN** the value SHALL be persisted on that course's `lineInviteUrl` field

#### Scenario: Non-https value is rejected

- **WHEN** a course admin submits a non-empty `lineInviteUrl` that does not start with `https://`
- **THEN** the course update action SHALL reject the request without persisting the value

#### Scenario: Clearing the field is allowed

- **WHEN** a course admin submits an empty `lineInviteUrl`
- **THEN** the value SHALL be persisted as empty, and the join control SHALL stop appearing for that course
