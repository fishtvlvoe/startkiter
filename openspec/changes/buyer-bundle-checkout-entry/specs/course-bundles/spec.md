## MODIFIED Requirements

### Requirement: Courses can be grouped into a priced bundle

An operator SHALL be able to create a Bundle that groups multiple existing courses under a single sellable product with its own price in TWD. The Bundle MUST reference course ids that already exist in the platform's course catalog. A Bundle with a status other than "published" MUST NOT appear on the public bundle sales page or be purchasable. The public bundle sales page for a published Bundle MUST offer a purchase entry point that initiates checkout for that Bundle's product id, and MUST show the signed-in user's access status for that Bundle instead of a purchase entry point when the user already has access to every course id in that Bundle.

#### Scenario: Operator creates a published bundle

- **WHEN** an operator submits a bundle with title, price, and two valid existing course ids, and sets status to "published"
- **THEN** the Bundle is persisted and the public bundle page for its slug returns HTTP 200

#### Scenario: Bundle referencing a nonexistent course is rejected

- **WHEN** an operator submits a bundle whose courseIds array contains an id with no matching course
- **THEN** the server MUST reject the request with HTTP 400 and MUST NOT create the Bundle

#### Scenario: Draft bundle is not publicly visible

- **WHEN** a bundle has status "draft"
- **THEN** GET requests to the public bundle sales page for that bundle's slug MUST return HTTP 404

#### Scenario: Signed-in buyer without access sees a purchase entry point on the bundle page

- **WHEN** a signed-in user who lacks course access to at least one course id in a published Bundle visits that Bundle's public sales page
- **THEN** the page MUST render a purchase entry point whose checkout request uses that Bundle's id as the product id

##### Example: 買家看到購買按鈕

- Bundle `combo-a`（status=published）包含 course id `lesson-01` 與 `lesson-02`
- userId=user_new 對 `lesson-01` 與 `lesson-02` 皆無存取權
- 造訪 `/bundles/combo-a` 看到「購買 combo-a」按鈕，點擊後送出的結帳請求 productId 為 `combo-a`

#### Scenario: Signed-in buyer with access to every course in the bundle sees an owned state instead of a purchase entry point

- **WHEN** a signed-in user who already has course access to every course id in a published Bundle (through any access source: an order for that bundle, a subscription, or a redeemed invite) visits that Bundle's public sales page
- **THEN** the page MUST NOT render a purchase entry point for that Bundle, and MUST indicate the user already has access

##### Example: 已擁有全部課程不顯示購買按鈕

- Bundle `combo-a` 包含 course id `lesson-01` 與 `lesson-02`
- userId=user_owns 對 `lesson-01` 與 `lesson-02` 皆已有存取權（不論來源）
- 造訪 `/bundles/combo-a` 看到「已擁有」狀態，沒有購買按鈕

#### Scenario: Signed-in buyer with access to only some courses in the bundle still sees a purchase entry point

- **WHEN** a signed-in user has course access to some but not all course ids in a published Bundle
- **THEN** the page MUST still render a purchase entry point for that Bundle (partial ownership does not suppress the purchase entry point in this version)

##### Example: 部分擁有仍顯示購買按鈕

- Bundle `combo-a` 包含 course id `lesson-01` 與 `lesson-02`
- userId=user_partial 對 `lesson-01` 有存取權（例如透過其他管道），對 `lesson-02` 無存取權
- 造訪 `/bundles/combo-a` 依然看到「購買 combo-a」按鈕

## ADDED Requirements

### Requirement: Buyer-facing bundle browse page lists published bundles

The application SHALL provide a signed-in buyer-facing page that lists every Bundle whose status is "published", showing each Bundle's title, price, and a short description, with a link to that Bundle's public sales page. Bundles whose status is "draft" or "archived" MUST NOT appear on this page.

#### Scenario: Browse page lists only published bundles

- **WHEN** a signed-in user visits the bundle browse page while three Bundles exist with status "published", "draft", and "archived" respectively
- **THEN** the rendered page MUST list only the "published" Bundle and MUST NOT list the "draft" or "archived" Bundles
