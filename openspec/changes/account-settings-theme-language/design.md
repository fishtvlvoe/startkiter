## Context

`role-based-workspace-navigation` 已固定「哪個角色看到哪個一級／子級選單」，但帳號選單（螢幕左下角，顯示使用者頭像與名稱的區域）目前沒有統一契約：既有 `NavBar.tsx` 把深色文字寫成 hardcoded class，主題切換不等於整個 UI 使用一致的語意色彩；語言切換後曾出現主內容與側欄不同語系；深色／淺色與語言切換目前散落在一級選單，不是使用者預期的「帳號偏好設定」位置。這些都是每個角色、每天都會碰到的操作，需要一個固定入口與一組可測試的色彩／語言契約，而不是繼續讓每個功能各自處理主題狀態。

### 2026-09-21 現況盤點證據（管理頂列與側欄固定深色）

程式碼審查（`grep` 確認，非推測）：`NavBar.tsx` 多處直接寫固定色碼與 `text-white`，不隨 color mode 變化——例如 `bg-[#1d2327] text-[#c3c4c7]`（頂列容器）、`bg-[#2271b1] text-white`（active 選單項目）、`text-[#c3c4c7]/60`（次要圖示色）。這些是十六進位色碼與白色文字寫死在 className 裡，不是語意 token；即使頁面主要內容區的 color mode 切換了，管理頂列與側欄仍固定顯示同一組深色，這正是 Fish 實測「深色／淺色會改變主要內容區，但管理頂列與側欄仍使用固定深色背景與固定文字色」的直接根因。本 change 的「Semantic tokens replace hardcoded dark-mode text classes」決策即針對這批具體字串。

## Design Source

- Source: `docs/ux/startkiter-sr-architecture-focus.html`「設定放在帳號區，管理者才多一個入口」「圖示跟著 App 一起管理」段落，以及舊稿 `docs/ux/startkiter-navigation-focus.html` 的視覺 token 對焦值。
- 對焦重點：帳號選單固定四類入口（使用者設定、{App}管理員設定或總管理員設定、幫助、升級、登出），主題按鈕只用於對焦頁預覽，正式產品的主題設定放在帳號設定，不放一級選單。

| 視覺項目 | 對焦值 |
| --- | --- |
| 畫布背景（dark） | `#111516` |
| 主要面板（dark） | `#182022` |
| 邊線（dark） | `#344144` |
| 主要文字（dark） | `#f4f7f7` |
| 次要文字（dark） | `#9aa8aa` |
| 強調色 | `#9ed36a` |
| 強調色文字 | `#13200e` |
| 桌面 breakpoint | `1440px` |
| 手機 breakpoint | `390px`（既有 shell 斷點 `700px`，驗收以 `390px` 手機寬度為準） |

## Goals / Non-Goals

**Goals:**

- 固定帳號選單三層設定入口的可見性：使用者設定（任何角色）、{App}管理員設定（該 App 的 app-admin）、總管理員設定（總管理員）。
- 把深色／淺色切換與語言切換移到帳號設定內，一級選單不再出現。
- 讓 SVG icon 有 light／dark 兩版，依主題狀態切換，不用 CSS filter 硬轉色。
- 消除 `NavBar.tsx` 既有的深色 hardcoded 文字 class，全面改用語意色彩 token。
- 讓主題與語言切換後，文字顏色、視窗大小與帳號區三種入口的可見性同步更新，桌面 `1440px`、手機 `390px` 無溢出。

**Non-Goals:**

- 不重新定義 `WorkspaceContext` 或選單可見性判斷邏輯本身。
- 不定義新 App 加入規則或 `displayName` 設定機制。
- 不實作課程管理員設定頁、總管理員設定頁裡的真實業務選項內容（本次只固定入口外殼、可見性與跳轉目標）。
- 不新增第三方 icon 訂閱服務。

## Decisions

### Account menu visibility is derived from WorkspaceContext, not a separate permission check

