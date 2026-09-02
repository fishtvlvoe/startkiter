# Cross-impact 分析：跨月退款自動開立全額折讓

分析範圍：`packages/` 與 `apps/`（排除 node_modules、prisma/generated）
基準：2026-09-03，資料庫欄位/程式行號以本次 grep 當下版本為準

## 符號查找備註

- `reserveInvoiceRefund` 查無此符號。實際對應函式名為 **`reserveRefundInvoice`**（`packages/api/modules/course/lib/invoice-events.ts:167`），推測是提案文字命名與程式碼實名順序相反，非漏改，特此標註避免誤判「沒找到＝已刪除」。

---

## 1. `REFUND_NEEDS_ALLOWANCE`

| 位置 | 說明 | 影響 |
|---|---|---|
| `packages/api/modules/course/procedures/invoice-operations.ts:144` | 手動開折讓 API 檢查：只允許 `attentionReason` 為 null 或 `REFUND_NEEDS_ALLOWANCE` 時才可繼續開立 | ✅ 不受影響，這條 guard 仍成立 |
| `packages/api/modules/course/lib/invoice-events.ts:181` | 來源失效（訂單/訂閱狀態改變）時作廢失敗，標記待人工處理 | ✅ 不同分支，不受影響 |
| `packages/api/modules/course/lib/invoice-events.ts:337` | **核心變更點**：`reserveRefundInvoice` 判斷跨月（`!sameTaiwanBillingMonth`）時，把發票標成 `REFUND_NEEDS_ALLOWANCE` 就直接 return，不再往下走作廢 | 🔴 這行就是本次要改的行為本身：改成自動呼叫折讓後，這裡不能再單純 return，必須改為觸發折讓流程，成功才清空 attentionReason，失敗才 fallback 回 `REFUND_NEEDS_ALLOWANCE`（或等效可辨識狀態） |
| `packages/api/modules/course/lib/invoice-events.ts:368` | `finalizeInvoiceRefund` 作廢失敗（非跨月分支）時的 fallback 標記 | ✅ 不同分支，維持人工介入，不受影響 |
| `apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx:24` | 後台按鈕：`attentionReason === "REFUND_NEEDS_ALLOWANCE"` 才解鎖手動折讓按鈕、且允許顯示金額輸入框 | ⚠️ 見下方「前端按鈕」專項分析 |
| `packages/api/modules/course/lib/refund-invoice.test.ts:78` | 測試斷言：`db.invoice.update` 呼叫 payload 為 `{ attentionReason: "REFUND_NEEDS_ALLOWANCE" }` | 🔴 這是精確物件比對（非 objectContaining），只要把「跨月直接標記」改成「跨月直接呼叫折讓」，這條測試必定紅燈，必須同步改寫測試期望（成功時斷言呼叫折讓、失敗時才斷言 fallback 標記） |
| `packages/api/modules/course/lib/refund-invoice.test.ts:92` | 測試斷言：provider 拋錯時 fallback 為 `REFUND_NEEDS_ALLOWANCE` | ⚠️ 這是「provider.void 拋錯」情境（同月流程），跟跨月折讓是不同分支，理論上不受影響，但改動時要小心別把兩個 fallback 邏輯混在一起改 |

## 2. `issueInvoiceAllowance`

| 位置 | 說明 | 影響 |
|---|---|---|
| `packages/api/modules/course/router.ts:17,296` | 註冊為 oRPC procedure | ✅ 不受影響 |
| `packages/api/modules/course/procedures/invoice-operations.ts:120` | **`adminProcedure`**：折讓 API，內部呼叫 `context.user.id` 寫 `recordAdminAction`（管理員操作紀錄），且假設呼叫端有登入 admin session | 🔴 若自動折讓的呼叫點是 `reserveRefundInvoice`／`handleRefundInvoice`（可能被 webhook、cron、訂閱取消等無使用者 session 的背景流程呼叫），**不能直接呼叫這支 adminProcedure**（缺 `context.user`/`context.session` 會直接噴錯或型別不合）。必須改呼叫同檔案 import 的底層 lib 函式 `applyAllowance`（即 `packages/api/modules/course/lib/invoice-operations.ts` 的 `issueInvoiceAllowance`，於 procedures 檔案第 10 行被 alias 為 `applyAllowance`），並在自動流程裡自己處理 `InvoiceAllowanceOperation` 冪等鍵與交易鎖，不能省略 |
| `packages/api/modules/course/procedures/invoice-operations.test.ts:44,95,123` | 針對 adminProcedure 的測試（`call()` 帶假 admin context） | ✅ 不受影響，這條 API 本身邏輯不變 |
| `packages/api/modules/course/lib/invoice-operations.ts:42` | 純邏輯層，計算折讓 payload、更新 `allowanceTotal` | ✅ 可被自動流程重用，介面不需改 |
| `packages/api/modules/course/lib/invoice-operations.test.ts:47` | 對純邏輯層的單元測試 | ✅ 不受影響 |
| `apps/saas/modules/admin/component/InvoiceOperationsButtons.tsx:19` | 前端呼叫 oRPC `issueInvoiceAllowance`（走 adminProcedure，帶登入 session） | ✅ 手動路徑不變 |

