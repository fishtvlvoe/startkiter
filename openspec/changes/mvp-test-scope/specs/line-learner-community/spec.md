## ADDED Requirements

### Requirement: Paid learners see a LINE community join control

After a paid MVP order, the course area SHALL show a join control for the configured LINE community invite URL. The URL SHALL come from site settings. This community is a peer discussion group for paid StartKiter learners. It MUST NOT be described as customer support. It MUST NOT be implemented as LINE Login for the take-home SaaS.

#### Scenario: Paid user can fetch the invite URL

- **WHEN** a user with a paid MVP order calls GET /api/community/line-invite
- **THEN** the response MUST be HTTP 200 and the JSON body MUST include inviteUrl as a non-empty https URL

#### Scenario: Unpaid user cannot fetch the invite URL

- **WHEN** a signed-in user with no paid MVP order calls GET /api/community/line-invite
- **THEN** the response MUST be HTTP 403 and the body MUST NOT include inviteUrl

#### Scenario: Unauthenticated request is rejected

- **WHEN** GET /api/community/line-invite is called without a session
- **THEN** the response MUST be HTTP 401

#### Scenario: Missing invite configuration fails closed

- **WHEN** a paid user calls GET /api/community/line-invite and no invite URL is configured
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

### Requirement: Membership requires the learner to tap join

The product SHALL NOT state that payment alone adds the learner to the LINE community. The system MUST NOT call a LINE API that adds a user to a group or community without that user confirming in LINE.

#### Scenario: Payment success does not create LINE membership

- **WHEN** POST /api/payuni/notify marks the MVP order paid
- **THEN** the server MUST NOT call LINE group or community join APIs as a side effect of that notify

##### Example: 付款成功不觸發 LINE 群組加入

- POST /api/payuni/notify 收到 order_id=ord_8800_002 已付款通知
- 系統更新訂單狀態為 paid，但不呼叫任何 LINE 群組/社群加入 API

### Requirement: SKOOL-like community platform is out of MVP

MVP SHALL NOT ship a SKOOL-like hosted community (forums, points, feed) as the learner gathering place. The MVP gathering place SHALL be the LINE invite in the course.

#### Scenario: No community feed routes

- **WHEN** a client requests a SKOOL-like feed path such as GET /api/community/feed
- **THEN** MVP MUST NOT expose that as a product feature

##### Example: 沒有社群動態牆路由

- 客戶端呼叫 GET /api/community/feed
- 系統回傳 404，該路由不存在於產品功能中

### Requirement: LINE community is peer discussion only

Copy, UI labels, and course text for the LINE invite SHALL describe a learner discussion group. Those surfaces MUST NOT tell learners to send support requests into the LINE community.

#### Scenario: Join control is not labeled as support

- **WHEN** a paid user opens the course join control
- **THEN** the visible label MUST describe learner discussion and MUST NOT use support or customer-service wording as the primary label

##### Example: 加入按鈕文案為「加入學員討論群」

- 已付款用戶 dana@example.com 打開課程頁的社群加入區塊
- 畫面顯示文字為「加入學員討論群」，不含「客服」「支援」等字樣

### Requirement: Support contact is email

MVP support SHALL be an email address configured in site settings. The site SHALL display that address to visitors. Support MUST NOT be routed into the LINE learner community.

#### Scenario: Support email is visible

- **WHEN** a visitor opens a public site page that includes the footer or contact block
- **THEN** the configured support email MUST be visible as a mailto link

##### Example: 頁尾顯示客服信箱連結

- 訪客打開網站首頁，頁尾顯示 mailto:support@startkiter.com 連結
- 該信箱地址與 site settings 設定值一致

#### Scenario: Missing support email fails closed on the support endpoint

- **WHEN** GET /api/support/email is called and no support email is configured
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

#### Scenario: Support email endpoint returns the address

- **WHEN** GET /api/support/email is called and a support email is configured
- **THEN** the response MUST be HTTP 200 and the JSON body MUST include email as a non-empty address containing @

