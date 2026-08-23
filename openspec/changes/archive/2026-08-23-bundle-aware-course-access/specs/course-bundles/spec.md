## ADDED Requirements

### Requirement: Lesson content access is enforced per bundle membership

The buyer-facing lesson detail API (`getLessonDetail`) SHALL reject access to a non-free-preview lesson unless the requesting user holds either (a) the platform-wide `startkiter-mvp` product with `courseAccess=true`, or (b) a paid order whose product SKU resolves to a Bundle that includes the lesson's course id. Holding any other paid order alone SHALL NOT be sufficient grounds for access. A user with a paid order for one Bundle MUST NOT be granted access to lessons belonging to courses outside that Bundle's course list.

#### Scenario: Bundle buyer can access a lesson inside their bundle

- **WHEN** an authenticated user requests `getLessonDetail` for a published, non-free-preview lesson
- **AND** the user holds a paid order whose SKU resolves to a Bundle containing that lesson's course id
- **THEN** the API MUST return the lesson's full content

#### Scenario: Bundle buyer is denied access to a lesson outside their bundle

- **WHEN** an authenticated user requests `getLessonDetail` for a published, non-free-preview lesson
- **AND** the user's only paid order resolves to a Bundle that does NOT contain that lesson's course id
- **THEN** the API MUST reject the request with a forbidden error and MUST NOT return the lesson's content

##### Example: Two bundles, no cross-access

| Buyer's paid order | Requested lesson's course | Access granted? |
| --- | --- | --- |
| Bundle `combo-a` (courses: X, Y) | course X | yes |
| Bundle `combo-a` (courses: X, Y) | course Z | no |
| Bundle `combo-b` (courses: Z) | course Z | yes |
| `startkiter-mvp` with `courseAccess=true` | any published course | yes |
| no paid order | course X | no (unauthenticated: unauthorized; authenticated: forbidden) |

#### Scenario: AI tutor enforces the same bundle boundary

- **WHEN** an authenticated user requests the buyer-facing AI tutor route for a published, non-free-preview lesson
- **AND** the user's paid order SKU resolves to a Bundle containing that lesson's course id
- **THEN** the route MUST provide only a lesson-scoped AI response for that authorized lesson
- **AND** when the user's paid order resolves only to a Bundle that does not contain that course id, the route MUST return a forbidden error and MUST NOT send that lesson's content to the model

##### Example: AI tutor has no cross-bundle bypass

| Buyer's paid order | AI tutor lesson's course | Route result |
| --- | --- | --- |
| Bundle `combo-a` (courses: X, Y) | course X | 200 with lesson-scoped response |
| Bundle `combo-a` (courses: X, Y) | course Z | 403 forbidden; lesson content not sent to model |

#### Scenario: Free preview lessons bypass the bundle check

- **WHEN** any user (authenticated or not) requests `getLessonDetail` for a lesson with `isFreePreview: true`
- **THEN** the API MUST return the lesson's content regardless of bundle ownership

#### Scenario: Existing MVP entitlement remains valid

- **WHEN** an authenticated user with a `startkiter-mvp` order whose `courseAccess=true` requests a published, non-free-preview lesson
- **THEN** the API MUST return the lesson's full content even when no Bundle record exists for the MVP SKU
- **AND** a refunded MVP order with `courseAccess=false` MUST NOT grant access
