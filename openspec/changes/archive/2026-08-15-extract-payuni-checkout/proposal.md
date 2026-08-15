## Why

站殼與登入已落地，但還沒有訂單與收款路徑，無法驗證「8800 → 已付 → 雙重權益」這條錢路。現在抽出 PAYUNi 與 Order，讓後續課程與 GitHub 履約有 paid 旗標可掛。

## What Changes

- 新增 `packages/payments`：從 thetu 改寫抽 PAYUNi gateway／crypto／webhook 驗證與訂單抽象；預設閘道只允許 payuni
- 新增 Prisma `Order`（與 entitlement 欄位）掛在 user；遷移與 repository
- 新增 `POST /api/checkout`、`POST /api/payuni/notify`（及必要的 return 路由）於 `apps/saas`
- 新增結帳頁／銷售 CTA：金額鎖 8800 TWD、sku=`startkiter-mvp`；未登入導向登入
- 修改 `AGENTS.md`、`README.md`、`openspec/config.yaml`：標明現行施工為 `extract-payuni-checkout`
- 修改 `payuni-checkout` 與 `mvp-offer` 規格：補齊 session、SKU 常數、權益旗標與本刀可驗證的退款行為

## Non-Goals

- 不實作課程播放 UI、不抽 `packages/course`
- 不實作 GitHub claim／revoke API（只寫 kitClaimEligible 旗標；GitHub API 留給後續 change）
- 不接通 Shopline／Stripe；不抽發票／`@paid-tw/einvoice*`
- 不做 site-agent、不做 LINE 學員社群邀請 API
- 不修改任何來源 repo；不拷 libon.me
- 不部署正式環境、不買網域

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `payuni-checkout`: 補齊結帳需登入、缺金鑰 503、notify 冪等與退款後權益旗標行為（本刀不呼叫 GitHub API）
- `mvp-offer`: 鎖定 sku=`startkiter-mvp` 與 8800 TWD；付款成功同時開通 courseAccess 與 kitClaimEligible 旗標

## Impact

- Affected specs: payuni-checkout, mvp-offer
- Affected code:
  - New: packages/payments, packages/database/prisma（Order migration）, apps/saas/app/api/checkout, apps/saas/app/api/payuni, apps/saas 結帳相關頁面
  - Modified: packages/database/prisma/schema.prisma, AGENTS.md, README.md, openspec/config.yaml
  - Removed: (none)
- Dependencies 新增: 無新 npm 閘道 SDK（沿用 Node crypto／fetch；版本對齊現有 lockfile）
- 環境變數新增: PAYUNI_MERCHANT_ID, PAYUNI_HASH_KEY, PAYUNI_HASH_IV, PAYUNI_API_URL（或後台 SiteSetting 等價鍵；env 為 fallback）
