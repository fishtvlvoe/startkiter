# sheets-export-engine Specification

## Purpose

TBD - created by archiving change 'sheets-export-engine'. Update Purpose after archive.

## Requirements

### Requirement: Headless Excel Generation with Live Formulas

系統 MUST 能夠在純 Node.js / Serverless 環境中，不啟動瀏覽器即將 React TSX 結構編譯為標準 `.xlsx` 檔案，且包含原生 Excel 計算公式。

#### Scenario: 匯出訂單明細試算表
- **WHEN** 後端傳入訂單陣列至 `OrdersSpreadsheet` 並呼叫 `toXlsxBuffer`
- **THEN** 產出的 Buffer MUST 為有效的 OOXML/ZIP 格式（檔頭包含 `PK\x03\x04`），且每筆訂單的金額小計欄位包含 `=qty*unitPrice` 之計算公式而非死數字。

#### Scenario: 匯出營收結算與 Defined Names 假設表
- **WHEN** 後端傳入包含稅率與手續費率之假設參數至 `RevenueSpreadsheet` 並呼叫 `toXlsxBuffer`
- **THEN** 產出的 Excel 檔案 MUST 包含「參數設定」與「營收結算」兩個分頁，且營收公式正確參照參數設定之 Defined Names。


<!-- @trace
source: sheets-export-engine
updated: 2026-08-22
code:
  - packages/sheets/src/templates/orders.tsx
  - packages/ai/vitest.config.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/sheets/src/index.ts
  - apps/saas/modules/admin/component/ExportSpreadsheetButton.tsx
  - packages/utils/vitest.config.ts
  - packages/auth/vitest.config.ts
  - apps/saas/app/api/export/orders/route.ts
  - docs/dispatch-board.md
  - apps/saas/package.json
  - packages/sheets/tsconfig.json
  - packages/ai/package.json
  - packages/i18n/vitest.config.ts
  - packages/api/modules/ai/procedures/stream-message.ts
  - packages/sheets/vitest.config.ts
  - packages/ui/vitest.config.ts
  - docs/dashboard/status.html
  - apps/saas/app/api/export/revenue/route.ts
  - packages/api/modules/admin/procedures/export-revenue-spreadsheet.ts
  - packages/bundles/package.json
  - packages/logs/vitest.config.ts
  - apps/saas/vitest.integration.config.ts
  - apps/saas/next.config.ts
  - packages/sheets/src/templates/coupons.tsx
  - packages/github-kit/vitest.config.ts
  - packages/payments/vitest.config.ts
  - packages/api/package.json
  - packages/notifications/vitest.config.ts
  - packages/storage/vitest.config.ts
  - packages/ai/lib/tools/generate-spreadsheet.ts
  - packages/sheets/src/templates/revenue.tsx
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/api/modules/admin/router.ts
  - apps/saas/app/api/repo-version/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/revenue/page.tsx
  - AGENTS.md
  - packages/api/modules/admin/procedures/export-orders-spreadsheet.ts
  - packages/database/vitest.config.ts
  - packages/mail/vitest.config.ts
  - packages/sheets/src/templates/bundles.tsx
  - packages/ai/lib/index.ts
  - packages/bundles/vitest.config.ts
  - packages/coupons/vitest.config.ts
  - docs/dashboard/README.md
  - apps/saas/modules/ai/components/AiChat.tsx
tests:
  - apps/saas/app/api/export/orders/route.test.ts
  - packages/api/modules/admin/procedures/export-revenue-spreadsheet.test.ts
  - packages/sheets/src/exporter.test.ts
  - packages/coupons/src/validate.test.ts
  - apps/saas/modules/admin/component/ExportSpreadsheetButton.test.tsx
  - packages/api/modules/ai/procedures/stream-message.test.ts
  - packages/ai/lib/tools/generate-spreadsheet.test.ts
  - packages/api/modules/admin/procedures/export-orders-spreadsheet.test.ts
  - packages/bundles/src/access-integration.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/api/export/revenue/route.test.ts
-->

---
### Requirement: Multi-format Export Support

系統 MUST 支援將同一份試算表範本輸出為 CSV 與自包含 HTML 格式。

#### Scenario: 輸出 CSV
- **WHEN** 呼叫 `toCsvRecords(workbook)`
- **THEN** 回傳以分頁名稱為 key 之物件，內容包含計算後數值與表頭文字。

#### Scenario: 輸出 HTML
- **WHEN** 呼叫 `toHtmlString(workbook)`
- **THEN** 回傳包含 `<!doctype html>` 且內嵌 CSS 樣式之單檔 HTML 報表。


