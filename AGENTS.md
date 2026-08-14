<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding → `$spectra-discuss`
- User wants to plan, propose, or design a change → `$spectra-propose`
- Tasks are ready to implement → `$spectra-apply`
- There's an in-progress change to continue → `$spectra-ingest`
- User asks about specs or how something works → `$spectra-ask`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# StartKiter

課 + 終身代碼包。對外課名可用「開站包」。現行邊界以 `mvp-test-scope` 為準。

這是獨立 git repo。零耦合 libon.me。不要改抽取來源。本張 apply 只落地規格；不准抽應用程式碼直到下一張 extract change。

【Allowed extract sources（只讀，禁止修改來源）】

殼：`/Users/fishtv/Development/supastarter-nextjs-main` → 後續 `apps/saas`、`packages/auth`、`packages/ai`

台灣金流／訂單：`/Users/fishtv/Development/THE-TU-Project/dev/thetu` 的 PAYUNi／訂單抽象 → `packages/payments`

課程 UI 當模組留下：從舊售出包（thetu）抽觀看與權限畫面 → `packages/course`。不抽整套學院營運。

LINE 登入契約：`/Users/fishtv/Development/8-外掛/line-hub`（網頁 OAuth 決策；PHP／LIFF／Bot 不搬）

GitHub kit 邀請是新做（GitHub API + 站內 OAuth），不要拷 supastarter 的 GitHub OAuth 模組當履約。

【Forbidden extract targets】

不准拷任何 libon.me 代碼、帳號、網域。libon.me 只當可看的案例網址。

不准抽 `THE-TU-Project/code` 或 `realms-course-platform-v1.8.0`。

THE-TU 只抽觀看／金流。不准抽電子報、優惠券、作業、NextAuth、Apple、課程邀請、賣課 onboarding skill。

不准抽 supastarter 的 marketing／docs、Lemon／Polar／Dodo／Creem、Passkey／2FA、Organization 多租戶。

不准抽應用程式碼直到下一張 extract change。本 repo 現在不該出現 `apps/` 與 `package.json`。

【v1 硬規則】

主金流 PAYUNi，一次買斷 TWD。結帳鎖 8800。Shopline／Stripe 不接線、不上課。

課與終身代碼包同一 SKU。退款取消領取資格。

不做 Organization 多租戶。帳單掛 user。

LINE Login Channel 做登入。學員社群用課程內 LINE 邀請連結，不能靜默入群。客服走 email。不做 SKOOL。

金鑰填後台，env fallback。沒設金流 fail-closed。

發票不在 MVP。

站內 agent 只掛 `get_my_orders` 與 `get_my_course_progress`，唯讀、只查自己。

【文件】

決策 SSOT：`docs/discuss/`（舊 v1-boundary 已被 mvp-test-scope 取代）

產品規格：`openspec/`（以 `openspec/changes/mvp-test-scope/` 為準，直到 archive）
