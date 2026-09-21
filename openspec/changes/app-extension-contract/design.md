## Context

`role-based-workspace-navigation` 固定了「平台／App／角色」骨架與 `WorkspaceContext`、`AppManifestEntry` 型別，course 是第一筆接入資料。但目前沒有任何文件規定：一個新的 App 要滿足什麼條件才能被平台接受、`displayName`（決定「{App 名稱}管理員」怎麼顯示）由誰設定、開發者或 AI 新增 App 前該檢查什麼。StartKiter 買家拿到的是可延伸的代碼包，之後加裝 App 的人可能是學生自己或他們找的 AI 工具，如果沒有機器可驗證的契約，只靠 `startkiter-dev` Skill 的文字說明，會重演 `role-based-workspace-navigation` design.md 已指出的問題：Skill 可能沒被 AI 自動載入，型別與測試才是最後防線。

## Design Source

- Source: `docs/ux/startkiter-sr-architecture-focus.html`「功能怎麼組合」「先固定架構，再讓功能一個一個加入」段落。
- 對焦重點：「每個 App 功能自己帶的東西」＝資料、進入位置與資格、選單位置、文字與圖示（淺／深色）、自己的檢查；「平台統一負責的東西」＝收集清單、判斷畫面、組合選單、完成檢查。

## Goals / Non-Goals

**Goals:**

- 定義新 App 加入平台的必要與可選欄位，覆蓋 route、menu、使用資格、i18n、icon。
- 定義 `displayName` 由誰設定、如何驗證，讓「{App 名稱}管理員」有正確資料來源。
- 延伸 `startkiter-dev` Skill 成為 App 新增流程的單一開發入口，preflight 用型別與測試把關，不只靠文字自律。
- 讓 CI 能自動擋下缺欄位、缺語系、缺 icon 版本、掛載到不存在 workspace 的 App 註冊。
- 把 manifest／resolver／registry 這類開發者術語留在 Skill 與 spec，不外流到一般使用者文件。

**Non-Goals:**

- 不重新設計 `WorkspaceContext` 或選單渲染邏輯。
- 不實作任何一個實際 App 的業務功能。
- 不開放管理員稱呼樣板本身可自訂。
- 不新增 Storybook 或第三方 App marketplace 服務。

## Decisions

### App registration is a typed manifest entry, validated at CI time, not a manual checklist

新增 App 必須提交一份 `AppRegistrationManifest`（見 Interface 段），CI 對照必要欄位跑驗證；未通過驗證的 App 不得合併進 App registry。這與 `role-based-workspace-navigation` 的「型別與測試才是最終真相」原則一致——`startkiter-dev` Skill 只負責引導開發者填對欄位，不是唯一把關手段。

**Alternatives Considered:**

- 只在 Skill 文件裡寫一份文字檢查清單，靠開發者或 AI 自律遵守：否決，`role-based-workspace-navigation` design.md 已證明 Skill 可能未被載入，無法當安全邊界。
- 每個 App 各自決定要不要遵守 registry 格式：否決，會讓平台無法統一組合選單，重現「每加一個 App 就要改一次 resolver」的問題。

### `displayName` is set by the App's own admin, with reserved-word validation

`displayName` 預設由該 App 首次安裝時的建立者（通常是總管理員）設定，之後開放給該 App 的 `app-admin` 修改（一個 App 底下可能有多個管理員，任一管理員改名即時生效，不做版本歷史）。驗證規則：長度 1～20 字、不得為空白、不得等於保留字「總管理員」「使用者」，避免與固定稱呼混淆。

**Alternatives Considered:**

- `displayName` 在 App 安裝後永久鎖死不可改：否決，違反 Fish 明確要求「App 名稱可以由使用者自行命名」。
- 允許任何角色（包含一般使用者）修改 `displayName`：否決，會讓 App 名稱被非管理員竄改，且與「App 管理員才看到管理員設定」的角色邊界矛盾。

### The startkiter-dev Skill is the single App-authoring entrypoint; enforcement stays in code

`.agents/skills/startkiter-dev/SKILL.md` 新增「新增 App」段落，作為 `role-based-workspace-navigation` 已建立的「新增 UI module」preflight 的上層流程：先確認是不是新增 App（而非既有 App 內的 module），再依本 change 的 registration manifest 走欄位、語系、icon、測試檢查。Skill 只描述流程，不複製 registry 的欄位定義或驗證規則。

**Alternatives Considered:**

- 為「新增 App」另開一個獨立 Skill：否決，會讓學生面對兩個開發入口，與 `role-based-workspace-navigation` 已定案的「沿用並延伸 startkiter-dev」原則衝突。

### Developer-only vocabulary never leaks into learner-facing docs or UI copy

`manifest`、`resolver`、`registry`、`workspace context` 這類詞彙只能出現在 `.agents/skills/`、`openspec/`、程式碼與程式碼註解；使用者可見 UI 文案、`docs/tutorials/`、行銷或說明文件不得出現這些詞。CI 的 forbidden-noun 掃描（`role-based-workspace-navigation` 已建立）擴充掃描範圍納入這批開發者詞彙在 `apps/saas` 使用者可見文案中的出現。

**Alternatives Considered:**

- 不特別區分，開發文件與使用者文件共用同一批詞彙：否決，Fish 明確要求 AI 專用術語不進學生或一般使用者文件；混用會讓非技術買家看不懂介面。

## Implementation Contract

### Observable behavior

