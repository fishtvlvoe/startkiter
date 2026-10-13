<!--
第 1～10 節是「總 SR 計畫」文件工作清單，第 11 節是 2026-10-13 已確認的隔離本機 UI 驗收施工。
每項都必須產出可閱讀的藍圖、對照、規格、驗收矩陣或 SR handoff，並附驗證方式。
後續 runtime SR 仍需各自建立 proposal/design/spec/tasks，不能直接把本文件當成 apply task。
-->

## 11. 本輪優先：本機可操作後台

- [x] 11.1 依「A local acceptance workspace SHALL support isolated product workflows」與 design「本機操作驗收取代文件比例作為本輪目標」建立本機商品與交付 model：四種商品、一次／月／季／年、指定資源、版本化保存、錯誤不覆寫及取得快照；驗證：`node --test docs/blueprint/creator-local-model.test.cjs` 先失敗再通過，不變動正式資料。
- [x] 11.2 [after: 11.1] 重用既有 HTML 樣式建立本機後台：新增／編輯／搜尋／篩選，交付欄位依商品類型顯示，儲存後列表、重整與回填一致；驗證：ego-browser 真實填表、保存、重整、修正錯誤與手機操作。
- [x] 11.3 [after: 11.2] 依「Local buyer and operations previews SHALL be explicitly simulated」完成買家示範視角與 CRM／直播示範：模擬取得只顯示指定快照，無取得時為空，CRM／直播可搜尋篩選查看返回且無外部動作；驗證：ego-browser 桌面與手機逐一操作並回讀指定內容。

2026-10-13 Fish核准獨立UI施工SR。原未完成11.4（本機驗收入口／證據／Git交付）移交creator-backoffice-local-acceptance的3.3／4.1／4.2；原未完成11.5（「Local navigation previews SHALL show contextual submenus」兩層導航及三角色）移交該SR的1.2／1.3／3.3。兩項從本執行清單移出，不算完成；原完成11.1～11.3不變，相關歷史導航證據保留。新SR是後續本機施工唯一owner，本總藍圖仍是架構／研究依據。

- [ ] 11.6 文件交接核對「Local navigation previews SHALL show contextual submenus」：在creator-backoffice-local-acceptance的兩層導航／三角色瀏覽器證據已保存後，只核對原需求到新owner／spec／測試／入口的引用；不在本藍圖再次實作UI。驗證：交接責任無重複、本機入口與新SR證據連結可讀，舊11.4／11.5取消映射保持可追溯。

優先順序調整：先完成第 11 節，舊第 1～10 節未完成文件工作保留但不是這輪 UI 功能驗收前置；取消的是舊「文件比例代表本輪進度」的說法，不把任何舊待辦勾成完成。

## 1. 逆向證據與現況盤點

- [x] 1.1 完成「前次 REA 結果定位為高層藍圖，不是完整功能真相」的來源整理：把已觀察的 Systeme.io dashboard 模組、代表性頁面、StartKiter route、現有 package、active/parked SR 與既有 blueprint 連成 source lineage；驗證：`docs/blueprint/systeme-io-reverse-engineering-checklist.md` 有 A/B/C/D evidence level、來源路徑與未驗證清單。
- [x] 1.2 完成「Systeme.io 高層模組地圖」的模組級盤點：Dashboard、CRM、Site、Email、SMS、Automation、Products、Sales 與 plan-gated Evergreen Webinar 各自列出入口、代表頁面、主要任務、StartKiter 對照與證據等級；驗證：逆向清單第 2 節標示免費帳號實際導覽、官方文件資格與尚未觀察頁面。
- [x] 1.3 完成逆向清單 L1–L10：導覽、頁面、資料、動作、狀態、權限、事件、整合、UX、交付，並增加 Webinar／Live event／AI workflow evidence；驗證：每個已觀察模組至少有列表／建立／編輯／詳情／空狀態／錯誤狀態的盤點欄位，未觀察項標為 pending，不填推測。
- [x] 1.4 完成 StartKiter「已有／部分／缺口／不做」矩陣：對照 `packages/platform`、`packages/course`、`packages/bundles`、`packages/payments`、`packages/newsletter`、`packages/github-kit`、`apps/saas` 與 `apps/marketing`；驗證：矩陣每列有 reused／extended／new／out-of-scope 分類與候選 SR。
- [x] 1.5 補充 WebinarJam Webinar 清單與新增設定入口的比較觀察，並區分畫面證據、StartKiter 設計推論及未觀察流程；驗證：`docs/blueprint/webinarjam-reverse-engineering-notes.md` 列出 REA evidence ID、隱私處理與未驗證清單，且沒有保存活動名稱或帳戶資料。
- [x] 1.6 補齊 WebinarJam Full configuration 的場次選擇與初始設定畫面、Analytics 篩選／Export 狀態、Active registrants／Auto-subscribers 入口與空結果；驗證：比較觀察紀錄列出相應 REA evidence ID，沒有保存 Webinar 名稱、名單欄位值或聯絡資料，且明確標示尚未完成的流程。
- [x] 1.7 確認 Express 初始設定與 Full 串流服務選單的差異，並記錄 webinar scheduling mode、delivery mode、provider 三者不可混為一談；驗證：REA 紀錄列出 Express 頁的可見區塊、Full 頁的 WebinarJam Live／YouTube Live／Facebook Live 選項與 evidence ID，且明確標示未選 provider、未授權第三方、未儲存 Webinar。

