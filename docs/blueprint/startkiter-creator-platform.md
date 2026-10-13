# StartKiter 台灣創作者營運平台藍圖

狀態：Blueprint v0.4，總計畫交叉驗收進行中；一次買斷銷售切片已有工作樹修改，完整 Creator 擴充不在本文件施工
日期：2026-10-13
產品：StartKiter／開站包
範圍：完整創作者營運平台，不複製 Systeme.io 品牌或版面

逆向工程明細：`docs/blueprint/systeme-io-reverse-engineering-checklist.md`

完整已知功能與研究缺口見 [能力目錄](creator-platform-capability-catalog.md)；source／owner 見 [施工責任表](creator-platform-source-ownership-map.md)；十五張核心卡片、進出條件與 16 階段依賴以 [開發交接](creator-platform-development-handoff.md) 為準。本文件是總覽，不以歷史順序或一般用詞取代這些具體契約。

交易／授權／退款與 Contact／分眾／Consent／匯入匯出的具體判斷，以 [領域判斷表](creator-platform-domain-decision-tables.md) 對照 specs。表內案例是後續應測條件，不是已實作或已跑測試的宣告。

## 1. 一句話定位

StartKiter 是給台灣創作者使用的「從內容、名單、行銷、銷售到營運分析」一站式平台；課程是第一個深度模組，不是整個產品的邊界。

## 2. 目前現況與缺口

### 已存在，可重用

- 平台殼、App registration、WorkspaceContext／角色導覽方向。
- Better Auth：email/password、Google、LINE Login 邊界。
- Organization、Member、Invitation：團隊與權限地基。
- 課程：Course、Chapter、Lesson、Bundle、Assignment、Quiz、Review、Media、Course Pack、LINE 邀請。
- 交易：Order、Purchase、Course Subscription、Coupon、Invoice、PAYUNi adapter。
- 電子報：Newsletter Campaign、Template、Recipient、Delivery、Open、Click、Consent、Automation、Unsubscribe。
- 頁面與內容：Page、PluginContent、SiteSetting、Media、Studio folder。
- 支援與通知：SupportTicket、Notification、Email delivery log。
- 技術基礎：Next.js 16、React 19、TypeScript、pnpm、Turborepo、Prisma 7、PostgreSQL、oRPC、TanStack Query、Vitest、Playwright、Coolify/VPS。

### 目前缺口

1. 沒有以創作者任務為中心的統一工作台。
2. Contact 與 User 的領域邊界尚未成為完整 CRM 契約。
3. 沒有名單、標籤、分眾、互動時間線的完整流程。
4. 沒有網站／表單／漏斗／Offer 的共同內容與銷售模型。
5. 電子報已有地基，但尚未和 CRM、商品、事件、自動化形成完整閉環。
6. Dashboard 有課程營運資訊，還不是全平台營運中心。
7. 手機課程後台的標題與操作按鈕仍有密度問題。

## 3. 產品使用者

| 使用者 | 主要任務 | 不應被迫理解 |
| --- | --- | --- |
| 個人創作者 | 做頁面、收名單、賣商品、寄訊息、看結果 | App registry、資料表、provider 名稱 |
| 課程講師 | 建課、管理學員、處理作業與評價 | 平台層權限與部署設定 |
| 服務型創作者 | 建立預約／表單／付款流程 | 課程專用概念 |
| 團隊成員 | 被指派任務、查看可用資料 | 全站管理員權限 |
| 營運／客服 | 處理訂單、退費、寄送失敗、支援案件 | 前端實作細節 |
| 總管理員 | 管理平台、App、供應商與安全設定 | 每個創作者的日常內容細節 |

候選首批族群是「已有內容或服務、想自己取得名單與銷售流程的台灣個人創作者」，不是已核准的最終客群決定；先沿用已確認的課程銷售切片。服務型創作者若加入，重用名單、頁面、Offer、付款與自動化地基，不把尚未研究的預約或商機功能寫成現成能力。

## 4. 核心工作流

### 工作流 A：建立第一個可賣商品

```text
選擇商品類型
  → 建立內容或服務
  → 設定價格／付款方式／交付權限
  → 建立銷售頁或表單
  → 預覽
  → 發布
```

### 工作流 B：收集並理解名單

```text
表單／結帳／LINE／手動匯入
  → Contact 建立或更新
  → 記錄來源與同意
  → 加入標籤／分眾
  → 顯示互動時間線
```

