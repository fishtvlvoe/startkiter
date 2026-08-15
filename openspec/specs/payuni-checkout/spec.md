# payuni-checkout Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: PAYUNi is the only MVP gateway

MVP checkout SHALL use PAYUNi for one-time TWD payments. Shopline, Stripe, and Polar MUST NOT accept MVP funds. The checkout amount and sku MUST be server-locked to 8800 TWD and startkiter-mvp.

#### Scenario: Checkout uses PAYUNi

- **WHEN** a signed-in buyer submits POST /api/checkout for sku startkiter-mvp
- **THEN** the server MUST start a PAYUNi one-time TWD session and MUST NOT redirect to Shopline, Stripe, or Polar

##### Example: 買家送出結帳建立 PAYUNi session

- 已登入買家 alice@example.com 對 POST /api/checkout 送出 sku=startkiter-mvp
- 伺服器建立 PAYUNi 一次性 TWD 8800 元付款 session，不導向 Shopline、Stripe 或 Polar

#### Scenario: Unconfigured PAYUNi fails closed

- **WHEN** PAYUNi keys are missing and a signed-in client calls POST /api/checkout
- **THEN** the response MUST be HTTP 503 with an explicit configuration error and MUST NOT be HTTP 500

#### Scenario: Client-supplied alternate sku is rejected

- **WHEN** a signed-in buyer submits POST /api/checkout with a sku other than startkiter-mvp
- **THEN** the response MUST be HTTP 400 and MUST NOT create a paid order


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
### Requirement: Webhook marks a single order paid

POST /api/payuni/notify SHALL verify the PAYUNi payload and mark at most one matching order paid. Duplicate notifications MUST be idempotent. On first paid transition the order MUST set courseAccess true and kitClaimEligible true.

#### Scenario: First successful notify pays the order

- **WHEN** a valid PAYUNi paid notify arrives for a pending order
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and the order status MUST become paid and courseAccess MUST be true and kitClaimEligible MUST be true

#### Scenario: Duplicate notify does not double-grant

- **WHEN** the same valid paid notify is posted again
- **THEN** POST /api/payuni/notify MUST return HTTP 200 and MUST NOT create a second order and MUST NOT flip entitlement flags from a consistent paid state into a duplicate grant side effect

#### Scenario: Invalid notify is rejected

- **WHEN** POST /api/payuni/notify receives a payload that fails signature or trade-no matching
- **THEN** the response MUST be HTTP 400 and the order MUST remain pending


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
### Requirement: Refund revokes kit eligibility

A refunded MVP order SHALL revoke kit claim eligibility and course access on the order record via kitClaimEligible false and courseAccess false. Course playback and GitHub collaborator revocation that depend on those flags MUST be implemented by later changes that read the same flags. While POST /api/github/claim is not implemented in this change, any future claim handler MUST treat refunded orders as ineligible.

#### Scenario: Refunded order loses kit eligibility flag

- **WHEN** the MVP order status is refunded
- **THEN** kitClaimEligible MUST be false and courseAccess MUST be false

##### Example: refunded 列可被後續 claim 讀取

- Order orderNo=SK-8800-002 status=refunded、kitClaimEligible=false、courseAccess=false
- 查詢該列時兩旗標皆為 false

#### Scenario: Refunded eligibility is durable for later claim handlers

- **WHEN** the MVP order status is refunded and a later change implements POST /api/github/claim
- **THEN** that handler MUST deny claims for the refunded order by reading kitClaimEligible

##### Example: 未來 claim 依旗標拒絕

- Order orderNo=SK-8800-002 kitClaimEligible=false
- 未來 POST /api/github/claim 讀到該旗標後 MUST 拒絕（預期 HTTP 403），不得呼叫 GitHub 邀請 API


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
### Requirement: Checkout requires an authenticated session

POST /api/checkout SHALL require a valid Better Auth session bound to a user. Unauthenticated requests MUST NOT create an Order.

#### Scenario: Unauthenticated checkout is rejected

- **WHEN** POST /api/checkout is called without a session
- **THEN** the response MUST be HTTP 401 and MUST NOT create an Order row

#### Scenario: Authenticated checkout creates a pending order

- **WHEN** a signed-in user calls POST /api/checkout with sku startkiter-mvp and PAYUNi keys are configured
- **THEN** the response MUST be HTTP 200 and an Order MUST exist with status pending, amount 8800, currency TWD, sku startkiter-mvp, and paymentGateway payuni


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
### Requirement: Refund clears entitlement flags on the order

When an MVP order status becomes refunded, the system SHALL set courseAccess to false and kitClaimEligible to false on that order. This change MUST NOT call the GitHub API. Enforcement of POST /api/github/claim HTTP 403 is deferred to the github-kit-fulfillment implementation that reads kitClaimEligible.

#### Scenario: Refund clears both flags