## 2. 平台與身份邊界

- [x] 2.1 完成「The platform SHALL expose one creator workspace context」與「以 Creator Workspace 作為所有日常操作上下文」的資料責任與 workspace scope：固定 Organization、Member、Invitation、CreatorProfile、capability 的關係；驗證：blueprint domain model、glossary 與 `creator-platform-foundation/spec.md` 的 owner／permission scenario 互相一致。
- [x] 2.2 完成「A contact SHALL be independent from a user account」的 identity link、匿名 Contact、註冊後關聯、合併與刪除邊界；驗證：`creator-crm-and-audience/spec.md` scenario matrix 能區分 User lifecycle 與 Contact lifecycle。
- [x] 2.3 完成「Navigation SHALL be task-oriented and capability-aware」的 Creator Operations Shell 導覽契約；驗證：每個核心任務有唯一入口、角色不足有 denied path，且不再要求使用者猜 `/course`、`/admin/course` 或其他內部路由。
- [x] 2.4 完成「The platform SHALL use one shared page-state contract」的共用頁面狀態契約；驗證：blueprint 與後續 UI SR template 明確列出 loading、empty、error、success、disabled、permission denied、retry。
- [x] 2.5 完成「Desktop and mobile SHALL preserve the same core task」的 desktop／390px flow 矩陣；驗證：每個核心任務都有桌面與手機操作路徑、水平溢出檢查與 ego-browser acceptance gate。
- [x] 2.6 完成「Creator screens SHALL expose a task-oriented screen contract」的 screen purpose、primary task、primary action、permission boundary 與 recovery path；驗證：creator-ui-ux-foundation spec 與每張後續 UI SR 的 screen contract review 通過。
- [x] 2.7 完成「Creator management screens SHALL use a shared interaction contract」的列表、表單、詳情、action menu、validation、save feedback 與 destructive confirmation 規則；驗證：共用 page/list/form/state contract matrix 與 empty／invalid／save scenarios 審查通過。
- [ ] 2.8 完成「Creator workflows SHALL preserve the same core task on desktop and mobile」的 390 CSS pixel responsive flow、progressive disclosure、primary action 與無水平溢出契約；驗證：desktop/mobile flow review 與 ego-browser acceptance script 審查通過。
- [x] 2.9 完成「Creator screens SHALL be keyboard and focus operable」與「UI design handoffs SHALL map screens to reusable StartKiter UI contracts」的 keyboard order、focus、semantic label、SVG icon、handoff 與 custom interaction 規則；驗證：keyboard／focus checklist、design handoff template 與 icon-assets check 審查通過。

## 3. 內容、商品與交付模型

