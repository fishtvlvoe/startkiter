## ADDED Requirements

### Requirement: Courses can be grouped into a priced bundle

An operator SHALL be able to create a Bundle that groups multiple existing courses under a single sellable product with its own price in TWD. The Bundle MUST reference course ids that already exist in the platform's course catalog. A Bundle with a status other than "published" MUST NOT appear on the public bundle sales page or be purchasable.

#### Scenario: Operator creates a published bundle

- **WHEN** an operator submits a bundle with title, price, and two valid existing course ids, and sets status to "published"
- **THEN** the Bundle is persisted and the public bundle page for its slug returns HTTP 200

#### Scenario: Bundle referencing a nonexistent course is rejected

- **WHEN** an operator submits a bundle whose courseIds array contains an id with no matching course
- **THEN** the server MUST reject the request with HTTP 400 and MUST NOT create the Bundle

#### Scenario: Draft bundle is not publicly visible

- **WHEN** a bundle has status "draft"
- **THEN** GET requests to the public bundle sales page for that bundle's slug MUST return HTTP 404

### Requirement: Bundle purchase grants access to all included courses

Payment of a Bundle's product SHALL grant course access to every course id listed in that Bundle's course list, using the same access-grant mechanism as a single-course purchase. Refund of a Bundle purchase MUST revoke access to every course in that Bundle.

#### Scenario: Paid bundle grants access to all its courses

- **WHEN** PAYUNi marks a Bundle order paid
- **THEN** the buyer gains course access to every course id in that Bundle's course list

##### Example: 兩堂課的 bundle 付款後兩堂都能看

- **GIVEN** Bundle `combo-a` 包含 course id `lesson-01` 與 `lesson-02`
- **WHEN** 買家完成 `combo-a` 的 PAYUNi 付款
- **THEN** 該買家對 `lesson-01` 與 `lesson-02` 皆取得存取權

#### Scenario: Refunded bundle revokes access to all its courses

- **WHEN** an operator refunds a paid Bundle order
- **THEN** the buyer's course access MUST be revoked for every course id in that Bundle's course list

### Requirement: Bundle listing API returns published bundles only

GET /api/bundles SHALL return the array of Bundles with status "published". This endpoint MUST NOT require authentication.

#### Scenario: Public request returns published bundles

- **WHEN** an unauthenticated client calls GET /api/bundles
- **THEN** the response is HTTP 200 with a JSON array containing only bundles whose status is "published"
