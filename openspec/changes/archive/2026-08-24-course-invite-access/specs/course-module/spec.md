## MODIFIED Requirements

### Requirement: Playback entitlement reads Order.courseAccess

Lesson playback authorization SHALL require a Better Auth session whose user has course access to the lesson's course through at least one of: (1) an Order with sku startkiter-mvp and courseAccess true, (2) a paid Bundle order whose bundle includes the lesson's course, (3) an ACTIVE CourseSubscription referencing the lesson's course, or (4) a redeemed CourseInvite for the lesson's course (a CourseInviteRedemption row exists for the user and course). Client-supplied user ids MUST NOT grant access.

#### Scenario: Paid learner with courseAccess can open a lesson

- **WHEN** a signed-in user who has an Order with sku startkiter-mvp and courseAccess true requests an existing lesson
- **THEN** the server MUST allow playback and MUST return the lesson payload needed for in-site play

##### Example: 付費學員可播 lesson-01

- userId=user_paid 有 Order status=paid、courseAccess=true、sku=startkiter-mvp
- 請求 lessonId=lesson-01 成功，回應含該單元播放所需資料

#### Scenario: Unpaid or refunded learner is denied

- **WHEN** a signed-in user with no Order.courseAccess true for sku startkiter-mvp, no bundle membership covering the course, no ACTIVE CourseSubscription for the course, and no redeemed CourseInvite for the course requests lesson playback
- **THEN** the response MUST be HTTP 403 and MUST NOT include the lesson media body or media URL

##### Example: 退款後再播遭拒

- userId=user_refunded 的 Order status=refunded、courseAccess=false，且無 bundle、訂閱或邀請來源
- 請求 lessonId=lesson-01 回 HTTP 403，且回應不含媒體 URL

#### Scenario: Unauthenticated playback is rejected

- **WHEN** a request without a valid session asks for lesson playback
- **THEN** the server MUST deny the request (HTTP 401 or redirect to sign-in) and MUST NOT stream the lesson body

#### Scenario: Buyer with an ACTIVE subscription can open a lesson in the subscribed course

- **WHEN** a signed-in user with an ACTIVE CourseSubscription referencing the lesson's course, and no one-time Order or bundle covering that course, requests an existing lesson
- **THEN** the server MUST allow playback and MUST return the lesson payload needed for in-site play

##### Example: 訂閱買家可播 lesson-02

- userId=user_subscriber 有 CourseSubscription status=ACTIVE，courseId 對應該堂課
- 請求 lessonId=lesson-02 成功，回應含該單元播放所需資料

#### Scenario: Canceled subscriber without other access sources is denied

- **WHEN** a signed-in user whose only relevant access source is a CANCELED CourseSubscription for the lesson's course requests lesson playback
- **THEN** the response MUST be HTTP 403 and MUST NOT include the lesson media body or media URL

#### Scenario: Learner with a redeemed invite can open a lesson in the invited course

- **WHEN** a signed-in user with a `CourseInviteRedemption` row for the lesson's course, and no other access source, requests an existing lesson
- **THEN** the server MUST allow playback and MUST return the lesson payload needed for in-site play

##### Example: 邀請兌換學員可播 lesson-03

- userId=user_invited 有 CourseInviteRedemption，courseId 對應該堂課
- 請求 lessonId=lesson-03 成功，回應含該單元播放所需資料
