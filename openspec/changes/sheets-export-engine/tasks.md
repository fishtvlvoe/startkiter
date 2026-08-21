# Tasks: sheets-export-engine

## Phase 1: 核心套件建置與匯出服務實作（Core Package & Exporter）

- [x] 在 `pnpm-workspace.yaml` catalog 新增 `@open-sheet/core` 依賴
- [x] 建立 `packages/sheets` 套件目錄與 `package.json`、`tsconfig.json` 配置
- [x] 實作 `packages/sheets/src/exporter.ts`：
  - [x] `resolveWorkbookNode` 遞迴 JSX 解開器
  - [x] `toXlsxBuffer` 二進位 Buffer 匯出
  - [x] `toCsvRecords` 分頁 CSV 產出
  - [x] `toHtmlString` 自包含 HTML 產出
  - [x] `createXlsxDownloadResponse` Web API 下載回應封裝
- [x] 實作 `packages/sheets/src/exporter.test.ts` 單元測試（驗證 OOXML 檔頭、CSV 內容、HTML、Response Headers）

## Phase 2: 標準業務報表範本庫（SaaS Report Templates）

- [x] 實作訂單銷售明細範本 `packages/sheets/src/templates/orders.tsx`（數量、單價、動態小計公式、SUM 總計）
- [x] 實作課程營收與分潤結算範本 `packages/sheets/src/templates/revenue.tsx`（Key-Value 假設參數、Defined Names、毛利與稅額連動）
- [x] 實作加值包/代碼庫領取統計範本 `packages/sheets/src/templates/bundles.tsx`
- [x] 實作優惠券折抵效益分析範本 `packages/sheets/src/templates/coupons.tsx`

## Phase 3: SaaS 後端 API & 前端匯出 UI 串接（SaaS Integration）

- [x] 在 `packages/api` 新增 `exportOrdersSpreadsheet` / `exportRevenueSpreadsheet` procedures
- [x] 在 `apps/saas` 建立匯出 API Route（`/api/export/orders`、`/api/export/revenue`）
- [x] 在 SaaS 後台管理介面（訂單列表、營收結算頁）加入「匯出活公式 Excel」按鈕

## Phase 4: AI 代理人產表整合（AI Agent & MCP Integration）

- [ ] 在 `@startkiter/ai` 註冊試算表生成 Tool，允許 Agent 依據 Prompt 產生 TSX Workbook
- [ ] 支援在對話式後台即時產出 `.xlsx` 下載連結或 HTML 即時預覽
