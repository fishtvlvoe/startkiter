## Why

目前有 4 張非封存 SR（`welcome-email-rich-editor-test-send`、`oracle-chatwoot-anti-reclaim-cutover`、`chatwoot-facebook-pages-messaging-live`、`chatwoot-data-access-renewal-and-oauth`），彼此進度紀錄與實際代碼狀態已出現落差（例如 `welcome-email-rich-editor-test-send` 代碼已全數合併進 main，`tasks.md` 卻仍顯示 15/15 全未勾選）。開發前需先建立一張跨 SR 總表釐清真實狀態、依賴順序，並派 Cursor 檢查每張 SR 對應代碼是否與 spec/tasks 一致，抓出落差後才能繼續往下開發。

## What Changes

- 在本 SR 的 design.md 建立跨 SR 總表：狀態（真實代碼進度 vs spectra 記錄進度）、依賴順序、發現的落差
- 派 Cursor（orca worktree）逐張 SR 讀代碼，比對 tasks.md 勾選狀態與 spec Requirement 是否對應實際實作
- 修正發現的紀錄落差（如補勾 tasks.md、archive 已完成的 SR）
- 對每張仍要繼續開發的 SR 跑 `spectra analyze` 確認一致性，Critical/Warning 全清才算過

## Non-Goals

- 不重新設計任何 SR 的功能範圍，只核對紀錄與代碼是否一致
- 不涵蓋已封存（archive/）的 76 張歷史 SR，只處理目前 4 張未封存的
- 不在本 SR 內實作 `chatwoot-data-access-renewal-and-oauth` 或其他 SR 的功能本身

## Capabilities

### New Capabilities

- `sr-portfolio-consistency-audit`: 跨 SR 狀態稽核與一致性驗證流程

### Modified Capabilities

(none)

## Impact

- Affected specs: `sr-portfolio-consistency-audit`（新增）
- Affected code:
  - Modified: `openspec/changes/welcome-email-rich-editor-test-send/tasks.md`（視稽核結果補勾或 archive）
  - New: 無新程式碼，本 SR 為稽核／文件性質
- Dependencies 新增：無
- 環境變數新增：無
