## Why

mvp-test-scope 已鎖定產品邊界，但 startkiter repo 還沒有可跑的 Next.js 應用。不先抽出站殼與登入，後續 PAYUNi、課程、GitHub 領取都沒有掛載點。

## What Changes

- 新增 pnpm monorepo 骨架：從 `supastarter-nextjs-main` 抽出 `apps/saas`、`packages/auth`、`packages/database`、`packages/ui`、`packages/utils`、`packages/i18n`（只留 zh-TW）與必要 tooling
- 新增 Better Auth 登入：email/password、Google、LINE（`socialProviders.line`，只用 Login Channel）
- 新增本機可開的繁中公開頁與登入後區域；拿掉 Organization / Member / Invitation 外掛與路由
- 修改 `AGENTS.md` 與 `openspec/config.yaml`：解除「不准抽應用程式碼」凍結，改寫成以 `extract-shell-auth` 為現行 extract
- 新增 `saas-shell` 與 `auth-login` 規格，定義本刀可觀察行為與 fail-closed 規則

## Non-Goals

- 不接通 PAYUNi、不建 orders 表、不做結帳頁
- 不抽課程模組、不做 GitHub kit claim、不做 site-agent、不做 LINE 學員交流群
- 不抽發票、不抽 thetu 任何應用程式碼
- 不抽 `apps/marketing`、`apps/docs`、Lemon／Polar／Dodo／Creem、Passkey／2FA、supastarter 的 GitHub OAuth 模組
- 不拷 libon.me 代碼；不修改任何來源 repo
- 不部署到正式環境、不買網域

## Capabilities

### New Capabilities

- `saas-shell`: pnpm monorepo 與 `apps/saas` 繁中公開頁／登入後區域可開；無 Organization 租戶骨架
- `auth-login`: Better Auth email/password、Google、LINE Login Channel；未設定的 provider fail-closed

### Modified Capabilities

(none)

## Impact

- Affected specs: saas-shell, auth-login
- Affected code:
  - New: apps/saas, packages/auth, packages/database, packages/ui, packages/utils, packages/i18n, tooling, package.json, pnpm-workspace.yaml, turbo.json
  - Modified: AGENTS.md, openspec/config.yaml, README.md
  - Removed: (none)
- Dependencies 新增: Next.js、React、TypeScript、Better Auth、Prisma、PostgreSQL client、pnpm workspace／Turbo（版本以抽取當下 supastarter lockfile 對齊）
- 環境變數新增: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, LINE_CHANNEL_ID, LINE_CHANNEL_SECRET
