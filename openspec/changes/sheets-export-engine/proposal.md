# Change Proposal: sheets-export-engine

## 為什麼要做（Why）

現行 SaaS 平台匯出報表大多採用 CSV 或傳統 Excel 套件（如 SheetJS / exceljs），存在以下核心痛點：
1. **死數字而非動態模型**：導出的檔案僅為靜態數值，終端用戶（財務、主管、客戶）修改數量或單價時，總計、稅額、分潤無法即時重新計算。
2. **人工維護 A1 座標極度脆弱**：傳統後端寫法必須手動硬編碼 `A1`、`B5` 等儲存格位址，一旦報表新增欄位或統計列位移，公式立即靜態算錯。
3. **缺少 Agent 原生試算表能力**：AI 代理人無法以語義化方式建立具備數學依賴圖的活試算表。

引進 `open-sheet`（React 宣告式排版 + 語義公式 AST）可為 StartKiter 建立高階活公式試算表產生與匯出引擎。

## 要做什麼（What）

1. **建立共用模組 `@startkiter/sheets`**：
   - 封裝 `@open-sheet/core` 與 `@open-sheet/core/node`，提供純 Node.js Headless 匯出服務（`.xlsx`、`.csv`、`.html`）。
   - 支援自動解開 React JSX 樹狀結構，相容於標準 Next.js 與 React 19 元件。
2. **標準化 SaaS 業務報表範本庫**：
   - **訂單銷售明細（OrdersSpreadsheet）**：支援商品數量、單價與動態小計公式（`qty * price`）及總計。
   - **課程營收與分潤結算（RevenueSpreadsheet）**：支援 Key-Value 假設參數（平台手續費率、營業稅率轉 Excel Defined Names）與毛利、稅額、實撥款自動連動。
   - **加值包/優惠券使用報表**：後續擴充支援代碼包購買與折抵分析。
3. **SaaS 後端匯出 API 與前端串接**：
   - 在 `apps/saas` 提供標準 Excel 下載端點與 UI 按鈕。
4. **AI 代理人生產能力整合**：
   - 搭配 `@startkiter/ai` 與 MCP 工具，允許用戶透過對話指令動態產出或調整試算表。

## 範圍與影響（Scope & Impact）

- **新增套件**：`packages/sheets/`
- **依賴變更**：`pnpm-workspace.yaml` catalog 新增 `@open-sheet/core`
- **影響模組**：`packages/sheets/`、`apps/saas/`、`packages/api/`
- **相容性保證**：純函數與 Headless 輸出，零瀏覽器 / Puppeteer 依賴，不影響既有 DB 或支付流程。
