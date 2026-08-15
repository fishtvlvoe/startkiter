# test-clean-package-promotion Specification

## Purpose

TBD - created by archiving change 'test-to-clean-package-promotion'. Update Purpose after archive.

## Requirements

### Requirement: Two-repository boundary
The project SHALL maintain a TEST repository and a separate clean install-package repository. The TEST repository SHALL be private, named `test-<project-name>` for StartKiter (`test-startkiter`), and by design holds dirty dogfood content (test accounts, test media, install-tooling clutter, company content). The clean install-package repository SHALL contain only the shippable shell (app skeleton, frontend shell, database schema and required seeds) comparable in cleanliness to the purchased starter package. The learner lifetime kit repository SHALL remain a third, unrelated fulfillment line.

#### Scenario: Roles are distinct
- **WHEN** an operator asks which repository is for dirty deploy testing versus customer install package
- **THEN** documentation and this capability identify TEST as the dirty private dogfood deploy line and the clean install-package repository as the customer-facing package with no company marketing content

#### Scenario: Learner kit is not TEST
- **WHEN** a paid learner claims the GitHub kit
- **THEN** the invitation target MUST NOT be the TEST repository used for StartKiter dogfood deploy


<!-- @trace
source: test-to-clean-package-promotion
updated: 2026-08-15
code:
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - apps/saas/next-env.d.ts
  - pnpm-workspace.yaml
  - packages/ui/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/ui/package.json
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/extract-map.md
  - packages/course/tsconfig.json
  - packages/auth/src/auth.ts
  - AGENTS.md
  - apps/saas/app/layout.tsx
  - packages/auth/package.json
  - packages/ui/src/index.tsx
  - README.md
  - turbo.json
  - package.json
  - apps/saas/app/login/page.tsx
  - apps/saas/app/globals.css
  - packages/database/prisma/schema.prisma
  - apps/saas/app/app/page.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - packages/database/package.json
  - apps/saas/package.json
  - docs/deploy-and-public-url.md
  - vitest.config.ts
  - packages/utils/src/index.ts
  - packages/payments/src/factory.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/course/src/access.ts
  - packages/payments/src/memory-store.ts
  - packages/auth/src/providers.ts
  - tsconfig.json
  - apps/saas/lib/course-access.ts
  - packages/course/package.json
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - packages/payments/package.json
  - packages/course/src/catalog.ts
  - packages/payments/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/auth/tsconfig.json
  - packages/payments/src/refund.ts
  - packages/database/src/index.ts
  - packages/i18n/tsconfig.json
  - tooling/typescript/base.json
  - apps/saas/app/login/login-form.tsx
  - apps/saas/tsconfig.json
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course/src/playback.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/auth/src/index.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/page.tsx
  - docs/discuss/2026-08-14-alignment.md
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/i18n/package.json
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/utils/tsconfig.json
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/course/page.tsx
  - docs/discuss/architecture-draft.md
  - docs/discuss/README.md
  - apps/saas/lib/demo-grant.ts
  - packages/auth/src/test-auth.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/constants.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/src/checkout.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/payments/src/credentials.ts
  - packages/course/src/index.ts
tests:
  - packages/auth/src/auth.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/course/src/playback.test.ts
-->

---
### Requirement: Promotion gate from TEST to clean package
Material MUST move from TEST into the clean install-package repository only through an explicit promotion that passes the promotion checklist. Renaming the dirty TEST repository to serve as the clean package, or publishing the dirty TEST history as the customer package, is forbidden.

#### Scenario: Explicit promotion required
- **WHEN** a feature exists only on TEST
- **THEN** it MUST NOT appear in the clean install-package repository until promotion checklist items pass

#### Scenario: Forbidden rename path
- **WHEN** someone proposes shipping customers from the dirty TEST repository by renaming or repointing production to TEST
- **THEN** that approach is rejected by this capability


<!-- @trace
source: test-to-clean-package-promotion
updated: 2026-08-15
code:
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - apps/saas/next-env.d.ts
  - pnpm-workspace.yaml
  - packages/ui/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/ui/package.json
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/extract-map.md
  - packages/course/tsconfig.json
  - packages/auth/src/auth.ts
  - AGENTS.md
  - apps/saas/app/layout.tsx
  - packages/auth/package.json
  - packages/ui/src/index.tsx
  - README.md
  - turbo.json
  - package.json
  - apps/saas/app/login/page.tsx
  - apps/saas/app/globals.css
  - packages/database/prisma/schema.prisma
  - apps/saas/app/app/page.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - packages/database/package.json
  - apps/saas/package.json
  - docs/deploy-and-public-url.md
  - vitest.config.ts
  - packages/utils/src/index.ts
  - packages/payments/src/factory.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/course/src/access.ts
  - packages/payments/src/memory-store.ts
  - packages/auth/src/providers.ts
  - tsconfig.json
  - apps/saas/lib/course-access.ts
  - packages/course/package.json
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - packages/payments/package.json
  - packages/course/src/catalog.ts
  - packages/payments/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/auth/tsconfig.json
  - packages/payments/src/refund.ts
  - packages/database/src/index.ts
  - packages/i18n/tsconfig.json
  - tooling/typescript/base.json
  - apps/saas/app/login/login-form.tsx
  - apps/saas/tsconfig.json
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course/src/playback.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/auth/src/index.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/page.tsx
  - docs/discuss/2026-08-14-alignment.md
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/i18n/package.json
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/utils/tsconfig.json
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/course/page.tsx
  - docs/discuss/architecture-draft.md
  - docs/discuss/README.md
  - apps/saas/lib/demo-grant.ts
  - packages/auth/src/test-auth.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/constants.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/src/checkout.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/payments/src/credentials.ts
  - packages/course/src/index.ts
