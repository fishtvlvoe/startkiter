## 1. Docs and schema

- [x] 1.1 更新 AGENTS.md、README.md、openspec/config.yaml：標明現行施工 extract-github-kit-fulfillment；白名單含 claim API、github_kit_grants、GitHub App 邀請；禁止拷 supastarter OAuth 當履約。對應 Decision: GitHub App installation 發邀請。驗證：rg 命中 extract-github-kit-fulfillment 與 github_kit_grants／claim。 [Tool: sonnet]
- [x] 1.2 新增 Prisma GithubKitGrant（表 github_kit_grants）與 migration：userId、githubUserId、githubLogin、repo、permission、status、timestamps；必要唯一索引。對應 Decision: 獨立 github_kit_grants 表。驗證：prisma validate／migrate 通過。 [Tool: sonnet]

## 2. Entitlement and claim core

- [x] 2.1 先寫測試再實作 kitClaimEligible 閘與 mock GitHub client：無權 403 且 invite 零次；缺設定 503。對應 Requirement: Claim entitlement reads Order.kitClaimEligible；Requirement: GitHub App performs collaborator invites；Decision: kitClaimEligible 是唯一 entitlement 閘。驗證：pnpm test 相關案例全綠。 [Tool: sonnet]
- [x] 2.2 實作 POST /api/github/claim 與 GET /api/github/claim-status：POST 才邀請；GET 只讀無副作用；成功寫 permission=pull status=invited。對應 Requirement: In-site GitHub claim after payment；Decision: GitHub App installation 發邀請。驗證：單元／route 測試覆蓋 401／403／200／status 無副作用。 [Tool: sonnet]

## 3. OAuth bind, UI, refund revoke

- [x] 3.1 接站內 GitHub OAuth 綁定（Better Auth social 或同等），claim 前必須有 github 身分；不拷 supastarter 履約模組。對應 Requirement: In-site GitHub claim after payment。驗證：未綁定時 claim 回明確錯誤；來源 supastarter 無改動。 [Tool: sonnet]
- [x] 3.2 在 /course 或 /app 掛最小領取 UI（綁定／領取／pending-accept 文案）。對應 Decision: 最小領取 UI 掛在 /course 或 /app（呼應 design Risk：買家未接受邀請以為壞掉，UI 文案需說明還要去 GitHub 接受邀請）。驗證：本機手動或 smoke 看得到按鈕與狀態。 [Tool: sonnet]
- [x] 3.3 退款路徑：有 grant 則呼叫 GitHub 撤銷／取消邀請並標 revoked；無 grant 不打 API；GitHub 失敗不擋退款但要可觀測（grant 標 failed）。對應 Requirement: Refund revokes existing collaborator access。驗證：測試覆蓋有／無 grant 與 API 失敗不阻擋 refund 旗標。 [Tool: sonnet]

## 4. Close-out

- [x] 4.1 跑 pnpm test 與 pnpm type-check 全綠。驗證：兩個指令 exit 0。 [Tool: sonnet]
- [x] 4.2 跑 spectra analyze extract-github-kit-fulfillment --json 與 spectra validate extract-github-kit-fulfillment；Critical／Warning 為 0。驗證：analyze／validate 通過。 [Tool: sonnet]
