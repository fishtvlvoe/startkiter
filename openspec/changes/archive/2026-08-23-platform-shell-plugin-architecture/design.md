## Context

2026-08-18 老闆定案：部署管線改用 Coolify VPS / Vercel 原生 git-push-auto-deploy，取消客製打包工具與 MCP 推送安裝包。買家的「安裝模組」流程變成「AI 幫改代碼 → commit + push → 平台自動重建部署」。

rebuild-from-official-upstream（已封存）完成後，後台結構已改為：
- `apps/saas/app/(authenticated)/` — 已登入區域 layout
- `modules/shared/components/NavBar.tsx` — 主要導覽元件
- `modules/lib/sidebar-context.tsx` — 側邊欄狀態管理
- 舊的 `app-shell.tsx`、`site-nav.tsx`、`mobile-tabbar.tsx` 已不存在

原 `platform-shell-plugin-architecture` change 的 Phase 1（12 個打勾 task）對應的檔案全部失效，視為未完成。

買家 UI 模版選擇是全新方向：目標客群是純小白，不懂程式/終端機/Git，需要「選模版」起步，不是從空白畫布開始。參考：refero.design（真實 SaaS 截圖庫，可按頁面類型/流程/UI 元件篩選）、saasframe.io。

v1 既有硬邊界（openspec/config.yaml context）維持不變：不做 Organization/Member/Invitation、主金流僅 PAYUNi、不准註冊寫入工具給 site-agent、發票不在 MVP。

已完成的討論記錄：
- `docs/discuss/2026-08-18-plugin-architecture-tiers-comparison.html` — 三方案比較
- `docs/discuss/2026-08-18-auto-deploy-pipeline-gap.html` — 差距圖（部分過時，②打包工具/③MCP推送/④自動build 已被 git-push-auto-deploy 取代）
- `docs/buyer-extension-convention.md` — 買家模組擴充慣例（已完成）
- `docs/deploy-and-public-url.md` — 部署結構紀錄

2026-08-20 補充背景：已封存的 `github-kit-fulfillment` 定義買家倉庫拓樸為「全買家 pull-only 進同一個 `org/startkiter-private-kit`」。但本 change 既有決策「買家用 AI 工具改自己倉庫代碼 → AI 幫他 commit + push main → Coolify/Vercel 自動重建部署」的前提是買家有自己一份可寫的倉庫，兩者互斥。老闆確認：買家倉庫拓樸改為「per-buyer 專屬可寫倉庫」，且要求買家倉庫要能比照 StartKiter 自己追蹤 supastarter 官方更新的方式（`docs/reference/supastarter-nextjs-docs/codebase/update.mdx`：`git remote add upstream` + `git pull upstream main`）追蹤 StartKiter 官方模板倉庫的後續更新。

2026-08-21 補充背景：老闆看過 `docs/demo/course-admin-studio-demo.html`（WordPress 風格後台視覺 demo）並定案三件事：

1. Shell 視覺風格確認採 WordPress Admin 介面語彙（頂列 admin bar + 分組可拖曳側邊欄），適用於 Core Shell 本身，不是單一模版的樣式
2. 側邊欄分組/排序管理（demo 中的新增分組、改名、拖曳排序）v1 要做成真的可持久化功能，不是純前端展示
3. 課程管理後台編輯器（章節/單元 CRUD、拖曳排序、影片網址自動辨識、雙欄講義編輯器）與 Posts/Pages 內容 CMS 兩塊範圍太大，都拆成獨立 change，不併入這張

老闆同時確認全域用戶管理（保全室：看名單、封鎖/解封帳號）沿用 supastarter 既有的 Admin UI（`/Users/fishtv/Development/supastarter-nextjs/apps/saas/app/(authenticated)/(main)/(account)/admin/`，路由 `/admin/users`、`/admin/organizations`），不新寫。這跟「不做 Organizations 多租戶」是兩件事：Admin UI 的用戶封鎖功能兩種蓋法都能裝，跟要不要開放買家站內建多租戶組織無關。

2026-08-22 裁決更新：實作階段發現 `packages/auth/config.ts` 的 `organizations.enable` 實際是 `true`（原文件寫維持 `false` 是誤判，未真的去改）。老闆裁決：**保留 `true`，未來會用到**，不追溯關閉。v1 仍只掛 `/admin/users` 進選單，不掛 `/admin/organizations`——這是「選單要不要露出」的獨立決定，跟底層開關開著與否無關。

## Goals / Non-Goals

**Goals:**

