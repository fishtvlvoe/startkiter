# 事件、自動化、報表與擴充交接契約

日期：2026-10-13
性質：施工前契約；不是 Outbox／Live／AI／report runtime 已完成或已跑測試的宣告。
來源：本 blueprint 的 marketing、analytics/operations、CRM、commerce、live、AI、update specs；[handoff](creator-platform-development-handoff.md)、[領域判斷表](creator-platform-domain-decision-tables.md)、[source owner](creator-platform-source-ownership-map.md)。

## 1. Event envelope 與信任邊界

每個有效事件要能回讀 eventId、eventType、schemaVersion、workspaceId、occurredAt（UTC）、recordedAt、producer、subject/resource refs、必要 actor ref、correlation/causation、deduplication key、purpose／retention policy reference、最小 payload 與 source evidence。未提供 scope／版本或不合法 producer 的事件拒絕，不能丟進全站預設 workspace。

只有 domain owner 在已驗證的狀態改變後產生權威事件。`order.paid` 從付款結果與儲存 Order 核對後產生，不信任 UI、LLM、外部 payload 自稱 paid；`consent.granted` 要有該目的證據，不信任 CSV 或登入旗標；provider 回報須驗證來源、resource 與 instance mapping。權威 domain state 與 OutboxEvent 在同一 transaction 持久化，送達／報表不反過來改寫付款真相。

事件可 at-least-once 傳遞，但 enrollment、step、grant、read model 的邏輯結果用持久化唯一鍵去重。事件 ID／provider reference／message body hash 用途分開；同名事件但不同 workspace 或資源不能碰撞。既有 PaymentWebhookEvent 與 newsletter 狀態只作重用來源，不宣稱已是通用 creator outbox。

## 2. Producer／consumer／重播對照

| 事件 | 唯一 producer | consumer／資料 scope | 重播與不能推論 |
| --- | --- | --- | --- |
| contact.created／updated | SR-05 CRM | timeline、Tag/Segment、經允許的 SR-09 workflow；同 workspace | 不重建 Contact／Enrollment；建立不等於同意 marketing |
| consent.granted／revoked | CRM consent owner | 目的／channel eligibility、timeline、scheduled delivery 檢查 | 不重複記有效 consent action；revoke 不刪 Order，grant 不清 hard bounce |
| form.submitted／page.conversion | SR-10 form/site owner | Contact source、同意證據、automation、conversion read model | 提交去重；表單成功不等於付款或已同意所有目的 |
| checkout.created | commerce owner | checkout/report；只見授權 Offer／Order refs | 不授付費資格、不算已付營收 |
| order.paid | payment/order owner | Entitlement／Invoice／transactional message／analytics，各有自己結果 | 同一付款結果不多 Order／grant／repo；發票失敗不偽造 payment failure |
| order.refunded／subscription state changed | payment/subscription owner | 資格聯集重算、invoice/refund、campaign 業務條件、report | 不撤其它有效來源，不製造 consent revoke，不刪買家 SaaS 資料 |
| content.accessed | content owner | course progress／read model，按資料目的與權限 | 不把觀看事件當成付款證據；管理員預覽不得冒充學員轉換 |
| delivery outcome／automation step | SR-09 adapter/worker owner | delivery history、suppression（有證據才適用）、operations/report | accepted 不等於 delivered／opened；unknown 不當作沒寄出 |
| support.created／resolved | support owner | notification／operations read model | 不把客服訊息當行銷同意或 AI 可送外部資料 |
| webinar registration／attendance／replay | SR-13 webinar owner，影音事件經 adapter 驗證 | CRM timeline、reminder、analytics／follow-up draft | 跨 webinar/session 不混算；缺出席資料不是 no-show；註冊不直接授課 |
| ai.draft／approval／action outcome | SR-14 tool/audit owner | review queue、經核准 domain command、audit | 模型不能直接 emit paid／grant 真相；核准時重新驗權／資料版本，重播不重做 side effect |

## 3. Campaign 完整生命週期

| 階段 | 固定／保留 | 下一步與失敗恢復 |
| --- | --- | --- |
| draft | workspace、message revision、sender、purpose/channel、audience rule | 預覽／測試不改成 scheduled；缺資料列欄位錯誤 |
| preview／test | eligible／excluded counts、規則版本／referenceTime、收件快照／排除原因 | 無合格收件人拒絕排程；測試寄送另有核准對象，不擴成全名單 |
| scheduled | message/sender/audience revision、UTC scheduledAt、display timezone、schedule policy | Asia/Taipei 2026-11-01 09:00 對應 UTC 01:00；編輯修訂需重新確認，不偷偷改已排版本 |
| queued／sending | claim／lease／heartbeat、delivery intent keys、attempts、即時 eligibility | queued 是既有 Newsletter 的 bridge 狀態；每次真正寄送前查 consent/suppression，不能只信快照 |
| paused／cancelled | 停止尚未送出的 work、已接受／送達結果、action actor／原因 | 停止前已 dispatch 的請求可能仍被接受；不把取消畫成追回已寄信 |
| sent／partial-failed／failed | 每個 recipient 的 accepted／delivered／failed／skipped／unknown 與 provider evidence | terminal 不退回 draft 重播；人工重送是新審核 intent，不改舊 delivery 為未寄 |

