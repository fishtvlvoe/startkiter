# Creator 平台開發交接

日期：2026-10-13
對應：`creator-operations-platform-blueprint`
狀態：十五張卡片的內容與施工補充矩陣已審查；依賴表無缺失前置／循環。全份藍圖交叉核對、HTML 同步與 UI 巡查仍待驗收，不能據此宣稱功能或總藍圖已全部完成。

2026-10-13 更新：十一份規格已補齊 111 個具體驗收例子，Spectra 分析與結構驗證通過。畫面交接依 [UI 畫面與狀態驗收表](creator-platform-ui-state-matrix.md)；例子不是已跑的測試。來源與既有 SR 責任已對照；下方卡片、施工補充矩陣與依賴表共同構成完整交接，UI Demo 巡查及全份交叉驗收仍待完成。

來源與 owner 的逐張對照見 [施工責任表](creator-platform-source-ownership-map.md)。已核對五張既有 SR 與十五張後續能力的分工；十五張卡片已補進出條件、migration、provider、不做範圍與回滾責任。UI Demo 巡查與全份交叉驗收仍未完成。特別注意：季訂閱尚未有現行 enum；Organization context 與 App workspace 需要橋接；canonical 的 writable repo 與目前 pull 交付未一致；現行版本提示尚不具完整安全更新 gate。

## 下一張工作

先收尾正在修改的 `public-multi-course-sales-and-code-package`。它交付「公開課程 → 選一次買斷方案 → 登入 → PAYUNi → 精確課程資格 → LINE／Email → 同一 CodePackage」。不需要等完整 CRM、Funnel 或直播；必須先完成歷史訂單映射與通用商品邊界對照。

總藍圖中的 SR-01～15 是能力索引。銷售切片已在工作樹施工，後續不能用序號要求從零重建。`creator-offer-commerce` 負責更通用的商品／訂閱／交付政策，重用切片產生的 CourseOffer、訂單快照及外部交付結果。

### 銷售切片進入與退出條件

| 階段 | 條件 |
| --- | --- |
| 進入 | proposal／design／spec／tasks 一致；確認目前實作差異、legacy 指定課程、隔離資料庫、Bundle 舊路徑責任；一次買斷 TWD 的範圍不混入新訂閱 |
| 退出 | 公開目錄不顯示草稿；登入回來保留所選 Offer；價格由伺服器決定；付款通知重播不重複授權；買家只看已買課程；多買不建立第二個 repo；退款保留其他有效訂單資格 |
| 外部證據 | 該 SR 的桌機／390px、PAYUNi sandbox、真實 Email、GitHub pull 權限、部署回讀與回滾各自記錄；單元測試不能替代 |
| 回滾 | 關閉新入口並保留歷史 Order／Entitlement；additive migration 不以刪除交易或買家倉庫恢復舊版；外部撤銷按現行退款契約 |
| 責任 | Course／Lesson 仍由課程模組管理；CourseOffer 管銷售條件；付款模組管訂單狀態；Entitlement 管觀看；github-kit 管外部交付 |

## 商品矩陣

| 販售內容 | 收費方式 | 交付邊界 | 政策狀態 |
| --- | --- | --- | --- |
| 單堂課 | 一次買斷 | 一個指定 courseId；不取得其他課程 | 目前切片 |
| Bundle | 一次買斷 | 付款當下指定課程集合的快照 | 沿用既有 Bundle，補相容性驗收 |
| 獨立 CodePackage | 一次買斷或月／季／年 | 程式包授權，不必綁課；平台目前單一 template、每人最多一個 repo | 通用 commerce 後續規格；價格、授權數量、更新期限需拍板 |
| 單課／Bundle 訂閱 | 月／季／年 | 指定內容有效期間；取消／付款失敗後的期限須明訂 | 週期能力保留；新 Offer 的取消政策未定案 |
| 課程附程式包 | Offer 設定 | 課程資格與 repo／更新資格分開保存 | 目前切片提供同一程式包；未來可用 none／perpetual／active_period |

程式包原始碼已交付後不能靠撤銷 GitHub 權限抹除買家已下載副本。`active_period` 要明確區分服務存取、更新頻道、GitHub grant 和已交付原始碼的授權條款；條款未決定前不得承諾可收回已下載程式。

## 買家從程式包到自己的 SaaS

| 流程 | 我們交付的東西 | 買家／AI 的工作 | 驗收結果 |
| --- | --- | --- | --- |
| 取得 | Repo、版本、授權、更新／支援說明 | 開啟有資格的私人 repo | 看得到正確版本與權限 |
| 開啟專案 | README、AGENTS.md／CLAUDE.md、相容版本的 Skill | 桌面 AI 的專案／Code 模式讀取資料夾，先做環境檢查 | 列出缺少設定與下一步；一般聊天模式不承諾能改檔 |
| 設定與啟動 | 安裝、設定清單、故障處理說明 | AI 執行必要命令；買家提供其服務帳號，憑證留在其環境 | 本機登入與受保護頁面正常，缺憑證有清楚提示 |
| 建立服務 | 模組註冊／權限／付費入口慣例 | 買家自己的登入、客戶、收費和訂閱 | 終端客戶的付費資格由買家服務判斷，不用 StartKiter 課程資格 |
| 部署 | self-hosted／managed／advanced 指引 | 依 hosting tier 設主機、網域與第三方服務 | HTTPS、登入、付款回調和維運責任各有證據 |
| 更新 | 版本差異、相容矩陣、遷移、Skill 更新 | 先備份／預覽；有客製衝突就停在衝突列表 | 保留客製、資料和既有服務；可退回先前版本 |

這是交付契約；操作手冊與 Skill 的本機實跑是 SR-04 的退出條件，不能因矩陣寫好就說買家安裝已可用。

## 所有 SR 的共用交接規則

SR-07／06／10／11 與原 course／mail／LINE modules 共用 [台灣交易與課程重用交接](creator-platform-taiwan-commerce-handoff.md)：最小銷售閉環、server catalog／支付／發票／資格、locale/TWD/UTC、provider／secret／failure／rollback、LINE／個資用途與原 Course 功能 owner。單課關聯鎖定不代表通用 checkout snapshot 或舊 Bundle 歷史 mapping 已完成。

