<!--
每個 task 都必須說明完成後可觀察到的行為，以及驗證完成的方法。
檔案路徑只是定位資訊，不是 task 本身。
-->

## 1. 先建立報告產生器與失敗規則

- [ ] 1.1 [P] 讓「The verification matrix covers every role, theme, locale, and device combination」與「Failure behavior」在矩陣缺格或格子為 `unverified` 時拒絕產出報告；先建立 `LaunchEvidenceReport` 產生器與矩陣完整性 test。
- [ ] 1.2 [P] 讓「Every visible button and link has a recorded expected and actual outcome」在任一 `LinkVerification` 為 `passed: false` 時整體報告不得標記完成；先建立 link-check aggregation test。
- [ ] 1.3 [P] 讓「Defined error scenarios are exercised and recorded」在三種錯誤情境缺任一筆實測結果時拒絕產出報告；先建立 error-scenario completeness test。
- [ ] 1.4 [P] 讓「Rollback is rehearsed with a recorded execution, not only documented」在 `rollbackRehearsal` 為 `null` 時拒絕產出完成報告；先建立 rollback-record test。
- [ ] 1.5 [P] 讓「Delivery evidence uses a fixed report format naming unresolved items」在 `unresolvedItems` 欄位缺失時拒絕產出報告，欄位存在但為空陣列時允許通過；先建立 schema completeness test。

## 2. 執行驗收矩陣

- [ ] 2.1 依「The verification matrix covers every role, theme, locale, and device combination」對已上線的課程 App 執行 36 組合驗收（使用者／App 管理員／總管理員 × dark／light × zh-tw／zh-cn／en × 1440／390），每格記錄 `verified` 或附理由的 `not-applicable`；完成後矩陣無空格，並以 1.1 測試通過的報告驗證。
- [ ] 2.2 依「Every visible button and link has a recorded expected and actual outcome」逐一點擊目前角色可見的每個按鈕與連結，記錄預期與實際結果；完成後全數 `passed: true`，並以 1.2 測試驗證。

## 3. 錯誤狀況與部署後驗證

- [ ] 3.1 依「Defined error scenarios are exercised and recorded」執行未授權路由直接請求、表單無效輸入、模擬逾時三種情境；完成後三種情境皆有預期與實際結果紀錄，且無裸露堆疊或內部路徑，並以 1.3 測試驗證。
- [ ] 3.2 依「Verification runs against a deployed environment, not local development only」在 TEST／preview 或正式部署網址以 ego-browser 執行完整驗證，留存截圖或錄影；完成後報告引用部署網址而非 localhost，並以檔案路徑存在性驗證。

## 4. 回滾排練

- [ ] 4.1 依「Rollback is rehearsed with a recorded execution, not only documented」在 TEST／preview 環境實際執行一次回滾程序，記錄時間戳、指令與健康檢查結果；完成後 `rollbackRehearsal` 非 `null`，並以 1.4 測試驗證。

## 5. 彙整交付證據

- [ ] 5.1 依「Delivery evidence uses a fixed report format naming unresolved items」（設計決策「Delivery evidence has a fixed format: done, confirmed, and still unconfirmed」，含「Observable behavior」「Interface and data shape」定義的 `LaunchEvidenceReport` 結構）彙整 2.1、2.2、3.1、3.2、4.1 的結果成 `LaunchEvidenceReport`，存入 `docs/verification/`；`unresolvedItems` 非空時附後續處理計畫，完成後以 1.5 測試與檔案存在性驗證。
- [ ] 5.2 依「Acceptance criteria」向 Fish 回報彙整結果，明確區分「已驗證」與「尚未確認」，不得把後者說成已完成；完成後以回報內容與報告檔案逐項比對驗證。

## 6. Review 與交付

- [ ] 6.1 依「Scope boundaries」檢查本 change 只產生驗收證據與報告，不修改前四張 change 已完成的產品程式碼；完成後以 `git diff --stat` 確認改動僅限 `docs/verification/` 與驗收腳本。
- [ ] 6.2 依「Risks / Trade-offs」逐項確認矩陣執行成本、回滾排練對正式環境的影響、未來 App 增加時的驗收範圍擴張都有對應 mitigation；完成後以 code review checklist 記錄證據。
- [ ] 6.3 完成 self-review、`spectra analyze platform-launch-verification-evidence` 與 `spectra validate platform-launch-verification-evidence`；完成後 analyzer 無未處理 warning、validation exit 0，並附上 `LaunchEvidenceReport` 路徑。
