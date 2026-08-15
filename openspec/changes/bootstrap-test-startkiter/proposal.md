## Why

MVP 功能 extract 已封存，但對外 OAuth／整合測仍缺真正的測試站。需建立 Private `test-startkiter` 倉庫並接 Vercel＋雲端 DB，取代已廢的 Tunnel 主路徑。

## What Changes

- 新增能力 `test-startkiter-bootstrap`：定義 TEST 倉庫建立、推送來源、Vercel 專案連結、雲端 Postgres、必要 env 清單。
- 新增部署輔助檔（vercel.json／.vercelignore 或 root 說明）讓 monorepo `apps/saas` 可部署。
- 更新 `docs/deploy-and-public-url.md`：寫入實際 repo URL、Vercel 專案名、DB 供應商、callback 清單。
- 更新 AGENTS／config：現行施工本單；完成後標 TEST 已開通。

## Non-Goals

- 不建正式乾淨安裝包倉庫。
- 不做 Cloudflare Tunnel 恢復。
- 不在本單填入真實金鑰到 git；只寫 .env.example／文件清單。
- 不強制接 Coolify／VPS（可列為可選後續）。
- 不改來源 repo（supastarter／thetu／line-hub）。

## Capabilities

### New Capabilities

- `test-startkiter-bootstrap`: Private TEST 倉庫＋Vercel＋雲端 DB 開通契約與操作記錄。

### Modified Capabilities

- (none)

## Impact

- Affected specs: `test-startkiter-bootstrap`（新）
- Affected code:
  - New: `vercel.json`（或同等）、docs 更新、可選 `tooling/deploy/`
  - Modified: `docs/deploy-and-public-url.md`, `AGENTS.md`, `openspec/config.yaml`, `apps/saas/.env.example`
  - Removed: (none)
- Dependencies 新增: GitHub repo `fishtvlvoe/test-startkiter`；Vercel project；雲端 Postgres
- 環境變數新增: 測試站 `DATABASE_URL`、`BETTER_AUTH_URL`（測試站 HTTPS）等（只文件／Vercel dashboard，不進 git 密文）