SR-03／09／12／13／14 的 producer、consumer、事件去重、unknown delivery、安全重試、報表口徑、匯出與 retention／rollback，一起遵循 [事件與營運契約](creator-platform-event-operations-contract.md)。沒有驗證的 provider 能力不宣稱可用；accepted、delivered、模型草稿與真實 domain side effect 分開。

SR-05／06／07／09／11／12 的交易資格、名單關聯、分眾、同意與批次資料處理共同對照 [領域判斷表](creator-platform-domain-decision-tables.md)；consumer 不自行發明退款就退訂、重新同意就清掉 bounce、無效 Segment 退回全名單等規則。未決 license／provider／repo 政策仍依原決策 gate，判斷表不代替核准。

每張施工 SR 建立自己的 proposal／design／spec／tasks；使用既有 AppRegistrationManifest、權限、UI 和 provider adapter。資料只用 migration 演進；先增加新契約，舊路徑並存，分批回讀，再移除舊形狀。

| 必填欄位 | 內容 |
| --- | --- |
| 輸入 | 既有 spec、實際 source、被依賴 SR、待決政策 |
| 輸出 | 使用者能完成的一條流程與資料責任 |
| 修改邊界 | 哪個模組 owns 哪個 route／table／事件，哪些沿用 |
| 驗收 | 邏輯、資料、API、桌機／手機、外部服務、部署分別列證據 |
| 回滾 | 關閉入口／flag、保留資料／稽核、客製衝突處理、責任人 |

## SR-01～04：共用地基與買家交付

### SR-01 creator-platform-foundation

- 輸入／前置：現行 workspace/navigation 與 App registry、organization-tenancy；依施工責任表把 Organization scope 與 platform／app scope 橋接，不假設 appId 就是 organizationId。
- 交付／owner：平台解析 actor、workspace、capability，給所有模組唯一權限與入口；沿用 packages/platform，不另建租戶真相。
- 驗收：有權限者只見允許入口；未加入工作區看到設定／邀請；直接輸入禁止 route 不洩漏資料。
- 回滾：保留舊導航 adapter，用 flag 切回；workspace 資料保留。

### SR-02 creator-ui-ux-foundation

- 輸入／前置：SR-01 的權限；HTML Demo 與 screen contract 作設計參考。
- 交付／owner：共用 page/list/form/state。頂端分區、單層選單是提案；正式接線仍走同一 resolveNavigation，不能讓 HTML 選單成新真相。
- 驗收：桌機列表／編輯／返回；390px 用卡片呈現價格、狀態與操作；鍵盤焦點、空資料、錯誤、無權限和重試有明確路徑。
- 回滾：共用 shell 可切回舊版，不能刪原 route；視覺 Demo 不算 runtime 驗收。

### SR-03 platform-extension-and-update-contract

- 輸入／前置：SR-01、02 與既有 app-extension-contract、buyer-repo-upstream-sync。
- 交付／owner：註冊／版本相容、事件／API 版本、官方 core/module/custom 邊界與更新預覽；現有 repo-version 的 fetch／merge hint 不算已具備備份、衝突預覽與 Skill 版本檢查。
- 驗收：不合法模組拒絕註冊；版本不符解釋原因；客製衝突停下；失敗更新保留舊服務與資料。
- 回滾：停用新增模組／release channel，保留舊 consumer；不得整包覆蓋買家 repo。

### SR-04 buyer-saas-extension-and-deployment

- 輸入／前置：SR-03、CodePackage 版本、現有 hosting tiers／credential handoff。
- 交付／owner：買家手冊、版本化 Skill、桌面 AI 安裝／排障／部署／更新流程；買家自己 owns 終端客戶與收款。
- 決策阻擋：授權 app 數、更新期限、商用與支援 tier；canonical writable repo 與 pull 交付衝突，需先定義交付 repo／買家開發 repo 的 owner、push、版本追蹤與移轉。未解決前不承諾能 push 回交付 repo；也不逕自改客戶 GitHub 權限。
- 驗收：拿一份乾淨買家專案，照手冊完成本機、付費頁面與指定 tier 部署；Skill 版本不符時停下並提示；秘密不進 repo／log。
- 回滾：可退回 template／Skill 版本；買家客製和資料保留。

## SR-05～08：客戶與交易

### SR-05 creator-crm-and-audience

- 輸入／前置：SR-01、02、03；現有 User、名單與 consent source mapping。
- 交付／owner：Contact 與 User 分開；Tag、Segment、同意／退訂、匯入預覽與匯出，由 CRM owns。
- 驗收：未登入聯絡人可存在；註冊後正確關聯；同一規則可重算分群；退訂不被匯入恢復；跨工作區不可讀／匯出。
- 回滾：停用新增匯入與行銷 consumer；保留已撤回同意與來源紀錄。

### SR-06 creator-offer-commerce

- 輸入／前置：SR-07 的已驗收一次買斷切片及資料快照；SR-03；需要 CRM linkage 時引用 SR-05。
- 交付／owner：將 CourseOffer 擴展到單課／Bundle／獨立 CodePackage 和新訂閱政策；沿用付款／內容／GitHub 模組。
- 決策阻擋：新訂閱的到期／取消、程式包 license／更新政策、未來價格；保留既有 MONTH／YEAR 單課 recurring 能力，季／Bundle／獨立 CodePackage 是擴充目標，需 migration、provider 映射及證據，不是現有能力。
- 驗收：歷史交易不受改價／改 Bundle 污染；不同 Offer 只授予其範圍；重播付款與退款不重複交付；程式包單賣不暗授課程。
- 回滾：保留已售 Offer、歷史快照與既有訂閱；新 Offer 先停止銷售，不刪除交易。

### SR-07 public-multi-course-sales-and-code-package

- 輸入／前置：本交接文件「下一張工作」；此 SR 已有程式修改，先按實際 diff 核對。
- 交付／owner：公開銷售、一次買斷 CourseOffer、精確權限、課程通知、唯一 CodePackage；不是新 CRM／訂閱 implementation。
- 驗收／回滾：依開頭進入／退出矩陣與其既有 tasks；不重做 buyer-bundle-checkout-entry。

### SR-08 creator-operations-home

- 輸入／前置：SR-01／02、付款／課程／寄信的實際來源；待 CRM 存在再接名單。
- 交付／owner：可返回任務的待辦、失敗、待發布、審核與最近動態；報表來源不造假。
- 驗收：每個可點卡片到對應任務；缺資料顯示不可取得而非 0；日期範圍與來源一致；權限不足不暴露紀錄。
- 回滾：停用新讀模型與卡片，原任務入口仍可使用。