- 部署管線簡化：買家用 AI 工具（Claude Code/Codex）依照 buyer-extension-convention 改代碼，AI 幫 commit + push，Coolify / Vercel 原生 git-push-auto-deploy 自動重建部署，買家全程不碰終端機
- 統一後台 Shell：對照重建後真實結構，所有已登入路由共用同一個導覽框架
- 定義 Mount Points 掛載點機制（路由/資料表/選單/前台區塊）與 Plugin manifest 型別
- Marketplace 頁面展示已啟用模組 + 可選模版（不是「一鍵安裝商店」）
- MCP Gateway 讓外部 AI 工具連線唯讀操作帳號
- 買家 UI 模版選擇：提供 2-3 個內建模版，買家選完後 AI 工具自動套用
- 明確聲明 Core 邊界
- 每位買家在付款履約後取得一份專屬、可寫的私有倉庫，並能透過 AI 工具追蹤 StartKiter 官方模板倉庫的後續更新（新模組/新 Plugin/修補）
- 後台 Shell 視覺定案為 WordPress Admin 介面語彙（頂列 admin bar + 分組可拖曳側邊欄），依 `docs/demo/course-admin-studio-demo.html` 確認
- 側邊欄分組與項目排序可由 operator 自訂並持久化（新增分組、改名、拖曳排序）
- 全域用戶管理（用戶列表、封鎖/解封）重用 supastarter 既有 `/admin/users` Admin UI，掛進 Mount Points

**Non-Goals:**

- 不建客製打包工具、不建 MCP 推送安裝包功能、不建伺服器端自動 build/deploy 觸發（全部改走 git-push-auto-deploy）
- 不做「一鍵裝/解」的 Marketplace 操作介面
- 不做 Organizations 多租戶 UI（owner/admin/member 組織架構、`/admin/organizations` 選單）——底層 `organizations.enable` 開關維持 `true`（2026-08-22 裁決：未來會用到，不追溯關閉），但 v1 買家一個站台仍只有一套帳號體系，不掛載組織管理選單、不開放子組織/子租戶操作介面。全域用戶管理（封鎖/解封帳號）是獨立於 Organizations 之外的功能，不受此限
- 不在這張 change 做課程管理後台編輯器（章節/單元 CRUD、拖曳排序、影片網址自動辨識、雙欄講義編輯器）——拆成獨立 change，理由：現有 `course-module`/`course-media-playback` spec 只涵蓋學員端播放，管理員編輯是全新範圍
- 不在這張 change 做 Posts/Pages 內容 CMS 後台——`platform-core-boundary` 已宣告 page-editing system 是 Core 固定能力，但具體實作拆成獨立 change 處理，這張只維持既有的 Core 邊界宣告文字，不新增實作
- 不做 zip 上傳安裝流程、block editor、shortcode 解析器、交易型 Plugin migration 工具鏈
- 不整合 refero.design MCP（v1 僅內建模版）
- 不做 Agent 管理 Plugin；AI 反向連線客戶伺服器的機制不在此 change 定義，見 `coolify-managed-deployment`
- 不做買家倉庫更新的自動背景同步、不做 merge conflict 自動解決、不做即時 webhook 版本通知、不把買家倉庫轉移到買家個人 GitHub 帳號

## Decisions

### 部署管線採 git-push-auto-deploy，取消客製打包/MCP推送/自動build 三層

買家用 AI 工具改自己倉庫代碼 → AI 幫 commit + push main → Coolify（或 Vercel）偵測到 push 自動重建部署。這條路線 Vercel TEST 站已接通（git push → auto deploy），Coolify 的 git-push 觸發也是原生功能。

Alternatives Considered:
- 客製打包工具 + MCP Gateway 推送安裝包 + 伺服器端自動 build/deploy（原方案四）— 否決：三層全是新工程，時程 4-6 週，而目標客群的核心需求（不碰終端機）可以靠「AI 代為 git 操作 + 托管平台原生 auto-deploy」達成，不需要這個複雜度
- 真 WordPress 執行期動態載入（方案三）— 否決：Next.js 無原生支援，需自建沙盒引擎，先前評估 cordis 已否決過

要區分的兩件事（不要混成同一個決策）：
1. git-push-auto-deploy：Vercel 現在就有，跟是不是用 VPS 無關
2. Coolify/VPS 的價值：常駐 Node、固定 IP，讓 PAYUNi 正式金流 webhook 更穩定——這是獨立的維運決策，不在這張 change 的範圍內

### Marketplace 角色降級為展示頁 + 模版選擇，不做「裝/解」操作

在 git-push-auto-deploy 流程下，「安裝模組」= AI 幫買家改代碼再 push，不是在 Marketplace UI 點「安裝」。Marketplace 頁面改定位為：(1) 展示目前站上已啟用哪些模組；(2) 模版選擇入口——買家選模版後，AI 工具依照模版定義調整掛載點配置 + 樣式 token。

