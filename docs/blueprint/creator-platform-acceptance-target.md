# Creator 總計畫驗收目標

日期：2026-10-13
對應 SR：`creator-operations-platform-blueprint`
狀態：Fish 已確認改以「本機可操作後台」驗收；商品／保存／買家／CRM／直播示範已施工，25 項資料測試與 84 項瀏覽器檢查通過。Git 尚未提交／推送。下方舊文件進度保留為歷史，不當成本輪完成比例。

## 本輪新目標：本機可操作後台（2026-10-13 已確認）

取代原先以總計畫文件交接為主要驗收的方式，不取消既有架構規劃。Fish 要親自操作介面，確認畫面、入口與操作流程是否符合期待。

驗收流程：進入後台 → 新增商品 → 設定收費 → 指定取得內容 → 儲存 → 回到列表 → 重新整理 → 再次編輯 → 切換買家視角查看結果。

| 本輪交付 | 可觀察的通過條件 |
| --- | --- |
| 商品管理 | 可新增、編輯、搜尋、篩選單堂課、組合包、獨立程式碼包與 SaaS 商品；既有資料正確帶入，新增表單不殘留前次輸入 |
| 收費與取得內容 | 可選一次購買或月／季／年方案，設定課程集合、程式碼包或服務入口；錯誤輸入顯示繁中提示並保留資料 |
| 本機保存 | 儲存後列表與再次編輯一致，重新整理頁面仍保留；儲存不可用或資料損壞須明確提示，不假報成功 |
| 買家視角 | 模擬取得選定商品後只呈現其指定內容，不把登入當成全站課程授權；SaaS 入口與本平台課程分開；全程標示本機示範，不假稱正式權限驗證 |
| CRM／直播示範 | 可操作示範列表、查看資料與篩選；明確標示尚未串接真實寄信、直播與外部服務 |

範圍：延續既有後台視覺及分組，不打掉重練；本機示範資料不得混入正式帳號、資料庫或訂單。真正扣款、續訂、寄信、開播、部署與供應商整合不在本輪。

施工方式：單一 Agent；先把這項新增行為納入對應 SR 的規格與待辦，再補操作程式。保留所有已完成文件任務，不將舊 68／75 改稱本機功能完成度。

驗證：先建立針對新增／編輯／指定內容／重新整理保存的行為檢查，再用 ego-browser 在桌面與手機尺寸走完整流程，保存實際回讀與截圖。通過舊原型的 46 項檢查不代表新增保存與買家視角已通過。

交付入口：提供本機可直接開啟的頁面及短驗收路線；Git 提交、推送與任何部署分別記錄，不冒充已交付。

目前狀態：第 11 節已納入 SR；11.1～11.3 已施工與驗證。直接開啟 `creator-local-acceptance.html`；短路線見 `creator-local-acceptance-guide.md`。25 項 model PASS；84 項 ego-browser PASS（1440／390），截圖與 result.json 在 `evidence/local-acceptance-E4uTvk/`。這是本機示範功能，不是正式權限／付款／provider 驗收。Git 尚未提交／推送。

## 這輪交付

交付一份能直接拆成開發工作的總計畫。Fish 驗收時能回答：賣什麼、買家拿到什麼、後台怎麼操作、每個功能什麼順序做、更新出問題怎麼恢復。

入口：`startkiter-creator-platform-progress-uiux.html`。HTML 是導讀與畫面提案；proposal、design、specs、tasks 是開發依據。

## 五個驗收條件