- [x] 3.1 完成「Content and sellable products SHALL have separate responsibilities」的 ContentResource、Product、Offer、Order、Subscription、Entitlement、CodePackage mapping；驗證：blueprint 第 6 節領域模型與 `creator-content-and-commerce/spec.md` 不再把 Course、Bundle、Offer、CodePackage 混成同一實體，並把外部 GitHub grant 與源碼／更新授權分開。
- [x] 3.2 完成「Existing course operations SHALL remain reusable」的 reuse boundary：標出 Course、Chapter、Lesson、Assignment、Quiz、Review、Media、LINE invite、welcome email 哪些保留原契約；驗證：`public-multi-course-sales-and-code-package` 的 scope matrix 明確列 reused／extended／new，且不重建既有 Course 真相。
- [x] 3.3 完成 Bundle 的課程集合、歷史快照與交付規則；驗證：單堂 Offer 只授予一門 Course、Bundle Offer 只授予 Bundle 內 Course、登入平台不等於全站課程權限的 scenario matrix 通過審查。
- [x] 3.4 完成「CodePackageProduct 可獨立販售，交付政策由 Offer 決定」與 CodePackage eligibility 的獨立交付規則；驗證：standalone CodePackage、Course／Bundle／Subscription Offer、每位買家最多一個 repo、perpetual／active_period／none policy、退款與取消重算案例均列入 decision table。
- [x] 3.5 完成「CodePackage buyer usage is a separate product-to-deployment boundary」：定義 buyer-owned SaaS、license、app/workspace 數量、更新期間、商業使用、支援層級與撤銷條件；驗證：CodePackage license matrix 與 buyer-saas-extension-and-deployment spec review。
- [x] 3.6 完成「A CodePackage product SHALL grant a buyer-owned SaaS source license」：定義 standalone／attached Offer、license scope、app/workspace count、commercial use、update policy、support tier；驗證：CodePackage license matrix 與 standalone／Bundle purchase scenarios review。
- [x] 3.7 完成「A buyer-built SaaS SHALL own its downstream access model」：定義買家終端使用者、Organization、permissions、subscription、billing、protected page 與 StartKiter learner entitlement 的邊界；驗證：downstream access flow 與 organization／subscription source-of-truth review。
- [x] 3.8 完成「Buyer deployments SHALL use an explicit hosting tier」：沿用 self-hosted／managed／advanced tier、owner、infrastructure、support obligation 與 tier transition；驗證：既有 `managed-hosting-tiers`、`official-site-deployment` 與 deployment flow 對照。
- [x] 3.9 完成「Buyer credentials and third-party accounts SHALL remain buyer-owned」：定義 email、payment、DNS、Cloudflare、database credential handoff、allowlist 與不落庫／不進 log；驗證：`buyer-credential-handoff` spec、secret path audit、non-allowlist denial scenario review。
- [ ] 3.10 完成「Buyer source updates SHALL be reviewable and support boundaries SHALL be explicit」：定義 upstream version、conflict、accept/decline、rollback、managed／self-hosted support boundary；驗證：`buyer-repo-upstream-sync`、`buyer-dev-skill` 與 update failure flow review。
- [x] 3.11 完成「Official modules SHALL attach through stable extension contracts」：定義 App/plugin registration、mount、capability、permission、owner、event、provider adapter 與 UI handoff；驗證：`app-extension-contract` 對照與 CRM module registration rejection scenario review。
- [x] 3.12 完成「Core and module changes SHALL preserve compatibility before contraction」：定義 expand／migrate／contract、feature flag、release channel、read-back 與舊 consumer compatibility；驗證：schema／event／route migration matrix 與 feature flag scenario review。
- [x] 3.13 完成「Buyer updates SHALL protect buyer custom code」：區分 core、official module、generated、buyer custom files，並定義 conflict preview、migration、env changes、test與 rollback；驗證：buyer update preview 與 conflict pause scenario review。
- [x] 3.14 完成「AI operation skills SHALL be versioned with the platform contract」：定義 `AGENTS.md`、`CLAUDE.md`、Codex／Claude Code skills、onboarding、update、troubleshoot、deploy 的版本相容與 permission check；驗證：skill version mismatch 與 supported module request scenario review。
- [x] 3.15 完成「Every platform update SHALL have a rollback and evidence contract」：定義 migration、flag、compatibility、API／browser smoke、deployment evidence、rollback owner；驗證：release evidence matrix 與 migration failure scenario review。
- [x] 3.16 完成 subscription target 與週期決策：單堂、Bundle、月、季、年、取消收回時間、是否包含 CodePackage；驗證：Open Questions 轉成一題一題可拍板的 decision table，未拍板內容不進 runtime task。

## 4. 台灣內容與交易流程

