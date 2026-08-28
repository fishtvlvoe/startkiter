## Why

`apps/saas` 已於 `startkiter-official-site-cleanup`（2026-08-25 已封存）實測部署在 Coolify VPS（`app.startkiter.dev` 回應 HTTP 307 導向 `/login`，運作正常），但同一張 change 標記為完成的 `apps/marketing` 官方銷售頁（`startkiter.dev`）實測目前回應 **HTTP 503**，跟該 change 自己 task 2.2 記錄的驗收結果（curl 回應成功）不符——這是一個已回歸、尚未被任何 change 追蹤的正式站故障。此外，現有 `docs/coolify-vps-setup-runbook.md` 作者自行標註「這次記錄的是驗證用的手動流程，不是最終要教給學生的流程」，代表這台 VPS 至今沒有一份可重複執行、可教給買家的正式部署 SOP；VPS 資料庫策略（Neon 外部代管 vs VPS 自架 Postgres）與現有 2 vCPU/3.3GB 規格是否足夠，也都還停留在討論稿的「傾向」用語，沒有正式定案並落實成可查的規格。

## What Changes

- 診斷並修復 `apps/marketing` 在 `startkiter.dev` 的 503 故障，讓 `official-site-deployment` 既有 Requirement「The marketing site is deployed under the official domain」重新真正通過（不是重新標記，是真的修好並重新驗證）
- 補一份正式、可重複執行、可教給買家的部署 SOP，涵蓋 Coolify resource 設定、環境變數注入方式、build/deploy pipeline、DNS 與 SSL 驗證步驟，取代現有 runbook 自承「非最終流程」的狀態
- 針對 VPS 層級密鑰（`SETTINGS_ENCRYPTION_KEY`、`DATABASE_URL` 等）在 Coolify 上的安全注入方式，訂出明確、可稽核的管理規範
- 把「資料庫繼續用 Neon 還是搬進 VPS 自架 Postgres」與「現有 2 vCPU/3.3GB 規格是否足夠」這兩個停留在討論稿「傾向」用語的決策，轉成正式 spec Requirement 並附上量化依據（不是重新開放討論，是把已有傾向落實成可驗證的規格）

**BREAKING**：無破壞性變更——`app.startkiter.dev`（`apps/saas`）既有部署不受影響，本次只修復 `apps/marketing` 的部署故障並補齊文件與規格層級的缺口。

## Capabilities

### New Capabilities

- `vps-production-deployment`：StartKiter 正式站在 Coolify VPS 上的可重複部署 SOP、密鑰注入規範、資料庫與硬體規格決策

### Modified Capabilities

- `official-site-deployment`：「The marketing site is deployed under the official domain」這條既有 Requirement 目前實測不通過（503），需要修復回歸並補上比對照組更明確的驗證步驟，防止未來再次無人發現地回歸

## Impact

- Affected specs: `vps-production-deployment`（新增）、`official-site-deployment`（修改）
- Affected code：
  - New:
    - `docs/vps-deployment-sop.md`
  - Modified:
    - `docs/coolify-vps-setup-runbook.md`（併入或取代為完整正式 SOP，視動工時內容決定新增章節或整份改寫）
    - `AGENTS.md`（更新現行優先順序段落，反映本次修復與 SOP 完成狀態）
    - `README.md`（部署段落標記需要在 `marketing-site-real-content` change 中更新，本次只在 Impact 註記不重複修改文案）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無（沿用既有 `SiteSetting` 加密表與 Coolify 既有環境變數機制，本次是訂規範不是新增變數）
