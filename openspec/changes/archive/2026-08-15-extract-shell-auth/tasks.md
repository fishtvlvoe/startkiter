## 1. 治理文件與測試骨架

- [x] 1.1 讓 openspec/config.yaml 與 AGENTS.md／README.md 改成 ORM 用 Prisma、並寫明現行 extract 是 extract-shell-auth（解除「不准抽應用程式碼」凍結），滿足 Decision: ORM 沿用 Prisma，不在本刀改 Drizzle 與 Decision: 第一刀只抽殼與登入，金流與課程拆到後續 change。驗證：rg -n "Prisma|extract-shell-auth" openspec/config.yaml AGENTS.md README.md 命中，且 rg -n "不准抽應用程式碼直到下一張 extract|主金流 SHOPLINE|Drizzle \\+ PostgreSQL" openspec/config.yaml AGENTS.md 不再把這些當現行規則。 [Tool: sonnet]

- [x] 1.2 在 packages/auth 或 apps/saas 建立 focused 測試骨架（Vitest），先寫失敗測試鎖定 Email password auth works（空 email／空密碼不得建 user；合法註冊建立 user），滿足 TDD。驗證：測試檔存在且在實作前執行會失敗（紅燈）。 [Tool: sonnet]

- [x] 1.3 [P] 先寫失敗測試鎖定 Auth secrets fail closed（缺 BETTER_AUTH_SECRET 或 DATABASE_URL 時不得建立有效 session／不得宣稱註冊成功）。驗證：對應測試在實作前紅燈。 [Tool: sonnet]

## 2. Monorepo 殼（改寫抽）

- [x] 2.1 依 Decision: 來源對應採改寫抽白名單，禁止改來源，建立 package.json、pnpm-workspace.yaml、apps/saas、packages/ui、packages/utils、packages/i18n（只留 zh-TW）、tooling，滿足 Monorepo shell boots locally 與 Locale is zh-TW only。驗證：test -f package.json && test -d apps/saas；pnpm install 成功；開發伺服器啟動後對公開頁 GET / 回 200（無 PAYUNi 金鑰）。 [Tool: sonnet]

- [x] 2.2 抽出 packages/database（Prisma）只含 user／session／account／verification，滿足 Organization tenancy is absent 與 Decision: 拿掉 Organization 外掛與路由，身份掛 user。驗證：Prisma schema 無 organization／member／invitation model；migrate 後資料庫無這些表。 [Tool: sonnet]

- [x] 2.3 抽出 apps/saas 白名單路由與 modules（login／signup／account settings），依 Decision: 帳號區獨立掛 /app 前綴，不沿用來源根路徑 把帳號區整組掛到 `/app/*`（來源的 `(authenticated)/(main)/(account)` 是掛根路徑 `/`，需新增路由層而非照搬），拿掉 organization／chatbot／marketing 路徑，滿足 Authenticated area requires a session。驗證：未登入打 GET /app 會導向登入；已登入打 GET /app 回 200 並顯示繁中帳號頁；GET /new-organization 不是可用產品流程。 [Tool: sonnet]

## 3. Better Auth 登入

- [x] 3.1 抽出 packages/auth 並掛 Decision: Auth API 掛在 Better Auth catch-all（app/api/auth/[...all]），拿掉 organization／passkey／twoFactor／GitHub，實作 Email password auth works 讓 1.2 測試轉綠。驗證：POST /api/auth/sign-up/email 與 sign-in/email focused 測試全綠。 [Tool: sonnet]

- [x] 3.2 實作 Auth secrets fail closed，讓 1.3 測試轉綠。驗證：缺密鑰情境 focused 測試全綠。 [Tool: sonnet]

- [x] 3.3 [P] 依 Decision: LINE 用 Better Auth socialProviders.line，不搬 PHP，設定 Google login when configured 與 LINE login uses Login Channel only（callback／api/auth/callback/google 與／api/auth/callback/line；未設定則按鈕不可用；LINE 無 email 仍可連結）。驗證：rg -n "socialProviders|line|google" packages/auth 命中；未設定時登入頁不出現可點的 Google／LINE 成功路徑；有 LINE userId 無 email 的單元測試通過。 [Tool: sonnet]

## 4. Review

- [x] 4.1 確認來源未被本刀寫入：find /Users/fishtv/Development/supastarter-nextjs-main -newer openspec/changes/extract-shell-auth/proposal.md -type f 為空；find /Users/fishtv/Development/8-外掛/line-hub -newer openspec/changes/extract-shell-auth/proposal.md -type f 為空。滿足 Decision: 來源對應採改寫抽白名單，禁止改來源。 [Tool: kimi]

- [x] 4.2 跑 spectra analyze extract-shell-auth --json 與 spectra validate extract-shell-auth，Critical／Warning 為 0；並確認 package.json 存在且仍無 PAYUNi checkout 路由被當成已接通產品。驗證：analyze／validate 通過；rg -n "api/checkout|payuni/notify" apps/saas 若命中必須是未接通佔位而非可收款路徑。 [Tool: kimi]
