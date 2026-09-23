## ADDED Requirements

### Requirement: Operator can send a test welcome email to an arbitrary address

The system SHALL expose the oRPC procedure `course.sendWelcomeEmailTest` at POST /api/rpc/course/sendWelcomeEmailTest, restricted to administrators (same permission check as `course.updateWelcomeEmailSettings`). The input SHALL contain `courseId` and `toEmail`. The procedure SHALL render the course's current welcome email template (block content when present, otherwise Markdown) with sample variable values (userName=測試學員, courseName=the course title, courseUrl=the course page URL) and send exactly one email to `toEmail` through the existing mail provider.

#### Scenario: Successful test send

- **GIVEN** an administrator on the email settings page for a course with an enabled template
- **WHEN** the procedure is called with `toEmail: "fish@example.com"`
- **THEN** one email is sent to fish@example.com with subject and body from the current template, and the response is `{ ok: true, toEmail, subject }`

#### Scenario: Invalid email address is rejected

- **WHEN** the procedure is called with an empty or non-email `toEmail` (e.g. `"not-an-email"`)
- **THEN** the request fails with a validation error (HTTP 400 via the RPC layer) and no email is sent

#### Scenario: Non-admin is rejected

- **WHEN** a non-administrator calls the procedure
- **THEN** the request fails with a forbidden error and no email is sent

#### Scenario: Template is missing

- **GIVEN** the course has no `CourseWelcomeEmail` record
- **WHEN** the procedure is called
- **THEN** the request fails with an error stating the course has no welcome email template and no email is sent

### Requirement: Test send does not write delivery logs

`course.sendWelcomeEmailTest` SHALL NOT create or modify `EmailDeliveryLog` records, so test sends never pollute real delivery statistics or the admin delivery-log list.

#### Scenario: No log entry after test send

- **WHEN** a test send succeeds
- **THEN** no `EmailDeliveryLog` row is created

### Requirement: UI shows explicit send feedback and locks the button while sending

The email settings page SHALL provide a 寄測試信 control next to a test-recipient input. While a test send is in flight the control SHALL be disabled. On completion the page SHALL display exactly one of: a sending indicator (寄出中…), a success message naming the recipient address (已寄出測試信到 <email>) and reminding the operator to check the inbox including spam, or a failure message prefixed with 沒有寄出 and the provider error.

#### Scenario: Success feedback

- **WHEN** the operator enters fish@example.com and clicks 寄測試信, and the send succeeds
- **THEN** the status area first shows 寄出中… with the button disabled, then shows 已寄出測試信到 fish@example.com

#### Scenario: Failure feedback

- **WHEN** the provider rejects the send with error "Domain not found"
- **THEN** the status area shows 沒有寄出：Domain not found and the button is re-enabled

#### Scenario: Empty recipient blocked client-side

- **WHEN** the operator clicks 寄測試信 with an empty recipient input
- **THEN** the page shows 請輸入測試收件信箱, no request is made, and no status spinner appears