- [x] 4.1 完成「A creator SHALL manage a simple website and sales flow」的最小銷售流程邊界：公開頁、表單、CTA、Offer、checkout、thank-you、交付頁；驗證：creator content/commerce spec 與逆向清單對照出第一條垂直切片，不把完整 Funnel builder 混進第一張施工 SR。
- [x] 4.2 完成「Offers SHALL connect to Taiwan checkout and order records」的 Product／Offer／Order／PAYUNi／Invoice 接口矩陣；驗證：每個付款模式都有 server-side price、currency、payment state、webhook、refund、invoice 與 entitlement owner。
- [x] 4.3 完成「Workspace display defaults SHALL be Taiwan-ready」的 locale、TWD、Asia/Taipei、地址、電話與顯示規則；驗證：taiwan localization spec、blueprint workspace defaults 與現有 i18n／payments 契約一致。
- [x] 4.4 完成「Payment and invoice providers SHALL be isolated behind adapters」的 provider port／adapter／secret／fail-closed／rollback 矩陣；驗證：既有 PAYUNi、invoice、email、LINE adapter 路徑與未決 SMS provider 分離，沒有新增未拍板 provider。
- [x] 4.5 完成「LINE identity and messaging SHALL keep separate purposes」與「Personal-data processing SHALL be consented and auditable」的 LINE Login、課程邀請、客服 Messaging、行銷用途邊界；驗證：每種用途有不同 consent、API、permission、failure mode 與不可靜默入群規則，並可回讀 consent／audit evidence。

## 5. CRM 與名單

- [x] 5.1 完成「Creators SHALL manage tags and deterministic segments」的 Tag／Segment 規則：輸入欄位、比對運算、更新時機、快照與 audit；驗證：segment 結果可由同一組資料重算，禁止 AI 自行決定受眾。
- [x] 5.2 完成「Consent and suppression SHALL control outreach eligibility」的目的、來源、版本、退訂、suppression、恢復寄送與刪除邊界；驗證：CRM、newsletter、automation、LINE／SMS future adapter 使用同一 consent contract。
- [x] 5.3 完成「Contact imports and exports SHALL be safe and reviewable」的匯入預覽、欄位映射、重複處理、錯誤列、dry-run、匯出權限與 audit；驗證：匯入不會未經同意加入可寄送受眾，失敗資料可回讀。

## 6. 行銷與 Automation

- [x] 6.1 完成「A creator SHALL compose and schedule a campaign」的 Campaign／Template／MessageRevision／Recipient snapshot／排程／測試寄送流程；驗證：可描述草稿、預覽、測試、排程、取消、寄送與結果頁的完整狀態機。
- [x] 6.2 完成「Automation SHALL be driven by durable events」的 domain event、transactional outbox、enrollment、step execution、idempotency、retry、dead-letter 契約；驗證：`order.paid`、`contact.created`、`form.submitted`、`consent.revoked` 等事件都有 producer、consumer、重播與不重複 side effect 規則。
- [x] 6.3 完成「Provider delivery SHALL expose observable outcomes」的 provider reference、delivery attempt、狀態、錯誤、重試、人工重送與告警；驗證：email／newsletter 現有 delivery log 能映射到通用 contract，外部 provider 失敗不吞掉 actionable error。
- [x] 6.4 完成「Marketing actions SHALL honor consent and unsubscribe」的寄送前 eligibility check、退訂 suppression、目的分離與回放規則；驗證：consent revoked 後既有排程、automation enrollment、手動寄送與 API 均不會再次寄送。

## 7. 營運、分析與支援

- [x] 7.1 完成「The operations home SHALL show actionable creator status」的工作台卡片：待回覆、付款失敗、寄送失敗、待發布、待審核、待處理訂單；驗證：每張卡片都能進入一個可完成任務，不只顯示統計數字。
- [x] 7.2 完成「Domain events SHALL support deterministic reporting」的 AnalyticsEvent、事件命名、workspace scope、時間、來源、去重與報表重算規則；驗證：營收、轉換、名單、內容使用、寄送與付款報表能由事件或明確 read model 重現。
- [x] 7.3 完成「Exports SHALL be permission-aware and reproducible」的匯出 scope、欄位、版本、時間範圍、owner、權限與 audit；驗證：同一輸入條件可產出可追溯結果，跨 workspace 資料不洩漏。
- [x] 7.4 完成「Operational failures SHALL produce actionable alerts」的失敗分類、告警、通知、retry、dead-letter、客服案件與人工處理入口；驗證：付款、寄信、webhook、automation、migration failure 各有 owner 與下一步。

- [x] 7.5 完成 Creator AI assistance 的 workspace permission、data source provenance、draft／approval／audit 邊界；驗證：creator-ai-assistance/spec.md 中跨 workspace denial、未經核准不執行 side effect、來源可回讀三種情境互相一致。

