## ADDED Requirements

### Requirement: Notification types and delivery targets are fixed by the database contract

The notifications capability SHALL support exactly the database-backed notification types `WELCOME` and `APP_UPDATE`, and the delivery targets `IN_APP` and `EMAIL`. Package constants, catalog types, generated Zod schemas, Prisma enums, and Drizzle enums MUST remain aligned. `WELCOME` MUST remain a valid generic notification type even though the current preference UI catalog only lists `APP_UPDATE`.

#### Scenario: Supported type and target are accepted

- **WHEN** a caller creates or updates a preference using `WELCOME` or `APP_UPDATE` and target `IN_APP` or `EMAIL`
- **THEN** the value MUST pass the shared database/API type contract

#### Scenario: Unknown type or target is rejected

- **WHEN** an API caller submits a notification type or target outside those enums
- **THEN** input validation MUST reject the request before changing a notification or preference

##### Example: Unknown preference value

- **GIVEN** `type = "PASSWORD_RESET"` and `target = "SMS"`
- **WHEN** the caller submits a preference update
- **THEN** validation MUST reject the input and preserve existing preferences

#### Scenario: Preference catalog preserves current display behavior

- **WHEN** the settings preference catalog is rendered
- **THEN** it MUST contain the `general` group with `APP_UPDATE` in its configured display order, while backend support for `WELCOME` remains available

### Requirement: Notification creation independently fans out to in-app and email channels

`createNotification()` SHALL accept `userId`, a supported `type`, optional unknown `data`, optional nullable `link`, and optional `read`. `data` MUST default to `{}` and `read` MUST default to `false`. The function MUST evaluate `IN_APP` and `EMAIL` disabled preferences independently. No preference row means the target is enabled.

#### Scenario: Enabled in-app delivery creates an unread notification by default

- **WHEN** a caller creates a notification for a user with no `IN_APP` disabled preference and omits `read`
- **THEN** the database MUST receive one row for that user with the requested type, JSON data default `{}`, resolved link, and `read = false`

#### Scenario: In-app delivery can start as read

- **WHEN** a caller creates a notification with `read: true` and in-app delivery is enabled
- **THEN** the created row MUST preserve `read = true`

#### Scenario: Disabled in-app delivery does not create a row

- **WHEN** the user's `IN_APP` preference is disabled for the notification type
- **THEN** no in-app notification row MUST be inserted and the function's in-app return value MUST be `null`

#### Scenario: Email delivery uses the notification template only when available

- **WHEN** the user's `EMAIL` preference is enabled and the user has an email address
- **THEN** the module MUST call `sendEmail` with `templateId: "notification"`, the user's locale, the resolved link, and a context whose title precedence is non-empty `data.headline`, then non-empty `data.title`, then `String(type)`

#### Scenario: Email delivery is skipped independently

- **WHEN** the user's `EMAIL` preference is disabled or the user has no email address
- **THEN** the module MUST skip email delivery without changing the independent in-app decision

### Requirement: Welcome notifications have one authenticated user-creation trigger

After Better Auth successfully creates a user, the auth database hook SHALL call `createWelcomeNotification(userId)`. That helper SHALL publish `WELCOME` with `title: "Welcome!"`, `message: "This is an example notification."`, and link `/`. Notification failure SHALL be logged and SHALL NOT fail the user-create flow. The notifications module SHALL not claim an automatic `APP_UPDATE` trigger unless a future change adds and specifies one.

#### Scenario: New user receives the current welcome payload

- **WHEN** the Better Auth user-create after hook receives a created user with an id
- **THEN** it MUST call the welcome helper for that id with the current fixed welcome payload and root link

##### Example: Welcome hook input

- **GIVEN** Better Auth finishes creating user id `user-123`
- **WHEN** the after hook runs
- **THEN** the welcome helper MUST target `user-123`, type `WELCOME`, data `{ title: "Welcome!", message: "This is an example notification." }`, and link `/`

#### Scenario: Welcome notification failure is isolated from account creation

- **WHEN** the welcome helper throws during the auth after hook
- **THEN** the hook MUST catch and log the error with the welcome context, without rethrowing it as the account-create result

##### Example: Mail provider failure

- **GIVEN** `createWelcomeNotification("user-123")` throws `Error("mail unavailable")`
- **WHEN** the user-create after hook handles the error
- **THEN** the hook MUST log context `createWelcomeNotification` and complete without rethrowing that error

#### Scenario: APP_UPDATE has no built-in publisher in the current capability

- **WHEN** the current repository is inspected for notification triggers
- **THEN** only the welcome user-create trigger is part of this capability; `APP_UPDATE` remains a supported generic type but MUST NOT be documented as an automatic auth, purchase, schedule, or app-update event trigger

