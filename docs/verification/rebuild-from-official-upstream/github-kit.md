# GitHub Kit Scenario 驗證

驗證日期：2026-08-18

本機未設定 `GITHUB_APP_ID`、`GITHUB_APP_INSTALLATION_ID`、`GITHUB_APP_PRIVATE_KEY`、`GITHUB_KIT_ORG`、`GITHUB_KIT_REPO` 或 GitHub OAuth client credentials，未呼叫 GitHub 外部 API。缺設定路徑依契約 fail-closed；邀請／撤銷則以注入的 memory store 與 collaborator spy 驗證。

## Scenario 結果

| Scenario | 結果 | 證據 |
| --- | --- | --- |
| Paid user claims successfully | PASS | `claim.test.ts` 驗證 entitled user 送出 pull invite 並持久化 invited grant；route 接線至 `POST /api/github/claim` |
| Unauthenticated claim is rejected | PASS | ego-browser 使用 `credentials: omit` POST `/api/github/claim` 回 401 `authentication_required`；package test 亦確認 invite 未呼叫 |
| Unpaid claim is rejected | PASS | `claim.test.ts` 驗證 `kitClaimEligible=false` 回 403 且 invite spy 0 次 |
| Claim status can be queried without side effects | PASS | `claim.test.ts` 驗證 GET status 僅讀 grant、不呼叫 collaborator API；route 接線至 `GET /api/github/claim-status` |
| Grant permission is pull | PASS | `claim.test.ts` 驗證持久化 grant permission=`pull` |
| GitHub API failure stays unclaimed | PASS | 新增 `claim.test.ts` failure case：invite throw 時回 502、grant status=`failed`，不標 accepted |
| Refund removes an already-accepted collaborator | PASS | `revoke.test.ts` 的 accepted/invited 共用撤銷核心；GitHub remove spy 被呼叫，status=`revoked` 並寫入 `revokedAt` |
| Refund cancels a pending invitation | PASS | `revoke.test.ts` 驗證 invited grant 會呼叫 remove collaborator 並轉 revoked |
| Refund with no prior grant needs no revocation call | PASS | `revoke.test.ts` 驗證無 grant 時 GitHub remove spy 0 次、結果 skipped |
| Revocation failure does not block the refund | PASS | `revoke.test.ts` 驗證 GitHub throw 不向上拋出，grant status=`failed`；退款旗標由 payments refund flow 維持完成 |
| Invite pending is visible | PASS | `claim.test.ts` 的 getClaimStatus 驗證 invited grant 回 status=`invited`，含 githubLogin/repo，未宣稱 accepted |
| `kitClaimEligible=false` blocks claim | PASS | `claim.test.ts` 驗證退款／未付款旗標 false 時回 403、API invite 0 次 |
| `kitClaimEligible=true` allows claim path | PASS | `claim.test.ts` 驗證 linked identity + configured App 進入 pull invite 並寫 invited grant |
| Missing App config fails closed | PASS | ego-browser 已登入 paid test user POST `/api/github/claim` 回 503 `github_kit_misconfigured`；`config.test.ts` 驗證缺 org/repo/private key 回 null |

## 指令結果

```text
pnpm --filter @startkiter/github-kit exec vitest run \
  packages/github-kit/claim.test.ts packages/github-kit/config.test.ts \
  packages/github-kit/revoke.test.ts

Test Files  3 passed (3)
Tests       17 passed (17)
```

`GithubKitGrant` schema 已補 `acceptedAt`／`revokedAt`，並重新執行 `pnpm --filter @startkiter/database generate`、`pnpm --filter @startkiter/database push`。
