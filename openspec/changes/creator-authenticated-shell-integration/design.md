## Context

NavBar有resolveNavigation caller；WorkspaceContext為platform或app(appId/role)，不是creator organization context。原canonical在/admin/course角色描述與較新/admin全platform描述有矛盾，不在此猜新role。M2前置：M1畫面核准、原導航owner解決語義矛盾、route/file owner簽認、隔離localhost登入環境可用。前置不足可以準備tests與source mapping，不直接改正式navigation。

## Design Source

Source：M1 creator-ui-ux-design-completion核准後的screen matrix與當前兩層殼；当前參考cache .spectra/design-cache/creator-authenticated-shell-integration/source.dc.html。現在cache不是已完成M1成品，施工時要更新cache并記來源fingerprint才用，不猜畫面。

視覺基準#faf9f5底／#141413文字／#d97757重點／#d1cfc5邊框，桌面sidebar230px／gap24px／radius7px／button5px；實際App必沿用packages/ui/components共用token而非把HTML CSS整包拷進Next。icon使用現有light/dark SVG registry，locale既有zh-tw/zh-cn/en。手機390px與桌面1440px保持相同核心入口。

## Goals / Non-Goals

Goals：localhost真App登入後看到新版導航，existing course/manage/buyer routes不丟、角色授權仍由server判斷、未知模組不假可操作。Non-Goals：交易／商品模型、Organization與auth重建、DB／provider／deploy。

## Decisions

### renderer只吃一份NavigationModel，保留server角色與manifest真相

role語義依原owner修正後的spec。新top nav與context sidebar都是同一NavigationModel.items/children的呈現，不把示範九分類硬塞正式manifest。未註冊／未授權不生成可點入口；需要設計預覽以清楚不可用標示，但不能掩飾404。

Alternatives Considered：拷Demo role/tabs字串作正式guard，否決，可繞權限且第二份真相；重寫auth/organization再做殼，否決，超scope而既有地基可重用。

### 先本機選擇性啟用，保留舊殼與preview特殊路徑

shared殼主控唯一owner，worker只renderer／非overlap focused tests。/course/preview由既有專用外框契約處理，不能新殼重覆渲染；旧NavBar保留可回退，原UserMenu/通知/登入返回不丟。

Alternatives Considered：一開始替換全站殼，否決，風險擴大；每小頁自建sidebar與guard，否決，失去同一model及reset/focus契約。

## Implementation Contract

可觀察輸入：已登入test user＋path＋existingmanifest→resolveNavigation一次結果→top/side/currentlocation。純renderer interface `renderNavigation(model, activePath, locale)`不自行讀DB/storage。Next UI渲染既有Link和UI元件，unknown route不捏造data。現有API/guard回401/403不變；無權限UI顯示拒絕並不載protected資料。

核心驗收是在http://localhost:3000（若佔用則主控先核對新port再記錄）實際登录至少platform-admin／app-admin／app-user測試角色；不把file Demo role switch當這項。沒有隔離DB/帳號則標環境blocked，不能連production DB代替。M2只接已存在routes，不承諾所有future modules功能已完成。

前置owner記錄docs/ux/creator-shell-route-ownership.md；如果兩active SR同时寫NavBar，主控先停其他相同寫入任務並記transfer，不同時派。先測preview外框單一、canonical角色及module role拒絕，renderer符合後才接線。tests用現有vitest/package命令，不讀真credentials；localhostbrowser由主控ego操作并保存1440/390畫面與role denial證據。未提供穩定路由/flag/source是進入阻礙，不能猜。

## Risks / Trade-offs

[canonical新舊角色矛盾] → 原role SR先补正及test，M2preflight不過不開改runtime。

[新增分類對應不存在route] → 只用manifest已註冊結果，未接功能不能假可點；候選模組由後續AppRegistrationManifest計畫。

[課程preview雙外框] → 根據既有AppWrapper/NavBar抑制規則寫regression，不拷Demo到每page。

[本機連到正式DB] → 先核對隔離環境／test account資料來源，不讀log secret，不把production當驗收機。

## Migration Plan

Expand：renderer與focused tests增加、舊殼保持default。Migrate：localflag啟用，逐role/route验收後維持單一model。Contract：明確local验收與M3接線過關後由另release plan決定廣泛切換，不在本SR刪舊殼或deploy。回滾切回local舊殼，無DBschema改動／外部副作用。

## Open Questions

原導航role語義及file ownership需先由M0治理核定；不在此悄悄決定app-admin=creator。M1尚未完成，新視覺cache需核准版本。未確認環境前不給承諾日期；worker上限兩個獨立renderer/tests，主控整合驗證。
