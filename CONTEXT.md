updated: 2026-10-13
change: creator-operations-platform-blueprint

## 這個專案在幹嘛

StartKiter：課 + 終身代碼包，對外課名「開站包」。產品定位是「平台＋多個獨立 App」，不是單一固定功能的 SaaS——課程只是第一個接入的 App，之後可加入設計、社群等 App，每個 App 各自獨立管理內容、資料、選單、使用資格、文字、圖示與測試。

## 目前討論到哪

### 2026-10-13 接續狀態（本段優先於下方歷史現況敘述）

目前 branch 為 `feature/public-multi-course-sales-and-code-package`。該銷售 SR 位於 active changes，已有公開課程、Offer、結帳、權限、通知與 GitHub 交付的工作樹修改；下方「parked／尚未改 runtime」是先前盤點狀態，不能當目前進度。既有未提交程式修改保留，文件更新不代表它們已驗收。

Fish 已看過 HTML；要求依 Systeme.io 更直覺的後台呈現。新版 Demo 已提交 `1152953a`：頂端分區／單層分類，手機選單與方案卡片。它是 UI 提案；正式導航接線仍須沿用平台 registry／resolveNavigation，沒有改正式網站。

本輪驗收目標是 `docs/blueprint/creator-platform-acceptance-target.md` 的五項交付；開發交接草稿在 `docs/blueprint/creator-platform-development-handoff.md`。本輪已修正 tasks 的重複 3.5 為 3.16，第 9 節明確只寫後續交接卡片，SR 序號不代表施工時間。下一張施工方向是先收尾一次買斷銷售切片，通用 commerce／新訂閱再重用擴充。

未決訂閱取消、CodePackage license／更新期間、Funnel 深度、SMS／發票／影音／AI provider、錄影與逐字稿保留政策，依 design Open Questions 與交接卡片逐題處理。50 個 analyzer Suggestions、各 capability 語意核對與買家操作實跑尚不能算完成。

Fish 已確認：StartKiter 要擴成「台灣創作者完整營運平台」，並把 UI/UX 的容易操作列為硬條件；先完成完整藍圖，再進行開發。

第一個垂直切片已拍板：多門課程 → 公開前台銷售頁 → CourseOffer → PAYUNi → 課程權限與每門課的 LINE／歡迎信，再提供全平台唯一的 GitHub 代碼包資格。代碼包不包含課程教材；每位買家仍由同一份範本取得唯讀個人 repo，多買課程不會重複建立 repo。完整 CRM 與行銷電子報延後到交易交付閉環完成後。

已完成只讀盤點：Systeme.io Dashboard 主導覽與代表頁、StartKiter 正式站桌面／手機畫面、實際 route、`MOUNT_POINTS`、現有 package、資料模型、外部服務與 Spectra changes。

藍圖已建立於 `docs/blueprint/startkiter-creator-platform.md`，包含：產品定位、使用者、核心工作流、資訊架構、領域模型、事件流、台灣契約、技術棧、UI/UX 契約、開發順序與待拍板事項。

藍圖文件已建立並經 Spectra validation；`creator-operations-platform-blueprint` 目前仍是 active change，總計畫 tasks 尚未施工，未 apply、未改 runtime。

本輪補建立 `docs/blueprint/systeme-io-reverse-engineering-checklist.md`，並把 `creator-operations-platform-blueprint` 更新成完整總 SR 計畫。新增 `creator-ui-ux-foundation`、`buyer-saas-extension-and-deployment` 與 `platform-extension-and-update-contract` capabilities：前者固定 task-oriented screen contract、共用 list/form/state、desktop／390px、keyboard、focus 與 design handoff；第二個固定 CodePackage 作為買家建立自己 SaaS、管理 downstream auth／Organization／permissions／billing、部署 tier、credential handoff 與 upstream update 的產品使用層；第三個固定 App／plugin extension、compatibility、feature flag、buyer custom protection、AI skill version、release evidence 與 rollback。總計畫分成逆向盤點、workspace、UI/UX foundation、平台擴充／更新契約、CRM、Product／Offer、銷售交付、buyer SaaS deployment、營運工作台、Automation、Site／Funnel、台灣交易、Analytics、手機與 rollout 階段。這些是規格與施工順序，不代表 runtime 已完成。

本次 `spectra analyze creator-operations-platform-blueprint --json` 已清除 Coverage／Consistency 的 blocking findings；剩 50 個 concrete-example Suggestions。`spectra validate creator-operations-platform-blueprint` exit 0。

第一張施工 SR 草案：`public-multi-course-sales-and-code-package`，已建立 proposal、design、3 份新 capability spec、GitHub kit delta spec 與 15 個可驗證 tasks；Spectra validate 通過、analyze 0 Critical/Warning，剩 23 個建議級 concrete-example 提示。已暫存於本機 Spectra store（可用 spectra list --parked 查看）；尚未 apply、尚未修改 runtime。

實際程式碼盤點：apps/marketing 現在只賣一門固定 8800 元課程；Course 尚無售價欄位；MVP SKU access 目前會通過所有 courseId；GitHub claim 只認 MVP SKU，程式和 spec 現在授予 write，與唯讀產品邊界衝突。Bundle checkout 程式已完成，`buyer-bundle-checkout-entry` 僅剩 task 7.2 正式站或 sandbox 購買驗收；新 SR 不重做它。

### 歷史基線：2026-09-21 第二輪實際程式碼盤點證據

