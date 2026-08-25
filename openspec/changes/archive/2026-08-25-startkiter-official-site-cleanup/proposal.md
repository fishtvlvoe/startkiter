## Why

2026-08-22 已定案「不再用 Vercel，全部搬到 Coolify + VPS」，且 `apps/saas`（產品本體）已經實際部署在 Coolify（`app.startkiter.dev` 已實測回應 HTTP 307，運作正常），但這件事至今沒有任何 Spectra change 記錄，只留在討論稿與 AGENTS.md 的一段文字裡。同時 `apps/marketing`（官方銷售頁）還沒有接上正式網域 `startkiter.dev`（實測目前該網域完全無回應），舊的 `test-startkiter.vercel.app` 測試站也還在線上飄著（實測回應 HTTP 200），沒有正式關閉，屬於沒人追蹤的技術債。

## What Changes

- 補一張正式 Spectra change，記錄「`apps/saas` 已部署於 Coolify VPS（`app.startkiter.dev`）」這個既成事實，讓它有規格可查，不再只存在於討論稿
- 把 `apps/marketing` 部署到 `startkiter.dev` 正式網域（DNS 指向、SSL 簽發）
- 關閉舊的 Vercel 部署（`test-startkiter.vercel.app`），停用對應的 Vercel 專案與 auto-deploy webhook，避免持續產生無人維護的部署紀錄

## Non-Goals (optional)

- 不變更 `apps/saas` 現有的 Coolify 部署設定本身（已經在運作，本次只是補文件記錄）
- 不做 `apps/marketing` 的 Dockerfile 化或平台無關部署（那是 `universal-one-click-deploy` change 只處理 `apps/saas` 的範圍，`apps/marketing` 若未來也要平台無關部署，另開 change）
- 不刪除 Vercel 帳號本身，只關閉這個專案的 auto-deploy 與網域綁定

## Capabilities

### New Capabilities

- `official-site-deployment`: 記錄 StartKiter 官方站（`apps/saas` 產品本體與 `apps/marketing` 銷售頁）目前實際部署位置與網域對應關係

### Modified Capabilities

（無）

## Impact

- Affected specs: New: `official-site-deployment`
- Affected code:
  - New: （無新增程式碼，本次為部署設定與網域操作）
  - Modified: `apps/marketing` 的部署設定（Coolify resource 建立，非程式碼變更）
  - Removed: 舊 Vercel 專案的 auto-deploy webhook 設定（非 repo 內程式碼）
- Dependencies 新增：無
- 環境變數新增：無
