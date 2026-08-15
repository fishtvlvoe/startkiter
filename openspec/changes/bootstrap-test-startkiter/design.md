## Context

兩倉模型已定稿。本機 `products/startkiter` 對應 GitHub `fishtvlvoe/startkiter`；TEST 面另開 `test-startkiter` Private，接 Vercel＋雲端 DB。Git push 自動部署待 Vercel GitHub Login Connection；在那之前用 `vercel deploy --prod`。Tunnel 已廢。

## Goals / Non-Goals

**Goals:**

- 建立 Private `fishtvlvoe/test-startkiter`
- 把現行可部署的 monorepo 內容推上 TEST（允許髒）
- Vercel 連該 repo，root／output 對準 `apps/saas`
- 雲端 Postgres 可連；文件寫清 env 與 OAuth callback 要用的測試站 URL

**Non-Goals:**

- 正式乾淨包倉庫、Coolify 必做、把密鑰寫進 git

## Decisions

### Decision: TEST 是獨立 GitHub repo，不是 startkiter 的 branch

Alternatives: 同 repo preview branch → 否決（與兩倉定稿衝突）。

### Decision: 首發托管用 Vercel＋Neon；Git 自動部署可暫以 CLI 頂，Login Connection 補完再接

Alternatives: 卡死等 Login Connection 才算完成 → 否決（部署鏈與 HTTPS／DB 可先驗）；只 Coolify → 否決（老闆本輪要 Vercel 測）。

### Decision: 本機 startkiter 繼續 Spectra 施工；以 remote `test` 或手動 push 同步到 test-startkiter

Alternatives: 改 origin 為 test → 否決（弄亂正式 startkiter remote）。

### Decision: vercel.json 放 monorepo root，build 指向 apps/saas

Alternatives: 只部署子目錄另拆 → 否決（本階段要整包測）。

## Implementation Contract

- Behavior: `gh repo view fishtvlvoe/test-startkiter` 存在且 private；Vercel 專案可對該 repo 部署；文件含測試站 URL 占位或實際 URL、DB 供應商、env 清單、OAuth callback 範例。
- Failure: 缺雲端 DB 時文件標「未接通」；不准把 DATABASE_URL 密碼 commit。
- Acceptance: repo 存在；vercel project linked；docs 更新；spectra validate 過。
- Scope: repo／Vercel／DB／docs／vercel 設定檔。Out: 正式包、Tunnel。

## Risks / Trade-offs

- [Risk] Serverless 與 PAYUNi webhook／常駐假設衝突 → Mitigation: TEST 可先測 OAuth／UI；金流 webhook 文件註記可能要常駐 Node／之後 VPS。
- [Risk] 誤 push 密鑰 → Mitigation: .gitignore 已忽略 .env；CR 檢查。

## Migration Plan

1. 建 repo → push 2. Vercel link＋DB 3. 文件 4. 回滾：刪 Vercel 專案／archive repo（慎）

## Open Questions

- 測試站自訂網域是否用 `startkiter.aiver.me` 指到 Vercel（可本單後設）
