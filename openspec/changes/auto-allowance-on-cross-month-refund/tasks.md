# Tasks: auto-allowance-on-cross-month-refund

> 風險等級：高（涉及金流與稅務憑證）。走完整關卡：紅燈矩陣 Fish 確認 → TDD → PM 實跑 → 外部 CLI 交叉審查（聚焦資安/併發盲點）。

## 1. 紅燈測試（先寫，每支先跑一次確認真的失敗）

- [ ] 1.1 R8：同月退款仍走 `void`，不得改走折讓（回歸保護）。對應 Scenario「Void succeeds within the same month」。驗證：該測試在改動前即通過（基準線），改動後仍通過
- [ ] 1.2 R3+主線：跨月退款自動開全額折讓，金額為 `amount - allowanceTotal`（用 amount=8800／allowanceTotal=3000 的發票，斷言 provider.allowance 收到的 amount 為 5800，非 8800）。對應 Scenario「Cross-month refund issues a full allowance automatically」
- [ ] 1.3 主線：自動折讓成功後 `status="ALLOWANCE"`、`allowanceTotal` 累加、`attentionReason` 清空。對應同一 Scenario
- [ ] 1.4 R5：自動折讓遇明確錯誤時退回 `attentionReason="REFUND_NEEDS_ALLOWANCE"` 並寫入 `failReason`，不可卡在 `ALLOWANCE_IN_PROGRESS`。對應 Scenario「falls back to manual on definite failure」
- [ ] 1.5 R4：provider 回 `ambiguous: true` 時標 `ALLOWANCE_NEEDS_REVIEW`，且不得自動重試、不得標成成功。對應 Scenario「ambiguous provider result is held for review」
- [ ] 1.6 R7：`allowanceTotal` 已等於 `amount` 時完全不呼叫 provider.allowance，且不留下待處理的 `attentionReason`。對應 Scenario「fully credited invoice issues no further allowance」
- [ ] 1.7 R1：同一張發票併發兩次退款，provider.allowance 只被呼叫一次（第二次應被 `allowanceId` 冪等鍵或 `ALLOWANCE_IN_PROGRESS` 租約擋下），`allowanceTotal` 不得被加兩次
- [ ] 1.8 R2：自動折讓進行中（`ALLOWANCE_IN_PROGRESS` 未過期）時，admin 手動折讓必須被拒絕，不得產生第二筆折讓
- [ ] 1.9 R6：`attentionReason` 為 `VOID_AFTER_REFUND`／`VOID_IN_PROGRESS`（void 結果未知）時，退款流程不得自動開折讓，維持現行標記等人工
- [ ] 1.10 執行 1.1-1.9 全部測試，確認除 1.1 外皆為紅燈（失敗），並記錄實際錯誤訊息

## 2. 抽出可重用的折讓核心

- [ ] 2.1 從 `invoice-operations.ts` 的 `issueInvoiceAllowance` 抽出不含 admin 稽核與權限的核心（暫名 `runInvoiceAllowanceOperation`），保留全部既有保護：`allowanceId` 冪等鍵、`SUCCEEDED` 短路、`PENDING` 拒絕重送、stale 租約 reclaim、`ALLOWANCE_IN_PROGRESS` 佔位、`InvoiceAllowanceOperation` 記錄、ambiguous 分流。驗證：既有 admin 折讓測試全數維持綠燈（不得有任何行為改變）
- [ ] 2.2 admin procedure 改為呼叫該核心並額外做 `recordAdminAction`，驗證：`invoice-operations.test.ts` 既有稽核測試仍通過

## 3. 退款流程接上自動折讓

