## Why

`extract-supastarter-design-system`（已封存）用本機三份不明版本 supastarter 快照做視覺/元件移植，事後對照官方私有倉庫（`vendor/supastarter-nextjs/`，已授權 pull）與官方開發文件（`docs/reference/supastarter-nextjs-docs/`）發現偏離不是表面配色問題：UI 元件庫抄成 Radix UI，官方實際用 Base UI（`@base-ui/react`），API 不相容；CSS/token 架構官方輕量分離（`apps/saas/app/globals.css` 僅 41 行，token 集中在 `packages/tooling/tailwind/theme.css` 獨立成共用包），StartKiter 現況全部內嵌在 `apps/saas/app/globals.css`（479 行）與 `apps/saas/app/design-system.css`（984 行）；配色系統抄成 zinc/slate 灰階，官方預設是 olive 色階；字體策略抄成「DM Sans 全站 + Noto Sans TC fallback」，官方後台實際純用 Inter。這些落差在移植階段就已經存在，不是後續修改造成的劣化，用漸進修補無法追上，需要以官方原始碼與文件為唯一依據重做。

## What Changes

- 修改：`packages/ui` 元件庫從 Radix UI 換成 Base UI（`@base-ui/react`），逐一比對官方 `vendor/supastarter-nextjs/packages/ui` 元件重寫，透過 `pnpm --filter=ui shadcn add --base base <元件>` 從 Base UI registry 加入
- 修改：CSS/token 架構依官方模式重整，token 從 `apps/saas/app/globals.css`／`apps/saas/app/design-system.css` 抽離成獨立的 `packages/tooling/tailwind/theme.css` 共用包，`globals.css` 精簡到只保留 `@import` 與少量 base 樣式
- **BREAKING**：配色系統從 zinc/slate 灰階換成官方預設 olive 色階，全站視覺色調改變
- **BREAKING**：字體策略從「DM Sans 全站 + Noto Sans TC fallback」改成官方模式（SaaS 後台純 Inter；若後續納入 marketing app 才比照官方在標題用 DM Sans）
- 新增：後台導覽補上官方有但 StartKiter 缺的部分——型別化權限（`PermixProvider`/`usePermissions`）、多租戶切換器（`OrganizationSelect`，串接 `organization-role-model` 已封存的角色矩陣）
- 修改：`apps/saas/app/page.tsx`、`login/`、`app/page.tsx`、`course/`、`agent/`、`admin/settings/` 等既有頁面的元件呼叫方式，改用重寫後的 Base UI 版元件

## Non-Goals

- 不改後端邏輯：auth、checkout（PAYUNi）、course 資料流與 API 契約不動
- 不動 `platform-shell-plugin-architecture` Phase 1 已完成並合併進 main 的 Shell 統一結構（`/agent`、`/admin/settings` 併入 AppShell、手機版 tab bar）——本次是在其之上換元件庫/CSS/配色，不回頭重做 Shell 統一
- 不做 `platform-shell-plugin-architecture` Phase 2（平台化架構：Plugin manifest、Marketplace、MCP Gateway）範疇
- 不把 `apps/saas` 目錄結構改成官方的 `modules/{shared,auth,organizations,...}` 分模組結構——這是專案骨架級改動，牽動範圍過大，另開 change 處理
- 不修改來源 repo（`vendor/supastarter-nextjs/` 唯讀參考，不可推送修改）
- 不重新評估電子發票（einvoice）範圍，維持現行「不在 MVP」

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `design-system`: 元件庫技術選型從 Radix UI 改為 Base UI，配色 token 從 zinc/slate 改為 olive，CSS 架構從內嵌改為獨立 token 包，字體策略從「DM Sans 全站+Noto Sans TC」改為「SaaS 後台純 Inter」
- `saas-shell`: 後台導覽補上型別化權限（Permix）與多租戶切換器（OrganizationSelect）

## Impact

- Affected specs: `design-system`（修改）、`saas-shell`（修改）
- Affected code:
  - Modified: `packages/ui/src/components/*`、`packages/ui/package.json`、`apps/saas/app/globals.css`、`apps/saas/app/design-system.css`、`apps/saas/app/page.tsx`、`apps/saas/app/login/login-form.tsx`、`apps/saas/app/signup/page.tsx`、`apps/saas/app/app/page.tsx`、`apps/saas/app/course/page.tsx`、`apps/saas/app/course/[lessonId]/page.tsx`、`apps/saas/app/components/app-shell.tsx`
  - New: `packages/tooling/tailwind/theme.css`
  - Removed: `packages/ui` 內現有 Radix UI 依賴的元件實作檔案（逐一由 Base UI 版本取代）
- Dependencies 新增：`@base-ui/react`；移除：`radix-ui`
- 環境變數新增：無
