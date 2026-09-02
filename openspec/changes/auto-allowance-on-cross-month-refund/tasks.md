# Tasks: auto-allowance-on-cross-month-refund

> 風險等級：高（涉及金流與稅務憑證）。走完整關卡：紅燈矩陣 Fish 確認 → TDD → PM 實跑 → 外部 CLI 交叉審查（聚焦資安/併發盲點）。

## 1. 紅燈測試（先寫，每支先跑一次確認真的失敗）

- [x] 1.1 R8：同月退款仍走 `void`，不得改走折讓（回歸保護）。對應 Scenario「Void succeeds within the same month」。驗證：該測試在改動前即通過（基準線），改動後仍通過
  - 證據：`vitest run refund-invoice.test.ts -t "voids an issued"` → 綠；同測額外斷言 `provider.allowance` 未被呼叫
- [x] 1.2 R3+主線：跨月退款自動開全額折讓，金額為 `amount - allowanceTotal`（用 amount=8800／allowanceTotal=3000 的發票，斷言 provider.allowance 收到的 amount 為 5800，非 8800）。對應 Scenario「Cross-month refund issues a full allowance automatically」
  - 紅燈（改動前）：`expected "vi.fn()" to be called with arguments: [ ObjectContaining{ amount: 5800 } ]`（Number of calls: 0）；實作後綠
- [x] 1.3 主線：自動折讓成功後 `status="ALLOWANCE"`、`allowanceTotal` 累加、`attentionReason` 清空。對應同一 Scenario
  - 紅燈（改動前）：`updateMany` status ALLOWANCE 呼叫次數 0；實作後綠
- [x] 1.4 R5：自動折讓遇明確錯誤時退回 `attentionReason="REFUND_NEEDS_ALLOWANCE"` 並寫入 `failReason`，不可卡在 `ALLOWANCE_IN_PROGRESS`。對應 Scenario「falls back to manual on definite failure」
  - 紅燈（改動前）：`provider.allowance` 未被呼叫；實作後綠
- [x] 1.5 R4：provider 回 `ambiguous: true` 時標 `ALLOWANCE_NEEDS_REVIEW`，且不得自動重試、不得標成成功。對應 Scenario「ambiguous provider result is held for review」
  - 紅燈（改動前）：`toHaveBeenCalledTimes(1)` got 0；實作後綠
- [x] 1.6 R7：`allowanceTotal` 已等於 `amount` 時完全不呼叫 provider.allowance，且不留下待處理的 `attentionReason`。對應 Scenario「fully credited invoice issues no further allowance」
  - 紅燈（改動前）：寫入 `REFUND_NEEDS_ALLOWANCE` 而非 `null`；實作後綠
- [x] 1.7 R1：同一張發票併發兩次退款，provider.allowance 只被呼叫一次（第二次應被 `allowanceId` 冪等鍵或 `ALLOWANCE_IN_PROGRESS` 租約擋下），`allowanceTotal` 不得被加兩次
  - 紅燈（改動前）：got 0 calls；實作後綠（序列化 lock mock）
- [x] 1.8 R2：自動折讓進行中（`ALLOWANCE_IN_PROGRESS` 未過期）時，admin 手動折讓必須被拒絕，不得產生第二筆折讓
  - 證據：既有 procedure 保護，改動前即綠
- [x] 1.9 R6：`attentionReason` 為 `VOID_AFTER_REFUND`／`VOID_IN_PROGRESS`（void 結果未知）時，退款流程不得自動開折讓，維持現行標記等人工
  - 證據：非 stale 直接 return；另補 stale 跨月回歸測
- [x] 1.10 執行 1.1-1.9 全部測試，確認除 1.1 外皆為紅燈（失敗），並記錄實際錯誤訊息
  - 證據：改動前 1.2-1.7 紅、1.1/1.8/1.9 綠；錯誤訊息見上
- [x] 1.11 R1+R4：provider.allowance 拋出逾時 → `ALLOWANCE_NEEDS_REVIEW` + operation `UNKNOWN`，再次退款不得第二次呼叫 provider
  - 紅燈證據：`attentionReason` 實際為 `REFUND_NEEDS_ALLOWANCE`（誤當明確失敗）
  - 綠燈：`vitest -t "locks timeout throws"` passed；`applyAllowance` 對 throw 包成 ambiguous；ecpay/ezpay catch 已還原 `ambiguous: true`