Alternatives Considered:
- 維持原設計的「列出可安裝項目 + 安裝/移除」— 否決：在 git-push-auto-deploy 下，「安裝」這個動作不發生在 UI 上而是在代碼層面，Marketplace 做裝/解按鈕會誤導買家以為點一下就好
- 完全拿掉 Marketplace 頁面 — 否決：買家仍需要一個地方看「我的站上有什麼」和「可以選什麼模版」，頁面本身有價值，只是角色不同

### 後台 Shell 統一對照重建後結構，擴充 NavBar + sidebar-context

對照現在的 `modules/shared/components/NavBar.tsx` 與 `modules/lib/sidebar-context.tsx`，擴充導覽涵蓋所有已登入路由。

Alternatives Considered:
- 沿用舊 change 的 app-shell.tsx 路徑 — 否決：檔案在重建後已不存在，路徑無效
- 從零新建第三套導覽元件 — 否決：NavBar 已存在且是重建後的標準結構，重造浪費

### Mount Points 維持四種掛載點架構，v1 靜態 TypeScript 陣列

新增 `packages/platform/src/mount-points.ts`，匯出 `MOUNT_POINTS: PluginManifest[]` 靜態陣列。NavBar 的選單渲染改為 `.map()` 這份清單。架構意圖與原 design 一致，只是實作路徑對齊新結構。

`MOUNT_POINTS` 本身（有哪些 Plugin、每個 Plugin 提供哪個路由/選單項目）維持靜態陣列不變——這是「有什麼」。但每個選單項目被分到哪個側邊欄分組、分組內順序如何，是「怎麼排」，這層排版資訊改為 DB 持久化（見下方「側邊欄分組與排序」決策），兩者是不同層次，不互相取代。

Alternatives Considered:
- 資料庫驅動 — 否決：v1 沒有動態安裝機制，資料庫驅動空轉
- 檔案系統掃描 — 否決：v1 只有課程一個示範 Plugin，複雜度不需要

### 後台 Shell 視覺風格定案：WordPress Admin 介面語彙

對應 tasks.md task 45.1、45.2、46.1、46.3。依 `docs/demo/course-admin-studio-demo.html` 確認，NavBar/sidebar-context 擴充需落實以下視覺與互動規格（適用整個 Core Shell，不分模版）：

- 頂列 admin bar：固定 32px 高，深色（`#1d2327` 系），左側站名 + 產品切換下拉（官網首頁/銷售頁/學員教室），右側使用者頭像
- 側邊欄：預設寬度 208px（`w-52`），可收折至 56px（`w-14`）只顯示 icon；螢幕 < 768px 改為 hamburger + 全螢幕遮罩（backdrop）觸發滑出
- 側邊欄選單分三個固定分組起步：核心控制 CORE / 產品業務 PRODUCTS / 系統管理 SYSTEM，每組可再由 operator 自訂增減（見下方分組持久化決策）
- 每個分組可獨立收折（點分組標題的 chevron），與整個側邊欄的收折是兩層獨立狀態
- 配色沿用 WP 既有語彙：active 選單項目 `#2271b1`、側欄背景 `#1d2327`、內容區背景 `#f0f0f1`，作為 Shell 的固定樣式 token，不隨模版變動（模版變動的是內容區排版，不是 Shell 外殼配色）

Alternatives Considered:
- 沿用重建後 NavBar 現有的極簡樣式，不改視覺 — 否決：老闆看過 demo 明確要這個方向，且 WP 介面語彙對目標客群（不懂技術的小白）有現成的心智模型可以借
- 把 WP 視覺做成模版層的 `styleTokenOverrides`，不同模版可以有不同 Shell 外觀 — 否決：Shell 外殼是 operator 管理介面，不是買家對外門面，統一一種好維護即可；模版差異化只需要作用在內容區（Dashboard 排版、前台頁面），不需要連後台外殼一起換膚，增加不必要的複雜度

### 側邊欄分組與排序 v1 真實可持久化，新增 `SidebarGroup`／`SidebarGroupItem` 資料表

對應 tasks.md task 43、44、45.3、46.2。demo 裡的「新增分組、改名、拖曳排序」在 v1 要做成真的存檔功能，不是純前端展示。新增兩張表：

- `SidebarGroup`：儲存分組本身（標題、順序、是否收折）
- `SidebarGroupItem`：儲存每個選單項目被分到哪個分組、組內順序，`menuItemId` 對應 `MOUNT_POINTS` 裡某個 Plugin 的 `mount.menu` 項目 key

v1 範圍限定單一 operator 視角（無 Organizations，見 Non-Goals），不需要 `userId`/`organizationId` 欄位分租戶——一個買家站台只有一份側邊欄佈局設定。

