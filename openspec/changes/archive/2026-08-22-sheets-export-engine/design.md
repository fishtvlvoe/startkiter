# Architecture & Technical Design: sheets-export-engine

## 核心架構

```
+-------------------------------------------------------------+
|                     apps/saas & AI Agent                    |
|       (Next.js API Route / Server Action / AI Chat)         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    @startkiter/sheets                       |
|  - templates/ (Orders, Revenue, Coupons, Quotation)         |
|  - exporter.ts (toXlsxBuffer, toCsvRecords, toHtmlString)   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     @open-sheet/core                        |
|  - JSX Runtime & Recursive AST Resolver                     |
|  - Layout Engine (Discrete Row/Col Placement)               |
|  - Formula Engine (AST -> Defined Names & Excel Formulas)   |
|  - Evaluator (JS Pure Math) & Serializer (ExcelJS / OOXML)  |
+------------------------------+------------------------------+
                               |
                               v
                   .xlsx / .csv / .html
```

## 設計原則

1. **零 A1 硬編碼（No A1 Coordinates in Code）**：
   - 所有單元格關聯皆透過 `r.cell('field')`、`ref('tableName').column('field')`、`ref('tableName').get('key')` 語義化參照。
   - 座標由排版引擎在 Layout 階段動態賦予，防止資料列插入時公式位移失效。
2. **假設參數獨立化（Defined Names）**：
   - 財務模型中的變數（稅率、費率、折扣率）以 `kind="keyValue"` 宣告，編譯至 Excel 時自動轉為 Defined Name（例如 `=B5*taxRate`），收到活頁簿的用戶在 Excel 修改該格數值即可整張重算。
3. **無瀏覽器負擔（Headless Execution）**：
   - 排版與公式計算完全基於離散網格算術，不需啟動 Chromium/Puppeteer，可在 Vercel Function、Docker、Node.js 22+ 毫秒級產出。
4. **遞迴 JSX 解開器（Recursive JSX Resolver）**：
   - 透過 `resolveWorkbookNode` 遞迴相容標準 React 19 JSX element 與 open-sheet AST 節點。

## 資料流程

1. **資料取得**：後端自 Prisma / Drizzle / API 撈取業務實體（訂單、課程交易、營收）。
2. **範本組裝**：傳入對應的 TSX 範本（如 `<OrdersSpreadsheet orders={orders} />`）。
3. **編譯解析**：`compile(resolveWorkbookNode(jsx))` 將元件樹轉換為 `CompiledWorkbook`。
4. **輸出二進位檔**：`XlsxWriter.write(compiled)` 生成標準 OOXML `.xlsx` Buffer。
5. **HTTP 回應**：`createXlsxDownloadResponse(buffer, filename)` 輸出下載 Stream / Response。
