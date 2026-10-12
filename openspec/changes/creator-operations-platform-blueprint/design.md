## Context

StartKiter 已有平台殼、Organization／Member／Invitation、課程與課程管理、Bundle、Coupon、Order、PAYUNi、CourseSubscription、Invoice、Newsletter、Page、Support 與 GitHub CodePackage 地基。REA 在 Codex CLI 連到登入後的 WebinarKit 與 systeme.io 控制台，確認前者有 Automated／Live（鎖定）／Series 入口，後者的免費帳號沒有 Webinar 導覽。REA 與 systeme.io 官方說明交叉確認：其原生 Webinar 是 Webinar／Unlimited 方案限定的 Evergreen Funnel，官方文件明確說不支援原生 live webinar。

本 change 先把逆向證據整理成總計畫，再把總計畫拆成後續小 SR。`docs/blueprint/systeme-io-reverse-engineering-checklist.md` 是逐項 inventory；本 design 是它的架構決策與施工順序。`public-multi-course-sales-and-code-package` 是第一條垂直切片，必須重用本 change 的 Product／Offer／Entitlement 邊界。

限制：本 change 只修改 Spectra artifacts 與藍圖文件，不修改 application runtime、Prisma schema、provider、部署或外部 Systeme.io 資料。

## Goals / Non-Goals

**Goals:**

- 形成一份可追蹤的 Systeme.io → StartKiter 功能、流程、資料與 SR 對照。
- 固定 Creator Workspace、Contact、ContentResource、Product、Offer、Order、Subscription、Entitlement、CodePackage 的責任邊界。
- 用一條創作者主線串起「建立內容 → 收集名單 → 培養關係 → 銷售 → 付款 → 交付 → 分析／支援」。
- 把後續工作拆成可獨立驗收的小 SR，並標出依賴、回滾與真實瀏覽器／付款／寄信 gate。
- 保留 StartKiter 的台灣交易、LINE、課程深度、GitHub CodePackage 與 plugin platform 差異。
- 將即時直播、預錄常青 Webinar、創作者後台 AI 與買家 CodePackage 開發 AI 分成不同產品責任與權限邊界。

**Non-Goals:**

- 不做 Systeme.io 的品牌或 pixel-perfect clone。
- 不在本 change 寫 CRM、Funnel、Automation、Analytics 或 provider runtime。
- 不重建現有 User、Organization、Order、Course、Bundle、Newsletter、Invoice 或 GitHub grant 真相來源。
- 不把 subscription、CodePackage 或課程權限混成一個全站 unlock 開關。
- 不在未有 A 級頁面／流程證據時填補 Systeme 的內部實作推測。
- 不把 Systeme.io Webinar 方案當作其原生即時直播能力證據；也不從瀏覽器資源推測其未觀察到的伺服器或影音 provider 技術棧。

## Decisions

### 前次 REA 結果定位為高層藍圖，不是完整功能真相

前次 REA 的差異報告與 `startkiter-creator-platform.md` 保留作為既有研究，但本 change 以逆向清單補上逐模組、逐頁面、逐流程、資料、權限、狀態、事件與整合層。研究證據分為 A：已登入實際操作、B：DOM／路由可讀、C：官方文件、D：推測；D 級資料不能直接產生施工 task。

Alternatives Considered:

- 直接沿用前次高層報告：否決，無法知道哪些頁面與操作尚未盤點。
- 直接複製 Systeme UI：否決，會把外部產品的術語與資訊架構帶進 StartKiter。

### 以 ContentResource、Product、Offer、Entitlement 分離平台真相

`Course`、`File`、`Community`、`CodePackage` 是可交付內容；`Product` 是可販售的聚合；`Offer` 保存價格、幣別、付款模式與交付 mapping；`Order`／`Subscription` 保存付款生命週期；`Entitlement` 保存買家實際取得的資格。CodePackage 可以是獨立 Product，也可以被 Offer 作為額外交付；歷史 Order 必須保存付款當下的交付結果，不能每次依目前 Offer 重算。

Alternatives Considered:

- 讓 Course 直接保存所有售價與付款條件：否決，會無法支援同一課多 Offer、Bundle 與訂閱。
- 讓 Order 只保存 sku，再即時解析目前商品：否決，改價或改 Bundle 內容會污染歷史交付。

