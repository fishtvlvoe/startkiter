# site-agent Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: Conversation can use configured model providers

The site-agent module SHALL send learner messages to one configured provider among Gemini, OpenAI, and Claude (Anthropic). Missing provider keys MUST fail closed with HTTP 503 on chat. Unauthenticated requests MUST NOT reach any provider.

#### Scenario: Chat with a configured provider

- **WHEN** a signed-in user posts POST /api/agent/chat with a non-empty message and a provider key is present
- **THEN** the response MUST be HTTP 200 and MUST include an assistant message

##### Example: OpenAI key 存在

- OPENAI_API_KEY 已設、user 已登入、message="你好"
- POST /api/agent/chat → 200 含 assistantMessage

#### Scenario: Empty message is rejected

- **WHEN** POST /api/agent/chat is called with an empty string message
- **THEN** the response MUST be HTTP 400

#### Scenario: Unconfigured provider fails closed

- **WHEN** POST /api/agent/chat is called and no provider key is configured
- **THEN** the response MUST be HTTP 503 and MUST NOT be HTTP 500

#### Scenario: Unauthenticated chat is rejected

- **WHEN** POST /api/agent/chat is called without a session
- **THEN** the response MUST be HTTP 401 and no provider MUST be called

##### Example: 未登入呼叫 chat

- 請求無 session cookie，message="你好"
- POST /api/agent/chat → 401，測試 spy 記錄 provider 呼叫零次


<!-- @trace
source: extract-site-agent
updated: 2026-08-15
code:
  - apps/saas/app/api/agent/chat/route.ts
  - packages/i18n/tsconfig.json
  - AGENTS.md
  - apps/saas/package.json
  - packages/github-kit/src/github-app-client.ts
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/src/notify.ts
  - packages/github-kit/src/index.ts
  - packages/ui/package.json
  - apps/saas/app/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/site-agent/src/tools.ts
  - packages/github-kit/src/claim.ts
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/github-kit/src/types.ts
  - tsconfig.json
  - apps/saas/app/api/community/line-invite/route.ts
  - packages/i18n/src/index.ts
  - packages/github-kit/tsconfig.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - apps/saas/app/agent/page.tsx
  - packages/course/src/catalog.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - apps/saas/next-env.d.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/github/claim/route.ts
  - packages/auth/src/providers.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - apps/saas/app/api/github/claim-status/route.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - docs/deploy-and-public-url.md
  - package.json
  - packages/site-agent/src/types.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - vitest.config.ts
  - packages/payments/package.json
  - packages/payments/src/refund.ts
  - apps/saas/lib/course-access.ts
  - docs/autonomous-apply-loop.md
  - packages/course/src/index.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/.env.example
  - packages/site-agent/package.json
  - packages/site-agent/tsconfig.json
  - packages/ui/tsconfig.json
  - apps/saas/app/course/line-community-panel.tsx
  - apps/saas/lib/github-kit.ts
  - apps/saas/tsconfig.json
  - docs/discuss/extract-map.md
  - docs/discuss/2026-08-14-alignment.md
  - packages/course/src/playback.ts
  - packages/database/package.json
  - packages/utils/tsconfig.json
  - packages/github-kit/src/config.ts
  - turbo.json
  - packages/ui/src/index.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/tsconfig.json
  - packages/i18n/package.json
  - packages/database/src/index.ts
  - packages/github-kit/src/revoke.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/login/page.tsx
  - packages/site-agent/src/index.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/api/course/lessons/route.ts
  - apps/saas/app/page.tsx
  - packages/course/tsconfig.json
  - packages/payments/src/checkout.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/layout.tsx
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/next.config.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/order.ts
  - packages/site-agent/src/chat.ts
  - README.md
  - packages/auth/tsconfig.json
  - pnpm-workspace.yaml
  - packages/course/src/access.ts
  - apps/saas/lib/demo-grant.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/app/login/login-form.tsx
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - packages/site-agent/src/provider.ts
  - packages/course/package.json
  - packages/utils/package.json
  - packages/utils/src/index.ts
  - apps/saas/lib/agent-data.ts
  - docs/discuss/README.md
  - apps/saas/app/globals.css
  - apps/saas/app/course/page.tsx
  - apps/saas/app/course/kit-claim-panel.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/auth/src/auth.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/github-kit/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - docs/discuss/architecture-draft.md
  - apps/saas/app/api/checkout/route.ts
  - packages/course/src/line-invite.ts
  - packages/auth/src/index.ts
  - packages/payments/src/index.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/auth/package.json
