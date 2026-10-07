## 1. 紅燈：先證明現在會壞

- [x] 1.1 依「One-command fresh install verification」依 Decision「驗證腳本只用本機 PostgreSQL 指令」新增 `packages/database/scripts/verify-fresh-install.sh` 與 `package.json` 指令 `verify:fresh-install`（依 design Implementation Contract 的名稱、輸出與 trap 清理）。在尚未修遷移的 main 狀態（`20260916031800` 原內容、沒有 `20261007000000`）執行一次。驗證：指令回傳 1，輸出含 `EmailBounceState`，`psql -l` 查無 `startkiter_fresh_verify_*` 殘留；另把 `DATABASE_URL` 設空字串執行，回傳 1 且不建資料庫。

## 2. 修正

- [x] 2.1 [after: 1.1] 依 Decision「重複遷移改成空遷移，不刪除目錄」把 `20260916031800_add_newsletter_automation/migration.sql` 改成一行說明註解加 `SELECT 1;`，不動其他遷移檔。驗證：`git diff --stat` 只有這支遷移與 2.2、1.1 的檔案。
- [x] 2.2 [after: 1.1] 依 Decision「欄位修正用新增的冪等遷移，不改舊遷移」併入 commit `77f9e96b` 的 `20261007000000_fix_welcome_email_content_json_column`，並以四個臨時資料庫覆蓋「Welcome email content column matches the schema」Example 表四列。驗證：四列各自查 `information_schema.columns` 結果符合表格，第二列資料有搬過去，臨時資料庫全部刪除。
- [x] 2.3 [after: 2.1, 2.2] 依「Migrations apply cleanly to an empty database」再跑 `pnpm --filter @startkiter/database verify:fresh-install`。驗證：輸出 `fresh install OK`、回傳 0、無殘留資料庫。

## 3. 文件

- [x] 3.1 [after: 2.3] 在 `docs/vps-deployment-sop.md` 新增「從零建立資料庫」小節：`prisma migrate deploy` 指令、改遷移前後要跑 `verify:fresh-install`、曾卡在 `20260916031800` 的資料庫恢復指令 `prisma migrate resolve --rolled-back 20260916031800_add_newsletter_automation`。驗證：人工核對三段內容都在，指令可直接複製執行。

## 4. 驗收

- [x] 4.1 [after: 2.3] 依 design Acceptance criteria 跑 `pnpm --filter @startkiter/database test` 與 `pnpm --filter @startkiter/saas exec vitest run`。驗證：全綠，記下通過數字。
- [x] 4.2 [after: 4.1] PM 親自驗收（不信任實作方自報）：自己再跑一次 `verify:fresh-install`；用一個從零建好的臨時資料庫起本機 `apps/saas`，以 ego-browser 開 `/admin/email-settings`，確認畫面正常、無 500，截圖存 `~/Downloads/`，驗完刪除臨時資料庫。