| 驗收項目 | 要交付的具體結果 | 通過條件 |
| --- | --- | --- |
| 商品與授權 | 單課、Bundle、獨立 CodePackage、訂閱的交付矩陣 | 登入不會取得全站課程；方案明訂課程集合、程式包、更新與取消政策；未決政策列為阻擋該功能的選項 |
| 買家使用 | 取得程式包 → 桌面 AI 開啟專案 → 設定 → 本機啟動 → 部署 → 更新的流程 | 我們的網站、買家自己的 SaaS、買家的終端客戶權限分開；說明手冊／Skill、憑證、部署和維運責任有對應文件 |
| 後台 UI/UX | 桌機功能分區與手機流程的畫面提案 | 有明確入口、列表、編輯、返回、成功／失敗／空資料／無權限；手機能看價格、狀態與操作，不把主要任務藏在橫向表格裡 |
| 分批開發 | 每張後續 SR 的目標、前置、交付、驗收和回滾卡片 | 清楚區分已存在程式、正在改的程式與未施工功能；同一 route／資料真相只有一張 SR 負責；列出下一張施工 SR 的進入條件 |
| 擴充與更新 | CRM、行銷、直播、AI 的模組與相容性邊界 | 新功能引用既有註冊、權限、事件和 UI 契約；更新保護買家客製；資料遷移與回滾保留歷史交易；AI 重要操作有人工核准 |

## 初次分析結果

`spectra analyze creator-operations-platform-blueprint --json` 在本次執行 exit 0：Coverage、Consistency、Gaps、Localization 均標 Clean；Ambiguity 有 50 項 Suggestion。這是結構分析結果，不能代替語意檢查或功能驗收。

### 必須先修正的語意問題

| 問題 | 位置 | 對開發的影響 | 整理方向 |
| --- | --- | --- | --- |
| 文件 SR 的待辦混入功能施工 | tasks.md 開頭與第 9 節 | 開頭說只交付文件，第 9 節卻要求完成各功能及實際付款／部署驗收 | 第 9 節改成後續 SR 的交接卡片；實際施工與證據放回各功能 SR |
| 任務編號重複 | tasks.md 第 3 節的兩個 3.5 | 無法明確追蹤買家授權與訂閱決策 | 統一編號並核對引用 |
| 銷售施工順序描述不同 | tasks.md 9.6／9.7 與 design 的第一條垂直切片 | 原定第一條銷售切片已在工作樹改動，另一段又排在完整 commerce 基礎之後 | 明訂目前切片重用範圍、後續通用 Offer 的擴充界線及切片驗收前置 |
| 交接現況已過時 | CONTEXT.md、銷售 SR proposal 的 Prerequisites | 文件說銷售 SR parked／沒有 runtime 修改，目前工作樹已有大量相關程式變更 | 依實際 branch、檔案和已取得證據更新；不把清單打勾數當程式完成比例 |

### 尚待確認，不能自行定案

訂閱取消後的權限截止時間、程式包更新期間與授權數量、直播供應商、錄影／逐字稿保留期限、發票／SMS／AI 供應商，沿用 design 的 Open Questions。先為每個問題寫清楚影響哪張 SR；只在該張功能開始需要答案時逐題對焦。

## 下一張施工工作的方向

2026-10-13 本輪已修正 tasks 重複編號、文件／runtime 混用與銷售切片優先順序，並在 CONTEXT／銷售 proposal 更正 active 與已有程式修改的狀態。交接草稿見 [Creator 平台開發交接](creator-platform-development-handoff.md)。重新分析：總藍圖 0 Critical／Warning、50 Suggestions；銷售 SR 0 Critical／Warning、29 Suggestions；兩者 Spectra validate 均通過。這些是文件檢查，不是程式或部署驗收。

優先收尾已進行中的 `public-multi-course-sales-and-code-package`：公開課程 → 選方案 → 結帳 → 指定課程權限 → LINE／Email → CodePackage 領取。

進入條件：其 proposal／design／tasks 與總計畫一致，確認隔離測試環境、歷史訂單映射和 Bundle 舊路徑責任。正式付款、寄信、GitHub 權限與部署證據需由該 SR 各自取得。

CRM、直播、AI 及完整訂閱擴充依後續 SR 交接卡片進行。這輪總計畫通過不代表這些功能已上線。

