# 發票折讓（invoice allowance）併發／冪等保護機制清單

範圍檔案：
- `packages/api/modules/course/procedures/invoice-operations.ts`（`issueInvoiceAllowance` procedure，L120-289；`voidInvoice` procedure，L18-118 作對照）
- `packages/api/modules/course/lib/invoice-operations.ts`（`issueInvoiceAllowance` 底層，L42-67）
- `packages/api/modules/course/lib/invoice-events.ts`（自動流程：`reserveRefundInvoice`/`runInvoiceRefund`/`finalizeInvoiceRefund`，L318-398；`recoverStaleAllowance`，L420-482）
- 對照：`packages/api/modules/course/lib/invoice-settings.ts`（`withInvoiceOperationLock`，L44-52）、`packages/payments/lib/invoice-issue-input.ts`（`normalizeProviderOrderId`，L51-55）、schema `InvoiceAllowanceOperation`（`prisma/schema.prisma` L836-842）

---

## 保護機制清單

### 1. 全域序列化鎖（Postgres advisory lock）
- **擋什麼**：任何兩個「發票作業」（作廢/折讓/開票/退款）同時在不同 Node 進程或同一進程不同請求平行跑，造成 race condition 讀到舊狀態再各自寫回。
- **機制**：`withInvoiceOperationLock` 在每次操作外包一層 `db.$transaction`，交易一開始執行 `pg_advisory_xact_lock(hashtextextended(EINVOICE_OPERATION_LOCK_ID, 0))`，鎖只在交易結束時釋放。這是 **PostgreSQL 資料庫層鎖**，不是應用層記憶體鎖。
- **位置**：`invoice-settings.ts:44-52`；所有 procedure/lib 函式（`issueInvoiceAllowance` L125、L184、L198、L206、L218、L236、L257 等）全部包在這層裡。
- **漏掉的後果**：多進程/多副本部署下完全失去序列化保護，兩個請求可能同時讀到同一張發票的舊 `attentionReason`/`allowanceTotal`，各自送出折讓給供應商，造成重複折讓或狀態互相覆蓋。

### 2. `allowanceId` 唯一約束（供應商冪等鍵 + DB unique）
- **擋什麼**：同一筆折讓（相同發票、相同折讓後總額）被重送兩次，導致供應商端開出兩張折讓單。
- **機制**：`allowanceId = normalizeProviderOrderId(\`ALLOW-${invoice.id}-${invoice.allowanceTotal + amount}\`, provider)`，再對 `InvoiceAllowanceOperation.allowanceId` 做 `findUnique`；schema 上 `allowanceId` 有 `@unique` 約束。若已有 `SUCCEEDED` 紀錄，直接視為完成（不重打供應商 API）；若 `PENDING`/`UNKNOWN`，視租約情況擋下或允許 reclaim。
- **位置**：`procedures/invoice-operations.ts:136-143`；schema `packages/database/prisma/schema.prisma:839`。
- **漏掉的後果**：重送請求會產生第二個不同（或撞名）的 `allowanceId`，供應商可能真的開出兩張折讓單，或因 DB unique 衝突丟未捕捉例外，資金/稅務對不上。

### 3. 折讓總額不得超過發票金額（業務不變量檢查）
- **擋什麼**：折讓總額疊加超過發票原始金額（多退、超退）。
- **機制**：procedure 開頭 `if (input.amount + invoice.allowanceTotal > invoice.amount) throw`。
- **位置**：`procedures/invoice-operations.ts:134`。
- **漏掉的後果**：可能對同一張發票核准超額折讓，供應商端會拒絕或造成帳務金額為負/不一致。

### 4. `InvoiceAllowanceOperation` 狀態機（PENDING/SUCCEEDED/FAILED/UNKNOWN）擋重送
- **擋什麼**：同一張發票「上一筆折讓作業還沒查清楚結果」時，操作人員或自動流程再送一次新折讓。
- **機制**：`existingOperation?.status === "PENDING" && !reclaim` → 丟錯「禁止重送」；`status === "UNKNOWN"` → 一律丟錯，不論租約（因為 UNKNOWN 代表對供應商端的結果本身不確定，比 stale PENDING 更不安全）。
- **位置**：`procedures/invoice-operations.ts:139-143`。
- **漏掉的後果**：對供應商呼叫結果不確定（可能已成功）時再送一次，可能造成供應商端重複折讓，且本地無法分辨兩次呼叫哪次才是真的生效。

