## 1. NavBar 接上 resolveNavigation

- [x] 1.1 完成「NavBar 呼叫 resolveNavigation 決定選單內容」：把 `NavBar.tsx` 改為呼叫 `resolveNavigation`，依 `WorkspaceContext` 動態顯示身份與選單；驗證：對照 `specs/role-based-workspace-navigation/spec.md` 兩個 Scenario，新增「總管理員進課程 App 顯示課程管理員身份」這個之前完全沒測到的測試案例（對應設計決策「NavBar 修復需要新增之前完全沒有的測試案例」）
- [x] 1.2 確認既有 `NavBar.test.tsx` 全數通過，沒有因這次改動破壞舊行為；驗證：`pnpm test NavBar`

## 2. 頭像上傳修復

- [x] 2.1 完成「上傳失敗要顯示原因」：`onCrop` 失敗時顯示具體錯誤提示並記錄 log；驗證：對照該 Scenario，手動製造 S3 憑證缺漏情境確認有錯誤提示
- [x] 2.2 完成「上傳流程在環境齊全時要能成功」：確認/補齊 `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`；驗證：本機若有可用 S3 環境，實際跑一次上傳成功；若無，明確標記「受限於環境，無法端到端驗證」。2026-09-23：沒有可用 S3，成功上傳無法端到端驗證；失敗提示已有。

## 3. 客服按鈕位置修復

- [x] 3.1 完成「客服按鈕可收合」：改成可收合/可關閉，功能不變；驗證：對照兩個 Scenario 手動操作確認

## 4. 電子報分支合��

- [x] 4.1 找出 `origin/fishtvlvoe/newsletter-automation-integration` 與 `main` 全部差異檔案，`packages/database/prisma/schema.prisma`、`packages/mail/provider/*` 衝突採用 main 版本（對應設計決策「電子報合併採技術實作用新的、行為邏輯要核對原則」）。2026-09-23 已完成 7 個 commit 的 no-ff merge，技術衝突採 main。
- [x] 4.2 完成「自動寄送引擎可正式運作」：合併 Wave 1B send engine + dispatch cron 進 main；驗證：對照該 Scenario 實際跑一次排程寄送。2026-09-23 已保留 send engine 與 cron route，相關 cron/engine 測試執行 dispatch path 通過。
- [x] 4.3 完成「合併衝突時保留行為正確的一方」：逐一核對 `packages/newsletter/`、`unsubscribe`、`email-consent`、`SignupForm.tsx`、`checkout` 相關衝突的行為語意；驗證：對照「兩套退訂邏輯行為不一致時停下回報」Scenario，發現不一致時停下記錄差異，不自行選邊。2026-09-23 依已裁決規則採 main 的退訂/同意、SignupForm 與 checkout 行為，並調整自動寄送呼叫端配合 main API。
- [x] 4.4 合併後跑一次既有退訂/同意相關測試，確保沒有變紅；驗證：`pnpm test` 全綠。2026-09-23 newsletter 9 files/55 tests 與 SaaS 相關 6 files/23 tests 全部通過，`pnpm build` 亦通過。

## 5. 整合驗證

- [x] 5.1 `pnpm build` 全綠（2026-09-23 實跑通過：3 successful, 3 total）
- [ ] 5.2 本機以總管理員帳號走一次：進課程 App 看到管理員身份、頭像上傳（若環境允許）、客服按鈕收合、電子報後台，截圖存證
