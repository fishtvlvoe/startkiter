# 待決政策與逐題對焦表

日期：2026-10-13
狀態：選項／影響／阻擋已整理；未收到 Fish 的政策選擇，不當成核准紀錄。
用途：把模糊需求變成具體待決資料，不要求 Fish 一次回答整張表；執行需要答案時只問當下第一題。

## 1. 已確認的目標，不再重新問能不能

單課只開指定課程、Bundle只開其指定集合，不因登入看全站。CodePackage能獨立單賣／訂閱，不必綁課；月／季／年是目標週期。買家能用來源程式建立自己的SaaS／付費頁／會員／訂閱，終端客戶與StartKiter課程資格是兩套真相。UI/UX、桌面AI專案Code模式與手冊/版本化Skill、CRM/Live/Evergreen/AI/更新保護都在計畫內；不打掉現有課程與支付模組。

這些是產品目標，不代表所有runtime已可用。現行MONTH/YEAR單課、一次買斷銷售切片、pull交付與少量環境交接為source baseline；完整repo/credential/snapshot/updater/UI行為仍有獨立gate。

## 2. CodePackage delivery判斷，不把權利混成一個開關

| Offer內容／policy | 取得什麼／不取得什麼 | 退款／取消／其它有效來源 |
| --- | --- | --- |
| Course/Bundle＋none | 指定課程集合／有效期間；不因購課建立程式包資格 | 依該Order/Subscription撤回，不影響其它有效grant |
| Course/Bundle＋perpetual | 學習資格與程式包資格分開保存；只有條款已核准才發布 | 依已核准退款/取消/source-use/update/repo條款重算；perpetual不是免退款約束，也不是全站解鎖 |
| Course/Bundle＋active_period | 課與程式包的時限／source-use／更新／服務／grant各自列政策 | 生效截止時間必填；不默認立刻停止所有權利或抹下載副本 |
| Standalone CodePackage＋一次買斷 | 沒有Course/Bundle；獨立license／更新/支援／repo資格 | 不暗授學習資格；其它有效來源保留；未核准app數/商用/期限不公開新方案 |
| Standalone CodePackage＋recurring | 月/季/年選定週期；source-use與active update/service/grant分開 | 未核准取消/到期/new policy不發布；舊legacy已核准快照不被新問題撤掉 |

每位buyer最多一份官方交付repo，同template；多買課不建第二份。買家自有開發repo/寫入權限/版本追蹤的政策是另一個P05問題，未解前不承諾能push回pull repo。撤回外部grant不能抹掉已下載檔案；正式source使用權的效果按已核准條款，不由AI猜。

## 3. 可逐題核准的政策項

