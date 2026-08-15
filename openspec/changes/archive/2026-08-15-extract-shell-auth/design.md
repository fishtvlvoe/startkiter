## Context

mvp-test-scope 已 archive，主規格要求 take-home 含繁中前後台與 Email／Google／LINE 登入，但 `products/startkiter` 仍無 `apps/` 與 `package.json`。來源殼在 `/Users/fishtv/Development/supastarter-nextjs-main`，認證契約參考 `/Users/fishtv/Development/8-外掛/line-hub` 的網頁 OAuth 決策。本 change 是「能賣」路徑第一刀：只抽出可開的站殼與登入。來源 repo 維持只讀。

## Goals / Non-Goals

**Goals:**

- 建立 pnpm monorepo，本機可啟動 `apps/saas`
- 繁中公開頁與登入後帳號區可開
- Better Auth 支援 email/password、Google、LINE Login Channel
- 資料庫只含 user／session／account／verification；帳單與身份掛 user
- 更新治理文件，允許本張 extract 抽應用程式碼

**Non-Goals:**

- 不接通 PAYUNi、不建 orders／course_progress／github_kit_grants
- 不抽課程、GitHub kit、site-agent、LINE 學員交流群、發票
- 不抽 Organization／Member／Invitation、Passkey、2FA、GitHub OAuth、AI chatbot、marketing／docs
- 不修改來源 repo、不拷 libon.me
- 不部署正式站

## Decisions

### Decision: 第一刀只抽殼與登入，金流與課程拆到後續 change

一次抽殼＋PAYUNi＋課程會把半套 thetu 黏上半套 supastarter，失敗時無法定位。本刀驗收停在「開得起來、登得進去」。

Alternatives Considered:

- 殼＋PAYUNi 同張：否決，金流會拖長第一張紅燈，殼搬運問題跟 webhook 問題混在一起。
- 整包 MVP 一次抽：否決，超出單張 change 可審範圍。

### Decision: ORM 沿用 Prisma，不在本刀改 Drizzle

`openspec/config.yaml` 曾寫 Drizzle，但 supastarter 來源是 Prisma + `prismaAdapter`。本刀改寫抽時沿用 Prisma，並把治理文件改成 Prisma，避免一邊抽一邊換 ORM。

Alternatives Considered:

- 抽的同時改寫成 Drizzle：否決，等於同時做遷移專案，第一刀風險過高。
- 先空殼自寫 Drizzle schema 再接 Better Auth：否決，丟掉可對照的來源行為。

### Decision: 拿掉 Organization 外掛與路由，身份掛 user

來源 `packages/auth` 預設掛 `organization` plugin 與 `organizationClient`。StartKiter v1 不做多租戶。抽取時刪除 organization／member／invitation 表與路由，保留 user 帳號設定。

Alternatives Considered:

- 先留 Organization 之後再關：否決，學員會學到錯誤預設。
- 自建簡化 team 表：否決，超出本刀與 MVP 邊界。

### Decision: LINE 用 Better Auth socialProviders.line，不搬 PHP

沿用 line-hub 產品決策：只用 Login Channel、callback 精確、email 可空、主鍵用 LINE userId。實作走 Better Auth 官方 LINE provider，callback `/api/auth/callback/line`。未設定 Channel 時登入頁不得顯示可點的 LINE 按鈕。

Alternatives Considered:

- 翻譯 line-hub PHP OAuth client：否決，會跟 Better Auth 搶 callback。
- 本刀只做 Email＋Google、LINE 下一張：否決，v1-scope-boundary 已要求 LINE；延後會變成永遠欠帳。

### Decision: 來源對應採改寫抽白名單，禁止改來源

絕對對應（來源 → 目標）：

- `/Users/fishtv/Development/supastarter-nextjs-main/apps/saas` → `apps/saas`（只留白名單路由與 modules/auth、modules/settings 個人帳號、modules/shared 必要件）
- `/Users/fishtv/Development/supastarter-nextjs-main/packages/auth` → `packages/auth`（拿掉 organization／passkey／twoFactor／GitHub；新增 line）
- `/Users/fishtv/Development/supastarter-nextjs-main/packages/database` → `packages/database`（只留 User／Session／Account／Verification）
- `/Users/fishtv/Development/supastarter-nextjs-main/packages/ui` → `packages/ui`
- `/Users/fishtv/Development/supastarter-nextjs-main/packages/utils` → `packages/utils`
- `/Users/fishtv/Development/supastarter-nextjs-main/packages/i18n` → `packages/i18n`（只留 zh-TW）
- `/Users/fishtv/Development/supastarter-nextjs-main/tooling` → `tooling`
- LINE 契約：`/Users/fishtv/Development/8-外掛/line-hub/includes/auth/` 只借決策，不複製 PHP

不抽：`apps/marketing`、`apps/docs`、`modules/organizations/**`、`modules/ai/**`、`packages/auth/lib/organization.ts`。

Alternatives Considered:

- 整包 copy 再刪：否決，容易留下 organization 與國際金流死碼。
- 從零手寫殼：否決，失去可對照的教學模板結構。

### Decision: 帳號區獨立掛 /app 前綴，不沿用來源根路徑

來源殼的 `(authenticated)/(main)/(account)` route group 掛在網域根路徑 `/`，公開頁與帳號區共用命名空間。StartKiter 改把帳號區整組移到 `/app/*` 前綴下，與繁中公開頁明確分離。抽取時需新增 `app/app/` 路由層（或等效 route group 重新掛載），不是直接照搬來源目錄結構。本刀不做 email 驗證強制開啟，`packages/mail` 不在本刀範圍內。

Alternatives Considered:

