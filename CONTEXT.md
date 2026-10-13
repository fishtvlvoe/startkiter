updated: 2026-10-13
change: creator-platform-delivery-master

## 這個專案在幹嘛

StartKiter：課 + 終身代碼包，對外課名「開站包」。產品定位是「平台＋多個獨立 App」，不是單一固定功能的 SaaS——課程只是第一個接入的 App，之後可加入設計、社群等 App，每個 App 各自獨立管理內容、資料、選單、使用資格、文字、圖示與測試。

## 目前討論到哪

### 2026-10-13 18:37 最新：M1驗收目標重新固定

Fish要求重定目標並說何時可驗；目標文件docs/blueprint/creator-m1-acceptance-target.md。M1完整本機UI/UX涵盖creator34/admin8/buyer2子目的地＋3種資源detail，layout重用不是47套元件；完整screen/state/路線仍未做。估計實際開工後5小時；若18:45開工則23:45台灣時間交完整候選，19:45第一批進度，30分鐘回報；起點不同要重估，不宣稱轉頭後自動背景工作。真正HTTP登入與DBM2/M3不混入本輪。目標本機寫入但未開新增M1畫面施工，未commit/push，舊goal API blocked不能替換，不假complete原目標。

### 2026-10-13 最新：收尾舊SR與單一里程碑总表，完整UI未完成

Fish核准先收尾/統整/拆小SR後再分工。新入口docs/blueprint/creator-delivery-master.html，唯一總施工表creator-delivery-master.md；總治理SR creator-platform-delivery-master(no-spec,10審核gate)、M1 creator-ui-ux-design-completion(9task)、M2 creator-authenticated-shell-integration(7task)已完整propose/analyze/validate並依提案流程parked，尚未apply新孩子。M0→M1完整UI設計→M2HTTP真本機登入殼→M3原sales CourseOffer真DB保存→M4交易/指定交付→M5營運/更新。現有Demo只算M1部分，完整UI未做好；不可用13/14或142tests說全部UI完成。

舊卡兩個唯讀reviewer已完成並關閉：missing-product-surfaces測試39mockPASS但缺deactivate UI/operator vs admin.access/DB-workbook與副作用，新增5.1～5.3，歷史9勾保留，新9/12；buyer-journey66mockPASS但有preview文書/canonical role/reader/per-course LINE／deploy evidence矛盾，新增7.1～7.4，原19勾保留新19/23。主控已讀實體coupon頁/notification route/CoursePage/nav-menu source確認關鍵差異，不能封存。詳见creator-sr-closeout-register.md。archive preview conflict_source不是自动真正冲突。歷史QA4/4無delta／warning、修復commit存在；已透過async問完整封存方案，尚無確認故未archive。此輪沒取消未完成需求、沒skip-specs/mark-tasks-complete、沒改業務code/DB/provider/部署/Git。

M1目標是每頁matrix有具體layout/states/routes+1440/390 evidence；首個角色批次60分鐘只是估計，完整工時matrix後校正。M2前置是M1核准+原role語義修正+隔離環境／route owner；M3用原sales不重開四商品真相。总表与小SR文件未commit/push，不說全收尾完成。下方原「下一個CourseOffer切片」被新順序取代，先M1完整设计。

### 2026-10-13 最新：總SR清單與規劃差異對焦報告

Fish要求先看總SR表、規劃流程及目前／下一步差異。本輪只盤點／寫報告，不啟動正式UI接線。入口docs/blueprint/creator-sr-roadmap-alignment.html，證據creator-sr-audit-register.md。spectra即時8進行中／1暫存／3全勾，未改舊checkbox或封存。核對正式NavBar已呼叫resolveNavigation；newsletter render/audience/send-engine已有實作，focused3檔24PASS，ToSend前置已封存；公開課程API5PASS、歡迎信邏輯12PASS、本機＋上線報表工具154PASS。上述都是局部/工具測試，不真付款／寄信／DB／雲端rollback驗收。電子報清單落後與buyer-journey全勾卻留待上線文字需後續補正；不按待辦再重寫。候選正式UI接線SR仍未建立/施工，先統一路由owner後給Fish確認。已有Demo／正式地基保留；下一個最小正式切片建議是現有CourseOffer在真本機後台新增、重新登入可改。新報告未commit/push，未部署，不宣稱全SR code/部署已審完。

### 2026-10-13 最新：獨立 UI 施工 SR 已規劃，等待確認