帳號選單的三種設定入口，直接讀取 `role-based-workspace-navigation` 已 resolve 出的 `WorkspaceContext`：`scope: "app"` 且 `role: "app-admin"` 時顯示「{displayName}管理員設定」；`scope: "platform"` 時顯示「總管理員設定」；「使用者設定」在任何 `WorkspaceContext` 下都顯示。不另外查一次權限——避免帳號選單與一級選單的角色判斷出現兩套邏輯而失準。

**Alternatives Considered:**

- 帳號選單自己另外呼叫一次權限 API 判斷要顯示哪個設定入口：否決，會與 `resolveNavigation` 的判斷結果不同步，重演「畫面隱藏不代表資料真的安全」的既有問題來源。

### Theme and locale controls live only inside account settings

深色／淺色切換與語言切換元件只掛載在「使用者設定」頁面內，不出現在一級選單、不出現在帳號選單的第一層（避免帳號選單本身過長）。切換動作立即生效並持久化（既有 next-themes／NEXT_LOCALE cookie 機制），不需要另外儲存頁面才生效。

**Alternatives Considered:**

- 保留主題／語言切換在一級選單頂部（目前作法）：否決，這正是 Fish 明確要求移除的位置，且對焦稿已示範「主題按鈕只用於對焦頁預覽，正式產品的主題設定放在帳號設定」。

### SVG icons ship as paired light/dark assets, selected by theme state, not recolored by CSS filter

每個一級／子級選單 icon、帳號區 icon 必須提供 `light` 與 `dark` 兩個獨立 SVG 檔案，由目前 color mode 決定載入哪一版；不透過 `filter: invert()` 或動態改 `fill` 屬性讓單一 SVG 假裝支援兩種主題。`app-extension-contract` 的 `AppRegistrationManifest.menu.icon` 欄位已預留 `{ light, dark }` 結構，本 change 定義這兩個檔案在 runtime 如何被選用與驗證。

**Alternatives Considered:**

- 單一 SVG 加 CSS `filter: invert()` 轉深淺色：否決，對非純黑白圖示會失真，且無法個別調整強調色在深淺主題下的對比度。
- 用 icon font 取代 SVG：否決，既有系統已用 SVG，且 icon font 較難支援語意色彩 token 的 per-state 覆蓋。

### Semantic tokens replace hardcoded dark-mode text classes

共用 navigation 與帳號選單元件一律使用 `background`、`foreground`、`muted-foreground`、`border`、`accent` 等既有語意色彩 token；移除 `NavBar.tsx` 內寫死的深色專用 hex 或 class。主題切換（dark／light／system）時，這些 token 各自解析到對應色彩，元件不需要條件判斷目前是哪個主題。

**Alternatives Considered:**

- 保留 hardcoded dark 文字 class，只補一份 light mode 覆蓋：否決，這正是既有 bug（主題切換後文字不可讀）的成因，且會讓下一個開發者持續複製同一個錯誤模式。

## Implementation Contract

### Observable behavior

- 帳號選單一律顯示「使用者設定」；「{App}管理員設定」只在目前 `WorkspaceContext` 為該 App 的 app-admin 時出現；「總管理員設定」只在 `scope: "platform"` 時出現。
- 一級選單不出現深色／淺色切換或語言切換控制項；這兩個控制項只出現在使用者設定頁內。
- 切換 dark／light／system 後，帳號選單、一級選單、子選單的文字與背景色皆從語意 token 重新解析，無殘留舊主題色彩。
- 切換 `zh-tw`／`zh-cn`／`en` 後，帳號選單三種入口標籤、workspace heading 與主內容同時使用新語言，不出現混用。
- 每個 icon 在 dark 模式下顯示 dark 版本 SVG、light 模式下顯示 light 版本 SVG。
- 桌面 `1440px`、手機 `390px` 下，帳號選單與其彈出內容不造成水平溢出或遮住主內容。

### Interface and data shape

```ts
type AccountMenuEntry = {
  id: "user-settings" | "app-admin-settings" | "platform-admin-settings" | "help" | "upgrade" | "logout";
  labelKey: string;
  href: string;
  visibleWhen: (ctx: WorkspaceContext) => boolean;
};

type IconAsset = {
  light: string; // SVG asset path
  dark: string; // SVG asset path
};
```