## 2026-10-13 本輪核對證據

已讀十一份規格，111 個 Scenario 各有一個 GIVEN／WHEN／THEN Example。這些是未來施工的驗收例子，不是已執行的測試。

| 核對 | 實際結果 |
| --- | --- |
| 規格例子 | buyer SaaS 10、AI 8、analytics 8、commerce 14、CRM 8、live 18、marketing 8、foundation 8、UI/UX 11、update 10、Taiwan 8；合計 111／111 |
| Spectra analyze | Coverage／Consistency／Ambiguity／Gaps／Localization 全部 Clean，findings 為空 |
| Spectra validate | `creator-operations-platform-blueprint — valid`，exit 0；對應 task 10.2 已核對 |
| 商業邊界 | 已交付原始碼授權、更新資格、服務存取、GitHub grant 分開；未決政策阻擋受影響的新 Offer，不暗改歷史訂單 |
| 畫面交接 | [UI 畫面與狀態驗收表](creator-platform-ui-state-matrix.md) 已建立；是施工規則，不是全部狀態已有可操作 Demo |

上方「初次分析」及「下一張施工工作」中的 Suggestions 是歷史紀錄。本輪已消除總藍圖的分析 findings；但自動分析無法證明來源盤點、所有畫面及十五張交接卡片完整，因此 10.1／10.3／10.4 仍未勾選。

來源與責任對照已補至 [施工責任表](creator-platform-source-ownership-map.md)：十五張後續能力／五張既有 SR、77 個來源連結均已定位；該階段 task 8.1 核對後為 5／75。後續卡片審查結果見下方；任何文件勾選不代表 runtime 已通過。

本輪發現四個不能略過的差異：MONTH／YEAR 以外的季訂閱尚未有現行 enum；App workspace 與 Organization 需要橋接；writable repo 的 canonical 承諾與目前 pull 交付不同；版本 fetch／merge hint 尚未具完整安全更新 gate。各自 owner、進入條件與不能做的事已寫入責任表、handoff、design Open Questions 及 CONTEXT。

HTML 沿用 html-visualizer 既有模板，新增四張落差卡片及責任表入口。靜態 verify：12 項通過、0 項未過、1 項未驗證、4 項刻意跳過；以 no-layout／no-stamp 做唯讀檢查，SVG 瀏覽器子檢查明確停用並記為未驗證，避免改用專案禁止的 Playwright。桌機／390px／互動巡查仍須 ego-browser，本輪未執行。`git diff --check` 通過；未重跑應用程式測試，未部署或更動外部帳號權限。

### 十五張交接卡片核對結果

handoff 已補齊十五張卡片的施工補充矩陣：進入／退出條件、migration／provider、明確不做範圍、驗收與回滾責任；同 ID 的 source／owner 沿用責任表，不建立第二份資料真相。共用 runtime gate 明列 repo 已有的 `pnpm type-check`、scenario→實際測試映射，以及依功能需要的瀏覽器／付款／寄信／GitHub／影音／部署證據；本輪沒有執行這些 runtime gates。

依賴表有 16 個階段節點（SR-06 拆 06C 契約／06R 整合，其餘能力仍在原十五張 SR），程式核對所有前置存在、無循環；不等於已施工。06C→11→06R 避免 commerce 與 provider 互等；先收尾 07，不把整個新 Creator 殼當銷售切片前置。

task 8.3 與 9.1～9.15 已按卡片內容審查勾選，文件清單實測 21／75。新增 design 決策起初缺 tasks 引用，已在待辦 8.4 修正並重驗：Spectra 五面向全 Clean、findings 空，validate exit 0，`git diff --check` 通過。