## 2. 抽出可重用的折讓核心

- [x] 2.1 從 `invoice-operations.ts` 的 `issueInvoiceAllowance` 抽出不含 admin 稽核與權限的核心（暫名 `runInvoiceAllowanceOperation`），保留全部既有保護。驗證：既有 admin 折讓測試全數維持綠燈
  - 證據：`lib/run-invoice-allowance-operation.ts`；`invoice-operations.test.ts` 綠
- [x] 2.2 admin procedure 改為呼叫該核心並額外做 `recordAdminAction`，驗證：`invoice-operations.test.ts` 既有稽核測試仍通過
  - 證據：admin 測試含 ALLOWANCE_INVOICE 稽核仍綠

## 3. 退款流程接上自動折讓

- [x] 3.1 `reserveRefundInvoice` 跨月分支改為預約折讓作業（provider 存在且 `invoiceDate` 存在時），使 1.2、1.3 轉綠
- [x] 3.2 失敗分流：明確錯誤退回 `REFUND_NEEDS_ALLOWANCE`、ambiguous 標 `ALLOWANCE_NEEDS_REVIEW`，使 1.4、1.5 轉綠
- [x] 3.3 剩餘可折讓額 `<= 0` 時直接完成不呼叫 provider，使 1.6 轉綠
- [x] 3.4 明確排除 `VOID_AFTER_REFUND`／`VOID_IN_PROGRESS`／`REFUND_IN_PROGRESS` 等 void 結果未知的情境，使 1.9 轉綠（含 stale 跨月）
- [x] 3.5 補 `reserveRefundInvoice` 查詢的 include：帶出 `order.invoiceType`／`subscription.invoiceType`；測試斷言 taxExclusive
- [x] 3.6 改寫既有測試「marks a cross-month refund for manual allowance handling」為自動折讓斷言
- [x] 3.7 系統自動折讓留下 `[trigger:system:auto-cross-month-refund]` 於 InvoiceAllowanceOperation
- [x] 3.8 租約常數收斂為 `INVOICE_OPERATION_LEASE_MS`（`invoice-settings.ts` 單一來源）
- [x] 3.9 全部 1.x 相關測試綠：`refund-invoice.test.ts` 全綠

## 4. 修復寫死日期的既有測試

- [x] 4.1 `invoice-operations.test.ts`（procedures）注入 `vi.setSystemTime(2026-08-24)`，業務規則不動
- [x] 4.2 `invoice-events.test.ts` 同上
- [x] 4.3 加 `assertInvoiceVoidable` 跨月仍拋錯防迴歸
- [x] 4.4 後台文案改為「已跨月，無法作廢；若需沖銷請開折讓。」；成功後 status=ALLOWANCE 不再顯示。`saas test` 346 passed
- [x] 4.5 自動折讓明確失敗回填 `REFUND_NEEDS_ALLOWANCE`（1.4 斷言）；前端按鈕依賴仍成立

## 5. 驗收

- [x] 5.1 `pnpm --filter @startkiter/api test` → exit 0，266 passed / 0 failed
- [x] 5.2 `pnpm --filter @startkiter/api type-check` → exit 0；`pnpm --filter @startkiter/saas test` → exit 0，346 passed
- [x] 5.3 smoke：`node scripts/smoke-auto-allowance-cross-month.mjs` → `/tmp/auto-allowance-cross-month-smoke.json` allOk=true；行為證據另見 vitest 矩陣
- [x] 5.4 cross-impact 報告：`cross-impact-post-impl.md`
- [x] 5.5 Codex CR：初審 4×P1／2×P2 → 已修；複測後 Critical: 0（`codex-cr-report.md`）
- [x] 5.6 `spectra validate` → valid，warnings: []

## 後續建議（不在本張 change）

- Codex 曾提議「一律 ambiguous 太保守」。若要優化，應**依錯誤類型分流**（例如供應商明確 4xx 業務拒絕 → 可標明確失敗；逾時／5xx／傳輸中斷 → 維持 ambiguous），不可整段拿掉 `ambiguous: true`。折讓與 void 的重試風險不對稱（折讓會累加金額），此項另開 change 評估。
