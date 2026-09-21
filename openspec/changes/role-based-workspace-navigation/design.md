## Context

StartKiter 是「平台＋多個獨立 App」，不是單一固定功能的 SaaS。買家拿到的是一個殼（platform shell）＋可掛載的 App（課程、設計、社群……），每個 App 各自獨立管理內容、資料、選單、使用資格、文字、圖示與測試。課程是第一個接入的 App，不是型別層級的特例。

目前程式已經有 `packages/platform/src/mount-points.ts` 與 `apps/saas/modules/shared/lib/nav-menu-items.ts` 作為部分選單來源，但既有 `WorkspaceId = "learner" | "course-admin" | "super-admin"` 把角色寫死成課程專屬三選一：`course-admin` 這個字面值把「App 管理員」跟「課程」焊死在一起，之後加入設計、社群等 App 時，型別本身就無法表達「設計管理員」「社群管理員」。實際線上結果也已證明目前作法會出錯：`/course` 顯示管理員選單、`/admin/course` 同時顯示側欄與水平管理選單。

本 change 的核心是把 `WorkspaceId` 換成「平台／App／角色」的通用結構，讓 course、design、community 等任何 App 都用同一套 resolver 與 manifest 契約決定看得到什麼，不用再為每個新 App 改一次工作區判斷。

## Design Source

- Source: `docs/ux/startkiter-sr-architecture-focus.html`，2026-09-21 對焦稿，覆蓋平台／App／角色骨架、帳號區設定入口邊界、圖示規則、SR 順序與完成標準。
- 舊稿 `docs/ux/startkiter-navigation-focus.html` 的視覺 token（背景 `#111516`、面板 `#182022`、強調色 `#9ed36a` 等）仍作為主題 token 的對焦依據，實際色彩契約於 `account-settings-theme-language` change 落地。
- 定位：HTML 對焦稿是產品討論依據，不是正式系統的第二套程式碼；本 change 只把其中的「角色與 App 邊界」規則收斂進型別、resolver 與測試。

## Goals / Non-Goals

**Goals:**

- 把工作區從固定三值 enum 換成「平台／App／角色」的通用結構，course 只是第一筆 App 資料。
- 由同一份 App manifest 產生一級與子級選單，不因為新增 App 而修改 resolver 邏輯。
- 讓使用者、App 管理員、總管理員在同一時間只看到一個有效工作區，且同一人可以在不同 App 有不同角色。
- 固定使用者可見稱呼：總管理員（平台層固定字串）、{App 名稱}管理員（App 層，資料驅動）、使用者（App 一般使用者，固定字串，不含 App 名稱）；禁止「平台管理員」「模組管理員」「學員」出現在使用者可見文字。
- 修正課程使用者看到管理介面、`/admin/course` 出現第二套水平選單的既有 bug。
- 讓 demo、實際 app 與部署後 ego 驗收使用同一組可觀察規則。

**Non-Goals:**

- 不在本 change 內定義「App 如何加入平台」「App 名稱由誰、如何設定」的完整規則（`app-extension-contract` 負責）。
- 不建立帳號選單內設定頁的實際內容、主題與語言切換 UI（`account-settings-theme-language` 負責）。
- 不重做課程內容、付款、Email、GitHub kit 或客服業務邏輯。
- 不新增第三方 UI framework 或 Storybook dependency。
- 不以靜態 HTML screenshot 作為唯一完成證據。

## Decisions

### Workspace is App-scoped, not a fixed enum

`WorkspaceContext` 改為聯集型別：`{ scope: "platform" }`（總管理員的平台層視角，管理所有 App）或 `{ scope: "app"; appId: string; role: "app-admin" | "app-user" }`（進入某個 App 時的視角）。course、design、community 都是 `appId` 的資料值，不是型別分支；新增一個 App 不需要修改 `WorkspaceContext` 的型別定義。App registry 提供每個 `appId` 對應的 `displayName`（例如「課程」「設計」），使用者可自訂（設定機制在 `app-extension-contract`），本 change 只定義「App 管理員可見稱呼＝`${app.displayName}管理員`」的引用規則。

**Alternatives Considered:**

- 繼續用 `learner | course-admin | super-admin` 固定 enum，之後每加一個 App 就加一個新值（如 `design-admin`）：否決，型別會隨 App 數量無限膨脹，且無法表達「一個人同時是課程管理員、設計使用者」這種跨 App 角色差異。
- 用單一字串 `role: string` 不做 App 區分，靠命名慣例（如 `"course:admin"`）辨識：否決，字串慣例無法被 TypeScript 靜態檢查，等同放棄型別邊界。

### Same person can hold different roles in different Apps

角色判斷改成「以 `appId` 為單位」而非全站唯一角色：capability 查詢輸入 `(userId, appId)`，輸出該 App 下的 `"app-admin" | "app-user"`；是否為總管理員（`scope: "platform"` 的存取權）是獨立的全站 capability，不綁定任何 `appId`。總管理員進入任一 App 時，一律以該 App 的 `app-admin` 角色顯示（沿用「總管理員可以管理所有 App」），但這是 resolver 產生的推導結果，不是額外儲存的第三種角色值。