### CodePackageProduct 可獨立販售，交付政策由 Offer 決定

CodePackageProduct 不需要綁定 Course 或 Bundle。它可以有一次買斷 Offer、月／季／年 Subscription Offer，也可以被 Course 或 Bundle Offer 作為額外交付。Offer 必須明確保存 CodePackage delivery policy：`none`、`perpetual` 或 `active_period`。Course entitlement、Bundle entitlement、CodePackage eligibility 與 GitHub repo grant 分開保存；Subscription 的取消只直接影響 active-period access，是否保留 perpetual CodePackage 依 Offer policy 決定。

Alternatives Considered:

- 把 CodePackage 永遠當成課程附贈品：否決，無法單獨販售持續更新的模板或程式碼包。
- 把所有 CodePackage 都綁定訂閱：否決，一次買斷與 Bundle 搭售都需要可配置的交付規則。
- 直接把 GitHub repo 權限當成 Product 真相：否決，repo grant 是外部交付結果，Product／Offer／Entitlement 必須先保留內部可稽核真相。

### CodePackage buyer usage is a separate product-to-deployment boundary

取得 CodePackage 的買家可以把 source package 安裝到自己的電腦或自己的部署環境，建立面向自己終端客戶的 SaaS／會員網站。這個 buyer-built app 與 StartKiter 的課程觀看權限是兩套不同的 entitlement：StartKiter 管理買家的 CodePackage license、template version、update channel、deployment tier 與 support boundary；買家自己的 app 管理其終端使用者、登入、Organization、permissions、subscription、billing 與付費頁面。`self-hosted`、`managed`、`advanced` 三種 hosting tier 沿用既有 specs，不在本 change 另造第四套部署模型。

CodePackage license 必須能表達：一次買斷或訂閱、可部署的 app／workspace 數量、是否含更新、更新期間、商業使用、支援層級、撤銷條件與 GitHub upstream sync 規則。第三方 email、PAYUNi、DNS、Cloudflare 等帳號由買家持有；credential handoff 不把原始 secret 存在 StartKiter 自己的資料庫或 log。

Alternatives Considered:

- 把買家 SaaS 當成 StartKiter 課程內的一個頁面：否決，買家 SaaS 有自己的終端使用者、登入、權限、付款與資料責任。
- 只交付 GitHub repo，不定義 license／deployment／update：否決，無法回答買家能否商業使用、如何取得更新、誰負責維運。
- 讓 StartKiter 替所有買家持有第三方 provider 帳號：否決，會混合帳務、secret、資料擁有者與 support liability。

### Platform extension and update contract protects the core and buyer code

未來的 CRM、Funnel、SMS、Analytics、Community 或其他 Systeme.io 能力，不直接修改課程、付款、Auth、Organization 或買家客製檔案的內部實作。每個官方能力先成為獨立 capability／App／plugin，透過既有 App registration、mount point、permission、shared UI contract、domain event 與 provider adapter 接入。資料演進使用 additive migration；事件與 API 以相容版本維持；新功能先經 feature flag 或 opt-in channel；移除舊契約前先完成 deprecation、migration、buyer update、read-back 與 rollback gate。

買家 CodePackage 的更新採 core／official modules／buyer custom 三層分離。官方更新只修改可識別的 core 或 official module 邊界，不直接覆蓋 buyer custom；upstream sync 必須產生版本、變更、衝突、migration、測試與回滾資訊。Codex／Claude Code 的 buyer skills 也跟著版本化，先檢查專案版本與相容矩陣，再執行 onboarding、feature update 或 deployment update。

Alternatives Considered:

- 直接把 CRM、Funnel、SMS 等功能加進現有 `apps/saas` 與 Course Studio：否決，會讓核心殼、課程與新模組互相耦合。
- 每次官方更新都整包覆蓋買家 repo：否決，會破壞買家客製功能與資料責任。
- 只靠人工提醒買家自行處理 breaking change：否決，無法形成可驗證的版本、migration、conflict 與 rollback 流程。

### Bundle 是多課程 Product，不是全站權限

