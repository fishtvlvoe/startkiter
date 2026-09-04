# Design: allowance-needs-review-admin-action

## 現況程式碼位置

- `apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx:24-27` — 卡住的地方，
  只要 `attentionReason` 不是 `REFUND_NEEDS_ALLOWANCE` 就直接 return 一行文字
- `packages/api/modules/course/lib/invoice-events.ts:541/551/579/586` — 4 處把發票
  標成 `ALLOWANCE_NEEDS_REVIEW` 的地方（`recoverStaleAllowance`）
- `packages/api/modules/course/procedures/invoice-operations.ts:47/56/93` — 3 處把
  發票標成 `VOID_NEEDS_REVIEW` 的地方（`voidInvoice` 內）
- `packages/database/prisma/schema.prisma:807-853` — `Invoice.failReason`、
  `InvoiceAllowanceOperation.status`（含既有的 `"UNKNOWN"` 值）已存在，不需要 migration

## 新增 procedure 設計

```
resolveInvoiceReview({ invoiceId, outcome: "SUCCEEDED" | "FAILED", allowanceNumber?: string })
```

沿用 `voidInvoice`／`issueInvoiceAllowance` 同一套併發保護：

1. `withInvoiceOperationLock` 內 `updateMany` where 比對目前的 `attentionReason`
   （`ALLOWANCE_NEEDS_REVIEW` 或 `VOID_NEEDS_REVIEW` 其中之一），`count !== 1` 就
   丟錯（代表別的請求已經先處理過，樂觀鎖擋下重複點擊/雙分頁）
2. 依 `attentionReason` 分兩條路：
   - `ALLOWANCE_NEEDS_REVIEW` + `outcome=SUCCEEDED`：找該發票 `status: "UNKNOWN"`
     的 `InvoiceAllowanceOperation`（沒有就丟錯，這代表資料本身就有問題，不能假裝成功）
     → `invoice.status="ALLOWANCE"`、`allowanceTotal += operation.amount`、
     `attentionReason=null`、`failReason=null`；`operation.status="SUCCEEDED"`，
     `allowanceNumber` 寫入 operator 選填的值
   - `ALLOWANCE_NEEDS_REVIEW` + `outcome=FAILED`：`attentionReason=null`、
     `failReason=null`；對應 operation `status="FAILED"`（讓下次「開立折讓」是全新
     `allowanceId`，不會跟這筆失敗的搞混）
   - `VOID_NEEDS_REVIEW` + `outcome=SUCCEEDED`：`invoice.status="VOIDED"`、
     `attentionReason=null`、`failReason=null`
   - `VOID_NEEDS_REVIEW` + `outcome=FAILED`：`attentionReason=null`、`failReason=null`
     （狀態留在 `ISSUED`，`canVoid` 由既有邏輯依目前日期重新判斷）
3. 全程 `recordAdminAction` 記一筆稽核紀錄（沿用 `voidInvoice` 已經在用的
   `recordAdminAction`，operator 是誰、何時、對哪張發票做了什麼決定要留痕）

## Risks（正推＋逆推）

| # | 風險 | 逆推假設失敗原因 | 對策 |
| --- | --- | --- | --- |
| R1 | 雙重確認：operator 兩個分頁都點「確認已完成」 | `updateMany` where 沒鎖住目前狀態，兩次都成功套用，`allowanceTotal` 被加兩次 | where 比對 `attentionReason: "ALLOWANCE_NEEDS_REVIEW"`，`count!==1` 就丟錯，第二次點擊會失敗而非重複套用 |
| R2 | operator 誤按「確認已完成」但供應商其實沒成功 | 這是人為判斷錯誤，系統無法從技術面完全防呆 | 沿用既有折讓/作廢一樣「操作即留痕」的設計；`recordAdminAction` 記錄決定者與時間，供事後追查；proposal 已明講 Non-Goal 不做自動驗證 |
| R3 | `ALLOWANCE_NEEDS_REVIEW` 但找不到對應 `status:"UNKNOWN"` 的 operation | schema 允許 `allowanceOperations` 為空陣列，或資料被其他流程動過 | 找不到就丟錯，不猜測金額、不允許「確認已完成」通過；operator 只能選「確認未完成」把發票解鎖 |
| R4 | 解除卡住後，`canVoid` 判斷用舊的 `attentionReason` 值（React Query 快取沒刷新） | 前端沒有 `router.refresh()` | 沿用既有 `onSuccess: () => router.refresh()` 模式（`InvoiceOperationsButtons.tsx` 現有 `voidMutation`／`allowanceMutation` 都這樣做） |
| R5 | 這個新按鈕被非 operator 呼叫 | procedure 沒檢查權限 | 用 `adminProcedure`（跟 `voidInvoice`／`issueInvoiceAllowance` 同一個 base procedure，已內建 operator 檢查） |

