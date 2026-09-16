## Context

目前 `openspec/changes/` 下有 4 張未封存 SR，狀態如下（2026-09-11 稽核當下）：

| SR | spectra 記錄進度 | 真實代碼狀態 | 落差 |
|---|---|---|---|
| `welcome-email-rich-editor-test-send` | 0/15（main 分支） | **已完成並合併**：`packages/mail/lib/welcome-email-render.ts`、`contentJson` schema 欄位、`send-welcome-email-test.ts` procedure 皆存在，main 有 3 個對應 commit（135d8a37 feat、dec198ec fix、387d536e fix） | tasks.md 15 個 checkbox 全部 `[ ]`，未同步勾選，也未 archive |
| `oracle-chatwoot-anti-reclaim-cutover` | 5/7（parked） | 待稽核 | 待稽核 |
| `chatwoot-facebook-pages-messaging-live` | 7/8（parked） | 已用實測驗證（screen recording、Graph webhook 確認），Task 3.2 卡 Meta 外部審核 | 無落差，紀錄與現況一致 |
| `chatwoot-data-access-renewal-and-oauth` | 0/7（parked） | 剛 propose 完成，尚未開始實作 | 無落差（新 SR） |

## 推進總表（2026-09-11 稽核完成後更新）

派 Cursor 獨立審查 + 實跑驗證後的最終結果，取代上表的稽核前狀態：

| SR | 進度 | 本輪動作 | 還缺 | 下一步 |
|---|---|---|---|---|
| `welcome-email-rich-editor-test-send` | 13/15，已合併 main（PR #4） | Cursor 補勾 1.1-5.2、7.1；修掉 `send.test.ts` 併發 timeout 根因；6.2 補 mock 端到端替代證據 | Task 6.1（全量 test 卡既有 database 型別問題，非本次改動造成）、Task 6.2（Gmail 真實帳號手動驗收，需人工） | Fish 手動測 Gmail 收信補 6.2；6.1 另排時間查 database 型別坑 |
| `chatwoot-facebook-pages-messaging-live` | 7/8，parked | 文件與 `chatwoot-data-access-renewal-and-oauth` 互相指涉整理乾淨，避免兩處各自維護重複紀錄 | Task 3.2（Live + 路人進線驗收），依賴下一列的 SR 解除阻擋 | 等 data-access-renewal SR 的 Task 1.1/2.1 完成後 unpark 驗收 |
| `chatwoot-data-access-renewal-and-oauth` | 2/7，進行中 | Agy（ego-browser）完成 Task 2.1（Meta data access renewal 評估送出，狀態檢閱中）與 Task 1.1（Fishtv page token 重新 OAuth，Graph API 驗證 `data_access_expires_at` 更新至 2026-12-10） | Task 3.1/3.2（pages_messaging 表單修復送審）、Task 4.1（真實 Tester 帳號）、Task 5.1/5.2（文件同步＋review） | PM 統一調度後續派工，已切到獨立分支 `feature/chatwoot-data-access-renewal-and-oauth` |
| `oracle-chatwoot-anti-reclaim-cutover` | 5/7，parked | Cursor 補齊 Task 2.1 文件債（`docs/support-runtime-topology.md`、`AGENTS.md`、`docs/dashboard/status.html` 三處同步更新，rg 驗證命中） | Task 2.3（NSG 收斂）、Task 3.1（review） | 排進下一輪派工 |

**分支對照**：
- `main`：welcome-email 13/15 已合併
- `feature/chatwoot-data-access-renewal-and-oauth`：Agy 的 Task 1.1 commit，繼續往下做 3.1-5.2
- `feature/chatwoot-facebook-pages-messaging-live`：只留總圖與本稽核 SR 等文件性質內容，準備合併 main
- `fishtvlvoe/sr-audit-cursor`：已合併（PR #4）並刪除

## Goals / Non-Goals