tests:
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/auth/src/auth.test.ts
  - packages/payments/src/order.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/site-agent/src/chat.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/playback.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/refund.test.ts
  - packages/course/src/line-invite.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/course/src/catalog.test.ts
  - packages/github-kit/src/config.test.ts
-->

---
### Requirement: V1 tools are read-only self-scoped

The agent tool registry SHALL contain exactly two tools in MVP: get_my_orders and get_my_course_progress. Both MUST read only the authenticated user's data. Write tools MUST NOT be registered.

#### Scenario: Orders tool returns only the caller

- **WHEN** get_my_orders runs for user A
- **THEN** the tool result MUST include only user A's orders and MUST NOT include another user's orders

#### Scenario: Progress tool returns only the caller

- **WHEN** get_my_course_progress runs for user A
- **THEN** the tool result MUST include only user A's lesson progress (or not_tracked entries scoped to user A)

#### Scenario: Unauthenticated tool call is rejected

- **WHEN** a tool call is attempted without a session
- **THEN** the agent MUST refuse the tool and MUST NOT query orders or course_progress

#### Scenario: Unknown tool is rejected

- **WHEN** the model requests a tool other than get_my_orders or get_my_course_progress
- **THEN** the server MUST reject that tool call and MUST NOT execute it

<!-- @trace
source: extract-site-agent
updated: 2026-08-15
code:
  - apps/saas/app/api/agent/chat/route.ts
  - packages/i18n/tsconfig.json
  - AGENTS.md
  - apps/saas/package.json
  - packages/github-kit/src/github-app-client.ts
  - apps/saas/app/app/sign-out-button.tsx
  - packages/payments/src/notify.ts
  - packages/github-kit/src/index.ts
  - packages/ui/package.json
  - apps/saas/app/app/page.tsx
  - apps/saas/lib/orders.ts
  - apps/saas/app/checkout/page.tsx
  - packages/payments/src/memory-store.ts
  - packages/site-agent/src/tools.ts
  - packages/github-kit/src/claim.ts
  - apps/saas/app/checkout/checkout-button.tsx
  - packages/github-kit/src/types.ts
  - tsconfig.json
  - apps/saas/app/api/community/line-invite/route.ts
  - packages/i18n/src/index.ts
  - packages/github-kit/tsconfig.json
  - packages/auth/src/test-auth.ts
  - packages/payments/src/constants.ts
  - apps/saas/app/agent/page.tsx
  - packages/course/src/catalog.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - apps/saas/next-env.d.ts
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/github/claim/route.ts
  - packages/auth/src/providers.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/provider/payuni/gateway.ts
  - apps/saas/app/api/github/claim-status/route.ts
  - apps/saas/app/course/demo-grant-button.tsx
  - docs/deploy-and-public-url.md
  - package.json
  - packages/site-agent/src/types.ts
  - apps/saas/app/api/demo/grant-course/route.ts
  - vitest.config.ts
  - packages/payments/package.json
  - packages/payments/src/refund.ts
  - apps/saas/lib/course-access.ts
  - docs/autonomous-apply-loop.md
  - packages/course/src/index.ts
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/.env.example
  - packages/site-agent/package.json
  - packages/site-agent/tsconfig.json
  - packages/ui/tsconfig.json
  - apps/saas/app/course/line-community-panel.tsx
  - apps/saas/lib/github-kit.ts
  - apps/saas/tsconfig.json
  - docs/discuss/extract-map.md
  - docs/discuss/2026-08-14-alignment.md
  - packages/course/src/playback.ts
  - packages/database/package.json
  - packages/utils/tsconfig.json
  - packages/github-kit/src/config.ts
  - turbo.json
  - packages/ui/src/index.tsx
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/checkout/result/page.tsx
  - packages/database/tsconfig.json
  - packages/i18n/package.json
  - packages/database/src/index.ts
  - packages/github-kit/src/revoke.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/app/login/page.tsx
  - packages/site-agent/src/index.ts
  - packages/database/prisma/schema.prisma
  - apps/saas/app/api/course/lessons/route.ts
  - apps/saas/app/page.tsx
  - packages/course/tsconfig.json
  - packages/payments/src/checkout.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/layout.tsx
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/api/auth/[...all]/route.ts
  - apps/saas/next.config.ts
  - docs/discuss/v1-boundary.md
  - packages/payments/src/order.ts
  - packages/site-agent/src/chat.ts
  - README.md
  - packages/auth/tsconfig.json
  - pnpm-workspace.yaml
  - packages/course/src/access.ts
  - apps/saas/lib/demo-grant.ts
  - apps/saas/app/api/payuni/notify/route.ts
  - apps/saas/app/login/login-form.tsx
  - packages/database/prisma/migrations/20260815020000_add_github_kit_grants/migration.sql
  - packages/site-agent/src/provider.ts
  - packages/course/package.json
  - packages/utils/package.json
  - packages/utils/src/index.ts
  - apps/saas/lib/agent-data.ts
  - docs/discuss/README.md
  - apps/saas/app/globals.css
  - apps/saas/app/course/page.tsx
  - apps/saas/app/course/kit-claim-panel.tsx
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/auth/src/auth.ts
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/github-kit/package.json
  - tooling/typescript/base.json
  - tooling/typescript/package.json
  - apps/saas/app/api/orders/refund/route.ts
  - docs/discuss/architecture-draft.md
  - apps/saas/app/api/checkout/route.ts
  - packages/course/src/line-invite.ts
  - packages/auth/src/index.ts
  - packages/payments/src/index.ts
  - packages/payments/src/provider/payuni/crypto.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/auth/package.json