<!-- @trace
source: sheets-export-engine
updated: 2026-08-22
code:
  - packages/sheets/src/templates/orders.tsx
  - packages/ai/vitest.config.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/sheets/src/index.ts
  - apps/saas/modules/admin/component/ExportSpreadsheetButton.tsx
  - packages/utils/vitest.config.ts
  - packages/auth/vitest.config.ts
  - apps/saas/app/api/export/orders/route.ts
  - docs/dispatch-board.md
  - apps/saas/package.json
  - packages/sheets/tsconfig.json
  - packages/ai/package.json
  - packages/i18n/vitest.config.ts
  - packages/api/modules/ai/procedures/stream-message.ts
  - packages/sheets/vitest.config.ts
  - packages/ui/vitest.config.ts
  - docs/dashboard/status.html
  - apps/saas/app/api/export/revenue/route.ts
  - packages/api/modules/admin/procedures/export-revenue-spreadsheet.ts
  - packages/bundles/package.json
  - packages/logs/vitest.config.ts
  - apps/saas/vitest.integration.config.ts
  - apps/saas/next.config.ts
  - packages/sheets/src/templates/coupons.tsx
  - packages/github-kit/vitest.config.ts
  - packages/payments/vitest.config.ts
  - packages/api/package.json
  - packages/notifications/vitest.config.ts
  - packages/storage/vitest.config.ts
  - packages/ai/lib/tools/generate-spreadsheet.ts
  - packages/sheets/src/templates/revenue.tsx
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/api/modules/admin/router.ts
  - apps/saas/app/api/repo-version/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/revenue/page.tsx
  - AGENTS.md
  - packages/api/modules/admin/procedures/export-orders-spreadsheet.ts
  - packages/database/vitest.config.ts
  - packages/mail/vitest.config.ts
  - packages/sheets/src/templates/bundles.tsx
  - packages/ai/lib/index.ts
  - packages/bundles/vitest.config.ts
  - packages/coupons/vitest.config.ts
  - docs/dashboard/README.md
  - apps/saas/modules/ai/components/AiChat.tsx
tests:
  - apps/saas/app/api/export/orders/route.test.ts
  - packages/api/modules/admin/procedures/export-revenue-spreadsheet.test.ts
  - packages/sheets/src/exporter.test.ts
  - packages/coupons/src/validate.test.ts
  - apps/saas/modules/admin/component/ExportSpreadsheetButton.test.tsx
  - packages/api/modules/ai/procedures/stream-message.test.ts
  - packages/ai/lib/tools/generate-spreadsheet.test.ts
  - packages/api/modules/admin/procedures/export-orders-spreadsheet.test.ts
  - packages/bundles/src/access-integration.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/api/export/revenue/route.test.ts
-->

---
### Requirement: Web API Download Response Helper

系統 MUST 提供能直接在 Web API / Route Handler 中回傳的 Response 包裝函式。

#### Scenario: 封裝下載 Response
- **WHEN** 呼叫 `createXlsxDownloadResponse(buffer, "report.xlsx")`
- **THEN** 回傳的 Response HTTP 狀態碼 MUST 為 200，`Content-Type` 為 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，且 `Content-Disposition` 包含指定之檔名。

<!-- @trace
source: sheets-export-engine
updated: 2026-08-21
code:
  - packages/sheets/src/exporter.ts
  - packages/sheets/src/templates/orders.tsx
  - packages/sheets/src/templates/revenue.tsx
  - packages/sheets/src/exporter.test.ts
-->

<!-- @trace
source: sheets-export-engine
updated: 2026-08-22
code:
  - packages/sheets/src/templates/orders.tsx
  - packages/ai/vitest.config.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx
  - packages/sheets/src/index.ts
  - apps/saas/modules/admin/component/ExportSpreadsheetButton.tsx
  - packages/utils/vitest.config.ts
  - packages/auth/vitest.config.ts
  - apps/saas/app/api/export/orders/route.ts
  - docs/dispatch-board.md
  - apps/saas/package.json
  - packages/sheets/tsconfig.json
  - packages/ai/package.json
  - packages/i18n/vitest.config.ts
  - packages/api/modules/ai/procedures/stream-message.ts
  - packages/sheets/vitest.config.ts
  - packages/ui/vitest.config.ts
  - docs/dashboard/status.html
  - apps/saas/app/api/export/revenue/route.ts
  - packages/api/modules/admin/procedures/export-revenue-spreadsheet.ts
  - packages/bundles/package.json
  - packages/logs/vitest.config.ts
  - apps/saas/vitest.integration.config.ts
  - apps/saas/next.config.ts
  - packages/sheets/src/templates/coupons.tsx
  - packages/github-kit/vitest.config.ts
  - packages/payments/vitest.config.ts
  - packages/api/package.json
  - packages/notifications/vitest.config.ts
  - packages/storage/vitest.config.ts
  - packages/ai/lib/tools/generate-spreadsheet.ts
  - packages/sheets/src/templates/revenue.tsx
  - docs/discuss/2026-08-22-platform-positioning-infra-alignment.md
  - apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - packages/api/modules/admin/router.ts
  - apps/saas/app/api/repo-version/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/revenue/page.tsx
  - AGENTS.md
  - packages/api/modules/admin/procedures/export-orders-spreadsheet.ts
  - packages/database/vitest.config.ts
  - packages/mail/vitest.config.ts
  - packages/sheets/src/templates/bundles.tsx
  - packages/ai/lib/index.ts
  - packages/bundles/vitest.config.ts
  - packages/coupons/vitest.config.ts
  - docs/dashboard/README.md
  - apps/saas/modules/ai/components/AiChat.tsx
tests:
  - apps/saas/app/api/export/orders/route.test.ts
  - packages/api/modules/admin/procedures/export-revenue-spreadsheet.test.ts
  - packages/sheets/src/exporter.test.ts
  - packages/coupons/src/validate.test.ts
  - apps/saas/modules/admin/component/ExportSpreadsheetButton.test.tsx
  - packages/api/modules/ai/procedures/stream-message.test.ts
  - packages/ai/lib/tools/generate-spreadsheet.test.ts
  - packages/api/modules/admin/procedures/export-orders-spreadsheet.test.ts
  - packages/bundles/src/access-integration.test.ts
  - apps/saas/tests/integration/bundle-course-access.test.ts
  - apps/saas/app/api/export/revenue/route.test.ts
-->