## 1. 倉庫規劃與規範文件

- [ ] 1.1 [P] 規劃與撰寫 clean install-package 獨立倉庫指引文件 `docs/clean-package-promotion-guide.md`，落實「Decision 1: 建立獨立全新 GitHub 倉庫而非分支或重命名」與「Two-repository boundary」要求，載明 `fishtvlvoe/startkiter-starter-kit` 倉庫架構與建立流程，驗證方式為確認文件包含完整目錄與權限隔離說明。
- [ ] 1.2 [P] 更新 `docs/deploy-and-public-url.md`，明列 Promotion Checklist 具體清單與「Promotion gate from TEST to clean package」，定義通過條件與「Drift acknowledgment and review cadence」審查節奏，驗證方式為對照 spec 檢視各項門檻與審查時間點。
- [ ] 1.3 [P] 撰寫 Hotfix 維護手冊與雙軌流程說明，落實「Decision 3: 實施已發布與未發布之雙軌 Hotfix 流程」與「Hotfix flow」，明確區分已發布學員與未發布階段之修復優先級，驗證方式為內容審查與情境驗收。

## 2. 自動化 Promotion 腳本

- [ ] 2.1 建立 Promotion 腳本單元測試骨架 `tooling/scripts/promote-clean-package.test.ts`，針對 Allow List、Forbid List 與參數解析編寫測試案例，落實 TDD 規範，驗證方式為執行 `pnpm vitest run tooling/scripts/promote-clean-package.test.ts` 確認測試失敗（Red）。
- [ ] 2.2 實作自動化 promotion 腳本 `tooling/scripts/promote-clean-package.ts`，落實「Decision 2: 採用單向過濾導出與乾淨 Commit 腳本自動化 Promotion」與「Automated promotion script execution」，支援 `--dry-run` 與 `--target` 參數，驗證方式為執行腳本單元測試通過（Green）。
- [ ] 2.3 實作 Forbid List 與 Allow List 過濾引擎，落實「Promotion forbid list」，自動排除公司 Landing 頁、測試帳號、測試媒體、Demo 路由（`/api/demo/*`）與內部雜物，驗證方式為以模擬目錄執行過濾並驗證輸出檔案清單。

## 3. 安全掃描與建置驗證

- [ ] 3.1 於 promotion 腳本中加入敏感關鍵字與內部設定掃描（如 `startkiter.aiver.me`、未授權之私鑰或測試 Token），落實「Promotion forbid list」防洩漏機制，驗證方式為注入測試違規字串確認腳本即時拋錯並中止。
- [ ] 3.2 實作目標乾淨倉庫之自動化建置與測試驗收流程（`pnpm install && pnpm build && pnpm test`），驗證方式為在乾淨導出目錄中執行建置並確認 exit code 0。

## 4. Review 與驗收

- [ ] 4.1 執行完整的 Promotion 乾跑演練（`pnpm tsx tooling/scripts/promote-clean-package.ts --dry-run`），比對產出清單符合 supastarter 純淨度標準，驗證方式為產出 dry-run 報告並核對 Checklist。
- [ ] 4.2 執行 SDD 自審與一致性驗收，確認 proposal、design、specs 與 tasks 完全對齊無衝突，驗證方式為執行 `spectra analyze` 與 `spectra validate` 通過 0 warnings。