Alternatives Considered:
- v1 先不做持久化，拖曳只是 demo 展示、重新整理就還原 — 否決：老闆明確要求真的做，展示功能卻不能用會讓買家困惑
- 排序資訊塞進既有的某張表（例如塞進 User 或 Site 設定 JSON 欄位）— 否決：分組與項目是一對多的結構化資料，用獨立表 + 正確索引比塞進單一 JSON blob 更好查詢與維護，且未來若真的開放多 operator，`SidebarGroup` 加一個 `operatorId` 欄位就能擴充，不用整個重構

### 全域用戶管理重用 supastarter 既有 Admin UI，Organizations 底層開關保留開啟但不掛 UI

對應 tasks.md task 47.1、47.2、47.3。supastarter 內建「Admin」角色與 UI（`/admin/users` 瀏覽用戶清單、封鎖/解封帳號含理由與到期時間），與「Organizations 多租戶」是彼此獨立的兩套機制——前者管「這個帳號能不能登入」，後者管「站內能不能分子組織」。

v1 只掛 `/admin/users` 進 Mount Points（`requiresOperator: true`），不掛 `/admin/organizations`。`organizations.enable`（`packages/auth/config.ts`）2026-08-22 裁決保留 `true`（未來會用到），但這只是底層開關開著，不代表 v1 要做組織管理 UI 或改變買家單一帳號體系的履約模型——維持不掛選單、不開放操作介面。用戶管理頁完全重用 supastarter 現成元件（`modules/admin/component/users/UserList.tsx`），不新寫。

Alternatives Considered:
- 順便啟用 Organizations UI，讓 `/admin/organizations` 也一起掛上 — 否決：這是範圍變更，會牽動 buyer-repo/github-kit 履約模型（一個買家一份專屬倉庫的前提是單一帳號體系），不是這張 change 的討論範圍，維持既有 Non-Goal；底層開關可以開著留給未來用，但 UI 掛載是另一件事
- 把 `organizations.enable` 追溯關回 `false` — 否決：會牽動 NavBar 組織子選單、basePath、bundles/coupons 等已上線功能的既有行為，屬於高風險改動；老闆裁決未來會用到，直接保留開啟
- 自己重寫一套簡化版用戶管理 UI — 否決：supastarter 現成元件已經滿足需求（列表 + 封鎖/解封），重造是浪費（L084 reuse-first）

### 買家 UI 模版選擇：v1 內建 2-3 個靜態模版，不整合外部設計參考庫

模版定義在 `packages/platform/src/templates/`，每個模版是一組：掛載點配置（哪些模組啟用、排列順序）+ 樣式 token 組合（Dashboard 排版風格）+ 預覽截圖。買家在 Marketplace 頁面的「模版」tab 選擇後，AI 工具讀取模版定義檔自動套用。

v1 內建模版初步規劃：
1. **課程教學站**（預設）— 側邊欄課程優先排列、首頁即課程列表、Dashboard 顯示學習進度
2. **服務型 SaaS** — 側邊欄功能模組優先、Dashboard 顯示使用量/客戶統計
3. **作品集展示** — 最小化後台、前台網格展示為主

模版的所有 UI 改動遵守 Demo-first 流程：先出靜態 HTML demo（用 DESIGN.md token），老闆確認才寫真代碼。

Alternatives Considered:
- v1 就整合 refero.design MCP — 否決：refero.design 是「真實產品截圖參考庫」，讓 AI 查詢參考再生成 UI 是有價值的方向，但 v1 先用人工策展的內建模版起步更可控，整合 MCP 是「讓買家的 AI 更聰明」的增強，不是起步必要條件。留作後續探索
- 不做模版選擇，只給空白骨架 — 否決：目標客群是純小白，憑空想「網站要長怎樣」太難，老闆明確要「選模版」體驗
- 模版做成獨立 npm package — 否決：v1 只有 2-3 個內建模版，獨立 package 的分離收益不足以抵銷維護開銷

### 模版與 Mount Points 的接合方式

模版定義檔包含一份 `defaultMountConfig: Partial<PluginManifest>[]`，描述該模版預設啟用哪些掛載點、選單排列順序、Dashboard widget 配置。AI 工具套用模版時，讀取這份 config 並更新 `MOUNT_POINTS` 靜態陣列 + 對應的樣式 token CSS 變數。

這個接合點讓模版不是獨立的「主題系統」，而是 Mount Points 機制的一層預設配置，不引入新的抽象層。

### MCP Gateway 維持外部 AI 唯讀連線，收窄用途

MCP Gateway 只做「外部 AI 連進帳號唯讀操作」，不再承擔「推送安裝包」用途（因為部署改走 git-push）。實作方式與原 design 一致：固定 endpoint + OAuth 式授權 + 連線記錄管理。

Alternatives Considered:
- 維持原設計的「推送安裝包」用途 — 否決：部署管線已改走 git-push-auto-deploy，MCP Gateway 推安裝包這條路失去存在理由

