## Context

- `packages/database/prisma/migrations/` 有 49 支遷移。`20260915221513_add_newsletter_automation` 與 `20260916031800_add_newsletter_automation` 的 `migration.sql` 以 `diff -q` 比對完全相同（commit `c50cdb38` 與 `bf2680ea` 各加一次）。
- 2026-10-07 實測：空資料庫跑 `prisma migrate deploy` 在 `20260916031800` 失敗，錯誤碼 P3018、`type "EmailBounceState" already exists`。
- 暫時移除重複遷移後再測：全部遷移成功，但 `course_welcome_email` 欄位是 `content_json`（`20260910231500_add_welcome_email_content_json` 建立），schema 要 `contentJson`，`/admin/email-settings` 讀課程時報欄位不存在。
- 同一次測試以 `prisma migrate diff` 比對，另有 5 個索引與 `NewsletterRecipient.attemptToken` 只在遷移、不在 schema（只多不少，不會造成錯誤）。
- 正式站：以 Coolify API 取得連線資訊、唯讀連線查詢，確認沒有 `_prisma_migrations` 表，`course_welcome_email` 只有 `contentJson`，表示正式站資料庫由 schema 直接建立、從未執行遷移檔。
- 分支 `fishtvlvoe/fix-welcome-email-content-json` 已有 commit `77f9e96b`：新增冪等遷移 `20261007000000_fix_welcome_email_content_json_column`。

## Goals / Non-Goals

**Goals:**

- 空資料庫執行 `prisma migrate deploy` 成功，且 `/admin/email-settings` 需要的欄位存在
- 提供一支可重複執行的驗證指令，之後任何人改遷移都能先跑過再合併

**Non-Goals:**

- 正式站資料庫任何變更
- 遷移與 schema 之間「只多不少」的索引與欄位差異
- CI 自動化

## Decisions

### 重複遷移改成空遷移，不刪除目錄

把 `20260916031800_add_newsletter_automation/migration.sql` 內容換成一行註解加 `SELECT 1;`。

Alternatives Considered：
- 刪除整個目錄：曾經跑到這支失敗的資料庫，`_prisma_migrations` 會留著一筆找不到檔案的失敗紀錄，恢復步驟更難懂，否決。
- 把它改成 `CREATE TYPE IF NOT EXISTS` 等冪等寫法：PostgreSQL 的 `CREATE TYPE` 不支援 `IF NOT EXISTS`，要逐一改寫成 DO 區塊，改動量大且內容與前一支完全重複，否決。

### 欄位修正用新增的冪等遷移，不改舊遷移

沿用 commit `77f9e96b` 的 `20261007000000_fix_welcome_email_content_json_column`：依 `content_json`／`contentJson` 存在與否四種情況分別處理。

Alternatives Considered：
- 直接改 `20260910231500` 的欄位名：已經跑過這支的本機資料庫不會重跑，修不到，否決。
- 在 schema 加 `@map("content_json")`：正式站欄位是 `contentJson`，會讓正式站壞掉，否決。

### 驗證腳本只用本機 PostgreSQL 指令

`verify-fresh-install.sh` 從 `DATABASE_URL` 取出連線前綴，建立名稱含時間戳的臨時資料庫，結束時（含失敗）用 `trap` 刪除。

Alternatives Considered：
- 用 Docker 起一個乾淨 PostgreSQL：本機不一定有 Docker，且多一層依賴，否決。
- 寫成 vitest 測試：測試套件會被一般 `pnpm test` 觸發，每次都建資料庫太慢，否決。

## Implementation Contract

**Behavior**

- `pnpm --filter @startkiter/database verify:fresh-install` 在空資料庫套用全部遷移，成功時印出 `fresh install OK` 並回傳 0。
- 任一遷移失敗、或 `course_welcome_email` 沒有 `contentJson`、或仍有 `content_json`，印出失敗原因並回傳 1。
- 不論成功或失敗，臨時資料庫都會被刪除。

**Interface / data shape**

- 腳本路徑：`packages/database/scripts/verify-fresh-install.sh`
- 臨時資料庫名稱：`startkiter_fresh_verify_<unix 秒數>`
- `package.json` 新指令：`"verify:fresh-install": "dotenv -c -e ../../.env -- bash scripts/verify-fresh-install.sh"`

**Failure modes**

- `DATABASE_URL` 未設定：印出「DATABASE_URL 未設定」並回傳 1，不建立任何資料庫。
- 沒有建立資料庫的權限：印出 PostgreSQL 錯誤並回傳 1。

**Acceptance criteria**

- 修正前（把兩支遷移暫時還原成原狀）跑腳本回傳 1；修正後回傳 0。
- `pnpm --filter @startkiter/database test` 與 `pnpm --filter @startkiter/saas exec vitest run` 全綠。
- 本機用腳本建立的臨時資料庫起一次 `apps/saas`，ego-browser 開 `/admin/email-settings` 不出現 500。

**Scope boundaries**

- In scope：上述兩支遷移、驗證腳本、package.json 指令、部署文件一段說明。
- Out of scope：Non-Goals 所列項目。

## Risks / Trade-offs

- [Risk] 本機開發資料庫的 `_prisma_migrations` 已記錄 `20260916031800` 為失敗或已套用，改內容後 checksum 不同 → Mitigation：部署文件寫明恢復指令 `prisma migrate resolve --rolled-back 20260916031800_add_newsletter_automation` 後再 `prisma migrate deploy`。
- [Risk] 遷移另有 5 個索引與 1 個欄位不在 schema，從零安裝與正式站結構不完全一致 → Mitigation：只多不少，不影響功能；列入 Non-Goals 另開 change。
- [Risk] 未來再有人加重複遷移 → Mitigation：部署文件要求改遷移前後都跑 `verify:fresh-install`。

## Migration Plan

1. 合併到 main。正式站不執行遷移，部署不受影響。
2. 本機開發資料庫：照部署文件的恢復指令處理一次。
3. 回滾：revert 本 change 的 commit；正式站無需動作。
