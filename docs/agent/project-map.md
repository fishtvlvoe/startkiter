# StartKiter Project Map

日期：2026-10-11

## Repositories

- Canonical repo：`/Users/fishtv/Development/B-產品/products/startkiter`
- Branch：`main`
- Deployment：Coolify/VPS；正式流程見 `docs/vps-deployment-sop.md`

## Applications

- `apps/saas`：登入後 SaaS、管理後台、課程與平台操作。
- `apps/marketing`：公開銷售頁與內容。

## Core packages

- `packages/platform`：App registry、mount points、workspace navigation。
- `packages/database`：Prisma/PostgreSQL、Drizzle auth schema、migrations。
- `packages/api`：oRPC procedures 與 domain API。
- `packages/course`：課程觀看與課程模組。
- `packages/payments`：支付 provider abstraction 與 PAYUNi。
- `packages/newsletter`：電子報、受眾、寄送與同意。
- `packages/auth`：Better Auth 與身份。
- `packages/ui`：共用 UI 元件。

## Blueprint entry

- `docs/blueprint/startkiter-creator-platform.md`
- Spectra change：`openspec/changes/creator-operations-platform-blueprint/`
