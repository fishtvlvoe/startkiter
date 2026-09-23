## ADDED Requirements

### Requirement: Welcome email content is rendered from block content when present

When a `CourseWelcomeEmail` record has a non-null `contentJson`, the welcome email body SHALL be rendered from that block content (email-safe HTML plus plain text per the welcome-email-rich-editor capability). When `contentJson` is null, the body SHALL be rendered from `markdownTemplate` through the existing Markdown pipeline. This selection SHALL NOT change the sending trigger, recipient, subject handling, deduplication lock, or `EmailDeliveryLog` behavior defined for welcome emails.

#### Scenario: Block content takes precedence over Markdown

- **GIVEN** a `CourseWelcomeEmail` with both a non-null `contentJson` and a legacy `markdownTemplate`
- **WHEN** a buyer's order for that course is marked paid
- **THEN** the sent email body is rendered from `contentJson`, not from `markdownTemplate`

#### Scenario: Block content edit updates the plain-text export

- **GIVEN** a course whose welcome email was previously saved with `contentJson`
- **WHEN** the operator edits the template in the block editor and saves
- **THEN** the next welcome email sent for that course reflects the new block content