- 沿用來源根路徑 `/`：否決，公開頁與帳號區共用根命名空間，日後加路由要小心撞名，且跟本刀刻意做「能賣的獨立殼」定位不符。

### Decision: Auth API 掛在 Better Auth catch-all

`apps/saas` 以 Better Auth handler 掛載 `app/api/auth/[...all]/route.ts`。Email 註冊／登入、Google／LINE callback 都走此 catch-all。本刀不自建平行的 `/api/login`。

Alternatives Considered:

- 自寫 NextAuth 路由：否決，來源是 Better Auth，且 thetu 的 NextAuth 在禁止清單。
- 每個 provider 自建 route：否決，重複 Better Auth 已處理的 state／CSRF。

## Implementation Contract

Behavior: apply 完成後，開發者在本機用 PostgreSQL 與必要 env 啟動 `apps/saas`，能打開繁中公開頁與登入／註冊頁；用 email/password 註冊並進入登入後區域；在設定 Google／LINE 金鑰後能完成對應 OAuth；未設定的社群登入按鈕不可點或不可見；repo 內不存在 organization／member／invitation 資料表與對應產品路由。

Interface / data shape:

- 工作區根目錄存在 `package.json`、`pnpm-workspace.yaml`、`apps/saas`、`packages/auth`、`packages/database`
- Auth handler：`GET|POST /api/auth/*`（Better Auth catch-all）
- Google callback：`GET /api/auth/callback/google`
- LINE callback：`GET /api/auth/callback/line`
- Session：已登入使用者可讀取自己的 session；未登入存取登入後區域必須被導向登入頁
- DB 表：`user`、`session`、`account`、`verification`（Prisma）；不得建立 `organization`、`member`、`invitation`

```sql
-- 邏輯模型（Prisma migrate 產生同等結構）
CREATE TABLE "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  user_id text NOT NULL REFERENCES "user"(id),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX session_user_id_idx ON session (user_id);

CREATE TABLE account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES "user"(id),
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_user_id_idx ON account (user_id);
CREATE UNIQUE INDEX account_provider_account_uidx ON account (provider_id, account_id);

CREATE TABLE verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);
CREATE INDEX verification_identifier_idx ON verification (identifier);
```

Failure modes:

- `DATABASE_URL` 或 `BETTER_AUTH_SECRET` 缺失：開發伺服器不得假裝已登入；啟動或首次 auth 請求必須明確失敗
- Google／LINE 金鑰缺失：對應按鈕隱藏或停用；不得導向壞掉的 OAuth URL
- LINE id_token 無 email：仍須以 LINE userId 建立／連結 account，不得只因缺 email 而失敗
- 未登入存取登入後區域：導向登入，不得回 HTTP 500

Acceptance criteria:

- `test -f package.json && test -d apps/saas && test -d packages/auth`
- `pnpm` 安裝後能啟動 `apps/saas` 開發伺服器，公開頁 HTTP 200
- email/password 註冊與登入的 focused test 通過
- `rg "organization\\(|organizationClient|organization-invitation" packages/auth apps/saas` 不得把 organization 當啟用功能留下
- `rg "socialProviders|[\"']line[\"']|callback/line" packages/auth` 命中 LINE 設定
- 來源 repo `git -C /Users/fishtv/Development/supastarter-nextjs-main` 若無獨立 .git，改用 `find ... -newer openspec/changes/extract-shell-auth/proposal.md` 確認本刀未寫入來源；`find /Users/fishtv/Development/8-外掛/line-hub -newer openspec/changes/extract-shell-auth/proposal.md -type f` 為空
- `spectra validate extract-shell-auth` 通過

Scope boundaries:

- In scope: monorepo 骨架、saas 殼、Better Auth（email／Google／LINE）、Prisma user 表、治理文件更新、本機 smoke
- Out of scope: PAYUNi、課程、GitHub claim、agent、LINE 社群邀請、發票、正式部署、packages/ai

## Risks / Trade-offs

[Risk] 精簡殼時誤刪登入必要模組 → Mitigation：白名單路由以 extract-map 的 apps/saas 清單為準，每刪一塊先跑登入 smoke。

[Risk] Prisma 與舊 config 的 Drizzle 說法衝突 → Mitigation：本刀同步改 `openspec/config.yaml` 與 README／AGENTS 為 Prisma。

[Risk] LINE 無 email 造成帳號衝突 → Mitigation：account 以 provider_id=line + account_id=userId 為唯一鍵；規格寫死缺 email 不得單獨造成失敗。

[Risk] 抽出時改到來源 repo → Mitigation：tasks 含來源 dirty 檢查；禁止在來源路徑寫檔。

[Risk] 本刀結束看起來「還沒產品」 → Mitigation：Implementation Contract 寫明驗收是開站＋登入；收款是下一張。

## Migration Plan

部署步驟：

1. 在 `products/startkiter` apply 本 change，建立 monorepo 與 auth
2. 準備本機 PostgreSQL，填 `.env`（勿提交密鑰）
3. 跑 Prisma migrate，啟動 `apps/saas`，完成 email 註冊 smoke
4. 選測：填 Google／LINE 測試憑證打 OAuth

回滾策略：

1. 刪除本刀新增的 `apps/`、`packages/`、`tooling/`、lockfile（保留 openspec 與 docs）
2. 還原 AGENTS.md、README.md、openspec/config.yaml
3. 產品狀態回到「只有規格、無可跑應用」

## Open Questions

- 本機 PostgreSQL 用 Docker Compose 還是開發者自備實例（apply 前選定一種寫進 README）
- Google OAuth 測試專案與 LINE Login Channel 測試應用的實際 callback URL（開發用 localhost）
