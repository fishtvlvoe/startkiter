## Context

前三張 change 固定了骨架（`role-based-workspace-navigation`）、新增規則（`app-extension-contract`）、帳號設定（`account-settings-theme-language`），但這些都是「規則」，不會自動把課程既有功能套進去。課程已有完整實作（`course-studio-upgrade`、`interactive-learning-system` 皆已 archive），但這些功能是在骨架固定前寫的，掛載位置未必符合「App 管理員只能看到該 App 的管理功能」「總管理員不得內嵌單一 App 管理功能明細」的邊界。本 change 是骨架落地到第一個真實 App（課程）的遷移工作，並把邊界規則固定成可測試的契約，讓未來加入設計、社群等 App 時有現成的驗證方式。

## Design Source

- Source: `docs/ux/startkiter-sr-architecture-focus.html`「平台統一負責的東西」「不在這張先做」段落：平台只負責組合，不重做每個功能；「不同角色的畫面與一級／子級選單」屬於本架構要處理的範圍，「任一 App 的內容資料模型重做」明確排除。

## Goals / Non-Goals

**Goals:**

- 把課程 App 的使用者介面與管理員介面各自對齊 `AppRegistrationManifest` 的 `appId: "course"`。
- 盤點並移除誤植在總管理員路由或共用元件下的課程專屬管理功能。
- 固定「使用者介面與管理員介面是兩個獨立頁面樹」與「總管理員介面不內嵌單一 App 管理功能明細」兩條邊界規則，並以測試守住。

**Non-Goals:**

- 不新增任何未來 App 的實際功能或空殼頁面。
- 不重做課程內容資料模型或課程編輯器本體邏輯。
- 不重新定義前三張 change 已固定的型別與規則。

## Decisions

### Course becomes the reference migration for the App registration contract

課程 App 是第一個依 `AppRegistrationManifest` 完整註冊的既有 App，遷移過程即是驗證 `app-extension-contract` 定義的欄位是否足以描述一個真實、非假設性的 App。若遷移過程發現欄位不足，回頭以 `spectra ingest` 修正 `app-extension-contract`，不在本 change 私自擴充契約。

**Alternatives Considered:**

- 直接手動調整課程路由，不透過正式的 `AppRegistrationManifest` 註冊流程：否決，會讓課程成為契約之外的特例，之後新增 App 時無法參照真實案例。

### Admin surface and user surface are two independent route trees per App

每個 App 的使用者介面與管理員介面必須是兩棵獨立的路由樹（例如課程的 `/course/*` 與 `/admin/course/*`），不得讓同一個路由依角色渲染不同內容。這與 `role-based-workspace-navigation` 已固定的「一次只出現一套介面」原則一致，本次把它落實到實際路由結構上並以測試守住。

**Alternatives Considered:**

- 讓同一路由依角色 conditional render 不同內容：否決，`role-based-workspace-navigation` design.md 已指出這是既有 bug（`/course` 顯示管理員選單）的成因之一，繼續沿用會讓遷移後仍有殘留風險。

### The platform (super-admin) surface exposes only site-wide capabilities, never a single App's admin detail

總管理員介面只能出現全站層級功能（帳號、交易、營收、金流、組織、系統、App 清單／切換入口）；任何單一 App 的管理功能明細（例如課程的章節編輯、測驗題庫管理）不得出現在總管理員介面，只能出現在該 App 自己的 app-admin 介面。總管理員要管理課程時，走「切換到課程 App 的 app-admin workspace」這個單一入口，不是在總管理員介面內直接操作課程細節。

**Alternatives Considered:**

- 讓總管理員介面內嵌各 App 的管理功能捷徑（例如總管理員頁面直接放一個「新增課程單元」按鈕）：否決，會讓總管理員介面隨 App 數量增加而無限膨脹，且違反 Fish 明確要求「不要把所有 App 的管理功能塞進總管理員介面」。

## Implementation Contract

### Observable behavior