單堂 Product 只授予指定 Course；Bundle Product 只授予 Bundle 當下包含的 Course；平台登入、workspace membership 或購買其他 Product 都不自動開放整站所有課程。Bundle 可有一次買斷 Offer 與後續的月／季／年 Subscription Offer，但週期方案與授權範圍仍由 Offer 明確指定。

Alternatives Considered:

- 保留 `startkiter-mvp` 作為所有未來課程的全站開關：否決，會讓單課與 Bundle 無法形成清楚的課程邊界。
- 每一門課複製一份商品與 checkout：否決，會重複 coupon、PAYUNi、Invoice、webhook 與退款邏輯。

### CodePackage 是獨立交付物，每位買家最多一份

全平台只有一種 CodePackage template。符合 Offer 條件的付款可以取得 CodePackage eligibility；每位買家最多建立一個私人 repo，repo 權限為 pull。Course access、Bundle access、LINE invite 與 CodePackage eligibility 分開記錄，退款時逐筆重算仍有效的資格。

Alternatives Considered:

- 把 CodePackage 當成一門隱藏課程：否決，會把 GitHub repo 交付與課程教材權限綁死。
- 每一門課建立一個 template／repo：否決，違反全平台單一代碼包與每人單一 repo 的產品決策。

### 以 Creator Workspace 作為所有日常操作上下文

日常操作由一個 workspace context 提供品牌、locale、timezone、currency、成員與 capability；第一版沿用 Organization、Member、Invitation，不新增第二套 tenant。App registry 負責能力與權限邊界，Creator Operations Shell 負責任務導向入口。

Alternatives Considered:

- 直接複製 Systeme 的八個頂部模組：否決，無法反映 StartKiter 的課程、LINE、PAYUNi 與台灣規則。
- 保留課程後台與總管理員雙側欄作為唯一入口：否決，功能會繼續分散，手機版也會維持高密度。
- 為每個能力建立獨立首頁：否決，會增加切換成本，無法完成跨模組任務。

### User 與 Contact 分離，Consent 是獨立生命週期

`User` 是登入身份；`Contact` 是創作者經營的關係資料。Contact 可以在尚未註冊時存在，註冊後用 identity link 關聯 User。Consent、unsubscribe、suppression 與資料刪除不可用單一 Boolean 取代，必須保留目的、來源、版本與時間。

Alternatives Considered:

- 把每個 Contact 都要求先註冊 User：否決，表單名單會被擋在登入流程外。
- 把 User 當成唯一 CRM 名單：否決，會把登入身份與行銷退訂混成同一生命週期。
- 用 `marketingConsent=true/false` 取代事件歷史：否決，無法稽核目的、來源、版本與退訂。

### 用 durable event + outbox 組裝 Automation

跨模組副作用先寫 domain state，再以 transactional outbox 發布事件。Automation worker 以事件 idempotency key 建立 enrollment 與 step execution；provider adapter 回報送達、失敗、重試與 provider reference。事件可回放，但不能因此重複建立訂單、重複寄送不可重複的交易通知或重複授予 repo。

Alternatives Considered:

- 在 request 內同步執行所有 action：否決，付款與寄送會共用 timeout 與失敗邊界。
- 只用 cron 掃描表格：否決，無法可靠保存事件順序、重試與重播。
- 先接第三方 automation platform：否決，核心 Contact、Consent、Order 與 Entitlement 會失去同一真相。

### `creator-ui-ux-foundation` 先於功能 SR 固定 screen contract

UI/UX 不只做最後的視覺巡查。Creator platform 先建立任務導向 page shell、management list、form、detail、status、responsive、keyboard、focus、empty/error/denied/retry 與 browser acceptance 的共用契約；後續 CRM、Offer、Automation、Funnel 與 Analytics SR 只能重用或明確擴充這些契約。視覺保留 StartKiter 自己的 tokens、語言與品牌，不複製 Systeme。

Alternatives Considered:

- 每個功能 SR 自己處理 UI/UX：否決，會重新產生目前課程後台的密度、狀態與手機差異。
- 先做完整視覺稿再決定任務流程：否決，會把外觀放在可完成任務之前。
- 只寫 design system 元件清單：否決，元件沒有 screen contract、狀態與瀏覽器驗收仍無法保證流程可用。

### Taiwan provider 使用 ports/adapters

