# Proposal: port-site-agent

## 問題

原始計畫（`docs/discuss/extract-map.md`）明確規劃要把 site-agent（站內 AI 助手，限定「兩支唯讀工具」）搬進 StartKiter，`openspec/config.yaml` 也已把它列入「本刀白名單」。但這一步從未實際執行：`packages/site-agent` 是空資料夾，代碼一直留在 `legacy/packages/site-agent`（537 行，含測試）沒被搬過來。

## 修法

把 `legacy/packages/site-agent` 跟 `legacy/apps/saas/app/agent`、`legacy/apps/saas/app/api/agent/chat` 的內容搬進現行代碼庫，依 StartKiter 現有慣例調整（import 路徑、auth 機制、UI 元件庫）：

- `legacy/packages/site-agent/src/*` → `packages/site-agent/src/*`
- `legacy/apps/saas/app/agent/*` → `apps/saas/app/agent/*`
- `legacy/apps/saas/app/api/agent/chat/route.ts` → `apps/saas/app/api/agent/chat/route.ts`

## 硬限制（照原計畫白名單，不可放寬）

- **只給兩支唯讀工具**，不准新增任何寫入/修改資料庫的工具
- Agent 對話不可執行任何會改變系統狀態的操作（下單、改設定、刪資料等一律禁止）
- 需要登入才能使用（不對外公開）

## 不做什麼

- 不擴充工具數量或範圍
- 不做進階功能（多輪記憶、跨 session 上下文等），先求「能用、安全」

## 影響範圍

新增功能，不改動既有代碼，風險低。搬遷後需要依現行 auth/UI 慣例調整 import 路徑跟元件用法，不是逐字複製貼上。
