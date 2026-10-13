# 台灣交易、用途與課程重用交接

日期：2026-10-13
性質：文書接口／現行 source 對照；不是正式付款、寄信、發票或 LINE 驗收。
依據：[Taiwan spec](../../openspec/changes/creator-operations-platform-blueprint/specs/taiwan-localization-and-compliance/spec.md)、[commerce spec](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-content-and-commerce/spec.md)、[source owner](creator-platform-source-ownership-map.md)、[判斷表](creator-platform-domain-decision-tables.md)、[事件契約](creator-platform-event-operations-contract.md)。

## 1. 最小銷售閉環與權責

| 步驟 | 輸入／輸出 | 唯一 owner／失敗恢復 |
| --- | --- | --- |
| 公開頁／目錄 | published Course／Offer、locale、page revision→可看名稱／封面／售價／CTA | site/marketing composition；草稿不顯示，不覆既有 /course；page 修改不改已售資格 |
| 表單／登入返回 | 安全 return target、selected Offer／來源；需要 Contact 時保存 purpose evidence | auth 保身份、CRM 保關係；付款需要的登入不當行銷同意；next 保留所選方案，不接受任意外部返回 |
| server catalog／checkout | Offer 或舊 SKU／Bundle、coupon、核准 invoice preference、actor/scope→Order/session | commerce/payment；價格與幣別由 server，缺 provider／非法券／未定新政策拒絕，不信客戶端 amount |
| 付款通知 | verified provider result＋stored Order amount/currency/ref→paid／pending／failed | payment owner；簽章／金額／trade ref 不合不授權；重播不重做 paid transition |
| Invoice／資格 | 依核准 policy 分別發票與 Entitlement | invoice／entitlement owner 各自狀態；invoice failed 不改 paid，不能推論一律先發票才交付 |
| 交付頁 | 權利來源→已購 Course、每課 LINE invite、CodePackage claim 狀態 | course／LINE／github-kit；不自動入群、不露其它課、不創多 repo；claim error 可回讀 |
| welcome／營運 | paid source refs／所購課程→交易通知與事件 | 原 CourseWelcomeEmail／mail；同 Order＋Course 去重，accepted 不冒充實際收信；不換成 marketing |

最小流程是公開頁→表單或直接 checkout→thank-you/交付，不等完整 Funnel builder。CMS 保留路徑拒絕 /courses 與 course detail collisions；完整 builder、分潤、CRM pipeline 等仍依目錄獨立研究。

### 現行切片與總契約的快照時點差異

已讀 `apps/saas/lib/orders.ts` 的付款處理，在 paid 流程查 CourseOffer.courseId 並 createMany OrderCourseEntitlement；銷售 design 也描述成功付款寫入。總 blueprint 新 recurring／通用 Offer 要在 server checkout/agreement 建立時凍結資源集合與 policyVersion，支付時只啟用其結果；不可兩者皆說已完成。

CourseOffer 單課關聯鎖定是現行切片保護，不等於 Bundle／未來可變 delivery policy 都已固定快照。SR-07／06 的對接要寫清 immutable single-course baseline、mutable Bundle/historical mapping、擴充完整 pending snapshot 的 migration／回讀；缺舊成員證據不猜，保留原 Bundle 路徑且不得宣稱舊動態 resolver 已符合完整歷史契約。本差異保持 task 8.2 的語意整合 gate，這轮沒有改 Order 代碼。

## 2. 一次買斷／訂閱／退款接口矩陣

| 模式 | Price/currency／state | webhook/refund/invoice／資格 owner |
| --- | --- | --- |
| 既有 MVP 一次買斷 | server 既有 8800 TWD SKU；歷史 mapping 唯一且已核准，不暗換定價 | PAYUNi／Order 原流程；legacy course mapping 不唯一停 backfill；原批准 invoice／kit policy 保留 |
| CourseOffer／Bundle 一次買斷 | server published catalog、整數 TWD、coupon 結果、Order 付款金額與指定資源 | payment verifies amount/ref/signature；course access／LINE／kit 分開；refund 重算其它有效資格；invoice 對應其核准政策 |
| 現有單課 MONTH／YEAR | CourseSubscriptionPlan 與每期 stored price/ref，不能混 one-time SKU | recurring adapter 保狀態，取消／到期依原核准規則；每期已驗證 charge 才算實收，不用 ACTIVE×price |
| 新季／Bundle／CodePackage recurring | 06C policy／price/resource/license 先定稿→SR-11 mapping/sandbox→06R | 週期及 provider idempotency 能力明訂；未定 expiry/cancel/update/source/repo 不發布新 Offer；未實跑不宣稱已支援 |
| Refund／Cancel | 有效狀態與生效時間、provider outcome、原 snapshot＋其它合法來源 | payment/subscription owner 決定結果；entitlement／invoice／grant 各依policy；不產生 consent revoke，不自動刪買家 app |