PAYUNi、Invoice、email、LINE 與未來 SMS 只透過 domain port 接入。現有 adapter 優先重用；新的 provider 必須包含 secret scope、fail-closed、重試、provider reference、回滾與測試策略。台灣語系、TWD 整數與 Asia/Taipei 是 workspace／request context 的預設，不由頁面自行判斷。

Alternatives Considered:

- 在每個 route 直接呼叫 provider SDK：否決，會讓 domain logic 被供應商耦合。
- 先做全球預設再最後補台灣：否決，付款、發票、同意與時間模型會產生不可逆的錯誤預設。
- 一次引入多個 SMS／Invoice provider：否決，先建立穩定的 port 與一個可驗證 adapter。

### SR 採垂直切片與 expand → migrate → contract

每張 SR 必須交付一條可驗收的 user flow，包含資料、API、UI、測試、部署與回滾；跨模組基礎契約先加上，舊路徑並存驗證，再分批遷移，最後才移除舊形狀。第一條垂直切片是多課程前台銷售與交付，後續再依本計畫擴展 CRM、Automation、Funnel 與 Analytics。

tasks 第 9 節的 SR-01～15 是能力索引與文件交接清單，不是強制的時間排序，也不是本 blueprint 的 runtime tasks。目前 `public-multi-course-sales-and-code-package` 已有工作樹程式修改；先按其一次買斷範圍完成對接與驗收，再讓 `creator-offer-commerce` 重用其 CourseOffer／OrderCourseEntitlement，擴充通用 Product、CodePackage 獨立販售與新訂閱政策。不要求一次買斷切片等待全部 CRM 或新訂閱完成。具體前置、owner、阻擋政策與回滾以 `docs/blueprint/creator-platform-development-handoff.md` 的各張交接卡片為準。

Alternatives Considered:

- 先把全部 data model 做完再做 UI：否決，會長時間沒有可驗收的使用者流程。
- 每個模組各做一條孤立 happy path：否決，跨模組事件與權限會在最後才爆出。
- 直接改掉舊 Order／Course access：否決，歷史買家與既有付款流程需要 additive migration 與回讀證據。

### 直播與 Evergreen Webinar 是兩種交付模式，影音服務透過 provider adapter

REA 觀察到 WebinarKit 把 Automated webinar、Live webinar 與 Webinar series 分成不同建立入口；Systeme.io 官方文件確認其 Webinar 方案提供的是 Evergreen Webinar，不是原生即時直播。StartKiter 因此以 LiveEvent 與 EvergreenWebinar 分開管理排程、播放器、出席、錄影與重播狀態。StartKiter 掌管報名、Contact／Consent、Offer、提醒、自動化、付款、Entitlement 與分析；即時影音傳輸與錄影由明確設定的 provider adapter 負責。第一版藍圖不承諾自行架設轉碼、直播 CDN 或多人視訊服務。

Alternatives Considered:

- 把 Evergreen Webinar 當成 Live webinar：否決，預錄播放沒有主持人即時出席、即時 Q&A 與相同的場次生命週期。
- 在 StartKiter 核心內自建完整影音串流與轉碼：否決，會把媒體傳輸、容量、延遲、錄影儲存與支援責任塞入本次產品範圍。
- 將整個 Webinar funnel 委託單一第三方：否決，名單、付款、課程／CodePackage entitlement 與台灣交易會分散到不同真相來源。

### WebinarJam 參照只用於管理流程，不當成影音技術證據

REA 對已登入 WebinarJam `/webinars` 頁面的觀察，確認清單導覽含 Analytics 與 Registrants，單場卡片露出 Edit、Clone、Delete、Advanced、Log、Run a test 與 Your links 入口；新增入口先分 Express（smart defaults）與 Full（自訂設定）兩種設定路徑。Full 流程再顯示 Right now／Schedule for later／Always on 三種場次進入模式，並列出 Basic settings、Webinar presenters、Streaming service、Schedules、Registration、Notifications、Integrations、Thank You、Live、Replay 與 Finish 設定區。Analytics 以 Webinar／Session／Event 篩選；Registrant 分為 Active registrants／Auto-subscribers，並有 Live room／Replay room／Purchase behavior 的篩選入口。這些證據只確認本次頁面上的入口與文案；不確認 Express 流程、各操作結果、匯出資料、影音 provider 實作或後端技術。完整來源、證據 ID、隱私處理與未觀察範圍記錄於 `docs/blueprint/webinarjam-reverse-engineering-notes.md`。