tests:
  - packages/auth/src/auth.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/course/src/playback.test.ts
-->

---
### Requirement: Promotion forbid list
Promotion into the clean install-package repository MUST exclude company Landing pages and article content, test accounts and test media, install-tooling clutter that is not part of the shippable shell, company-specific domains and credential examples, and Cloudflare Tunnel as an OAuth or integration-test primary path.

#### Scenario: Company landing stays on TEST
- **WHEN** TEST contains company Landing or article pages
- **THEN** promotion MUST NOT copy those pages into the clean install-package repository

#### Scenario: Tunnel is not the primary public test path
- **WHEN** OAuth or integration testing needs a public HTTPS URL
- **THEN** the system of record MUST direct operators to the TEST hosted deploy (for example Vercel or VPS) with cloud database, not Cloudflare Tunnel to localhost as the primary path


<!-- @trace
source: test-to-clean-package-promotion
updated: 2026-08-15
code:
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - apps/saas/next-env.d.ts
  - pnpm-workspace.yaml
  - packages/ui/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/ui/package.json
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/extract-map.md
  - packages/course/tsconfig.json
  - packages/auth/src/auth.ts
  - AGENTS.md
  - apps/saas/app/layout.tsx
  - packages/auth/package.json
  - packages/ui/src/index.tsx
  - README.md
  - turbo.json
  - package.json
  - apps/saas/app/login/page.tsx
  - apps/saas/app/globals.css
  - packages/database/prisma/schema.prisma
  - apps/saas/app/app/page.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - packages/database/package.json
  - apps/saas/package.json
  - docs/deploy-and-public-url.md
  - vitest.config.ts
  - packages/utils/src/index.ts
  - packages/payments/src/factory.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/course/src/access.ts
  - packages/payments/src/memory-store.ts
  - packages/auth/src/providers.ts
  - tsconfig.json
  - apps/saas/lib/course-access.ts
  - packages/course/package.json
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - packages/payments/package.json
  - packages/course/src/catalog.ts
  - packages/payments/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/auth/tsconfig.json
  - packages/payments/src/refund.ts
  - packages/database/src/index.ts
  - packages/i18n/tsconfig.json
  - tooling/typescript/base.json
  - apps/saas/app/login/login-form.tsx
  - apps/saas/tsconfig.json
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course/src/playback.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/auth/src/index.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/page.tsx
  - docs/discuss/2026-08-14-alignment.md
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/i18n/package.json
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/utils/tsconfig.json
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/course/page.tsx
  - docs/discuss/architecture-draft.md
  - docs/discuss/README.md
  - apps/saas/lib/demo-grant.ts
  - packages/auth/src/test-auth.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/constants.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/src/checkout.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/payments/src/credentials.ts
  - packages/course/src/index.ts
tests:
  - packages/auth/src/auth.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/course/src/playback.test.ts
-->

---
### Requirement: Hotfix flow
After the clean install-package repository has been published to customers, security and correctness hotfixes MUST land in the clean install-package repository first, then be backported to TEST. Before any customer publication of the clean package, hotfixes SHALL land on TEST only and SHALL be promoted later.

#### Scenario: Post-publish hotfix order
- **WHEN** the clean package has been given to customers and a security fix is required
- **THEN** the fix MUST be applied to the clean install-package repository before or as the source of truth, and MUST be backported to TEST

#### Scenario: Pre-publish hotfix on TEST only
- **WHEN** the clean package has not yet been published to customers
- **THEN** the hotfix SHALL land on TEST only and SHALL be promoted later