### 內容型 Plugin 共用 PluginContent 表維持不變

與原 design 一致。

### Core 邊界聲明維持不變

與原 design 一致。

### 買家倉庫拓樸從「共用 pull-only」改為「per-buyer 專屬可寫」

背景：`github-kit-fulfillment` 已封存的設計是「所有買家 pull-only 進同一個 `org/startkiter-private-kit`」。但買家要能用 AI 改自己的代碼、AI push、Coolify/Vercel 自動部署，前提是每位買家有自己一份可寫的獨立倉庫，不能是共用唯讀的單一 repo。

新設計：付款履約完成後，系統呼叫 GitHub API 的「Generate repository from template」端點（`POST /repos/{template_owner}/{template_repo}/generate`），以 StartKiter 官方模板倉庫（環境變數 `GITHUB_KIT_TEMPLATE_REPO`）為模板，在 StartKiter GitHub org 下生成一份專屬給該買家的私有倉庫（命名 `org/kit-<orderId>`），並邀請買家的 GitHub 帳號進去、授予 **write**（不是 pull）權限。倉庫仍歸 StartKiter org 所有，不轉移到買家個人帳號，維持 `github-kit-fulfillment` 既有「organization-owned」規則。

Alternatives Considered:
- 買家 fork 到自己個人 GitHub 帳號 — 否決：github-kit-fulfillment 既有規則明文「Personal-account repositories MUST NOT be used for kit delivery」，倉庫要維持 org 管控，方便退款時撤銷存取、方便日後 StartKiter 反向連線協助 Tier 2 集中管理買家
- 維持共用單一 repo，買家改代碼另開一個全新獨立 repo（跟 kit 履約的 repo 脫鉤） — 否決：多一層「這份代碼跟那份代碼是不是同一份」的認知負擔，且無法沿用既有的 kit 存取撤銷機制（退款移除權限）

### 買家倉庫追蹤 StartKiter 官方模板倉庫更新（upstream sync）

比照 StartKiter 自己追蹤 supastarter 官方的方式（`docs/reference/supastarter-nextjs-docs/codebase/update.mdx`）。GitHub 平台的 repo 之間沒有原生「git remote」概念（remote 是本機 git 概念），實際機制是：

1. 每個買家專屬倉庫與 StartKiter 官方模板倉庫的根目錄各自維護一份 `STARTKITER_VERSION` 文字檔（內容為版本字串，如 `2026.08.20`）
2. `GET /api/repo-version` 讀取買家倉庫（透過 GitHub API `GET /repos/{owner}/{buyerRepo}/contents/STARTKITER_VERSION`）與官方模板倉庫（同一 API 打模板 repo）各自的版本字串，回傳 `{ buyerVersion, latestVersion, upToDate, syncPromptHint }`
3. 若 `upToDate` 為 false，Marketplace 頁面顯示「有新版本可同步」，並提供 `syncPromptHint`——一段可直接貼給買家 AI 工具的指示文字，內容比照官方 supastarter 的更新慣例：

```bash
git remote add startkiter-upstream https://github.com/<org>/<template-repo>.git   # 只需加一次，已存在則跳過
git fetch startkiter-upstream
git merge startkiter-upstream/main --allow-unrelated-histories
```

4. 若合併出現衝突，由買家的 AI 工具依買家指示解決，系統不介入、不提供自動衝突解決引擎

Alternatives Considered:
- StartKiter 主動 push 更新進每個買家倉庫 — 否決：買家可能已經改過同一份代碼，主動 push 會覆蓋買家的修改或造成無預警的衝突，風險遠高於「買家主動觸發同步」
- 用 webhook 即時通知買家有新版本 — 否決：v1 範圍排除即時通知（Non-Goals），Marketplace 頁面被動顯示已足夠達成「買家可以自助同步」的目標
- 版本比對改用 git commit SHA 而非獨立版本檔 — 否決：買家倉庫是從模板 generate 出來的獨立倉庫，兩邊沒有共同的 git history 可比對 commit SHA（`--allow-unrelated-histories` 正是因為這個原因），獨立版本檔字串比對更簡單可靠

## Implementation Contract

**Behavior**（使用者可觀察的行為）：

