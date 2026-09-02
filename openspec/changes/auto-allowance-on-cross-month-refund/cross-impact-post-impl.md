# Cross-impact 驗收報告（實作後覆核）

日期：2026-09-03
Change：auto-allowance-on-cross-month-refund

分類：
- A 本次改動核心
- B 必須同步（已處理）
- C 回歸保護（不動）
- D 前端依賴（已確認）
- E 背景呼叫端（無 session）
- F 測試
- G 文件／規格

## REFUND_NEEDS_ALLOWANCE

| 位置 | 分類 | 說明 |
|---|---|---|
| `invoice-events.ts` reserve 無 provider／無 invoiceDate | A | 維持標記人工 |
| `invoice-events.ts` finalizeInvoiceRefund 失敗 | C | 同月 void 失敗路徑，未動 |
| `invoice-events.ts:181` finalizeSourceChangedInvoice | C | R6 void 結果未知，未動 |
| `run-invoice-allowance-operation.ts` definiteFailureAttentionReason | A | 自動折讓明確失敗回填 |
| `InvoiceOperationsButtons.tsx:24` | D | 靠此值解鎖手動折讓；失敗回填後仍可用 |
| `refund-invoice.test.ts` 1.4／void 失敗測試 | F | 已覆蓋 |

## issueInvoiceAllowance

| 位置 | 分類 | 說明 |
|---|---|---|
| `lib/invoice-operations.ts`（無保護底層） | C | 僅被核心呼叫 provider，退款流程**不**直接當入口 |
| `procedures/invoice-operations.ts` adminProcedure | B | 改呼叫 `runInvoiceAllowanceOperation` + `recordAdminAction` |
| `router.ts` / 前端 oRPC | E/D | 手動路徑不變 |
| `run-invoice-allowance-operation.ts` | A | 抽出含 13 條保護的共用核心 |

## reserveInvoiceRefund／reserveRefundInvoice

| 位置 | 分類 | 說明 |
|---|---|---|
| `reserveRefundInvoice` | A | 實際函式名；跨月改 `autoAllowance` |
| `handleRefundInvoice`／`ForSubscription` | E | orders webhook、訂閱取消等背景入口；走核心不走 adminProcedure |
| proposal 舊名 `reserveInvoiceRefund` | G | 僅文件用詞 |

## ALLOWANCE_IN_PROGRESS

| 位置 | 分類 | 說明 |
|---|---|---|
| `run-invoice-allowance-operation.ts` 佔位／租約 | A | 與 admin 共用 |
| `recoverStaleAllowance`／`retryPendingInvoices` | C | 既有 stale 回收，未改行為契約 |
| admin 1.8 測試 | F | 進行中拒絕手動折讓 |

## 結論

- 無新增未處理呼叫端。
- 背景流程走 `runInvoiceAllowanceOperation`，未踩 F2。
- void 結果未知兩條（:181／finalize 失敗）維持人工。
- 前端失敗回填 `REFUND_NEEDS_ALLOWANCE`；成功後 status=`ALLOWANCE`，「已跨月」提示不再顯示。
