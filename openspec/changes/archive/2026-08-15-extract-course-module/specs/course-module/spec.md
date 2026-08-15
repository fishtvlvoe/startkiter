## ADDED Requirements

### Requirement: Playback entitlement reads Order.courseAccess

Lesson playback authorization SHALL require a Better Auth session whose user owns at least one Order with sku startkiter-mvp and courseAccess true. Client-supplied user ids MUST NOT grant access.

#### Scenario: Paid learner with courseAccess can open a lesson

- **WHEN** a signed-in user who has an Order with sku startkiter-mvp and courseAccess true requests an existing lesson
- **THEN** the server MUST allow playback and MUST return the lesson payload needed for in-site play

##### Example: 付費學員可播 lesson-01

- userId=user_paid 有 Order status=paid、courseAccess=true、sku=startkiter-mvp
- 請求 lessonId=lesson-01 成功，回應含該單元播放所需資料

#### Scenario: Unpaid or refunded learner is denied

- **WHEN** a signed-in user with no Order.courseAccess true for sku startkiter-mvp requests lesson playback
- **THEN** the response MUST be HTTP 403 and MUST NOT include the lesson media body or media URL

##### Example: 退款後再播遭拒

- userId=user_refunded 的 Order status=refunded、courseAccess=false
- 請求 lessonId=lesson-01 回 HTTP 403，且回應不含媒體 URL

#### Scenario: Unauthenticated playback is rejected

- **WHEN** a request without a valid session asks for lesson playback
- **THEN** the server MUST deny the request (HTTP 401 or redirect to sign-in) and MUST NOT stream the lesson body

### Requirement: Lesson catalog is served from the course package

packages/course SHALL expose a lesson catalog (static manifest allowed in MVP) listing lesson ids and titles. Unknown lesson ids MUST return HTTP 404 after entitlement succeeds or as part of the authorized lookup path without leaking media.

#### Scenario: List lessons for an entitled user

- **WHEN** an entitled signed-in user opens the course index
- **THEN** the response MUST list the MVP lesson ids and titles from packages/course

##### Example: 有權學員看到 lesson-01

- userId=user_paid、courseAccess=true 開啟課程首頁
- 列表至少含 lessonId=lesson-01 與對應 title

#### Scenario: Unknown lesson id returns 404

- **WHEN** an entitled signed-in user requests lessonId that is not in the catalog
- **THEN** the response MUST be HTTP 404

##### Example: 未知單元 id

- userId=user_paid 請求 lessonId=lesson-does-not-exist
- 回應 HTTP 404

## MODIFIED Requirements

### Requirement: Course is a module on the sellable site

The StartKiter production site SHALL host course playback as one module beside checkout and other site modules. Playback MUST happen in-site under apps/saas course routes backed by packages/course. The site MUST NOT be course-only with every other feature stripped.

#### Scenario: Paid learner watches a lesson in-site

- **WHEN** a user with a paid MVP order (courseAccess true) opens a lesson they are allowed to view
- **THEN** the lesson MUST play on the StartKiter site and MUST NOT require a third-party course platform to start playback

##### Example: 已付款學員在站內播放課程

- 已付款用戶 evan@example.com 開啟 lesson_id=lesson-01
- 影片直接在 StartKiter 站內播放，未跳轉至第三方課程平台

#### Scenario: Unpaid visitor cannot play lessons

- **WHEN** a visitor with no paid MVP order requests lesson playback
- **THEN** the server MUST deny playback and MUST NOT stream the lesson body

##### Example: 未付款訪客請求播放遭拒

- 未付款訪客 frank@example.com 請求播放 lesson_id=lesson-01
- 伺服器回傳拒絕（403），不傳送影片內容

### Requirement: Lesson list is bounded

packages/course SHALL expose a finite lesson list. An empty or whitespace-only lesson id MUST be rejected as invalid before any catalog lookup or entitlement check.

#### Scenario: Empty lesson id

- **WHEN** a client requests lesson playback or lookup with an empty or whitespace-only lesson id
- **THEN** the response MUST be HTTP 400

##### Example: 空白單元 id 遭拒

- 已登入且已付款用戶請求 lessonId=""（或全空白字串）
- 回應 HTTP 400，未進入 courseAccess 或 catalog 查找
