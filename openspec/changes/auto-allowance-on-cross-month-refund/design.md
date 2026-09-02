# Design: auto-allowance-on-cross-month-refund

## 現況（改動前）

```
handleRefundInvoice(orderId)
  └─ reserveInvoiceRefund
       ├─ provider 不存在 / 無 invoiceDate / 跨月
       │    → invoice.attentionReason = "REFUND_NEEDS_ALLOWANCE"，流程結束
       │      （Fish 需進後台按「開折讓」）
       └─ 同月且 provider 正常
            → attentionReason = "REFUND_IN_PROGRESS" + operationToken
            → runInvoiceRefund → provider.void()
            → finalizeInvoiceRefund
                 ├─ 成功 → status = "VOIDED"
                 └─ 失敗 → attentionReason = "REFUND_NEEDS_ALLOWANCE" + failReason
```

## 改動後

```
reserveInvoiceRefund
  ├─ provider 不存在 / 無 invoiceDate
  │    → 維持 "REFUND_NEEDS_ALLOWANCE"（沒有 provider 就無法自動做任何事）
  ├─ 跨月（provider 正常）
  │    → 【新】預約自動全額折讓作業
  │         amount = invoice.amount - invoice.allowanceTotal
  │         allowanceId = normalizeProviderOrderId(`ALLOW-${id}-${allowanceTotal + amount}`, provider)
  │         attentionReason = "ALLOWANCE_IN_PROGRESS" + operationToken + operationStartedAt
  │         建立/更新 InvoiceAllowanceOperation(status="PENDING")
  │    → runInvoiceAllowance → provider.allowance()
  │         ├─ 成功 → status="ALLOWANCE"、allowanceTotal += amount、attentionReason=null
  │         ├─ 明確失敗 → attentionReason="REFUND_NEEDS_ALLOWANCE" + failReason（退回人工路徑）
  │         └─ ambiguous（不確定成敗）→ attentionReason="ALLOWANCE_NEEDS_REVIEW"（既有值，人工查核）
  └─ 同月 → 維持原本 void 流程，一行不改
```

## 設計決策

### 1. 抽出折讓核心，不複製一份

`issueInvoiceAllowance`（`invoice-operations.ts:120`）已具備完整保護：`allowanceId` 冪等鍵、
`SUCCEEDED` 直接回傳、`PENDING` 拒絕重送、stale 租約 reclaim、`ALLOWANCE_IN_PROGRESS` 佔位、
`InvoiceAllowanceOperation` 作業記錄、ambiguous 處理。

複製一份到 invoice-events 會產生兩套會漂移的併發邏輯，屬於明確的技術債。
改為抽出不含 admin 稽核／權限的核心函式（暫名 `runInvoiceAllowanceOperation`），
admin procedure 與自動退款流程都呼叫它，admin 那側額外保留 `recordAdminAction`。

### 2. 折讓金額用「剩餘可折讓額」，不用發票總額

既有 procedure 已有 `input.amount + invoice.allowanceTotal > invoice.amount` 的上限檢查。
自動折讓若硬編 `invoice.amount`，遇到已有部分折讓的發票會直接超額報錯。
用 `invoice.amount - invoice.allowanceTotal` 才正確；若該值 `<= 0`（已全額折讓完），
視為已完成，不再發起，直接把 `attentionReason` 清空。

### 3. 只自動化「跨月」這一條路

`invoice-events.ts:181` 與 `:368` 的 `REFUND_NEEDS_ALLOWANCE` 是「void 已送出但成敗未知」，
此時自動折讓的風險是：作廢其實成功了，再折讓一次 → 對同一張發票雙重沖銷。
這兩條維持標記等人工，本次不碰。

### 4. 失敗一律 fail-closed 回既有人工路徑

自動折讓任何失敗都不可讓退款流程「看起來成功」。失敗 → 回 `REFUND_NEEDS_ALLOWANCE`
（後台按鈕仍解鎖，Fish 可手動處理），與今天行為一致，不會比現況更糟。

### 5. 測試注入 now，不改業務規則

`assertInvoiceVoidable(invoice, now = new Date())` 已支援注入。
兩個失敗測試改為傳入固定 `now`（與寫死的 `invoiceDate` 同月），業務規則一行不動。

## Risks（逆推失敗點，對應紅燈測試）

| # | 失敗點 | 後果 |
|---|---|---|
| R1 | 併發兩次退款同一張發票 | 折讓兩次，客人被沖銷雙倍 |
| R2 | 自動折讓與 admin 手動折讓同時發生 | 同上 |
| R3 | 折讓金額算成 `invoice.amount` 而非剩餘額 | 已部分折讓的發票超額報錯，退款卡住 |
| R4 | provider 回 ambiguous 卻被當成功 | 帳面標成已折讓，實際可能沒送出 |
| R5 | 自動折讓失敗後沒退回人工路徑 | 發票卡在 `ALLOWANCE_IN_PROGRESS`，Fish 後台按鈕被鎖住，無法補救 |
| R6 | 誤把「void 結果未知」那兩條也自動折讓 | 作廢＋折讓雙重沖銷 |
| R7 | 剩餘可折讓額為 0 時仍發起 | 供應商報錯，退款流程卡住 |
| R8 | 跨月判斷被改壞，同月也走折讓 | 同月本該作廢卻開折讓，帳務處理方式錯誤 |

## Open Questions

（無。範圍與邊界已於 2026-09-02 與 Fish 確認：退款一律全額、不放寬作廢界線、
不動 void 結果未知的路徑）
