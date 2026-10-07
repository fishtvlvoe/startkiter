## Context

- 子選單機制已存在：`packages/platform/src/workspace/navigation.ts` 的 `toNavigationItem` 只把 `menu.parentId` 等於自己 id 的項目收成 children；`NavBar.tsx` 的 `SidebarGroupedNavItem` 會畫出 `subItems`，但只在項目本身是目前頁面時才展開。
- `packages/platform/src/workspace/registry.ts` 的 `toAppManifestEntries` 只在 `scope === "app"` 時把 `menu.groupId` 轉成 `parentId`：課程子頁（`groupId: "course-admin"`）在 App 工作區已是 `course-admin` 的子項；平台設定頁（`groupId: "admin-settings"`）是 platform scope，不轉換，而且沒有 id 為 `admin-settings` 的上層項目，所以一直平鋪。`course-dashboard` 也標了 `groupId: "course-admin"`，目前是課程的子項。
- 平台工作區（`workspace.scope === "platform"`）解析 App 根項目時呼叫 `toNavigationItem(entry, [])`，刻意不帶 children，所以課程子頁在平台後台看不到。
- `NavBar.tsx` 的 `SidebarGroupedNav` 先畫使用者自建分組（資料庫 `SidebarGroup`），沒被分組的項目再分成「未分組」（非管理項目）與「管理」（`requiresOperator`）兩區。
- 手機版走 `apps/saas/modules/shared/lib/nav-menu-items.ts` 的 `getTabBarItems`：前 3 個頂層項目固定，其餘放「更多」，只列頂層項目的 label/href。
- `validateNavigationRegistry` 要求 parent 與 child 的 `appId`、`scope` 相同，否則 `INVALID_PARENT_SCOPE`。
- 2026-10-07 以 ego-browser 量測正式站 `/admin/email-settings`：側邊欄 13 個連結，「未分組」1 項（課程）、「管理」12 項。

## Design Source

- Source：`~/Downloads/startkiter-sidebar-mockup.html`（右欄「改成這樣」），2026-10-07 由 PM 產出、Fish 回覆「對的，這是我要的樣子」
- Cache：`.spectra/design-cache/admin-sidebar-grouped-nav/startkiter-sidebar-mockup.html`
- 關鍵值：

| 項目 | 值 |
| --- | --- |
| 分區順序 | 核心 CORE → 內容 CONTENT → 會員與行銷 MEMBERS → 營收 BILLING → 系統 SYSTEM |
| 核心 | 控制台（`/admin/course/dashboard`） |
| 內容 | 課程（子選單：課程列表、測驗管理、作業管理、評價與留言管理、課程留言、學員私訊、課程優惠券、課程綁定包、新生問卷、媒體庫、CoursePack 任務）、頁面管理 |
| 會員與行銷 | 用戶、組織、電子報 |
| 營收 | 訂單管理、營收報表 |
| 系統 | 系統設定（子選單：Email 設定、金流設定、發票設定、Gemini 設定、AI 助手模型） |
| 分區標題 | 11px、字距 .06em、muted 色，左側向下箭頭，收合時轉 -90° |
| 子選單 | 左側 1px 直線、縮排 28px、字級 13px |
| 有子選單的項目 | 右側向右箭頭，展開時轉 90° |

實作用既有 design tokens 與 `NavBar.tsx` 現有 class 對應，不手刻新色碼；圖示用現有 SVG 圖示集。

## Goals / Non-Goals

**Goals:**

- 平台後台側邊欄照設計稿分成五區，每區可收合
- 系統設定、課程兩個項目有可展開的子選單，目前頁在子選單內時自動展開
- 手機「更多」找得到所有子選單頁面
- 既有使用者自建分組行為不變

**Non-Goals:**

- 新增「主機」「外掛」頁
- 學員端選單、頁面內容、`/admin/settings` 頁面內容
- 允許使用者把子選單項目拖出上層

## Decisions

### 子選單一律用既有 parentId 機制，不新增第二種巢狀方式

新增 mount entry `admin-system-settings`（route `/admin/settings`，`PLATFORM_APP`）作為上層；5 個設定頁改標 `parentId: "admin-system-settings"`（移除不會生效的 `groupId: "admin-settings"`）。課程子頁沿用 registry 既有的 groupId→parentId 轉換，不改；`course-dashboard` 移除 `groupId`，改成頂層項目放「核心」分區。

Alternatives Considered：
- 用既有 `groupId` 在 NavBar 端組子選單：會出現兩套巢狀規則，`groupId` 又跟使用者自建分組的 `SidebarGroup.id` 撞名，否決。
- 只在設計稿層把設定頁收成一個頁面內的分頁：Fish 要的是側邊欄子選單，否決。

### 分區用 manifest 的 menu.section 欄位宣告

`menu.section` 型別為 `"core" | "content" | "members" | "billing" | "system"`，只標在平台後台會出現的頂層項目；沒有 section 的管理項目歸到「系統」之後的「其他」區，避免漏網項目消失。