## 8. SR 總計畫與既有 SR 對接

- [x] 8.1 完成 reused／extended／new 對照：把 `role-based-workspace-navigation`、`app-feature-surfaces`、`newsletter-automation-integration`、`buyer-bundle-checkout-entry`、`platform-launch-verification-evidence` 與本總計畫逐一標責任；驗證：沒有兩張 SR 同時擁有同一資料真相或同一 route 的施工責任。
- [ ] 8.2 完成 `public-multi-course-sales-and-code-package` 的總計畫對接：它必須重用 Product／Offer／Entitlement／CodePackage contract，並補上 Bundle／Subscription 的決策邊界；驗證：該 change proposal/design/tasks 與本 blueprint 對照表無矛盾。
- [x] 8.3 完成後續 SR cards：每張 SR 都列目標、前置、輸入、輸出、涉及 package、migration、provider、browser／payment／email gate、rollback 與不做範圍；驗證：可由本 tasks 第 9 節對應卡片、施工補充矩陣與依賴表建立下一張 proposal，不把能力索引當嚴格施工順序。
- [ ] 8.4 依「SR 採垂直切片與 expand → migrate → contract」與「Commerce 與 provider 不互等，採同張 SR 內的契約／整合階段」完成總體依賴圖與 rollout matrix：以 handoff 的 06C → 11 → 06R 保持商品契約、provider 與整合順序；workspace、contact/consent、operations home、campaign/automation、site/funnel、analytics/export、live、AI、mobile/accessibility 與 rollout 各自對照前置；驗證：每個節點有 blocked-by、進入條件、退出條件與 evidence，沒有缺失前置或循環。
- [ ] 8.5 完成 buyer SaaS 使用流程對接：CodePackage claim → clone/install → buyer app auth/org/permissions/subscription → buyer deployment → upstream update → support boundary；驗證：流程圖、責任矩陣與既有 buyer/deployment specs 無重複或衝突。
- [x] 8.6 完成 core／official module／buyer custom 的責任與更新矩陣：把 App extension、buyer repo upstream sync、deployment tier、AI skill version、feature flag、rollback evidence 串成同一個 release contract；驗證：總體 architecture map、module catalog、source lineage 與 release checklist 對齊。

- [x] 8.7 完成「直播與 Evergreen Webinar 是兩種交付模式，影音服務透過 provider adapter」與「Creator AI uses a workspace-scoped tool gateway with human approval」的擴充矩陣；驗證：Live media provider、creator AI tool、CRM／Offer／Automation／Analytics 的 owner、permission、event、retention 與 rollback 邊界都有明確輸入與後續 SR。

## 9. 後續 SR 交接卡片與驗收矩陣

本節只完成交接卡片的內容審查，不執行後續 runtime。SR-01 等是能力索引，不是嚴格時間順序；實際前置以 `docs/blueprint/creator-platform-development-handoff.md` 為準。每張卡片列出輸入、交付、修改邊界、待決問題、未來驗收與回滾；卡片審查通過不代表其中功能完成。

