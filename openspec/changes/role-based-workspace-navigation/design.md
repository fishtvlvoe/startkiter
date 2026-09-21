## Context

StartKiter 不是一次交付後就封閉的網站，而是要交給學生使用、延伸與加裝功能的程式碼包。這代表每個功能需要像 SDK module 一樣自帶可被平台辨識的路由、選單、權限、翻譯與 UI 邊界；平台外殼只負責組合與套用共用規則。

目前程式已經有 `packages/platform/src/mount-points.ts` 與 `apps/saas/modules/shared/lib/nav-menu-items.ts` 作為部分選單來源，但 `NavBar`、課程管理 admin layout 與平台選單資料仍各自補充 UI。實際線上結果已證明這會造成 `/course` 顯示管理員選單、`/admin/course` 同時顯示側欄與水平管理選單，以及 English 主內容與繁中側欄並存。既有 `NavBar.tsx` 也包含寫死的深色文字 class，主題 class 切換不等於整個 UI 使用一致的語意色彩。

本 change 的核心不是再做一份靜態頁，而是建立可供學生擴充的 UI module contract，讓 AI、平台殼與 demo 都依同一份可測試資料與元件行為工作。

## Design Source

- Source: `docs/ux/startkiter-navigation-focus.html`，2026-09-21 取得並以 ego-browser 實測角色切換、桌面與手機版。
- Cache: `.spectra/design-cache/role-based-workspace-navigation/startkiter-navigation-focus.html`。
- 定位：此 HTML 是視覺對焦來源，不是最終 runtime truth；實際 app 的共用元件與驗收結果才是交付真相。

| 視覺項目 | 對焦值 |
| --- | --- |
| 畫布背景 | `#111516` |
| 主要面板 | `#182022` |
| 凸起面板 | `#202a2d` |
| 邊線 | `#344144` |
| 主要文字 | `#f4f7f7` |
| 次要文字 | `#9aa8aa` |
| 強調色 | `#9ed36a` |
| 強調色文字 | `#13200e` |
| 面板圓角 | `14px` |
| 頂部列最小高度 | `72px` |
| 桌面側欄寬度 | `280px` |
| 手機 breakpoint | `700px` |
| 主要 icon 語意 | 開始、課程、客服、AI、帳號、設定、媒體、測驗、作業、組織 |

## Goals / Non-Goals

**Goals:**

- 建立學生可擴充的獨立 UI module contract。
- 由同一份 module metadata 產生角色工作區的一級與子級選單。
- 讓學員、課程管理員、總管理員在同一時間只看到一個有效工作區。
- 讓翻譯 key、語意色彩 token、responsive 行為與權限邊界成為可測試契約。
- 讓 demo、實際 app 與部署後 ego 驗收使用同一組可觀察規則。

**Non-Goals:**

- 不在本 change 內重做課程內容、付款、Email、GitHub kit 或客服業務邏輯。
- 不新增第三方 UI framework 或 Storybook dependency。
- 不把學生可擴充 module 變成可任意注入未驗證 HTML 或 CSS 的 runtime。
- 不以靜態 HTML screenshot 作為唯一完成證據。

## Decisions

### Module manifest owns UI relationships and the shell only composes them

每個可掛載功能提供一份受型別約束的 module manifest。manifest 至少描述 `id`、`route`、`workspace`、`menu`、`permission`、`i18nNamespace` 與可選的 `children`；頁面元件仍由 module 自己擁有。平台 shell 只讀 manifest，依目前使用者上下文產生 navigation model，不把每個 module 的選單重新硬編碼在 `NavBar`。

**Alternatives Considered:**

- 在 `NavBar.tsx` 內維護所有功能名稱與路由：否決，新增學生 module 時會再次形成中央硬編碼清單。
- 讓每個 module 自己直接操作 DOM 或注入任意 sidebar HTML：否決，會失去權限、翻譯、主題與可測試性邊界。

### Extend the existing startkiter-dev Skill, but keep enforcement in code

學生拿到程式碼包時，repo 內既有的 `.agents/skills/startkiter-dev/SKILL.md` 是開發入口。這個 Skill 要求 AI 或工程師在新增 UI module 前，先讀取本 change 的 canonical spec，檢查是否能重用既有 module，並完成 `workspace`、一級／子級 menu、permission、`i18nNamespace`、semantic token 與測試的 preflight。Skill 只描述如何遵守 contract，不複製一份選單清單或顏色常數。

安裝後能否自動載入 Skill 取決於學生使用的 AI 工具；因此不能把「AI 有讀到 Skill」當成安全邊界。runtime 使用 typed manifest，純函式／component tests 與 CI check 阻止重複 route、越權 menu、缺翻譯 key、缺 token 的 module 通過。`AGENTS.md`、Skill 與 spec 互相指向，但 spec、型別與測試才是最終真相。

**Alternatives Considered:**

- 只新增一個 Skill，要求 AI 自律維持 UI：否決，Skill 可能未被載入，也無法阻止手動提交或其他 AI 寫出違規 module。
- 為 UI 另外建立第二個 Skill：否決，學生會遇到兩個入口與規則漂移；沿用並延伸 `startkiter-dev` 才能維持單一開發入口。