<!-- @trace
source: test-to-clean-package-promotion
updated: 2026-08-15
code:
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - apps/saas/next-env.d.ts
  - pnpm-workspace.yaml
  - packages/ui/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/ui/package.json
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/extract-map.md
  - packages/course/tsconfig.json
  - packages/auth/src/auth.ts
  - AGENTS.md
  - apps/saas/app/layout.tsx
  - packages/auth/package.json
  - packages/ui/src/index.tsx
  - README.md
  - turbo.json
  - package.json
  - apps/saas/app/login/page.tsx
  - apps/saas/app/globals.css
  - packages/database/prisma/schema.prisma
  - apps/saas/app/app/page.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - packages/database/package.json
  - apps/saas/package.json
  - docs/deploy-and-public-url.md
  - vitest.config.ts
  - packages/utils/src/index.ts
  - packages/payments/src/factory.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/course/src/access.ts
  - packages/payments/src/memory-store.ts
  - packages/auth/src/providers.ts
  - tsconfig.json
  - apps/saas/lib/course-access.ts
  - packages/course/package.json
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - packages/payments/package.json
  - packages/course/src/catalog.ts
  - packages/payments/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/auth/tsconfig.json
  - packages/payments/src/refund.ts
  - packages/database/src/index.ts
  - packages/i18n/tsconfig.json
  - tooling/typescript/base.json
  - apps/saas/app/login/login-form.tsx
  - apps/saas/tsconfig.json
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course/src/playback.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/auth/src/index.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/page.tsx
  - docs/discuss/2026-08-14-alignment.md
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/i18n/package.json
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/utils/tsconfig.json
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/course/page.tsx
  - docs/discuss/architecture-draft.md
  - docs/discuss/README.md
  - apps/saas/lib/demo-grant.ts
  - packages/auth/src/test-auth.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/constants.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/src/checkout.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/payments/src/credentials.ts
  - packages/course/src/index.ts
tests:
  - packages/auth/src/auth.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/course/src/playback.test.ts
-->

---
### Requirement: Drift acknowledgment and review cadence
Operators SHALL treat running TEST content and the clean install-package contents as intentionally different until promotion. After each feature change is archived, operators SHALL review whether any clean-package-eligible material needs promotion.

#### Scenario: Dogfood differs from package
- **WHEN** TEST has experimental UI that has not been promoted
- **THEN** the clean install-package repository MUST remain without that experimental UI

#### Scenario: Post-archive promotion review
- **WHEN** a feature Spectra change is archived
- **THEN** operators SHALL check the promotion checklist for any material that must move into the clean install-package repository

<!-- @trace
source: test-to-clean-package-promotion
updated: 2026-08-15
code:
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/i18n/src/index.ts
  - packages/payments/src/notify.ts
  - apps/saas/next-env.d.ts
  - pnpm-workspace.yaml
  - packages/ui/tsconfig.json
  - apps/saas/app/app/sign-out-button.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/prisma/migrations/migration_lock.toml
  - packages/ui/package.json
  - tooling/typescript/package.json
  - packages/payments/src/order.ts
  - docs/discuss/extract-map.md
  - packages/course/tsconfig.json
  - packages/auth/src/auth.ts
  - AGENTS.md
  - apps/saas/app/layout.tsx
  - packages/auth/package.json
  - packages/ui/src/index.tsx
  - README.md
  - turbo.json
  - package.json
  - apps/saas/app/login/page.tsx
  - apps/saas/app/globals.css
  - packages/database/prisma/schema.prisma
  - apps/saas/app/app/page.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - packages/database/package.json
  - apps/saas/package.json
  - docs/deploy-and-public-url.md
  - vitest.config.ts
  - packages/utils/src/index.ts
  - packages/payments/src/factory.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - apps/saas/next.config.ts
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - packages/course/src/access.ts
  - packages/payments/src/memory-store.ts
  - packages/auth/src/providers.ts
  - tsconfig.json
  - apps/saas/lib/course-access.ts
  - packages/course/package.json
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - packages/payments/package.json
  - packages/course/src/catalog.ts
  - packages/payments/src/index.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - packages/auth/tsconfig.json
  - packages/payments/src/refund.ts
  - packages/database/src/index.ts
  - packages/i18n/tsconfig.json
  - tooling/typescript/base.json
  - apps/saas/app/login/login-form.tsx
  - apps/saas/tsconfig.json
  - apps/saas/app/api/payuni/notify/route.ts
  - packages/course/src/playback.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - packages/auth/src/index.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - apps/saas/app/page.tsx
  - docs/discuss/2026-08-14-alignment.md
  - packages/database/tsconfig.json
  - packages/utils/package.json
  - packages/i18n/package.json
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/utils/tsconfig.json
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/course/page.tsx
  - docs/discuss/architecture-draft.md
  - docs/discuss/README.md
  - apps/saas/lib/demo-grant.ts
  - packages/auth/src/test-auth.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/constants.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/api/course/lessons/route.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - packages/payments/src/checkout.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - packages/payments/src/credentials.ts
  - packages/course/src/index.ts
tests:
  - packages/auth/src/auth.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/catalog.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/order.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/course/src/playback.test.ts
-->