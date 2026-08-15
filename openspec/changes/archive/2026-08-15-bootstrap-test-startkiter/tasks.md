## 1. GitHub TEST repo

- [x] 1.1 建立 Private GitHub repo `fishtvlvoe/test-startkiter`（若不存在）。對應 Requirement: Private TEST repository exists；Decision: TEST 是獨立 GitHub repo，不是 startkiter 的 branch。驗證：`gh repo view fishtvlvoe/test-startkiter --json isPrivate,name`。 [Tool: sonnet]
- [x] 1.2 將現行 startkiter 可部署內容推到 `test-startkiter`（remote 名可用 `test`），不含 .env 密文。對應 Decision: 本機 startkiter 繼續 Spectra 施工；以 remote `test` 或手動 push 同步到 test-startkiter。驗證：`git ls-remote test` 有 HEAD；gh 上看得到近期 push。 [Tool: sonnet]

## 2. Vercel + DB

- [x] 2.1 新增 monorepo 部署設定（vercel.json 等）讓 build 對準 apps/saas。對應 Decision: vercel.json 放 monorepo root，build 指向 apps/saas。驗證：設定檔存在且指向 saas。 [Tool: sonnet]
- [x] 2.2 建立／連結 Vercel 專案 `test-startkiter`，至少一次 production 部署成功；若 Git Login Connection 未就緒，文件標明 pending＋CLI 暫代，task 不宣稱 push 自動部署已通。對應 Requirement: Vercel deploys the TEST SaaS app；Decision: 首發托管用 Vercel＋Neon；Git 自動部署可暫以 CLI 頂，Login Connection 補完再接。驗證：`vercel ls`／alias `https://test-startkiter.vercel.app`；docs 有 Login Connection 註記。 [Tool: sonnet]
- [x] 2.3 開通雲端 Postgres 並在 Vercel 設 DATABASE_URL（及其他必要非密文清單寫進文件）。對應 Requirement: Cloud database for TEST；Decision: 首發托管用 Vercel＋Neon；Git 自動部署可暫以 CLI 頂，Login Connection 補完再接。驗證：文件記錄供應商 Neon；密鑰不在 git。 [Tool: sonnet]
## 3. Docs and close-out

- [x] 3.1 更新 docs/deploy-and-public-url.md：repo URL、Vercel、DB、HTTPS origin／pending、OAuth callback 範例；Tunnel 維持廢案。對應 Requirement: Public HTTPS base URL documented for OAuth。驗證：文件可回答四件事（repo、Vercel、DB、HTTPS／OAuth）。 [Tool: sonnet]
- [x] 3.2 更新 AGENTS.md／config 指針；Claude OK＋Codex 無 Critical 後 archive。驗證：CLI＋代理結論。 [Tool: sonnet]