runtime proposal 必須選定狀態 enum／轉移守衛與原 Newsletter 對照；未定義的轉移拒絕。若修改 schedule／audience，既有未完成 delivery 的處理 policy 要先明訂；不能盲用舊 enrollment 配新內容。

## 4. 外部發送、重試與 dead-letter

| 結果／情況 | 保存與判斷 | 下一步 |
| --- | --- | --- |
| accepted | request/intent key、provider ref、時間；只是接受請求 | 等 provider delivery／bounce／complaint evidence；不宣稱人已收到 |
| delivered／opened／clicked | 來源驗證、原 delivery reference、資料目的、時間 | 各指標分開計；沒有 provider 支援就顯示不可取得，不畫 0 |
| deferred／confirmed-not-accepted | normalized reason、attempt、nextAttempt、retry budget | bounded retry 用同 intent key；budget 值由核准配置，例子 3 次不是全平台預設 |
| rejected／hard bounce／complaint | permanent reason、scope/address evidence、suppression update | 停止自動重試；修地址／授權後再審核，不讓一般 consent grant 清除 |
| timeout／unknown | 保存已 dispatch 與可能 provider ref，不能假設沒有 side effect | adapter 支援 lookup/idempotency 且已驗證才安全 reconcile/retry；不支持就暫停給授權 operator |
| retry budget exhausted | failed step、最後 outcome、attempt history、domain refs、dead-letter owner | 修原因、重新查權限與 eligibility；控制重試／新 intent 明確，不無限循環 |
| no sender／provider | 明確配置缺失、worker/enrollment ref；不吞事件 | operator 補核准配置後恢復；支付／課程既有流程不受新發送失敗牽連 |

Adapter 必須宣告 idempotency／lookup／delivery evidence 能力；不假設所有 Email／SMS provider 都支援。claim lease／heartbeat 避免並行重做，但不能證明遠端請求沒有被接受。重試（同意圖）與重送（新意圖）分開，sender、purpose、data scope、費用／速率 gate 每次重查。SMTP 接受、HTTP 200、mock PASS 或 UI success 不是實際收件證據。

已讀 Prisma source 的映射限制：NewsletterRecipient 有 status、providerMessageId、attemptCount、errorMessage、sentAt；EmailDeliveryLog／NewsletterAutomationDelivery 有 status、providerMessageId、errorMessage、sentAt。可重用 provider ref／嘗試／發送時間作資料來源，但 errorMessage 要另正規化／去敏，不把 sentAt 當成已確認 deliveredAt。缺少的 confirmed delivery／unknown reconciliation／通用 Outbox 欄位須由 SR-09 migration／adapter 增量處理。PaymentWebhookEvent 的 gateway＋eventId 唯一鍵保留在付款領域，不能拿它充當全部 workflow／report 的去重表。

## 5. 可重算報表與 server-scoped 匯出

| 條件 | 必須記錄／檢查 | 禁止捷徑 |
| --- | --- | --- |
| query identity | workspace、actor capability、filter/rule version、UTC 起迄、display timezone、referenceTime、source/read-model version | 只靠 UI 選中 workspace；客戶端傳 order rows 就當授權來源 |
| money | Order/provider 的已核對金額與 TWD，paid gross、refund、net 的公式／口徑各明訂 | 只數 checkout.created；accepted delivery 當銷售；退款隱藏以假增收入 |
| de-dup/rebuild | eventId／source transition key、checkpoint、rebuild input version、watermark/freshness | 重播多算；用同時間不同資料卻說可重算一致 |
| availability | 正常 0、無資料、缺來源、延遲、讀取失敗分開 | 超時畫 0；沒有出席資料判 no-show；缺 opened API 算沒人開信 |
| export | server 解析權限與相同 filters、准許欄位、actor、locale/timezone、generatedAt、source watermark、file hash | 先產檔再檢權；越權時吐出 rows/counts/columns；匯出偷偷改條件 |
| stable reproduction | 同一事件／快照來源、版本、篩選與 referenceTime 得相同語意 rows／金額 | 若檔案包含 generatedAt 等動態 metadata，不承諾 byte hash 永遠相同 |

資料變更後的即時查詢可更新，舊 export 仍保存當時 watermark／filter policy。取檔與執行工作都重查權限；source 不足／未知時不能借別的 workspace 補數據。現行 sheets renderer 能做檔案，不代表其 caller-provided orders endpoint 已達此 server-scoped 契約。