tests:
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/github-kit/src/revoke.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/auth/src/auth.test.ts
  - packages/payments/src/order.test.ts
  - packages/github-kit/src/claim.test.ts
  - packages/site-agent/src/chat.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/notify.test.ts
  - packages/course/src/playback.test.ts
  - packages/payments/src/factory.test.ts
  - packages/payments/src/refund.test.ts
  - packages/course/src/line-invite.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/course/src/catalog.test.ts
  - packages/github-kit/src/config.test.ts
-->

---
### Requirement: Site agent is discoverable in product navigation
Signed-in learners SHALL be able to open the site agent from primary navigation without memorizing /agent. The agent page itself remains limited to the two read-only tools already specified.

#### Scenario: Nav link opens agent
- **WHEN** a signed-in learner uses primary navigation
- **THEN** choosing the agent entry MUST open /agent

<!-- @trace
source: mvp-sell-flow-usable
updated: 2026-08-15
code:
  - apps/saas/app/agent/agent-chat-client.tsx
  - apps/saas/app/checkout/page.tsx
  - apps/saas/app/page.tsx
  - apps/saas/app/agent/page.tsx
  - packages/i18n/src/index.ts
  - apps/saas/app/course/page.tsx
  - AGENTS.md
  - apps/saas/app/course/kit-claim-panel.tsx
  - apps/saas/app/checkout/checkout-button.tsx
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/app/page.tsx
  - apps/saas/app/globals.css
  - apps/saas/app/signup/page.tsx
  - apps/saas/app/components/site-nav.tsx
  - apps/saas/app/layout.tsx
  - apps/saas/app/login/page.tsx
  - docs/deploy-and-public-url.md
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/course/line-community-panel.tsx
-->