Fish已確認「之前的內容不會被破壞就開始做」：creator-backoffice-local-acceptance已unpark並開始apply；主控先固定共用介面再派三worker，各自新增role view/test。舊UI備份、model/storage/navigation保留，baseline30tests PASS；開始時113條dirty保留。總藍圖未完成11.4／11.5已正式移交，不勾成完成。原未保存表單的新保護會在shared殼整合，三views未完整驗證前不切入口。施工證據在docs/blueprint/creator-backoffice-implementation-evidence.md；下方等待確認是前一輪歷史，不再阻擋本次已核准施工。

本輪最終：三worker完成且關閉，三role實體view接回同一本機入口；focused142PASS、保存回歸92PASS、導航106PASS、最後三角色33PASS、storage/DOM canary8PASS，1440／390真圖主控已看。原model/nav SHA不改、key/version不改，原操作版legacy=1及原report仍在；只清Agent三run精確測試名稱19商品／18快照，保留用戶原4商品／1取得。13／14待Git範圍核准、未stage/commit/push，未部署不archive。正式provider未接，settings/future僅版型提案；主控保留role view的單一caller與不重疊檔案owner。下一步Fish驗收同一本機入口creator-local-acceptance.html，再提交本SR範圍，不混其他dirty修改。

Fish要求先看SR與分工，確認沒問題才開工。本輪只寫計畫：creator-backoffice-local-acceptance已建立proposal／design／一份local-backoffice-acceptance spec／14 tasks，analyze findings空、validate valid，依spectra-propose暫存parked；新SR0／14，尚未派worker、未繼續改UI程式。短對焦文件docs/blueprint/creator-backoffice-dispatch-plan.md。流程：主控先固定共用殼／介面→A管理員、B創作者、C買家各自独立view/test平行→主控整合／本機1440與390驗收→scoped Git交付。核准後才移交總藍圖未完成11.4／11.5本機責任；舊已完成任務與證據保留、不重新算成果。主控不交給worker共用model／navigation／UI檔，不碰apps／packages／DB／provider／部署。未串接業務頁面明示提案，不承諾正式功能已完成。

### 2026-10-13 最新目標重設（優先於全部下方歷史）

導航補正：Fish 再提供 systeme 設定截圖，確認「上方主分類＋左側情境子選單＋右側內容」，不是把功能全放頂部或全放左側二選一。本機 UI 已新增 creator-local-navigation.js，分創作者、平台管理員示意、買家預覽；第11.5是補正，不改11.2既有完成歷史。navigation focused 5＋model25＝30PASS；ego導航106PASS／0FAIL、1440／390，全部子選單及角色示意、資料不變，證據 evidence/navigation-demo-EjX8hq/。管理員、設定及未施工模組只供介面提案，不假報串接或保存。Fish 指出進度慢，最新建議是一份總藍圖保留、另外一張完整本機UI施工SR，內部由三個不重疊角色頁worker平行；目前僅核對工具已提供sub-agent，尚未派工，需就新增分工範圍確認。不必另建workflow產品或自動安裝工具。

Fish 已確認先做本機可操作後台，不再以文書 68／75 作本輪驗收。對應 creator-operations-platform-blueprint 第 11 節：四商品、一次／月／季／年、指定交付、本機保存重整回填、買家示範取得快照、CRM／直播搜尋篩選詳情。單一 Agent；只寫 docs/blueprint 隔離程式，不碰正式付款／寄信／權限／部署。入口 `docs/blueprint/creator-local-acceptance.html` 轉至既有報告 `?localAcceptance=1`，全程標示本機驗收。11.1～11.3 已施工；25 項 model tests 與 84 項 ego-browser 1440／390 操作檢查通過，證據 `evidence/local-acceptance-E4uTvk/`，model 行為 RED 為 22 FAIL／3 PASS，GREEN 為 25 PASS。短路線在 creator-local-acceptance-guide.md。下一步 scoped Git 交付；尚未提交／推送，未部署。新目標不需重寫架構或決定外部供應商；原圖解配色與 P05 政策仍留給正式後續功能，不阻擋本機畫面驗收。工具中的舊 goal 仍為 blocked，工具不允許以新 objective 取代未完成目標；本文件及本 SR 記錄新目標，不能偽稱已重設工具 goal。

### 2026-10-13 接續狀態（本段優先於下方歷史現況敘述）

