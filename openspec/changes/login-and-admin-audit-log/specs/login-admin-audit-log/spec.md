## ADDED Requirements

### Requirement: Every login attempt is recorded regardless of outcome

The system SHALL record a `LoginAttempt` row for every sign-in request, whether it succeeds or fails, including email, IP address, success flag, and user agent.

#### Scenario: Successful login is recorded

- **WHEN** a user successfully signs in
- **THEN** a `LoginAttempt` row MUST be created with `success: true`

#### Scenario: Failed login is recorded

- **WHEN** a sign-in request fails (e.g. wrong password)
- **THEN** a `LoginAttempt` row MUST be created with `success: false`

#### Scenario: Recording failure does not block sign-in

- **WHEN** writing a `LoginAttempt` row itself throws an error
- **THEN** the sign-in flow MUST still complete based on the actual authentication result, not fail solely due to the logging error

### Requirement: High-risk operator actions are recorded in AdminLog

The system SHALL record an `AdminLog` row for refunds, invoice void/allowance operations, and course deletions, including the acting admin, action type, target, and IP address.

#### Scenario: Refund action is logged

- **WHEN** an operator refunds an order
- **THEN** an `AdminLog` row MUST be created with `action` identifying the refund, `adminId` set to the acting operator, and `targetId` referencing the order

#### Scenario: Course deletion is logged

- **WHEN** an operator deletes a course
- **THEN** an `AdminLog` row MUST be created with `targetType: "Course"` and `targetId` referencing the deleted course