### 工作流 C：讓客戶收到正確訊息

```text
選擇受眾
  → 撰寫訊息
  → 預覽與測試
  → 排程或設定觸發事件
  → 寄送／執行
  → 追蹤送達、開啟、點擊、退訂、失敗
```

### 工作流 D：從付款到交付

```text
Offer
  → PAYUNi checkout
  → Order paid
  → Invoice pending／issued／failed
  → Entitlement granted
  → 課程／檔案／社群入口可用
  → 退款或取消時反向收回資格
```

### 第一個垂直切片：多課程前台銷售與交付

這個切片已拍板，作為第一個真正施工的 end-to-end flow：

```text
創作者建立多門課程
  ↓
建立公開銷售頁
  ↓
頁面放入課程卡片與購買 CTA
  ↓
單課 Offer 或多課程 Bundle Offer
  ↓
買家進入 PAYUNi checkout
  ↓
付款成功建立 Order
  ↓
依 Offer 授予一門或多門課程權限
  ↓
顯示每門已購課程的 LINE 邀請入口
  ↓
授予唯一 GitHub 代碼包資格
  ↓
寄出交易型通知並記錄事件
```

代碼包是全平台唯一的一種產品，不包含課程教學內容。現有 GitHub 流程會以同一份範本，為每位買家建立自己的私人 repo，權限只讀；買家購買多門課，只會有一份代碼包資格與一個個人 repo。

這裡的 repo 是銷售切片的交付倉庫，不代表買家已可 push 開發變更。`buyer-repo-upstream-sync` canonical 的 writable 承諾與目前 pull 實作不同；SR-04 必須定義交付 repo／買家可寫開發 repo、版本追蹤與移轉，不能自行替現有客戶升降權限。買家本機能改檔、能保存到自有倉庫、能部署與能安全更新，是分開的驗收項目。

第一版銷售頁必須支援：

- 同一創作者有多門課程。
- 銷售頁顯示多門課程的名稱、簡介、封面、價格與 CTA。
- 課程可以單獨販售，也可以組成多課程 Bundle。
- 一筆 Offer 的交付結果可以包含一門或多門課程。
- 課程內容、課程 LINE 邀請與唯一 GitHub 代碼包資格分開管理。
- 發布頁面與付款 Offer 分開管理；改頁面文案不會改動歷史訂單。

### 工作流 E：每日營運

```text
今天要處理什麼
  → 待回覆、付款失敗、寄送失敗、草稿、待發布
  → 一鍵進入對應任務
  → 完成後回到工作台
```

### 工作流 F：買家用 CodePackage 建立自己的 SaaS

```text
買家取得 CodePackage license
  → clone／安裝自己的 source repository
  → 設定自己的 domain、database、email、payment provider
  → 使用既有 auth／Organization／permissions 基礎
  → 建立自己的 SaaS page、plan、subscription 與終端使用者權限
  → 選擇 self-hosted／managed／advanced deployment
  → 接收可審查的 upstream update
  → 依 hosting tier 取得支援與回滾路徑
```

這條流程不是 StartKiter 課程觀看權限的延伸；它是買家取得 CodePackage 後的另一個產品使用層。買家自己的終端使用者、Order、Subscription、Organization 與 protected page 權限，屬於買家部署的 SaaS 真相，不回寫成 StartKiter learner entitlement。

### 工作流 G：報名 Webinar、參加直播或觀看常青內容，再交給 AI 輔助營運

```text
建立 Webinar
  → 選擇 Live event 或 Evergreen webinar
  → 設定報名、時間、Offer 與提醒
  → Contact 註冊並記錄 consent
  → Live provider session 或預錄內容播放
  → 記錄 attendance／no-show／replay
  → AI 摘要問答、整理重點、草擬 follow-up
  → 創作者檢查並核准寄送或發布
  → 付款成功才授予 Offer 指定的 Entitlement
```

即時直播與常青 Webinar 是不同的交付模式。Systeme.io 官方說明確認其 Webinar 高方案提供的是 Evergreen Webinar，不是原生即時直播；StartKiter 的 Live video 需經 provider adapter。AI 只能在允許的 workspace、Contact consent 與資料範圍內摘要或產生草稿，寄信、發布、調價、退款與授權變更仍要經過確定性規則與有權限的人核准。