- `packages/platform/src/mount-points.ts` 與 `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`（呼叫 `SettingsMenu`）是兩套互不相干的選單真相來源；`/admin/course`、`/admin/users`、`/admin/orders`、`/admin/revenue`、`/admin/organizations`、`/admin/settings/checkout-gateway` 六個路由各自出現兩套不一致的中文標籤（例：`/admin/orders`「訂單管理」vs「訂單列表」）。
- `mount-points.ts` 的選單文字 100% 是硬編碼中文字串，沒有任何 `labelKey`／i18n key——這是「切換 English 後主內容變英文、側欄仍中文」的根因，已寫入 SR-01 新增的「Menu labels resolve through the active locale catalog」requirement。
- `SettingsMenu.tsx` 用不換行的水平 flex 排列，在 390px 手機寬度造成約 730px 的水平溢出；預期移除平行選單即可一併解決。
- `NavBar.tsx` 多處寫死 `bg-[#1d2327]`、`bg-[#2271b1] text-white`、`text-[#c3c4c7]` 等色碼，管理頂列與側欄不隨 color mode 切換——已寫入 SR-03。
- 既有 106 個測試檔、430 個測試通過，但仍以 `isOperator`／`course-admin-menu` 舊模型為主，尚未驗證新的「平台／App／角色」規則；SR-01 新增 task 0.1／5.1 要求遷移時逐一改寫這批測試，不得新舊斷言並存、不得沿用舊的「430 通過」當作本次驗證證據。
- 非管理員（app-user）真實登入視角尚未經人工或 ego-browser 驗證；SR-01 spec／design／tasks 已明確標記這項為「未驗證」，禁止用型別正確推定畫面正確。

### 2026-10-12 REA Webinar／AI 補充

- Codex CLI 的 REA MCP 設定可用；9222 是 Obscura，REA 不支援該 endpoint。本輪改用獨立 Brave CDP 9224，REA 成功讀取 WebinarKit 與 systeme.io 登入後控制台；未用 ego 逆向目標網站。
- WebinarKit 的 Webinar 建立入口可見 Automated、Live（鎖定）、Series；既有 Webinar 設定分 Details、Register、Watch、Other，包含報名頁、感謝頁、觀看室、回放、排程、郵件／簡訊提醒與 Webhooks／Google Calendar。Live 的鎖定原因及影音 provider 未確認。
- systeme.io 免費帳號可見 CRM、Sites、Email、SMS、Automation、Products、Sales 等主導覽，沒有 Webinar 導覽。官方 Help Center 表示 Webinar／Unlimited 方案可建立 Evergreen Webinar，並明確說原生不支援即時直播。不可把高階 Webinar 方案寫成 live streaming 技術。
- WebinarKit 前端觀察到 jQuery 3.7.1、Webpack bundles、Bootstrap 5 API 風格、Feather／FontAwesome、Google Tag 與外部客服 widget。這只證明已觀察頁面的前端資源；後端、資料庫與影音串流技術未知。
- 已新增 creator-live-and-webinar、creator-ai-assistance blueprint specs，tasks 排入 SR-13／SR-14；Live 與 Evergreen 分開，Creator AI 要 workspace scope、來源追溯、外部動作人工核准，並與買家 CodePackage 開發 AI 隔離。
- 架構 HTML：docs/blueprint/startkiter-creator-platform-architecture.html。html-visualizer verify.py 靜態結構、JS 語法與呈現項目通過；因本機沒有 Playwright，該工具的版面與執行期項目標記未驗證。REA 已實際載入桌面／390px 預覽、點開 Webinars 導覽與複製預覽 modal；唯一瀏覽器警告是 HTML Visualizer 指定使用的 Tailwind CDN production warning。
- 本輪以 REA 深查 WebinarJam：Full configuration 有 Right now／Schedule for later／Always on，設定區包括基本資料、講者、串流、排程、報名、通知、整合、Thank You、Live、Replay、Finish；Express 初始頁只有基本資料、講者與語言區塊。Full 的串流 UI 顯示 WebinarJam Live／YouTube Live／Facebook Live，但未選 provider、授權或儲存，實際影音技術未知。Analytics 可用 Webinar／Session／Event 篩選；本次 Go 後無報表、Export 停用。Registrants 有 Active registrants／Auto-subscribers 分頁及 Live room／Replay room／Purchase behavior 篩選；查詢顯示空結果，未讀取名單。離開未儲存向導後 `/webinars` 顯示 25 個項目、無空白／通用草稿名稱；此為清單畫面證據，不證明後端暫存情形。證據與限制見 `docs/blueprint/webinarjam-reverse-engineering-notes.md`；已補到 `creator-live-and-webinar` spec 與 SR-13。
- 本輪只更新藍圖與 HTML；沒有 spectra apply、沒有改產品 runtime。現有分支還有 public-multi-course-sales-and-code-package 的未提交變更，勿覆蓋或混合清理。

## 未解問題

- 上線 preflight 需確認 legacy `startkiter-mvp` 對應的唯一舊課程 ID；若不唯一，backfill 停止並要求明確 mapping。
- 已存在 GitHub repo 的 write 權限需 dry-run 盤點，再安排轉成 pull 唯讀並回讀驗證。
- `buyer-bundle-checkout-entry` task 7.2 的正式站／sandbox 購買驗收仍是獨立 gate。

## 下一步

供應商選擇留給後續 SR：Live video provider、錄影／逐字稿保留政策與 AI provider／資料邊界。總計畫與 HTML 已在本機更新，尚未 commit／push；開始 runtime SR 前，先核對各 capability 的排序與既有 public-multi-course-sales-and-code-package 施工邊界。