**Alternatives Considered:**

- 全站只存一個角色欄位，App 管理權另外用白名單表判斷：否決，會讓「目前角色」與「目前 App 權限」變成兩套互相對不上的真相來源，重現既有 bug 的成因。

### The shell renders exactly one workspace surface at a time

`resolveNavigation({ pathname, capabilities, apps, locale })` 輸出單一 `WorkspaceContext` 與對應 `NavigationModel`；shell 依這個結果渲染，不把多個 App 或多種角色的選單合併後用 CSS 隱藏。`/course` 這類路由必須先解出 `{ scope: "app", appId: "course", role }`，`role` 為 `app-user` 時 `NavigationModel` 不得包含任何管理選單項目；`/admin/course` 與 `/course` 共用同一個 resolver 輸出，不得各自再渲染一份選單。

**Alternatives Considered:**

- 維持一個全站選單，只依 `requiresOperator` 過濾：否決，無法表達 App 邊界，也是 `/admin/course` 出現第二套水平選單的直接成因。
- 每個 route 各自決定顯示哪套 shell：否決，會讓新 App 重複實作 workspace 判斷並造成漂移。

### Visible labels are data-driven, never hardcoded role nouns

「總管理員」「使用者」是固定 translation key（不含 App 名稱插值）；「{App 名稱}管理員」是唯一使用 App `displayName` 插值的稱呼，插值結果本身仍需通過語系 catalog（例如 `workspace.appAdmin.label` = `"{appName}管理員"`）。禁止在程式碼、UI 文案或 demo 中出現「平台管理員」「模組管理員」「學員」等字面字串；這條規則以 static check 而非人工審查把關。

**Alternatives Considered:**

- 讓每個 App 自訂管理員稱呼樣板（如「XX 教練」「XX 版主」）：否決，超出本次範圍且會讓角色語意在不同 App 間失去一致性；先固定「{App 名稱}管理員」樣板，未來若要開放自訂樣板另開 change。

### The demo is an app preview over the same navigation model, not a second implementation

`docs/ux/startkiter-sr-architecture-focus.html` 保留作為視覺參考，但正式 demo 應改由實際 app 的 App registry、workspace resolver、共用 UI 元件或同一份 serialized navigation fixture 產生。demo 只能展示已存在的 runtime contract，不得自行發明角色、App、選單或稱呼樣板。

**Alternatives Considered:**

- 繼續維護獨立 HTML，靠人工比對：否決，正是目前「demo 看起來對、實際 app 跑掉」的來源。
- 只依賴 screenshot snapshot：否決，看不到權限、App 邊界與稱呼是否資料驅動。

## Implementation Contract

### Observable behavior

- 使用者上下文（`scope: "app"`, `role: "app-user"`）只顯示該 App 的學習／使用功能與固定「使用者」稱呼；不顯示任何管理選單，不論這個人在其他 App 是否為管理員。
- App 管理員上下文（`scope: "app"`, `role: "app-admin"`）只顯示該 App 的管理一級與子級入口，稱呼固定為「{該 App 的 displayName}管理員」；不再同時顯示總管理員或其他 App 的入口。
- 總管理員上下文（`scope: "platform"`）只顯示全站帳號、交易、營收、金流、組織與系統入口，稱呼固定「總管理員」；每個 App 是切換到該 App `app-admin` workspace 的單一入口，不是第二份重複子選單。
- 同一個可見 route 不得同時由 sidebar 與第二個平行 admin menu 重複呈現。
- 課程 App 的一般使用者在 `/course` 下看不到任何管理選單；`/admin/course` 與 `/course` 共用同一 resolver 輸出。
- 使用者可見文字（含 demo）不得出現「平台管理員」「模組管理員」「學員」。

### Interface and data shape

```ts
type AppId = string;

type PlatformRole = "app-user" | "app-admin";

type WorkspaceContext =
  | { scope: "platform" }
  | { scope: "app"; appId: AppId; role: PlatformRole };

type AppManifestEntry = {
  appId: AppId;
  displayNameKey: string; // 解析出 App 的 displayName，供 "${displayName}管理員" 插值
  route: { path: string };
  menu?: {
    labelKey: string;
    icon: string;
    order: number;
    parentId?: string;
  };
  requiredRole: "app-user" | "app-admin";
  i18nNamespace: string;
  children?: AppManifestEntry[];
};

type NavigationModel = {
  workspace: WorkspaceContext;
  workspaceLabel: string; // 已解析：總管理員 / {App}管理員 / 使用者
  items: Array<{
    id: string;
    href: string;
    labelKey: string;
    icon: string;
    children: Array<{ id: string; href: string; labelKey: string }>;
  }>;
};
```

`resolveNavigation({ pathname, capabilities, apps, locale })` 必須輸出一個 `NavigationModel`。同一 `id`、同一 `href` 或同一 workspace parent 不得重複；不符合 `requiredRole` 的 module 不得進入輸出；`workspace.scope === "app"` 時 `appId` 必須存在於已註冊的 App registry，否則 resolver 回傳空 `items` 並記錄未知 App id。

