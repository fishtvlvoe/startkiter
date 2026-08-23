## Context

`packages/notifications/` 是買家方向的持久化通知模組。資料庫以 `NotificationType` enum 保存 `WELCOME`、`APP_UPDATE`，以 `NotificationTarget` enum 保存 `IN_APP`、`EMAIL`。通知建立時會同時檢查兩個 target 的停用偏好；站內通知寫入 `Notification`，email 交給 `@startkiter/mail` 的 `notification` template。

目前只有 `WELCOME` 有實際自動觸發：Better Auth 的 `databaseHooks.user.create.after` 呼叫 `createWelcomeNotification()`。`APP_UPDATE` 已存在於 enum、偏好 schema 與前端 icon mapping，但在 repository 內找不到呼叫 `createNotification()` 的 app-update publisher；本 change 只記錄這個事實，不補 publisher。

## Goals / Non-Goals

**Goals:**

- 建立一份可供後續 apply、review 與 archive 使用的 notifications 行為契約。
- 讓 spec 覆蓋 package exports、兩種通知型別、兩個傳送 target、建立與 delivery、welcome trigger、link normalization、資料庫 user scoping、偏好設定與六個 ORPC procedures。
- 保留 Prisma 與 Drizzle query implementation 目前一致的外部行為。
- 把目前 UI 只展示 `APP_UPDATE` 的 catalog 行為，與 backend 仍支援 `WELCOME` 的事實分開寫清楚。

**Non-Goals:**

- 不設計新的事件模型、queue、retry policy、digest、排程或批次 publisher。
- 不替 `APP_UPDATE` 決定產品文案、觸發時機或資料 payload schema。
- 不修正現有 email／i18n 文案，也不把 UI toast 納入持久化通知。
- 不在這張 change 執行 runtime implementation；本輪只產出並驗證 propose artifacts。

## Decisions

### 1. 以資料庫 enum 為型別 SSOT，package constants 為 mirror

`packages/database` 的 `NotificationType`／`NotificationTarget` 與 generated Zod schemas 是 API 驗證與資料庫契約；`packages/notifications/src/types.ts` 的 `NOTIFICATION_TYPES`、`catalog.ts` 的 `NotificationTypeId` 是 package／UI 使用的 mirror。規格不把 mirror 當成另一組可獨立擴充的型別。

### 2. 建立通知採雙通道獨立分流

`createNotification()` 分別檢查 `IN_APP` 與 `EMAIL` 的 disabled preference。停用一個 target 不會自動停用另一個 target；沒有 preference row 代表 enabled by default。回傳值只代表 in-app insert 的 `NotificationModel | null`，email 發送不是回傳值的一部分。

### 3. 觸發點只記錄 code-first 證據

`WELCOME` 的 trigger 是 Better Auth user create after hook，且 hook 內 catch error 後寫 logger，不能讓 welcome notification failure 反向阻斷帳號建立。`APP_UPDATE` 只作為可傳入 generic creator 的型別，不宣稱目前已有自動 trigger。

### 4. 連結在建立與 API list response 都做 normalization

空值與空白字串轉成 `null`；已有 `http://`／`https://` 的 URL 保留 trim 後值；其他非空值以 `getBaseUrl(NEXT_PUBLIC_SAAS_URL, 3000)` 作 base 解析。建立時先存 absolute link，list procedure 回傳前再次呼叫同一 resolver，確保既有資料也能以同一規則輸出。

### 5. API 永遠由 protected procedure 取得 current user

六個 procedures 都透過 `protectedProcedure` 取得 session user，query 與 mutation 將 `user.id` 交給 database helper。API contract 不允許 caller 傳入任意 userId；資料列、偏好與已讀 mutation 都必須維持 user scope。

## Implementation Contract

### Behavior

- `createNotification({ userId, type, data?, link?, read? })` 接受資料庫支援的通知型別；`data` 預設 `{}`，`read` 預設 `false`。
- in-app enabled 時建立一筆目前 user 的 notification row；link 使用 resolved value。in-app disabled 時不建立 row，回傳 `null`（若 email 仍 enabled，email 分支仍可執行）。
- email enabled 且 user 有 email 時，使用 `templateId: "notification"` 發送；locale 取 user locale。title 優先取 object data 的非空 `headline`，其次為非空 `title`，再退回 `String(type)`；message 只接受 string；link 為 resolved link 或 undefined。
- `createWelcomeNotification(userId)` 建立 `WELCOME`、`title: "Welcome!"`、`message: "This is an example notification."`、`link: "/"` 的通知。
- 通知 list 按 `createdAt` descending；selected/all read mutation 只更新目前 user 的資料；沒有 disabled preference 即視為啟用。

