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

台灣小白用 AI 架站的 take-home SaaS 教學模板。對外課名可用「開站包」。

這是獨立 git repo。零耦合 libon.me。不要改抽取來源。

【來源（只讀，禁止修改）】

殼：`/Users/fishtv/Development/supastarter-nextjs-main`

台灣金流／發票／Simple-first：`/Users/fishtv/Development/THE-TU-Project/dev/thetu`

LINE 登入契約：`/Users/fishtv/Development/8-外掛/line-hub`（網頁 OAuth 決策；PHP／LIFF／Bot 不搬）

【v1 硬規則】

主金流 SHOPLINE，一次買斷 TWD。SHOPLINE 不做訂閱。

不做 Organization 多租戶。帳單掛 user。

LINE 只做 Login Channel。

金鑰填後台，env fallback。沒設金流 fail-closed。

發票預設關。一張訂單一張發票。

【文件】

決策 SSOT：`docs/discuss/`

產品規格：`openspec/`

【禁止】

抽 `THE-TU-Project/code` 或 `realms-course-platform-v1.8.0`

抽 thetu 的課程／影片／作業／電子報／優惠券／NextAuth／Apple

抽 supastarter 的 marketing／docs、Lemon／Polar／Dodo／Creem、Passkey／2FA／GitHub OAuth／AI chatbot

任何 libon.me 代碼
