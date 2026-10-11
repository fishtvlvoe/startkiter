## Why

StartKiter 已有課程、課程管理、PAYUNi、訂單、營收、電子報與平台殼，但它目前仍以「課程後台」為中心，缺少創作者從建立內容、吸引名單、培養關係、銷售商品到追蹤營運的完整工作流。現有導覽與頁面把能力分散在不同角色與路由，Fish 與一般使用者都難以判斷下一步；現在先建立完整產品藍圖，才能在不堆疊複雜度的前提下逐段開發。

## What Changes

- 新增以台灣創作者為目標的完整創作者營運平台產品藍圖，明確定義使用者、任務、模組、資料生命週期、權限與外部服務邊界。
- 新增平台級資訊架構：工作台、名單與關係、內容與商品、網站與銷售流程、行銷與自動化、收款與訂單、分析與設定。
- 新增可重用的領域模型：Creator Workspace、Contact、Audience、Tag、Segment、Content、Offer、Product、Order、Subscription、Campaign、Automation、Event、Consent、Invoice、Support Case。
- 新增台灣適用性契約：zh-TW 優先、TWD 整數金額、Asia/Taipei 時區、PAYUNi、電子發票、LINE、個資同意與退訂、台灣地址與電話格式。
- 新增 UI/UX 契約：任務導向入口、漸進式揭露、單頁單一主要任務、桌面／手機同流程、loading／empty／error／permission denied 狀態與可用性驗收。
- 新增技術棧與資料演進計畫，優先重用現有 Next.js、React、TypeScript、Prisma/PostgreSQL、oRPC、Better Auth、TanStack Query、PAYUNi、newsletter 與 platform packages。
- 新增分階段 SR 拆解與驗收矩陣；本 change 只建立藍圖與規格，不實作創作者平台功能。

## Non-Goals

- 不在本 change 直接實作 CRM、漏斗、SMS、工作流程編輯器或新的付款流程。
- 不複製 Systeme.io 的品牌、版面、文案或內部實作；只提取可驗證的工作流與資訊架構原則。
- 不改動既有使用者、課程、訂單、PAYUNi、電子報或部署程式碼。
- 不在未確認供應商、法規與商業規則前新增外部服務帳號或環境變數。
- 不把現有進行中的局部 SR 合併成一張巨型施工單；後續依藍圖拆成可獨立驗收的小 SR。

## Capabilities

### New Capabilities

- `creator-platform-foundation`: 平台工作區、App registry、角色、權限、導覽與跨模組任務入口的產品契約。
- `creator-crm-and-audience`: 聯絡人、標籤、分眾、互動時間線、同意與名單匯入匯出的產品契約。
- `creator-content-and-commerce`: 網站內容、商品、課程、組合包、優惠券、結帳、訂單與訂閱的產品契約。
- `creator-marketing-automation`: 電子報、活動、模板、工作流程、觸發器、動作、寄送與退訂的產品契約。
- `taiwan-localization-and-compliance`: 台灣語系、貨幣、時區、付款、電子發票、個資與訊息同意的產品契約。
- `creator-analytics-and-operations`: 營運儀表板、事件、報表、匯出、稽核紀錄、通知與支援入口的產品契約。

### Modified Capabilities

- 無。本 change 只建立新的產品級藍圖；現有平台殼、導覽、電子報、訂閱與結帳 SR 仍依各自範圍處理，不在本 change 改寫既有 runtime requirement。

## Impact

- Affected specs：新增上述 6 個藍圖 capability 的規格；現有 specs 只作為相容性與邊界依據。
- Affected code：本 change 不修改應用程式；藍圖會標記未來可能影響的 `packages/platform`、`packages/database`、`packages/api`、`packages/newsletter`、`packages/payments`、`packages/course` 與 `apps/saas`。
- Affected documents：`CONTEXT.md`、`docs/blueprint/`、`docs/agent/`、必要的 `docs/adr/`。
- Dependencies：沿用現有 pnpm workspace、Next.js App Router、React、TypeScript、Prisma 7/PostgreSQL、oRPC、Better Auth、TanStack Query、PAYUNi、既有 email/newsletter provider 與 Coolify/VPS；SMS、漏斗編輯器與分析儲存供應商先列為待決策，不先新增。
- Environment variables：本 change 不新增環境變數；未來新增 provider 前，先建立 secret／非 secret 分類、注入介面、fail-closed 與回滾規格。

