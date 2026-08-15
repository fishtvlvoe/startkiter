# mvp-offer Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: Single MVP SKU price

The MVP product SHALL be one SKU that includes the course and lifetime private-kit updates. Checkout SHALL charge 8800 TWD and MUST NOT offer a second paid tier. The server MUST ignore client-supplied amounts and MUST write amount 8800 currency TWD on the Order.

#### Scenario: Checkout amount is 8800 TWD

- **WHEN** a signed-in buyer starts checkout for the MVP SKU
- **THEN** the order amount MUST be 8800 and the currency MUST be TWD

#### Scenario: Empty or zero price is rejected

- **WHEN** checkout order-building logic receives amount 0 or a missing amount
- **THEN** the request MUST fail closed and MUST NOT create a paid order

##### Example: 內部建單拒絕 amount 0

- 呼叫建單輔助函式時傳入 amount=0 或省略 amount
- 函式失敗且資料庫不出現 paid 狀態的 Order

#### Scenario: Client-supplied alternate amount is ignored

- **WHEN** a signed-in buyer posts POST /api/checkout with a body amount other than 8800
- **THEN** the created Order amount MUST still be 8800 and currency MUST be TWD


<!-- @trace
source: extract-payuni-checkout
updated: 2026-08-15
code:
  - packages/ui/tsconfig.json
  - packages/database/tsconfig.json
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/payments/src/order.ts
  - apps/saas/app/checkout/result/page.tsx
  - docs/discuss/architecture-draft.md
  - packages/payments/src/refund.ts
  - apps/saas/.env.example
  - packages/auth/src/auth.ts
  - docs/discuss/2026-08-14-alignment.md
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/database/package.json
  - apps/saas/tsconfig.json
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - package.json
  - packages/i18n/package.json
  - tsconfig.json
  - apps/saas/app/globals.css
  - packages/auth/package.json
  - docs/discuss/README.md
  - packages/database/src/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/database/prisma/schema.prisma
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - packages/utils/package.json
  - apps/saas/app/layout.tsx
  - packages/payments/src/credentials.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/ui/package.json
  - apps/saas/next-env.d.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/not-found.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - README.md
  - docs/discuss/extract-map.md
  - apps/saas/app/api/payuni/return/route.ts
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - packages/i18n/tsconfig.json
  - pnpm-workspace.yaml
  - apps/saas/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/index.ts
  - packages/auth/src/index.ts
  - turbo.json
  - apps/saas/app/app/page.tsx
  - packages/utils/src/index.ts
  - packages/utils/tsconfig.json
  - packages/auth/src/providers.ts
  - packages/auth/tsconfig.json
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - AGENTS.md
  - apps/saas/app/login/page.tsx
  - apps/saas/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - packages/payments/package.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - packages/ui/src/index.tsx
  - vitest.config.ts
  - apps/saas/app/api/payuni/notify/route.ts
tests:
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Course and kit are the same purchase

Payment of the MVP SKU SHALL grant course access and kit-claim eligibility together as boolean flags on the paid Order. The system MUST NOT sell the kit without the course or the course without kit eligibility. This change MUST set both flags true on paid and MUST NOT implement course playback or GitHub invitation APIs.

#### Scenario: Paid user receives both entitlement flags

- **WHEN** PAYUNi marks the MVP order paid
- **THEN** the order MUST have courseAccess true and kitClaimEligible true

##### Example: PAYUNi 通知付款完成後同時開通兩項旗標

- PAYUNi webhook 通知 orderNo 對應的 pending 訂單變為 paid
- 該 Order 的 courseAccess 與 kitClaimEligible 皆為 true

#### Scenario: Partial entitlement is forbidden

- **WHEN** an MVP order is marked paid
- **THEN** the system MUST NOT leave exactly one of courseAccess or kitClaimEligible true

##### Example: paid 不得只開一旗標

- notify 將 orderNo=SK-8800-003 標為 paid
- 資料列不得出現 (courseAccess=true, kitClaimEligible=false) 或相反組合；兩旗標皆必須為 true