### Workspace resolver selects exactly one navigation context

建立純函式 workspace resolver，輸入 session capability、目前 route 與 module registry，輸出單一 `learner`、`course-admin` 或 `super-admin` workspace。resolver 先決定上下文，再產生一級與子級選單；它不把三套選單合併後再用 CSS 隱藏。

推薦的既有權限對應是：一般登入者進入 `learner`；有課程講師指派權限者進入 `course-admin`；`isOperator` 使用者可以進入 `super-admin`，並可切換到課程管理工作區。這保留現有 `CourseInstructor` 與 operator 權限模型，不另造第四種角色。

**Alternatives Considered:**

- 維持一個全站選單，只依 `requiresOperator` 過濾：否決，無法表達學員教學與管理工作區的邊界，也會保留重複入口。
- 每個 route 各自決定顯示哪套 shell：否決，會讓新 module 重複實作 workspace 判斷並造成漂移。

### Translation keys and semantic tokens are module contracts

manifest 使用 `labelKey` 與 namespace，不直接把中文或英文顯示字串放在平台選單。所有可見文字必須由目前 locale 的 translation catalog 解析；缺少 key 時在測試失敗，runtime 不顯示 raw key。UI 元件使用 `background`、`foreground`、`muted-foreground`、`border`、`accent` 等語意 token，不在 shared navigation 內新增深色專用 hex text class。

**Alternatives Considered:**

- 由 module manifest 直接提供三種語言字串：否決，翻譯資料會和功能 metadata 混在一起，catalog 檢查難以集中。
- 保留既有 hardcoded dark sidebar colors，只補 light mode 覆蓋：否決，會讓不同工作區在主題切換時出現不同對比規則。

### The demo is an app preview over the same navigation model, not a second implementation

保留目前 HTML 作為視覺參考，但正式 demo 應改由實際 app 的 module registry、workspace resolver、共用 UI 元件或同一份 serialized navigation fixture 產生。demo 只能展示已存在的 runtime contract，不得自行發明角色、選單、顏色或翻譯。

**Alternatives Considered:**

- 繼續維護獨立 HTML，靠人工比對：否決，正是目前「demo 看起來對、實際 app 跑掉」的來源。
- 只依賴 screenshot snapshot：否決，snapshot 看不到權限、翻譯 key、route guard 與互動流程。

### Verification is layered from pure rules to deployed browser behavior

先用純函式測試驗證 manifest、workspace resolver、選單去重、locale key completeness 與 token 使用；再用 component test 驗證 desktop/mobile render；最後用 ego-browser 在部署後點選每個可見入口，確認角色、語系、主題與 viewport 行為。任何一層失敗都不能把 UI change 標成完成。

**Alternatives Considered:**

- 只跑 build：否決，build 不會發現語系混用與錯誤角色選單。
- 只用人工 ego 測試：否決，無法阻止下一個 module 重新加入 hardcoded menu 或漏 translation key。

## Implementation Contract

### Observable behavior

- 學員上下文只顯示學習、客服、AI 與個人帳號入口；不顯示 operator menu。
- 課程管理員上下文只顯示課程管理一級與子級入口；不再同時顯示總管理員水平選單。
- 總管理員上下文只顯示全站帳號、交易、營收、金流、組織與系統入口；「課程」是切換到 `course-admin` 的單一入口。
- 同一個可見 route 不得同時由 sidebar 與第二個平行 admin menu 重複呈現。
- zh-tw、zh-cn、en 的可見 menu label、workspace heading、theme control label 必須同時切換，不得出現主內容和側欄不同語系。
- dark、light、system 模式必須使用同一組 semantic tokens；桌面與手機版不得出現文字不可讀、內容被固定選單遮住或水平溢出。

### Interface and data shape

```ts
type WorkspaceId = "learner" | "course-admin" | "super-admin";

type UiModuleManifest = {
  id: string;
  route: { path: string };
  workspace: WorkspaceId;
  menu?: {
    labelKey: string;
    icon: string;
    order: number;
    parentId?: string;
  };
  permission: "signed-in" | "course-instructor" | "operator";
  i18nNamespace: string;
};

type NavigationModel = {
  workspace: WorkspaceId;
  items: Array<{
    id: string;
    href: string;
    labelKey: string;
    icon: string;
    children: Array<{ id: string; href: string; labelKey: string }>;
  }>;
};
```

`resolveNavigation({ pathname, capabilities, modules, locale })` 必須輸出一個 `NavigationModel`。同一 `id`、同一 `href` 或同一 workspace parent 不得重複；不符合 permission 的 module 不得進入輸出。

### Developer guidance contract

`.agents/skills/startkiter-dev/SKILL.md` 必須包含以下開發前檢查，並指向本 spec 而不是複製規則：

