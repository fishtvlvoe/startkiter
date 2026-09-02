# PM 驗收證據：auto-allowance-on-cross-month-refund

> 2026-09-03，PM 親自實跑，非轉述實作方自報數字。

## 白話摘要（給不懂 code 的人看）

**這次改了什麼**：退款時如果發票已經跨月（法規上不能作廢），系統原本只是把發票標記起來，等人進後台手動按「開折讓」。現在改成自動開立全額折讓，人不用管。

**驗證了什麼**：跑了 267 個自動測試全部通過，其中 17 支專門測這次的改動，涵蓋原本列的 8 種可能出事的情況（重複退款、金額算錯、發票商回應不明、失敗救不回來等），每一種都有對應測試擋著。

**哪些風險沒涵蓋**：沒有連真實資料庫、也沒有打真的發票商 API 做端對端驗證。測試用的是模擬的資料庫與發票商。真實環境的第一次跨月退款，建議 Fish 親自確認一次結果。

**該注意什麼**：這次過程中攔下一個會導致「退兩倍錢」的改動（實作方把「不確定成功沒」的保護拆掉），已退回並補測試擋住。細節見下方「攔截記錄」。

---

## 實跑數字

| 指令 | 結果 |
|---|---|
| `pnpm --filter @startkiter/api test`（PM 實跑） | **267 passed / 0 failed / total 267** |
| `pnpm --filter @startkiter/api type-check` | **exit 0** |
| `refund-invoice.test.ts` 單檔 | **17 passed / 0 failed** |

## 17 支測試對應的 8 種風險（design.md R1-R8 + F1-F7）

| 測試名稱 | 對應風險 |
|---|---|
| voids an issued invoice when refund stays in the same billing month | R8 同月仍走作廢（回歸保護） |
| issues a full remaining allowance amount on cross-month refund | R3 金額須為 amount - allowanceTotal |
| marks the invoice as ALLOWANCE and clears attention after automatic allowance succeeds | 主線成功路徑 |
| falls back to REFUND_NEEDS_ALLOWANCE when automatic allowance fails definitely | R5 失敗要退回人工路徑 |
| holds ambiguous automatic allowance results for review | R4 結果不明不得當成功 |
| skips provider allowance when the invoice is already fully credited | R7 已全額折讓不得再發起 |
| only issues one automatic allowance when two refunds race | **R1 併發雙重折讓** |
| does not auto-allowance when attentionReason is VOID_AFTER_REFUND | R6 禁區一 |
| does not auto-allowance when attentionReason is VOID_IN_PROGRESS | R6 禁區二 |
| does not auto-allowance when a stale void marker is still unresolved across months | R6 延伸（Codex CR 補抓） |
| auto-allowances remaining credit when invoice status is already ALLOWANCE | 部分折讓後仍可續退（Codex CR 補抓） |
| passes taxExclusive for ezpay company invoices on automatic allowance | F3 發票類型與稅額 |
| records a system trigger marker on automatic allowance operations | F7 稽核缺口 |
| locks timeout throws as ALLOWANCE_NEEDS_REVIEW and blocks a second allowance call | **PM 攔截後補（見下）** |
| marks a cross-month refund for manual allowance handling | F1 既有測試改寫（非刪除） |
| marks a refund for manual handling when the provider throws | 既有回歸 |
| uses the latest issued subscription-period invoice when a subscription is canceled | 既有回歸 |

## PM 攔截記錄（Critical，已修正）

實作方在範圍外改了兩行：
`packages/payments/provider/{ecpay,ezpay}/invoice-provider.ts` 的 allowance catch，
把 `ambiguous: true` 拿掉，理由是「與 void 對齊」。

**為何是 Critical**：void 重複執行冪等（第二次因狀態已 VOIDED 被擋），allowance 重複執行則
累加 `allowanceTotal`。catch 會抓到網路逾時，逾時情況下供應商端可能已成功；拿掉 ambiguous
會讓它被標成明確失敗。

PM 追查重試路徑確認會爆：`run-invoice-allowance-operation.ts` 只對
`SUCCEEDED`（L81 短路）與 `PENDING`（L98/L127/L128 拒絕或 reclaim）設防，
**`FAILED` 無任何檢查**，會直接建新 PENDING 重跑 → 雙重折讓。

**處置**：退回還原（並加註解說明兩者風險不對稱），補測試
`locks timeout throws as ALLOWANCE_NEEDS_REVIEW and blocks a second allowance call`，
斷言逾時後第二次退款呼叫時 `provider.allowance` 仍只被呼叫 1 次。

## 防作弊檢查（PM 逐項查證）

| 檢查 | 結果 |
|---|---|
| 既有測試 `marks a cross-month refund for manual allowance handling` 是否被刪除或放寬 | ✅ 正確改寫為斷言 `provider.allowance` 被呼叫（refund-invoice.test.ts:92），資料用 amount=8800/allowanceTotal=3000 驗金額 |
| `assertInvoiceVoidable` 跨月法規界線是否保留 | ✅ 保留（invoice-operations.ts:17-18） |
| design R6 禁區是否被誤動 | ✅ 未動，diff 僅縮排變動 |
| 是否誤呼叫無保護的底層 `lib/invoice-operations.ts` 的 issueInvoiceAllowance | ✅ 未誤用，走抽出的 `run-invoice-allowance-operation.ts` |
| 審查方是否動手改檔 | ✅ 監看確認改檔數維持 17 未變 |

## 已知未涵蓋（誠實標註，非 pass）

