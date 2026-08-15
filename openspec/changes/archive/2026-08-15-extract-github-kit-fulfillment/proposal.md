## Why

課能播了，但 8800 賣的終身代碼包還沒發得出去。買家付完錢卻領不到 GitHub 私人倉庫，履約半套。

## What Changes

- 新增站內 GitHub OAuth（認人用）與 claim API：POST /api/github/claim、GET /api/github/claim-status
- 新增 GitHub App／installation 呼叫，把買家 GitHub 帳號邀進設定的 org private repo（permission=pull）
- 新增 Prisma github_kit_grants（或同等）記錄邀請狀態
- 權限閘讀 Order.kitClaimEligible；無權 403 且不打 GitHub API
- 修改 AGENTS.md、README.md、openspec/config.yaml：標明現行施工 extract-github-kit-fulfillment
- 修改 github-kit-fulfillment 規格：把 App 履約與 env 契約寫死成可測行為

## Non-Goals

- 不做手動後台一鍵邀請當主路徑
- 不拷 supastarter 的 GitHub OAuth 模組當履約
- 不做 LINE 社群、site-agent、發票
- 不改 thetu／supastarter／line-hub 來源
- UI 精修不在本刀（功能頁可最小）

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `github-kit-fulfillment`: 明確 GitHub App 邀請、kitClaimEligible 閘門、GET status 無副作用、退款撤權（本刀至少寫下契約與可測鉤子；若撤權需 GitHub API 亦在本刀）

## Impact

- Affected specs: github-kit-fulfillment
- Affected code:
  - New: packages/github-kit/ 或 apps/saas 內 lib + api/github/*
  - Modified: packages/database（github_kit_grants）、apps/saas 課程／帳號頁最小領取入口、AGENTS.md、README.md、openspec/config.yaml
  - Removed: (none)
- Dependencies 新增: Octokit 或 fetch 包 GitHub API（design 定案）
- 環境變數新增: GITHUB_CLIENT_ID/SECRET（OAuth）、GITHUB_APP_ID、GITHUB_APP_INSTALLATION_ID、GITHUB_APP_PRIVATE_KEY、GITHUB_KIT_ORG、GITHUB_KIT_REPO