- 已登入使用者點擊導覽列任何已登入路由（課程/客服/設定），頁面維持同一個 Shell 框架
- 螢幕寬度小於 768px 時，導覽自動適應行動裝置版面
- 已登入使用者在 `/marketplace` 看到兩個 tab：「已啟用模組」（v1 僅課程一項）與「模版選擇」（v1 提供 2-3 個內建模版的預覽卡片）
- 買家選擇模版後，Marketplace 顯示該模版的詳細說明與適用場景，引導買家用 AI 工具套用（給出 prompt 建議）
- 外部 AI 工具在 MCP 設定填入 `https://<domain>/api/mcp` 後完成授權，可唯讀操作
- 課程內容透過 `packages/course` 引擎產出，掛載於 `/course` 路由
- 買家用 AI 工具依照 buyer-extension-convention 改代碼 → AI commit + push → Coolify/Vercel 自動重建部署
- 付款履約後，買家取得一份專屬（非共用）GitHub 私有倉庫，帳號權限為 write
- Marketplace 頁面新增「版本」區塊，顯示買家倉庫版本 vs StartKiter 模板倉庫最新版本；不同步時顯示可貼給 AI 工具的同步 prompt
- 側邊欄呈現 WordPress Admin 視覺語彙：頂列 32px admin bar、可收折側邊欄（208px ↔ 56px）、< 768px 改 hamburger + 遮罩滑出
- operator 可在側邊欄新增分組、改名、拖曳排序選單項目（含跨分組拖曳），重新整理頁面後排序維持（已持久化）
- operator 訪問 `/admin/users` 看到 supastarter 既有用戶清單與封鎖/解封操作；`/admin/organizations` 不掛載於選單

**Interface / data shape:**

```ts
// packages/platform/src/types.ts
type PluginManifest = {
  id: string;
  name: string;
  version: string;
  mount: {
    route?: { path: string };
    menu?: { label: string; icon: string; order: number; requiresOperator?: boolean };
    content?: { kind: "auto" | "shortcode" | "block"; boundTo?: string };
  };
  dataSpec: "content" | "none";
};

// packages/platform/src/templates/types.ts
type SiteTemplate = {
  id: string;
  name: string;
  description: string;
  previewImagePath: string;
  defaultMountConfig: Partial<PluginManifest>[];
  styleTokenOverrides: Record<string, string>;
  aiPromptHint: string;
};

// packages/platform/src/sidebar/types.ts
type SidebarGroup = {
  id: string;
  title: string;
  order: number;
  isCollapsed: boolean;
};

type SidebarGroupItem = {
  id: string;
  groupId: string;
  menuItemId: string; // 對應 MOUNT_POINTS 中某個 Plugin 的 mount.menu 項目 key
  order: number;
};
```

- `GET /api/plugins` → 回傳 `PluginManifest[]`，含 `enabled: boolean` 欄位
- `GET /api/templates` → 回傳 `SiteTemplate[]`，用於 Marketplace 模版選擇 tab
- `GET/POST /api/mcp` → 遵循 MCP 協定標準 HTTP transport
- `GET /api/mcp/connections` → 回傳 `McpConnection[]`
- `DELETE /api/mcp/connections/:id` → 撤銷指定連線
- `GET /api/repo-version` → 回傳 `{ buyerVersion: string, latestVersion: string, upToDate: boolean | null, syncPromptHint: string }`，需有效 session；`upToDate` 為 `null` 表示任一端版本檔缺失，無法判斷
- `GET /api/sidebar-layout` → 回傳 `{ groups: SidebarGroup[], items: SidebarGroupItem[] }`，需有效 session
- `PUT /api/sidebar-layout` → 更新分組與排序（新增分組、改名、拖曳結果），需 operator 權限，整批覆寫 groups + items

DB DDL（PostgreSQL，對應 Prisma model）：

```sql
CREATE TABLE "PluginContent" (
  "id" TEXT PRIMARY KEY,
  "pluginId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" JSONB NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE INDEX "PluginContent_pluginId_type_idx" ON "PluginContent"("pluginId", "type");
CREATE INDEX "PluginContent_authorId_idx" ON "PluginContent"("authorId");

CREATE TABLE "McpConnection" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "authorizedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "lastUsedAt" TIMESTAMP,
  "revokedAt" TIMESTAMP
);
CREATE INDEX "McpConnection_userId_idx" ON "McpConnection"("userId");

CREATE TABLE "SidebarGroup" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE "SidebarGroupItem" (
  "id" TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL REFERENCES "SidebarGroup"("id") ON DELETE CASCADE,
  "menuItemId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE INDEX "SidebarGroupItem_groupId_idx" ON "SidebarGroupItem"("groupId");
CREATE UNIQUE INDEX "SidebarGroupItem_menuItemId_key" ON "SidebarGroupItem"("menuItemId");
```

**Failure modes:**