<!-- @trace
source: extract-payuni-checkout
updated: 2026-08-15
code:
  - packages/ui/tsconfig.json
  - packages/database/tsconfig.json
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/payments/src/order.ts
  - apps/saas/app/checkout/result/page.tsx
  - docs/discuss/architecture-draft.md
  - packages/payments/src/refund.ts
  - apps/saas/.env.example
  - packages/auth/src/auth.ts
  - docs/discuss/2026-08-14-alignment.md
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/database/package.json
  - apps/saas/tsconfig.json
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - package.json
  - packages/i18n/package.json
  - tsconfig.json
  - apps/saas/app/globals.css
  - packages/auth/package.json
  - docs/discuss/README.md
  - packages/database/src/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/database/prisma/schema.prisma
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - packages/utils/package.json
  - apps/saas/app/layout.tsx
  - packages/payments/src/credentials.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/ui/package.json
  - apps/saas/next-env.d.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/not-found.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - README.md
  - docs/discuss/extract-map.md
  - apps/saas/app/api/payuni/return/route.ts
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - packages/i18n/tsconfig.json
  - pnpm-workspace.yaml
  - apps/saas/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/index.ts
  - packages/auth/src/index.ts
  - turbo.json
  - apps/saas/app/app/page.tsx
  - packages/utils/src/index.ts
  - packages/utils/tsconfig.json
  - packages/auth/src/providers.ts
  - packages/auth/tsconfig.json
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - AGENTS.md
  - apps/saas/app/login/page.tsx
  - apps/saas/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - packages/payments/package.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - packages/ui/src/index.tsx
  - vitest.config.ts
  - apps/saas/app/api/payuni/notify/route.ts
tests:
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: MVP SKU constant is startkiter-mvp

The only purchasable MVP sku SHALL be the string startkiter-mvp. Checkout and Order persistence MUST store this exact value.

#### Scenario: Created order stores canonical sku

- **WHEN** checkout succeeds for the MVP product
- **THEN** the Order.sku MUST equal startkiter-mvp

##### Example: 成功結帳寫入 canonical sku

- 已登入使用者對 POST /api/checkout 送出 sku=startkiter-mvp 且金鑰已設定
- 建立的 Order.sku 等於 startkiter-mvp

<!-- @trace
source: extract-payuni-checkout
updated: 2026-08-15
code:
  - packages/ui/tsconfig.json
  - packages/database/tsconfig.json
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/payments/src/order.ts
  - apps/saas/app/checkout/result/page.tsx
  - docs/discuss/architecture-draft.md
  - packages/payments/src/refund.ts
  - apps/saas/.env.example
  - packages/auth/src/auth.ts
  - docs/discuss/2026-08-14-alignment.md
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/database/package.json
  - apps/saas/tsconfig.json
  - apps/saas/next.config.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - package.json
  - packages/i18n/package.json
  - tsconfig.json
  - apps/saas/app/globals.css
  - packages/auth/package.json
  - docs/discuss/README.md
  - packages/database/src/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/database/prisma/schema.prisma
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - packages/utils/package.json
  - apps/saas/app/layout.tsx
  - packages/payments/src/credentials.ts
  - docs/discuss/v1-boundary.md
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/ui/package.json
  - apps/saas/next-env.d.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/not-found.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - README.md
  - docs/discuss/extract-map.md
  - apps/saas/app/api/payuni/return/route.ts
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - packages/i18n/tsconfig.json
  - pnpm-workspace.yaml
  - apps/saas/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/index.ts
  - packages/auth/src/index.ts
  - turbo.json
  - apps/saas/app/app/page.tsx
  - packages/utils/src/index.ts
  - packages/utils/tsconfig.json
  - packages/auth/src/providers.ts
  - packages/auth/tsconfig.json
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - AGENTS.md
  - apps/saas/app/login/page.tsx
  - apps/saas/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - packages/payments/package.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - packages/ui/src/index.tsx
  - vitest.config.ts
  - apps/saas/app/api/payuni/notify/route.ts
tests:
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/auth/src/auth.test.ts
-->