## 1. 修正過時的擴充慣例文件

- [x] 1.1 修改 `docs/buyer-extension-convention.md`：把「真實範例」章節的進入點路徑、`package.json`、`tsconfig.json` 內容全部換成 `packages/course` 目前實際內容（進入點 `packages/course/index.ts`；`package.json` 用 `main`／`types`／`catalog:`；`tsconfig.json` extends `@startkiter/tsconfig/base.json`），第 5 行絕對路徑連結改為相對路徑 `docs/core-boundary-and-extension-guide.md`；同步更新 Requirement「A written module convention document exists」既有的 Example 內容，使其跟修正後的文件一致，不再宣稱進入點是 `packages/course/src/index.ts`。驗證目標：涵蓋 Requirement「The extension convention document's worked example reflects the actual current packages/course structure」與「A written module convention document exists」的全部 Scenario，逐句對照 `packages/course/index.ts`／`package.json`／`tsconfig.json` 實際內容確認一致。對應 design.md Decision: 根目錄 index.ts 是買家模組的公開入口

## 2. 建立買家開發引導 Skill

- [x] 2.1 新增 `.claude/skills/startkiter-dev/SKILL.md`：合併 `docs/startkiter-development-sop.md`（五階段 SOP＋買家簡化四步驟）、修正後的 `docs/buyer-extension-convention.md`（模組擴充硬性規則）、`docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`（情境化教學素材：「我想加一個 X 功能」→ 對應 prompt 範例與預期結果），觸發詞含「照 StartKiter 慣例加一個 X 功能」；內容分「白話步驟」（給買家看）與「技術規則」（給 AI 看）兩個清楚區隔的段落。驗證目標：涵蓋 Requirement「A buyer-facing Skill merges the SOP, extension convention, and onboarding guide」與「The Skill serves both a plain-language reader and an AI-technical reader in one file」的全部 Scenario。對應 design.md Decision: 一份 Skill 分成白話步驟與技術規則
- [x] 2.2 修改 `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`：在「待老闆裁決」段落標記已裁決（形式選 Skill 型，內容已併入 `.claude/skills/startkiter-dev/SKILL.md`），保留原筆記內容不刪除，只新增裁決結果註記。驗證目標：該文件明確標示裁決狀態與去向

## 3. Review 與驗證

- [x] 3.1 派 Codex 或等效工具對 task 1.1／2.1／2.2 的 diff 做 Code Review（correctness／security／performance 三角度，本張以「內容正確性」與「敏感資訊/失效連結」取代 security/performance 的實質檢查項目，因為本 change 是純文件/Skill 修改，沒有 runtime 代碼）：確認修正後的路徑範例與 `packages/course` 實際結構逐字一致、沒有殘留錯誤範例、沒有洩漏內部絕對路徑或帳密。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 3.2 用一個真實情境跑一次 e2e：在對話中輸入「照 StartKiter 慣例加一個電子報訂閱功能」，確認觸發 `.claude/skills/startkiter-dev/SKILL.md`，且回應內容包含正確的 `packages/newsletter/` 目錄結構建議、正確的進入點路徑、正確的 `package.json`／`tsconfig.json` 形狀（跟 task 1.1 修正後的內容一致，不是舊版錯誤範例）。驗證目標：Skill 觸發成功且引導內容與修正後的 `buyer-extension-convention.md` 一致，過程截圖或逐字記錄對話內容
- [x] 3.3 grep 全專案確認 `packages/course/src/index.ts`（錯誤路徑）與舊 `orca/workspaces` 絕對路徑字串在修改後的文件中不再出現。驗證目標：`grep -r "packages/course/src/index.ts" docs/` 與 `grep -r "orca/workspaces" docs/` 皆無輸出。對應 design.md Decision: 文件中的本機 worktree 路徑改為可攜寫法
- [x] 3.4 跑 `spectra analyze startkiter-dev-skill --json` 與 `spectra validate startkiter-dev-skill`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