**Goals:**
- 把 4 張 SR 的真實狀態與依賴關係收斂進單一總表，作為 apply 前的檢查點
- 派 Cursor 對每張有程式碼異動的 SR 做一次獨立代碼審查，核對 tasks.md 勾選與 spec Requirement 是否對得上實作
- 修正發現的紀錄落差

**Non-Goals:**
- 不涵蓋 archive/ 下 76 張歷史 SR
- 不在本 SR 內實作任何功能性 tasks，只做稽核與紀錄修正
- 不做程式碼重構，只核對一致性

## Decisions

### Decision: 用 orca worktree 派 Cursor 做獨立代碼審查，不用 PM 自審

依 routing.md 標準流程「實作跟審查永遠不同一個 CLI」，且 PM 已經是 propose 這幾張 SR 的當事人，容易有盲點。派 Cursor 開 worktree，針對每張 SR 讀 tasks.md + 對應程式碼，回報「勾選狀態 vs 實際代碼」是否一致。

**Alternatives considered**：
1. PM 自己 grep 代碼比對 — 否決，PM 是 propose 方，容易confirmation bias
2. 不做審查，直接信任 spectra list 的進度數字 — 否決，welcome-email 案例已證明數字會跟代碼脫節

### Decision: 跨 SR 依賴順序以「Meta 外部審核」為分界，不強制序列其他 SR

`chatwoot-data-access-renewal-and-oauth` 解除 `chatwoot-facebook-pages-messaging-live` Task 3.2 的阻擋，這兩張有嚴格先後依賴。`welcome-email-rich-editor-test-send` 與 `oracle-chatwoot-anti-reclaim-cutover` 彼此獨立，且都已經接近完成（分別待補紀錄／待收尾 2.3+3.1），可平行處理，不用排隊等 Chatwoot 系列做完。

**Alternatives considered**：
1. 全部 SR 強制序列跑完再開下一張 — 否決，違反 Fish 裁決「不要開一張超大 SR 想一次吃完」的精神，會拖慢無關聯的 SR
2. 完全不管順序隨意跑 — 否決，Facebook Live 依賴 data-access-renewal 是硬性技術依賴，跳過會導致驗收失敗

## Implementation Contract

**行為**：本 SR 完成後，`spectra list` 與 `spectra list --parked` 顯示的進度數字，對每張 SR 都要能對應到 Cursor 審查報告確認過的實際代碼狀態；不一致的 SR 必須先修正（補勾 tasks.md 或 archive）才視為本 SR 完成。

**驗證目標**：
- Cursor 審查報告存在且逐張 SR 列出「勾選 vs 代碼」比對結果
- `welcome-email-rich-editor-test-send` 的 tasks.md 若確認代碼已完整實作，補勾對應 checkbox 並執行 `spectra archive`
- 其餘 3 張 SR 的落差（若有）逐一列出並標記後續處理方式（本 SR 不處理落差本身的實作，只標記）
- 每張仍要繼續開發的 SR（`chatwoot-data-access-renewal-and-oauth`、`oracle-chatwoot-anti-reclaim-cutover`）跑 `spectra analyze <name> --json`，Critical/Warning 為 0 才算通過本階段檢查

**範圍邊界**：
- In scope：讀取、比對、回報、修正 tasks.md 勾選狀態、對已完成 SR 執行 archive
- Out of scope：修改任何功能程式碼、修改 spec 內容、對還沒開始的 SR 做任何實作

## Risks / Trade-offs

- [Risk] Cursor 審查可能因為對專案脈絡不熟悉，漏看隱性依賴 → Mitigation：審查 prompt 附上每張 SR 的 proposal/design/tasks 完整路徑與本 design.md 的總表，要求逐條核對
- [Risk] `welcome-email-rich-editor-test-send` archive 後若代碼其實有缺口，事後才發現 → Mitigation：archive 前 Cursor 報告需明確列出「已驗證存在」的檔案清單與對應 Requirement，不是只看 commit message