管理介面另參照 WebinarJam 清單上的建立、編輯、複製、進階設定、操作紀錄、測試與連結入口；Full 設定分 Right now／Schedule for later／Always on，並把 Basic settings、講者、串流服務、報名、通知、整合、Live 與 Replay 分區。Analytics 和 Registrants 以 Webinar／Session／Event 篩選；報名檢視另有 attendance／replay／purchase behavior 篩選。REA 尚未確認 Express 後續、指標內容、匯出格式或影音技術。StartKiter 的 clone／archive 與 workspace-scoped filter 規則及證據見 [`webinarjam-reverse-engineering-notes.md`](webinarjam-reverse-engineering-notes.md) 及 `creator-live-and-webinar` spec。

補充 REA 證據：WebinarJam Express 初始頁未顯示串流服務欄位；Full 設定可見 WebinarJam Live、YouTube Live、Facebook Live 三個 UI 選項。這只影響比較用的設定流程，不代表 StartKiter 的 provider 選型或其底層直播技術。StartKiter 的 `deliveryMode`、`schedulePolicy` 與 `provider` 保持獨立，來源與限制見 [`webinarjam-reverse-engineering-notes.md`](webinarjam-reverse-engineering-notes.md)。

## 5. 平台資訊架構

### 頂層工作區

1. **工作台**：待辦、營收、訂單、名單成長、寄送健康度、系統警告。
2. **名單與關係**：聯絡人、標籤、分眾、互動紀錄、同意與退訂。
3. **內容與商品**：網站頁面、課程、檔案、商品、組合包、優惠券。
4. **銷售流程**：表單、銷售頁、漏斗步驟、Offer、結帳設定。
5. **訊息與自動化**：電子報、活動、模板、工作流程、寄送紀錄。
6. **訂單與收款**：訂單、交易、訂閱、退款、發票、營收；推薦／分潤列為後續盤點。
7. **分析與支援**：事件、報表、匯出、通知、客服案件。
8. **設定**：品牌、語系、付款、發票、寄信、LINE、權限、資料治理。
9. **活動與 AI 協作**：Live／Evergreen Webinar、報名與出席、會後摘要、草稿審核及 provider 狀態。

### 不採用的資訊架構

- 不把所有功能塞進「課程管理」底下。
- 不讓使用者在「學員端／課程管理員／總管理員」之間猜路由。
- 不為了模仿 Systeme.io 而照搬「CRM／站點／電子郵件」的文字與排列。

## 6. 領域模型

### 身份與工作空間

| 實體 | 責任 | 來源／策略 |
| --- | --- | --- |
| User | 可登入平台的身份 | 沿用現有 User／Better Auth |
| Organization | 團隊與資料擁有邊界 | 沿用現有 Organization |
| Member | User 在 workspace 的角色 | 沿用現有 Member |
| CreatorProfile | 品牌名稱、預設 locale、timezone、currency、聯絡設定 | 新增一對一 profile，不新增第二套 tenant |
| AppCapability | 某 workspace／member 可使用的能力 | 沿用 App registry、permissions |

### 客戶關係

| 實體 | 核心欄位 | 必要索引／關聯 |
| --- | --- | --- |
| Contact | workspaceId、displayName、status | workspaceId、normalized email、normalized phone |
| ContactIdentity | contactId、kind、valueHash、verifiedAt、source | workspaceId + kind + valueHash 唯一 |
| ContactTag | contactId、tagId、source、createdAt | contactId、tagId 複合索引 |
| AudienceSegment | workspaceId、name、filterDefinition、version | workspaceId + status |
| ConsentRecord | contactId、purpose、action、source、policyVersion、occurredAt | contactId + purpose + occurredAt |
| ContactEvent | contactId、eventType、source、occurredAt、payloadRef | workspaceId + eventType + occurredAt |

### 內容與交易

