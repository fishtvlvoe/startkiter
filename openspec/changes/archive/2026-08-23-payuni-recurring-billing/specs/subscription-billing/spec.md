## ADDED Requirements

### Requirement: Subscription plans are course-scoped, not hardcoded to a single course

The system SHALL model a `CourseSubscriptionPlan` as a generic record referencing any `Course` by `courseId`. The system MUST NOT hardcode a specific course identifier in gateway, checkout, or webhook code paths. The system SHALL allow zero, one, or multiple subscription plans to exist for any given course without requiring code changes.

#### Scenario: A second course can get a subscription plan without code changes

- **WHEN** an operator creates a new `CourseSubscriptionPlan` row referencing a course other than the MVP course
- **THEN** the checkout, gateway, and webhook code paths MUST process it identically to the MVP course's plan, using only the plan's `courseId` field

### Requirement: Buyers can subscribe to a course via PAYUNi recurring billing

The system SHALL allow a signed-in buyer to start a monthly or yearly subscription for a course that has an enabled `CourseSubscriptionPlan`, using PAYUNi's background transaction (period) API. The subscription SHALL be created under a separate SKU from the course's one-time purchase SKU. The system MUST NOT modify the pricing rule of an existing one-time-purchase SKU to add a second tier.

#### Scenario: Signed-in buyer starts a monthly subscription

- **WHEN** a signed-in buyer submits a subscription checkout request for an enabled `CourseSubscriptionPlan` with interval MONTH
- **THEN** the server MUST create a `CourseSubscription` row with status PENDING and MUST return a PAYUNi form-post payload for the buyer to complete first-period authorization

#### Scenario: Unauthenticated user cannot start a subscription

- **WHEN** a request without a valid session submits a subscription checkout request
- **THEN** the server MUST reject the request with HTTP 401 and MUST NOT create any `CourseSubscription` row

#### Scenario: Duplicate active subscription for the same course is rejected

- **WHEN** a signed-in buyer who already has a `CourseSubscription` in status PENDING or ACTIVE for a course submits another subscription checkout request for the same course
- **THEN** the server MUST reject the request with HTTP 409 and MUST NOT create a second `CourseSubscription` row for that user and course

### Requirement: Subscription gateway calls are made through a provider-agnostic interface

The system SHALL define a `SubscriptionGateway` interface with `createSubscriptionSession`, `cancelSubscription`, and `queryPeriod` methods. All checkout, webhook, and cancellation code paths MUST call these methods through the `SubscriptionGateway` type, not through a concrete gateway class. `PayUniPeriodGateway` SHALL be the first implementation of this interface.

#### Scenario: Checkout code depends on the interface, not the concrete class

- **WHEN** the subscription checkout handler calls `createSubscriptionSession`
- **THEN** the call site MUST reference the `SubscriptionGateway` type, and adding a second gateway implementation MUST NOT require changes to the checkout handler's call site

### Requirement: Webhook events are deduplicated via a claim-based inbox before processing

The system SHALL persist every incoming PAYUNi period-notify webhook event into a `PaymentWebhookEvent` record before executing any subscription state change, keyed by a unique `(gateway, eventId)` pair. A duplicate delivery of the same event MUST NOT be processed twice.

#### Scenario: Duplicate webhook delivery is ignored

- **WHEN** PAYUNi sends the same period-notify event twice (identical `(gateway, eventId)`)
- **THEN** the second delivery MUST return HTTP 200 with no further state change, and the system MUST NOT double-count the payment toward `paidPeriods`

#### Scenario: Signature verification failure is rejected before any state change

- **WHEN** a period-notify request has an invalid `HashInfo` signature
- **THEN** the server MUST return HTTP 400 and MUST NOT write to `CourseSubscription` or `PaymentWebhookEvent`

### Requirement: Successful period payment activates the subscription and grants course access

The system SHALL transition a `CourseSubscription` from PENDING to ACTIVE upon the first successful period-notify event, and SHALL increment `paidPeriods` and advance `currentPeriodEnd` (never regressing an existing later value) on every subsequent successful period-notify event.

#### Scenario: First period payment activates the subscription

- **WHEN** the first period-notify event for a PENDING subscription reports a successful authorization
- **THEN** the subscription's status MUST become ACTIVE, `paidPeriods` MUST become 1, and `gatewaySubscriptionId` MUST be recorded from the PAYUNi PeriodTradeNo

##### Example: currentPeriodEnd never regresses on a late-arriving webhook

| Existing currentPeriodEnd | Incoming period end from webhook | Resulting currentPeriodEnd | Notes |
| --- | --- | --- | --- |
| 2026-09-23 | 2026-10-23 | 2026-10-23 | normal in-order update |
| 2026-10-23 | 2026-09-23 | 2026-10-23 | late/out-of-order webhook MUST NOT regress the date |

### Requirement: Canceling a subscription revokes course access immediately

The system SHALL allow a signed-in buyer who owns an ACTIVE or PENDING `CourseSubscription` to cancel it. Upon successful cancellation via the PAYUNi gateway, the system SHALL set the subscription's status to CANCELED immediately, with no grace period through the end of the current billing period. `canAccessCourseId` MUST stop granting access via that subscription record on the next evaluation after cancellation completes.

#### Scenario: Canceled subscription immediately loses course access

- **WHEN** a buyer's ACTIVE subscription is successfully canceled via the PAYUNi gateway
- **THEN** the subscription's status MUST become CANCELED, and a subsequent `canAccessCourseId` check for that user and course MUST return false unless another access source (one-time Order or bundle) grants it

#### Scenario: Gateway cancellation failure leaves the subscription unchanged

- **WHEN** the PAYUNi mdfStatus cancellation call fails
- **THEN** the subscription's status MUST remain unchanged and the system MUST surface the failure to the caller without silently marking the subscription as canceled

##### Example: PAYUNi rejects the termination request

- GIVEN userId=user_subscriber owns subscriptionId=sub-001 with status=ACTIVE and gatewaySubscriptionId=period-001
- WHEN PAYUNi mdfStatus returns Status=FAILED and Message="declined"
- THEN the API returns a cancellation error, subscriptionId=sub-001 remains status=ACTIVE, and the buyer retains the subscription-based course access

### Requirement: Subscription records reserve invoice fields without implementing invoicing

The system SHALL include nullable invoice-related fields (`invoiceType`, `invoiceCarrierType`, `invoiceCarrierId`, `invoiceTaxId`, `invoiceTitle`) on `CourseSubscription`. The system MUST NOT populate these fields or call any invoicing API in this change; they exist solely to avoid a future schema migration when invoicing is implemented.

#### Scenario: Invoice fields exist but remain null through the subscription lifecycle

- **WHEN** a subscription is created, activated, renewed, or canceled by any workflow in this change
- **THEN** all invoice-related fields on that `CourseSubscription` row MUST remain null, and no invoicing API call MUST occur