- manifest 不符合 `PluginManifest` 型別 → TypeScript 編譯期失敗（fail-closed）
- MCP 授權請求缺少有效 session → 回傳 `401`
- `DATABASE_URL` 或 `BETTER_AUTH_SECRET` 缺失 → MCP Gateway 與 Marketplace 一併回傳 503
- 模版定義檔格式錯誤 → TypeScript 編譯期失敗
- 側邊欄 menu 項目未設定 `requiresOperator` 但目標路由需 operator 權限 → 頁面本身仍走既有權限檢查做 redirect
- GitHub「Generate repository from template」API 呼叫失敗 → 履約流程回報錯誤，不建立部分完成的 grant 記錄（比照既有 github-kit-fulfillment fail-closed 慣例）
- `STARTKITER_VERSION` 檔案在買家倉庫或模板倉庫任一端不存在 → `/api/repo-version` 回傳 `upToDate: null`，不誤報「已是最新」
- `GITHUB_KIT_TEMPLATE_REPO` 未設定 → 履約流程回傳 503，比照既有 `GITHUB_APP_ID`/`GITHUB_KIT_ORG`/`GITHUB_KIT_REPO` 缺失時的 fail-closed 慣例
- `PUT /api/sidebar-layout` 的 `menuItemId` 不存在於當前 `MOUNT_POINTS` → 該筆項目拒絕寫入，回傳 400，不影響其他合法項目
- `PUT /api/sidebar-layout` 由非 operator 呼叫 → 回傳 403
- `SidebarGroup` 為空（尚未初始化）時，`GET /api/sidebar-layout` 回傳空陣列，前端 fallback 為 `MOUNT_POINTS` 的預設順序（不因為排序表是空的就不渲染選單）

**Acceptance criteria:**

- `pnpm test` 全綠
- NavBar 在所有已登入路由（/app, /course, /agent, /admin/settings）呈現一致的 Shell 結構
- `curl /api/plugins` 回傳含課程 Plugin manifest 的陣列
- `curl /api/templates` 回傳含 2-3 個內建模版的陣列
- MCP Gateway `/api/mcp` 握手成功回應符合 MCP 協定格式
- Marketplace 頁面顯示「已啟用模組」與「模版選擇」兩個 tab
- 每個模版的靜態 HTML demo 經老闆確認後才寫真代碼
- 付款履約後，買家倉庫是專屬（非共用）私有倉庫，買家帳號權限為 write
- `curl /api/repo-version` 回傳格式含 buyerVersion/latestVersion/upToDate/syncPromptHint
- 側邊欄 admin bar 與可收折分組樣式符合 demo（`docs/demo/course-admin-studio-demo.html`）視覺規格，Chrome MCP 截圖比對確認
- 拖曳選單項目到不同分組後重新整理頁面，順序與分組歸屬維持（`curl /api/sidebar-layout` 驗證持久化）
- `/admin/users` 可從側邊欄 SYSTEM 分組進入，`/admin/organizations` 不出現在任何選單

**Scope boundaries:**

- In scope: 後台 Shell 統一（對照新結構）＋ WordPress Admin 視覺定案、PluginManifest 型別與靜態掛載點清單、SidebarGroup/SidebarGroupItem 持久化排序、課程示範 Plugin manifest、Marketplace 展示頁 + 模版選擇、MCP Gateway 唯讀操作、PluginContent/McpConnection 兩張新表、2-3 個內建模版定義 + HTML demo、買家專屬可寫倉庫 provision（取代共用 pull-only）、版本比對 API、同步 prompt 提示、重用 supastarter `/admin/users` 掛進 Mount Points
- Out of scope: 客製打包工具、MCP 推送安裝包、伺服器端自動 build/deploy 觸發、zip 上傳安裝流程、block editor/shortcode 解析器、refero.design MCP 整合、交易型 Plugin migration 工具鏈、自動背景同步、自動 merge conflict 解決、即時 webhook 版本通知、Organizations 多租戶 UI（底層 `organizations.enable` 開關保留 `true`，2026-08-22 裁決未來會用到，但不掛 UI）、課程管理後台編輯器（另開 change）、Posts/Pages CMS（另開 change）

## Risks / Trade-offs

