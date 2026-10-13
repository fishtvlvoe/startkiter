# Systeme.io 逆向工程與 StartKiter 對照清單

狀態：Reverse-engineering inventory v0.3；已知入口與研究清單，不是所有頁面／操作已完成的宣告
日期：2026-10-13
用途：把 Systeme.io 的平台能力拆成可驗證的功能、流程、資料、權限與 SR 缺口；不複製品牌、版面或內部實作。

完整已知範圍見 [能力目錄](creator-platform-capability-catalog.md)；實際 source／owner 與可施工邊界見 [施工責任表](creator-platform-source-ownership-map.md) 及 [開發交接](creator-platform-development-handoff.md)。下方未勾選的逆向項目仍未完成，不能因總計畫文件存在就改成已觀察。

## 0. 這份文件回答什麼問題

前次 REA 已完成高層差異盤點，並產出：

- `docs/blueprint/startkiter-creator-platform.md`
- `openspec/changes/creator-operations-platform-blueprint/`
- 第一條垂直流程：`public-multi-course-sales-and-code-package`

前次結果是產品藍圖，不是完整逆向清單。本文件補上逐項盤點格式，讓每個 Systeme 能力都能回答：

1. Systeme 有什麼。
2. StartKiter 現在有什麼。
3. StartKiter 哪裡只有半套。
4. 哪些應該重用、擴充、新建或不做。
5. 最後要拆成哪一張可驗收的 SR。

## 1. 逆向工程邊界

### 1.1 只提取這些東西

- 使用者看得到的資訊架構與模組分組。
- 每個頁面的主要任務、輸入、輸出與下一步。
- 建立、編輯、發布、排程、付款、退款、取消等狀態流程。
- 角色、workspace、資料擁有者與權限邊界。
- 內容、商品、Offer、Order、Subscription、Entitlement 的資料關係。
- 事件、觸發器、條件、動作、寄送結果與重試邏輯。
- 空狀態、載入、錯誤、權限不足、重試與手機版行為。

### 1.2 不提取這些東西

- Systeme.io 的品牌、文案、顏色、元件外觀或內部程式碼。
- 未經授權的 API 破解、帳號資料匯出或安全測試。
- 把所有功能直接塞進一張巨型 SR。
- 因為 Systeme 有某功能，就推定 StartKiter MVP 必須立刻擁有。

### 1.3 證據等級

| 等級 | 意義 | 可用於 |
| --- | --- | --- |
| A | 已登入頁面實際看到並完成操作 | 確認頁面與流程存在 |
| B | 頁面 DOM、路由、按鈕或表單可讀，但尚未完成寫入流程 | 初步功能盤點 |
| C | 官方文件、公開說明或產品導覽 | 交叉補充能力 |
| D | 根據介面推測 | 只能列為待驗證，不得直接拆成施工任務 |

## 2. Systeme.io 高層模組地圖

以下是研究／規劃的高層分類，只有第 2.1 的實際觀察記錄能支持「已看見」；樹中列出 Segments、SMS、Contact detail 等項目不表示本次都曾出現在免費帳號導覽或已操作。實際入口與未觀察頁面逐欄見下方第 2.2 節。

```text
Systeme.io Creator Platform
│
├─ Dashboard
│  ├─ 日期範圍
│  ├─ 即時更新
│  ├─ 指標卡
│  └─ 待處理事項
│
├─ CRM
│  ├─ Contacts
│  ├─ Tags
│  ├─ Segments
│  ├─ Pipeline／商機
│  ├─ Calendar／活動
│  └─ Contact detail／timeline
│
├─ Site
│  ├─ Website／pages
│  ├─ Funnels
│  ├─ Funnel steps
│  ├─ Forms
│  ├─ Blog／posts
│  ├─ Public creator surfaces
│  └─ Evergreen webinar funnel（Webinar／Unlimited 方案；不是即時直播）
│
├─ Email
│  ├─ Campaigns
│  ├─ Newsletters
│  ├─ Templates
│  ├─ Contacts／recipients
│  ├─ Delivery／opens／clicks
│  └─ Unsubscribe／suppression
│
├─ SMS
│  ├─ Provider settings
│  ├─ Messages
│  ├─ Campaigns
│  └─ Consent／suppression
│
├─ Automation
│  ├─ Triggers
│  ├─ Conditions
│  ├─ Actions
│  ├─ Workflows
│  ├─ Enrollments
│  └─ Retry／failure history
│
├─ Products
│  ├─ Physical products
│  ├─ Coupons
│  ├─ Courses
│  ├─ Course bundles
│  ├─ Communities
│  └─ Files
│
└─ Sales
   ├─ Orders
   ├─ Transactions
   ├─ Subscriptions
   ├─ Refunds／cancellations
   ├─ Affiliate program
   └─ Affiliate invoices
```

這張圖是資訊架構，不代表 StartKiter 要照搬同樣的選單文字。StartKiter 應保留自己的平台殼、課程深度、LINE、PAYUNi、台灣發票與 plugin 邊界。

