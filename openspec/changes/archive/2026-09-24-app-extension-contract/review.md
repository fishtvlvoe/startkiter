# App 註冊契約審查紀錄

日期：2026-09-23
範圍：`app-extension-contract` 第 5.1、5.2

## 5.1 檔案範圍

以這張 change 的實作提交範圍執行：

```sh
git diff --stat 0fa0cb94^ 726937ce
git diff --name-status 0fa0cb94^ 726937ce
```

結果：929 insertions、14 deletions，15 個檔案。檔案集中在：

- `packages/platform/src/app-registration.ts` 與其測試、`packages/platform/src/workspace/registry.ts` 與其測試：manifest、`displayName` 權限／驗證、registry adapter。
- `.github/workflows/app-registry.yml`、`packages/platform/package.json`、`packages/platform/src/app-registry-ci.test.ts`：CI 驗證入口。
- `tooling/scripts/forbidden-term-scan.ts`、其測試與 package script：使用者可見文案詞彙掃描。
- `.agents/skills/startkiter-dev/SKILL.md`、`AGENTS.md`、根 `package.json`、`packages/platform/index.ts`、`openspec/changes/app-extension-contract/tasks.md`：開發入口、匯出與任務追蹤。

審查結論：PASS。`git diff` 未包含 `WorkspaceContext` 或 `resolveNavigation` 實作本身，也未包含任何實際 App 功能畫面；目前 `origin/main` 上另外存在的課程路由分離與帳號設定主題／語言提交，不列入這張 change 的 diff，也不回退。

## 5.2 風險與對應處理

| 風險 | 對應處理 | 證據 | 結論 |
| --- | --- | --- | --- |
| `displayName` 即時更新後與選單標籤不同步 | 每次 `toAppManifestEntries` 呼叫都從傳入 registry 讀取名稱，不快取名稱本身；更新後重新 resolve。 | `packages/platform/src/workspace/registry.ts:21-48`；`packages/platform/src/workspace/registry.test.ts:117-145` 驗證「設計管理員」更新為「圖片設計管理員」。 | PASS |
| CI 規則日後擴充造成相容性破壞 | 新增必要欄位先維持可選，下一個 major change 才轉為必要；目前 CI 透過 package script 執行 registry validation。 | `design.md`「Risks / Trade-offs」；`packages/platform/package.json:7-11`；`.github/workflows/app-registry.yml:3-30`。 | PASS |
| 詞彙掃描誤傷註解、Skill 或程式碼中的非 UI 文字 | 只掃 `apps/saas/modules` 與 `docs/tutorials`；文件跳過 HTML 註解與 fenced code，程式碼跳過行／區塊註解與 module specifier；測試明確驗證排除規則。 | `tooling/scripts/forbidden-term-scan.ts:37-68,108-169`；`tooling/scripts/forbidden-term-scan.test.ts:32-79`。 | PASS |

## 驗證紀錄

- `pnpm --filter @startkiter/platform validate:app-registry`：1 file、2 tests passed。
- `pnpm --filter @startkiter/platform exec vitest run src/app-registration.test.ts src/workspace/registry.test.ts`：2 files、18 tests passed。
- `pnpm --filter @startkiter/scripts exec vitest run forbidden-term-scan.test.ts`：1 file、5 tests passed。
- `pnpm --filter @startkiter/scripts check:forbidden-terms`：`No forbidden developer vocabulary found in learner-facing targets.`
- `pnpm --filter @startkiter/platform test`：29 files／156 tests passed，另有 1 個既有 `forbidden-nouns-check` 因 `apps/saas/modules/admin/component/users/UserList.tsx` 的 `學員` 文案失敗；該檔案屬 main 上的其他 change，本次不修改。
- `spectra analyze app-extension-contract`：在以目前 HEAD 建立的乾淨暫存 checkout 執行，五個分析面向皆 `Clean (0 findings)`，最後輸出 `No issues found`，exit 0。
- `spectra validate app-extension-contract`：同一個乾淨暫存 checkout 輸出 `✓ app-extension-contract — valid`，exit 0。

備註：Orca worktree 的 Spectra artifact store 仍指向主工作樹，直接在本 worktree 執行 analyze 會讀到修改前的 3 個 SUGGEST；乾淨 checkout 以目前 HEAD 的規格檔重跑，確認本次補例子與移除 `may` 後無 warning。未修改主工作樹檔案。