## SR-09～12：行銷與營運

### SR-09 creator-marketing-automation

- 輸入／前置：SR-05 Consent、SR-03 event contract、既有 newsletter-automation-integration／mail provider。
- 交付／owner：Campaign、recipient snapshot、Outbox、Enrollment、Delivery、Retry、Unsubscribe；先完成一條歡迎流程。
- 驗收：事件重播不重複寄送；退訂後排程再檢查；暫時失敗可重試、永久失敗停止；worker 狀態與 provider reference 可回讀。
- 回滾：停止新 enrollment／寄送排程，保留執行紀錄；避免已寄通知被回放再次送出。

### SR-10 creator-site-and-funnels

- 輸入／前置：現有 Page/CMS、SR-05 表單名單、SR-06 或 SR-07 Offer CTA、SR-02 UI。
- 交付／owner：先銷售頁 → 表單／checkout → thank-you，不把完整視覺 builder 當前置。
- 決策阻擋：完整 builder 是後續範圍選擇，需單獨定義。
- 驗收：草稿不取代發布頁；表單記 consent／來源；CMS 不覆蓋保留 route；手機 CTA 導到正確 Offer。
- 回滾：回復先前 published revision，保留訂單與表單提交。

### SR-11 taiwan-billing-and-compliance

- 輸入／前置：現有 PAYUNi／invoice／recurring adapters 與 SR-06 的正式新政策。
- 交付／owner：TWD、Asia/Taipei、發票／訂閱／LINE 用途映射；先重用現有 provider。
- 決策阻擋：發票／SMS 新供應商、適用範圍和條款；不因總藍圖逕換 provider。
- 驗收：server 金額、通知簽章／重播、退款、發票狀態和權限可回讀；LINE Login、邀請與訊息用途分開。
- 回滾：關閉新增收款模式，保留既有訂單與發票稽核；退款由正式流程處理。

### SR-12 creator-analytics-and-export

- 輸入／前置：SR-03 versioned events，SR-05／06／09 的來源與資料權限。
- 交付／owner：有來源／日期／去重的營收、轉換、名單與寄送報表；匯出使用同一 filter scope。
- 驗收：同一來源可重算；缺來源不畫成 0；重播不多算；匯出與畫面篩選一致，跨工作區拒絕。
- 回滾：停用新報表 consumer／export，保留原始事件與稽核。

## SR-13～15：直播、AI 與發布

### SR-13 creator-live-and-webinar

- 輸入／前置：SR-03／05／06／09／12 的權限、事件、交易與報名關係；WebinarJam 只引用已觀察流程。
- 交付／owner：LiveEvent／EvergreenWebinar、排程與影音 provider 分開；報名 → 提醒 → 出席 → 回放 → follow-up。
- 決策阻擋：影音 provider、容量／錄影費用、回放保留期限、逐字稿與同意；未取得 provider 不產生假 join link。
- 驗收：重複 provider event 不多算出席；缺出席資料不是 no-show；clone 不複製報名／秘密／session；archive 保留交易；export 依權限與篩選。
- 回滾：關閉新報名／發布，通知受影響場次；保留付款、出席及已授權回放資料。

### SR-14 creator-ai-assistance

- 輸入／前置：SR-03 tool permission／audit、各資料模組的來源；買家開發 Skill 與營運 AI 隔離。
- 交付／owner：來源可追溯的摘要、草稿與建議；寄送／發布／退款／調價／授權須人工核准並走 domain tool。
- 決策阻擋：模型／provider、可送出的欄位、保存期限；沒有授權的資料不得送出。
- 驗收：跨工作區拒絕；未核准無副作用；模型輸出不能決定付款／分眾／授權真相；來源與人審紀錄可回讀。
- 回滾：停用模型工具／provider，保留 deterministic 操作入口及已核准動作的稽核。

### SR-15 mobile-accessibility-and-rollout

- 輸入／前置：當批功能各自的證據，SR-01／02 共用契約；手機／無障礙每張 SR 都先處理，不等最後才做。
- 交付／owner：正式發布批次、角色驗收、回滾演練和已知限制。
- 驗收：桌機／390px 完整流程、鍵盤／焦點、資料／API 回讀、必要外部付款／寄信／GitHub／影音證據；Spectra 與提交／推送分開記錄。
- 回滾：部署版與 flag 回退，保留後續生成的交易和資料，逐模組恢復。

## 每張卡片的施工補充矩陣

本矩陣與上方同 ID 卡片、施工責任表一起閱讀；不能只取其中一列當 proposal。所有「退出／驗收」都是後續施工的要求，本輪沒有執行它們。無 DB 變更也要明記 migration 為 N/A；需要 DB 變更時，下張 SR 必須提供 DDL、index、backfill dry-run、批次 checkpoint、read-back 與失敗暫停策略，不能在總藍圖直接改 schema。

每張 runtime SR 的共用退出檢查包含 repo 已有的 `pnpm type-check`，以及該 SR 選定 package 的實際測試命令與 scenario mapping；新增／變更 UI 另取得 ego-browser 桌機／390px／鍵盤證據。這些命令是未來施工的驗收目標，本輪未執行 type-check 或應用程式測試。付款／寄信／GitHub／影音／部署不可用時該 gate 留未驗證，不用 mock 結果代替。