HTML 已同步為本階段的 21／75；CodePackage 單賣／訂閱目標也已修正說明，不重新當成未決能力。ego-browser 本機巡查找到並修正搜尋覆蓋草稿篩選的 Demo bug，實際回讀空結果、重設焦點、方案預覽、390px 卡片／表單與無水平溢出；六張真實截圖及未驗收項目見 [UI 瀏覽器證據](creator-platform-ui-browser-evidence.md)。未以此勾選全部 UI 工作。

HTML 本輪再補三種方案的示意回填、建立清空、名稱／價格驗證、共用七種頁面狀態及恢復；獨立 CodePackage 的桌機／手機、錯誤焦點與修正預覽已真實操作回讀。也修正 display:grid 蓋過 hidden 而使一次付清露出收款週期的問題。持久化截圖增至九張；七種狀態以 DOM fixture event 驗證，原生 state selector 鍵盤尚未通過，不能用前者冒充後者。

下一個關卡：新流程圖配色依 diagram-design 的首次樣式 gate 待確認；單課／Bundle 回填與全路徑、所有按鈕／原生鍵盤、CRM／直播巡查尚未完成。待圖解與 UI 核對後再作總藍圖逐項交叉驗收。未決供應商與授權條款保留決策阻擋，不自行定案。

## 交付狀態規則

### Live原型篩選實際修正

原型即時/常青/all三按鈕先真實重現無handler，再以獨立data属性/filter邏輯補接；不改正式webinar程式。`verify-demo-ui.sh`新增每尺寸三個assert後實跑exit0，46PASS/0FAIL，12新圖/result.json持久化，桌機/390px的live圖主控看過；兩次script合計與舊圖共有36圖，只是圖檔數不是全情境數。

這補了可見按鈕行為，不宣稱Live provider／participant data／booking／正式role或保存已完成。2.8完整UI仍pending、文書68／75，未提交／推送。原型和驗收腳本未碰其它工作空間或真正活動資料。

### 原型腳本局部驗證

新增verify-demo-ui.sh並實跑exit0：40 PASS/0 FAIL，1440/390涵蓋三種方案回填、清空/錯誤/修正預覽、課程search＋filter、CRM/Live頁切換、原生typeahead/恢復與width。兩次腳本設定/selector失敗有具體修正，不改原型來蒙混。12張本輪圖與result.json持久化，總24張；看圖記錄與unverified在UI證據。

仍未過ArrowDown/native完整keyboard、保存／角色／server/provider/rollback與所有按鈕；Live三filter控制尚無handler。2.8保持pending、文件68／75不變，沒有把局部PASS縮成總目標完成。腳本不碰其它工作空間或正式服務；UI全面/圖解/P05/snapshot/repo/Git仍待。

### 原生鍵盤局部實測，不擴推UI全部通過

spectra-debug隔離探針顯示：trusted ArrowDown/Enter到達頁面且未preventDefault、focus可用，但Demo與無腳本的原生popup select均不改值；原生text可輸入、inline listbox可a→b。未改Demo樣式來過關，也未宣稱修好ego內部問題。

fresh reload的原Demo以真正CDP char「讀」做原生typeahead，normal→error且trusted change=true；實際重試回normal與焦點，新增第十二張截圖／記錄與限制。早期手機offers回讀沒有不同before，已降級為呈現證據，不當鍵盤切換PASS。2.8保持pending，完整UI／ArrowDown popup／mobile／角色與mutation未通過；文件數仍68／75，無runtime或全域工具設定變更。

### 憑證路徑靜態審查

已讀 protectedProcedure、submitCredential、credentials、deployment DB/schema、coolifyRequest/setApplicationEnv/redeploy與共用handler/logger，handoff補七段來源/責任/限制與canary驗收矩陣。Session user→where userId→kind/key配對→request內pending值→核准env API→restart只回queued；顯式部署metadata/log參數不包含secret值，但共用onError記整個error、一般Consola無專用redactor，不能擴推全鏈無洩漏。

