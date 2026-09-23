<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立報告產生器與失敗規則

- [x] 1.1 [P] 讓「The verification matrix covers every role, theme, locale, and device combination」與「Failure behavior」在矩陣缺格或格子為 `unverified` 時拒絕產出報告；先建立 `LaunchEvidenceReport` 產生器與矩陣完整性 test。
- [x] 1.2 [P] 讓「Every visible button and link has a recorded expected and actual outcome」在任一 `LinkVerification` 為 `passed: false` 時整體報告不得標記完成；先建立 link-check aggregation test。
- [x] 1.3 [P] 讓「Defined error scenarios are exercised and recorded」在三種錯誤情境缺任一筆實測結果時拒絕產出報告；先建立 error-scenario completeness test。
- [x] 1.4 [P] 讓「Rollback is rehearsed with a recorded execution, not only documented」在 `rollbackRehearsal` 為 `null` 時拒絕產出完成報告；先建立 rollback-record test。
- [x] 1.5 [P] 讓「Delivery evidence uses a fixed report format naming unresolved items」在 `unresolvedItems` 欄位缺失時拒絕產出報告，欄位存在但為空陣列時允許通過；先建立 schema completeness test。

## 2. 執行驗收矩陣

- [x] 2.1 2026-09-24 雲端正式站實測，36 格矩陣全數執行、無空格。12 格 verified，24 格（zh-cn/en 全部組合）因 workspaceLabel 未走 i18n 而 failed（非空缺，是有明確結果的失敗，根因已知另開追蹤）。證據：`openspec/changes/platform-launch-verification-evidence/evidence/launch-matrix-observations.json`。
- [x] 2.2 2026-09-24 54 個可見連結/按鈕檢查全數 `passed: true`。證據：`evidence/link-checks.json`、`evidence/button-checks.json`。

## 3. 錯誤狀況與部署後驗證

- [x] 3.1 2026-09-24 三種錯誤情境全數執行且無裸露堆疊/內部路徑。證據：`evidence/error-scenarios.json`。
- [x] 3.2 依「Verification runs against a deployed environment, not local development only」，2026-09-24 驗證針對 https://app.startkiter.dev 正式站執行，非 localhost。**未完成部分**：36 張截圖因 ego-browser `Page.captureScreenshot` 在兩種 viewport 下持續逾時未能產出，以 DOM/state 證據代替，如實記錄在報告的「尚未確認」段落，不以空白或假圖代替。

## 4. 回滾排練

- [ ] 4.1 依「Rollback is rehearsed with a recorded execution, not only documented」在 TEST／preview 環境實際執行一次回滾程序，記錄時間戳、指令與健康檢查結果；完成後 `rollbackRehearsal` 非 `null`，並以 1.4 測試驗證。

## 5. 彙整交付證據

- [x] 5.1 依「Delivery evidence has a fixed format: done, confirmed, and still unconfirmed」與「Observable behavior」「Interface and data shape」，2026-09-24 `LaunchEvidenceReport` 已產出存入 `docs/verification/LaunchEvidenceReport.{json,md}`，`unresolvedItems` 非空，逐項附後續處理計畫（4.1 回滾待 Fish 授權、i18n bug 另開 SR、截圖工具問題待重試、測試帳號課程權限待確認）。1.5 schema 測試 12/12 通過。
- [x] 5.2 依「Acceptance criteria」，2026-09-24 已在對話中向 Fish 回報彙整結果（已驗證：36 格矩陣、54 個連結/按鈕、3 種錯誤情境；尚未確認：24 格 i18n 失敗待另開 SR、36 張截圖未產出、測試帳號課程權限未確認、4.1 回滾未執行待授權），對照 `LaunchEvidenceReport.md`。

## 6. Review 與交付

- [x] 6.1 依「Scope boundaries」，2026-09-24 `git show` 確認本 change 唯一的 commit（15db22b）只動 `docs/verification/` 與 `openspec/changes/platform-launch-verification-evidence/evidence/` 7 個檔案，沒有碰任何產品程式碼。
- [x] 6.2 依「Risks / Trade-offs」，2026-09-24 逐項確認 design.md 的 mitigation：矩陣成本（固定鍵批次執行+存 JSON，已落實）、回滾風險（本輪不碰正式站，4.1 留待 TEST/preview 低流量時段，未執行）、App 擴張（以 appId 分組，只有 course 一個 App，符合設計）。
- [x] 6.3 2026-09-24 `spectra analyze` 無 Critical/Warning（剩 4 個 SUGGEST 缺 Example，非阻塞）；`spectra validate` 輸出 `✓ valid`。`LaunchEvidenceReport` 路徑：`docs/verification/LaunchEvidenceReport.{json,md}`。
