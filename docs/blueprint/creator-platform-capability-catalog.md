# Creator 平台完整已知能力目錄

日期：2026-10-13
用途：讓後續加 CRM、SMS、直播、AI 或其它已知營運能力時，先找到 owner、資料與驗收邊界，不把未列出的功能當成不存在。
範圍：本總計畫已知的產品能力與研究缺口；不是「Systeme.io 全部頁面已逆向完成」，也不是所有功能已施工。

## 狀態與依據

「沿用」指現行規格或 source 可作前置；「擴充」指現有地基不足目標流程；「待研究」不能直接產生 runtime task。實際 source 與既有 SR 的責任以 [施工責任表](creator-platform-source-ownership-map.md) 為準；十五張核心卡片與發布順序以 [開發交接](creator-platform-development-handoff.md) 為準。

下表的候選後續 SR 名稱只是規劃識別，不是已建立、已核准或已開始施工的 changes。與目前十五張卡片共享的能力只能沿用相同 owner／契約，不能另建 Auth、Order、Consent 或 checkout。

| 能力 | 目標流程／資料責任 | 沿用／擴充／研究依據 | 核心 owner／後續交接 | 發布前必須有的證據 |
| --- | --- | --- | --- | --- |
| 平台、身份與品牌 | actor＋organization＋app context、成員、能力、品牌設定 | [organization-tenancy](../../openspec/specs/organization-tenancy/spec.md)、[navigation](../../openspec/specs/role-based-workspace-navigation/spec.md)；context bridge 待擴充 | SR-01／02，身份資料仍由既有 auth/database 管 | 直接 route denial、跨工作區隔離、桌機／390px、舊 adapter 回滾 |
| CRM 聯絡人與時間線 | 未登入 Contact、verified identity link、來源、互動歷史 | 現有 User／Newsletter 是部分地基；[CRM 藍圖](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-crm-and-audience/spec.md) | SR-05；不把 Contact 當 User | 匯入 dry-run、去重／合併審查、來源回讀、刪除與同意保留 |
| 標籤與分眾 | Tag、可重算 Segment、版本、受眾快照 | [newsletter-audience-targeting](../../openspec/specs/newsletter-audience-targeting/spec.md)，擴到 Contact | SR-05／09；CRM 決定受眾，AI 只解釋 | 相同資料／規則重算一致；撤回同意後不被重新納入 |
| 商機管道 | Pipeline／Stage／Deal、負責人、金額、下一步；Deal 不等於已付款 Order | 逆向清單有高層入口；欄位／編輯／權限與現有 source 尚待研究，不宣稱已完成 | 候選 creator-crm-pipeline，依 SR-01／03／05 | 階段變更稽核、金額／幣別、跨工作區拒絕、取消不更改交易 |
| 日曆與活動 | Calendar／Activity、時區、負責人、提醒、外部同步邊界 | 逆向清單的 CRM 高層範圍；不推定已有預約收款／雙向 calendar API | 候選 creator-calendar-activities，依 SR-05／09；商用預約另定 Offer | 夏令／時區呈現、重複提醒去重、取消與外部失敗恢復；外部整合未觀察則留 gate |
| 網站、頁面與 Blog | Page／Revision、slug、draft→published→restore、SEO | [buyer-pages-cms](../../openspec/specs/buyer-pages-cms/spec.md) 沿用；完整 builder 深度待決策 | SR-10；CMS 保留內容真相 | 草稿不覆發布版、保留 route 拒絕、桌機／手機公開頁回讀 |
| 銷售漏斗與表單 | FunnelStep、Form、Contact consent、Offer CTA、thank-you、來源 | [commerce 藍圖](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-content-and-commerce/spec.md)；未觀察的 builder 行為留研究 | SR-10，重用 SR-05／06 或 07 | 表單驗證、已核准 Offer、成功／失敗路徑、歷史交易與內容改版隔離 |
| Email 與 Campaign | 草稿、模板、測試、排程、recipient snapshot、Delivery／Open／Click／退訂 | [newsletter-send-engine](../../openspec/specs/newsletter-send-engine/spec.md)、既有 newsletter 整合尚有驗收缺口 | SR-09；交易信與行銷信分目的 | 真實寄信、排程回讀、provider ref、重試、suppression；不以 mock 收信代替 |
| SMS | 目的／同意、模板、排程、費用／速率、送達、退訂、provider ref | 高層研究範圍；provider 未選，不宣稱已有發送端 | 候選 creator-sms-channel，沿用 SR-05／09／11 | provider sandbox／真實送達與費用限制、目的撤回立即抑制、失敗不重複扣費；缺供應商不公開 |
| 跨模組 Automation | 事件、Outbox、Enrollment、Step、Retry、dead-letter | [marketing 藍圖](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-marketing-automation/spec.md)，newsletter 只是既有 consumer | SR-03／09 | domain state 與 outbox 同交易、重播無重複副作用、人工重送有稽核 |
| 課程 Studio | Course／Chapter／Lesson、媒體、講師、章節與教材管理 | [course-module](../../openspec/specs/course-module/spec.md)、[media library](../../openspec/specs/course-media-library/spec.md) 等現行規格沿用；本輪不是課程引擎重寫 | course module owner；SR-07 只接銷售與交付 | 原課程 CRUD／觀看／講師 scope 回歸，入口遷移仍歸 app-feature-surfaces |
| 學習、互動與討論 | 作業、測驗、評價、留言／私訊、積木、程式沙盒、Course Pack | [assignment](../../openspec/specs/course-assignment-plugin/spec.md)、[quiz](../../openspec/specs/course-quiz-plugin/spec.md)、[interactive blocks](../../openspec/specs/interactive-learning-blocks/spec.md)、[sandbox](../../openspec/specs/course-code-sandbox/spec.md) 作重用來源 | course owner；新增學習能力另提垂直 SR，不混入 commerce／CRM | 觀看資格、輸入安全、教師／學員權限、內容版本與原互動回歸 |
| 單課商品與多方案 | ContentResource／Product／CourseOffer、server price、交付快照 | SR-07 已有工作樹修改；[catalog](../../packages/payments/catalog.ts) 可定位，不代表已驗收 | 先 SR-07，後 SR-06 通用契約 | 公開目錄無草稿、登入返回 Offer、server 金額、付款 replay、精確權限 |
| Bundle 與優惠券 | 指定課程集合、Coupon policy、歷史 snapshot，不是全站 unlock | [course-bundles](../../openspec/specs/course-bundles/spec.md)、[checkout-coupons](../../openspec/specs/checkout-coupons/spec.md)；Bundle 原入口仍有購買 gate | 既有 Bundle owner＋SR-06／07 相容；不重建 /bundles | 成交後改組合內容不改歷史資格；券無效／額度／退款回歸 |
| 課程／Bundle／CodePackage 訂閱 | 月／季／年，取消、到期、更新與源碼授權分開 | [subscription-billing](../../openspec/specs/subscription-billing/spec.md) 現有月／年單課；季與通用商品是擴充 | SR-06C→11→06R，維持唯一 commerce 真相 | 新週期 migration、PAYUNi 映射／sandbox、到期取消、舊 MONTH／YEAR 與一次買斷回歸 |
| 訂單、退款、發票與收款 | Order／Payment／Invoice 各自狀態；payment owner 決定付費結果 | [payuni-checkout](../../openspec/specs/payuni-checkout/spec.md)、[einvoice-issuance](../../openspec/specs/einvoice-issuance/spec.md) 沿用 | payments／invoice owner，SR-11 協調新模式 | webhook 簽章／重播、退款資格重算、invoice failure 恢復；不把發票成功當付款成功 |
| 推薦、聯盟與分潤 | 申請、推薦來源、歸因、佣金、退款沖回、付款與稽核；佣金不是訂單真相 | 逆向清單記錄 Affiliate program／invoices 入口；完整 lifecycle 與可重用 source 未確認 | 候選 creator-affiliate-program，先 research，再依 SR-06／11／12 | 自我推薦／重複歸因、退款沖回、佣金對帳、付款證據；規則未核准前不公開承諾分潤 |
| 檔案、社群與其它服務商品 | ContentResource 可擴充，Product／Offer 決定指定資源與期限 | 這是擴充槽，不代表已有完整會員社群或預約服務；LINE 邀請另按用途管理 | 候選 creator-resource-products，依 SR-03／06；各內容 owner 獨立 | 未購買／到期拒絕、快照與取消；不把「能掛模組」當成已實作新產品 |
| 實體商品 | PhysicalProduct 的商品、付款、履約責任；是否包含庫存、出貨、退貨先定範圍 | Systeme 免費導覽曾觀察 Physical products 入口，未取得完整建立／庫存／出貨流程，不宣稱 StartKiter 已有 | 候選 creator-physical-products，先 research；重用 SR-06／11 的交易真相，履約另有 owner | 商品與 Offer／Order 不重建；收件資料目的／權限、庫存與出貨若納入需獨立證據；未研究前不承諾物流整合 |
| GitHub CodePackage | 全平台一 template、每人一份交付資格；源碼、更新、grant 分開 | [github-kit-fulfillment](../../openspec/specs/github-kit-fulfillment/spec.md)、[claim](../../packages/github-kit/claim.ts)；writable／pull 衝突已列 | SR-07 交付切片；SR-03／04 解買家可寫 repo／版本追蹤 | 真實 GitHub 權限、重複購買不多 repo、退款保留其它有效資格；不抹下載副本 |
| 買家桌面 AI、自有 SaaS 與部署 | 讀專案→環境檢查→本機→自有 repo→付費頁→hosting tier→更新 | [buyer-dev-skill](../../openspec/specs/buyer-dev-skill/spec.md)、[credential handoff](../../openspec/specs/buyer-credential-handoff/spec.md)、[hosting tiers](../../openspec/specs/managed-hosting-tiers/spec.md) | SR-04；買家 app 自己持有終端客戶／登入／付款／資料 | 乾淨專案用手冊／Skill 實跑、版本不符停止、秘密不進 repo／log、指定 tier 部署與回滾 |
| Live／Evergreen Webinar | 模式、場次、報名、提醒、出席、回放、clone/archive、報表 | [WebinarJam 觀察](webinarjam-reverse-engineering-notes.md)、[live spec](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-live-and-webinar/spec.md)；影音技術未知 | SR-13；Contact／交易／Automation／Analytics 保留各 owner | provider failure／重播、取消活動、no-show 證據、錄影同意／retention、390px；缺 provider 不造假連結 |
| 工作台、分析與匯出 | 可操作待辦、source／日期／scope、事件重算、server-scoped export | [operations/analytics spec](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-analytics-and-operations/spec.md)、現有 course metrics／sheets 部分地基 | SR-08／12；每個來源 domain owns 真相 | 缺來源不是 0、每卡到任務、重播去重、越權匯出拒絕、匯出回讀 |
| 客服、通知與 LINE | 案件／回覆／通知／Login／邀請／Messaging 分開用途 | [notifications](../../openspec/specs/notifications/spec.md)、[support topology](../../openspec/specs/support-runtime-topology/spec.md)、[LINE community](../../openspec/specs/line-learner-community/spec.md) 沿用 | 既有 support／notifications／LINE owner；SR-08 只聚合任務 | 原客服渠道回歸、自己資料限定、不靜默入群；Login 不等於行銷同意 |
| Creator 營運 AI | scoped tools、摘要／草稿、來源、預覽／人審／audit、停用 | [AI spec](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-ai-assistance/spec.md)，現有客服只讀兩工具不被升權 | SR-14；與買家 Code Skill 隔離 | 未核准零副作用、核准再查權限、最小資料、來源與模型版本回讀、停模型保留人工入口 |
| 核心／官方模組／客製更新 | manifest、兼容版本、schema/events、flag、客製 diff、migration、Skill、回滾 | [extension contract](../../openspec/specs/app-extension-contract/spec.md)、[update spec](../../openspec/changes/creator-operations-platform-blueprint/specs/platform-extension-and-update-contract/spec.md) | SR-03／15；每批域 owner 回歸，不整包覆寫 | expand→migrate→contract、衝突先停、舊 consumer、TEST 回滾、API／UI 回讀、買家客製保留 |

## 尚未研究的功能如何加入，避免漏列或做 A 壞 B

1. 先在逆向清單記 Evidence／未觀察欄位，不從入口猜第三方內部技術或副作用。
2. 定義使用者任務、資料 owner、scope、API／event consumer，確認不重建本表既有真相。
3. 拆獨立 SR：proposal／design／spec／tasks，列政策／provider 阻擋與回滾；未決部分不執行。
4. 用版本化契約接 App／模組，先相容舊流程再遷移；取得受影響功能回歸與實際證據。
5. 依核准批次發布；核心、官方模組、買家客製與 Skill 的版本／衝突／rollback 一起交付。

商機、日曆、SMS、分潤與新資源商品的具體欄位／策略仍待各自研究和核准；列進目錄代表沒有被遺忘，不代表被偷偷塞入目前銷售切片或已排施工日期。
