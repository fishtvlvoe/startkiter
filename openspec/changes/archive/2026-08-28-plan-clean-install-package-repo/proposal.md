## Why

StartKiter 目前僅有本機開發庫與髒測試站（test-startkiter），尚未建立交付給學員的乾淨安裝包（clean install-package）獨立倉庫。為確保客戶獲得對標 supastarter 的純淨代碼包，且不洩漏測試帳號、測試媒體、公司 Landing 頁與內部維運雜物，需要明確規範 clean package 倉庫建立架構、過濾白/黑名單、Promotion Checklist 步驟與自動化 promotion 腳本。

## What Changes

- 定義獨立 GitHub 倉庫 `startkiter-starter-kit` 之建立規格與目錄結構。
- 制定完整的 Promotion Checklist 步驟（涵蓋前置審查、檔案過濾、相依套件與型別驗證、DB schema 檢查、乾淨 commit 生成）。
- 明確界定 Forbid List（排除公司 Landing 頁、測試媒體、工寮雜物、公司憑證範例）與 Allow List（核心殼、前端骨架、資料庫 schema 與必要 seed）。
- 規劃自動化 promotion 腳本（`tooling/scripts/promote-clean-package.ts`），支援 `--dry-run`、檔案過濾、敏感詞掃描與目標倉庫發布。
- 更新 promotion 規格，將腳本自動化檢驗與兩階段 hotfix 機制納入驗收標準。

## Non-Goals

- 本次變更僅限於規劃與規格產出，不直接建立遠端 GitHub 倉庫或推送代碼。
- 不修改付費學員的 GitHub kit fulfillment 邀請流程（kit 倉庫為獨立履約線）。
- 不建立即時雙向同步機制，維持由 TEST 經 Checklist 單向 promotion 至 clean package，以及 hotfix 手動 backport 規則。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `test-clean-package-promotion`: 擴充 clean install-package 獨立倉庫規格、自動化 promotion 腳本需求、過濾名單驗證與 hotfix 雙向管理規則。

## Impact

- Affected specs: `test-clean-package-promotion`
- Affected code:
  - New: `tooling/scripts/promote-clean-package.ts`, `docs/clean-package-promotion-guide.md`
  - Modified: `docs/deploy-and-public-url.md`, `README.md`
  - Removed: (none)
