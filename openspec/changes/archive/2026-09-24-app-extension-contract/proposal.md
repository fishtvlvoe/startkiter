## Why

`role-based-workspace-navigation` 已固定「平台／App／角色」的骨架與 `WorkspaceContext`、App manifest 型別，但沒有定義一件事：一個新的 App（例如設計、社群）要怎麼被加進平台——要提供哪些內容、誰能設定 App 顯示名稱、選單／使用資格／圖示／語言／測試要滿足什麼規則。沒有這份契約，下一個 App 的開發者（人類或 AI）只能憑感覺仿造 course 的做法，容易漏掉某個規則（例如忘記補語系 key、直接把管理功能塞進總管理員介面）。本 change 把「新增 App 的規則」寫成可驗證的契約，並延伸既有 `.agents/skills/startkiter-dev/SKILL.md`，讓 AI 開發前有固定 preflight 可查，同時把這些 AI 專用術語擋在一般使用者文件之外。

## What Changes

- 新增「App 註冊契約」：定義一個 App 要提供的必要欄位（`appId`、`displayName`、route、menu、使用資格、i18n namespace、icon set）與可選欄位。
- 新增「App 名稱可由使用者自訂」的設定機制：`displayName` 由誰（總管理員／App 管理員）在哪裡設定、如何驗證（長度、禁字、不得為固定稱呼字串如「總管理員」）。
- 延伸既有 `.agents/skills/startkiter-dev/SKILL.md`，加入「新增 App 前」的 preflight：先查是否有可重用 App、確認 manifest 必要欄位、確認選單掛載點、確認 icon 淺／深色版本、確認語言 key、確認測試清單。
- 新增 App registry 的 CI 檢查：新 App 缺少必要欄位、缺少語系 key、缺少 icon 版本、或選單掛載到不存在的 workspace 時擋下 CI。
- 明確劃分「AI／開發者專用術語」（manifest、resolver、workspace、registry 等）只出現在 Skill 與 spec，不得外流到學生或一般使用者可見的文件與 UI 文案。

## Non-Goals

- 不重新定義 `WorkspaceContext`、`resolveNavigation` 或選單渲染邏輯——沿用 `role-based-workspace-navigation` 已固定的型別，本次只定義「新 App 資料要怎麼寫進去」。
- 不建立帳號選單、主題、語言切換 UI 的實際內容——這是 `account-settings-theme-language` 的範圍。
- 不實作任何一個實際 App 的功能畫面（課程、設計、社群等）——這是 `app-feature-surfaces` 的範圍。
- 不處理上線前跨 App 全量驗收與回滾證據——這是 `platform-launch-verification-evidence` 的範圍。
- 不開放「App 管理員稱呼樣板」可自訂（仍固定「{displayName}管理員」樣板，樣板本身在 `role-based-workspace-navigation` 定義）；本次只定義 `displayName` 本身如何被設定。
- 不處理付款、Email、GitHub kit 履約或客服通道。

## Capabilities

### New Capabilities

- `app-extension-contract`: 定義新 App 加入平台的必要欄位、`displayName` 設定與驗證規則、developer Skill preflight，以及擋下不合格 App 註冊的 CI 契約。

### Modified Capabilities

- None.

## Impact

- Affected specs: 新增 `openspec/changes/app-extension-contract/specs/app-extension-contract/spec.md`；依賴 `role-based-workspace-navigation` 已定義的 `WorkspaceContext`、`AppManifestEntry` 型別，不重寫其需求。
- Affected developer guidance: 更新 `.agents/skills/startkiter-dev/SKILL.md`，加入「新增 App」preflight 段落；更新 `AGENTS.md` 指向本 change 的 canonical spec。
- Affected code: `packages/platform/src/app-registry/`（新增，App registry 的欄位驗證與 CI check）、`.agents/skills/startkiter-dev/SKILL.md`、`apps/saas/modules/shared/lib/nav-menu-items.ts`（改為讀 App registry 而非各自硬編碼）。
- Dependencies: 依賴 `role-based-workspace-navigation` 先完成並提供 `AppManifestEntry` 型別；不新增第三方套件。
- Downstream changes：`app-feature-surfaces` 加入任何新 App 時必須通過本 change 定義的註冊契約與 CI check。
- Environment variables: 不新增環境變數。