首批收款變動口徑明訂為：gross=sum(已驗證且收款確認時間落在 [from,to) 的 charge amount)，refund=sum(已驗證且退款確認時間落在同區間的 refund amount)，net=gross−refund，全部依儲存 TWD 金額，不用目前 Offer 售價。這是收退款指標，不冒充利潤或其它報表口徑；退款發生在後一期間時，不偷偷改前期 gross，net 可為負值。若要以原訂單成交日重述，另列 reportVersion／refund allocation 規則，不混在同欄。

Recurring 報表要用每期已驗證 charge/period reference，不能用 ACTIVE subscription count×目前 plan price 算實收；若來源缺少每期結果，顯示不可取得並阻擋該指標。文書例 R1：O1 TWD 8800 同事件重播兩次，gross 仍 8800；R2：同區間 verified refund 2000，net 6800；R3：下一區間只有 refund 2000，gross 0、net −2000。這是公式期望，不是已跑正式資料或 accounting 驗收。

## 6. 失敗告警要有 owner 和回頭路

| failure | owner／任務入口 | evidence／恢復 |
| --- | --- | --- |
| payment mismatch／signature | payment owner／指定 Order 的核對隊列 | redacted webhook/source ref、原 Order 狀態不變；修來源後只重跑允許事件，不手動設 paid |
| invoice issue/retry | invoice owner／指定 Invoice／Order | paid 與 invoice pending 分開；provider ref／retry evidence／人工補處理；不刪交易 |
| delivery failed／unknown | automation/mail owner／指定 Delivery | accepted／unknown 分開，排除原因與 provider ref；reconcile／安全 retry／授權重送 |
| automation dead-letter | workflow owner／Enrollment／Step | producer／step version、attempt history、normalized reason；修規則或配置後controlled retry |
| migration／startup／API/UI failure | release＋affected domain owner／release checkpoint | 停新 flag/channel、回讀、compatible rollback 或 forward-fix；保留新交易／客製 |
| media session/replay failure | webinar＋media adapter owner／Webinar／Session | 通知受影響場次、provider ref、缺資料標未知；不造假 join/replay link |
| AI model/tool failure | AI tool＋domain owner／draft/approval/action audit | 關模型保留確定性人工入口；不能以模型錯誤改付款／同意／授權 |

每個告警記 workspace、failure code、severity、dedup key、source refs、first/last seen、count、owner、status 與 next action；通知本身有重播與頻率限制，不能因原事件重播淹沒客服。具體通道與 SLA 值由後續 SR 核准，不把 email／Chatwoot／LINE 混成同一永久啟用承諾。

## 7. Live／AI／CRM／Offer／Automation／Analytics 的擴充矩陣

| domain owner | 輸入／permission | 輸出事件／下游 | retention／rollback 邊界 |
| --- | --- | --- | --- |
| CRM | actor＋workspace，identity／purpose evidence；匯入／合併／匯出分能力 | Contact／consent／segment versions、timeline refs | 保留撤回／audit，個資按核准目的與 retention version；停新 importer/consumer，不清合法交易 |
| commerce/payment | server Offer snapshot、buyer／scope、已驗證付款與條款 | paid/refund/subscription／精確 grants／Invoice refs | 交易與政策快照保留；停新 Offer／provider 模式，不換歷史資格或刪 buyer SaaS |
| Automation | 同 scope 的有效事件、rule/message revision、即時 consent／deliverability | Enrollment／Step／Delivery outcome，Tag／notification 的核准 domain action | 目的與 execution history retention 明訂；停新 enrollment，已寄副作用不可當作回滾消除 |
| Webinar/media | 講者／報名／觀眾權限分開，Live/Evergreen/schedule/provider refs、recording 同意 | registration／attendance／replay／verified media outcomes；CRM／Offer 不被影音取代 | 錄影／transcript／attendance／audit 各列 owner／policyVersion／expiry/deletion；值未核准不啟用新錄製／AI export，取消保留交易 |
| Creator AI | scoped tool，來源與欄位 allowlist、model policy、version-bound human approval；執行前再查權 | draft／review／action audit；真正的付款／授權事件只能由 domain command 產生 | prompt／來源引用／transcript／audit 最小化並有獨立 policy；停模型不刪交易、買家 Code Skill 不共享資料 |
| Analytics/export | authorized actor/workspace、事件版本與 source refs／filters／watermark | scoped report／rebuild／export evidence | 原事件、read model、檔案與個資不同 retention policy；停 consumer/export 可重建，不把 metric當 domain truth |

