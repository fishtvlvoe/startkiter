# StartKiter 開發流程 SOP

> 這份文件的目標讀者有兩種人：StartKiter 自己團隊（每次開新 SR 都照這個跑）、以及未來買家自己開發新功能時的 AI 工具（比照這套規矩，不會跟核心架構打架）。
> 2026-08-21 首版，依 `core-module-bundles-coupons` 這張 change 的實際操作過程整理。

## 一句話

任何「加功能、改架構、抽新模組」的任務，一律走 `discuss → propose → apply → review → archive` 五階段，每階段有明確的產出物跟關卡，沒過關不能進下一階段。

## 流程圖

```
discuss（可省）→ propose（產出 SR 文件）→ apply（寫代碼）→ review（審查）→ archive（歸檔）
                        ↑                        ↑
                  必須先過 analyze              Critical 必須為零
                  + validate 0 warnings         才能進 archive
```

- `discuss` 可省略：需求已經很清楚時（例：純 bug fix、1 行 hotfix）
- 其餘四階段不可跳步

## 各階段的 StartKiter 特有規則

以下是疊加在 Spectra 通用流程之上、StartKiter 這個專案自己加的規矩（不是每個 Spectra 專案都有）。

### 1. Discuss（討論收斂）

- 先掃現有代碼，3+ 相關檔案就用「假設模式」（列出假設 + 依據 + 若錯的後果，一次全部丟給對方確認），少於 3 個才逐題訪談
- **reuse-first**：先查 `packages/` 有沒有現成的可以用，不要沒查就假設要新寫（例：訂閱制優先查 supastarter 內建 Plans 機制，不是先查 THE-TU 有沒有訂閱模組）
- 討論收斂後，明確寫出「Decision / Rationale / Capture to」三段式結論

### 2. Propose（產出 SR 文件）

固定產出 4 種文件（`spectra new artifact`）：

| 檔案 | 內容 | StartKiter 特有規則 |
|---|---|---|
| `proposal.md` | Why / What Changes / Capabilities / Impact | Capabilities 段落的名字要跟 `openspec/specs/` 現有 spec 完全對應，改動既有商業規則（例：金額、SKU 數量）必須列進「Modified Capabilities」，不能只加新的不提舊的要改 |
| `design.md` | Context / Decisions / Implementation Contract | **抽取來源檔必須寫絕對對應表**（來源路徑 → 目標路徑），禁止改來源 repo；每個 Decision 標題之後要在 tasks.md 裡被引用到 |
| `specs/<capability>/spec.md` | Requirement + Scenario | 用 SHALL/MUST，禁止 should/may/TBD；有計算邏輯的 Scenario 建議加 `##### Example:` 具體數字範例（折扣金額算法這種一定要加，不然實作會各自理解不同） |
| `tasks.md` | 紅燈測試 → 實作 → Review 三段式 | 每個 task 要講「完成時什麼行為是真的」+ 「怎麼驗證」，不能只寫「改某個檔案」；每個 Requirement 名稱要出現在至少一個 task 描述裡（analyzer 會抓） |

**抽取多來源時**：如果同類功能在多個來源都有（例：THE-TU 跟 woomin 都有付款相關代碼），design.md 要明講選哪個來源、為什麼，不要兩邊都抽在同一個模組裡打架。

### 3. Apply 前的關卡（analyze-fix loop）

```bash
spectra analyze <change-name> --json
```

- 只處理 Critical／Warning，Suggestion 可以不理
- 最多修 2 輪，修完再跑一次確認清空
- 全部清空後才跑 `spectra validate`，通過才能 `spectra park`（如果現在不馬上 apply）或直接進 apply

### 4. Apply（寫代碼）

- TDD 紅燈在前：先讓測試全部失敗，才寫讓它們變綠燈的實作
- **Demo-first**：任何 UI 改動（新頁面、改版面），先出靜態 HTML demo，老闆/買家確認過視覺才寫真代碼，不能邊做邊改
- 每個 Phase 結束要有獨立的 Review 小節（code review Critical 為零 + build/test 通過）才能進下一個 Phase

### 5. Review（審查）

- correctness / security / performance 三個角度都要過一次
- Critical 為零才算過；Warning 可以記錄但不擋
- **真實 e2e + 手動點過一輪（2026-08-21 老闆定案，硬性步驟）**：
  1. 功能寫完、單元測試綠燈後，啟動 dev server，開真實瀏覽器（`/ego-browser` skill）把新功能相關的每個頁面**都點一次**——不是只看 curl/API 回應，UI 互動、跳轉、表單都要真的點
  2. 過程中發現的問題（視覺 bug、缺功能、跟既有功能衝突），**先寫進對應 change 的 tasks.md 或開新的發現清單，不要當場就地亂改**——避免遇到一個修一個、範圍失控，也避免漏掉沒發現的問題
  3. 清單列完，跟老闆對過範圍，才進去修
  4. 例外：修的東西極小、範圍單一、明顯不影響其他功能（例如一個 icon key 打錯）可以當場直接修，但要在回報裡講清楚修了什麼、為什麼判斷是安全範圍

### 6. Archive（歸檔）

- 全部 task `[x]` 打勾
- `spectra validate` 0 warnings
- `pnpm build` + `pnpm test` 全綠才能 `spectra archive`

## 給買家／學生用的簡化版（自己加功能時）

買家不需要學整套 Spectra CLI，但精神要一樣，濃縮成 4 步：

1. **先查有沒有現成的**：翻 `packages/` 看有沒有類似功能的模組可以參考或擴充
2. **照 `docs/buyer-extension-convention.md` 的格式新增模組**：獨立 `packages/<name>/`、`src/index.ts` 進入點、自己的 `package.json`/`tsconfig.json`
3. **寫一份小小的「這個功能要做什麼」說明**（不用整套 SR 文件，但至少寫清楚：這功能觀察得到的行為是什麼、怎麼驗證做對了）
4. **驗證**：`pnpm type-check` 跟 `pnpm test` 在自己模組目錄跑過，且不 import 其他模組的內部檔案

## 待辦：StartKiter Agent（構想，2026-08-21 記錄）

老闆想把這份 SOP 包成一個「StartKiter 自己的 agent／skill」，讓買家在自己的 Claude Code / Cursor 裡可以直接叫用（類似遊戲引擎的官方教學+範本），不用每次都手動翻文件。

- 內容來源：這份 SOP + `docs/buyer-extension-convention.md` + 未來的「買家開發引導指南」（見 `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`）三份合併
- 形式待定：獨立 Skill 檔（`.claude/skills/startkiter-dev/SKILL.md`）最可能，觸發詞類似「照 StartKiter 慣例加一個 X 功能」
- 現階段只記錄構想，不動工——先把買家開發引導指南（文件/Skill/混合三選一）跟這份 SOP 的內容都定案，才有東西可以包