Alternatives Considered：
- 第一次登入時在資料庫幫每位管理員建立五個 `SidebarGroup`：要寫資料、要處理既有管理員遷移，且改名後無法回到預設，否決。
- 在 NavBar 寫死 id → 分區對照表：新增頁面時容易忘記改 NavBar，否決。

### 平台工作區帶出 App 根項目的子選單

`resolveNavigation` 在 platform 分支呼叫 `toNavigationItem(entry, appEntriesOfSameApp)`，`appEntriesOfSameApp` 只取同 `appId` 且 `requiredRole === "app-admin"` 的項目。

Alternatives Considered：
- 另外建一份平台專用的課程子頁 manifest：route 會重複，觸發 `DUPLICATE_ROUTE`，否決。
- 維持不帶 children、改在課程頁內放分頁：Fish 要的是側邊欄看得到，否決。

### 有子選單的項目改成展開按鈕，自己的頁面放成第一個子項

有 `subItems` 的項目點擊時切換展開，不導頁；`menu.selfLabelKey` 有值時，子選單第一項為上層自己的路由（課程 → 「課程列表」）。系統設定不設 `selfLabelKey`（`/admin/settings` 目前只有標題卡）。展開狀態：目前頁在子選單內強制展開，其餘由使用者切換並以 localStorage 記住（讀寫包 try/catch）。

Alternatives Considered：
- 上層保持連結、只有在該頁時才展開（現行）：要先點進去才看得到子項，正是 Fish 抱怨的行為，否決。
- 展開狀態存資料庫：只是個人介面偏好，不值得一次寫入，否決。

### 手機「更多」攤平子選單

`getTabBarItems` 的 overflow 把有 subItems 的項目換成它的子項（含 self 項），固定的前 3 格維持頂層項目。

Alternatives Considered：
- 在「更多」裡做第二層展開：底部抽屜空間小，兩層操作在手機上難按，否決。

## Implementation Contract

**Behavior**

- 平台管理員在任何 `/admin/...` 頁：側邊欄依序顯示五個分區標題與設計稿列出的項目；點分區標題收合／展開該區。
- 點「課程」或「系統設定」只展開或收合子選單，不換頁；在 `/admin/settings/einvoice` 時「系統設定」自動展開且「發票設定」為選取狀態。
- 使用者已把某項拖進自建分組時，該項顯示在自建分組，不再出現在預設分區。
- 手機 390px：「更多」清單包含 Email 設定、測驗管理等子選單頁。
- 學員端 `/course` 選單完全不變。

**Interface / data shape**

- `PluginManifest.mount.menu` 新增選填欄位：`section?: "core" | "content" | "members" | "billing" | "system"`、`selfLabelKey?: string`
- 新 mount entry：`{ id: "admin-system-settings", app: PLATFORM_APP, mount: { route: { path: "/admin/settings" }, menu: { labelKey: "admin.menu.systemSettings", icon: "settings", order: 20, requiresOperator: true, section: "system" } } }`
- 新 i18n key（三語）：`admin.menu.systemSettings`、`admin.menu.sections.core|content|members|billing|system|other`、`course.list`
- `NavigationItem` 增加 `section?` 與 `selfLabelKey?` 傳遞到 `MountMenuItem`

**Failure modes**

- localStorage 不可用：子選單與分區預設展開，不報錯。
- manifest 有 `parentId` 指向不存在 id：沿用既有 `UNKNOWN_PARENT_ID` 錯誤，測試會擋下。

**Acceptance criteria**

- `pnpm --filter @startkiter/platform test`、`pnpm --filter @startkiter/saas exec vitest run`、`pnpm --filter @startkiter/saas run type-check` 全綠
- 部署後 ego-browser 桌面 1440 與手機 390 截圖：五分區、兩個子選單展開收合、`/admin/settings/einvoice` 自動展開、`/course` 學員選單不變

**Scope boundaries**

- In scope：上列 manifest、navigation 解析、NavBar 側邊欄與手機更多、i18n。
- Out of scope：Non-Goals 所列。

## Risks / Trade-offs

- [Risk] `course-dashboard` 移除 `groupId` 後，課程管理員在 App 工作區（`/admin/course/...`）會看到它變成頂層項目 → Mitigation：與平台區「控制台」一致，屬預期；`NavBar.test.tsx` 新增 App 工作區斷言，確認 10 個課程子頁仍在「課程」底下。
- [Risk] 上層改成展開按鈕後，原本點「課程」直接進 `/admin/course` 的習慣改變 → Mitigation：子選單第一項「課程列表」就是原頁面。
- [Risk] 共用 NavBar 新增欄位可能意外觸發既有條件分支（L103 前例：`hasNestedMenuItems` 曾關掉分組側邊欄）→ Mitigation：apply 前 grep `NavBar.tsx` 所有讀 `subItems`、`requiresOperator`、`groupId` 的判斷式；保留並跑既有分組側邊欄回歸測試。
- [Risk] 手機固定 3 格因頂層項目變少而改變內容 → Mitigation：測試斷言固定 3 格為 控制台、課程、頁面管理 的順序結果。

## Migration Plan

1. 合併後部署即生效，無資料遷移。
2. 回滾：revert 本 change 的 commit。