payment port 與 invoice port 獨立；每個 adapter 記 supported mode、credential kind／destination、request intent key、provider reference、normalized outcome、error／unknown／reconcile／retry／rollback。供應商無 idempotency/lookup 不能用 timeout 斷言沒有執行；新請求必帶內部 intent key，但遠端能否去重須另驗證。

## 3. Provider／secret／fail-closed／rollback

| 邊界 | 現行 source／設定方式 | 不足與失敗規則 |
| --- | --- | --- |
| PAYUNi | [gateway-settings](../../packages/payments/gateway-settings.ts) 的核准 encrypted settings 或 PAYUNI_MERCHANT_ID／HASH_KEY／HASH_IV；[notify decision](../../packages/payments/notify.ts) 核對 Order | 缺完整配置不 checkout；簽章不合不變 paid；新 mode 回退不刪交易／其它有效權利 |
| Invoice | 現有 `packages/payments/provider/ezpay`／`ecpay` adapter 作來源，不替新 Offer 選 provider 或適用政策 | invoice outcome／人工補處理／折讓獨立；unknown 先對帳，不亂重發；保留 refs／稽核 |
| Mail／Newsletter | 原 mail/provider、CourseWelcomeEmail、email delivery log；ToSend 使用 TOSEND_API_KEY | sender／purpose／credential 先查；交易信不受一般 marketing 分眾替代；accepted 不等於 delivered；新行銷 consumer 可停，不重播已送信 |
| LINE Login | 既有身份 adapter／登入 channel，與 Messaging token 分開 | 只建立 identity/session，不當 consent、不靜默入群；callback failure 保安全返回 |
| LINE invite／support | [course line invite](../../packages/course/line-invite.ts)、每課 invite URL、核准 support channel | 缺資格不露連結；group join 由使用者自己操作；support failures 有案件／回讀，不寫 marketing grant |
| SMS／新分析／影音／AI | 未核准的新 adapter 不在此默認啟用 | 缺 provider／用途／保存規則阻擋該新功能；不因此暗換現有 mail／PAYUNi／LINE |
| Buyer credential handoff | 既有 managed endpoint 通用 key／allowlist 是前置安全來源 | 尚需 PAYUNi／ToSend 實際 consumer mapping；database/new provider 不能跳 allowlist，不能承諾 env write 等於服務接通 |

raw secret 不存 StartKiter log／錯誤摘要／AI prompt，已讀 credential keys 是名字，不是值；買家 app 可依已核准方式持有其環境／加密設定，不與平台營運 credentials 混用。開新 provider／更新 key／切正式模式由對應 SR 的 actor、target、費用、scope 與實跑證據核准，本輪沒有外部變更。

## 4. Locale、時間、金額與比對

實際 [i18n config](../../packages/i18n/config.ts) 使用 `zh-tw`／`zh-cn`／`en`，預設 `zh-tw`、TWD；spec 的 zh-TW 是語言語意，不新建另一套 key。角色／公開頁／email／日期／匯出都走相同已解析 locale context，換語言只改標籤與顯示，不能改 stored amount 或 resource IDs。

TWD 金額保存／計算整數，UI／信件用 `NT$` 與千分位，不信格式化字串當 server price。例：8800 換 en 後仍儲存 8800 TWD。UTC 保存資料時間與 scheduled instant，workspace 顯示預設 Asia/Taipei；篩選以 local period 轉明確 [from,to) UTC，排程 2026-11-01 09:00 Taiwan 對應 01:00Z，不隨 worker 主機時區改變。

