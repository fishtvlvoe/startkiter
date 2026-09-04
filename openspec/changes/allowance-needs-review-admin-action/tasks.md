# Tasks: allowance-needs-review-admin-action

## 0. 前置

- [x] 0.1 Cross-impact 預檢：grep `InvoiceOperationsButtons`、`attentionReason`、
      `ALLOWANCE_NEEDS_REVIEW`、`VOID_NEEDS_REVIEW` 所有呼叫端，確認沒有其他地方
      假設這兩個狀態「不會被清除」（例如報表、對帳腳本按這個欄位篩選卡住的發票）

## 1. TDD 紅燈（Phase 2，只寫測試，不寫實作）

- [x] 1.0 對應規格 Requirement「Issued invoices can be voided within the same
      billing period or credited with an allowance across periods」新增的
      4 個 `resolve` 情境，逐一列成下面的紅燈測試
- [x] 1.1 `packages/api/modules/course/procedures/invoice-operations.test.ts` 新增
      design.md 紅燈矩陣列出的 8 支測試（`resolveInvoiceReview` 各分支 + 併發 + 權限）
- [x] 1.2 `apps/saas/modules/admin/component/InvoiceOperationsButtons.test.tsx`
      新增：`attentionReason` 為 `ALLOWANCE_NEEDS_REVIEW`／`VOID_NEEDS_REVIEW` 時
      渲染出兩個按鈕（而非目前的純文字）
- [x] 1.3 全部跑一次，確認上述測試皆為紅燈（procedure 不存在／元件邏輯還沒改）

## 2. 實作（Phase 3）

- [x] 2.1 `packages/api/modules/course/procedures/invoice-operations.ts` 新增
      `resolveInvoiceReview` procedure，依 design.md 分支邏輯實作，沿用
      `withInvoiceOperationLock` + `updateMany` where 比對
- [x] 2.2 `apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx` 改造：
      `ALLOWANCE_NEEDS_REVIEW`／`VOID_NEEDS_REVIEW` 分支顯示 `failReason` + 兩個
      操作按鈕（各自帶確認二次點擊的 state，比照現有 `confirm` pattern）；折讓的
      「確認已完成」路徑加一個選填的「折讓單號」輸入框
- [x] 2.3 跑 1.1／1.2 的測試，確認轉綠燈

## 3. 驗證

- [x] 3.1 `pnpm --filter api test`、`pnpm --filter saas test` 全綠
- [x] 3.2 `pnpm type-check` 全綠
- [x] 3.3 ego-browser 實測：本機造出一筆 `ALLOWANCE_NEEDS_REVIEW` 的發票（直接寫
      DB 模擬），登入後台，分別點「確認已完成」「確認未完成」，截圖驗證兩條路徑
      UI 與資料庫狀態都正確
- [x] 3.4 交叉審查：另一個 CLI 或子代理專門檢查 R1（雙重點擊競態）跟 R3（找不到
      operation 卻允許成功）這兩條，不只看測試覆蓋率

## 4. 收尾

- [x] 4.1 `spectra validate` 通過
- [x] 4.2 更新 `openspec/site-remediation-tracker.md`：「後續建議（未做）」那段
      改成已完成，附 commit
- [ ] 4.3 `spectra archive`