跨產品參照：WebinarJam 的已登入 Webinar 管理頁面另有獨立 REA 觀察紀錄 [`webinarjam-reverse-engineering-notes.md`](webinarjam-reverse-engineering-notes.md)。它只補充 Webinar 管理介面入口，不併入 Systeme.io 的產品事實或技術棧結論。

### 2.1 本次 REA 觀察與官方文件交叉結果

| 能力 | 目前證據 | 能確認的事 | 邊界 |
| --- | --- | --- | --- |
| Systeme.io 免費帳號導覽 | A：REA 登入後實際讀取 Dashboard 與展開 CRM、Sites、Email、Automation、Products、Sales 選單 | 有 Dashboard、CRM（Contacts／Tags／Pipelines／Calendar）、Sites（Website／Sales funnels／Creator pages／Blog）、Email（Newsletter／Campaigns／Stats）、Automation（Rules／Workflows）、Products（Physical products／Coupons／Courses／Community／Files）、Sales（Orders／Transactions／Subscriptions／Affiliate invoices／Affiliate program） | 免費帳號頁面沒有 Webinar 導覽入口；不能據此推定付費方案的整體介面 |
| Systeme.io Webinar | C：官方說明文件；Dashboard 免費方案沒有此入口 | Webinar 是 Sales Funnel 的一種目標；官方說明列 Webinar／Unlimited 為建立資格。官方說明明確指出原生功能只支援自動化／常青 Webinar，不提供原生即時直播 | 實際影片串流供應商、影音傳輸架構與後端技術棧未由此頁面證實 |
| WebinarKit dashboard | A：REA 登入後查看 Webinar 清單、既有設定頁與頁面資源 | 可見 Automated、Live（鎖定）、Series 三種建立入口；設定分 Details／Register／Watch／Other，涵蓋報名頁、感謝頁、觀看室、回放、排程、Email／SMS 與 Webhooks／Google Calendar | Live 選項目前顯示鎖定；本次沒有建立、發布、付款或刪除 Webinar |
| WebinarKit 前端資源 | A：REA 被動檢視與一次唯讀重新載入 | 可觀察到 jQuery 3.7.1、Webpack vendor.bundle.js、theme.bundle.js、Bootstrap 5 風格的 Modal／Dropdown API、Feather／FontAwesome、Google Tag；支援聊天 widget 由外部 Lovable 網域載入 | 只代表本次登入頁面的可見前端資源；不能推論伺服器、串流服務、資料庫或完整 provider stack |

Systeme.io 官方來源：