目前 branch 為 `feature/public-multi-course-sales-and-code-package`。該銷售 SR 位於 active changes，已有公開課程、Offer、結帳、權限、通知與 GitHub 交付的工作樹修改；下方「parked／尚未改 runtime」是先前盤點狀態，不能當目前進度。既有未提交程式修改保留，文件更新不代表它們已驗收。

Fish 已看過 HTML；要求依 Systeme.io 更直覺的後台呈現。新版 Demo 已提交 `1152953a`：頂端分區／單層分類，手機選單與方案卡片。它是 UI 提案；正式導航接線仍須沿用平台 registry／resolveNavigation，沒有改正式網站。

本輪驗收目標是 `docs/blueprint/creator-platform-acceptance-target.md` 的五項交付；開發交接草稿在 `docs/blueprint/creator-platform-development-handoff.md`。本輪已修正 tasks 的重複 3.5 為 3.16，第 9 節明確只寫後續交接卡片，SR 序號不代表施工時間。下一張施工方向是先收尾一次買斷銷售切片，通用 commerce／新訂閱再重用擴充。

十一份規格已補上 111 個具體驗收例子，Spectra 五面向全 Clean／findings 空、validate 通過；例子不是已執行測試。畫面與狀態矩陣在 `docs/blueprint/creator-platform-ui-state-matrix.md`，十五張後續能力／五張既有 SR 的 source／owner 對照在 `docs/blueprint/creator-platform-source-ownership-map.md`；handoff 十五張卡片與施工補充矩陣已審查，實測 21／75 文件待辦，HTML 已同步。依賴表 16 階段節點無缺失前置／循環，06C→11→06R 保持同張 commerce SR 並消除 provider 互等。新依賴圖因 diagram-design 首次樣式 gate 待 Fish 選沿用 HTML 或預設，尚未繪圖，沒有改全域 style-guide。ego-browser 原 spaces 為空，重建 space 1，修正 Demo 搜尋覆蓋篩選並實際驗證空結果／重設焦點／方案預覽與 390px 無溢出，保存六張截圖於 docs/blueprint/evidence/2026-10-13-ui/；證據與未驗收狀態見 creator-platform-ui-browser-evidence.md。完整回填、所有狀態／按鈕／鍵盤／CRM／直播 UI 與全份交叉驗收仍待完成；runtime gates 本輪未執行。

本輪 source 確認：SubscriptionInterval 只有 MONTH／YEAR，季／Bundle／獨立 CodePackage 訂閱是未來擴充；WorkspaceContext 是 platform／app scope，不等於 Organization，需要 SR-01 橋接；buyer-repo-upstream-sync canonical 承諾 writable repo，而 provisionBuyerRepo 實際邀請 pull，SR-04 必須明訂交付倉庫／買家可寫開發倉庫與更新追蹤，不能逕自調整外部權限；repo-version 的 merge hint 不等於安全更新已驗收。

未決訂閱取消、CodePackage license／更新期間／倉庫責任、Funnel 深度、SMS／發票／影音／AI provider、錄影與逐字稿保留政策，依 design Open Questions 與交接卡片逐題處理。本輪文件尚未 commit／push，無新 runtime 修改。

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

2026-10-13 Live原型補充：真實click即時filter原aria不變且2rows，HTML原型加獨立live-kind/filter更新pressed/hidden；script每viewport多三assert，实跑46PASS/0FAIL/exit0。12新圖/result.json持久化evidence/2026-10-13-ui-script-QLKWsh，兩live圖看過；總36圖不是全情境。Live原型dead filters修了，真正影音/role/mutation/all keyboard仍未過，2.8pending/文書68／75，不加runtime勾选，不碰LINE space2/正式服務；未提交／推送。

2026-10-13 UI runner補充：verify-demo-ui.sh使用ego heredoc、核對唯一agent-owned同名space與本機tab，env未傳/contacts selector兩次失敗修腳本後exit0，40 assertions PASS，1440/390與三offer回填/驗證/searchfilter/contacts-live/native typeahead/recover/width。result.json與12張新圖持久化docs/blueprint/evidence/2026-10-13-ui-script-sWRXGe；總24張，3張新圖主控看過。unverified完整keyboard/popup/mutation/roles/provider/rollback，Live filter按鈕無handler仍待，因此2.8pending／文書68／75不變。沒有碰LINE space2/正式服務；新圖/Repo/P05/snapshot/最終/Git待，未提交／推送。