`ACCOUNT_MENU_ENTRIES` 為固定陣列，`user-settings`／`help`／`upgrade`／`logout` 的 `visibleWhen` 恆為 `true`；`app-admin-settings` 的 `visibleWhen` 檢查 `ctx.scope === "app" && ctx.role === "app-admin"`；`platform-admin-settings` 的 `visibleWhen` 檢查 `ctx.scope === "platform"`。

### Failure behavior

- icon 只提供單一版本（缺 `light` 或 `dark`）：build 階段的 icon asset check 失敗，列出缺少版本的 icon id。
- 帳號選單元件內殘留 hardcoded dark 專用 class：static token-usage check 失敗並列出檔案與行號。
- 語言切換後某個區域未同步：locale sync component test 失敗，列出未同步的元件。
- 主題／語言控制項出現在一級選單而非帳號設定：component test 斷言失敗。

### Acceptance criteria

- component test 證明帳號選單三種入口的可見性正確對應三種 `WorkspaceContext`（使用者、App 管理員、總管理員），且深色／淺色與語言控制項不在一級選單內。
- token-usage static check 確認 `NavBar.tsx`、帳號選單元件無 hardcoded dark 專用文字 class。
- icon asset check 確認每個已註冊 icon 都有 `light` 與 `dark` 兩版。
- ego-browser 在部署後對三種角色各驗一次 dark／light／system 與 `zh-tw`／`zh-cn`／`en`，確認帳號選單、文字顏色、icon 版本、桌面 `1440px`／手機 `390px` 皆正常；完整跨 App 全量驗收留給 `platform-launch-verification-evidence`。

### Scope boundaries

In scope: 帳號選單三層入口的可見性契約、主題／語言控制項的落腳位置、SVG icon 淺深色管理規則、語意色彩 token 取代 hardcoded class、對應的 unit／component／基礎 browser tests。

Out of scope: `WorkspaceContext`／`resolveNavigation` 邏輯本身、新 App 加入規則與 `displayName` 設定、各設定頁內的真實業務選項內容、跨 App 全量上線驗收。

## Risks / Trade-offs

- [Risk] 帳號選單依賴 `role-based-workspace-navigation` 的 `WorkspaceContext`，若該型別之後調整，本 change 需要同步更新 `visibleWhen` 判斷 → Mitigation：`visibleWhen` 集中在 `ACCOUNT_MENU_ENTRIES` 單一檔案，型別變動時只需改一處。
- [Risk] 既有 icon 只有單一色版，補齊 light／dark 兩版需要設計資源 → Mitigation：先盤點既有 icon 清單，缺版本的先用既有版本複製一份佔位並標記待補，不因缺圖阻擋骨架完成。
- [Risk] 語言切換 UI 位置改變可能影響既有使用者操作習慣 → Mitigation：在使用者設定頁明顯位置保留語言／主題切換，並在遷移當次於幫助文件註記位置異動。

## Migration Plan

1. 新增 `AccountMenuEntry` 型別與 `ACCOUNT_MENU_ENTRIES` 固定清單，先在使用者設定頁掛載主題與語言切換元件（沿用既有 next-themes／next-intl 邏輯，只搬移掛載位置）。
2. 從一級選單移除既有主題／語言切換元件。
3. 逐一替換 `NavBar.tsx` 內 hardcoded 深色文字 class 為語意色彩 token。
4. 盤點既有 icon 清單，補齊缺少的 light／dark 版本；接上 icon asset check。
5. 在 TEST／preview 部署後用 ego-browser 驗收三種角色 × 三種主題 × 三種語言的基礎組合，再推進正式部署。若驗收失敗，回滾到主題／語言切換仍在原位置的前一個 commit。

## Open Questions

- 目前沒有未解問題。若既有 icon 清單缺版本數量過多導致遷移成本超出預期，需回頭跟 Fish 確認是否要分批交付而非一次補齊。