- [x] 9.1 完成 SR-01 `creator-platform-foundation`：workspace context、task navigation、page-state、desktop/mobile contract的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：creator-platform-foundation spec scenarios、type-check、browser navigation evidence。
- [x] 9.2 完成 SR-02 `creator-ui-ux-foundation`：task-oriented screen contract、shared list/form/state、responsive、keyboard、focus、design handoff的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：creator-ui-ux-foundation spec scenarios、design handoff review、desktop／390px browser evidence。
- [x] 9.3 完成 SR-03 `platform-extension-and-update-contract`：App／plugin extension、compatibility、buyer custom protection、AI skill version、release evidence、rollback的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：extension registration、version mismatch、conflict pause、failed release scenarios。
- [x] 9.4 完成 SR-04 `buyer-saas-extension-and-deployment`：CodePackage license、buyer-owned SaaS、self-hosted／managed／advanced deployment、credential handoff、upstream sync、support tier的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：buyer/deployment specs、clone/install/deploy/update flow 與 credential secrecy review。
- [x] 9.5 完成 SR-05 `creator-crm-and-audience`：Contact、identity、Tag、Segment、Consent、Suppression、import/export的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：CRM unit/integration、privacy boundary、import dry-run/read-back evidence。
- [x] 9.6 完成 SR-06 `creator-offer-commerce`：Product、Offer、Course、Bundle、CodePackage Product、一次買斷、Subscription、歷史 entitlement的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：server catalog、PAYUNi notify、refund、course access、CodePackage policy、Bundle integration tests。
- [x] 9.7 完成 SR-07 `public-multi-course-sales-and-code-package`：公開課程、單堂／Bundle Offer、CodePackage、LINE、welcome email的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：桌面／390px、PAYUNi sandbox、email、GitHub pull permission、退款保留資格 evidence。
- [x] 9.8 完成 SR-08 `creator-operations-home`：待辦、失敗、待發布、待回覆與任務返回的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：每個 dashboard card 都有成功、empty、error、permission denied、retry flow。
- [x] 9.9 完成 SR-09 `creator-marketing-automation`：Campaign、Automation、Outbox、Enrollment、Delivery、Retry、Unsubscribe的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：事件重播、重複 webhook、suppression、provider failure 與人工重送 tests。
- [x] 9.10 完成 SR-10 `creator-site-and-funnels`：Site、Page、Form、Funnel、FunnelStep、CTA、reserved routes的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：公開頁、表單建 Contact、Offer CTA、手機 flow、CMS collision denial。
- [x] 9.11 完成 SR-11 `taiwan-billing-and-compliance`：PAYUNi、Invoice、TWD、timezone、consent、LINE purposes、subscription的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：provider sandbox／invoice／consent／LINE purpose／rollback evidence。
- [x] 9.12 完成 SR-12 `creator-analytics-and-export`：事件、營運報表、匯出、Audit、failure alerts的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：重算一致、權限範圍、匯出 read-back、告警回應證據。
- [x] 9.13 完成 SR-13 creator-live-and-webinar：「Creator webinars SHALL distinguish live events from evergreen webinars」、「Live streaming SHALL use an explicit provider adapter」、「Webinar registration and attendance SHALL integrate with CRM, offers, and automation」、「Webinar session outcomes SHALL feed replay, analytics, and operations」、「A creator SHALL manage webinar lifecycle safely」、「Webinar analytics and registrant review SHALL use explicit filters」及「WebinarJam 參照只用於管理流程，不當成影音技術證據」的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：Live 與 Evergreen 狀態圖、provider failure／duplicate webhook、Consent／Order／Entitlement flow、safe clone/archive、webinar/session/event 篩選、空狀態、export scope、活動紀錄及 390px browser evidence；WebinarJam 未觀察流程先補 REA evidence，不由介面入口推定。

- [x] 9.14 完成 SR-14 creator-ai-assistance：「AI SHALL operate within the actor's workspace permissions」、「AI-generated external and consequential actions SHALL require human review」、「AI outputs SHALL preserve source and decision provenance」、「Creator AI assistance SHALL remain separate from buyer CodePackage development agents」的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：跨 workspace denial、人工核准前不送信／不改訂單／不改授權、資料來源追溯與買家 CodePackage 資料隔離 scenarios。
- [x] 9.15 完成 SR-15 `mobile-accessibility-and-rollout`：390px、keyboard、focus、page states、browser acceptance、production rollout的交接卡片；驗證：交接文件對應卡片具備前置、輸入、輸出、owner、決策阻擋與回滾。後續施工驗收目標：桌面／390px browser、部署後 API／UI／rollback evidence。

## 10. 文件一致性與交接

- [ ] 10.1 完成 proposal、design、十一份 specs、tasks、blueprint 與 reverse checklist 的交叉檢查；驗證：`spectra analyze creator-operations-platform-blueprint --json` 無 Critical／Warning。
- [x] 10.2 完成 Spectra schema validation；驗證：`spectra validate creator-operations-platform-blueprint` exit 0。
- [x] 10.3 完成總計畫 handoff review：明確列出 Bundle subscription、CodePackage inclusion、SMS、Funnel depth、Invoice provider、Live video provider、recording／transcript retention、AI provider／approval 與尚未取得的 Systeme A 級證據；驗證：CONTEXT.md 的未解問題、design Open Questions 與本 tasks 對齊。
- [ ] 10.4 完成 apply gate：確認本 blueprint 只負責規格與計畫，後續 runtime SR 已有獨立 proposal/design/spec/tasks；驗證：不直接執行 `spectra apply creator-operations-platform-blueprint`，並在 handoff 中列出下一張可施工 SR。