2026-10-13 Native UI補充：spectra-debug隔離readonly browser fixture，Demo及bare popup select有trusted未prevented ArrowDown/Enter但值不改，text可x、probe size3 listbox可a→b；定位native popup/CDP邊界，未修工具或降級Demo設計。fresh原Demo用CDP char「讀」原生typeahead normal→error、trusted change，真實重試回normal/focus，十二張截圖。舊mobile offers回讀無different before不當keyboard PASS，2.8仍pending/文書68／75。scratch tab關閉、focus emulator/listeners恢復；新圖P15/P05/其它gate/Git仍待。沒有改runtime或全域工具設定。

2026-10-13 Secret path補充：已讀auth procedure、submitCredential、allowlist sink、deployment DB/schema、Coolify request/env/restart與handler/logger；handoff七段唯讀追蹤及canary矩陣。顯式日誌/部署metadata不存secret不代表全鏈安全，共用onError logger無專門去敏證據；userId非unique的findFirst不表示多部署目標已選，handler前置是coolifyAppId而非完整tier/target gate。3.9文書核對後68／75，HTML/audit同步；provider mapping、redaction/多target/canary/服務健康仍需實跑，未讀真實secret或callCoolify。剩2.8/3.10/8.2/8.4/8.5/10.1/10.4與新圖/P05/UI/最終/Git待，未提交／推送。

2026-10-13 Policy補充：creator-platform-policy-decision-register.md列已確認能力/程式包五類delivery policy判斷、P01～P15選項/影響SR/未決阻擋與decision版本/核准metadata，一題一題處理，不把自動goal continuation或預選當答覆。3.4/3.16/10.3文書核對後67／75，design/handoff/audit/HTML同步；剩2.8/3.9/3.10/8.2/8.4/8.5/10.1/10.4與Git未完。未知app數/期限/source rights/provider/retention仍未核准，新圖P15也未選；不能為完成清單替Fish定案。

2026-10-13 Evidence/AI補充：逆向清單2.2/2.3有十四代表模組六類頁面/狀態欄位、L1-L10、lineage、八package/app分類與parked快照；SMS/Segments不從樹狀圖擴推已觀察，pending保留，未重登入第三方；parked只有oracle-chatwoot-anti-reclaim-cutover未unpark。事件契約加六工作台任務卡source/owner/action/return与AI context/source/版本binding approval/recheck/audit/buyer隔離，未實作模型。1.1～1.4/7.1/7.5文件核對後64／75，HTML/audit同步；剩11項與UI/source/buyer/repo/credential/snapshot/決策/new圖/最終handoff/Git待，未提交／推送。

2026-10-13 Release補充：handoff增加manifest現行/新增契約、四類檔案、release六部分、expand/migrate/opt-in/contract、六種consumer回歸與owner/rollback/Skill/tier清單；已讀真實app-registration/types/repo-version，不把目前merge hint說成安全updater。3.11～3.13／3.15／8.6文書核對後58／75，HTML/audit同步；3.10／8.5以及其餘17項、新圖配色/UI/source/snapshot/credential/repo/Git待。未merge/reset買家repo、未改DB/env/部署、未提交／推送。

2026-10-13 台灣／課程補充：creator-platform-taiwan-commerce-handoff.md 補最小 sales flow／五模式接口／provider與secret/unknown/rollback／實際zh-tw keys/TWD/UTC／LINE與個資用途／Course九類重用。3.2／4.1～4.5 文書核對後53／75，HTML／audit同步。既有sales design加reuse、pending4.2引用；總藍圖0findings、sales0Critical/Warning但29Suggestions、兩張validate通過。新確認paid-time course grant與通用checkout/agreement完整snapshot時點不同、舊Bundle歷史mapping未完，8.2仍pending；不宣稱已遷移。剩22項／repo/provider/UI／新圖配色/Git待，無runtime/外部副作用，未提交／推送。

2026-10-13 UI 文書補充：ui-state-matrix 對照 Foundation 8／UI 11 情境及實際 schema/nav/form/input/dialog/button，補 actor/org/profile/app bridge、白話術語、十一 screen contracts、list/form/detail/confirm、keyboard/focus/390px/reuse handoff。UI source 正確在 packages/ui/components，不是舊 src/components。nav app-user fallback 不是授權；Creator 不可強迫普通買家建立 org 才能看已購課。七項文件審查後為 47／75，HTML／audit 同步；2.8 可執行 acceptance script／真正 native keyboard／完整角色與 mutation 未通過。其它 28 項、新圖配色／provider／repo／UI／Git 仍待；沒有改 auth/schema/runtime。