| 實體 | 核心責任 | 既有重用 |
| --- | --- | --- |
| Page／PageRevision | 公開內容與發布版本 | 沿用 Page |
| Site／Funnel／FunnelStep | 公開入口與銷售流程 | 新增 domain contract，先重用 Page |
| ContentResource | 課程、檔案、服務內容 | 沿用 Course、Lesson、Media、PluginContent |
| Product | 可販售的商品聚合 | 新增共同 contract，映射 Course／Bundle |
| Offer | 價格、幣別、付款模式、交付權限 | 新增，不取代既有 checkout |
| Entitlement | 指定資源、有效期間、來源交易與撤回／保留政策；不以登入或 membership 全站解鎖 | 切片先用 OrderCourseEntitlement，通用 Offer 另作相容 migration |
| CodePackage resource | 唯一程式範本與版本；不包含課程教材 | 沿用現有 GitHub template，不為每門課另建範本 |
| CodePackageProduct／license | 可獨立販售或被其它 Offer 附帶；源碼使用、更新期間、商用／支援政策與服務存取分開 | 通用 Product／Offer contract 擴充；新政策未決則不發布受影響的新 Offer |
| GitHub grant | 每位買家的外部交付結果，不是源碼授權或課程權限的真相 | 沿用 github-kit；一個交付 repo，pull／writable 差異由 SR-04 的 canonical delta 處理 |
| Order／Payment | 訂單與付款狀態 | 沿用 Order、PaymentWebhookEvent、PAYUNi |
| Subscription | 訂閱週期與取消 | 沿用 CourseSubscription，逐步抽出通用介面 |
| Invoice | 發票生命週期 | 沿用 Invoice、InvoiceAllowanceOperation |
| LiveEvent | 即時活動排程、主持／觀眾入口、provider session 與生命週期 | 新增 domain contract；影音傳輸由 provider adapter 負責 |
| EvergreenWebinar | 預錄媒體、just-in-time／週期場次、回放與 timed offer | 新增 domain contract；與 LiveEvent 使用不同狀態機 |
| WebinarRegistration | Contact、webinar、場次、consent 與來源 | 連接 Contact、Funnel、Offer，不直接授予課程 Entitlement |
| WebinarAttendance | join／leave、出席／no-show、觀看媒體與回放狀態 | 以 provider reference 與可稽核事件保存 |

### 訊息、自動化與營運

| 實體 | 核心責任 | 既有重用 |
| --- | --- | --- |
| Campaign／MessageRevision | 手動或排程訊息 | 沿用 NewsletterCampaign、NewsletterTemplate |
| Automation／AutomationStep | 觸發器、條件、動作 | 沿用 NewsletterAutomation、Step、Enrollment |
| OutboxEvent | 交易後可靠發布事件 | 新增通用事件邊界 |
| DeliveryAttempt | provider reference、重試、錯誤 | 沿用 NewsletterRecipient、Delivery |
| AnalyticsEvent | 可報表化的行為事件 | 新增最小事件表／append-only pipeline |
| AIAssistantRun | actor、workspace、capability、來源、模型／prompt version、草稿與核准結果 | 新增受限工具呼叫與 audit contract；不保存原始 secrets |
| AuditLog | 操作者、資料範圍、結果 | 沿用 AdminLog 並補 workspace scope |
| SupportCase | 客服問題與狀態 | 沿用 SupportTicket |

## 7. 核心事件流

| 事件 | 發生後可觸發 | 不可自動推論 |
| --- | --- | --- |
| contact.created | welcome message、tag、segment | 不代表已同意行銷 |
| consent.granted | 加入可寄送受眾 | 不代表可寄送所有目的 |
| consent.revoked | 抑制寄送、更新 timeline | 不刪除交易證據 |
| form.submitted | 建立 contact、tag、automation | 不直接發送未驗證行銷 |
| order.paid | invoice、entitlement、welcome | 不重複建立訂單 |
| order.refunded | revoke entitlement、通知 | 不刪除原始付款紀錄 |
| campaign.sent | analytics、delivery summary | 不等於每封信成功送達 |
| delivery.failed | retry、alert、suppression | 不無限重試 |
| webinar.registration_confirmed | reminder workflow、CRM timeline、registration count | 不代表已付款或取得課程權限 |
| webinar.attendance_recorded | attendance report、分眾、會後 AI 草稿 | 缺漏／延遲資料不推定為 no-show |
| webinar.replay_ready | replay review、replay notification draft | 不代表內容已公開或已寄送 |
| ai.draft_created | review queue、audit record | 不會自動寄送、發布、調價、退款或授權 |
| support.created | in-app alert、客服佇列 | 不把客服訊息當行銷同意 |

## 8. 台灣適用性契約