地址／電話保留 raw 與版本化 normalized key；country/format 不足留 review/rejected，不猜國碼。Tag／名稱／來源關聯的異體字、簡繁及全半形比對，寫入與 query 使用同一 canonical-key policy，display 原值不被單向翻譯；hash／ID／SKU 不當可翻譯文案。

## 5. LINE 用途、個資與 consent／audit

| 用途 | permission／依據／資料 | failure／禁止推論 |
| --- | --- | --- |
| Login | 本人身份驗證與 session；只取核准 identity 欄位、source/version/time | 成功登入不等於允許 email/SMS/LINE marketing；不借 Messaging token 做 Login |
| 已購課社群邀請 | Course entitlement＋該課 invite URL，只讀 access decision／必要 audit | 未購買不露別課 invite；顯示 URL 不等於自動 join，不保存群內私人內容 |
| 客服 Messaging | 核准 support channel／案件 scope／support purpose、必要 contact／message refs | 只處理服務問題；不升成 marketing grant、不自動分享給 Creator AI |
| 行銷 | workspace/channel/purpose 的有效 grant、notice/policy version、來源／time/evidence；即時 suppression | 退訂／bounce 等依判斷表；付款、CSV、Contact merge 不製造同意；缺 SMS/LINE adapter 不送 |
| analytics／recording／AI | 明訂 purpose/category/controller/processor/store/access/retention／可送欄位 | 未核准新用途停；不以「已買課」推定可錄影、送 transcript 給模型或跨 app 合併資料 |
| 更正／匯出／停止利用／刪除 | 身份／actor／資料 scope 驗證、request ref、核准人／結果／hold policy | 移除／匿名化 eligible data，不刪 User／Order／應留證據；保留撤回與處理稽核，回讀結果 |

本節是資料用途與處理流程契約，不是法律適用或保存天數的結論；正式活動、發票／個資政策與 processor 配置由對應負責人確認。不同用途共享可稽核 reference，不共享正向 consent 假設。

## 6. 銷售切片的 Course 功能 reuse boundary

| 已有能力／真相 | 本次維持 | 銷售／平台 composition 可以改什麼 |
| --- | --- | --- |
| Course／Chapter／Lesson | 原內容資料與 CRUD owner 不複製 | 公開讀 published 內容、按 registry 到 Course Studio，Offer 不存第二份章節 |
| Assignment／Quiz／Review | 原學習紀錄／判斷／講師與學員 scope | 只讓有原資格／能力者進入，commerce 不重建學習模型 |
| Media／Course Pack／互動積木 | 原 upload／播放／內容格式／安全邊界 | page 引用 resource，不把程式碼包當課程教材，不抽禁用來源 |
| Bundle／Coupon | 原組合／券／交易責任與舊 route 保留 | catalog／snapshot／新 Offer 作增量，不重做 /bundles；歷史可變成員另有 mapping gate |
| LINE invite | 原 course access／每課 lineInviteUrl | 由 OrderCourseEntitlement 或其它合法課程來源決定可見性，不用全站共用 invite |
| Welcome email | 原 renderer／sendWelcomeEmailsForOrder／delivery log owner | 每筆所購課程引用原 CourseWelcomeEmail，order/course 去重；避免複製 send-engine |

這份表補在既有 sales SR design 的 scope 說明，供 source-level regression 使用；Course CRUD／Editor／拖曳／媒體等未因文件補表就驗收，外部 Bundle／PAYUNi／Email／GitHub gate 仍各自在原 SR。抽取來源沿用專案允許清單，不拷貝 realms／libon／禁止的 auth/provider 層。

## 7. 文書核對範圍

對應 3.2、4.1～4.5：最小 page/form/CTA/checkout/thank-you/delivery、server 價格／支付與 invoice/entitlement owner、locale/TWD/UTC 顯示、provider／secret／failure／rollback、LINE 與 personal-data purpose，以及 Course 九類重用能力都有接口／恢復與來源。八個 Taiwan／十四個 commerce 情境後續仍需真實測試與外部證據；價格／invoice／取消／provider 的未決新政策不在本輪核准，8.2 的 snapshot 語意對接仍待。