## 3. `reserveInvoiceRefund`

查無此符號，見上方「符號查找備註」。實際符號 `reserveRefundInvoice` 已併入 `REFUND_NEEDS_ALLOWANCE` 分析（第 337 行為核心變更點）。

## 4. `ALLOWANCE_IN_PROGRESS`

分佈於 `invoice-operations.ts` 折讓 API 全流程與 `invoice-events.ts` 的 stale allowance 復原邏輯（cron 補償）。這一組狀態機是「手動折讓」既有的併發鎖/冪等機制。

- ✅ 不受影響：這組狀態機本身邏輯完整、自成一組，本次改動若正確重用 `lib/invoice-operations.ts` 的 `applyAllowance` 與相同的 `InvoiceAllowanceOperation` 冪等鍵設計，理論上可以直接借用整套鎖定/復原機制，不需重寫。
- ⚠️ 需要在 tasks.md 補步驟：自動觸發折讓時，`reserveRefundInvoice` 目前只 `findUnique` invoice 本身，沒有 `include: { order: {...}, subscription: {...} }` 取得 `invoiceType`（`packages/api/modules/course/lib/invoice-events.ts` 對照 `invoice-operations.ts:128-134` 的寫法）；ezpay + COMPANY 的 `taxExclusive` 判斷需要這個欄位，若自動流程漏補這段查詢，稅別計算會用到 `undefined`，可能開錯金額的折讓。

## 5. `ALLOWANCE_NEEDS_REVIEW`

全部集中在折讓流程 provider 查詢失敗/供應商不支援查詢時的待人工複查狀態。

- ✅ 不受影響：這是折讓流程既有的「查無結果」保護傘，自動觸發折讓時若複用 `applyAllowance`，失敗時一樣會走到這條路徑，行為一致。

## 6. `handleRefundInvoice`

呼叫端（背景/webhook/cron 也會走到退款發票流程，對應題目第二個特別注意事項）：

| 呼叫端 | 情境 | 影響 |
|---|---|---|
| `packages/api/modules/course/procedures/refund-order.ts:19` | 管理員後台手動退款 API（有 admin session） | ✅ 這條路徑呼叫端本身有登入 context，若自動折讓走 lib 層不受影響 |
| `apps/saas/lib/orders.ts:195`（`markOrderRefundedInDb`） | **金流 webhook 回呼**觸發的退款確認，無使用者 session | 🔴／⚠️ 見上方 `issueInvoiceAllowance` adminProcedure 分析——這正是「背景流程」的實例，證實自動折讓不能直接呼叫 adminProcedure |
| `packages/api/modules/course/procedures/cancel-course-subscription.ts:103,131`（經 `handleRefundInvoiceForSubscription`） | 訂閱取消流程，同樣可能無 admin session（使用者自行取消訂閱） | 🔴／⚠️ 同上，確認這條路徑呼叫者情境（使用者本人 vs 系統） |

結論：`handleRefundInvoice` / `handleRefundInvoiceForSubscription` 是唯一集中入口，所有退款發票流程都收斂到 `reserveRefundInvoice`，這點對本次改動是好消息（只要改一處，呼叫端不用一一修改）；但呼叫情境確認有「無 admin session 的背景流程」，這直接放大上面 `issueInvoiceAllowance` adminProcedure 那個 🔴 的嚴重性。

## 7. `assertInvoiceVoidable`

僅用於「作廢」流程（`voidInvoice` 手動 API），跟折讓路徑無交集。

- ✅ 不受影響。

## 8. `sameTaiwanBillingMonth`

