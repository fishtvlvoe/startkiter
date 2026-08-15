## ADDED Requirements

### Requirement: Course is a module on the sellable site

The StartKiter production site SHALL host course playback as one module beside checkout and the AI conversation module. The site MUST NOT be course-only with every other feature stripped.

#### Scenario: Paid learner watches a lesson in-site

- **WHEN** a user with a paid MVP order opens a lesson they are allowed to view
- **THEN** the lesson MUST play on the StartKiter site and MUST NOT require a third-party course platform to start playback

##### Example: 已付款學員在站內播放課程

- 已付款用戶 evan@example.com（order_id=ord_8800_003）開啟 lesson_id=lesson-01
- 影片直接在 StartKiter 站內播放，未跳轉至第三方課程平台

#### Scenario: Unpaid visitor cannot play lessons

- **WHEN** a visitor with no paid MVP order requests lesson playback
- **THEN** the server MUST deny playback and MUST NOT stream the lesson body

##### Example: 未付款訪客請求播放遭拒

- 未付款訪客 frank@example.com 請求播放 lesson_id=lesson-01
- 伺服器回傳拒絕（403），不傳送影片內容

### Requirement: Lesson list is bounded

MVP SHALL expose a finite lesson list stored by the site. An unknown lesson id MUST fail closed.

#### Scenario: Unknown lesson id

- **WHEN** a paid user requests GET /api/course/lessons/not-a-real-id
- **THEN** the response MUST be HTTP 404

#### Scenario: Empty lesson id

- **WHEN** a client calls GET /api/course/lessons/ or GET /api/course/lessons/%20
- **THEN** the response MUST be HTTP 400
