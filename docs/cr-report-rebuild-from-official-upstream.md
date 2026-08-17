# rebuild-from-official-upstream Code Review

日期：2026-08-18
範圍：第 1–9 節落地內容，含本輪為修復 review 發現新增的 checkout route 與 course API body guard。
比較基準：`f6ea77b5^..f43163a`（截至 review 前的程式碼）；review 修復另見 `72d63f7c`、`d85ae608`。

## 結論

| 角度 | 結果 |
| --- | --- |
| Correctness | 初輪 Critical 1、已修復；複查 Critical 0 |
| Security | Critical 0；簽章、session、權限與 secret fail-closed 路徑符合目前 spec |
| Performance | Critical 0；查詢有 user/index 邊界，沒有新增無界迴圈或重複批次呼叫 |
| 最終 Critical | **0** |
| 最終 Warning | **4** |

## 初輪 Critical 與修復

### C-001（已修復）— 課程 CTA 指向不存在的 checkout route

- 影響：`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx` 與 `[lessonId]/page.tsx` 的「前往結帳」連到 `/checkout`，但新官方底座原本沒有該 page；已登入且未購買的使用者無法從課程進入結帳。
- 修復：新增官方 `AuthWrapper`／`Card` 骨架的 `/checkout`、`/checkout/payuni` 頁與 PAYUNi form-post client button（`72d63f7c`）。
- 複查證據：`pnpm build` route list 現在包含 `/checkout`、`/checkout/payuni`；ego-browser 登入後 GET `/checkout` 頁面 200 並產生 checkout 截圖。

## Correctness review

- Prisma schema 合併後 `Order.amount` 是 `Int`、`currency` 預設 `TWD`、`status` 使用 `pending/paid/refunded` enum；`GithubKitGrant` 的 `acceptedAt`／`revokedAt` 是 nullable `DateTime`，沒有與官方 User／Session／Account 型別重複或衝突（`packages/database/prisma/schema.prisma:250-315`）。`pnpm --filter database generate` 與既有 schema push 已通過。
- checkout route 先驗證 Better Auth session、SKU，再載入 PAYUNi credentials；建立 pending Order 時固定 `startkiter-mvp`／8800／TWD，notify route 檢查 gateway、trade、金額與狀態，並用 pending 條件更新讓重複 notify 維持冪等（`apps/saas/app/api/checkout/route.ts:16-73`、`apps/saas/app/api/payuni/notify/route.ts:9-94`）。
- course route 修復了 JSON `null`／array body 會在讀取 `lessonId` 前丟例外的邊界；現在回 `lesson_id_required` 400。實跑：`null`、`[]`、`{}` 都 400，未知 lesson 未登入回 401（`d85ae608`）。
- auth provider 只在成對 credentials 存在時啟用 Google／LINE／GitHub；email/password 保留，登入測試帳密在 browser 中成功導向後台。
- GitHub kit claim／revoke route 先過 session、資格、OAuth/config 與 linked identity，再呼叫固定 `api.github.com`，grant 狀態使用同一組 user/org/repo key 做冪等。
- i18n locale catalog 以 `isLocale` 正規化，缺少 scope key 時 merge `zh-tw` default；既有 i18n tests 與 fallback scenario 通過。

## Security review

