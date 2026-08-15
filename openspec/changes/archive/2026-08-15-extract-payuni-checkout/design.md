## Context

`extract-shell-auth` 已落地 `apps/saas` 與 Better Auth；`openspec/specs/payuni-checkout` 與 `mvp-offer` 已定義收款行為，但程式尚未接通。本刀只做「登入 → 結帳 8800 → PAYUNi notify → Order paid + 雙重權益旗標」。來源只讀：`/Users/fishtv/Development/THE-TU-Project/dev/thetu/lib/payment/payuni-gateway.ts`、`payuni-crypto.ts`、閘道工廠／訂單抽象（改寫抽，拿掉 course／bundle）。

## Goals / Non-Goals

Goals:

- 已登入使用者可對單一 SKU 建立 PENDING Order 並啟動 PAYUNi 一次買斷
- 缺金鑰時 POST /api/checkout 回 503，不得 500
- 有效 notify 將訂單標 paid，並同時開通 courseAccess 與 kitClaimEligible
- 重複 notify 冪等；簽章失敗回 400
- 退款狀態清除兩項權益旗標（本刀不呼叫 GitHub API）

Non-Goals:

- 課程播放、GitHub claim／collaborator revoke、發票、Shopline／Stripe 接線
- site-agent、LINE 學員社群 API
- 修改來源 repo

## Decisions

### Decision: 改寫抽 PAYUNi，預設閘道鎖 payuni

從 thetu 抽 crypto／gateway／類型，拿掉 course 欄位與 shopline 預設。工廠只允許建立 payuni session；其他 gateway 名稱不得進入結帳路徑。

Alternatives Considered:

- 原樣抽整包 gateway-factory（含 shopline 預設）→ 否決：違反 MVP 只通 PAYUNi
- 從零重寫檢查碼 → 否決：簽章錯誤成本高，必須沿用 thetu crypto

### Decision: Order 掛 user，權益用欄位而非獨立 entitlement 表

Prisma Order：id、orderNo、userId、sku、amount、currency、status（pending｜paid｜refunded）、paymentGateway、gatewayTradeNo、paidAt、refundedAt、courseAccess、kitClaimEligible、createdAt、updatedAt。userId 有 index；orderNo／gatewayTradeNo unique。

Alternatives Considered:

- 獨立 Entitlement 表 → 否決：MVP 單一 SKU，多一層 join 無必要
- 沿用 supastarter Purchase + Stripe priceId → 否決：幣別與閘道模型不合

### Decision: Checkout 必須有 session；金額與 SKU 由伺服器鎖定

POST /api/checkout 讀 session；無 session → 401。amount 固定 8800、currency=TWD、sku=`startkiter-mvp`；忽略或拒絕客戶端改價。客戶端送其他 sku → 400。

Alternatives Considered:

- 允許訪客結帳再綁帳 → 否決：權益掛 user，訪客無掛點
- 信任客戶端 amount → 否決：可被竄改

### Decision: 金鑰 DB 優先、env fallback；缺則 fail-closed 503

讀取契約固定為 settings → env。本刀必須實作可替換的 settings 讀取介面；若尚未有 PaymentSettings 表／UI，settings 回傳空、實際值走 env，但呼叫順序不得改成「只讀 env」。缺 MERCHANT_ID／HASH_KEY／HASH_IV 任一 → 503 + 明確設定錯誤碼，不得拋未處理例外變 500。

Alternatives Considered:

- 永久只准 env、不做 settings 讀取介面 → 否決：違反「金鑰填後台」產品決策
- 缺金鑰時回 500 → 否決：規格要求 503

### Decision: 退款本刀只改訂單與旗標，不呼叫 GitHub

管理或 webhook 將 status=refunded 時，courseAccess=false、kitClaimEligible=false。GitHub collaborator 撤銷留給 `github-kit-fulfillment` change；本刀測試不斷言 GitHub HTTP。

Alternatives Considered:

- 本刀同時實作 GitHub revoke → 否決：超出垂直片範圍，依賴未抽的 GitHub OAuth
- 退款只改 status 不改旗標 → 否決：後續模組會誤開通

### Decision: 來源對應採白名單改寫抽，禁止改來源

| 來源 | 目標 |
|------|------|
| thetu `lib/payment/payuni-crypto.ts` | `packages/payments/src/provider/payuni/crypto.ts` |
| thetu `lib/payment/payuni-gateway.ts` | `packages/payments/src/provider/payuni/gateway.ts` |
| thetu payment types／shared（精簡） | `packages/payments/src/types.ts`、`shared.ts` |
| （新做）checkout／notify 路由 | `apps/saas/app/api/checkout/route.ts`、`apps/saas/app/api/payuni/notify/route.ts` |

Alternatives Considered:

- 直接改 thetu 再 symlink → 否決：禁止改來源、禁止耦合
- 拷貝 shopline 一併進來當死碼 → 否決：易被誤接通

## Implementation Contract

In scope:

- `packages/payments` 可建立 PAYUNi form_post／redirect session（依 thetu 契約），驗證 notify 簽章與 trade no
- POST /api/checkout：401（無 session）／400（非法 sku）／503（缺金鑰）／200（含付款表單或 redirect 資料 + orderNo）
- POST /api/payuni/notify：200 標 paid 並設兩旗標 true；重複 200 不雙重開通；簽章失敗 400
- 退款路徑（內部函式或最小 admin／test hook）：status=refunded 且兩旗標 false
- Vitest：金額鎖定、fail-closed 503、notify 冪等、退款清旗標
- 最小結帳結果頁：能把 checkout 回傳的 PAYUNi form_post／redirect 資料渲染成可送出付款的頁面

Out of scope:

- GET／POST `/api/github/*`、課程串流、發票開立、Shopline checkout UI

Acceptance:

- `pnpm test` 涵蓋上述 focused 測試全綠
- `rg` 確認 apps/saas 無可用的 shopline／stripe checkout 成功路徑
- 來源 thetu／supastarter 檔案 mtime 不被本刀寫入
- 結帳結果頁可觀察到 PAYUNi 送出表單欄位或 redirect 目標

## Risks / Trade-offs

[Risk] PAYUNi 沙箱與正式檢查碼欄位差異 → Mitigation：crypto 原樣抽自 thetu，用 fixture 測簽章，不手改演算法

[Risk] 無設定表時「後台填金鑰」做不到 → Mitigation：本刀先以 settings 空＋env fallback 通關；PaymentSettings UI 記在 Open Questions，不擋收款路徑

[Risk] 規格原文提到 POST /api/github/claim 403 → Mitigation：delta 改寫為旗標契約；GitHub 路由在後續 change 讀同一旗標

[Risk] form_post 中繼頁遺漏 → Mitigation：checkout 200 必須回傳可渲染的 PAYUNi 送出資料；tasks 必須含最小結帳結果頁（見 3.5）

## Migration Plan

1. 新增 Prisma Order migration 並套用
2. 新增 packages/payments 與 API 路由
3. 設定 env 後本機跑一筆 sandbox notify fixture
4. 回滾：revert migration（drop Order）、移除 payments 路由與套件；不影響 auth 表

## Open Questions

- 後台 PaymentSettings UI 是否必須同刀完成，或本刀僅 env + repository 介面？（預設：介面 + env，UI 可最小或下一刀）
- PAYUNi return URL 與 notify URL 的公開網域在本機用什麼 tunnel 慣例？（不阻塞：規格用相對路徑 `/api/payuni/notify`）
