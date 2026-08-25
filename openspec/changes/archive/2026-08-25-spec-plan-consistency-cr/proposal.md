## Why

這次全面盤點（2026-08-25）發現：`operator-settings` 規格名稱讀起來像「後台設定總表」，但目前內容只涵蓋 PAYUNi 金鑰設定一項；代碼裡實際上已經多了電子發票設定頁（`apps/saas/app/(authenticated)/(main)/(account)/admin/settings/einvoice/`），未來還會有金流切換、email 設定等頁面陸續出現，卻沒有任何規格把「後台有哪些設定分頁」登記起來。另外，`apps/saas/` 底下沒有 `.env.example`，只有 `legacy/apps/saas/.env.example` 這份過時版本，買家部署後不知道要填哪些環境變數、哪些是必填、哪些缺了會 fail-closed。

## What Changes

- 擴充 `operator-settings` 規格，明確定義其範圍為「後台設定總表」：登記目前已存在的設定分頁（PAYUNi 金鑰、電子發票）皆屬於這個能力範圍，並定義未來新增設定分頁時的登記慣例（每新增一個設定頁，需同步在本規格補一條 Requirement）
- 新增 `apps/saas/.env.example`（正確路徑），列出目前所有模組會讀取的環境變數，並標註各自必填／選填狀態與缺漏時的既有 fail-closed 行為（例如缺 PAYUNi 金鑰時結帳回 503）

## Non-Goals (optional)

- 不透過本次 delta spec 機制逐一回填其餘規格的 Purpose 欄位——Purpose 是描述性欄位、不是 Requirement 內容變更，不適用 delta 機制；這件事會在本 change 之外，以純文件維護的方式直接處理，不需要走完整 Spectra change 流程
- 不修改 `one-click-deploy` 規格內容（該規格的 Dockerfile／平台無關性擴充由 `universal-one-click-deploy` change 處理，避免兩張 change 同時改同一份規格互相打架）
- 不處理 `admin/organizations` 頁面去留（留給 `organization-enterprise-account` change）
- 不新增或刪除任何既有設定頁的實際功能，只補文件登記與 `.env.example`
- 不改變任何既有環境變數的預設值或 fail-closed 邏輯本身，只把既有行為正確記錄下來

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `operator-settings`: 從只涵蓋 PAYUNi 金鑰設定，擴充為「後台設定總表」，登記現行所有設定分頁並定義新增設定頁的登記慣例

## Impact

- Affected specs: Modified: `operator-settings`
- Affected code:
  - New: apps/saas/.env.example
  - Modified: （無，本次僅新增檔案與規格文件）
  - Removed: （無）
- Dependencies 新增：無
- 環境變數新增：無（本次只是把既有環境變數正確記錄進 `.env.example`，不新增變數本身）
