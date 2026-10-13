## Context

2026-10-13 Fish 已確認兩層選單，但要求先看 SR 與分工再開工。本輪只建立計畫，不派 Agent、不改程式。現場 branch 為 feature/public-multi-course-sales-and-code-package，已有大量未提交修改，不可將整個 dirty tree 歸到本 SR。

已讀本機實體來源：creator-local-model.js 的 validate／load／save／acquire；creator-local-navigation.js 的 groups／items；creator-local-ui.js 的 render／renderForm／renderContacts／renderLive／selectSub。資料 key 為 startkiter-local-acceptance-v1；舊殼把三角色模板及 handler 混在同檔。30 項 node tests、106 項導航 browser checks 是前一版歷史證據，不是本 SR 待施工程式已通過。

## Design Source

Source：Fish 提供的 Systeme 設定頁截圖用來確定上方分類、左側情境子選單與右側表單；不複製其個資、品牌、文案或供應商設定。視覺基底沿用目前本機 Demo，待 Fish 核准本 SR 後固定其殼與共用樣式，不重新換色。

Cache：`.spectra/design-cache/creator-backoffice-local-acceptance/source.dc.html`，2026-10-13 複製既有 report；同目錄保留當時 model／navigation／UI 三個 script。這是設計來源快照，不是正式 runtime 或已核准的新成品；只能以實際 docs 本機入口驗收。

| 共用設計值 | 來源中的值 |
| --- | --- |
| 背景／文字／重點色／邊框 | #faf9f5／#141413／#d97757／#d1cfc5 |
| 字型 | system-ui、Apple system、PingFang TC、Noto Sans TC；不加新字型依賴 |
| 桌面主殼／側欄 | 最大1380px／230px，內容欄 minmax(0,1fr) |
| 內容間距／圓角 | 24px／7px；按鈕5px |
| 手機情境選單 | 760px 以下可展開，主要驗收390px；不把整套桌面側欄強塞手機 |
| 圖示 | 沿用來源的 SK 文字標記；新增圖示只能用現有標準 SVG 資產，不用 Emoji |

## Goals / Non-Goals

Goals：單一本機入口切换三角色；創作者完整主分類與情境子選單；既有商品保存、交付快照與買家指定內容不回退；管理員能查看示範使用者／角色／模組；手機能完成同一操作路線；三個 Agent 同時工作但不互改檔案。

Non-Goals：不做正式帳號與 server authorization；不改 apps／packages／DB／provider／部署；不讀真實憑證或個資；不承諾所有總藍圖業務能力可執行；不把只供畫面驗收的設定列為已保存；不新增框架或 workflow 產品。

## Decisions

### 一張本機 UI SR 承接交付，總藍圖保留研究與正式功能邊界

Supersedes：creator-operations-platform-blueprint／「本機操作驗收取代文件比例作為本輪目標」中的後續本機 UI 施工責任，不撤销原商品與交付契約或已完成11.1～11.3證據。核准後，主控只把未完成11.4／11.5實作與驗收責任改為引用本 SR；保留待辦歷史映射，不假勾舊待辦。未核准前本 SR 為計畫，無 worker 寫檔權限。

Alternatives Considered：繼續把全部 UI 放總藍圖，否決，文書比例與功能進度混用；立刻拆三張角色 SR，否決，同一套導航與互動規則容易分裂且增加交接。正式交易／CRM／直播後續仍走原各功能 SR，不重開重複責任。

### 共用殼先固定，三個角色 view 以不重疊檔案平行施工

主控先建立 RoleViewContext／action interface 與最小整合 caller。A只寫 admin view，B只寫 creator view，C只寫 buyer view；各自 tests 跟隨同一 owner。模型、導航、CSS、共享helper、script載入、handler、整合測試、瀏覽器與Git全部由主控負責。

Alternatives Considered：三個 worker 改同一 creator-local-ui.js，否決，會覆蓋 handler 與角色狀態；每個 worker 自己選 UI library／資料模型，否決，帶來三套樣式與規則。先有共用介面才平行，不以等 worker 的時間重做同一工作。

### 保留操作版與版型提案的可見界線，先兼容再切換

商品保存、模擬取得及買家快照仍透過原 model；管理員的列表／篩選／詳情可操作示範fixture，不進正式權限。其他未串接頁面显示明確設計狀態，沒有裝飾用保存／扣款／寄信／開播按鈕。新角色 view 全部註冊且測試通過才切預設；途中繼續用舊殼。

Alternatives Considered：假資料模擬已接金流／寄信並顯示成功，否決，誤導功能驗收；先重做正式後台與provider再看UI，否決，超出本機驗收且會延後對焦。

## Implementation Contract

**主控與 worker 的固定介面**

以下標題是介面說明，不是另設架構決策。RoleViewContext 是 plain object：`{role, group, sub, page, products, acquired, fixtures, editing, filters, helpers}`；products／acquired 為由主控提供的唯讀快照。helpers固定為 escape、button、heading、price、resourceNames。views 不讀 localStorage、location、環境變數，不自行 fetch、不掛全域 event listener、不改共用資料。

每個 view 提供 `render(context) -> HTML string`，註冊到 `window.CreatorLocalViews.admin|creator|buyer`；同檔提供 CommonJS export 供 node:test 使用。主控提供三個實際 caller，將返回字串放入內容區，並用既有 model處理事件。所有來自 fixture／使用者的文字先escape；不得直接插入未轉義資料。