BuyerDeployment.userId是index非unique、findFirst不表示buyer選的多部署target；目前handler以coolifyAppId存在作前置，不聲稱已檢每個tier/target與新provider mapping。3.9的文書/靜態path/non-allowlist否決情境已核對，清單68／75；所有canary分支、去敏、健康/實際接線與服務安全仍待SR-04實跑，不拿本輪取代。

本輪沒讀.env/真實secret、沒有呼叫Coolify或改auth/logger/schema/provider；分析Clean/validate/`git diff --check`通過。剩2.8/3.10/8.2/8.4/8.5/10.1/10.4與Git未完成。

### CodePackage／訂閱／政策逐題整理

[政策決策表](creator-platform-policy-decision-register.md)列P01～P15的具體選項/欄位、適用Offer/module/tier、影響SR與未決發布阻擋，區分已確認目標與未選商業/供應商/保存值；附none/perpetual/active_period與standalone/attached、退款/其它來源重算、一官方repo的判斷。decision metadata與approved證據規則明確，沉默、預選、自動goal續作不當核准。

3.4、3.16、10.3文書整理核對後67／75，design/handoff/CONTEXT與audit/HTML對接。這不是替Fish核准app數、取消期限、repo方案、SMS/發票/Live/AI供應商或retention。總藍圖analysis全Clean、validate exit0、`git diff --check`通過，仍8項pending：2.8、3.9、3.10、8.2、8.4、8.5、10.1、10.4；Git與完整最終驗收未完成。

### 證據盤點／工作台／AI 文書核對

逆向清單2.2/2.3補十四類代表模組的入口/list/create/edit/detail/empty/error欄位與L1-L10對照、來源lineage、八指定package/app分類與CLI位置快照。SMS/Segments等不能由高層樹狀圖當成已見入口，第三方未觀察欄位保留pending；A只限當時Dashboard/展開導覽動作，B/C不擴推成完整CRUD。本輪沒有重新登入/觀察第三方帳號，parked客服infra只有一張且未unpark。

事件契約補六類工作台任務卡的source/owner/具體下一步/返回、正常空/錯/denied與retry；AI人審固定context/source/版本/target與approval scope，執行再驗權/consent，保留draft/決策/action audit，legacy兩唯讀工具與buyer Code Skill隔離。對照operations/AI情境及已讀site-agent source，不宣稱正式Task routes或模型工具已實作。

1.1～1.4、7.1、7.5文書核對後64／75，HTML/audit同步；total eleven specs仍111例子，分析五面向Clean/findings空、validate exit0、`git diff --check`通過。剩11項：完整UI script、CodePackage/訂閱決策表、secret/update/buyer/snapshot整合、新圖與最終handoff/全份/Git gate；沒有模糊回報全逆向完成。

### 模組／客製／更新發布文書核對

handoff 的「模組、買家客製與版本發布清單」對照實際 AppRegistrationManifest／PluginManifest／repo-version及update spec，補 registry與release欄位的兩層區分、core/official/generated/custom四類檔案、六部分release record、expand/migrate/opt-in/contract門檻，以及六種變更批次的consumer/regression/rollback owner。缺相容／checkpoint／provider／UI證據不發布；檔案分類不只看資料夾，不覆寫generated手改或buyer custom，不拿template版本比較當deployed更新成功。

3.11～3.13、3.15、8.6 文書對照後核對，清單為58／75。3.10／8.5 的repo／guide／真實updater整合仍pending；新商業policy未核准，flag/channel與migration/rollback只是要實作的契約，不聲稱已可用。

重驗分析五面向Clean／findings空、validate exit0、`git diff --check`通過；本輪沒有merge/reset買家repo、搬資料、改env或部署。剩17項、新圖配色、完整UI、snapshot／credential／repo／source與Git仍未完成。

### 台灣交易／課程重用文書核對