| ID／白話問題 | 要選／要填的內容 | 影響／未決時停在哪裡 |
| --- | --- | --- |
| P01 首批服務誰 | 課程講師、顧問/教練、其它服務創作者/代理商；明確首批task priority | 新shell文案/內容定位；先沿用已確認銷售切片，不把候選客群當定案 |
| P02 新訂閱怎麼結束 | 每種Offer的取消生效：立即/已付期間末/明確自訂規則；付款失敗/寬限/到期時間與provider evidence | SR-06/11新recurring不發布；不默填固定天數，現有核准方案保持原contract |
| P03 程式包更新與使用權 | source-use、更新channel/期間、服務存取、repo grant各自perpetual/active_period/none條款；退款/取消效果分開 | SR-04/06受影響新Offer不發布，不能只用「終身」或「訂閱」一詞承諾所有權利 |
| P04 商用/部署/支援數量 | 是否可商用、有限app/workspace數或明確unlimited、移轉/再散布界線、hosting支援範圍 | 新license publication gate；不默認可公開原碼、無限app或免費managed uptime |
| P05 Repo怎麼保存開發 | 官方交付repo保持pull＋buyer自有可寫repo的映射，或核准調整官方repo權限；需source/canonical delta、版本讀取、退款/移轉policy | SR-03/04/07特定移轉；不自動升/降既有grant、不把官方一repo配額套成禁止buyer自有開發 |
| P06 第一版網頁編輯深度 | 最小公開頁/表單/CTA/funnel，或完整builder的範圍、內容模型/驗收/成本 | SR-10先做已核准最小slice；列更深builder為後續，不暗刪目標或當交易前置 |
| P07 發票與新收款模式 | 適用Offer、provider、invoice失敗時交付效果、每期charge/退款/折讓與需要modified capability | SR-11；不換PAYUNi或原MVP invoice範圍，不把paid與invoice成功混為一談 |
| P08 SMS | 首個provider、允許purpose/市場、速率/費用上限、退訂/送達/unknown處理 | 新SMS不啟用；先定adapter與Consent，未取得真正能力不假造delivered |
| P09 分析儲存與個資保存 | store/read model版本、各data category目的/角色/保存/匿名化/hold、export policy | SR-12新用途；舊合法source保原條款，缺來源/保存policy顯未知，不當0 |
| P10 直播服務 | provider、容量/費用/recording、外部房間或非影音替代是否納入、可啟用方案 | SR-13新影音不公開；外部link若納入仍有驗權與provider責任，不說是自建直播stack |
| P11 錄影/回放/逐字稿 | controller/processor/store、recording同意、retention/expiry/deletion/hold、可給AI的欄位 | 新錄製/Transcript AI/export停；不拿付費資格當錄影與模型同意 |
| P12 Creator AI | provider/model、每workflow的source字段/目的/保存、審核範圍與例外（如有） | SR-14新模型/工具停；未核准外部副作用一律人審，不能讓模型判付款/同意/授權 |
| P13 未觀察第三方頁面 | 先補哪個research evidence，哪些只保留pending；資料/副作用操作要另外核准 | 不從導覽猜API/backend；不填假A級，也不因research沒做擋住無關已驗收slice |
| P14 支援/維運/退版政策 | managed/self-hosted/advanced責任、supported版本與deprecation/相容期、故障通知/SLA（若提供） | SR-03/04/15；不承諾永遠無限相容，不把readme/Skill當代管服務 |
| P15 原型流程圖風格 | 沿用目前HTML米白/赤陶或diagram-design灰白/橘；只影響圖解樣式 | 本次新依賴圖暫未繪，問過但尚無選擇；不因自動goal continuation就當答覆 |

這是決策索引，不是一次提出十五題。技術比較、provider sandbox與費用調研由後續agent在該SR範圍先做；選項是需核准的政策形狀，不宣稱列出的供應商或能力已存在。

## 4. 決策紀錄要完整，不用聊天一句話偷改歷史

每題紀錄decisionId/status（unresolved/proposed/approved/superseded）、適用Product/Offer/module/tier/workspace、policyVersion、生效範圍/時間、選值/條款、approvedBy/evidence、affected SR/遷移/回歸/回滾與哪些legacy保持原規則。只有有明確選值及核准證據才approved；預選radio、沉默、重新開機、goal自動繼續不算答覆。

商業policy已核准仍需technical/provider/UI/migration/genuine payment/email/repo/deploy evidence；文件核准不是上線。改政策先對照受影響範圍與既有快照，若需要替代完成過的行為，新增補償/遷移task，不重寫歷史[x]紀錄。保持source license、官方repo grant、買家自有app服務與終端客戶合約的四個邊界。

## 5. 本輪文書可核對，不批准未知值

本表與commerce/buyer/update/live/AI/Taiwan規格、handoff決策阻擋、domain/events矩陣合讀；3.4的standalone/attached/none/perpetual/active_period/refund/other-source案例，與3.16/10.3的一題一題決策阻擋已可文書核對。P05 repo/canonical、credential mapping、checkout snapshot、updater、UI原生操作/腳本與P15圖解仍需後續證據，不能從本表跳過。