### 5. Invoice 層 `attentionReason` 互斥鎖（同張發票只能有一種進行中作業）
- **擋什麼**：同一張發票同時有兩種作業在跑（例：折讓進行中又被觸發作廢，或退款流程跟折讓流程互撞）。
- **機制**：折讓前檢查 `invoice.attentionReason` 是否為 null 或允許的例外值（`REFUND_NEEDS_ALLOWANCE`，或租約過期的 `ALLOWANCE_IN_PROGRESS`），否則丟「發票目前有待確認的作業，請先完成查核」。
- **位置**：`procedures/invoice-operations.ts:144-148`（折讓）；對照 `assertInvoiceVoidable`（`lib/invoice-operations.ts:15-19`，作廢用同一套 `attentionReason` 檢查）。
- **漏掉的後果**：不同作業類型可以互相插隊，例如作廢流程正在等供應商回應時，折讓流程同時把 `status`/`allowanceTotal` 改掉，兩邊寫入互相覆蓋。

### 6. `operationToken` + `updateMany().count` 樂觀鎖（佔位 claim）
- **擋什麼**：即使已經拿到 advisory lock 排他，仍要保證「我讀到的狀態」跟「我準備寫回去時的狀態」一致（防止同一交易內邏輯误判、或 reclaim 搶跑競爭）。
- **機制**：每次要佔用一筆發票的作業前，先產生新的 `operationToken = randomUUID()`，用 `updateMany({ where: { ...精確條件包含舊 attentionReason/operationToken, ...}})` 寫入，檢查 `claimed.count === 1` 才視為成功佔用；後續每一步 finalize 也都用 `where: { attentionReason, operationToken: reservation.operationToken }` 確保只有拿到那個 token 的呼叫才能寫回結果。
- **位置**：`procedures/invoice-operations.ts:150-156`（claim）、`184-193`/`198-201`/`206-212`/`218-221`/`236-253`/`257-268`（finalize，全部帶 `operationToken` 條件）。
- **漏掉的後果**：拿掉 token 比對後，任何併發的 finalize（例如 stale 的舊呼叫延遲回來）都可能把新一輪作業的結果覆蓋掉，出現「新作業還在跑，舊作業的回呼把狀態改回錯的」。

### 7. 租約機制（`operationStartedAt` + `OPERATION_LEASE_MS`/`PENDING_INVOICE_RETRY_AFTER_MS`）判斷可否搶回卡死作業
- **擋什麼**：呼叫供應商 API 時進程當掉/逾時，`attentionReason` 永遠卡在 `*_IN_PROGRESS`，之後所有操作永久被擋（見保護 5）。
- **機制**：`isStaleOperation` 檢查 `operationStartedAt` 是否為 null 或已超過租約時間（兩個檔案各自定義同樣的 60 秒常數，procedures 端叫 `OPERATION_LEASE_MS`，lib/invoice-events 端叫 `PENDING_INVOICE_RETRY_AFTER_MS`，數值相同但**是兩份獨立常數，沒有共用**）。過期才允許 `reclaim`，reclaim 時用新的 `operationToken` + `updateMany` 的 `OR: [operationStartedAt: null, operationStartedAt: { lt: now - lease }]` 條件重新搶佔。
- **位置**：`procedures/invoice-operations.ts:12-16`（定義）、`27,139,152` 使用；`lib/invoice-events.ts:33-37`（定義）、`95,98,275,278,326,426` 使用。
- **漏掉的後果**：抽共用核心若沒把兩份常數統一、或忘記帶入 reclaim 條件，會出現「一個模組能重新搶回卡死作業，另一個模組永久卡死」或「租約時間不一致造成同張發票被兩套規則同時判定可搶／不可搶」。

### 8. Reclaim 後強制對供應商查詢一次（不可直接假設上次失敗）
- **擋什麼**：租約過期不代表上次呼叫真的失敗，可能是回應丟失但供應商端已經真的開出折讓/作廢。若直接視為失敗重打，會造成供應商端重複執行。
- **機制**：`reservation.reclaim === true` 時，不直接重跑 `applyAllowance`/`applyVoid`，而是先呼叫 `provider.queryAllowance`/`provider.query` 查詢供應商端真實結果；查到 `SUCCEEDED`/`VOIDED` 就補寫本地狀態不再重送；查到非最終狀態才继续原流程重打。
- **位置**：`procedures/invoice-operations.ts:196-223`（折讓）、`58-83`（作廢）；`lib/invoice-events.ts:379-388`（`runInvoiceRefund` 的 `recoverBeforeVoid`）、`195-238`（`runInvoiceIssue` 的 `recoverBeforeIssue`）、`460-474`（`recoverStaleAllowance`）。
- **漏掉的後果**：卡死作業復活後直接重送供應商 API，造成同一張發票被實際重複開立折讓/作廢，這是所有保護裡「防止真的重複扣款/開單」最關鍵的一條。