| 卡片 | 進入條件 | migration／provider | 明確不做範圍 | 退出證據與回滾責任 |
| --- | --- | --- | --- | --- |
| SR-01 | 現行 Organization／Member 與 App roles source 對照；選定唯一 actor/context resolver | 先加 context bridge，不複製租戶表；新增 profile/context 欄位才另做 additive migration。無新 provider | 不改付款方案、課程內容、買家 SaaS 租戶資料 | foundation 8 個情境逐項映射實際測試、跨租戶直接 route denial、舊 adapter 回讀／回滾；platform owner 負責恢復 resolver |
| SR-02 | SR-01 contract 可供 UI 讀取；核准 screen purpose／primary action／狀態表 | UI-only migration N/A；registry 形狀改變則先相容雙 renderer。無新 provider | 不另建導航資料源、不把示意統計接成正式資料 | UI 11 情境、桌機／390px、鍵盤／焦點、每個按鈕結果；UI owner 回退 renderer，原 route 保留 |
| SR-03 | SR-01／02 契約可回讀；現有 manifest、core boundary、buyer custom 清單已確認 | 模組／事件版本 additive；買家需更新的 schema 有單獨 migration；provider 沿用，不在此切換 | 不執行買家 repo 合併、不調外部 grant、不把 payment provider 變成外掛 | update 10 情境：不合法註冊拒絕、舊 consumer、版本不符、客製衝突停下、failed release 回滾；platform release owner |
| SR-04 | SR-03 更新契約＋SR-06 契約階段的 license／政策；先解決可寫 repo／交付 repo 責任 | 每個 template 版本附 migration；現行三 hosting tiers 沿用，managed 用既有 Coolify；買家第三方帳號與憑證獨立 | 不代管 self-hosted 的帳號或日常維運；不承諾一般聊天模式可改檔；不自行替客戶升降 GitHub 權限 | buyer 10 情境、乾淨 repo install→登入→買家付費頁→可寫 repo 保存→指定 tier 部署→更新回退；delivery owner 與買家 app owner 分開 |
| SR-05 | SR-01 scope／SR-02 UI／SR-03 event contract；User 與匿名 Contact source mapping 完成 | 新 Contact/link/consent/segment 契約 additive，既有 User consent 保留；匯入不覆蓋 revoke。無新發送 provider | 不要求 Contact 必須先註冊、不改 Auth、不替 AI 決定分群 | CRM 8 情境＋匯入 dry-run/read-back、verified identity linkage、退訂保留、跨工作區 read/export denial；CRM owner 停 consumer，保留稽核 |
| SR-06 | SR-07 一次買斷切片與 SR-03 契約；政策先核准，再等 SR-11 provider gate 才發布 recurring | contract→provider→runtime 分段；Product／Offer／快照增量、舊 MONTH／YEAR 相容，季與新商品須新 migration。付款 provider 仍由 payments owner | 不重建 Course／Order／checkout；不暗改 MVP 8800 SKU；不靠撤銷 repo 抹除已下載副本 | commerce 14 情境（含網站部份由 SR-10 接手）、catalog／notify replay／refund／Bundle／standalone kit／到期取消回歸；commerce owner 停新 Offer，保留舊交易 |
| SR-07 | 銷售切片本輪 diff／spec／歷史 MVP 唯一 courseId／隔離 DB／Bundle owner 已核對 | 沿用本 SR 已有 additive CourseOffer／OrderCourseEntitlement migrations；backfill 不唯一則停。PAYUNi／Email／GitHub 沿用 | 不施工通用訂閱、CRM、Funnel builder、影音；不重做 Bundle 原入口 | 原 SR scenarios／tasks、PAYUNi sandbox、真實 Email、GitHub pull 回讀、退款保留其他資格、桌機／390px；銷售切片主控協調 payment／kit owner |
| SR-08 | SR-01／02＋目前付款、課程、寄信 read source；未接 CRM 的來源顯示不可取得 | read model 增量且可重建；不用新 provider | 不把來源失敗當 0、不用 Demo 數據替代正式 API、不重建 Order | analytics/operations 的工作台／失敗告警情境；每個任務卡成功、空、錯誤、denied、retry、返回；operations owner 停新讀模型 |
| SR-09 | SR-03 事件＋SR-05 Consent；既有 newsletter 整合與 mail provider gate 可用 | domain state 與 Outbox 同交易；Enrollment／Delivery 唯一鍵／重試增量；保留舊 consumer；mail adapter 沿用，SMS 未核准不接 | 不複製 newsletter worker、不把交易信改成 marketing、不因重播重寄 | marketing 8 情境、重播／退訂再檢查／provider 暫時與永久失敗／人工重送；automation owner 停新 enrollment，已送結果不可回放成新送信 |
| SR-10 | SR-02 UI／SR-05 Contact＋已驗收 SR-07 或 SR-06 Offer CTA；builder 深度先核准 | Page/revision 沿用，Form／FunnelStep 新關係增量，保留 slug 拒絕；沒有新付款 provider | 不複製 CMS、不覆蓋系統保留 route；最小閉環不代表取消未來完整 builder | commerce 的 website/sales flow 情境、草稿／發布／回復、表單 consent、CTA 到正確 Offer、手機；site owner 回復 published revision，提交紀錄保留 |
| SR-11 | SR-06 契約階段已核准週期／取消／發票政策，不等 SR-06 runtime 完成 | recurring／invoice adapter mapping；季支援須 provider sandbox；新稽核／index 才做 migration。PAYUNi 沿用，SMS／發票替換需獨立決策 | 不把 invoice success 當 payment success、不暗開新 provider、不混用 LINE Login／邀請／messaging 同意 | Taiwan 8 情境＋舊月／年、新季映射、重播／退款／發票失敗恢復、LINE 用途；billing owner 回退新收款模式，已發票／付款證據保留 |
| SR-12 | SR-03 versioned events＋SR-05／06／09 已可回讀來源；每份報表明訂 scope／日期／去重 | event/read model additive，重算版本保留；export 從伺服器授權來源查詢；新 analytics store 未拍板不切 | 不以呼叫者傳入 orders 宣稱 server-scoped 匯出、不用缺來源畫 0 | analytics/operations 的 report/export 情境、相同 filter 重算一致、重播去重、越權匯出拒絕、檔案回讀；analytics owner 停 consumer，不刪原事件 |
| SR-13 | SR-03／05／06／09／12 契約可用；影音／容量／retention／同意政策先核准 | Webinar／Session／Registration／Attendance／Replay 契約增量；影音 provider adapter 獨立，Live／Evergreen／schedule 分開 | 不由介面猜影音技術、不用假 join link、不 clone 名單／秘密／session、不以缺出席資料判 no-show | live 18 情境，provider failure/replay、付費報名、提醒／出席／回放、safe clone/archive、filtered export、桌機／390px；webinar owner 停新發布並協調受影響場次通知 |
| SR-14 | SR-03 tool permission/audit＋所選來源模組 ready；模型、欄位、保留政策先核准 | approval/action audit 增量；沿用 provider config，接新模型需獨立 gate；敏感資料最小化 | 不讓 LLM 決定付款／同意／授權，不改唯讀客服兩工具，不共享買家 Code Skill 憑證 | AI 8 情境：來源可回讀、跨租戶拒絕、未核准零副作用、核准時重新查權限、停模型保留人工入口；AI tool owner 關閉 side effects |
| SR-15 | 當批各 SR 的 logic/data/UI/provider evidence 到齊；未決商業政策阻擋其功能，不阻擋無關已驗收功能 | 按批次 expand→migrate→contract；release flags 需實作，不假設已存在；provider 沿用已核准配置 | 不以 build／tasks 勾選代替驗收、不等最後才補手機、不跨環境共用買家資料 | UI/update 共用情境、桌機／390px 全按鈕、角色 route、部署 API 回讀與 TEST 回滾演練；release 主控＋受影響模組 owner，先停新增流量再退版本 |

