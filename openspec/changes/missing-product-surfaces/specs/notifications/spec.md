## ADDED Requirements

### Requirement: Operator can send one APP_UPDATE notification to an existing user

An operator SHALL send one in-app notification by submitting a target `userId`, a title, and a message. The server MUST call `createNotification` with type `APP_UPDATE` and MUST NOT change the `createNotification` signature or `createWelcomeNotification`. The title MUST be 1 to 120 characters after trim. The message MUST be 1 to 500 characters after trim. A missing session MUST receive HTTP 401. A signed-in user who is not an operator MUST receive HTTP 403 and the server MUST NOT insert a notification. An unknown `userId` MUST receive HTTP 404 and the server MUST NOT insert a notification. When the target user has disabled `APP_UPDATE` for `IN_APP`, the response MUST be HTTP 200 with `created` false and no notification row for that request. When the preference allows delivery, the response MUST be HTTP 201 with `created` true and the stored type MUST be `APP_UPDATE`.

#### Scenario: Operator sends an update

- **WHEN** an operator submits userId `user_1`, title `維護通知`, and message `今晚更新`
- **THEN** the response is HTTP 201 and one `APP_UPDATE` notification is stored for `user_1`

##### Example: 長度邊界

| title length after trim | message length after trim | HTTP |
| ----------------------- | ------------------------- | ---- |
| 1 | 1 | 201 |
| 120 | 500 | 201 |
| 0 | 10 | 400 |
| 121 | 10 | 400 |
| 10 | 501 | 400 |

#### Scenario: In-app preference blocks the insert

- **WHEN** an operator submits a valid payload for a user who disabled `APP_UPDATE` on `IN_APP`
- **THEN** the response is HTTP 200 with `created` false and no new notification row exists for that request

#### Scenario: Unknown user

- **WHEN** an operator submits userId `missing_user` with a valid title and message
- **THEN** the response is HTTP 404 and no notification row is inserted

#### Scenario: Non-operator is rejected

- **WHEN** a signed-in user who is not an operator submits a valid payload
- **THEN** the response is HTTP 403 and no notification row is inserted