### 9. Provider 不支援查詢時強制轉人工（不可裝作成功或直接重試）
- **擋什麼**：reclaim 時想查詢供應商真實結果，但該 provider 沒有 `query`/`queryAllowance` 方法，系統無從得知上次是否真的成功。
- **機制**：`if (!provider.queryAllowance) { ...把 operation 標成 UNKNOWN，invoice 標成 *_NEEDS_REVIEW... throw }`，強制卡住等人工查核，不自動重送也不自動視為成功。
- **位置**：`procedures/invoice-operations.ts:197-203`（折讓）、`59-62`（作廢）；`lib/invoice-events.ts:450-459`（`recoverStaleAllowance`）。
- **漏掉的後果**：若少了這條，系統可能對「結果不明」的作業直接重送，造成與保護 8 同樣的重複執行風險，只是觸發條件是 provider 能力不足而非租約判斷。

### 10. `ambiguous` 例外分流（FAILED vs UNKNOWN，見 Q4）
- **擋什麼**：供應商呼叫失敗時，如果失敗原因本身就代表「不確定有沒有真的成功」（如 timeout），不能直接標記為單純 FAILED 允許自由重試。
- **機制**：`InvoiceAllowanceError` 帶 `ambiguous: boolean`；catch 區塊依 `error.ambiguous` 決定寫 `status: "FAILED"`（清楚失敗，可重試）或 `"UNKNOWN"` + `attentionReason: "ALLOWANCE_NEEDS_REVIEW"`（不確定，鎖住轉人工）。
- **位置**：`lib/invoice-operations.ts:22-27,60`；`procedures/invoice-operations.ts:240,247`；`lib/invoice-events.ts:137,142,201,253`。
- **漏掉的後果**：把所有失敗都當 FAILED 允許重試，會讓「其實已經成功但回應逾時」的作業被自動或人工重打，造成重複折讓；反之把所有失敗都當 UNKNOWN，會讓單純業務失敗（如金額不符）也卡住無法重試，體驗變差但不算資料風險。

### 11. Finalize 階段的二次 `updateMany().count` 檢查（寫回結果前再確認一次佔用權）
- **擋什麼**：供應商 API 呼叫期間（不在 DB 交易鎖內，耗時可能數秒）狀態被其他流程（如 reclaim、人工介入）改變，導致舊呼叫的結果誤寫回新狀態上。
- **機制**：呼叫供應商前先釋放 advisory lock（因為外部 HTTP call 不該佔住 DB 鎖），呼叫完成後重新進 `withInvoiceOperationLock`，用 `updateMany({ where: { ...attentionReason, operationToken } })` 寫回，`updated.count !== 1` 就視為「無法安全寫回」丟錯，不強行覆蓋。
- **位置**：`procedures/invoice-operations.ts:257-268`（成功寫回）、`206-212`（reclaim 成功寫回）；`lib/invoice-events.ts:360-373`（`finalizeInvoiceRefund`）、`125-173`（`finalizeInvoiceIssue`）。
- **漏掉的後果**：外部 API 呼叫期間如果狀態已被其他流程改變，會用舊資料覆蓋新狀態，可能讓已經被人工處理過的發票又被自動流程蓋回進行中/錯誤狀態。

### 12. 退款流程獨立的 `attentionReason` 白名單（`REFUND_IN_PROGRESS`/`VOID_AFTER_REFUND`/`VOID_IN_PROGRESS`）
- **擋什麼**：自動退款流程（`reserveRefundInvoice`）誤搶了正在走「折讓」或「開票」流程的發票，或反過來折讓流程誤搶正在退款的發票。
- **機制**：`reserveRefundInvoice` 只認定屬於退款家族的 `attentionReason` 才算「可復原」，其餘一律視為「有其他作業在跑」直接跳過（`invoice.attentionReason && !recoverableRefundMarker`）。
- **位置**：`lib/invoice-events.ts:325-331`。
- **漏掉的後果**：抽共用核心若把這份白名單簡化成單一「有 attentionReason 就一律可 reclaim」，會讓退款流程搶走折讓/開票流程正在佔用的發票，造成同一發票被兩套業務邏輯同時改寫。