- [Risk] git-push-auto-deploy 依賴買家的 AI 工具能正確執行 git 操作（commit + push），如果 AI 工具出錯會部署壞的代碼 → Mitigation: buyer-extension-convention 已規定代碼格式與驗證步驟（`pnpm type-check` + `pnpm test`），AI 工具在 push 前應先跑通驗證；Coolify/Vercel 的 build 失敗不會影響線上版本（只有 build 成功才切換）
- [Risk] v1 只有 2-3 個內建模版，如果都不符合買家需求會卡住 → Mitigation: 模版是起步點不是限制，買家可以請 AI 從任一模版開始自由修改；v1 的目標是「給小白一個開始的地方」而非「覆蓋所有可能的 SaaS 長相」
- [Risk] 模版預覽截圖需要人工製作，更新成本高 → Mitigation: 模版數量 v1 控制在 2-3 個，截圖工作量可控；未來可用 Playwright 自動截圖
- [Risk] 掛載點清單 v1 用靜態陣列，未來動態安裝需額外開發 → Mitigation: PluginManifest 型別介面現在就定義好，渲染端只依賴型別，之後替換資料來源時消費端不用改
- [Risk] MCP Gateway 唯讀權限若範圍不對可能洩漏敏感資料 → Mitigation: v1 範圍比照 site-agent 既有兩支唯讀工具，不開放任何寫入操作
- [Risk] 統一 Shell 是 BREAKING 變更 → Mitigation: tasks 含更新既有測試選擇器的任務
- [Risk] 買家倉庫從共用改成 per-buyer 專屬，倉庫數量隨買家數量線性增長，GitHub org 私有倉庫數量/API rate limit 可能受影響 → Mitigation: GitHub Team/Enterprise 方案下私有倉庫數量無實質上限，rate limit 沿用既有 GitHub App 認證機制分攤
- [Risk] 買家自己改過的代碼跟 upstream 合併時出現衝突不知道怎麼辦 → Mitigation: `syncPromptHint` 明確引導買家把衝突訊息貼給自己的 AI 工具，AI 工具處理 merge conflict 是本身既有能力，不需要 StartKiter 額外開發衝突解決引擎
- [Risk] 既有已用舊共用 pull-only 模式完成履約的買家，需要一次性遷移到 per-buyer 專屬倉庫，遷移期間可能造成短暫存取中斷 → Mitigation: 遷移排程與是否需要提前通知買家，留待 Open Questions 由老闆裁決，tasks.md 列出遷移任務但不預設立即執行時間

## Migration Plan

部署步驟：

1. 合併資料庫 migration，新增 `PluginContent`、`McpConnection` 兩張表（新增表，不影響既有資料）
2. 部署新版 NavBar + sidebar-context 擴充（向後相容）
3. 部署 `/marketplace`、`/api/plugins`、`/api/templates`、`/api/mcp`、`/api/repo-version` 路由
4. 設定 `GITHUB_KIT_TEMPLATE_REPO` 環境變數，指向 StartKiter 官方模板倉庫
5. 新買家履約流程切換為 generate-from-template + write 權限
6. 既有已用舊共用 pull-only 模式完成履約的買家，執行一次性遷移任務：為每位既有買家 generate 一份專屬 repo、授予 write，並撤銷舊共用 repo 的 pull 權限（遷移排程時機見 Open Questions）
7. 驗證通過後，移除導覽元件對舊路由結構的殘留引用

回滾策略：migration 為新增表，回滾時可直接 `DROP TABLE`；NavBar 變更可 `git revert`；新履約流程若出問題可暫時切回舊有的共用 repo pull-only 邀請邏輯（`packages/github-kit/src/claim.ts` 的變更用 `git revert`還原），已生成的 per-buyer 專屬 repo 不需要刪除。

## Open Questions

- ~~內建模版的具體視覺風格需要老闆看 HTML demo 才能定案~~ — 已解決（2026-08-21）：Shell 本身視覺已依 `docs/demo/course-admin-studio-demo.html` 定案（見 Decisions「後台 Shell 視覺風格定案」）。「課程教學站」模版的內容區排版仍待各模版各自的 Demo-first 流程確認，其餘 2 個模版（服務型 SaaS、作品集展示）視覺仍未定案
- 課程管理後台編輯器（章節/單元 CRUD、拖曳、影片網址自動辨識、雙欄講義編輯器）已拆分為獨立 change，待 propose——`docs/demo/course-admin-studio-demo.html` 的課程管理頁部分即為該獨立 change 的視覺參考
- Posts/Pages 內容 CMS 後台已拆分為獨立 change，待 propose——`platform-core-boundary` 已宣告的「page-editing system 是 Core」承諾在該 change 落地為具體實作
- refero.design MCP 整合的價值確認——是否值得讓買家的 AI 工具能查真實產品介面當設計參考，或者內建模版 + 自由修改已經足夠。v1 先不做，收集使用回饋再議
- Coolify VPS 的具體建置（常駐 Node、固定 IP、PAYUNi webhook 穩定性、三層客群主機模式）已另開 `coolify-managed-deployment` change 處理，不在這張 change 範圍內
- Marketplace 的模版選擇與 buyer-extension-convention 的 AI prompt 引導如何串接——模版定義檔的 `aiPromptHint` 欄位可以給 AI 工具直接使用，但具體的 prompt 品質需要實測調整
- 既有買家（已用舊共用 pull-only 模式完成履約者）要怎麼一次性遷移到 per-buyer 專屬倉庫？是否需要提前通知買家、給遷移期限、還是直接背景批次處理？這需要老闆裁決，tasks.md 先列出遷移任務但不預設執行時間點
- `STARTKITER_VERSION` 版本號格式（semver、date-based 如 `2026.08.20`、或其他）與 StartKiter 團隊更新版本檔的頻率/流程，留待實作時決定，不影響本 change 的機制設計