- **WHEN** a paid MVP order is marked refunded
- **THEN** the order status MUST be refunded and courseAccess MUST be false and kitClaimEligible MUST be false

##### Example: paid 訂單退款後雙旗標關閉

- Order orderNo=SK-8800-001 原為 paid、courseAccess=true、kitClaimEligible=true
- 執行退款標記後 status=refunded，且 courseAccess=false、kitClaimEligible=false

#### Scenario: Refund does not call GitHub in this change

- **WHEN** a paid MVP order is marked refunded
- **THEN** the refund path MUST NOT invoke the GitHub collaborator API

##### Example: 退款路徑無 GitHub HTTP

- 對 orderNo=SK-8800-001 執行退款標記，測試 spy 監看 GitHub API
- 退款完成且 spy 記錄為零次 collaborator add／remove 呼叫

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
### Requirement: Checkout callback URLs use the public HTTPS base
PAYUNi ReturnURL and NotifyURL SHALL be built from BETTER_AUTH_URL when set, so TEST deployments on the custom domain receive browser return and server notify on the same public origin.

#### Scenario: Base URL prefers BETTER_AUTH_URL
- **WHEN** checkout creates a PAYUNi session and BETTER_AUTH_URL is https://startkiter.aiver.me
- **THEN** ReturnURL and NotifyURL MUST start with https://startkiter.aiver.me/api/payuni/

<!-- @trace
source: mvp-dogfood-remaining
updated: 2026-08-15
code:
  - apps/saas/app/globals.css
  - apps/saas/app/course/kit-claim-panel.tsx
  - packages/course/src/catalog.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/.env.example
  - apps/saas/lib/support-email.ts
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/components/site-footer.tsx
  - apps/saas/lib/public-base-url.ts
  - docs/deploy-and-public-url.md
  - apps/saas/app/layout.tsx
  - vitest.config.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/app/api/checkout/route.ts
tests:
  - apps/saas/lib/support-email.test.ts
  - apps/saas/lib/public-base-url.test.ts
  - packages/course/src/catalog.test.ts
-->

---
### Requirement: Checkout credentials prefer admin settings then env
POST /api/checkout MUST resolve PAYUNi credentials by reading encrypted admin settings first and falling back to PAYUNI_MERCHANT_ID, PAYUNI_HASH_KEY, PAYUNI_HASH_IV, and PAYUNI_API_URL when settings are empty, missing, or undecryptable. Invalid decrypt MUST NOT cause HTTP 500. If both sources lack merchantId, hashKey, or hashIV, the response MUST remain HTTP 503 with an explicit configuration error.

#### Scenario: Settings override env
- **WHEN** admin settings store merchantId FROM_SETTINGS and env PAYUNI_MERCHANT_ID is FROM_ENV and remaining keys are valid
- **THEN** the PAYUNi session MUST use merchantId FROM_SETTINGS

##### Example: settings win
- **GIVEN** settings merchantId=FROM_SETTINGS and env PAYUNI_MERCHANT_ID=FROM_ENV with valid hashKey and hashIV in settings
- **WHEN** a signed-in buyer calls POST /api/checkout
- **THEN** EncryptInfo construction MUST use FROM_SETTINGS not FROM_ENV

#### Scenario: Env used when settings empty
- **WHEN** no payuni settings row exists and env has a complete valid key set
- **THEN** POST /api/checkout MUST return HTTP 200 and MUST NOT return HTTP 503

#### Scenario: Corrupt ciphertext falls back
- **WHEN** the payuni settings ciphertext cannot be decrypted and env has a complete valid key set
- **THEN** POST /api/checkout MUST return HTTP 200 using env and MUST NOT return HTTP 500

<!-- @trace
source: operator-payuni-settings
updated: 2026-08-15
code:
  - apps/saas/app/admin/settings/payuni-settings-form.tsx
  - apps/saas/app/api/checkout/route.ts
  - apps/saas/lib/orders.ts
  - apps/saas/lib/site-settings.ts
  - apps/saas/lib/settings-crypto.ts
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/api/admin/settings/payuni/route.ts
  - apps/saas/app/admin/settings/page.tsx
  - apps/saas/lib/payuni-settings-view.ts
  - apps/saas/.env.example
  - apps/saas/lib/operator.ts
  - packages/database/prisma/migrations/20260815040000_add_site_setting/migration.sql
  - packages/database/prisma/schema.prisma
  - docs/deploy-and-public-url.md
  - packages/payments/src/index.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/lib/payuni-settings.ts
tests:
  - apps/saas/lib/operator.test.ts
  - apps/saas/lib/orders-credentials.test.ts
  - apps/saas/lib/payuni-settings-view.test.ts
  - apps/saas/lib/payuni-settings.test.ts
  - apps/saas/lib/site-settings.test.ts
  - apps/saas/lib/settings-crypto.test.ts
-->