- PAYUNi webhook 驗證 HMAC-like SHA-256 hash，長度檢查後使用 `timingSafeEqual`；AES-GCM tag 在 decrypt 時驗證，錯誤回 400，不將密文或 key 寫入 response（`packages/payments/provider/payuni/crypto.ts:32-113`）。
- `/api/checkout` 與 course／GitHub routes 都有 session／user entitlement gate；未設定 PAYUNi credentials 維持 503 fail-closed，不會建立可付款 session。
- 設定值以 AES-256-GCM 加密；env fallback 只在設定缺失或解密失敗時使用，repo 沒有提交 PAYUNi、OAuth、GitHub private key 或 `BETTER_AUTH_SECRET`。本機 `PAYUNI_MERCHANT_ID`、`PAYUNI_HASH_KEY`、`PAYUNI_HASH_IV`、`PAYUNI_API_URL` 均為 UNSET；測試 fixture 只使用 sandbox URL。
- GitHub App JWT 使用短效 exp（9 分鐘），GitHub API host 固定，username 使用 `encodeURIComponent`；`permission` 固定 pull（`packages/github-kit/github-app-client.ts:13-101`）。
- 自動 Codex Security diff helper 已嘗試啟動，但工具回報 Python 3 helper 無法啟動；本報告的 security 結論來自人工 source review、secret scan、既有 security tests 與完整 test suite，不把自動掃描失敗冒充 PASS。

## Performance review

- Order／grant 查詢都有 user 或複合 unique/index 邊界；checkout 一次建立 order 與一次組 form，notify 一次查單、一次條件更新，沒有新增 N+1 或無界 retry。
- 課程 catalog 是靜態 whitelist；course access 只查指定 user／SKU；i18n catalog 以 locale scope 載入並在 process 內由 Next.js module cache 重用。
- GitHub claim/revoke 每次只取得一個 installation token 並做一次 collaborator mutation；沒有在 request path 加入輪詢或批次掃描。

## Warnings（不阻擋本輪 Critical gate）

1. `packages/payments/credentials.ts:23-45` 接受設定／env 提供的任意 `PAYUNI_API_URL`；預設值是 sandbox，但正式上線前仍需由部署 gate 明確確認 sandbox／production 憑證與 endpoint 成對，避免誤把正式金流帳號放進測試站。
2. `apps/saas/modules/i18n/request.ts:7-19` 直接把 `requestLocale`／cookie 值交給 next-intl；下游 `getMessagesForLocale` 會 fallback，故目前不會載入任意 catalog，但可補 locale whitelist 讓 request config 本身也 fail-safe。
3. `packages/github-kit/github-app-client.ts:29-51` 的 installation-token fetch 使用 global `fetch`，而 collaborator mutation 可注入 `fetchImpl`；不影響現有固定 host 行為，但降低測試與 timeout policy 的一致性。
4. `git diff --check f6ea77b5^..f43163a` 僅回報 Prisma 產生檔 `packages/database/prisma/zod/index.ts:418` EOF 多一個空白行；不影響型別、runtime 或 bundle。

## 驗證證據

- `pnpm build`：exit code 0；Turbo 2.10.10，marketing／saas build successful；route list 包含 `/checkout`、`/checkout/payuni`、`/course`、`/api/checkout`、`/api/course/lessons`、`/api/payuni/notify`。
- `pnpm test`：exit code 0；Turbo 10 successful／10 total。主要輸出：saas 24 tests、marketing 32、api 31、ui 115、permissions 6；其餘 package test tasks 也全數成功。只有 Vitest native config 與 Turbo output-file warnings。
- HTTP smoke：已登入 ego-browser 對本機 `/`、`/course`、`/checkout` 取得 200；未登入 course body edge cases 回 400／401；marketing `/zh-tw` 取得 200。
- 視覺驗證：完整矩陣與截圖在 `docs/verification/rebuild-from-official-upstream/comparison.md`。首頁、登入、註冊公開殼官方骨架 PASS；官方 app protected backend／course／checkout 因沒有合法 demo session 均 redirect `/login`，三頁以本機已登入實景、共用官方 `AppWrapper`／`AuthWrapper`／`Card` 元件與官方 redirect 做降級驗證，不能宣稱三頁登入後骨架已完成實際並排對比。

## Review status

**Code review final gate：PASS（Critical 0）。**
仍需後續處理：正式環境 PAYUNi sandbox／production 憑證與 endpoint gate、官方 demo protected session 取得後補做 backend／course／checkout 登入後並排比對；本 change 是否能在產品驗收層標記完整，取決於是否接受上述官方 demo session 限制。