[台灣交易交接](creator-platform-taiwan-commerce-handoff.md) 明列公開頁／表單或登入返回／catalog／checkout／通知／發票與資格／LINE／CodePackage／welcome 的最小閉環、五種付款／取消接口、七類 provider/secret/unknown/rollback、真實 i18n keys／TWD／UTC、LINE與個資六種用途及 Course 功能重用表；不把法律適用、保存天數或新供應商當成已核准。

3.2、4.1～4.5 文書對照 Taiwan 8／commerce 14 情境、已讀 checkout／Order／PAYUNi／welcome／i18n source 後核對，清單為 53／75。Course reuse 說明補進既有 sales design，pending task 4.2 補引用以消除新增 design topic 的 Warning；沒有勾掉 sales runtime 項目。

發現並保留時點差異：現行 `apps/saas/lib/orders.ts` 在 paid 流程查 CourseOffer.courseId 寫資格；總 blueprint 要通用 checkout/agreement 固定完整 resources/policy。單課關聯鎖定不證明 Bundle 歷史已完整，8.2 遷移／語意對接仍 pending；沒有修 runtime 或誤稱兩者已一致。

總藍圖分析全 Clean／0 findings；銷售 SR 0 Critical／Warning、29 Suggestions；兩張 validate exit 0、`git diff --check` 通過。其餘 22 項、snapshot／repo／provider／UI／新圖配色／Git仍未完成。本輪未處理實際交易或憑證、未跑應用程式測試。

### 共用工作區／UI 契約核對

UI 狀態矩陣補明 Organization／Member／Invitation／CreatorProfile／App context 的唯一來源與橋接、買家學習入口不被強迫建立 org、server 授權與 nav fallback 分離；十一個 screen 的 purpose／primary action／inputs／next step／permission／recovery、共用 search/filter/cursor/form/detail/confirmation、desk／390px／keyboard/focus 與實際 UI 元件復用。Form/input/dialog/button 已讀 source，連結與 heading 檢查通過；未把元件存在當成 caller 接線或行為驗證。

task 2.1／2.3～2.7／2.9 的文書契約對照 Foundation 8／UI 11 情境後核對，清單為 47／75。2.8 的完整可執行 acceptance script 保留未完成，Demo state select 原生鍵盤與完整 mutation／角色／正式站巡查仍未驗收。本輪沒有新增 context bridge runtime 或改登入／資料庫。

重新分析五面向 Clean／findings 空、validate exit 0、`git diff --check` 通過；其餘 28 項、新圖配色、source／provider／repo、完整 UI 與 Git 未完成。

### 事件／自動化／營運文書核對

[事件與營運契約](creator-platform-event-operations-contract.md) 明訂 envelope／producer／consumer／transactional outbox／去重、Campaign 全狀態、寄前 consent／deliverability、accepted 與 delivered 的證據差別、unknown outcome 的安全對帳／重試／人工處理、報表 scope／UTC／source version／收退款公式、server-scoped export、七類失敗 owner／任務／恢復與六域 retention／rollback。已讀 Recipient／EmailDeliveryLog／AutomationDelivery／PaymentWebhookEvent 欄位對照，明確保留現行 reconciliation／通用 outbox 缺口，不聲稱已有。

task 6.1～6.4、7.2～7.4、8.7 的文書契約對照 specs 後核對，清單實測 40／75。Marketing spec 補 delivered evidence 與 unknown 不盲重試，timeout 例子限定為 adapter 確認接受前失敗；不再將外部 side effect 保證與本地事件去重混為一談。報表文書算術例去重 8800、扣 refund 2000 得 6800／下一區間 −2000 自查通過，只是公式一致，不是 application tests 或正式營收驗收。

重新 Spectra 五面向 Clean／findings 空、validate exit 0、`git diff --check` 通過。其餘 35 項、新圖配色、完整 UI、來源／repo／provider 實跑與 Git 仍未完成；本輪沒有寄信、外部 webhook、模型資料傳輸、影音服務、正式報表／匯出或應用程式測試。