- [How to create automated webinars](https://help.systeme.io/article/265-how-to-create-automated-webinars)：Webinar／Unlimited 方案資格、常青 Webinar funnel 與「不支援 live webinar」說明。
- [How to create a funnel](https://help.systeme.io/article/147-how-to-create-a-funnel)：Webinar funnel 是三頁流程，僅 Webinar／Unlimited 方案可選。
- [How to configure webinar emails](https://help.systeme.io/article/279-how-to-program-the-sending-of-webinar-emails)：以註冊或 Webinar 開始事件觸發提醒，並提供 show／replay link。

REA 證據：Systeme.io Dashboard ev_8897cc6318f338a17584cd7bb1ab2c6b3e31e22f612e4eabc0dff22d93a210da、導覽展開 ev_ac25e824b61d5bc8e40510b2f9013101d1392cb615dcc8b447f4e5ff44046ca8、WebinarKit 設定頁 ev_6cdcb571389ee60a0b79abb377653d64be5cf4e8a1e080ae3829abb866782438、WebinarKit network／資源 ev_579111d64499063ffb25906bdc043c8a0275b0c8afe962907107b7f7fc58d63d。

**產品決策影響**：StartKiter 必須把「即時直播」與「預錄常青 Webinar」建成不同交付模式。Systeme.io 的高階 Webinar 方案不等於原生即時直播；若 StartKiter 支援 live video，影片會議傳輸必須透過可替換的 provider adapter，不能把漏斗、報名、CRM、提醒與影音串流視為同一套功能。

### 2.2 代表頁面、操作與狀態證據盤點

本輪只重讀 2026-10-12 的既有 REA／官方說明紀錄，沒有重新連登入帳號。「導覽已見」只證明入口；第 2.1 的 A 是讀 Dashboard／展開導覽動作，不把所有模組 CRUD 提升為 A。下表以保守 B（入口/DOM）／C（既有官方來源）／pending 表達每種頁面，不用空白或產品常識填假證據。

| 模組／代表頁 | 列表／入口 | 建立 | 編輯 | 詳情 | 空狀態 | 錯誤狀態 | StartKiter 任務／owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | 登入Dashboard與導覽展開歷史紀錄；B頁面/入口、A只限當時導覽動作 | pending：非建立型主頁；待辦設定未觀察 | pending：日期/元件配置未逐項確認 | pending：metric來源/drill-down未完成 | pending | pending | 工作台可操作任務；SR-08，來源各domain保真相 |
| CRM Contacts／Tags | B：導覽文字；列表欄位／結果pending | pending | pending | pending：timeline/identity未操作 | pending | pending | Contact/Tag/Consent；SR-05 |
| CRM Pipelines／Calendar | B：入口；商機／活動欄位pending | pending | pending | pending | pending | pending | 候選pipeline/calendar SR，先research，重用CRM |
| Segments／Contact detail | 高層研究項；本次導覽記錄不足以證明有單獨入口 | pending | pending | pending | pending | pending | deterministic Segment／Contact流程是StartKiter目標，不當Systeme已觀察事實 |
| Sites Website／Sales funnels／Creator pages／Blog | B：導覽入口；各列表與builder欄位pending | pending | pending | pending：公開/發布版未走完整流程 | pending | pending | Page/Form/Funnel/CTA；SR-10 |
| Email Newsletter／Campaigns／Stats | B：導覽入口；recipient/report內容pending | pending | pending | pending：送達與開信指標未核對 | pending | pending | 既有newsletter＋SR-09/12，不猜provider能力 |
| SMS | 高層研究範圍；第2.1免費導覽摘要未提供獨立SMS入口證據 | pending | pending | pending | pending | pending | 候選SMS channel；待provider/用途/成本核准 |
| Automation Rules／Workflows | B：導覽入口；trigger/condition/action欄位pending | pending | pending | pending | pending | pending | SR-09，Outbox/enrollment/安全重試 |
| Products Physical/Coupons/Courses/Community/Files | B：導覽入口；商品/課程/社群各列表結果pending | pending | pending | pending | pending | pending | SR-06與course owner；physical/resource另research |
| Sales Orders/Transactions/Subscriptions/Affiliate | B：導覽入口；付款/commission行為pending | pending | pending | pending | pending | pending | payment/Offer/analytics owner；分潤獨立research |
| Systeme Evergreen Webinar | C：既有help文章資格與funnel說明；免費帳號無入口 | C說明不是本次已建立 | pending | pending | pending | pending | SR-13常青模式；不當原生Live影音證據 |
| WebinarKit | B：既有清單/設定DOM，Automated/Live鎖定/Series入口 | B入口/設定區塊，未儲存 | B既有設定區；各變更結果pending | B Register/Watch/Other分區，實際觀眾流程pending | pending | pending：Live鎖定原因未確認，不視為network failure | SR-13 UX比較，影音stack未知 |
| WebinarJam | B：Webinar清單及操作入口；與Systeme分開 | B Express/Full未儲存向導、空表單Save disabled | B Edit等入口，未操作結果 | B Analytics/Registrants篩選入口；指標/匯出內容pending | B Go結果空／NO ENTRIES FOUND，當時Export disabled | pending：provider故障/表單錯誤未觸發 | SR-13，精確限制/ev IDs見獨立觀察檔 |
| Creator AI | StartKiter目標，不從上面第三方導覽推論已有AI工具 | Spec草稿契約，不當外部觀察 | Specreview契約 | Specprovenance契約 | pending實際UI/模型 | pending真實模型/工具 | SR-14，與buyer Code Skill/唯讀客服隔離 |

每個模組上述欄位都可再擴充 L1～L10：入口/parent/mobile、page purpose/CTA、visible/editable/sensitive fields、create/edit/clone/publish/archive/delete/export、state guards、actor/workspace權限、producer/consumer、provider/secret boundary、desk/390px/focus/retry、Order/Entitlement/退款/取消。某欄有B/C不代表其其它層完成；未觀察必須保留pending與下次可安全讀取的目標，不直接建立外部資料來補證據。

### 2.3 Source lineage 與分類對接

| 來源層 | 輸入／可確認範圍 | 下游／限制 |
| --- | --- | --- |
| REA導航紀錄 | 第2.1所列ev IDs，Dashboard/展開入口，沒有個資/cookie/body留存 | 本節頁面欄位；不能推論backend/DB/paid方案全部流程 |
| 官方Webinar資料 | 第2.1 help文章的既有閱讀紀錄，C資格/常青funnel說明 | Live/Evergreen不同模式；不是本輪新查最新方案或影音provider |
| WebinarJam比較 | webinarjam-reverse-engineering-notes.md 的B級ev IDs／未操作清單 | 只供管理流程、clone/archive/filters設計參考，不當Systeme內部實作 |
| 現有source/canonical | creator-platform-source-ownership-map.md 的實際files／specs＋五張active SR責任 | 分reused/extended/new/unknown；文件存在不等於runtime或外部驗收完成 |
| 目標需求 | 十一blueprint specs、buyer/CRM/event/UI/Taiwan/release矩陣與26類能力 | 目標有獨立user/產品需求，不從D級推測自動施工；未知供應商/政策阻擋該功能 |
| 施工交接 | handoff十五卡片／16階段依賴，優先SR-07 | 每張runtime有自己的proposal/design/spec/tasks與行為gate，不apply總藍圖做全部功能 |

已有/部分/缺口/不做的現況與source以第4節矩陣、能力目錄與source owner表合讀：platform/course/bundles/payments/newsletter/github-kit、saas/marketing均有實際來源；Auth/支付真相不複製，沒有授權/未觀察的資料不抽取，不做品牌clone/內部API破解/未知影音自建。待研究項不是偷偷刪除的功能，也不是已安排執行時間的runtime task。

| 本輪指定source範圍 | 可重用／擴充／新建／不做 | 適用stage／禁止誤報 |
| --- | --- | --- |
| packages/platform | reused registry/mount/navigation；extended context/UI/release contract | SR-01/02/03；不另造租戶/支付真相，不因nav可見放資料權限 |
| packages/course／API course | reused Course/lesson/learning/media/LINE/welcome；extended入口與指定access | 原course owner＋SR-07；不複製Course、不把buyer source當教材 |
| packages/bundles | reused catalog/checkout入口；extended歷史scope/policy映射 | 既有bundle SR＋06/07；缺snapshot證據不猜舊成員 |
| packages/payments | reused server catalog/PAYUNi/order/refund/invoice/recurring；extended通用Offer與新週期 | SR-06/11；不把新季或CodePackage訂閱說成現有已驗收 |
| packages/newsletter | reused campaign/audience/consent/send-engine；new通用Outbox契約另遷移 | 原newsletter SR＋09；unknown不盲重寄，不複製worker或用User同意暗擴workspace |
| packages/github-kit | reused template/claim/revoke/version；extendedlicense/更新與可寫repo邊界 | SR-03/04/07；pull/writable差異未解，不改客戶grant或宣稱updater已完成 |
| apps/saas | reused既有shell/surfaces/auth/API composition，extended creator任務入口 | SR-01/02/07等；不把domain logic全塞page，不用prototype替真實角色驗收 |
| apps/marketing | reused既有/course與公開內容；extended多課course catalog/detail/CTA | SR-07/10；保留已分享入口/locale/reserved routes，不拷禁用marketing來源 |

本輪 `spectra list --parked --json` 只作位置盤點，不恢復/執行parked工作；active/parked與source-state需由下一張SR開始時再查，不把歷史文字當現場。與本目標相關的active五張SR與sales切片責任，見source owner表；parked infra/security/deployment不因此納入本blueprint實作。

2026-10-13 位置快照：CLI 的 `parked` array 有一張 `oracle-chatwoot-anti-reclaim-cutover`、status=parked；它仍屬support runtime/infra責任，不是Creator blueprint的待執行模組。本輪沒有 unpark／改cloud rules／部署。

## 3. 完整逆向工程清單

每個模組都要完成下列 10 層盤點，才算「完整」：

| 層 | 要盤什麼 | 證據 |
| --- | --- | --- |
| L1 導覽 | 從哪裡進入、上一層在哪裡、手機如何進入 | 路由／選單／截圖 |
| L2 頁面 | 頁面標題、主要目的、主要 CTA、次要操作 | DOM／頁面紀錄 |
| L3 資料 | 列表欄位、詳情欄位、可編輯欄位、敏感欄位 | 表格／表單 |
| L4 動作 | 建立、編輯、複製、發布、封存、刪除、匯出 | 操作流程 |
| L5 狀態 | draft、published、active、paused、failed、canceled 等 | 狀態轉移 |
| L6 權限 | 個人、workspace、管理員、營運者、讀取者 | 角色矩陣 |
| L7 事件 | 什麼事件觸發什麼後續動作 | 事件流程 |
| L8 整合 | 金流、郵件、SMS、社群、分析、affiliate | provider boundary |
| L9 UX | loading、empty、error、denied、retry、mobile | 桌面／390px |
| L10 交付 | 建立什麼資料、授予什麼資格、如何退款或取消 | order／entitlement trace |

### 3.1 平台工作台與 workspace

- [ ] Dashboard 的指標來源與日期範圍。
- [ ] Dashboard 卡片點擊後的下一步。
- [ ] 個人 workspace 與團隊 workspace 的差異。
- [ ] Owner、Admin、Editor、Support、Analyst 等角色。
- [ ] workspace 切換、邀請、移除成員與權限變更。
- [ ] 全平台設定與模組設定的邊界。
- [ ] 每個模組的未完成、失敗、待審核事項如何回到工作台。

### 3.2 CRM 與名單

- [ ] Contact 建立來源：表單、匯入、購買、人工建立、API。
- [ ] Contact 與可登入 User 的關聯方式。
- [ ] Email、電話、LINE identity 的去重與合併。
- [ ] Tag 建立、套用、移除與批次操作。
- [ ] Segment 的規則、即時更新與快照。
- [ ] Pipeline stages、商機金額、負責人與下一步。
- [ ] Contact detail 的互動時間線。
- [ ] 匯入、匯出、欄位映射、重複資料與失敗報告。
- [ ] Consent、unsubscribe、suppression 與資料刪除。

### 3.3 Site、頁面、表單與 Funnel

- [ ] Website、landing page、blog、creator page 的內容層級。
- [ ] Page、Revision、Draft、Published、Archived 的狀態。
- [ ] Funnel 與 FunnelStep 的關聯。
- [ ] Funnel step 的類型：頁面、表單、付款、感謝頁、會員入口。
- [ ] 表單欄位、驗證、成功後動作與錯誤顯示。
- [ ] CTA 如何傳遞 contact、offer、coupon、campaign source。
- [ ] 頁面版本發布與歷史訂單的隔離。
- [ ] 自訂 slug 與系統保留路徑衝突。
- [ ] 桌面、手機、SEO、分享預覽與載入狀態。

### 3.4 Email、SMS 與訊息

- [ ] Campaign、Newsletter、Transactional message 的差異。
- [ ] Template、MessageRevision、預覽、測試寄送與發布。
- [ ] Recipient snapshot 或即時受眾的選擇方式。
- [ ] 排程、時區、批次、速率限制與取消排程。
- [ ] Delivery、Open、Click、Bounce、Complaint、Unsubscribe。
- [ ] SMS provider、費用、同意、退訂與 fail-closed。
- [ ] 交易型通知與行銷訊息的資料隔離。
- [ ] 寄送失敗、重試、dead-letter 與人工重送。

### 3.5 Automation 工作流程

- [ ] Trigger：contact.created、form.submitted、order.paid、subscription.started 等。
- [ ] Condition：tag、segment、購買、課程權限、時間、consent。
- [ ] Action：加標籤、寄信、延遲、分流、建立任務、通知、webhook。
- [ ] Enrollment 的開始、暫停、完成、取消與重入規則。
- [ ] 延遲步驟的時區與重啟行為。
- [ ] 同一事件重送時的冪等規則。
- [ ] Provider 失敗時的 retry、backoff、dead-letter。
- [ ] 工作流程版本變更是否影響已進行中的 enrollment。
- [ ] Automation audit log 與可回放事件。

### 3.6 Content、Product、Course、Bundle、File、Community

- [ ] Content resource 與 sellable product 的分離。
- [ ] Course 的章節、單元、預覽、講師、作業、測驗與社群入口。
- [ ] Bundle 的課程清單、排序、價格、發布與封存。
- [ ] File 的上傳、權限、下載、版本與容量限制。
- [ ] Community 的成員資格、邀請、內容與離開流程。
- [ ] Product 聚合哪些資源。
- [ ] Offer 保存哪些銷售條件。
- [ ] 修改課程內容是否影響歷史訂單。
- [ ] 修改 Offer 是否影響既有買家。

### 3.7 Commerce、Checkout、Order、Subscription

- [ ] 單堂一次買斷。
- [ ] Bundle 一次買斷。
- [ ] 單堂訂閱。
- [ ] Bundle 訂閱。
- [ ] 月、季、年週期。
- [ ] Coupon、折扣、使用次數與資格。
- [ ] Checkout session、付款方式、3DS／外部跳轉與返回。
- [ ] Order pending、paid、failed、refunded、canceled。
- [ ] Payment webhook 驗簽、重放、併發與冪等。
- [ ] Subscription active、past_due、canceled、expired。
- [ ] 取消立即收回或週期結束收回資格。
- [ ] 退款如何反向撤銷課程、檔案、社群與 CodePackage。
- [ ] Order、Invoice、Payment、Entitlement 的一對多關係。

### 3.8 Affiliate、營運與分析

- [ ] Affiliate 申請、審核、追蹤、歸因與佣金。
- [ ] Affiliate invoice、付款狀態與匯出。
- [ ] Revenue、orders、conversion、contacts、campaign、course usage 報表。
- [ ] Dashboard 指標的來源、時間範圍與重算規則。
- [ ] 匯出格式、權限、資料快照與重現性。
- [ ] Audit log、通知、失敗告警與客服案件。
- [ ] 支援案件與 contact、order、course 的關聯。

### 3.9 設定、整合與資料治理

- [ ] Brand、locale、timezone、currency。
- [ ] Payment provider、invoice provider、mail provider、SMS provider。
- [ ] LINE identity、LINE Messaging 與 LINE course invite 的用途分離。
- [ ] API keys、webhooks、OAuth、secret scope。
- [ ] 個資、consent、retention、export、delete、audit。
- [ ] Provider adapter、錯誤回退、重試與 feature flag。
- [ ] Production／TEST 的設定差異與回滾方式。

### 3.10 CodePackage 與買家 SaaS 使用

- [ ] CodePackage 是否可獨立販售，或只能作為 Course／Bundle 的交付項。
- [ ] CodePackage 的一次買斷、月／季／年訂閱、更新期間與 license scope。
- [ ] 買家可部署的 app／workspace 數量與商業使用邊界。
- [ ] 買家如何 clone、安裝、設定自己的 domain、database、email 與 payment provider。
- [ ] 買家建立自己的終端使用者、登入、Organization、permissions、subscription、billing 與 protected pages。
- [ ] 買家下游 SaaS 的 User／Contact／Order／Subscription 是否與 StartKiter 真相完全分離。
- [ ] `self-hosted`、`managed`、`advanced` hosting tier 的責任、費用、支援與切換規則。
- [ ] 第三方 credential handoff、target key allowlist、不落庫、不進 log 與買家帳號持有責任。
- [ ] CodePackage upstream version、update channel、衝突、accept／decline、rollback 與 migration。
- [ ] StartKiter 對 source package、managed infrastructure、買家下游產品的支援邊界。

### 3.11 平台擴充與版本更新

- [ ] 新增 CRM、Funnel、SMS、Analytics、Community 時，使用哪個 App／plugin mount point。
- [ ] 新模組的 capability、permission、data owner、event、provider adapter、UI screen contract。
- [ ] 新增欄位、事件、route、adapter 時的 expand → migrate → contract 順序。
- [ ] feature flag、release channel、compatibility matrix 與 buyer opt-in。
- [ ] core、official module、generated files、buyer custom files 的更新分界。
- [ ] upstream update 的 preview、conflict、migration、env change、test、rollback。
- [ ] `AGENTS.md`、`CLAUDE.md`、Codex／Claude Code skills 與 CodePackage 版本相容。
- [ ] build、type-check、API smoke、desktop／mobile browser evidence、deployment read-back。

### 3.12 Webinar、即時直播與 AI 輔助

- [ ] Webinar 入口是否為獨立模組，或是 Funnel 的一種目標／步驟。
- [ ] Evergreen Webinar 的錄影來源、可選場次、just-in-time 時段、提醒與 replay 頁。
- [ ] Live event 的報名、排程、主持人入口、觀眾入口、Q&A／聊天、出席與結束狀態。
- [ ] Live video／recording 由哪個 provider 供應；StartKiter 只保存 provider reference 與狀態，不把 provider session 當 Entitlement。
- [ ] Webinar registration、attendance、no-show、replay viewed 如何形成 Contact timeline 與可重播 domain event。
- [ ] Webinar 付費入口如何接 Offer／Checkout；只有成功付款才能產生對應 Course／Bundle／CodePackage Entitlement。
- [ ] AI 如何摘要問答、整理常見問題、產生會後摘要與 follow-up 草稿；輸入資料是否經同意、保存多久、如何刪除。
- [ ] AI 建議寄信、發布 replay、調價、退款或授權時，如何要求具權限的人預覽與確認。
- [ ] AI 工具遵守 workspace、角色、Contact consent、data scope 與 audit；買家 repo 的 Codex／Claude Code 開發能力與創作者後台 AI 分離。
- [ ] 直播或錄影 provider 失效、活動取消、錄影未就緒、AI 服務不可用時的狀態與恢復流程。

## 4. StartKiter 對照矩陣

| Systeme 能力 | StartKiter 現況 | 分類 | 主要證據／候選責任 |
| --- | --- | --- | --- |
| Platform shell | 有平台殼、App registration、角色導覽 | 已有但需統一工作台 | `packages/platform`、`role-based-workspace-navigation` |
| Dashboard | 有課程、訂單、營收等資訊 | 部分 | `apps/saas` dashboard、`creator-analytics-and-operations` |
| CRM／Contacts | 有 User、部分 contact-like 資料，但未成完整 CRM | 缺口 | `creator-crm-and-audience`、未來 `packages/contacts` |
| Tags／Segments | 沒有完整 deterministic audience flow | 缺口 | `creator-crm-and-audience` |
| Website／Pages | 有 Pages CMS、SiteSetting、PluginContent | 部分 | `buyer-pages-cms`、未來 Site contract |
| Funnel | 尚無完整 Funnel／FunnelStep 工作流 | 缺口 | `creator-content-and-commerce` |
| Email | Newsletter、template、recipient、delivery、automation 已有 | 部分到已有 | `packages/newsletter`、newsletter SRs |
| SMS | 尚未決定 provider | 待決策 | blueprint 暫不裁決 |
| Automation | 有 newsletter automation 地基，缺跨模組事件引擎 | 部分 | `creator-marketing-automation` |
| Course | 深度模組，已有課程、課綱、作業、測驗、評價、媒體 | 已有且較深 | `packages/course`、`packages/api/modules/course` |
| Bundle | 已有多課程 Bundle、公開頁與 checkout 地基 | 部分到已有 | `packages/bundles`、`buyer-bundle-checkout-entry` |
| Offer | CourseOffer 正在施工，尚未統一 Product／Offer contract | 施工中 | `public-multi-course-sales-and-code-package` |
| Subscription | 有 CourseSubscription，需擴成 Bundle target、季週期與通用 entitlement | 部分 | `packages/database`、`payuni-recurring-billing` |
| Order／Payment | Order、PAYUNi、Invoice 已有 | 部分到已有 | `packages/payments`、`apps/saas/lib/orders.ts` |
| Affiliate／referral | Systeme.io 免費控制台可見 Affiliate program 與 Affiliate invoices；StartKiter 的完整申請、歸因、佣金與付款 lifecycle 尚未由本次盤點確認 | 待盤點／待決策 | 後續確認是否沿用既有 affiliate capability，或另開 creator-affiliate-program SR |
| CodePackage | 全平台一種、每人最多一份 repo、pull 權限 | 已定義，交付仍需補驗收 | `packages/github-kit` |
| Buyer-owned SaaS | 買家使用 CodePackage 建立自己的 SaaS，已有部署／credential／buyer-dev 地基但未形成完整 license contract | 缺口／需整合 | `buyer-saas-extension-and-deployment`、`buyer-credential-handoff`、`managed-hosting-tiers`、Supastarter reference |
| Platform evolution | 現有 App registration、plugin、upstream sync、deployment 與 skills 有地基，但缺少跨模組 release／compatibility contract | 缺口／需整合 | `platform-extension-and-update-contract`、`app-extension-contract`、`buyer-repo-upstream-sync` |
| Evergreen webinar | Systeme.io 以受方案限制的 Funnel 目標提供自動化／常青 Webinar；StartKiter 尚無 Webinar domain contract | 缺口 | `creator-live-and-webinar` |
| 即時直播 | Systeme.io 官方文件說明沒有原生即時直播；其 Webinar 高方案不能作為 live video stack 的證據 | 不照抄；需 provider adapter | `creator-live-and-webinar`；Zoom／LiveKit 等 provider 待後續 SR 決定 |
| Creator AI assistance | 現有站內 Agent 是受限唯讀能力；平台跨模組 AI 草稿、摘要、審核與稽核契約尚未定義 | 缺口／需加權限閘道 | `creator-ai-assistance` |
| LINE | 課程邀請與 Messaging 用途邊界已有 | 已有但需整合 | `line-learner-community`、course access |
| Analytics | 有營收與匯出，缺跨模組事件分析 | 部分 | `creator-analytics-and-operations` |
| Support | SupportTicket、widget、Chatwoot 邊界已有 | 部分到已有 | `packages/support`、support specs |
| Taiwan compliance | TWD、PAYUNi、Invoice、LINE、consent 地基已有 | 部分到已有 | `taiwan-localization-and-compliance` |

## 5. StartKiter 的正確領域分層

```text
ContentResource
├─ Course
├─ File
├─ Community
└─ Service／其他內容資源

Product
├─ SingleCourseProduct → 一門 Course
├─ BundleProduct       → 多門 Course
├─ CodePackageProduct  → 買家 SaaS source foundation
└─ 其他未來商品

Offer
├─ one_time           （一次買斷，沒有訂閱週期）
├─ subscription_month
├─ subscription_quarter
├─ subscription_year
├─ price／currency
├─ coupon policy
└─ delivery mapping

Order／Subscription
├─ payment state
├─ invoice state
├─ refund／cancel state
└─ provider reference

Entitlement
├─ Course access
├─ File access
├─ Community access
├─ LINE invite visibility
├─ CodePackage license／update access
└─ Buyer deployment／support tier
```

規則：

- 登入平台不等於取得所有課程權限。
- 單堂 Offer 只授予指定 Course。
- Bundle Offer 只授予 Bundle 內的 Course。
- Bundle subscription 只在有效期間授予 Bundle 內的 Course。
- CodePackage 是獨立交付物；全平台一種，每位買家最多一個個人 repo。
- CodePackage license 不等於課程觀看權限；買家自己的 SaaS 使用者、Organization、permissions、subscription 與 billing 是另一套下游真相。
- 歷史 Order 必須保存付款當下的交付結果，不能每次讀取目前 Offer 內容來重算。

## 6. 跨模組核心流程

### 6.1 創作者建立可販售內容

```text
Workspace／Brand
  → 建立 Course／File／Community
  → 建立 Product
  → 建立 Offer
  → 設定價格、週期、優惠、交付內容
  → 發布公開頁或 Funnel
```

### 6.2 訪客變成 Contact

```text
公開頁／表單
  → 欄位驗證
  → 建立或合併 Contact
  → 記錄來源與 Consent
  → 套用 deterministic Tag／Segment
  → 進入允許的 Automation
```

### 6.3 付款到交付

```text
Offer
  → checkout
  → payment webhook
  → Order paid
  → 依已核准的 Offer policy 建立 Entitlement
  → Course／File／Community／LINE／CodePackage
  → Transactional message
  → AnalyticsEvent
```

發票是付款後的獨立狀態機，由 invoice adapter／retry 處理，不是所有 Entitlement 的固定前置。支付成功但發票失敗時 Order 仍 paid；交付依 Offer 的已核准規則，不把發票成功當成付款成功，也不默認一律扣住課程。

### 6.4 退款與取消

```text
Refund／Subscription canceled
  → 更新 payment state
  → 撤銷或保留對應 Entitlement
  → CodePackage 重新計算是否仍有資格
  → 依 Consent／Suppression 重新檢查各目的寄送資格
  → 保留付款、發票與 audit evidence
```

退款／取消不是行銷退訂，也不代表自動恢復同意。已排程訊息依其目的、條件與收件資格重新檢查；沒有撤回同意時不因退款憑空寫 consent.revoked，撤回後也不能被重播恢復。

## 7. 後續能力索引與實際依賴

以下是能力索引，不是嚴格施工時間，也不是完整逆向已完成的宣告。真正前置以 [開發交接](creator-platform-development-handoff.md) 為準：先收尾正在施工的 SR-07，再按同一 source／owner 擴充；通用交易採 06C→11→06R，手機／無障礙與發布 gate 每批都做。

| 能力索引 | SR 識別／責任 |
| --- | --- |
| SR-01 | creator-platform-foundation：workspace／App／角色橋接 |
| SR-02 | creator-ui-ux-foundation：page/list/form/state、手機、鍵盤 |
| SR-03 | platform-extension-and-update-contract：註冊／相容／安全更新 |
| SR-04 | buyer-saas-extension-and-deployment：授權／自有 SaaS／桌面 AI／部署 |
| SR-05 | creator-crm-and-audience：Contact／Consent／Tag／Segment |
| SR-06 | creator-offer-commerce：Product／Offer／單課、Bundle、程式包與訂閱 |
| SR-07 | public-multi-course-sales-and-code-package：正在修改的一次買斷切片 |
| SR-08 | creator-operations-home：可操作待辦與失敗恢復 |
| SR-09 | creator-marketing-automation：Campaign／Outbox／Enrollment／Delivery |
| SR-10 | creator-site-and-funnels：Page／Form／FunnelStep／CTA |
| SR-11 | taiwan-billing-and-compliance：收款／發票／週期／LINE 用途 |
| SR-12 | creator-analytics-and-export：事件／報表／scope／匯出 |
| SR-13 | creator-live-and-webinar：Live／Evergreen／影音 adapter／報名回放 |
| SR-14 | creator-ai-assistance：scoped tools／來源／草稿／人審／稽核 |
| SR-15 | mobile-accessibility-and-rollout：每批 UI／部署／回滾證據 |

商機、日曆、SMS、Affiliate、實體商品、其它資源商品與未操作頁面，沿 [能力目錄](creator-platform-capability-catalog.md) 的 owner／研究 gate 獨立拆後續 SR；不因表中只有十五個核心索引就默認刪去這些能力。

## 8. 每張 SR 的完成門檻

- [ ] 有 proposal、design、spec、tasks。
- [ ] 明確標示 reused／extended／new。
- [ ] 有 caller、資料 owner、workspace scope、權限矩陣。
- [ ] 有 happy path、empty、error、denied、retry、rollback。
- [ ] 有事件與重試的冪等規則。
- [ ] 有 desktop 與 390px mobile flow。
- [ ] 有 unit／integration／browser 驗證分界。
- [ ] 有付款、退款、訂閱取消或資料刪除時的反向流程。
- [ ] 有 deployment／migration／rollback evidence gate。
- [ ] 未經藍圖與 SR 拍板，不直接把缺口塞進現有 `public-multi-course-sales-and-code-package`。

## 9. 下一輪逆向執行順序

1. 逐一走 Systeme 導覽中的每個模組入口。
2. 每個模組至少完成列表頁、建立頁、編輯頁、詳情頁、空狀態與錯誤狀態。
3. 以一個測試 Contact、一個 Course、一個 Bundle、一個 Offer、一筆 Order、一個 Subscription 串出完整資料流。
4. 把每個觀察記成 `Evidence → Finding → StartKiter Path`。
5. 將結果回填本文件的勾選、分類與 SR 順序。

## 10. 尚未宣稱完成的項目

- [ ] Systeme CRM 所有頁面與 Pipeline 細節。
- [ ] Systeme Funnel builder 的逐步欄位與發布行為。
- [ ] Systeme Automation builder 的完整 trigger／condition／action 清單。
- [ ] Systeme affiliate、SMS、community、file delivery 的完整 lifecycle。
- [ ] 所有角色與 workspace 權限矩陣。
- [ ] 所有訂單、退款、訂閱取消與 entitlement 反向流程。
- [ ] StartKiter 每個缺口的程式碼 caller 與實際部署狀態。
- [ ] WebinarKit Live webinar 鎖定原因、provider、實際串流與錄影服務；需具備方案權限並能唯讀觀察，否則維持未知。
- [ ] Systeme.io Webinar funnel 的完整登入後建立流程與設定頁；本次以官方文件確認功能邊界，未建立 funnel。
- [ ] StartKiter Live video provider、錄影保存與 transcript／AI data retention 的正式選擇。

本文件完成的是「逆向工程清單與架構骨架」，不是聲稱 Systeme 所有頁面都已完成實際操作，也不是宣稱 StartKiter 已具備這些功能。
