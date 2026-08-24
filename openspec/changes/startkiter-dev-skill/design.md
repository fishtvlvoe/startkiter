## Context

StartKiter 的買家開發引導素材分散在團隊 SOP、模組擴充慣例與情境化 onboarding 筆記。現有擴充慣例的 worked example 也落後於目前 `packages/course` 的實際 package 形狀，會讓 AI 產生錯誤的 `src/index.ts`／`exports`／舊 tsconfig 結構。

## Goals / Non-Goals

**Goals:**

- 讓 `docs/buyer-extension-convention.md` 的 `packages/course` 範例與目前實際檔案一致。
- 建立一個同時服務買家與 AI 工具的 `.claude/skills/startkiter-dev/SKILL.md`。
- 保留 onboarding 原筆記，並標記其內容已裁決併入 Skill。
- 清除 `docs/` 內的舊 worktree 絕對路徑，避免文件攜帶本機路徑。

**Non-Goals:**

- 不修改 `packages/course` 或任何 runtime code。
- 不新增 Skill 自動化測試框架、外部服務、金流、發票或電子報供應商整合。
- 不修改 `openspec/specs/` 的正式 capability 規格。

## Decisions

### Decision: 根目錄 index.ts 是買家模組的公開入口

文件與 Skill 都以目前 `packages/course/index.ts` 為 worked example。新模組的公開 API 從 `packages/<name>/index.ts` 重新匯出；內部實作可留在 `src/`。package metadata 使用 `main`／`types`，共用套件版本使用 `catalog:`，workspace 相依使用 `workspace:*`。

### Decision: 一份 Skill 分成白話步驟與技術規則

Skill 先提供買家可照做的四步驟，再提供 AI 工具必須遵守的目錄、package、tsconfig、env 與五階段流程規則。電子報訂閱是情境範例，不代表本 change 要實作電子報功能。

### Decision: 文件中的本機 worktree 路徑改為可攜寫法

`docs/` 內歷史 handoff／CR 文件不保留 `/Users/fishtv/orca/workspaces/...`。可辨識的 worktree 只保留名稱，repo 內檔案連結改用相對路徑；這些清理不改變歷史內容的決策或驗收結論。

## Implementation Contract

**Files:**

- `docs/buyer-extension-convention.md`：入口、package.json、tsconfig 與 worked example 對齊 `packages/course`。
- `.claude/skills/startkiter-dev/SKILL.md`：觸發語、買家四步驟、電子報情境、技術規則與來源索引。
- `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`：新增裁決與 Skill 去向註記，保留原內容。
- 其餘 `docs/` 清理檔：只移除本機絕對路徑，改為 worktree 名稱或 repo-relative link。

**Behavior:**

- 觸發語「照 StartKiter 慣例加一個 X 功能」會讓 AI 讀取本 Skill。
- Skill 的電子報情境必須建議 `packages/newsletter/index.ts`，而非 `packages/newsletter/src/index.ts`。
- `packages/course/index.ts`、`package.json`、`tsconfig.json` 的文件摘錄必須與目前檔案內容一致。

**Acceptance:**

- 暫存 contract test 先在舊文件狀態以 exit code 1 失敗，再在實作後通過；不納入正式變更。
- `spectra analyze`／`spectra validate` 無 Critical／Warning。
- `pnpm test`、`pnpm type-check`、`pnpm build` exit code 0。
- Claude Code plan-mode 對話與 ego-browser Remote Control 對話都實際輸入電子報情境，回應包含正確結構且未修改檔案。