- [ ] 3.1 `reserveInvoiceRefund` 跨月分支改為預約折讓作業（provider 存在且 `invoiceDate` 存在時），使 1.2、1.3 轉綠
- [ ] 3.2 失敗分流：明確錯誤退回 `REFUND_NEEDS_ALLOWANCE`、ambiguous 標 `ALLOWANCE_NEEDS_REVIEW`，使 1.4、1.5 轉綠
- [ ] 3.3 剩餘可折讓額 `<= 0` 時直接完成不呼叫 provider，使 1.6 轉綠
- [ ] 3.4 明確排除 `VOID_AFTER_REFUND`／`VOID_IN_PROGRESS`／`REFUND_IN_PROGRESS` 等 void 結果未知的情境，使 1.9 轉綠
- [ ] 3.5 補 `reserveRefundInvoice` 查詢的 include：帶出 `order.invoiceType` / `subscription.invoiceType`，供折讓判斷 ezpay+COMPANY 的 `taxExclusive`（design F3）。驗證：測試斷言 provider.allowance 收到正確的 taxExclusive
- [ ] 3.6 **改寫既有測試** `packages/api/modules/course/lib/refund-invoice.test.ts` 的 `it("marks a cross-month refund for manual allowance handling")`：原本斷言 `attentionReason: "REFUND_NEEDS_ALLOWANCE"`，改為斷言「自動折讓被呼叫、金額 = amount - allowanceTotal、成功後 status 為 ALLOWANCE」（design F1）。**禁止刪除該測試或改成寬鬆斷言**，這是行為變更的正式記錄點
- [ ] 3.7 為系統自動流程設計稽核管道（design F7）：`recordAdminAction` 目前只在真人 procedure 呼叫，自動折讓不可假設有真人 userId。至少讓自動折讓在 `InvoiceAllowanceOperation` 或等效位置留下可追溯的「由系統自動觸發」標記。驗證：測試斷言自動流程完成後存在該紀錄
- [ ] 3.8 合併重複的租約常數（design F6）：`OPERATION_LEASE_MS` 與 `PENDING_INVOICE_RETRY_AFTER_MS` 兩處各自定義、數值同為 60 秒，抽核心時收斂為單一來源。驗證：`grep -rn "60_000\|60000" 相關檔案` 確認只剩一處定義
- [ ] 3.9 執行全部 1.x 測試確認轉綠，驗證：`pnpm --filter @startkiter/api test` 相關檔案全綠

## 4. 修復寫死日期的既有測試

- [ ] 4.1 `invoice-operations.test.ts` 作廢測試改為注入固定 `now`（與寫死的 `invoiceDate 2026-08-24` 同月），業務規則一行不動。驗證：該測試在任何日期執行皆通過
- [ ] 4.2 `invoice-events.test.ts` 同上處理。驗證：同上
- [ ] 4.3 加一支防迴歸測試：斷言 `assertInvoiceVoidable` 在跨月時仍然拋錯（確認 4.1/4.2 不是靠放寬規則讓測試過）
- [ ] 4.4 檢查後台訂單列表 `apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx:46,114` 的「已跨月，請改用折讓」提示文字（design F5）：自動折讓成功後此提示會變誤導，調整顯示條件或文案。驗證：`pnpm --filter @startkiter/saas test` 相關測試綠燈 + 說明調整後的顯示條件
- [ ] 4.5 確認前端 `InvoiceOperationsButtons.tsx:24` 的手動折讓入口在「自動折讓失敗」情境下仍可見（design F4）：該元件靠 `attentionReason === "REFUND_NEEDS_ALLOWANCE"` 解鎖。驗證：測試斷言自動折讓明確失敗後 attentionReason 確實被回填為該值

## 5. 驗收

- [ ] 5.1 PM 實跑 `pnpm --filter @startkiter/api test` 全綠（含 4.x 修復後應為 252/252 以上），附實際數字
- [ ] 5.2 PM 實跑 `pnpm --filter @startkiter/api type-check`、`pnpm --filter @startkiter/saas test` 全綠
- [ ] 5.3 PM 用假資料實跑一次跨月退款情境（腳本注入 mock provider），確認資料庫中發票真的變成 `ALLOWANCE`、`allowanceTotal` 正確，輸出存 `/tmp/`
- [ ] 5.4 cross-impact：grep `REFUND_NEEDS_ALLOWANCE`、`issueInvoiceAllowance`、`reserveInvoiceRefund`、`ALLOWANCE_IN_PROGRESS` 全部呼叫端，分類 ABCDEFG，報告寫入 change 目錄
- [ ] 5.5 派外部 CLI（非實作方）做交叉審查，聚焦：併發雙重折讓、金額計算邊界、ambiguous 處理、是否誤動 void 結果未知路徑。驗證：CR 報告 Critical 0
- [ ] 5.6 `spectra validate` 通過且 0 warnings