## TDD 紅燈矩陣（Phase 2，先寫測試確認會失敗，再寫實作）

| 失敗點 | 紅燈測試名稱 | 預期錯誤訊息／行為 |
| --- | --- | --- |
| 目前完全沒有 `resolveInvoiceReview` 這支 procedure | `resolveInvoiceReview: rejects unknown invoiceId` | `ORPCError NOT_FOUND`（procedure 不存在時測試應直接編譯/import 失敗，第一步是先讓它能被呼叫但邏輯還沒寫，回傳錯誤） |
| ALLOWANCE_NEEDS_REVIEW + SUCCEEDED 沒有正確累加 allowanceTotal | `resolves ALLOWANCE_NEEDS_REVIEW as SUCCEEDED and increments allowanceTotal by the UNKNOWN operation amount` | 呼叫後 `invoice.status==="ALLOWANCE"`、`allowanceTotal` 增加值等於該筆 operation 的 `amount`，且該 operation `status==="SUCCEEDED"` |
| ALLOWANCE_NEEDS_REVIEW + FAILED 沒有清除卡住狀態 | `resolves ALLOWANCE_NEEDS_REVIEW as FAILED and clears attentionReason without changing allowanceTotal` | `attentionReason===null`，`allowanceTotal` 不變，operation `status==="FAILED"` |
| VOID_NEEDS_REVIEW + SUCCEEDED 沒有正確轉成 VOIDED | `resolves VOID_NEEDS_REVIEW as SUCCEEDED and sets status to VOIDED` | `invoice.status==="VOIDED"` |
| VOID_NEEDS_REVIEW + FAILED 沒有解鎖 | `resolves VOID_NEEDS_REVIEW as FAILED and clears attentionReason, leaving status ISSUED` | `attentionReason===null`、`status` 保持 `ISSUED` |
| 找不到 UNKNOWN operation 卻假裝成功（R3） | `rejects SUCCEEDED resolution for ALLOWANCE_NEEDS_REVIEW when no UNKNOWN operation exists` | 拋錯，`invoice` 完全沒被更新（`allowanceTotal`／`attentionReason` 都不變） |
| 雙重點擊競態（R1） | `second concurrent resolveInvoiceReview call on the same invoice fails and does not double-apply` | 第二次呼叫因 `updateMany` where 不符而拋錯，`allowanceTotal` 只被加一次 |
| 前端沒顯示按鈕（目前的 bug 本身） | `InvoiceOperationsButtons` component test：`renders resolution actions when attentionReason is ALLOWANCE_NEEDS_REVIEW` | 目前這個測試會失敗，因為現在的程式碼在這個分支只 return 一行文字，沒有 button |
| 非 operator 呼叫被擋 | `rejects resolveInvoiceReview from a non-operator session` | 403（沿用 `adminProcedure` 既有行為，屬既有機制驗證非新邏輯，優先度較低） |

以上紅燈測試先寫、先跑一次確認真的是紅燈（尤其「找不到 procedure」那筆，必須先看到
編譯期或執行期真的失敗），再進 Phase 3 寫 `resolveInvoiceReview` 實作本身。