Express 的初始頁未顯示串流服務選項；Full 的 Streaming service 編輯面板則顯示 WebinarJam Live、YouTube Live 與 Facebook Live 三個 UI 選項。這只證明產品有對應的選擇入口，不證明其 OAuth、API、stream key、CDN 或錄影架構。StartKiter 應把「Live／Evergreen 內容交付模式」、「立即／排程／常開等場次進入策略」與「影音 provider」分開建模；provider 變更不得自動把 LiveEvent 變成 EvergreenWebinar，UI 顯示的供應商名稱也不能當成技術協定。

StartKiter 可借鏡「列表 → 快速／完整設定 → 場次進入方式 → 單場操作 → 活動紀錄 → 依 webinar/session/event 查報名與成效」的任務分層，但不能假設快速設定可省略必要權限／同意／影音設定，也不能把 `Always on` 文案當成預錄 Evergreen 的證據。Clone 僅複製可重用設定並建立草稿；不得複製報名、出席、Order、provider secret 或 session reference。刪除入口應轉成可稽核的封存／撤下流程，保留交易與稽核歷史。後兩項是 StartKiter 自己的資料安全契約，不是 WebinarJam 的已觀察行為。

Alternatives Considered:

- 直接照搬第三方單場卡片的 Delete 行為：否決，可能破壞付款、聯絡人與活動稽核關聯。
- Clone 時複製整份 Webinar 紀錄：否決，會把舊報名、出席與 provider session 誤帶到新活動。
- 依畫面入口宣稱已確認完整分析、報名或直播能力：否決，該等頁面及流程尚未觀察。
- 直接把第三方 `Always on` 或 `Auto-subscribers` 當成 StartKiter 的領域資料名稱：否決，兩者語意與內容來源尚未確認。

### Creator AI uses a workspace-scoped tool gateway with human approval

創作者 AI 可以摘要 CRM／營運／直播資料、草擬頁面與訊息、提出分眾或工作流程建議。每次請求都必須綁定 actor、workspace、capability、資料來源與 provider policy；讀取與建議由授權工具執行。寄送、發布、調價、退款、發票、同意與 Entitlement 等有外部副作用或改變商業真相的操作，必須顯示目標、受影響資料與預覽，並由具權限的人確認。買家在 Codex CLI 或 Claude Desktop Code mode 使用的 repo skills 是另一個隔離面，不共享 creator AI 的資料或憑證。

Alternatives Considered:

- 讓 LLM 直接讀寫資料庫或任意呼叫 provider API：否決，無法保證 workspace 權限、資料最小化、冪等與稽核。
- 只保留完全唯讀 AI：否決，無法提供草稿、摘要、工作流程預覽等可審核的營運輔助。
- 允許 AI 自動執行寄送、退款、價格或授權變更：否決，AI 不得成為付款、Consent 或 Entitlement 的真相來源。

## Implementation Contract

本 change 交付的是一份可交給後續主控 Agent 施工的總 SR 計畫，不是 runtime：

- `docs/blueprint/systeme-io-reverse-engineering-checklist.md` 列出來源模組、盤點層級、StartKiter 對照與未完成證據。
- `docs/blueprint/webinarjam-reverse-engineering-notes.md` 保存 WebinarJam 的已觀察管理入口與未驗證流程，供後續直播 SR 使用，不作為供應商技術棧證據。
- `docs/blueprint/startkiter-creator-platform.md` 描述產品定位、角色、核心流程、資料領域、事件與 UI/UX 契約。
- 十一份 blueprint specs 描述可測試的 capability contract；每個後續 runtime SR 必須指出 reused／extended／new。
- tasks.md 列出從盤點到 rollout 的 SR 順序，每一項有行為結果與驗證方式。
- `docs/blueprint/creator-platform-development-handoff.md` 列出商品矩陣、買家桌面 AI 操作到部署／更新的交接、SR-01～15 卡片及需要 Fish 決定的政策。卡片完成不等於 runtime 完成；手冊／Skill 的乾淨專案實跑由 buyer SR 取得證據。
- `docs/blueprint/creator-platform-acceptance-target.md` 定義本輪五項驗收；HTML Demo 是可供檢視的 UI 提案，正式導覽仍須重用 resolveNavigation 與 AppRegistrationManifest。
- CodePackage active-period policy 必須分開描述服務存取、GitHub grant、更新頻道與已交付原始碼的授權；撤銷 repo 權限不宣稱可刪除已下載副本，未定案條款阻擋新訂閱發布。
- 本 change 的 readiness 由 `spectra analyze creator-operations-platform-blueprint --json` 無 Critical／Warning 與 `spectra validate creator-operations-platform-blueprint` exit 0 決定；這不代表 runtime、部署、付款、寄信或瀏覽器驗收完成。

