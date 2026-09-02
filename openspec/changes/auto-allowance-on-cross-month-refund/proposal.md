# Proposal: auto-allowance-on-cross-month-refund

## Why

退款時，發票處理目前分兩條路：

- **同月**：自動呼叫供應商 `void`（作廢），全自動，Fish 不用管
- **跨月**：`reserveInvoiceRefund`（`invoice-events.ts:334`）判定 `!sameTaiwanBillingMonth`
  後，只把發票標成 `attentionReason: "REFUND_NEEDS_ALLOWANCE"` 就結束，**等 Fish 進後台
  手動按「開折讓」按鈕**（`InvoiceOperationsButtons.tsx:24` 解鎖該按鈕）

跨月不能作廢是財政部規定（發票已申報，法律上只能折讓沖銷），這條界線正確、不改。
但既然本專案退款一律是**整筆全額退款**（無部分退款情境），「跨月要開多少折讓」沒有
任何選擇餘地，答案永遠是「全額」。讓 Fish 每筆跨月退款都要記得進後台按一下，
是沒有決策價值的人工步驟，且漏按就等於客人退了錢、發票帳面卻沒沖掉。

Fish 2026-09-02 裁決：跨月退款改為自動開立全額折讓。

## What Changes

- `reserveInvoiceRefund` 判定跨月時，不再只標 `REFUND_NEEDS_ALLOWANCE` 就結束，
  改為預約一筆**全額折讓作業**並執行
- 折讓金額 = `invoice.amount - invoice.allowanceTotal`（剩餘可折讓額，非硬編 `invoice.amount`，
  以正確處理已有部分折讓的發票）
- 自動折讓沿用既有 `issueInvoiceAllowance` procedure 的併發保護機制（`allowanceId` 冪等鍵、
  `ALLOWANCE_IN_PROGRESS` 租約、`InvoiceAllowanceOperation` 作業記錄），**抽出共用核心，
  不另造一套**
- 自動折讓失敗時 fail-closed：退回 `REFUND_NEEDS_ALLOWANCE`（現行人工路徑）並寫入 `failReason`，
  後台按鈕維持可用，行為與今天完全一致
- 附帶修復：`invoice-events.test.ts`、`invoice-operations.test.ts` 兩處把 `invoiceDate` 寫死
  `2026-08-24` 卻用真實 `new Date()` 比對跨月，導致 2026-09-01 起必然失敗。改為測試注入固定 `now`

## Non-Goals

- **不放寬跨月不可作廢的界線**。`assertInvoiceVoidable` 的時間檢查原樣保留
- 不做部分退款／部分折讓的 UI 或流程（本專案退款一律全額）
- **不動「作廢已送出但結果不確定」那條路**（`invoice-events.ts:181`、`:368`）。那些情境是
  `void` 已呼叫但成敗未知，此時自動折讓有「作廢成功 + 折讓成功」雙重沖銷的風險，
  維持標記等人工查核
- 不改 `InvoiceAllowanceOperation` schema、不改供應商 API 客戶端

## Capabilities

### Modified Capabilities

- `course-invoicing`（或現行對應 spec）：退款流程在跨月情境的行為由「標記待人工折讓」
  改為「自動全額折讓，失敗才退回待人工」

## Impact

- Affected specs：退款/發票相關既有 spec 需發 MODIFIED delta（跨月退款行為）
- Affected code：
  - Modified: `packages/api/modules/course/lib/invoice-events.ts`（`reserveInvoiceRefund` 跨月分支）
  - Modified: `packages/api/modules/course/procedures/invoice-operations.ts`（抽出可重用的折讓核心）
  - Modified: `packages/api/modules/course/lib/invoice-events.test.ts`、
    `packages/api/modules/course/procedures/invoice-operations.test.ts`（注入固定 now）
  - 可能新增: `packages/api/modules/course/lib/invoice-allowance-core.ts`（抽出的共用核心）
- **風險：高**。涉及金流與稅務憑證，且有併發／冪等／雙重沖銷風險。走完整驗證關卡
  （紅燈矩陣先確認、TDD、PM 實跑、外部 CLI 交叉審查聚焦資安盲點）
