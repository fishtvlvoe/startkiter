## Code Review

### Verdict

PASS — initial Critical finding fixed; no remaining Critical or High findings.

### Reviewed scope

- `EmailDeliveryLog`、`CourseWelcomeEmail`、`CourseExpirationReminder` schema and migration
- welcome email rendering, allowlisted interpolation, failure logging, and order/subscription triggers
- expiration scan threshold filtering and cron bearer-token guard
- operator settings procedures, page, mount point, and delivery-log display

### Evidence

- `DATABASE_URL='postgresql://fishtv@localhost:5432/startkiter' pnpm --filter @startkiter/api test` — 48 files, 182 tests passed
- `pnpm --filter @startkiter/saas test` — 31 files, 163 tests passed
- `pnpm --filter @startkiter/api type-check` — passed
- `pnpm --filter @startkiter/saas type-check` — passed
- local production `pnpm build` — 28 workspace packages built; `/admin/email-settings` and `/api/cron/course-expiration` present in route output
- `spectra validate course-lifecycle-email` — valid
- `spectra analyze course-lifecycle-email --json` — Coverage, Consistency, Ambiguity, Gaps all Clean
- concurrent reminder gate test — compound unique reservation is created before `sendEmail`; `P2002` skips the duplicate without sending

### Acceptance boundary

初次 review 發現到期提醒若「先寄信、後寫 unique row」，並發 cron 仍可能重複寄信；已改為先以 `CourseExpirationReminder` compound unique row 原子佔位，`P2002` 直接 skip，寄送失敗才釋放佔位，並以 focused test 驗證。ego-browser 已完成 operator 登入、郵件設定儲存、checkout 頁互動、cron bearer／401／重複掃描與到期提醒送達紀錄驗證。買斷 PAYUNi acceptance 與 `WELCOME_EMAIL/SENT` 未完成：本 workspace 沒有 PAYUNi credentials，實跑 checkout 正確 fail-closed 回傳 503 `payuni_not_configured`；production mail-provider delivery 仍需授權的真實環境。
