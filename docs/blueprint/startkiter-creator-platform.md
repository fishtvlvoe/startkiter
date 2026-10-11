# StartKiter 台灣創作者營運平台藍圖

狀態：Blueprint v0.1，待 Fish 審查後才進入施工 SR
日期：2026-10-11
產品：StartKiter／開站包
範圍：完整創作者營運平台，不複製 Systeme.io 品牌或版面

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

第一版優先服務「已有內容或服務、想自己取得名單與銷售流程的台灣個人創作者」。課程講師是現有強項，服務型創作者先共用名單、頁面、Offer、付款與自動化地基。

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

## 5. 平台資訊架構

### 頂層工作區

1. **工作台**：待辦、營收、訂單、名單成長、寄送健康度、系統警告。
2. **名單與關係**：聯絡人、標籤、分眾、互動紀錄、同意與退訂。
3. **內容與商品**：網站頁面、課程、檔案、商品、組合包、優惠券。
4. **銷售流程**：表單、銷售頁、漏斗步驟、Offer、結帳設定。
5. **訊息與自動化**：電子報、活動、模板、工作流程、寄送紀錄。
6. **訂單與收款**：訂單、交易、訂閱、退款、發票、營收。
7. **分析與支援**：事件、報表、匯出、通知、客服案件。
8. **設定**：品牌、語系、付款、發票、寄信、LINE、權限、資料治理。

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
| CodePackage | 唯一 GitHub 代碼包資格；每位買家最多取得一個個人 repo | 沿用 GitHub App 範本與 per-buyer repo 流程 |
| Order／Payment | 訂單與付款狀態 | 沿用 Order、PaymentWebhookEvent、PAYUNi |
| Subscription | 訂閱週期與取消 | 沿用 CourseSubscription，逐步抽出通用介面 |
| Invoice | 發票生命週期 | 沿用 Invoice、InvoiceAllowanceOperation |

### 訊息、自動化與營運

| 實體 | 核心責任 | 既有重用 |
| --- | --- | --- |
| Campaign／MessageRevision | 手動或排程訊息 | 沿用 NewsletterCampaign、NewsletterTemplate |
| Automation／AutomationStep | 觸發器、條件、動作 | 沿用 NewsletterAutomation、Step、Enrollment |
| OutboxEvent | 交易後可靠發布事件 | 新增通用事件邊界 |
| DeliveryAttempt | provider reference、重試、錯誤 | 沿用 NewsletterRecipient、Delivery |
| AnalyticsEvent | 可報表化的行為事件 | 新增最小事件表／append-only pipeline |
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
| Tests | Vitest、Playwright、ego-browser | unit、integration、browser evidence |
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
- `packages/database`：additive Prisma migrations、indexes、retention policy。
- `apps/saas`：creator operations shell 與頁面；只做 composition，不把 domain logic 寫進 route page。

### 暫不裁決

- SMS provider。
- 完整漏斗／網站編輯器技術（BlockNote、HTML builder 或受限 block editor）。
- 事件分析儲存是否先留在 PostgreSQL，或日後導入專用 analytics store。
- 是否需要獨立 queue／worker runtime；先用 outbox + scheduled worker 建立基線。

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

## 11. 開發順序

| 階段 | SR 主題 | 交付結果 |
| --- | --- | --- |
| 0 | Blueprint approval | 本文件、6 份 capability spec、glossary、open questions 拍板 |
| 1 | Creator workspace foundation | workspace profile、capability、task shell、page states |
| 2 | Contact and consent foundation | Contact、identity、tag、segment、consent、import/export |
| 3 | Multi-course offer and commerce foundation | 多門課程、公開銷售頁、單課 Offer、checkout state、課程權限與唯一代碼包交付 |
| 4 | Creator home and operations | 待辦、訂單、名單、寄送、系統警告與 drill-down |
| 5 | Campaign and automation | campaign composer、outbox、workflow、delivery、retry |
| 6 | Landing page and funnel | page revision、form、funnel step、conversion event |
| 7 | Taiwan billing and invoice | PAYUNi、invoice adapter、折讓、人工補處理 |
| 8 | Analytics and export | event、report、CSV／試算表匯出、retention |
| 9 | Mobile and accessibility hardening | 390px、keyboard、focus、empty/error 全面巡查 |
| 10 | Production rollout | feature flag、shadow event、migration、rollback、正式瀏覽器驗收 |

每個 SR 必須有自己的 proposal、design、spec、tasks、focused tests、type-check、API 行為、桌面／手機 UI 驗收與回滾證據。

## 12. 不做的事

- 不把所有功能都放在第一版施工。
- 不直接複製 Systeme.io 的頁面、品牌、文案或 UI。
- 不新增沒有 owner、事件契約與驗收案例的資料表。
- 不把 user、contact、member、subscriber 混成一個模型。
- 不把 GitHub 代碼包當成課程教材，也不為每門課建立不同代碼包。
- 不用 AI 自動決定會員資格、退款、發票或行銷同意；AI 只能解釋與輔助，規則由系統決定。

## 13. 待拍板事項

1. 第一個主要創作者族群：課程講師、顧問／教練、服務型創作者或代理商。
2. 公開銷售頁的第一版編輯方式：課程卡片清單、單一 Offer 銷售頁，或兩者同時支援。
3. 第一版網站能力是否延伸到多步驟漏斗；本輪先確定公開銷售頁。
4. SMS provider 與台灣簡訊合規流程。
5. Creator Workspace 的團隊計費與多品牌邊界。
6. 電子發票 provider 與正式營業人流程。
7. 行為分析資料保存期限與匿名化規則。

## 14. 藍圖完成定義

- 六份 capability spec 通過 Spectra validate。
- 資料模型、事件流、權限、台灣契約與 UI/UX contract 互相一致。
- 每個後續 SR 有明確輸入、輸出、owner、測試與瀏覽器驗收條件。
- Fish 已拍板第一個垂直切片為「多課程前台銷售 → PAYUNi → 課程／GitHub／LINE 交付」；剩餘頁面編輯方式與主要創作者族群拍板後，進入第一張施工 SR。