1. 先找現有 `packages/<name>` 與 module manifest，能重用就不另造一套。
2. 新 module 只能透過 typed manifest 宣告 route、workspace、menu parent、permission、translation namespace 與 semantic token 使用。
3. 新增或修改 menu 後，先跑 manifest／resolver／locale／component checks，再進行 ego-browser 的桌面與手機驗收。
4. 不得在 `NavBar`、頁面或 demo 內硬編碼第二份 menu、角色判斷、raw translation key 或深色 hex 文字色。

這個 Skill 的安裝交付是 repo-local developer guidance，不宣稱能自動修改學生電腦上的全域 AI 設定；不支援 repo-local Skill 的工具，仍由 `AGENTS.md`、型別、測試與 CI contract 接住。

### Failure behavior

- 未知 `workspace`、無效 parent、重複 module id、重複 route 或缺少 menu translation key：純函式測試失敗，CI 不得通過。
- 非 operator 直接請求總管理員 route：沿用現有 route guard，導向安全的 authenticated entry，不因 UI 隱藏而放寬後端權限。
- locale catalog 缺少 module label：runtime 使用既定 zh-tw fallback，但 CI 必須列出缺少的 key 並失敗；不得把 `module.course.label` 這類 raw key 顯示給使用者。
- module manifest 缺少必要欄位：TypeScript build 失敗；不得以 `as any` 繞過 contract。

### Acceptance criteria

- manifest 與 resolver 的單元測試通過，涵蓋三個 workspace、權限過濾、子選單去重、active route 與三種 locale key completeness。
- `.agents/skills/startkiter-dev/SKILL.md` 的 UI module preflight 已更新，且 Skill 結構驗證通過；它指向 canonical spec，不維護另一份 menu literal。
- `NavBar` 與 admin layout component tests 證明 `/course`、`/admin/course` 不會同時渲染兩套管理選單。
- ego-browser 在部署後測試桌面 `1440px` 與手機 `390px`，逐一切換三種 workspace、三種 locale、三種 color mode，並點擊每個可見 menu entry；結果沒有 raw key、401/500、水平溢出或角色越界。
- demo 頁面與 runtime navigation model 的角色、href、label key、children 結構比對通過；demo 不再自行維護另一份 menu literal。

### Scope boundaries

In scope: module manifest contract、workspace resolver、NavBar/admin layout 組合、menu translation keys、semantic theme tokens、responsive shell、demo 對齊、startkiter-dev Skill 更新、unit/component/browser tests。

Out of scope: 課程內容資料模型、付款與退款、Email dispatch、GitHub kit 履約、客服通道、學生自訂 CSS 注入與新角色資料庫 schema。

## Risks / Trade-offs

- [Risk] module manifest 變成新的中央規格，學生加功能需要理解 contract → Mitigation：提供最小 TypeScript type、範例 module、失敗測試訊息與 docs。
- [Risk] 將現有 admin layout 併入 workspace shell 會影響既有 operator route → Mitigation：先保留既有 route guard，先讓 resolver 產生平行 navigation model，再逐批切換 module，最後移除重複 SettingsMenu。
- [Risk] 三種 locale 的 module key 維護成本上升 → Mitigation：CI 以 registry 的 label key 反查三份 catalog，新增 module 沒補齊翻譯時直接失敗。
- [Risk] demo 與 runtime 共用 model 仍可能被 CSS 差異影響 → Mitigation：demo 使用實際 shared components 或同一 token stylesheet，並以 desktop/mobile ego screenshot 做部署後驗收。
- [Risk] 學生使用的 AI 工具沒有自動載入 repo-local Skill → Mitigation：在 `AGENTS.md` 指向 Skill 與 canonical spec，並用型別、測試與 CI check 做硬性阻擋，不依賴 AI 記憶。

## Migration Plan

1. 先更新既有 `startkiter-dev` Skill 與 `AGENTS.md` 對應說明，讓新 module 開發入口先指向 canonical spec；不建立第二個 UI Skill。
2. 新增 typed module metadata 與 workspace resolver，先保留既有 `MOUNT_POINTS` 輸出作為 adapter，讓 build 與既有功能維持可執行。
3. 將課程相關 module 逐批映射到 `course-admin`，將全站 operator module 映射到 `super-admin`，每批補齊三種 locale key 與 tests。
4. 讓 `NavBar` 使用新的 `NavigationModel`，讓 admin layout 停止渲染第二套平行 menu；保留 route guard 不變。
5. 將 demo 改成讀取同一 navigation model 或實際 shared component，完成後移除 demo 內重複的 menu literal。
6. 在 TEST／preview 部署後用 ego-browser 驗收，再推進正式部署。若驗收失敗，回滾到 adapter 仍存在且舊 route 可用的前一個 commit；不得只回滾 CSS 而保留不完整的 resolver。

## Open Questions

- `course-admin` 的預設範圍是否採推薦方案：operator 與有 `CourseInstructor` 指派的使用者都能進入課程工作區，但只有 operator 能進入 `super-admin`。這不新增資料庫角色，沿用現有 permission model。
- 學生使用的 AI 工具是否都支援 repo-local `.agents/skills` 自動發現？未支援時，交付文件需把 `AGENTS.md`、canonical spec 與 CI check 列為等效入口；不影響 runtime contract 的設計。
