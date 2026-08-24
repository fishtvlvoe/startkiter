## Why

`docs/startkiter-development-sop.md` 第 86 行記錄的「StartKiter Agent」構想（2026-08-21）已經到了可以動工的時機：把 SOP、`docs/buyer-extension-convention.md`、`docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md` 三份文件合併成一個買家可在自己的 Claude Code／Cursor 裡直接叫用的 Skill，這是 StartKiter「教買家用 AI 開發自己 SaaS」的核心賣點，不是可有可無的附加文件。

考古過程中發現 `docs/buyer-extension-convention.md` 的「真實範例」章節已經嚴重過時：進入點路徑寫 `packages/course/src/index.ts`（真實路徑是 `packages/course/index.ts`，沒有 `src/` 前綴）；`package.json` 範例寫 `"exports": { ".": "./src/index.ts" }`（真實用 `"main": "./index.ts"` 加 `"types": "./**/*.ts"`，且 devDependencies 用 `"catalog:"` 而非寫死版本號）；`tsconfig.json` 範例寫 `"extends": "../../tooling/typescript/base.json"`（真實是 `"@startkiter/tsconfig/base.json"` 透過 workspace 套件引用）；文件第 5 行還殘留一個指向已不存在的 orca worktree 的絕對路徑連結。若不修正，買家的 AI 工具會照著錯誤範例做出跟現有 monorepo 慣例不符的新模組。

## What Changes

- 修正 `docs/buyer-extension-convention.md` 的「真實範例」章節：進入點路徑、`package.json` 形狀（`main`／`types`／`catalog:`）、`tsconfig.json` extends 路徑全部改成 `packages/course` 目前真實內容；第 5 行絕對路徑連結改為相對路徑 `docs/core-boundary-and-extension-guide.md`
- 新增 `.claude/skills/startkiter-dev/SKILL.md`：合併 `docs/startkiter-development-sop.md`（團隊版五階段 SOP＋買家簡化四步驟）、修正後的 `docs/buyer-extension-convention.md`（模組擴充硬性規則）、`docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`（情境化教學素材）三份內容，觸發詞包含「照 StartKiter 慣例加一個 X 功能」
- Skill 內容分兩層：白話步驟（給不懂程式的買家看：先查有沒有現成的 → 照慣例建立模組 → 寫清楚要做什麼 → 驗證）與技術規則（給 AI 工具看：`packages/<name>/` 目錄形狀、`index.ts` 進入點、環境變數注入慣例、禁止事項），一份檔案同時服務兩種讀者
- `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md` 的「待老闆裁決」段落標記為已裁決（形式選 Skill 型，不做獨立文件版）

## Non-Goals

- 不做買家開發引導的「情境式章節文件」（`docs/buyer-guide/` 那種多章節教學網站），這次只做 Skill 型，混合形式的文件主體之後如果有需要再開新 change
- 不修改 `packages/course` 或任何實際模組代碼，這次只修正文件敘述使其準確反映現況
- 不做 Skill 的自動化測試框架（例如自動驗證買家照著 Skill 指示做出來的模組真的符合慣例），這次靠人工跑一次 e2e 驗證 Skill 觸發後的引導內容正確

## Capabilities

### New Capabilities

- `buyer-dev-skill`：買家開發引導 Skill，整合團隊 SOP、模組擴充慣例、情境教學三份既有文件

### Modified Capabilities

- `buyer-extension-convention`：既有 Requirement「Convention document names a real example package」的 Example 本身寫死了錯誤路徑（`packages/course/src/index.ts`，真實路徑無 `src/` 前綴），這次同步修正該 Requirement 的內容，否則會跟修正後的文件內容自相矛盾

## Impact

- Affected specs: `buyer-dev-skill`（新增）
- Affected code：
  - New:
    - `.claude/skills/startkiter-dev/SKILL.md`
  - Modified:
    - `docs/buyer-extension-convention.md`（修正過時範例與絕對路徑連結）
    - `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`（標記裁決結果）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