共用命令限定 nav/module/submenu、new/edit/save-product、filter/search、acquire/view-resource、show-detail/back、switch-role。資料命令只由主控處理與驗證，unknown command 顯示明確不支援且不寫入。工人只能用核准的 data-action／data-id，不發明額外儲存key或直接呼叫provider。切頁與role明確顯示目前位置；有未保存表單時，先提示留在頁面或放棄輸入，不默默丟失。

**角色頁範圍與責任**

| Owner | 唯一寫入範圍 | 可驗收結果 | 明確不做 |
| --- | --- | --- | --- |
| 主控 | creator-local-ui.js、creator-local-navigation.js、creator-local-model.js（僅相容性修正）、共享樣式／helpers／contract、HTML script tags、整合腳本及文件 | 同一入口、角色標示、兩層選單、儲存與錯誤、三view caller、整合及交付 | 不把正式業務功能混進示範 |
| A | docs/blueprint/creator-local-admin-view.js、creator-local-admin-view.test.cjs | 平台概況、示範使用者與角色篩選／詳情／返回、已註冊模組與版本詳情；設定顯示未串接 | 不改正式使用者或角色、不升級真模組、不改殼 |
| B | docs/blueprint/creator-local-creator-view.js、creator-local-creator-view.test.cjs | 四類商品列表與表單、一次／月／季／年、指定交付；CRM／直播示範列表／篩選／詳情；其餘主分類有結構化版型與狀態 | 不改model／殼／導航，不串接付款寄信直播 |
| C | docs/blueprint/creator-local-buyer-view.js、creator-local-buyer-view.test.cjs | 可取得商品、我的內容、空狀態、指定課程入口／程式包交付說明／獨立SaaS入口；返回路徑 | 不真的付款、登入SaaS、下載GitHub或授權全站 |

**主控驗收與 worker packet**

每個 worker拿到自己的task編號、完整描述、上述介面、自己的規格案例、cache來源、允許／禁止路徑、focused test命令、TDD與audit要求。不得自行commit／push／deploy／archive／操作Spectra task狀態／啟動瀏覽器或碰其它工作空間。修改檔案清單、行為RED或regression證據、GREEN輸出、未完成與blocker要一起回傳。缺共用介面或遇到已存在使用者修改時停寫，回報主控，不自行改契約。

主控集中驗證：node --test docs/blueprint/creator-local-*.test.cjs；bash docs/blueprint/verify-local-ui.sh；bash docs/blueprint/verify-navigation-demo.sh，再補三角色整合／未保存轉場腳本。ego-browser桌面1440／手機390逐一巡查受影響入口，截圖並回讀保存／重整／篩選／詳情／返回／focus；測試不得清除用戶資料或操作其它task space。browser控制交接必須遵守ego ownership，不以新建空間繞過用戶控制。

In scope：上述本機檔案、設計與測試、SR／CONTEXT／本機dashboard引用。Out of scope：全部 apps／packages／Prisma／正式資料／secrets／供應商／網路部署。授權 gate：Fish 核准這張SR與分工才unpark/apply；scoped Git plan再依專案規則核准，未批准不得混入dirty tree。

## Risks / Trade-offs

[共用殼沒固定就派工] → 主控完成1.1～1.3才同時派A/B/C；任何worker不能改共用檔案。

[三張角色畫面各自一套樣式] → 共用CSS與helper在設計快照固定，worker只產內容模板，樣式新增交回主控。

[Demo被當成真實功能] → 每個role及未串接頁面常駐標示；操作版與版型提案的驗收表分開，provider按鈕不假報成功。

[拆view導致本機保存或交付回退] → 保留storage key/version=1及model真相，舊路徑一直可用，取得快照不重算。

[同時worker增加成本或未必加快] → 固定上限三個、互不重疊，工作被阻擋就回報主控；不再另造workflow基礎設施。時間為估計，首批交付後用task實際起訖與測試耗時修正。

## Migration Plan

1. Expand：主控記錄本輪逐檔baseline，移交舊SR未完成UI責任；增加角色view介面與fallback，舊殼保持預設並通過現有focused tests。
2. Migrate：三個worker在各自檔案完成測試與模板；主控集中接線，缺一view時維持舊殼，不用不完整成品取代入口。每個batch先跑角色focused tests，再跑共用model/navigation與UI回歸。
3. Contract：三個view的caller及整合檢查都通過才刪除已移轉的重複template；保留單一有效入口與原storage，回滾只回到baseline舊殼，不清除任何本機用戶資料。
4. 本機交付：入口仍是 creator-local-acceptance.html，主控以ego開啟并留給Fish驗收。無正式部署、無DB migration、無provider環境變數。提交／推送在scoped plan獨立核准後進行。

## Open Questions

僅待 Fish 核准本 SR 範圍與三worker分工；核准前不派出worker。正式provider、訂閱政策、repo授權數量沿用總藍圖政策register，不影響這輪隔離UI。第一個整合畫面目標30分鐘、本機整合驗收90～120分鐘均為估計，不是保證；以1.1～1.3實際耗時及第一批worker回報校正，發現超時就回報完成畫面與剩餘步驟，不擴寫文件掩蓋阻擋。