## 依賴與發布順序

以下節點是交接與施工階段，不是新增十六張 SR。`06C` 是 SR-06 的契約定稿階段，`06R` 是同張 SR 的 runtime／整合階段；兩階段共同持有唯一 commerce 真相，不分裂資料模型或 checkout。`15` 每一批重複驗收，不必等所有十五種能力都實作完才發布。

| 節點 | 必要前置節點 | 過關後交給誰 |
| --- | --- | --- |
| 07 | 無；沿用現有地基，滿足上方切片進入條件 | 06C 與新 Offer CTA；可先作一次買斷批次驗收 |
| 01 | 無；讀現有 Organization／App／角色證據 | 02、03 的 scope 橋接 |
| 02 | 01 | 03 與每張新 UI SR |
| 03 | 01、02 | 04、05、06C、09、12、14 的契約 |
| 05 | 01、02、03 | 09、10、12、13 的 Contact／Consent |
| 06C | 07、03 | 11 的 provider 映射、04 的 license 邊界；未決新政策禁止新 Offer 發布 |
| 11 | 06C | 06R 的已驗證收款／發票／週期映射 |
| 06R | 06C、11 | 12、13 的新商品／訂閱來源 |
| 04 | 03、06C | 買家桌面 AI／可寫開發倉庫／hosting tier 的交付驗收 |
| 08 | 01、02、07 | 首批可操作營運台；後續來源逐模組接入 |
| 09 | 03、05 | 10、12、13 的事件／送達結果 |
| 10 | 02、05、07 | 最小銷售流程；新訂閱 CTA 另等 06R，不以 07 代替其收款 gate |
| 12 | 03、05、06R、09 | 13 的來源與 scoped 匯出契約 |
| 13 | 03、05、06R、09、12 | Live／Evergreen 首批驗收與更新回歸 |
| 14 | 03、05 | CRM 摘要首批；交易／直播工具另外等 06R／13 的來源，不以摘要 gate 授權所有工具 |
| 15 | 01、02、03、07 | 首批發布證據；後續每批再加入當批功能節點，不能沿用舊批次通過值 |

施工優先收尾 07。01／02 的文件準備可並行，但不要求銷售切片等完整 Creator 新殼；07 重用現有 shell。06C→11→06R 明確消除 commerce／provider 循環；04 不必等 06R 完成所有訂閱才能驗證買家自己的 SaaS，但正式販售新 CodePackage Offer 仍須其 commerce 及政策 gate。

### 共用決策阻擋與失敗逆推

SR-01／02／03／08／15 沒有新增商業 provider 選擇；其阻擋是來源契約、角色 scope、畫面狀態或驗收證據不足。SR-05 的同意／匯入／保留政策、SR-06／04 的授權與取消、SR-09 的發送目的與排程、SR-10 builder 深度、SR-11 發票／SMS、SR-12 分析儲存、SR-13 影音／retention、SR-14 模型與可送出欄位，均須在各自 proposal 列核准紀錄。SR-07 只沿用既有已核准一次買斷政策，legacy mapping 不唯一必須停止 backfill。

| 假設這批失敗 | 先查的證據 | 對策／不能做的補救 |
| --- | --- | --- |
| 更新後舊付款失效 | 舊 SKU／MONTH／YEAR provider replay、訂單快照與舊 consumer 回歸 | 停新入口／退新 adapter；保留歷史與已完成付款，不清空訂單重建 |
| CRM 名單重寄或被錯認 | verified identity link、consent source/version、Enrollment／Delivery 去重鍵 | 停新 enrollment／修來源映射；不恢復已撤回同意、不自動合併未驗證 email |
| 新殼越權或手機任務消失 | resolver 的 org/app/actor、直接 route denial、390px 與 focus 證據 | 退 renderer／bridge；既有 route 與 Member 資料保留；不只藏按鈕 |
| 買家更新覆蓋客製 | 更新前 diff／備份／相容矩陣／migration checkpoint | 衝突停下、回復已備份版本並保留新資料；不 reset／整包覆蓋 |
| Live／AI 的外部副作用重複 | provider ref、事件 ID、approval action ID、已完成稽核 | 停新發布／工具；由 domain owner 回讀再處理，不能只在 UI 畫成成功或取消 |

## 買家授權、部署與 AI 操作補充契約

本節是 SR-04／03 的交接依據，不是買家操作手冊與 Skill 已製作、實跑的宣告。買家能否商用、授權數量、取消後權利等仍須條款核准；不得以這張矩陣當作已決定的售價或 license。

### License 需要保存的欄位

| 欄位 | 必須表達的內容 | 缺失時處理 |
| --- | --- | --- |
| 主體／來源 | buyerId、Product／Offer、Order／Subscription、policyVersion、templateVersion | 新 Offer 不發布，不靠 Course ID 或 repo URL 猜 license |
| Source-use scope | 允許用途、商用狀態、app／workspace 數（有限數量或已核准 unlimited） | 未決不是自動 unlimited；不默默填 1，也不撤掉既有已核准條款 |
| Content mapping | standalone 無 Course；附課／Bundle 保存成交 snapshot | CodePackage 使用權不暗授課程；學習權利與程式包分開 |
| 更新／服務／grant | update channel 與期間、hosted-service access、GitHub grant 的各自起迄／政策 | 一種到期不自動終止其它權利，不承諾能抹下載副本 |
| 退款／取消 | 生效時間、各權利的保留／撤回、其它有效來源重算 | 未決阻擋受影響的新方案；不對歷史 Order 套新政策 |
| 支援 | self-hosted／managed／advanced、服務範圍、例外、責任與版本 | 不把有說明書／Skill 當成提供代管 uptime 或無限客製支援 |