- 新增一個通過 CI 驗證的 App 後，該 App 的 app-admin／app-user 選單自動出現在對應 workspace，不需要另外修改 `NavBar` 或 resolver 程式碼。
- `displayName` 被該 App 的 app-admin 修改後，「{displayName}管理員」稱呼與選單標題即時反映新名稱，不需要重新部署。
- 缺少必要欄位、語系 key 或 icon 版本的 App 註冊在 CI 階段被擋下，不會進入 App registry。
- `startkiter-dev` Skill 的「新增 App」段落可被找到並包含本 change 定義的欄位清單連結。

### Interface and data shape

```ts
type AppRegistrationManifest = {
  appId: string; // kebab-case，全站唯一
  displayName: string; // 1-20 字，非保留字，可由 app-admin 修改
  route: { basePath: string };
  menu: {
    labelKey: string;
    icon: { light: string; dark: string };
  };
  eligibility: {
    userRole: "app-user" | "app-admin";
    grantedBy: "self-serve" | "invite-only" | "operator-assigned";
  };
  i18nNamespace: string;
  supportedLocales: Array<"zh-tw" | "zh-cn" | "en">;
  tests: {
    unit: string[]; // 對應測試檔路徑
    browser: string[]; // ego-browser 驗收腳本路徑
  };
};
```

`registerApp(manifest: AppRegistrationManifest)` 必須在 CI 階段執行；驗證失敗時回傳缺失欄位清單，不得部分註冊。

### Developer guidance contract

`.agents/skills/startkiter-dev/SKILL.md` 的「新增 App」段落必須包含：

1. 先查 `packages/` 是否已有可重用 App（避免重複造一個功能相近的 App）。
2. 依 `AppRegistrationManifest` 填齊必要欄位，`icon` 必須同時提供 `light` 與 `dark` 版本。
3. `supportedLocales` 至少涵蓋 `zh-tw`、`zh-cn`、`en` 三份語系 key。
4. 補齊 `tests.unit` 與 `tests.browser`，並在合併前跑過。
5. 不得在使用者可見文案或說明文件中使用 `manifest`、`resolver`、`registry`、`workspace context` 等開發者詞彙。

### Failure behavior

- `appId` 重複、`displayName` 為保留字或超出長度限制、`route.basePath` 與既有 App 衝突：CI 驗證失敗並列出欄位。
- `icon.light` 或 `icon.dark` 缺一：CI 驗證失敗。
- `supportedLocales` 未涵蓋三種既定語言：CI 驗證失敗並列出缺少的語言。
- 開發者詞彙出現在使用者可見文案：forbidden-noun 掃描失敗（延伸 `role-based-workspace-navigation` 已建立的掃描機制）。

### Acceptance criteria

- `AppRegistrationManifest` 驗證測試通過，涵蓋必要欄位缺失、`displayName` 保留字衝突、`appId`／`route.basePath` 重複、icon 缺版本、語系缺項。
- `displayName` 修改後，重新解析 navigation model 能立即反映新名稱（單元測試以 fixture 驗證，不需真的部署）。
- `.agents/skills/startkiter-dev/SKILL.md` 的「新增 App」段落存在，且結構驗證通過。
- forbidden-noun 掃描涵蓋 `manifest`／`resolver`／`registry`／`workspace context` 在使用者可見文案中的出現。
- 示範：以一個假設的 `design` App 走過整套 registration manifest，確認 CI 檢查能正確通過或擋下（不需要真的實作 design App 的功能畫面）。

### Scope boundaries

In scope: App registration manifest 型別與驗證、`displayName` 設定與修改規則、`startkiter-dev` Skill 的「新增 App」段落、CI 檢查、開發者詞彙隔離規則。

Out of scope: `WorkspaceContext`／`resolveNavigation` 邏輯本身、帳號選單與主題語言 UI、任何一個實際 App 的功能實作、跨 App 全量上線驗收。

## Risks / Trade-offs

- [Risk] `displayName` 即時可改，可能與快取的選單標籤不同步 → Mitigation：navigation model 每次 resolve 都重新讀 App registry，不快取 `displayName` 本身；只快取不含名稱的結構資料。
- [Risk] CI 驗證規則日後需要擴充（例如新增必要欄位）可能是破壞性變更 → Mitigation：`AppRegistrationManifest` 新增欄位一律先設為可選，下一個 major change 才轉必要。
- [Risk] 開發者詞彙掃描可能誤傷程式碼註解中合理使用的詞彙 → Mitigation：掃描範圍限定使用者可見文案與 `docs/tutorials/`，不掃描程式碼註解與 `.agents/skills/`。

## Migration Plan

1. 新增 `AppRegistrationManifest` 型別與驗證函式，先只驗證 course（既有唯一 App）能通過，確認驗證邏輯本身正確。
2. 更新 `.agents/skills/startkiter-dev/SKILL.md` 加入「新增 App」段落，並更新 `AGENTS.md` 的指向連結。
3. 接上 CI check，讓任何新增或修改 App registry 的 PR 都跑驗證。
4. 以假設的 `design` App fixture 驗證整套流程可用，不建立真實功能。
5. 部署後確認既有 course App 的選單與稱呼未受影響（回歸驗證）。

## Open Questions

- 目前沒有未解問題。若之後要開放「App 管理員稱呼樣板」可自訂，需回頭修改 `role-based-workspace-navigation` 的樣板決策，不在本 change 範圍內處理。