### Requirement: Notification links are normalized for storage and API output

`resolveNotificationLink()` SHALL return `null` for `null`, `undefined`, or whitespace-only input; preserve trimmed absolute `http://` or `https://` links; resolve other non-empty paths against `getBaseUrl(NEXT_PUBLIC_SAAS_URL, 3000)`; and return the trimmed input if URL construction fails. Notification creation SHALL use the resolved value, and the list API SHALL resolve the stored value before returning it.

#### Scenario: Relative link becomes an absolute SaaS URL

- **WHEN** a notification is created with link `/settings/notifications` and `NEXT_PUBLIC_SAAS_URL` is configured
- **THEN** the stored and listed link MUST be the absolute URL produced from that SaaS base and path

#### Scenario: Absolute HTTP link is preserved

- **WHEN** a notification is created with `https://example.com/update`
- **THEN** the link MUST remain that trimmed absolute URL in email context and API output

#### Scenario: Empty link is represented as null

- **WHEN** a notification is created with `null`, `undefined`, or whitespace-only link
- **THEN** the stored and listed link MUST be `null`, and email context MUST omit the link

### Requirement: Notification persistence is user-scoped and supports ordered reads

The notification data model SHALL store `id`, `userId`, supported `type`, JSON `data`, nullable `link`, `read`, `createdAt`, and `updatedAt`. Notification preferences SHALL be unique per `(userId, type, target)`. List, count, and read mutation helpers MUST filter by the supplied user id; list results MUST be newest first by `createdAt`.

#### Scenario: List returns only the current user's newest rows

- **WHEN** the notification list helper is called for user A with a take limit
- **THEN** it MUST return at most that limit, only user A's rows, ordered by descending `createdAt`

#### Scenario: Unread count is user-scoped

- **WHEN** unread count is requested for user A
- **THEN** it MUST count only user A's rows where `read = false`

#### Scenario: Selected read mutation cannot touch another user

- **WHEN** user A submits notification ids that include a row owned by user B
- **THEN** the mutation MUST affect only matching user A rows, and the returned count MUST count changed user A rows only

##### Example: Selected ids across users

- **GIVEN** `n-a` belongs to user A and `n-b` belongs to user B, both unread
- **WHEN** user A submits `{ ids: ["n-a", "n-b"] }`
- **THEN** only `n-a` MUST become read and the returned count MUST be `1`

#### Scenario: Mark-all read updates only unread rows for the current user

- **WHEN** user A marks all notifications as read
- **THEN** all of user A's unread rows MUST become read and user B's rows MUST remain unchanged

##### Example: Two-user read isolation

- **GIVEN** user A has two unread rows and user B has one unread row
- **WHEN** user A calls mark-all-read
- **THEN** the result count MUST be `2`, both user A rows MUST be read, and user B's row MUST remain unread

### Requirement: Authenticated notification API exposes list, read, count, and preferences

The notifications ORPC router SHALL expose six protected procedures: `list`, `unreadCount`, `markRead`, `markAllRead`, `getPreferences`, and `updatePreference`. Each procedure MUST derive the user scope from the authenticated session and MUST NOT accept a caller-supplied `userId`.

#### Scenario: List API validates take and returns current-user rows

- **WHEN** an authenticated user calls `GET /notifications` with optional integer `take` from 1 through 100
- **THEN** the API MUST return at most `take` rows (default 50), in newest-first order, with links normalized for output

#### Scenario: Unread-count API returns a nonnegative count

- **WHEN** an authenticated user calls `GET /notifications/unread-count`
- **THEN** the API MUST return `{ count }` for that user's unread rows, where count is a nonnegative integer

#### Scenario: Selected and all-read APIs return mutation counts

- **WHEN** an authenticated user calls `POST /notifications/mark-read` with a non-empty string id array or `POST /notifications/mark-all-read`
- **THEN** the API MUST return `{ count }` for rows changed within that user's scope

#### Scenario: Preference API reads and updates one channel preference

- **WHEN** an authenticated user calls `GET /notifications/preferences` or `PUT /notifications/preferences` with `{ type, target, disabled }`
- **THEN** GET MUST return that user's disabled `{ type, target }` rows, and PUT MUST upsert the row when `disabled = true`, delete it when `disabled = false`, and return `{ ok: true }`

#### Scenario: Notification API rejects unauthenticated access

- **WHEN** a request reaches any of the six notification procedures without an authenticated session
- **THEN** the protected procedure MUST reject it before reading or mutating notification or preference data

##### Example: No-session list request

- **GIVEN** the request has no authenticated session
- **WHEN** it calls `GET /notifications`
- **THEN** the protected procedure MUST reject the request and perform no notification query
