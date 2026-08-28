# 乾淨安裝包 Promotion 指引

給 StartKiter 操作者：把本機／TEST 的可交付代碼，過濾後導出成學員拿到的乾淨安裝包。對標 supastarter 的純淨度。學員終身 kit 履約（GitHub App 邀請）是另一條線，不走這份流程。

## 三倉庫邊界

| 倉庫 | GitHub | 角色 |
| --- | --- | --- |
| 本機施工 | `fishtvlvoe/startkiter` | Spectra 施工、本機開發 |
| TEST | `fishtvlvoe/test-startkiter` | 髒狗食站。測試帳號、測試媒體、公司 Landing、工寮雜物可以待在這裡 |
| 乾淨安裝包 | `fishtvlvoe/startkiter-starter-kit` | 學員交付的獨立私有倉庫。只有殼、前端、schema、必要 seed 與可安裝套件 |
| 學員 kit | 履約線專用 | 付費後邀請。不是 TEST，也不是乾淨安裝包 |

禁止：把 TEST 改名、把 TEST 歷史當成客戶包、或把 production 指到 TEST。

乾淨包倉庫必須獨立建立，權限與 TEST 分開。本 change 不負責遠端 `git init`／push；操作者之後依此規格建立 `fishtvlvoe/startkiter-starter-kit`。

建議目錄（遠端建立後 clone 到本機）：

```text
~/Development/products/startkiter              ← 本機施工
~/Development/products/startkiter-starter-kit  ← 乾淨包目標（預設 --target）
```

## Promotion Checklist

功能要進乾淨包，必須顯式跑過這張表。只存在 TEST 的實驗功能，在通過前不得出現在乾淨包。

可晉升（全過才准導出）：

1. 殼／前端骨架沒有公司 Landing 文章營運頁。
2. 資料庫 schema 與必要 seed 不含測試帳號資料。
3. 導出結果可獨立 `pnpm install`、`pnpm build`、`pnpm test`。
4. 敏感詞掃描通過（見 Forbid List）。
5. 產出 git 歷史只有乾淨發布 commit，不含工寮討論與測試雜訊。

永不可晉升：

- 公司 Landing／文章／營運文案
- 測試帳號、測試圖、測試媒體、`packages/database/prisma/seed/test-users.ts`
- 工寮雜物：`.vercel/`、`.zeabur/`、`graphify-out/`、`docs/discuss/`、`docs/dashboard/`、`openspec/changes/`、`legacy/`
- 公司專用網域與憑證：`startkiter.aiver.me`、`*.pem`、真實 `.env`
- Demo 路由與按鈕：`apps/saas/app/api/demo/**`、`demo-grant-button.tsx`、`demo-grant.ts`
- 把髒 TEST 改名或直接當客戶包
- 以 Cloudflare Tunnel → localhost 當 OAuth／整合測主路徑

審查節奏：每張功能 SR archive 後人工對一次這張表。TEST 與乾淨包本來就可以不一樣，直到下一次 promotion。不做自動雙向定時同步。

## Allow List / Forbid List

腳本預設白名單。未列在 Allow List 的路徑不會進乾淨包。

Allow List：

- `apps/saas/`、`apps/marketing/`、`apps/docs/`
- `packages/`（現行產品套件，含 platform／notifications／mail／support 等 Core）
- `tooling/typescript/`、`tooling/tailwind/`
- `patches/`
- 根目錄：`package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`turbo.json`、`tsconfig.json`、`README.md`、`.gitignore`
- 買家需要的規範：`docs/core-boundary-and-extension-guide.md`、`docs/buyer-extension-convention.md`（本指引與 VPS 代管 SOP 留在操作者倉庫，不進乾淨包）

Forbid List（白名單之內也會剔除）：

- `docs/discuss/`、`docs/dashboard/`、`openspec/`、`.spectra/`、`graphify-out/`、`legacy/`
- `.vercel/`、`.zeabur/`、`node_modules/`、`.next/`、`.turbo/`、`.git/`
- `apps/saas/app/api/demo/`、`demo-grant-button`、`demo-grant.ts`
- `packages/database/prisma/seed/test-users.ts`
- `*.pem`、任何 `.env*`（只保留 `.env.example`／`.env.template`）

內容掃描：納入的非測試檔若含 `startkiter.aiver.me` 或私鑰標記（`BEGIN PRIVATE KEY`／`BEGIN RSA PRIVATE KEY`／`BEGIN OPENSSH PRIVATE KEY`），腳本以非 0 結束，不寫目標目錄。`*.test.ts` 裡的 mock PEM 不當作真實洩漏。

## 自動化腳本

```bash
pnpm tsx tooling/scripts/promote-clean-package.ts --dry-run
pnpm tsx tooling/scripts/promote-clean-package.ts --target ../startkiter-starter-kit
pnpm tsx tooling/scripts/promote-clean-package.ts --target ../startkiter-starter-kit --release v1.0.0
```

- `--dry-run`：只印 included／excluded 與掃描結果，不複製、不建置、不 commit。
- `--target`：乾淨包本地目錄，預設 `../startkiter-starter-kit`。
- `--release`：寫入導出報告的版本標記；本腳本不建立 GitHub 遠端、不 push。

非 dry-run 時：過濾複製 → 在目標目錄跑 `pnpm install && pnpm build && pnpm test`。任何一步失敗立即中止，不把失敗結果當成一次發布。

## Hotfix 雙軌

已發布給學員：以乾淨包為 SSOT。先在 `startkiter-starter-kit` 修安全／正確性，再手動 backport 回 TEST／本機施工庫。

尚未發布：修本機／TEST，下次 promotion 再進乾淨包。

兩邊各自修、不 backport 會漂移。所有 hotfix 都先經 TEST 再 promote，會讓已交付學員的緊急修復被未穩定實驗擋住。
