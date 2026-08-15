## Context

`extract-course-module` 已封存：課能播、Order.courseAccess／kitClaimEligible 會隨付款／退款切換。GitHub kit 履約尚未實作。規格要求站內 claim、org private repo pull、GET status 無副作用。

老闆已定案：用 GitHub App／installation 做邀請；站內 GitHub OAuth 只負責綁定買家 GitHub 身分。不准拷 supastarter GitHub OAuth 當履約。

## Goals / Non-Goals

**Goals:**

- 有 kitClaimEligible=true 的登入者，完成 GitHub OAuth 後可 POST claim 獲得 pull 邀請
- GET claim-status 只讀庫、不打邀請 API
- 無權／未登入不得打 GitHub collaborators API
- 退款後 kitClaimEligible=false；已邀請者本刀必須能撤銷 collaborator（或明確失敗可觀測）

**Non-Goals:**

- LINE 社群、site-agent、發票、UI 精修
- 多 repo／多 org 產品化
- 自動接受邀請（買家仍須在 GitHub 接受邀請）

## Decisions

### Decision: GitHub App installation 發邀請

用 App installation token 呼叫 org repo collaborator invite（permission=pull）。OAuth access token 只拿 github user id／login，不拿來當 org admin。

Alternatives Considered:

- 純 PAT 當 org admin → 否決：個資／輪替差，老闆已選 App
- 拷 supastarter GitHub login 當履約 → 否決：AGENTS 禁止；且 login ≠ collaborator invite

### Decision: 獨立 github_kit_grants 表

欄位至少：userId、githubUserId、githubLogin、repo、permission、status（invited／accepted／revoked／failed）、orderNo 可選、timestamps。唯一約束避免同一 user+repo 重複邀請列失控（idempotent upsert）。

Alternatives Considered:

- 只寫 Order 旗標不記 grant → 否決：無法查 claim-status、無法對帳
- 把 grant 塞進 Better Auth account 表 → 否決：邊界混亂

### Decision: kitClaimEligible 是唯一 entitlement 閘

POST claim 前查該 user 是否存在 sku=startkiter-mvp 且 kitClaimEligible=true。只看 status=paid 不夠（退款後必須擋）。

Alternatives Considered:

- 只看 paid → 否決：與退款契約衝突
- 另建 Enrollment → 否決：與雙旗標重複

### Decision: 最小領取 UI 掛在 /course 或 /app

本刀只做「綁定 GitHub／領取／看狀態」按鈕與 API，不做漂亮行銷頁。

Alternatives Considered:

- 本刀零 UI 只 API → 否決：老闆要基本功能可走完
- 完整 dashboard → 否決：UI 討論延後

## Implementation Contract

Behavior:

- 未登入 POST claim → 401
- 登入但 kitClaimEligible=false → 403，GitHub invite API 呼叫次數為 0
- 合格使用者 POST claim → 200，grant status=invited，GitHub API 被呼叫一次（或幂等重試不重複邀請）
- GET claim-status → 回 not_claimed／invited／…，永不呼叫 add collaborator
- 退款後再 claim → 403；已存在 collaborator 本刀執行 remove（失敗要可觀測）

Interface / data shape:

- env：GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET、GITHUB_APP_ID、GITHUB_APP_INSTALLATION_ID、GITHUB_APP_PRIVATE_KEY（PEM）、GITHUB_KIT_ORG、GITHUB_KIT_REPO
- POST /api/github/claim
- GET /api/github/claim-status
- Prisma model GithubKitGrant（表名 github_kit_grants）

Failure modes:

- 缺 App／OAuth／org／repo 設定 → fail-closed 503（明確錯誤碼）
- GitHub API 失敗 → 5xx 或 502，grant 可記 failed，不假裝成功
- private key 無效 → 503，不洩漏 key

Acceptance criteria:

- Vitest：無權不打 API；GET status 無副作用；幂等 claim
- 本機有真 App 時可手動走通；無真 PEM 時用 mock Octokit 測邏輯
- spectra validate 通過；來源 repo 無改動

Scope boundaries:

- In: claim／status API、grant 表、App invite／revoke、最小 UI、文件標註
- Out: LINE、agent、發票、多租戶 org

## Risks / Trade-offs

[Risk] .env 裡 GITHUB_APP_PRIVATE_KEY 可能不是完整 PEM → Mitigation: apply 時驗證 PEM 格式；無效 fail-closed；必要時請老闆補真 key 檔

[Risk] OAuth callback 仍指向舊專案 → Mitigation: 文件寫明要加 localhost:3000 callback；本刀 .env.example 註解

[Risk] 買家未接受邀請以為壞掉 → Mitigation: UI 文案說明還要去 GitHub 接受

## Migration Plan

1. Prisma migration 加 github_kit_grants
2. 實作 kit package／routes + 測試
3. 掛最小領取 UI
4. 回滾：下線 claim routes、保留表（或 migration down）

## Open Questions

- 正式 org／repo 名稱（GITHUB_KIT_ORG／REPO）本機先用 placeholder 還是老闆指定？
- private key 若無法從 .env 還原 PEM，是否改讀檔案路徑 GITHUB_APP_PRIVATE_KEY_PATH？