### 13. `retryPendingInvoices` 的排程掃描條件本身即是一種對外一致性保護
- **擋什麼**：漏抓「卡死但沒人手動重試」的發票，導致 `*_IN_PROGRESS`/`FAILED` 狀態永久卡住沒人處理。
- **機制**：用 `OR` 組合掃描 PENDING/FAILED 逾期、ISSUED 但來源已退款/取消、REFUND_IN_PROGRESS/VOID_*/ALLOWANCE_IN_PROGRESS 逾期租約的資料列，統一交給對應的 handler（含 `recoverStaleAllowance`）處理。
- **位置**：`lib/invoice-events.ts:484-519`。
- **漏掉的後果**：抽共用核心若排程條件沒有同步涵蓋新核心用到的 `attentionReason` 值，會讓卡死作業永遠沒有自動復原機會，只能等人工發現。

---

## 保護機制總數：**13 條**

---

## Q1-Q5 完整回答（供 artifact 對照，摘要版見對話回覆）

**Q1**：`allowanceId = normalizeProviderOrderId(\`ALLOW-${invoice.id}-${invoice.allowanceTotal + input.amount}\`, provider)`（`procedures/invoice-operations.ts:136`）。把 `allowanceTotal`（折讓前累計總額）加進去是為了讓「折讓後的新總額」成為每筆折讓操作的唯一識別碼，同一發票同一筆折讓重送時（同樣的 `allowanceTotal` + 同樣 `amount`）會算出同一個 `allowanceId`，命中既有 `InvoiceAllowanceOperation` 紀錄達成冪等；但因為 L134 已檢查「本次金額 + 目前累計總額 不能超過發票總額」，同一張發票連續兩次「全額」折讓，第二次一定會在算 `allowanceId` 之前就被這條檢查擋掉丟錯（因為第一次全額折讓後 `allowanceTotal` 已經等於 `amount`，剩餘可折讓額度為 0），所以不會真的撞到重複的 `allowanceId`。

**Q2**：`withInvoiceOperationLock` 是 **PostgreSQL 資料庫層的 transaction-scoped advisory lock**（`pg_advisory_xact_lock`），不是應用層記憶體鎖（如 in-process mutex）。因為鎖存在資料庫裡且用固定的全域 lock id，多個 Node 進程/多副本部署呼叫時都會排隊搶同一把鎖，**不會失效**，這正是它刻意選 advisory lock 而非 app-level lock 的原因；代價是全站所有發票的所有操作都序列化在同一把鎖上，屬於全域瓶頸而非「每張發票各自一把鎖」。

**Q3**：`isStaleOperation` 判斷「`operationStartedAt` 為 null，或距今已超過租約時間」即視為死掉可搶回。租約長度兩個檔案都是 **60,000 毫秒（60 秒）**，但分別用兩個獨立命名的常數（`OPERATION_LEASE_MS` 在 procedures、`PENDING_INVOICE_RETRY_AFTER_MS` 在 lib/invoice-events），數值相同但沒有共用同一個定義，抽核心時要注意合併成單一常數。

**Q4**：`ambiguous` 來自 `InvoiceAllowanceError` 建構子第二參數，其值取自供應商 API 回傳的 `result.ambiguous === true`（`lib/invoice-operations.ts:60`），代表「呼叫失敗，但無法確定供應商端是否其實已經成功」（例如逾時、連線中斷）。為 true 時，`InvoiceAllowanceOperation.status` 寫成 `"UNKNOWN"`（而非 `"FAILED"`），`invoice.attentionReason` 寫成 `"ALLOWANCE_NEEDS_REVIEW"` 並保留 `operationToken`，鎖住後續所有折讓/作廢操作直到有人工或排程查詢供應商真實結果復原，防止在「不確定是否已成功」的狀態下自動重試造成重複折讓。

**Q5**：`recordAdminAction(userId, actionType, target, detail, ip)` 把「哪個管理員、做了什麼動作、對哪個對象、金額多少、從哪個 IP」寫入稽核紀錄，只在 `procedures/invoice-operations.ts` 的 `voidInvoice`/`issueInvoiceAllowance` 這兩個 **由真人 admin 觸發的 procedure** 裡呼叫。`lib/invoice-events.ts` 裡的自動流程（`retryPendingInvoices`、`runInvoiceRefund`、`recoverStaleAllowance`、`triggerInvoiceForOrder` 等，由 webhook/排程觸發）**完全沒有呼叫 `recordAdminAction`**——這確實是稽核缺口：系統自動完成的折讓/作廢/退款不會出現在管理員操作稽核紀錄裡，只能從 `Invoice`/`InvoiceAllowanceOperation` 資料表本身的欄位變化回推，抽共用核心時若要統一稽核，需要另外設計「系統動作」的紀錄管道，不能沿用 `recordAdminAction` 假設一定有真人 userId。
