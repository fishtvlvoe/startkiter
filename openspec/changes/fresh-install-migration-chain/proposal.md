## Why

買家照遷移檔從零建資料庫時，`prisma migrate deploy` 會在第 46 支遷移失敗（`type "EmailBounceState" already exists`），原因是 `20260916031800_add_newsletter_automation` 與 `20260915221513_add_newsletter_automation` 內容完全相同、重複建立。即使跳過它，`/admin/email-settings` 也會因為遷移建的欄位叫 `content_json`、schema 要的是 `contentJson` 而打不開。正式站不受影響：2026-10-07 唯讀查詢確認正式資料庫沒有 `_prisma_migrations` 表（由 schema 直接建立），且欄位已是 `contentJson`。

## What Changes

- 修改 `packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql`：內容改為不做任何事的空遷移（保留目錄名稱，讓曾經記錄過這支失敗遷移的資料庫可以用 `prisma migrate resolve` 恢復）
- 新增 `packages/database/prisma/migrations/20261007000000_fix_welcome_email_content_json_column/migration.sql`：冪等修正 `course_welcome_email` 欄位名稱為 `contentJson`（已在分支 commit `77f9e96b`）
- 新增 `packages/database/scripts/verify-fresh-install.sh`：建立臨時空資料庫 → 跑 `prisma migrate deploy` → 檢查 `course_welcome_email` 只有 `contentJson` → 刪除臨時資料庫；任一步失敗回傳非 0
- 新增 `packages/database/package.json` 指令 `verify:fresh-install` 執行上述腳本
- 修改 `docs/vps-deployment-sop.md`：補一段「買家從零建資料庫」的指令與失敗時的恢復方式

## Non-Goals

- 不改正式站資料庫，也不為正式站補 `_prisma_migrations` 歷史
- 不處理遷移與 schema 之間其他「多出來」的差異：5 個 lease／userId 索引與 `NewsletterRecipient.attemptToken` 欄位只存在於遷移、不在 schema；從零安裝會多建它們但不會壞，另開 change 決定要補進 schema 還是移除
- 不修改其他任何既有遷移檔
- 不把驗證腳本接進 CI（目前專案沒有需要 PostgreSQL 的 CI job）

## Capabilities

### New Capabilities

- `fresh-install-migrations`: 從空資料庫套用全部遷移必須成功，且產生的資料表欄位符合程式需要，並提供一鍵驗證指令

### Modified Capabilities

(none)

## Impact

- Affected specs: `fresh-install-migrations`（新）
- Affected code: `packages/database/prisma/migrations/20260916031800_add_newsletter_automation/migration.sql`、`packages/database/prisma/migrations/20261007000000_fix_welcome_email_content_json_column/migration.sql`、新增 `packages/database/scripts/verify-fresh-install.sh`、`packages/database/package.json`、`docs/vps-deployment-sop.md`
- Dependencies 新增：無（使用本機既有 `createdb`／`dropdb`／`psql`）
- 環境變數新增：無；腳本讀既有 `DATABASE_URL` 只取主機與帳號部分建立臨時資料庫
