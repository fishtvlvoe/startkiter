# Proposal: support-email-fallback

## Why

`unified-support-desk` 已把 Chatwoot 統一工單整套實作完成（53/55），但 task 3.6 卡在
「Chatwoot 真實觸發的 webhook 派送不穩定」：手動 curl 端點 100% 正常（正確 token → 200
並正確建票，錯誤 token → 401），但 Chatwoot 自己觸發時 Sidekiq 有時完全不留紀錄，
`SupportTicket` 也沒新增。問題出在第三方軟體自身的派送機制，不在我們的程式碼。

Fish 2026-09-02 裁決：現階段（產品尚未正式開賣、還沒有真實客戶進線）不值得為了一個
沒人在用的功能，花半天修不確定會不會再壞的第三方軟體，也不值得花 3-5 天自建整套客服後台。
先退回 email 客服，把已寫好的 Chatwoot 程式碼原封保留待啟用。

## What Changes

- 新增環境變數開關 `SUPPORT_CHANNEL`（`email` | `chatwoot`），**預設 `email`**
- `email` 模式下：
  - 右下角浮動客服按鈕改為開啟 `mailto:`，主旨帶「客服諮詢」，內文自動帶入使用者的部署網址
  - `/deployment` 頁的「回報這個部署的問題」按鈕改為開啟 `mailto:`，內文自動帶入該部署 ID
  - 不注入 Chatwoot widget script（少載一支第三方 script）
- `chatwoot` 模式下：行為與現況完全一致（既有程式碼一行不刪，切回即用）
- 收件信箱讀 `SUPPORT_EMAIL`，本次值設為 `fish@fishot.com`
- 政策文件三處（`openspec/config.yaml`、`AGENTS.md`、`README.md`）文字同步改為
  「客服走 email；Chatwoot 統一工單已實作完成，暫停啟用」

## Non-Goals

- 不刪除任何 Chatwoot／LINE／Telegram 相關程式碼、資料表或測試
- 不自建客服單後台頁面（那是路 B，本次明確不做）
- 不改 `SupportTicket` schema
- 不修 Chatwoot webhook 派送問題本身（該問題原樣記錄在 `unified-support-desk` 3.6）

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — 純執行模式切換與前端入口調整，既有 spec 的 requirement 行為不變，
Chatwoot 路徑在 `chatwoot` 模式下仍完全符合原 spec)

## Impact

- Affected specs：無 delta spec
- Affected code：
  - Modified: `apps/saas/modules/deployment/components/SupportWidget.tsx`
  - Modified: `apps/saas/modules/deployment/components/ReportIssueButton.tsx`
  - Modified: `apps/saas/app/(authenticated)/ChatwootScript.tsx`
  - Modified: `apps/saas/app/(authenticated)/layout.tsx`
  - Modified: `apps/saas/.env.example`、`apps/saas/.env`（本機）
  - Modified: `openspec/config.yaml`、`AGENTS.md`、`README.md`
  - Modified: 對應既有測試檔（support-widget / report-issue-button / chatwoot-script）
- 風險：低。純前端入口與載入開關，不碰金流、登入、資料寫入。