- 語系：新 workspace 預設 zh-TW；所有使用者可見文案走 locale catalog。
- 金額：TWD 以整數最小單位保存與計算；顯示使用 `NT$` 與台灣千分位格式。
- 時間：workspace 預設 Asia/Taipei；資料庫保存 UTC，頁面、排程、電子郵件顯示轉換後時間。
- 付款：第一個正式 adapter 沿用 PAYUNi；不可把 Shopline／Stripe 當作已接通功能。
- 電子發票：沿用現有 invoice 邊界；provider API、開立、折讓、失敗重試與人工補處理分開記錄。
- LINE：分開處理 Login、課程社群邀請、客服 Messaging；不靜默入群，不把 Login 當行銷同意。
- 個資：記錄蒐集目的、資料類別、告知版本、同意／撤回、來源、期間與處理者；支援查詢、更正、匯出、停止利用與刪除／匿名化流程。
- 電話與地址：以 normalized raw pair 保存原值與標準化值，避免格式差異造成重複聯絡人或錯誤比對。
- 法規參考： [個人資料保護法](https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=I0050021)、[電子發票 API 使用規範](https://www.einvoice.nat.gov.tw/static/ptl/ein_upload/download/13.pdf)、[PAYUNi 官方服務](https://www.payuni.com.tw/)。正式上線前由營業人與專業顧問確認。

## 9. 技術棧決策

### 沿用

| 層 | 技術 | 用途 |
| --- | --- | --- |
| Web | Next.js 16 App Router、React 19、TypeScript | SaaS 與公開頁面 |
| UI | 現有 StartKiter UI、Tailwind、Radix/Base UI、Lucide SVG | 共用 page shell、表單、表格、圖示 |
| API | oRPC、Zod、TanStack Query | typed procedure、validation、cache |
| Auth | Better Auth、LINE Login | identity、session、social login |
| DB | Prisma 7、PostgreSQL | transactional domain data |
| Tests | Vitest、ego-browser；現有 e2e 框架只作歷史來源 | unit／integration 與瀏覽器證據分開；本專案瀏覽器操作／巡查唯一使用 ego-browser |
| Deploy | Coolify、VPS、Node runtime | app、worker、scheduled jobs |
| Payment | PAYUNi adapter | TWD、付款、webhook |
| Mail | 現有 mail/newsletter／ToSend 邊界 | campaign、transactional email |

### 需要新增或擴充

- `packages/creator-profile`：品牌、workspace defaults、營運設定。
- `packages/contacts`：Contact、identity、tag、segment、consent、event timeline。
- `packages/offers`：Product、Offer、entitlement mapping。
- `packages/automation`：event contract、outbox、enrollment、step execution、retry。
- `packages/analytics`：normalized event、report query、export contract。
- `packages/platform`：task-based navigation、capability registry、page-state contract。
- `packages/webinars`：LiveEvent／EvergreenWebinar、registration、session、attendance、replay 與 provider adapter contract。
- `packages/creator-ai`：workspace-scoped AI tools、source provenance、draft review、human approval 與 audit。
- `packages/database`：additive Prisma migrations、indexes、retention policy。
- `apps/saas`：creator operations shell 與頁面；只做 composition，不把 domain logic 寫進 route page。

### 暫不裁決

- SMS provider。
- 完整漏斗／網站編輯器技術（BlockNote、HTML builder 或受限 block editor）。
- 事件分析儲存是否先留在 PostgreSQL，或日後導入專用 analytics store。
- 是否需要獨立 queue／worker runtime；先用 outbox + scheduled worker 建立基線。
- 即時影音 provider、錄影儲存、容量與資料保留政策。
- AI provider、Contact／Transcript 可用欄位、模型資料政策與停用／替換機制。

## 10. UI/UX 契約

### 每個頁面固定結構

```text
目前位置／一句話目的
  → 主要任務 CTA
  → 搜尋／篩選／排序
  → 主要內容
  → 下一步或恢復錯誤
```

### 操作規則

- 一頁只保留一個主要 CTA，次要操作收進 action menu。
- 新手先看到必要欄位；進階設定採分段展開。
- 建立流程使用 stepper 或明確階段，不把 20 個欄位塞在一頁。
- 列表、詳情、編輯、預覽使用同一個 breadcrumb 與返回規則。
- 所有外部操作顯示 pending、成功、失敗、重試與人工處理狀態。
- 空狀態必須說明「這裡放什麼」與「現在可以做什麼」。

### 驗收條件

- 390px 手機不出現水平捲軸。
- 核心任務可用鍵盤完成。
- 表單錯誤貼近欄位，且不只用顏色表示。
- 所有按鈕有可見結果，不存在裝飾死按鈕。
- 桌面與手機都實際用 ego-browser 操作；截圖不能取代互動證據。

## 11. 核心施工批次與能力索引

| 批次／關卡 | 能力索引 | 交付結果／前置 |
| --- | --- | --- |
| 總計畫驗收 | 本 blueprint | 十一份 specs、已知功能目錄、證據與未觀察清單、source／owner、十五張卡片、UI/UX 與待決政策；只驗收文件，不施工 runtime |
| 優先收尾 | SR-07 | 目前一次買斷銷售切片；重用現有 shell，不等待完整 CRM／新 Creator 殼；付款／Email／GitHub／退款外部 gate 必須另取得 |
| 共用地基 | SR-01／02／03 | Organization／App context bridge、共享 UI、註冊／事件／更新相容；準備工作可與 SR-07 核對並行 |
| 名單與通用交易 | SR-05、SR-06C→11→06R | Contact／Consent；先商品契約，再 provider mapping／sandbox，再通用商品與新訂閱整合，不循環互等 |
| 買家交付與營運台 | SR-04／08 | 買家手冊／Skill／可寫 repo／hosting tier；可操作待辦。SR-04 依 SR-03／06C 的授權契約，SR-08 先接已有來源 |
| 行銷、網站與報表 | SR-09／10／12 | 依各自 Contact、Offer、事件與 provider 前置；最小頁面 CTA 可沿用 SR-07，不能代替新 recurring gate |
| Live 與 Creator AI | SR-13／14 | Live／Evergreen 等待影音／資料／交易／提醒契約；AI 可先做 CRM 摘要，交易／直播工具另外等待相應來源與人審 |
| 每批發布 | SR-15 | 每一批取得桌機／390px、權限／API／provider 回讀及 TEST 回滾；不是等所有能力做完才做手機與驗收 |

表中批次不是嚴格串行時間表。唯一完整前置關係見 handoff 的 16 階段依賴表；商機管道、日曆、SMS、分潤、實體商品與其它內容資源在能力目錄保留獨立研究／後續 SR，不暗塞進 SR-07。

每個 SR 必須有自己的 proposal、design、spec、tasks、focused tests、type-check、API 行為、桌面／手機 UI 驗收與回滾證據。

## 12. 不做的事

- 不把所有功能都放在第一版施工。
- 不直接複製 Systeme.io 的頁面、品牌、文案或 UI。
- 不新增沒有 owner、事件契約與驗收案例的資料表。
- 不把 user、contact、member、subscriber 混成一個模型。
- 不把 GitHub 代碼包當成課程教材，也不為每門課建立不同代碼包。
- AI 可摘要、草擬與提出建議；不可自行決定 Consent、價格、付款、退款、Invoice、Entitlement 或發送外部訊息。外部副作用需確定性規則與授權人核准。

## 13. 待拍板事項

1. 第一個主要創作者族群：課程講師、顧問／教練、服務型創作者或代理商。
2. 公開銷售頁的第一版編輯方式：課程卡片清單、單一 Offer 銷售頁，或兩者同時支援。
3. 第一版網站能力是否延伸到多步驟漏斗；本輪先確定公開銷售頁。
4. SMS provider 與台灣簡訊合規流程。
5. Creator Workspace 的團隊計費與多品牌邊界。
6. 電子發票 provider 與正式營業人流程。
7. 行為分析資料保存期限與匿名化規則。
8. Live webinar 第一個 provider、錄影保存方式、使用量與失效回退。
9. AI provider、可送入模型的 Contact／Transcript 欄位、保留期限與模型停用路徑。
10. Affiliate／referral 是否重用現有模組、佣金歸因與付款生命週期。

## 14. 藍圖完成定義

- 十一份 capability spec 通過 Spectra validate。
- 資料模型、事件流、權限、台灣契約與 UI/UX contract 互相一致。
- 每個後續 SR 有明確輸入、輸出、owner、測試與瀏覽器驗收條件。
- Fish 已拍板第一個垂直切片為「多課程前台銷售 → PAYUNi → 課程／GitHub／LINE 交付」；剩餘頁面編輯方式與主要創作者族群拍板後，進入第一張施工 SR。
