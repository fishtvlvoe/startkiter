## Why

`packages/notifications/` 已經被登入流程、站內通知中心、通知偏好設定與通知 API 使用，但 `openspec/specs/` 沒有對應的正式規格。現在的契約分散在通知套件、資料庫 schema/query、Better Auth hook、mail template 與 ORPC procedures；缺少 spec 會讓後續新增通知 publisher 時無法判斷哪些行為是既有契約、哪些只是尚未接線的預留能力。

本 change 由現有程式碼反推規格，補齊目前已存在的通知種類、傳送目標、觸發點、資料模型、連結解析、偏好設定、已讀操作與 API surface。這是規格回填，不是新增通知功能。

## What Changes

- 新增 `notifications` capability spec，描述目前 `WELCOME` 與 `APP_UPDATE` 兩種通知型別，以及 `IN_APP`／`EMAIL` 兩個獨立傳送目標。
- 記錄 `createNotification()` 的雙通道分流、預設值、email context 與通知連結解析行為。
- 記錄目前唯一自動觸發點：Better Auth 建立 user 後建立 `WELCOME` 通知。
- 明確記錄 `APP_UPDATE` 目前沒有 repository 內建的自動 publisher，不能在本 change 中推定不存在的觸發流程。
- 記錄 notifications package exports、資料庫模型/query contract、六個受保護的 notifications API procedure，以及目前 UI consumer 的 scope。
- 以 design 與 tasks 提供後續 apply、測試與 drift review 的可核對契約。

## Non-Goals

- 不新增通知型別、通知 publisher、排程或事件匯流排。
- 不修改 `packages/notifications/`、`packages/api/`、`packages/database/`、`packages/auth/`、`packages/mail/` 或前端 UI 的 runtime 行為。
- 不新增資料庫 migration、通知模板、i18n 文案或第三方 email provider。
- 不把 `APP_UPDATE` 沒有 caller 誤寫成已實作的自動觸發點。
- 不把一般 UI toast（例如 organization 操作成功提示）誤列為 `packages/notifications` 的持久化通知。

## Capabilities

### New Capabilities

- `notifications`: 既有通知模組的種類、建立／傳送、觸發、連結、偏好設定、已讀狀態與 authenticated API 契約。

### Modified Capabilities

無。現有 specs 沒有 notifications capability；本 change 只新增規格，不修改其他 capability 的 requirement。

## Impact

### Runtime code traced

- `packages/notifications/src/catalog.ts`
- `packages/notifications/src/types.ts`
- `packages/notifications/src/create-notification.ts`
- `packages/notifications/src/resolve-link.ts`
- `packages/notifications/src/welcome.ts`
- `packages/notifications/src/index.ts`
- `packages/database/prisma/schema.prisma`、`packages/database/prisma/queries/notifications.ts`
- `packages/database/drizzle/schema/index.ts`、`packages/database/drizzle/queries/notifications.ts`
- `packages/auth/auth.ts`
- `packages/mail/emails/Notification.tsx`、`packages/mail/lib/templates.ts`
- `packages/api/modules/notifications/`
- `apps/saas/modules/shared/components/NotificationCenter.tsx`
- `apps/saas/modules/settings/components/NotificationPreferencesForm.tsx`

### Change artifacts

- 新增 `openspec/changes/notifications-spec-backfill/specs/notifications/spec.md`
- 新增本 change 的 `proposal.md`、`design.md`、`tasks.md`

不新增依賴、不改環境變數、不改資料庫 schema。
