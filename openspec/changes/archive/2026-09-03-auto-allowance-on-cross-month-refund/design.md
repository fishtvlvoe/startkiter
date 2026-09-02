# Design: auto-allowance-on-cross-month-refund

## 現況（改動前）

```
handleRefundInvoice(orderId)
  └─ reserveRefundInvoice
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
reserveRefundInvoice
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

## 2026-09-03 前置調查結果（cross-impact + 保護機制盤點，PM 已逐項覆核）

### 🔴 必須處理的兩點

**F1｜既有測試會直接紅燈，必須同步改**
`packages/api/modules/course/lib/refund-invoice.test.ts` 有一則
`it("marks a cross-month refund for manual allowance handling")`，精確斷言
`db.invoice.update` 被以 `data: { attentionReason: "REFUND_NEEDS_ALLOWANCE" }` 呼叫。
本次改動後跨月不再只標記，此測試必定失敗。**這是預期中的行為變更，測試要改寫成斷言
「自動折讓被呼叫且金額正確」**，不是刪掉、也不是放寬。原本 tasks.md 漏列此項，已補為 3.6。

**F2｜不可改呼叫底層 lib 的 `issueInvoiceAllowance`（它沒有任何保護）**
`packages/api/modules/course/lib/invoice-operations.ts` 的 `issueInvoiceAllowance`（第 42 行）
只做「呼叫 provider + 計算回傳狀態」，PM 實查確認其函式體內
`withInvoiceOperationLock` / `updateMany` / `operationToken` / `InvoiceAllowanceOperation`
四個關鍵字**一個都沒有**（唯一命中的 `allowanceId` 只是傳給 provider 的參數）。
全部 13 條併發保護都在 `procedures/invoice-operations.ts` 的 `adminProcedure` 那一層。

因此：
- ❌ 錯誤做法：退款流程直接呼叫 lib 層函式 → 失去全部冪等與併發保護，直接踩 R1/R2 雙重折讓
- ❌ 錯誤做法：退款流程呼叫 `adminProcedure` 版 → 該流程的呼叫端是背景程序
  （`apps/saas/lib/orders.ts` 金流 webhook、`cancel-course-subscription.ts` 訂閱取消），
  **沒有登入 session、沒有 `context.user`**，會直接爆掉
- ✅ 正確做法（維持本 design 決策 1）：從 `adminProcedure` 抽出**含全部保護**的核心函式，
  參數化「稽核資訊」，admin 那側傳真人 userId，自動流程傳系統識別

### ⚠️ 五個要補進實作的細節

| # | 內容 | 處理方式 |
|---|---|---|
| F3 | `reserveRefundInvoice` 目前沒 include `order`/`subscription` 的 `invoiceType`，但折讓要靠它判斷 ezpay+COMPANY 的 `taxExclusive` | 補進該查詢的 include，並在測試涵蓋 taxExclusive 傳遞正確 |
| F4 | 後台按鈕 `InvoiceOperationsButtons.tsx:24` 靠 `attentionReason === "REFUND_NEEDS_ALLOWANCE"` 解鎖折讓入口 | 自動折讓失敗的 fallback **必須**回填該值，否則管理員失去手動補救入口（已是 R5，此處確認前端依賴點） |
| F5 | 後台訂單列表 `admin/orders/page.tsx:46,114` 有「已跨月，請改用折讓」提示文字 | 自動折讓成功後此提示會變誤導，需檢查顯示條件並調整 |
| F6 | 租約常數在兩個檔案各自定義（`OPERATION_LEASE_MS` / `PENDING_INVOICE_RETRY_AFTER_MS`），數值同為 60 秒但未共用 | 抽核心時合併為單一常數來源，避免日後改一邊漏一邊 |
| F7 | **稽核缺口**：`recordAdminAction` 只在真人 procedure 呼叫，`invoice-events.ts` 全部自動流程都沒有 | 抽核心時為系統動作設計稽核管道（不可假設一定有真人 userId），至少讓自動折讓留下可追溯紀錄 |

### 已確認的技術事實（供實作參考，不用再查）

- `withInvoiceOperationLock` 是 Postgres `pg_advisory_xact_lock`（transaction-scoped 資料庫層鎖），
  多 Node 進程都會排到同一把，不會失效；代價是全站發票操作共用一把全域鎖
- `allowanceId` 組成 = `ALLOW-${invoice.id}-${allowanceTotal + amount}`，把累計總額算進去當唯一鍵
- 租約 60 秒；`operationStartedAt` 為 null 或超過租約即可判定前一次作業已死、可搶回
- `ambiguous` 來自 provider 回傳，為 true 時寫 `UNKNOWN` 狀態並鎖進 `ALLOWANCE_NEEDS_REVIEW`，
  擋住後續一切操作直到人工查證
- 實際函式名是 `reserveRefundInvoice`（不是 `reserveInvoiceRefund`），位於 `invoice-events.ts:167`

完整報告：`scratchpad/cross-impact-allowance.md`、`scratchpad/allowance-protection-inventory.md`

## Open Questions

（無。範圍與邊界已於 2026-09-02 與 Fish 確認：退款一律全額、不放寬作廢界線、
不動 void 結果未知的路徑）