2026-10-13 事件／營運補充：creator-platform-event-operations-contract.md 新增 envelope／Outbox／producer-consumer 去重、Campaign 狀態、unknown delivery／安全 retry／resend、schema 欄位來源、收退款與每期 charge 報表、server-scoped export、七類 failure owner、六域 permission/event/retention/rollback。6.1～6.4／7.2～7.4／8.7 文書核對後為 40／75，HTML／audit 同步。Marketing spec 明確 accepted 不等於 delivered，timeout 不足證明沒寄出；provider 無 lookup/idempotency 時先停人工處理。現行 reconciliation／通用 Outbox 不因文件存在就宣稱已實作。剩 35 項、新圖配色、完整 UI／source／repo／provider 實跑／Git 未完成；本輪無外部副作用，未提交／推送。

2026-10-13 買家補充：handoff 新增 license 欄位／決策阻擋、三 hosting tiers owner／transition、下游 SaaS 自有身份與付費頁、版本化手冊／Skill 操作與停止矩陣。3.5～3.8／3.14 文書審查後為 32／75；稽核與 HTML 同步。新確認缺口：credential handoff 三個通用 env key 不同於 PAYUNi／ToSend reader，需 provider-specific mapping 與乾淨專案實跑；managed endpoint 不涵蓋 self-hosted，舊 canonical README Zeabur 與平台 Coolify 指引要核對。3.9／3.10／8.5、repo 移轉、商業 policy 值、其它 43 項／UI／Git／新圖仍未完成。沒有改實際 env／provider／部署或外部權限。

2026-10-13 領域契約補充：creator-platform-domain-decision-tables.md 已核對商品／交易／授權分層、12 個交易例、verified Contact/User link／merge／delete、分眾 operators／同筆 purchase 關聯／clock／snapshot、同意與送達抑制、匯入／匯出／checkpoint。CRM spec 明確 consent grant 不清 bounce，commerce spec 固定 server checkout snapshot 並保留其它有效 grant。task 2.2、3.1、3.3、5.1～5.3 文件核對後為 27／75，HTML／稽核索引同步；111 個例子是文書，不是跑過的測試。新圖配色、repo／license 政策、其它 48 項與 UI／Git 仍待。本輪無 application runtime／provider 變更，未提交／推送。

2026-10-13 全貌補充：新增 creator-platform-capability-catalog.md 的 26 類已知能力／研究 gate，及 creator-platform-completion-audit.md 對原 75 項 tasks 的完整索引。中央藍圖修正 runtime／spec 數／施工順序、Entitlement／CodePackage resource-license-grant 與候選客群；逆向清單不把發票當固定授權前置、不把退款當行銷退訂，十五張能力索引與 handoff 對齊。未自動勾選其餘 54 項，仍 21／75。HTML 五個白話功能分區已實際點擊與桌機／390px 回讀，新增兩張截圖、合計十一張；文字修訂後仍需最終巡查。商機、日曆、SMS、Affiliate、實體與其它資源商品不是遺漏或已施工，而是有 owner 的獨立 research／後續 SR。新圖配色與 Git 仍待，總目標未完成。

2026-10-13 UI 補充：示意後台已補三種方案回填／建立清空、名稱與價格驗證、七種共用狀態／恢復；獨立程式包桌機／390px 回填、錯誤價格焦點及修正預覽實測通過。修正 Demo hidden 被表單 display:grid 蓋過，手機一次付清週期高度回讀為 0，documentWidth=viewport=390。持久化截圖共九張。七種狀態以 DOM change fixture 驗證，不能冒充原生鍵盤操作；完整鍵盤／單課／Bundle／CRM／直播及所有按鈕仍待續查。新流程圖配色仍待 Fish 回答，沒有繪圖或修改全域樣式。

- 上線 preflight 需確認 legacy `startkiter-mvp` 對應的唯一舊課程 ID；若不唯一，backfill 停止並要求明確 mapping。
- 已存在 GitHub repo 的 write 權限需 dry-run 盤點，再安排轉成 pull 唯讀並回讀驗證。
- `buyer-bundle-checkout-entry` task 7.2 的正式站／sandbox 購買驗收仍是獨立 gate。

## 下一步

供應商選擇留給後續 SR：Live video provider、錄影／逐字稿保留政策與 AI provider／資料邊界。總計畫與 HTML 已在本機更新，尚未 commit／push；開始 runtime SR 前，先核對各 capability 的排序與既有 public-multi-course-sales-and-code-package 施工邊界。