- `/course/*` 只渲染課程 App 的使用者介面；`/admin/course/*` 只渲染課程 App 的管理員介面；兩者不共用同一個路由依角色切換內容。
- 總管理員介面（`scope: "platform"`）內不出現任何課程專屬管理功能明細；課程管理入口只是切換到課程 app-admin workspace 的單一連結。
- 課程 App 已依 `AppRegistrationManifest` 完整註冊，`appId: "course"`、`displayName` 預設「課程」、icon、語系、測試欄位齊全。

### Interface and data shape

沿用 `app-extension-contract` 的 `AppRegistrationManifest`；本 change 不新增型別，只新增一筆 `appId: "course"` 的註冊資料與對應的邊界測試：

```ts
// 邊界測試示意：總管理員介面不得包含 App 專屬 route
function assertNoAppSpecificRouteInPlatformSurface(
  platformRoutes: string[],
  registeredAppRoutes: Record<string, string[]>
): void;
```

### Failure behavior

- 總管理員介面出現任何已註冊 App 的專屬路由或功能明細：邊界測試失敗，列出違規路由。
- `/course` 與 `/admin/course` 共用同一元件依角色 conditional render：component test 失敗。
- 課程 App 的 `AppRegistrationManifest` 欄位不齊全：沿用 `app-extension-contract` 的 CI 驗證失敗行為。

### Acceptance criteria

- 課程 App 完整通過 `app-extension-contract` 的 CI 驗證。
- 邊界測試證明總管理員介面不含任何課程專屬管理功能明細。
- component test 證明 `/course` 與 `/admin/course` 是兩棵獨立路由樹，不共用同一元件依角色切換內容。
- 既有課程功能（章節／單元 CRUD、講義編輯器、WebContainer 沙盒、拖曳排序）遷移後行為不變，既有測試套件全數通過。

### Scope boundaries

In scope: 課程 App 遷移到 `AppRegistrationManifest`、使用者／管理員介面路由樹分離、總管理員介面邊界測試。

Out of scope: 任何未來 App 的實際功能、課程內容資料模型或編輯器本體邏輯、前三張 change 已固定的型別與規則、跨 App 全量上線驗收。

## Risks / Trade-offs

- [Risk] 課程既有功能複雜（章節、單元、講義、沙盒、拖曳排序），遷移路由樹可能牽動既有測試 → Mitigation：先跑一次既有測試套件建立基準，遷移後逐項比對，不允許既有測試從綠燈變紅燈。
- [Risk] 盤點總管理員介面是否有誤植課程功能，可能遺漏隱藏路由 → Mitigation：以程式化方式列出 `admin/` 路由樹全部檔案並逐一分類，不只憑人工瀏覽介面判斷。
- [Risk] `AppRegistrationManifest` 欄位在遷移真實 App 時發現不足 → Mitigation：發現不足時回頭 `spectra ingest` 修正 `app-extension-contract`，不在本 change 私自擴充契約造成規則分裂。

## Migration Plan

1. 程式化列出 `apps/saas/app/(authenticated)/(main)/(account)/admin/` 全部路由，分類「全站層級」與「課程專屬」。
2. 把課程專屬路由與元件遷移到 `AppRegistrationManifest` 定義的課程 App 管理員介面，移除總管理員介面內的對應內容。
3. 確認 `/course/*` 與 `/admin/course/*` 是兩棵獨立路由樹，補齊邊界測試。
4. 以課程 App 走一次 `app-extension-contract` 的 CI 驗證，確認完整通過。
5. 跑既有課程測試套件，確認遷移前後行為一致；在 TEST／preview 部署後用既有 ego-browser 腳本回歸驗證課程功能。若驗收失敗，回滾到遷移前的前一個 commit。

## Open Questions

- 目前沒有未解問題。若盤點總管理員路由後發現大量誤植內容需要拆分，工作量超出單一 change 合理範圍時，回頭跟 Fish 確認是否要拆成多個小 change 逐批遷移。
