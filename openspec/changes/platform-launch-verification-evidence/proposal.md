## Why

`role-based-workspace-navigation`、`app-extension-contract`、`account-settings-theme-language`、`app-feature-surfaces` 各自有自己範圍內的分層驗收（單元測試、component test、基礎 browser 驗收），但沒有一張 change 負責「這一整組骨架 change 全部完成後，能不能真的上線」這件事。自動檢查通過不代表完成——還需要有人實際用桌機與手機，逐一操作使用者、App 管理員、總管理員三種角色，切過深色淺色與三種語言，點過每個看得到的按鈕與連結，並確認遇到錯誤狀況時系統行為正常、且有一條清楚的回到上一版方法。這張 change 就是把「上線前確認」變成可留存證據的固定關卡，不是又一次功能開發。

## What Changes

- 新增「上線前確認清單」：桌機 `1440px` 與手機 `390px`、使用者／App 管理員／總管理員三種角色、深色／淺色兩種主題、`zh-tw`／`zh-cn`／`en` 三種語言的完整組合矩陣。
- 新增「所有可見按鈕與連結」逐一點擊驗收流程：每個入口點擊後必須有預期結果（導向正確頁面、或明確的權限拒絕），不得出現 401/500 裸露錯誤、死連結或無回應按鈕。
- 新增「錯誤狀況」驗收：直接請求未授權路由、輸入無效資料、網路逾時等情境下，系統要有可預期的錯誤畫面，不洩漏堆疊或內部路徑。
- 新增「部署後實際瀏覽器驗證」流程：以 ego-browser 在正式或 preview 部署環境操作，不只驗證本機開發環境。
- 新增「回到上一版的方法」文件：記錄目前部署方式下，如何在驗收失敗時回滾，並排練過一次。
- 新增交付證據格式：每次上線前確認要留下清楚紀錄（做了什麼、確認了什麼、哪些地方尚未確認），不是口頭回報「測過了」。

## Non-Goals

- 不新增任何產品功能——本 change 純粹是驗證與交付流程，依賴前四張 change 已完成。
- 不重新定義 `WorkspaceContext`、App registration、帳號選單或 App 功能邊界的任何規則——本次只驗證它們是否如預期運作。
- 不建立自動化 CI pipeline 以外的新基礎設施（例如新的監控系統或 APM）；沿用既有 `docs/vps-deployment-sop.md` 部署流程。
- 不涵蓋課程內容本身的教學品質或業務邏輯正確性驗收（那屬於各功能 change 自己的驗收範圍）。

## Capabilities

### New Capabilities

- `platform-launch-verification-evidence`: 定義上線前的跨角色、跨 App、跨語言、跨主題、桌機／手機完整驗收矩陣，逐一按鈕連結驗收、錯誤狀況驗收、部署後瀏覽器驗證與回滾排練，以及交付證據格式。

### Modified Capabilities

- None.

## Impact

- Affected specs: 新增 `openspec/changes/platform-launch-verification-evidence/specs/platform-launch-verification-evidence/spec.md`；依賴 `role-based-workspace-navigation`、`app-extension-contract`、`account-settings-theme-language`、`app-feature-surfaces` 皆已完成並各自通過分層驗收，本 change 是最後的全量關卡。
- Affected code: 不新增產品程式碼；新增 `docs/verification/`（既有目錄）下的驗收清單文件、ego-browser 驗收腳本（`.mirasim` 或 repo 內既有腳本結構）、回滾排練紀錄。
- Dependencies: 沿用既有 ego-browser、`docs/vps-deployment-sop.md` 部署流程；不新增套件。
- Environment variables: 不新增環境變數。