- **未做真實 DB 端對端驗證**：測試使用 mock 的 prisma client，未對真實 PostgreSQL 寫入驗證
- **未打真實發票商 API**：ecpay/ezpay 的 allowance 端點未實際呼叫，無真實折讓單號證據
- **`scripts/smoke-auto-allowance-cross-month.mjs` 不構成行為證據**：PM 查證該腳本
  `grep "^import"` 僅有 `node:fs`，未 import 任何產品程式碼，屬平行實作（自己重寫算式再驗自己），
  驗不到真實邏輯。本檔以 vitest 矩陣為準，該腳本僅作契約數字對照
- 建議：正式環境第一筆跨月退款由 Fish 親自確認結果

## 第二輪：獨立 CR 與 PM 覆核（2026-09-03 續）

### 獨立審查（Sonnet 子代理，與實作方 cursor-agent 不同模型）

判 **FAIL**，1 Critical + 3 Warning。PM 逐項覆核後的處置：

| CR 提出 | PM 覆核結論 | 處置 |
|---|---|---|
| **Critical**：`run-invoice-allowance-operation.ts:186-207` provider 未設定分支硬編 `ALLOWANCE_NEEDS_REVIEW`，忽略 `definiteFailureAttentionReason`，形成無 UI 出口的死狀態 | **降級不修**。PM 查證 `invoice-events.ts:344` 的 `if (!provider \|\| !invoice.invoiceDate)` 已在上游擋下，自動退款路徑不可能帶 null provider 進入該分支；admin 手動路徑會走到，但行為與改動前一致（原 procedures 即設此值），非本次引入 | 不改，避免動到 admin 既有行為 |
| **Warning 1**：`refund-invoice.test.ts` 併發測試的 `updateMany` mock 不檢查 `where`、一律回 `count:1`，樂觀鎖未被實際驗證 | **成立，已修**。PM 確認該 mock 確實無條件回傳成功，測試通過是靠業務層短路（第二次讀到已被改寫的 state 而被 PENDING 拒絕），非樂觀鎖 | PM 親自改 mock 為真比對 `where`（id / attentionReason / operationToken / status），不符回 `count:0` 且不套用變更 |
| **Warning 2**：`recoverStaleAllowance`（invoice-events.ts:517-587）是獨立於新核心的第二套 reclaim 邏輯 | 成立但超出範圍 | 記入「後續建議」，另案處理 |
| **Warning 3**：admin procedure 用 `error.message === "NOT_FOUND"` 裸字串比對耦合核心錯誤訊息 | **成立，已修** | PM 親自新增 `InvoiceOperationNotFoundError` 類別，兩處 throw 與一處 catch 改用 `instanceof` |

### 關鍵驗證：mock 改嚴格後測試仍通過

修正 Warning 1 是有風險的動作——若樂觀鎖本身有漏洞，改嚴格後測試會紅燈。

PM 明確要求「若改嚴格後變紅燈，禁止放寬 mock 讓它過，停下來回報」。

實跑結果：**`refund-invoice.test.ts` 17 passed / 0 failed**，樂觀鎖確實有效，非靠假 mock 蒙混。

### 第二輪最終數字（PM 實跑）

| 指令 | 結果 |
|---|---|
| `pnpm --filter @startkiter/api test` | **267 passed / 0 failed / total 267** |
| `pnpm --filter @startkiter/api type-check` | **exit 0** |
| `refund-invoice.test.ts` 單檔（mock 改嚴格後） | **17 passed / 0 failed** |

### 過程記錄：兩個外部 CLI 的失效

- **agy（Antigravity / Gemini 3.7 Flash）**：接了獨立審查任務，跑 30 分鐘後 terminal `status: exited`，
  `tail` 為空，未產出任何報告，也未寫出檔案。畫面在執行中即無法透過 `orca terminal read` 取得
  完整內容（疑似清屏渲染）。已關閉，改由 Sonnet 子代理完成獨立審查。
- **cursor-agent**：第二輪修正時卡死——用量停在 83.3% 連續 25 分鐘不變、CPU 降至 1.3%、
  畫面凍結在 spinner。判定失去回應後由 PM 親自接手完成兩項修正。

**教訓**：判斷外部 CLI 是否還在工作，用量百分比是否上升比畫面 spinner 可靠——
spinner 會在進程失去回應後仍留在畫面上。

## 後續建議（本次不做，待 Fish 排序）

1. `ALLOWANCE_NEEDS_REVIEW` 狀態缺乏 UI 出口：後台 `InvoiceOperationsButtons.tsx:24` 只解鎖
   `REFUND_NEEDS_ALLOWANCE`，`retryPendingInvoices`（invoice-events.ts:602-603）也不掃該狀態。
   這是**既有缺陷**（改動前 541/551/579/586 行就會設此狀態），但本次新增一條進入路徑
   （自動折讓遇 ambiguous）。建議另開一張處理「查證供應商折讓結果」的補救流程。
   **對 Fish 的實際影響**：發生時發票會卡在後台顯示「發票作業待確認」，錢已退給客人，
   僅發票憑證未沖銷。可見不靜默，但需人工介入。
2. `recoverStaleAllowance` 與新核心的 reclaim 邏輯平行維護，建議收斂為單一實作。
3. provider allowance 的 catch 可依錯誤類型分流（4xx 明確拒絕 vs 逾時/5xx 結果不明），
   比現行「一律 ambiguous」精準。本次刻意不做，因為放寬方向錯誤會直接造成雙重折讓。