| 位置 | 說明 | 影響 |
|---|---|---|
| `packages/api/modules/course/lib/invoice-events.ts:219,243` | 開票流程判斷來源失效後是否可作廢 | ✅ 不同流程，不受影響 |
| `packages/api/modules/course/lib/invoice-events.ts:334` | **本次改動的判斷點**，跨月即觸發 `REFUND_NEEDS_ALLOWANCE` | 🔴 與第 337 行同一段落，是觸發自動折讓的條件本身，已在上方列為核心變更點 |
| `packages/api/modules/course/lib/invoice-operations.ts:17` | 手動折讓 API 內也有一次跨月檢查（雙重防呆） | ✅ 保留即可，作為手動路徑的防呆不受影響 |
| `apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx:46,114` | 後台訂單列表頁面，用來判斷是否顯示「已跨月」提示文字 | ⚠️ 若自動折讓成功後 `attentionReason` 被清空、`status` 變成 `ALLOWANCE`，這頁原本顯示「已跨月，請改用折讓」的提示邏輯可能需要重新檢查顯示條件（畫面文字可能變成不必要或誤導），建議加一筆 UI 驗證步驟到 tasks.md |

## 9. `InvoiceAllowanceOperation`

僅出現在 Prisma 產生的 Zod schema（`packages/database/prisma/zod/index.ts`），非商業邏輯呼叫端。

- ✅ 不受影響，schema 本身不用改；本次改動只是「多一個呼叫端寫入這張表」，資料結構已支援。

## 10. `allowanceTotal`

分佈於折讓寫入邏輯、測試假資料、後台頁面顯示。

- ✅ 大多數是既有折讓流程的欄位讀寫，介面不變。
- ⚠️ `apps/saas/lib/invoice-settings.ts:66`（`invoices.some((invoice) => invoice.allowanceTotal < invoice.amount)`）：這是判斷「還有可折讓額度」的既有邏輯，用途待確認是否影響後台某個列表的篩選條件；跨月自動折讓後 `allowanceTotal` 會被系統自動墊高，若這個判斷結果被用在其他業務規則（例如允許用戶重新申請退款），需要在 tasks.md 註明確認過不受影響。

---

## 特別注意事項回覆

### 前端按鈕 `InvoiceOperationsButtons.tsx`

`allowanceAllowedDuringAttention = invoice.attentionReason === "REFUND_NEEDS_ALLOWANCE"`（第 24 行）。自動折讓**成功**後，`attentionReason` 會被清空（`applyAllowance` 成功路徑寫 `attentionReason: null`），這種情況下：
- 按鈕邏輯本身不會壞（`attentionReason` 為 null 时不會進入「發票作業待確認」的擋牆分支，會照常顯示正常操作列）
- 但因為 `status` 會變成 `"ALLOWANCE"`，且 `amount - allowanceTotal` 若已全額折讓會等於 0，折讓輸入框 `max` 會是 0，按鈕會因 `amount <= 0` 被 disable——**這是預期行為，不是壞掉**，✅ 不受影響。

真正的風險在**自動折讓失敗**的 fallback：如果失敗時沒有把 `attentionReason` 設回 `REFUND_NEEDS_ALLOWANCE`（或等效值），後台管理員會看到一般操作列而非「發票作業待確認」的警示，**失去手動補救的入口與可見性**——這點已列為上面的 ⚠️，需要在 tasks.md 明確寫「自動折讓失敗時 fallback 到 REFUND_NEEDS_ALLOWANCE，讓後台按鈕邏輯不變」。

### 是否有其他地方（cron/webhook/訂閱續期）會走到退款發票流程

已確認：`apps/saas/lib/orders.ts:195`（付款閘道 webhook 回呼）與 `packages/api/modules/course/procedures/cancel-course-subscription.ts:103,131`（訂閱取消）都會呼叫 `handleRefundInvoice` / `handleRefundInvoiceForSubscription`，這些都是可能沒有 admin session 的背景流程。這正是造成 🔴（adminProcedure 不可直接呼叫）的原因，見上方第 6、2 節。

### 測試斷言

`packages/api/modules/course/lib/refund-invoice.test.ts:69-74`（"marks a cross-month refund for manual allowance handling"）精確斷言改動後會失敗，已列為 🔴。

---

## 總結分類

- 🔴：2（核心變更點的實際程式邏輯與呼叫端限制、既有測試斷言必然失敗——兩者互為因果，視為同一組風險）
- ⚠️：5（前端按鈕 fallback 依賴、invoiceType 查詢缺漏、冪等鍵併發保護確認、後台頁面跨月提示文字、`allowanceTotal` 判斷用途確認）
- ✅：其餘所有查到的呼叫端與既有機制