獨立程式包與 Bundle 附帶程式包共用上述欄位；兩者的購買情境見 buyer spec fixtures 1／2 及領域判斷表 E4／E5。這是欄位與決策阻擋定義，app 數、期限與商用條款仍未定值。

### 三種部署方案與轉換

| Tier | 機器／服務／資料誰持有 | AI／StartKiter 可做的範圍 | 退出與轉換證據 |
| --- | --- | --- | --- |
| self-hosted | 買家自己的主機、資料庫、網域與第三方 provider 帳號 | 版本化手冊／Skill 引導；不建立 managed fleet 資源、不承諾代管 uptime | 依已核准目標主機乾淨 install／HTTPS／登入／回調／備份／回滾；轉 managed 要明確記錄新 owner／費用／遷移，不能靜默轉 tier |
| managed | StartKiter 中央 Coolify fleet 管理環境；買家業務資料與其 mail／payment／DNS 帳號仍按契約獨立 | 經授權只診斷／管理對應 buyer instance；不能跨 instance 讀秘密或資料 | buyer instance mapping、金鑰目的地、部署回讀／告警／回滾；移轉前備份／dry-run／買家核准與來源環境保留 |
| advanced | 買家接手原始碼用於自己用途，仍受已核准 license | 不自動建立 fleet 或保證其客製功能維運 | 清楚 source／license／更新與支援邊界；改 tier 要重新核對資料、provider、費用與責任 |

沿用 canonical 的三個 tier，不新增第四套。`managed-hosting-tiers` 舊 self-hosted 情境仍指 README Zeabur 一鍵路徑，而目前平台部署文件以 Coolify/VPS 為主；買家指南必須核對當版 README 與已核准 buyer target，不能把「我們網站搬了主機」當成買家指南已遷移。這個來源差異是 SR-04 的指南／部署驗收 gate，不在本輪換供應商。

### 憑證交接不能等於 provider 已接通

實際讀到 `packages/platform/src/deployment/credentials.ts` 的 kind→key 是 email→EMAIL_PROVIDER_API_KEY、payment→PAYMENT_PROVIDER_API_KEY、domain-dns→CLOUDFLARE_DNS_TOKEN；kind 不符／未知 key 必須拒絕。`submitCredential` 需 session 及該 user 的 managed coolifyAppId，只能寫該 instance，不能說 self-hosted 也已可走同一 endpoint。

讀到的 `packages/payments/gateway-settings.ts` 解析 PAYUNI_MERCHANT_ID／PAYUNI_HASH_KEY／PAYUNI_HASH_IV（或本 app 的核准加密 settings），ToSend 使用 TOSEND_API_KEY；這些與通用交接欄位不同。因此「allowlist 接受／env 寫入／redeploy」不是「收款／寄信可用」的證據。SR-04 必須建立已核准 provider-specific 映射，先驗證目的地和 kind，再寫買家環境，最後取得 provider sandbox／寄信／回調的分開證據。

database 與其它新 provider key 目前不在這三項 allowlist；未新增契約／測試前拒絕透過該 endpoint 寫入，不因手冊提到 database 就聲稱已支援。self-hosted 憑證留買家本機／部署環境；managed 只經核准 handoff 寫對應 instance，不入 StartKiter DB／log／錯誤報告／交接摘要。安全診斷只回傳缺少欄位與狀態，不回傳 secret 值；本輪沒有讀或寫買家實際憑證。

### 憑證資料路徑唯讀審查與未驗證項（2026-10-13）

| 路徑／已讀source | 能確認的程式責任 | 不能擴推的結論／後續gate |
| --- | --- | --- |
| protectedProcedure→submitCredential | actor來自auth.getSession(context.headers)，handler用user.id找部署；schema只接受已知kind/key及非空string | 新workflow不得讓model/form指定userId；session正常不等於已核准任意target/tier/provider |
| findBuyerDeploymentForUser／BuyerDeployment | 查where userId，findFirst；schema只有userId index而非unique | 多app/多部署時第一筆不代表buyer選的target；SR-04要明確target identity、ownership/tier/版本/核准，不擅自寫另一台 |
| acceptCredentialHandoff | kind→key配對檢查；未知kind/key/mismatch拒絕且不呼叫sink；helper只log核准envKey名字 | 現行三項keys不含database/provider-specific PAYUNi/ToSend mapping；新增key需spec/tests，不放寬成任意env |
| pendingWrites→setApplicationEnv | secret只在本request記憶體，送指定coolifyAppId的env API；只回uuid，不把完整provider body吐出 | 該env目的地/provider為approved target才可寫；目前固定Coolify API base需對實際managed環境核對，本輪未連線 |
| coolifyRequest／redeploy | 非2xx/parse/network錯誤回api_error/network_error，不回原response text；restart只回queued:true | queued不代表健康/支付/寄信已可用；unknown set-env/restart不靠失敗訊息猜未寫，需回讀target與安全恢復 |
| upsertBuyerDeployment／handler logs | env後restart失敗只存user/tier/server/app/url/status=error，顯式logs為kind/key/user；handler回accepted:true沒有secret | 多target與tier需增量核對；只寫部署metadata與generic錯誤不等於全request鏈都無洩漏 |
| handler onError／logger | `packages/api/orpc/handler.ts`的onError呼叫logger.error(error)，`packages/logs/lib/logger.ts`為一般Consola，未見專門secret redactor | 不能宣稱所有exception/schema/transport error都已去敏；需核准redaction contract＋canary各分支驗證；本輪未測log或送secret |

本輪只讀上述source與schema；沒有讀.env／buyer secret、寫環境、呼叫Coolify、改logger/auth/db或跑application tests。文書定義補齊kind/destination/ownership/否決/錯誤邊界，並保留redaction／實際provider mapping／明確多target/queued後health/read-back gate，不把靜態review當真實交接安全或部署驗收。

後續驗收矩陣用明確標記的canary值，不用正式credential：invalid kind/key/mismatch各自sink零寫入；非本人/未核准target/tier拒絕；值只到核准環境，StartKiter DB/log/error/prompt/screenshot/export均不得保留；set-env成功但restart失敗要可回讀已寫狀態而不洩漏值；撤權/target變更重新審核。provider真正收款／寄信與服務健康證據另取得，canary測試不能代替。

### 買家自己的 SaaS，不借用課程權限