### Failure behavior

- 未知 `appId`、無效 `parentId`、重複 module id 或重複 route：純函式測試失敗，CI 不得通過。
- 非總管理員直接請求 `scope: "platform"` route，或非該 App 管理員直接請求該 App 的管理 route：沿用現有 route guard，導向安全的 authenticated entry，不因 UI 隱藏而放寬後端權限。
- `displayNameKey` 缺少對應語系值：runtime 使用既定 zh-tw fallback，但 CI 必須列出缺少的 key 並失敗；不得把 raw key 顯示給使用者。
- module manifest 缺少必要欄位：TypeScript build 失敗；不得以 `as any` 繞過 contract。

### Acceptance criteria

- `resolveNavigation` 的單元測試通過，涵蓋「使用者」「App 管理員」「總管理員」三種角色、跨 App 角色差異（同一人在 A App 是管理員、在 B App 是使用者）、子選單去重與 active route。
- `NavBar` 與 admin layout component tests 證明 `/course`、`/admin/course` 不會同時渲染兩套管理選單。
- static check 掃描 UI 文案與 demo，確認不出現「平台管理員」「模組管理員」「學員」字面字串。
- demo 頁面與 runtime navigation model 的 `workspace`、`href`、`labelKey`、`children` 結構比對通過；demo 不再自行維護另一份選單或稱呼文案。
- ego-browser 桌面 `1440px` 與手機 `390px` 各驗一次角色切換骨架（使用者／App 管理員／總管理員），確認沒有重複選單、越權入口或 raw key；完整跨 App／語言／主題的全量驗收留給 `platform-launch-verification-evidence`。

### Scope boundaries

In scope: `WorkspaceContext`／App manifest 型別、workspace resolver、NavBar／admin layout 組合、可見稱呼規則（總管理員／{App}管理員／使用者）、demo 對齊、unit／component／基礎 browser tests。

Out of scope: App 如何加入平台與命名規則（`app-extension-contract`）、帳號選單內容與主題／語言（`account-settings-theme-language`）、各 App 實際功能畫面（`app-feature-surfaces`）、跨 App 全量上線驗收（`platform-launch-verification-evidence`）、課程內容資料模型、付款與退款、Email dispatch、GitHub kit 履約、客服通道。

## Risks / Trade-offs

- [Risk] 既有 `WorkspaceId` 三值 enum 是 **BREAKING** 變更，任何已引用舊型別的程式碼需要同步改寫 → Mitigation：本 change 尚未實作（0/25 tasks），改型別不影響已上線功能；遷移時先保留 course 對應的 adapter，讓既有路由在切換期間仍可執行。
- [Risk] 「{App 名稱}管理員」樣板寫死，未來若要支援自訂樣板需要再改型別 → Mitigation：先用單一樣板滿足目前已知的課程／設計／社群需求，型別上保留 `displayNameKey` 是獨立欄位，未來擴充樣板不需再動 `WorkspaceContext` 本身。
- [Risk] Static check 掃描「平台管理員」「模組管理員」「學員」字面字串可能誤傷合法內容（例如引用歷史文件時的說明性文字）→ Mitigation：掃描範圍限定在使用者可見的 UI 文案與 demo 檔案，不掃描 `docs/discuss/`、`openspec/changes/archive/` 等歷史紀錄。
- [Risk] demo 與 runtime 共用 model 仍可能被 CSS 差異影響 → Mitigation：demo 使用實際 shared components 或同一 token stylesheet，並以 desktop/mobile ego screenshot 做部署後驗收。

## Migration Plan

1. 新增 `WorkspaceContext`、`AppManifestEntry`、`NavigationModel` 型別與 `resolveNavigation`，先保留既有 `MOUNT_POINTS` 輸出作為 adapter，讓 build 與既有功能維持可執行。
2. 把課程相關 module 逐批映射為 `appId: "course"` 的 App manifest entry，把全站 operator module 映射到 `scope: "platform"`，每批補齊語系 key 與 tests。
3. 讓 `NavBar` 使用新的 `NavigationModel`，讓 admin layout 停止渲染第二套平行 menu；保留 route guard 不變。
4. 掃描並移除使用者可見文案與 demo 中的「平台管理員」「模組管理員」「學員」字面字串，改用固定稱呼 key。
5. 將 demo 改成讀取同一 navigation model 或實際 shared component，完成後移除 demo 內重複的選單或稱呼文案。
6. 在 TEST／preview 部署後用 ego-browser 驗收骨架行為，再推進正式部署。若驗收失敗，回滾到 adapter 仍存在且舊 route 可用的前一個 commit；不得只回滾 CSS 而保留不完整的 resolver。

## Open Questions

- 目前沒有未解問題。若 `app-extension-contract` 決定 `displayName` 的儲存與編輯機制與本次假設（App registry 提供可解析的 `displayNameKey`）不符，須回頭 `spectra ingest` 本 change 的型別定義。
