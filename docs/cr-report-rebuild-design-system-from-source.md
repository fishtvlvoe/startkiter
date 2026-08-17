# rebuild-design-system-from-source CR 報告

本批次先記錄一項驗收契約落差；完整第 9.1 CR 仍留待後續批次執行。

## F-001：3.1／3.2 原驗收文字與官方元件 source 不一致

- **嚴重度**：Medium（驗收契約落差）
- **位置**：`openspec/changes/rebuild-design-system-from-source/tasks.md` 的 3.1、3.2、4.1、5.1
- **觸發條件**：原文字把「使用 Base UI」寫成所有元件都必須直接 import `@base-ui/react`，並指定執行本地不存在的 `shadcn` script。
- **官方證據**：`vendor/supastarter-nextjs/packages/ui/components/button.tsx`、`card.tsx`、`badge.tsx`、`input.tsx`、`form.tsx`、`label.tsx`、`spinner.tsx` 都不 import Radix 或 Base UI；只有 `tooltip.tsx` import `@base-ui/react/tooltip`；`color-mode-toggle.tsx` 不使用 headless UI library。
- **影響**：若照原文字寫測試，會迫使實作加入官方沒有的 import，或把不存在的 CLI 當成可用，違反「官方原始碼唯一依據」與逐元件 source 搬遷決策。
- **處置**：不回改 `tasks.md`。本批次改用逐檔 source parity 測試：移除 Radix、比對官方實際 import／實作；只在官方使用 Base UI 的 Tooltip 斷言 Base UI；Button 改採官方 `render` prop，並保留既有 `data-slot` 與呼叫端契約。
- **狀態**：Accepted／已在批次二 3.1–5.2 實作與測試中處理。