| 資料／判斷 | 唯一真相 | 拒絕跨界 |
| --- | --- | --- |
| 買家是否取得 source／更新／支援 | StartKiter 的 Offer snapshot 與 license | 不能因此把買家 SaaS 的終端客戶當 StartKiter 學員 |
| 終端客戶登入與成員 | 買家 app 的 session／User／Organization／Member | 邀請會員不建立 StartKiter workspace membership |
| 終端客戶購買／訂閱／付費頁 | 買家 app 的 Order／Subscription／Entitlement | 沒付費的終端客戶不因買家已買課就能開 /reports；不把退款我們的課程當成刪除買家客戶資料 |
| 買家自有服務營運 | 買家 app 的資料／provider／合約 | Creator AI、買家 Code Skill、平台客服兩工具不共用客戶資料或憑證 |

### AI 手冊／Skill 的交付欄位與停止點

每版 buyer README、AGENTS.md／CLAUDE.md 與 onboarding／extension／troubleshoot／update／deploy Skill 要附 packageVersion、skillVersion、compatibleVersions、module/API/schema versions、允許的操作／provider targets 與證據欄位。這些是要實作的交付欄位，不宣稱現有 startkiter-dev 已全部包含。

| 操作 | 先檢查 | 何時停止／保留什麼 |
| --- | --- | --- |
| 安裝／排障 | 桌面 AI 是可操作專案的 Code／project 模式、實際 folder／版本、依賴與缺失配置 | 一般聊天模式不承諾改檔；缺依賴／版本不相容先列阻擋，不亂執行 migrations 或索取秘密值 |
| 新增模組 | 版本／permission／既有可重用 App、manifest、預計檔案與 migration 邊界 | 不相容或未核准副作用停；不改 Payment／Auth 真相，不覆蓋 buyer custom |
| 更新 | core／official／generated／custom 分類、diff／backup／env changes／migration checkpoint／rollback point | 有衝突先停在清單，保持原服務與客製；不自動 merge、reset 或整包覆寫 |
| 部署 | tier、目標 instance／帳號／網域、已核准配置與費用責任 | 未核准 target／provider 不部署；同意一次部署不等於可以跨 instance 操作 |
| 回報結果 | 實際檔案／版本、type-check／focused tests、API／資料回讀、桌機／390px、需要的 provider 證據 | build 或 Skill 檔存在不是成功；缺任何 gate 直說未驗證；AI 不代替付款／授權決策 |

更新故障後先停新 channel／flag，保存失敗證據與 checkpoint；舊版本仍相容時才回退部署，已產生的新交易／資料保留，不能用 destructive DB rollback。買家可 decline 新模組或版本，仍留在舊相容服務；官方退版／support policy 另須核准，不假設 forever 相容。

本節足以做 license matrix、三 tier 責任、下游權限與 Skill 版本的文書審查；provider-specific credential mapping、repo write／pull 移轉及買家乾淨 install／部署／更新實跑仍未完成，task 3.9／3.10／8.5 等不可因此全勾。

## 模組、買家客製與版本發布清單

本節對應 SR-03／15 的文書契約，不是已實作 updater 或已驗證 migration／部署。來源為現有 AppRegistrationManifest、PluginManifest、mount points、repo-version 與 update spec；registry、來源版本、手冊／Skill、資料與驗收記錄一起交接，避免做 A 壞 B。

### Registry 與版本契約的兩個層次

現行 `packages/platform/src/app-registration.ts` 的 manifest 包含 appId、displayName、route.basePath、menu labelKey／light-dark icon、eligibility role/grantedBy、i18nNamespace、supportedLocales、unit/browser test references。`packages/platform/src/types.ts` 的 PluginManifest dataSpec 只允許 content／none；payment、Auth、Order 與發送核心不可偽裝成自由寫入的 plugin data。

後續新增 CRM、Funnel、Webinar、AI 的 release contract 另記 domainOwner、workspace/actor capabilities、API/event/schema versions、provider ports／credential kinds、UI screen contract、feature flag/channel、dependency compatibility、retention policy與受影響回歸。這些是要增量設計的欄位，不聲稱現行 manifest 已全部包含。缺必要註冊／權限／owner 或與保留 route/i18n keys 衝突時，新模組拒絕註冊，舊 registry 保持有效；新增 App 仍經同一 typed registration 入口。

### 四類檔案與修改權

| 分類 | 誰擁有／更新規則 | 變更預覽與衝突 |
| --- | --- | --- |
| core | 平台版本管理，Auth/payment/registration 等穩定契約；只以已核准 upstream 版本改 | 比對 base/current/target，列 consumer/API/schema 影響；買家修改過 core 必須標客製衝突，不默蓋 |
| official module | 官方 module owner，符合註冊／版本／權限／事件契約 | 列 module version、dependencies、migration、routes／UI；未接納新 module/channel 不自動啟用 |
| generated | 由明確 generator/version/input 產生的檔案 | 標 generator與輸入、重產 diff、編輯警告；生成檔有手改也必須 preview/conflict，不因 generated 標籤就丟棄 |
| buyer custom | 買家自己的功能／設定／內容與擴充 boundary | 官方只提供接口變更說明；不寫入／刪除／整包覆蓋；需明確買家核准的 merge 計畫才改 |

歸類依 release manifest／source lineage／買家實際 diff，不只靠資料夾名字；未分類檔案當 review required，不自動套成 core。Secrets、database dump、私人課程教材不放 upstream release；buyer custom 的表單、名稱、SKU等用同一比對／canonical-key策略，不能單向翻譯造成關聯失效。

### 每版必交付的 release record

| 記錄 | 必須具體包含 | 沒有時的 gate |
| --- | --- | --- |
| 身份與範圍 | releaseId／from-target versions／source commit或artifact hash／module owners／core-official-generated-custom分類／買家target與tier | 不以目前template字串相等就宣稱更新成功；缺source/buyer版本標unknown |
| 相容 | supported platform/module/API/event/schema/Skill versions、舊 consumer、registered capabilities／routes／i18n | 缺相容證據不發布breaking版；元件／manifestCI綠不代替資料／UI相容 |
| migration | additive DDL/index、dry-run、mapping、batch/checkpoint、read-back／dual-read、失敗暫停、contract條件 | 不唯一legacy mapping停；未回讀不移除舊schema/route/consumer，不猜歷史Bundle成員 |
| 配置與權限 | flags/channel預設、需要的env名字及provider consumer映射、actor/target/費用核准與profile版本 | 不回顯secret；未核准provider或無法映射的通用key拒絕；沒實作flag不聲稱可rollback toggle |
| 品質與行為 | focused scenario test references、type-check、API/data read-back、桌機/390px/keyboard、需要的付款/Email/GitHub/media evidence | build/PASS摘要與mock不能代替實際證據；未跑的欄位保留not-verified |
| 恢復與支援 | 相容舊版／回滾點／backup／forward-fix、各domain owner、買家hosting tier、手冊/Skill版本與限制 | 不 destructive restore 刪新交易；self-hosted與managed責任分開；repowrite/pull移轉仍需專門gate |