### 買家授權／部署／Skill 文書核對

handoff 補上 license 主體／policyVersion／source-use／app count／商用／更新／服務／grant／退款取消／支援欄位，三 tier owner／transition，買家自有 session／Organization／付費頁資料真相，以及版本化手冊／Skill 的欄位、permission、操作／停止／回滾／證據。task 3.5～3.8 與 3.14 的文件矩陣已對照 buyer／update specs 審查，文件清單為 32／75；沒有替 Fish 核准 app 數、期限或商用條款。

本輪讀到的 credential handoff 通用 key 與 PAYUNi／ToSend reader 欄位不同；managed endpoint 也不是 self-hosted 路徑。舊 self-hosted canonical 仍指 README Zeabur 指引，不能把平台 Coolify 部署當成買家指南已遷移。上述為 SR-04 新交接阻擋，不宣稱無效金鑰曾被真的送出，也不宣稱已接通 provider；3.9／3.10／8.5 保留未完成。

重新分析五面向 Clean／findings 空、validate exit 0、`git diff --check` 通過。只修改交接、來源表、待辦／稽核與 HTML 進度；未讀寫實際 credential、未部署／改 GitHub 權限、未跑應用程式測試。其餘 43 項仍待充分證據，Git 與新圖配色仍未通過。

### 商品／CRM 文書契約核對

[領域判斷表](creator-platform-domain-decision-tables.md) 明列七層真相、12 個交易／退款／取消案例、Contact／User 的 verified link／merge／delete、分眾欄位／operator／關聯／referenceTime／snapshot、目的／通道／workspace 與送達 gate、匯入 preview／commit／checkpoint／匯出／恢復。規格補明 hard-bounce 不被 consent grant 清除，以及 checkout 快照與其它有效 grant 的保護。

已按上述內容與 CRM／commerce 情境核對 task 2.2、3.1、3.3、5.1～5.3，實測文件清單為 27／75；稽核索引同步六項來源位置。111 個 spec 情境／例子仍保留，未改作已執行測試。文書案例的集合聯集運算自查通過，只證明判斷表的算術期望一致，不代表程式 grants 已通過。

重新執行 `spectra analyze` 五面向 Clean／findings 空、`spectra validate` exit 0、`git diff --check` 通過；本輪沒有跑應用程式測試或外部 provider。未決 license、取消期限、repo 移轉、來源研究、完整 UI／流程圖與 Git gate 仍未完成。

### 全貌文件交叉檢查

新增 [26 類已知能力目錄](creator-platform-capability-catalog.md) 與 [75 項完成稽核索引](creator-platform-completion-audit.md)。索引完整覆蓋原待辦，但未把其它 54 項自動勾選；來源定位不等於驗收通過。商機、日曆、SMS、分潤、實體與其它資源商品有獨立 owner／研究 gate，不因十五張核心卡片而漏列。

中央藍圖已修正 runtime 現況、十一份 specs、能力索引／唯一 handoff 依賴、Entitlement／CodePackage resource／license／GitHub grant 分層、候選客群未定案與唯一 ego-browser 驗收。逆向清單修正 one_time 付款模式、發票不是固定授權前置、退款不自動撤回行銷同意，並與十五張核心索引對齊；未操作 checkbox 仍保留未完成。

已檢查 26 能力列、75 待辦列、36 個目錄來源連結，沒有缺失本機連結；Spectra 五面向 Clean／findings 空、validate exit 0、`git diff --check` 通過。HTML 新增五個展開分區已真實點擊與桌機／390px 回讀，持久化截圖共十一張；後續白話文字修訂仍待最終巡查。這不是全份 75 項語意驗收已完成的宣告。

文件存在、文件一致、程式已寫、測試通過、外部流程驗收、部署及推送分開報告。這輪結束時附修改文件、分析結果、尚未決定事項及下一張 SR；只對實際符合條件的文件待辦打勾。