每個 retention policy 要表達 data category、purpose／legal or operational basis、controller/processor、store location、access roles、policyVersion、start/expiry、deletion/hold、buyer/upstream boundary、是否可送入模型與 rollback 影響。這是必填契約，不指定未核准天數。新的影音錄製、transcript AI 或資料匯出在政策未核准時停用；既有合法來源保留原條款，不被未決新功能清空。

## 工作台任務卡與 AI 人審入口補充

以下是 SR-08/14 screen contract，不是六個正式 route 或新工具已實作。每卡由同一 context/registry 給 capability-aware 入口，domain owner 決定原紀錄真相，工作台只聚合；無權限不露紀錄/count，來源失敗標不可取得。

| 任務卡 | 來源／owner與具體下一步 | 完成／失敗／返回 |
| --- | --- | --- |
| 待回覆 | support/private-message已授權來源→指定Case/Thread詳情→回覆 | 真實回覆outcome與紀錄回讀，失敗保留draft；返回原workspace/待辦條件，不升行銷同意 |
| 付款待確認／失敗 | payment Order/ref→核對詳情／核准重試或對帳 | 不手動設paid；unknown/簽章失敗分開，已核對結果才出待辦，返回原查詢 |
| 寄送失敗／未知 | Delivery/Enrollment來源→原因／provider reference→安全retry或授權resend | 每次查eligibility；accepted/unknown不當0或已送達；不盲重寄 |
| 待發布 | Course/Page/Offer owner→特定draft/version editor→預覽／核准publish | 部署/發布回讀，不混內容與成交snapshot；缺policy/provider停該新發布，返回草稿列表 |
| 待審核 | AI draft/approval或者原內容審核來源→來源/target/影響預覽→具權限人approve/decline | approval binding version/hash，執行前再查權限；decline不做side effect；結果指向domain action audit |
| 待處理訂單／發票 | Order/Invoice/Refund owner→具體紀錄→核對／補處理 | paid與invoice failure分開；保留其它有效grant，結果回讀後再更新工作台，不刪交易 |

卡片在正常有資料、空、loading/error、denied/disabled與retry有同一UI契約；沒有來源時不可造任務/統計。當批fixture至少一筆正常、一筆失敗/未知與一個跨workspace denied，再按原owner流程驗收桌機/390px/返回，不用這張表替代實跑。

Creator AI每次request固定actor/workspace/capability、source ids/versions/field policy、model/workflow版本、目的與retention，查資料只從已授權domain read port。Source provenance顯示可供操作者回讀的record references，不洩漏秘密、未核准PII或其它workspace是否存在。AI生成的summary/draft與已核准action是不同狀態。

Review入口逐項顯示資料來源/不可用來源、內容、audience/exclusion、sender/time、target及affected records/version、確定性驗證結果；人工確認限定這個intent與版本，不是永久delegation。時程/價格/受眾/資源在確認後改變須重新審核；exec前permission/consent/provider/resource再次檢查，舊approval不能復用做別的操作。已完成action重播只回讀結果，不再寫退款/發票/資格或送信。

模型輸出不能emit paid/consent/grant真相，prompt中的要求不取得額外能力；真正副作用經domain command及其核准/冪等/事件規則。範圍超出則拒絕且不吐record counts/values；資料政策不允許則排除並說明限制，不默送模型。新模型/Transcript/recording用途未核准則停，模型故障退回人工確定性入口。

Legacy站內客服 `packages/site-agent/src/tools.ts`仍只有get_my_orders/get_my_course_progress，userId是其資料scope；caller必須從server session取得它，不讓模型或表單自由指定。Creator gateway不以升級這兩工具取得全部workspace資料。買家CodePackage Code Skill只管其專案/target，不能把buyer repo/credential/downstream customers當Creator資料來源，反向也不能把Creator tools的權限帶到買家SaaS。

本節對照 operations fixtures 1/2與AI八個情境，工作台每種任務都有source/owner/下一步/返回，AI的denied、來源限制、draft/approval/audit與buyer隔離有明確條件。7.1/7.5可做文書審查，真實工具/Task路由/角色/狀態/模型/provider/部署仍待runtime SR；本輪未呼叫模型或發生外部動作。

## 8. 文書核對與未執行的驗收

對應 task 6.1～6.4、7.2～7.4、8.7：Campaign 狀態、durable event／Outbox／去重、delivery outcome／安全重試、寄前 eligibility、可重算報表／server scoped export／failure owner，以及六域的 permission/event/retention/rollback 皆列出具體條件。實際 source mapping 仍沿用責任表，runtime SR 必須把 spec scenarios 逐項映射到真實測試／provider／桌機手機／部署證據。

本輪沒有寄信、對外 webhook、申請影音服務、送資料給模型、重算正式報表或匯出私人資料；沒有執行 application tests。新增 unknown-outcome 規則不代表現有 send-engine 已有全部 reconciliation 功能，其 adapter contract 與 migration 要由 SR-09 另驗收。