### Expand → migrate → contract 執行門檻

| 階段 | 要保持什麼正常 | 可以前進的證據／回頭路 |
| --- | --- | --- |
| expand | 加新欄位／版本／adapter alongside舊契約；新module/flag預設不啟用，不改舊paid/consent/license結果 | 舊caller可讀，新schema與舊版本相容；失敗退新入口／版本，不刪既有資料 |
| migrate | 舊／新consumer可並存，workspace分批，歷史映射有來源，每批transaction／checkpoint | dry-run與每批read-back一致；失敗停該批、保留其它流程，不能部分改paid/consent後假裝成功 |
| opt-in/cutover | 明確買家/channel接受；actor scope、資料、UI與provider回歸已通過 | 原core/course/order/newsletter/grant/custom逐項regression；失敗停新channel並按相容回滾或forward-fix |
| contract | 所有consumer／已納入買家部署都遷移且回讀；移除舊形狀有deprecation與責任 | 缺舊買家 migration/compatibility不得刪route/schema；不能要求未接納新module者一起breaking更新 |

事件／API 新版consumer不知某版本時要拒絕或走已定義的相容adapter，不能猜payload；route替換保留已發布連結／安全return path／authority，資料migration後也不能把舊退訂恢復。flag/channel只控制新行為，不回放已發送消息或撤掉其它有效訂單。

### 不做 A 壞 B 的回歸與恢復責任

| 變更批次 | 必查consumer／資料 | rollback owner／限制 |
| --- | --- | --- |
| 新CRM/identity/consent | auth User/Member、原Newsletter consent／welcome、exports、Contact event、其它workspace資料 | CRM＋auth/mail owners；停新import/consumer，保留revoke／交易，不能合併不同verified users |
| 新Offer/recurring | MVP8800、單課/Bundle snapshot、舊MONTH/YEAR、notify/refund/invoice、course access／LINE／kit | commerce/payment/course/kit；停新Offer／adapter，維持其它有效grant，不對歷史套新policy |
| 新Site/Funnel | CMS revision／reserved routes、public CTA、checkout-return、form consent、手機 | site＋commerce；回published revision不刪提交或Order |
| 新Live/AI | registration/attendance/replay、recording/Transcript目的、Consent、Offer、Automation、analytics與human approval | webinar/AI/domain owners；停新報名/工具，必要場次通知，保留paid／approval證據 |
| 新UI/context | navigation adapter、直接route denial、workspace cache、course/admin/learner入口、keyboard/390px、舊payer模型 | platform/UI＋affecteddomain；回renderer/bridge不是刪Member、User或買家已購資格 |
| 買家upstream/Skill | 上述受影響領域＋buyer custom、generated edits、tier/env consumer映射、實際 deployed/source versions | release owner＋買家/managed operator；衝突先停，保留原服務與客製，Tier轉換需另核准 |

具體接受流程：先預覽四類diff/衝突、dependency/env/migration/Skill與回滾點；買家可accept／decline；新版本不兼容或權限/target未核准就停。接受才備份並執行核准範圍、回讀與驗收；失敗保留checkpoint和數據，不能把源碼已merge當service已更新。當前 repo-version只是讀template/交付grant repo的版本並給fetch/merge hint，沒有完整本節updater；它也不能保證對買家自有開發/deployedrepo比較正確。

本節供3.11～3.13、3.15、8.6文書核對：registry/owner/API-event/permission/UI、四類檔案、migration/channel/舊consumer、實跑證據與rollback/tier/Skill已成同一release record。3.10與8.5的實際buyer repo/guide整合仍pending；不核准新商業policy、不執行merge/部署或改外部grant。

## 決策何時需要 Fish

完整逐題選項／適用範圍／影響SR／未決發布阻擋，見 [P01～P15決策表](creator-platform-policy-decision-register.md)；以下是短索引。未定值與核准紀錄不從預選或自動goal continuation推定，決策需要時一題一題問，不一次丟整表。目標能力已確認不再重新提問，legacy已核准快照也不被新問題覆蓋。

| 尚未決定 | 阻擋哪張 | 拍板前可做 |
| --- | --- | --- |
| 第一個創作者族群 | 新 UI／內容定位 | 沿用已確認課程銷售切片，列不同角色任務 |
| Bundle／CodePackage 新訂閱取消與更新期限 | SR-06、04 | 保留周期欄位與 policy 模型；不發布新方案 |
| CodePackage 商用 app 數／支援 tier | SR-04 | 寫授權矩陣與安裝流程，不承諾授權數 |
| 交付 repo／買家可寫開發 repo／更新版本追蹤 | SR-03、04；既有 grant 移轉影響 SR-07 | 記錄 canonical 與 runtime 差異，保留本機改檔與既有 pull 交付，不自動改權限 |
| Funnel builder 深度 | SR-10 | 完成最小頁面／表單／CTA 對照 |
| SMS／發票／分析新 provider | SR-11、12 | 現有實作與 adapter 對照，不新增憑證 |
| 未操作的 Systeme 頁面 | 各對應 research | inventory 標未觀察；不用產品入口猜行為 |
| 直播 provider／錄影保留／外部直播替代 | SR-13 | 場次／報名／事件／權限規格與故障路徑 |
| AI provider／來源欄位／保留／核准例外 | SR-14 | 工具授權與人工核准流程；無例外默認需核准 |

## 更新後不做 A 壞 B 的具體證據

每個新模組必須列出受影響的 Course、Order、Entitlement、Newsletter、GitHub grant 與 buyer custom，逐項標「沿用／擴充／不影響」並說明來源。新增 schema／事件先讓舊 consumer 正常，資料批次遷移後回讀；新版有衝突先停下。只在切換與回滾證據都齊全時移除舊契約。