## Risks / Trade-offs

- [Risk] 逆向清單變成無限擴張的功能百科 → Mitigation：每項能力都要落在 StartKiter 對照、Evidence 等級與後續 SR；D 級推測不產生施工 task。
- [Risk] 產品、Offer、Subscription、Entitlement 的邊界在後續 SR 被重新混合 → Mitigation：所有 SR 必須引用本 design 的分層與 acceptance matrix。
- [Risk] CRM／Automation／Funnel 範圍過大 → Mitigation：先完成一條垂直 flow，再按 Contact、Offer、Event、UI shell 拆成可回滾 SR。
- [Risk] 舊 active SR 與總計畫重疊 → Mitigation：proposal 以 reused／extended／new 標註既有 change，不把已完成 runtime 重新施工。
- [Risk] 研究證據被誤報成已完成產品功能 → Mitigation：文件固定 A／B／C／D evidence level，未有 A 級行為證據的內容保留為待驗證。
- [Risk] migration 或 provider side effect 破壞既有資料 → Mitigation：additive DDL、shadow/no-op consumer、idempotency、read-back 與 rollback gate。
- [Risk] 手機只做桌面的縮小版 → Mitigation：每張 UI SR 同時驗證桌面與 390px 核心任務。
- [Risk] 即時影音與錄影成本或 provider policy 改變 → Mitigation：provider adapter、明確容量／錄影政策、usage alert 與可停用的 feature flag。
- [Risk] AI 將未同意的逐字稿或 Contact 資料送往外部模型，或把草稿誤當成已發布操作 → Mitigation：資料分類、workspace scope、provider policy、人工核准、輸出來源與 audit。

## Migration Plan

這一張 blueprint SR 不做 runtime migration。後續施工 SR 必須遵循：

1. 先確認 source lineage、資料 owner、workspace scope、permission 與 rollback。
2. 先新增 contract／table／event／adapter，保持舊 flow 可運作。
3. 以 shadow read 或 no-op consumer 驗證資料形狀與事件量。
4. 逐批 backfill／切換 feature flag，每批有乾跑、寫入、回讀與失敗清單。
5. 新 flow 的 unit／integration／browser／provider evidence 全綠後才公開發布。
6. 新 flow 可關閉時保留資料與歷史 Order；禁止用 destructive rollback 消除已產生的付款或交付紀錄。
7. 每張 SR 完成後獨立 archive；總計畫不替代各 SR 的 apply、verify、deploy 或 acceptance。

## Open Questions

- 第一個創作者垂直族群是課程講師、顧問／教練、接案服務者或代理商。
- 第一版網站先做單頁銷售頁、表單與簡單 Funnel，還是直接做完整 Funnel builder。
- Bundle subscription 的目標範圍、月／季／年週期與取消後收回時間。
- 哪些 Offer 包含 CodePackage；Subscription 是否包含 CodePackage，以及退款／取消時如何重算。
- SMS provider、分析儲存、發票 provider 的第一版選擇。
- Subscription 的正式 payment／invoice／entitlement contract 是否需要另開 modified capability SR。
- 目前 Systeme.io 尚未逐頁取得 A 級證據的模組，要先補證據還是標記為後續 research task。
- Live webinar 的第一個 provider、Recording／Replay 儲存責任、容量限制與失效回退。
- AI provider、可送入模型的 Contact／Transcript 欄位、保留期限、人工核准例外與模型停用路徑。
- 系統是否提供低成本的非影音 live alternative（例如外部直播 URL／Zoom room），以及哪些方案可啟用即時影音。