### Interface / data shape

Package public surface：

```ts
type NotificationType = "WELCOME" | "APP_UPDATE";
type NotificationTarget = "IN_APP" | "EMAIL";

function createNotification(input: {
  userId: string;
  type: NotificationType;
  data?: unknown;
  link?: string | null;
  read?: boolean;
}): Promise<NotificationModel | null>;

function createWelcomeNotification(userId: string): Promise<NotificationModel | null>;
function resolveNotificationLink(link: string | null | undefined): string | null;
```

`@startkiter/notifications` 另 re-export `listNotificationRowsForUser`、`countUnreadNotificationsForUser`、`getDisabledNotificationPreferences`、`markAllNotificationsAsReadForUser`、`markNotificationsAsRead`、`setNotificationDisabled`；`@startkiter/notifications/catalog` export `NOTIFICATION_GROUPS`。目前 catalog 只有 `general` group，display order 只有 `APP_UPDATE`；這不代表 backend enum 移除 `WELCOME`。

Database row contract：

- `Notification`: `id`、`userId`、`type`、JSON `data`、nullable `link`、boolean `read`、`createdAt`、`updatedAt`。
- `UserNotificationPreference`: `userId`、`type`、`target`，`(userId, type, target)` unique；存在 row 代表該 target disabled。

ORPC routes：

| Method | Path | Input | Output / behavior |
| --- | --- | --- | --- |
| GET | `/notifications` | `{ take?: integer 1..100 }` | current user's recent rows, default 50, links resolved before output |
| GET | `/notifications/unread-count` | `{}` | `{ count: nonnegative integer }` |
| POST | `/notifications/mark-read` | `{ ids: string[] }`, at least one | `{ count }`, only matching current-user rows become read |
| POST | `/notifications/mark-all-read` | `{}` | `{ count }`, all current-user unread rows become read |
| GET | `/notifications/preferences` | `{}` | `{ disabled: { type, target }[] }` for current user |
| PUT | `/notifications/preferences` | `{ type, target, disabled }` | `{ ok: true }`; disabled=true upserts, false deletes |

### Failure modes

- Unauthenticated requests to all six routes are rejected by `protectedProcedure` before accessing another user's data.
- API input schema rejects `take` outside 1..100, empty `ids`, unknown notification types/targets, and non-boolean `disabled`.
- Missing user email causes the email branch to skip sending without creating a substitute address; disabling email also skips sending. Disabling in-app only suppresses the database row.
- `resolveNotificationLink(null | undefined | blank)` returns `null`; URL parsing failure returns the trimmed input rather than throwing.
- Welcome hook catches notification errors and logs them with `ctx: "createWelcomeNotification"`; the auth user-create flow does not surface that notification failure as its own error.

### Acceptance criteria

- `spectra analyze notifications-spec-backfill` reports no Critical or Warning findings.
- `spectra validate notifications-spec-backfill` reports the change valid with zero warnings.
- Code/spec cross-check confirms both enum values, both targets, the user-create welcome hook, absence of an in-repo APP_UPDATE caller, all six route paths, and the two database models.
- Future apply verification MUST include focused tests for channel preference isolation, title precedence, link resolution, user scoping, read counts, and welcome-hook error isolation; this proposal does not run or mark those implementation tasks complete.

### Scope boundaries

In scope：既有 notifications package、database notification query/schema、auth welcome hook、mail notification template contract、notifications ORPC router、notification center/preferences consumers 的規格化與 trace。

Out of scope：新增 runtime code、移動 spec 到 `openspec/specs/`、新增 notification type/publisher、資料庫 migration、mail provider、UI redesign、deploy 或 archive。

File paths are trace pointers only; behavior above is the durable contract.

## Risks / Trade-offs

- `data` 目前是 `unknown`，不同 consumer 對 object payload 的欄位解讀不完全相同：站內 UI 使用 `title`／`message`，email 另外優先使用 `headline`／`title`。spec 只固定已觀察到的 fallback，不過度設計未接線的 payload schema。
- `APP_UPDATE` 已在 backend enum 與 UI icon mapping，但 preferences catalog 目前沒有展示 `WELCOME`，也沒有 APP_UPDATE publisher。把這個落差寫入 spec 會讓未來 drift 明顯，但不在本 change 私自修正產品決策。
- Prisma 與 Drizzle query implementation 需要維持同一外部行為；後續若新增 provider，必須以本 spec 的 user scope、ordering、count 與 preference semantics 驗證，而不是只通過型別檢查。
