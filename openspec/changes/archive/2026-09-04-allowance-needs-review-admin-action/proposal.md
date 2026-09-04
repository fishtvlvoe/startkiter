# Proposal: allowance-needs-review-admin-action

## Why

發票折讓／作廢的「結果不確定」狀態，後台完全沒有出口。

現況（`InvoiceOperationsButtons.tsx:24-27`）：只要 `attentionReason` 不是
`REFUND_NEEDS_ALLOWANCE`，一律只顯示一行文字「發票作業待確認：{原因}」，沒有任何按鈕。
這涵蓋兩種真實會發生的卡住狀態：

- `ALLOWANCE_NEEDS_REVIEW` — 折讓呼叫供應商後結果不明（逾時／provider 不支援查詢／
  查詢本身失敗），系統 fail-safe 標記待人工確認，避免自動重試造成重複折讓
- `VOID_NEEDS_REVIEW` — 作廢呼叫供應商後結果不明，同樣邏輯（`invoice-operations.ts:47/56/93`）

這兩個狀態都不是暫時性的——沒有排程會去碰它們（`retryPendingInvoices` 只掃
`ALLOWANCE_IN_PROGRESS`／`VOID_IN_PROGRESS`，不掃 `*_NEEDS_REVIEW`），一旦發生，
發票會永遠卡著：錢可能已經退給客人，帳務憑證卻沖銷不了，只能等工程師手動改資料庫。

這是 2026-09-03 `auto-allowance-on-cross-month-refund` 完工時就記錄在案的既有缺陷
（`site-remediation-tracker.md` 第 82-109 行），這次補齊。

## What Changes

- 後台發票操作按鈕（`InvoiceOperationsButtons.tsx`）新增：當 `attentionReason` 是
  `ALLOWANCE_NEEDS_REVIEW` 或 `VOID_NEEDS_REVIEW` 時，顯示 `failReason` 內容 +
  兩個操作按鈕：
  - **「確認已完成」**：operator 已經去 ECPay/ezPay 後台親眼確認該筆折讓／作廢
    真的成功了 → 系統補寫正確狀態（折讓：`status=ALLOWANCE`、`allowanceTotal`
    累加；作廢：`status=VOIDED`）
  - **「確認未完成，解除卡住」**：operator 確認供應商那邊沒有真的成功 → 清除
    `attentionReason`，讓發票回到可以重新操作的狀態（折讓：可重新按「開立折讓」；
    作廢：`canVoid` 若仍成立可重新按「作廢發票」，跨月則走折讓）
- 新增一支 admin procedure `resolveInvoiceReview`，沿用既有
  `withInvoiceOperationLock` + `updateMany` where 比對 `attentionReason` 的併發
  保護寫法（跟 `voidInvoice`／`issueInvoiceAllowance` 同一套模式，不另造一套）
- 折讓的「確認已完成」路徑會去讀對應 `InvoiceAllowanceOperation`（`status: "UNKNOWN"`
  的那筆，這是進入 `ALLOWANCE_NEEDS_REVIEW` 時系統自己標記的）拿正確金額寫回，
  不需要 operator 重新輸入金額；operator 可選填一個「折讓單號」欄位供帳務對照

## Non-Goals

- 不做自動查詢供應商來解決 `*_NEEDS_REVIEW`（會查的話一開始就不會卡在這裡，
  provider 不支援查詢或查詢本身失敗才會走到這步）
- 不改 `ALLOWANCE_IN_PROGRESS`／`VOID_IN_PROGRESS` 的自動回收邏輯（`retryPendingInvoices`
  現有排程已經在處理，這兩個是暫時性狀態，正常會自己過）
- 不新增資料庫欄位／migration（`failReason`、`InvoiceAllowanceOperation.status`
  現有欄位就夠用）
- 這是人工判斷後的「補登記」動作，不做任何自動化防呆去驗證 operator 講的是不是真的
  ——跟現有「開立折讓」讓 operator 自己輸入金額一樣，本來就是建立在「Fish 會先去
  供應商後台看過」這個前提上
