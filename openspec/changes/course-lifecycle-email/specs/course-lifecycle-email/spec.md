## ADDED Requirements

### Requirement: A course welcome email is sent after a successful purchase when enabled

The system SHALL send a welcome email after a one-time purchase or a subscription's first successful charge, only when a `CourseWelcomeEmail` record exists for that course with `enabled: true`. Absence of a record or `enabled: false` SHALL NOT be treated as an error.

#### Scenario: Welcome email is sent for an enabled course

- **GIVEN** a course has a `CourseWelcomeEmail` record with `enabled: true`
- **WHEN** a buyer's order for that course is marked paid
- **THEN** a welcome email is sent to the buyer and an `EmailDeliveryLog` record is created with `status: SENT`

#### Scenario: No email is sent when welcome email is disabled

- **GIVEN** a course has a `CourseWelcomeEmail` record with `enabled: false`
- **WHEN** a buyer's order for that course is marked paid
- **THEN** no email is sent and no `EmailDeliveryLog` record is created

#### Scenario: No email is sent when no welcome email is configured

- **GIVEN** a course has no `CourseWelcomeEmail` record
- **WHEN** a buyer's order for that course is marked paid
- **THEN** no email is sent, no `EmailDeliveryLog` record is created, and the purchase flow completes without error

### Requirement: A subscription expiration reminder is sent once per reminder threshold

The system SHALL send at most one reminder per `(subscriptionId, daysBefore)` combination for `daysBefore` values of 7, 1, and 0, and only for subscriptions with `status: ACTIVE`.

#### Scenario: Reminder is sent for a subscription approaching expiration

- **GIVEN** an ACTIVE `CourseSubscription` with `currentPeriodEnd` exactly 7 days from now, and no existing `CourseExpirationReminder` for `daysBefore: 7`
- **WHEN** the expiration reminder scan runs
- **THEN** a reminder email is sent and a `CourseExpirationReminder` record is created with `daysBefore: 7`

#### Scenario: Duplicate reminder is not sent

- **GIVEN** an ACTIVE `CourseSubscription` with `currentPeriodEnd` exactly 7 days from now, and an existing `CourseExpirationReminder` for `daysBefore: 7`
- **WHEN** the expiration reminder scan runs
- **THEN** no additional email is sent and no additional `CourseExpirationReminder` record is created

#### Scenario: Non-active subscription is not reminded

- **GIVEN** a `CourseSubscription` with `status: CANCELED` and `currentPeriodEnd` exactly 7 days from now
- **WHEN** the expiration reminder scan runs
- **THEN** no reminder email is sent

### Requirement: The expiration reminder cron endpoint requires a valid bearer secret

The system SHALL reject requests to the expiration reminder cron endpoint that do not present the configured `CRON_SECRET` as a bearer token.

#### Scenario: Request without the correct secret is rejected

- **GIVEN** the `CRON_SECRET` environment variable is configured
- **WHEN** a request to the cron endpoint is made without a matching `Authorization: Bearer` header
- **THEN** the endpoint returns 401 and does not run the expiration scan
