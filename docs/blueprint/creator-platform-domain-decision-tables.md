# 商品授權與 CRM 判斷表

日期：2026-10-13
性質：後續施工的契約／文書案例，不是已執行的 application tests，也不核准未決商業條款。
來源：[commerce spec](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-content-and-commerce/spec.md)、[CRM spec](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-crm-and-audience/spec.md)、[中央領域模型](startkiter-creator-platform.md)、[source／owner](creator-platform-source-ownership-map.md)。

## 1. 同一份內容，不同商品與資格

| 層 | 唯一責任 | 不可冒充的東西 |
| --- | --- | --- |
| ContentResource／Course | 內容本身、章節／教材／媒體，可被多個 Product／Offer 重用 | 價格、付款結果與全站 unlock |
| Product／Bundle | 可販售的內容聚合；Bundle 引用指定 Course | 歷史成交時包含哪些內容 |
| Offer | server price／currency、付款模式、交付映射、政策版本 | Course 的第二份副本或已支付訂單 |
| Order／Subscription | 實際付款／週期狀態與成交／協議快照 | 讀現在 catalog 就能改過去的資格 |
| Entitlement | 主體、資源、有效期間、交易／邀請等來源、撤回／保留結果 | 登入帳號或 workspace membership 的全部權限 |
| CodePackage resource／license | 唯一程式範本；源碼使用、更新、服務、商用、支援分開 | 課程教材與 GitHub 權限 |
| GitHub grant | 外部 repo 交付結果，每位買家一份交付 repo | 已下載源碼被遠端抹除、買家自有 SaaS 客戶權限 |

伺服器建立 checkout Order／Subscription agreement 時固定 price、currency、resource IDs、policyVersion、CodePackage delivery；支付通知只核對該快照。文案或 Bundle 修改不回寫快照。缺少歷史證據的 backfill 要停在該資料批次要求明確 mapping，不拿目前 Bundle 成員猜舊訂單；其它已驗收流程不因此全部失效。

## 2. 商品交付與退款／取消重算

以下 A／B／C 是不同課程、T 是唯一程式範本、O1／O2 是獨立訂單。`有效資格` 只從已驗證且仍有效的來源取得，不從 catalog 或登入狀態推論。

| 文書案例 | 支付／狀態與配置 | 應有結果 | 禁止結果 |
| --- | --- | --- | --- |
| E1 單課 | O1 paid；snapshot={A}，kit=none | 只授予 A；B／C 不開放 | 登入後全站課程都可看 |
| E2 Bundle | O1 paid；snapshot={A,B}；其後 catalog 改成 {B,C} | O1 的權限仍是 A／B | 把 A 換成 C 或猜舊包含內容 |
| E3 付款重播 | 同 O1 provider event 收到兩次 | 一筆交易結果、A／B 各一次 grant；外部交付去重 | 重複寄不可重複通知或再建 repo |
| E4 獨立程式包 | O1 paid；resources={T}，沒有 Course | 只建立所核准的 CodePackage 資格 | 要求先綁課、暗授 A／B |
| E5 課程附程式包 | O1 paid；resources={A,T}，kit=perpetual 且政策已核准 | A 與 T 分開記錄但引用 O1；只建立一份交付 repo | 把 repo grant 當 course access |
| E6 課程訂閱不含程式包 | S1 有效；{A}，kit=none | A 的有效期間依核准 policy，沒有 repo claim 資格 | 只因有訂閱就可領 T |
| E7 程式包 active_period | S1 有效且 active-period 更新／grant／使用條款已核准 | 各權利按 S1 policy 保存；生效截止後重算對應資格 | 用 grant 撤銷假裝抹掉已下載副本，或自動刪買家 SaaS 資料 |
| E8 退款但仍有其它訂單 | O1 refunded；O2 paid，仍授 A／T | O1 grant 結束；O2 的 A／T 保留；不新增第二 repo | 一筆退款撤掉其它有效來源 |
| E9 其它合法來源 | O1 refunded；仍有有效課程邀請／核准 org-scoped purchase／其它適用來源 | 該來源允許的指定課程仍可看；T 須其自身合法資格 | 用課程邀請或管理員角色自動授程式包 license |
| E10 取消尚未生效 | 取消已記錄，但 policy 的 accessEffectiveEnd 尚未到 | 依已核准條款保留／終止對應期間；未決政策不發布新 Offer | 自行假設立刻失效、永遠可用或固定寬限日數 |
| E11 provider／證據缺失 | 尚未驗證付款、簽章不合或 provider 不可用 | 不產生 paid grant；可恢復／人工處理且保留 reference | 把 UI 成功、發票成功或模型建議當付款證據 |
| E12 新政策未決 | 新 recurring／standalone Offer 缺取消、更新、source license 或 repo policy | 阻止該新 Offer 發布；歷史／已核准 legacy Offer 保持原快照 | 暗改全部歷史資格或替買家改 GitHub write／pull |

源碼使用權是否因退款終止、訂閱到期後的更新／GitHub grant、授權 app 數及支援期間，仍是商業政策 gate。`perpetual` 不表示免受既有退款條款限制；`active_period` 也不表示能收回檔案。這份判斷表沒有替 Fish 決定條款。付款、發票、各資源授權、行銷同意、買家下游 SaaS 是五個分開的生命週期。

## 3. Contact／User 連結、合併與刪除

| 輸入／事件 | 必須做 | 不可做 |
| --- | --- | --- |
| 匿名訪客填有效格式的 email／phone | 在已解析 workspace 記來源與候選 identity，不要求先建立 User | 把「格式有效」當作「已驗證本人」，暗連到 User |
| 新 User 驗證身份 | 只有 verified evidence、workspace 邊界及核准 link rule 都吻合才關聯，保留 ContactEvent 歷史 | 僅憑 CSV、姓名、未驗證 email 相同就取得帳號／購課權限 |
| 同 workspace 重複候選 | 預覽 duplicate、verified identity、來源差異與衝突，操作人確認後才 merge | 跨 workspace 合併、覆蓋不同 verified owners，或 merge 恢復 consent |
| 刪除 Contact | 按已核准保留／匿名化規則處理關係資料，保留需留存的 transaction/audit evidence | 刪除或停用 User；刪買家 Order 或其它 workspace 的資料 |
| 重複提交／匯入重播 | 用 import/job/row/source identity 做去重與稽核 | 每次重播加一次 consent 或重寄歡迎流程 |

Contact 的合併／刪除與 User 的帳號生命週期是不同操作；會員／邀請／買家自己的 SaaS 資料也不能因此被級聯清除。已撤回的目的／通道保留抑制；只有該目的的新有效重新授權才能改變同意狀態，還須通過送達條件。

## 4. 分眾輸入、運算、時間與快照

目標規則只接受已版本化 schema、已解析 workspace、明確的 AND／OR 組合、型別正確的欄位／operator／value。下表是 CRM 擴充的契約，不是現有 Newsletter 所有欄位已支援的宣告。

| 欄位群 | 允許比較的契約 | 缺值／關聯／權限 |
| --- | --- | --- |
| Contact 狀態與屬性 | 固定 allowlist，eq／in／exists；字串搜尋只能用已核准字串欄位 | 未知欄位／operator／型別拒絕，不保存部分規則；缺值不當成已同意 |
| Tag | 以 workspace-scoped tag ID 做 has／not-has；名稱比對先產生版本化 canonical key | 保留 raw label；寫入與查詢同一 normalization version，異體字／簡繁／全半形對照一致；AI 不翻譯一邊造成匹配失敗 |
| Purchase／Course access | 用同一 qualifying transaction/resource group；paid、courseId、scope 不能來自不同訂單拼湊 | 「已買 A」與「paid」須同筆有效來源；不能用 paid B＋unpaid A 算已付費 A |
| Consent／Suppression | 明確 purpose、channel、workspace 與有效 evidence；送達阻擋獨立 | email 同意不是 SMS／LINE 同意；global legacy grant 不暗擴到新 workspace |
| Event／日期 | eventType allowlist、UTC referenceTime、顯式起迄／時區；同一查詢共用同一時鐘 | 缺出席資料不是 no-show；缺 source 顯示不可取得，不當 0 |

編輯或發布 Segment 先驗證整條規則。無效 JSON 不退回「全部受眾」；現行 `packages/newsletter/lib/audience.ts` 的 parseSegmentJson 與 User 欄位格式只作 migration source，不直接當成新 CRM 的 strict validator。Email key 沿用既有 trim/lowercase 的版本化映射；不擅自移除地址的點、別名或猜測電話國碼。未可可靠正規化的 identity 留 rejected／review，不用它合併帳號。

Segment query 保存 workspace、ruleVersion、referenceTime、來源版本及 matched IDs／快照 reference；相同輸入應重算相同結果。更新資料後的動態 Segment 可改變，但 Campaign audience snapshot 不被偷偷改寫；實際寄送前仍再查即時 Consent／Suppression。AI 可說明規則與排除原因，不決定受眾或修改條件。

## 5. 同意、送達與寄送目的

| 狀態 | Marketing 結果 | 交易通知／其它目的 |
| --- | --- | --- |
| 當前 workspace／channel／purpose 有有效 grant，且地址可送達 | 可以進核准流程，寄前重查 | 依自己的目的規則，不借用這個 grant |
| 目的 revoked／缺同意 | 抑制該目的；排程、automation、手動與 API 同一 gate | Marketing revoke 不取消必要交易通知；仍檢查送達與適用政策 |
| hard bounce／invalid address／complaint | 抑制；勾回 consent 不清除送達阻擋 | 同樣不可對不可送達地址盲目重試；保留人工處理入口 |
| 退款／訂閱取消 | 依 campaign/enrollment 的業務條件重算，不自動製造 consent.revoked 或 granted | 按已核准交易目的發必要通知，不重寄已完成通知 |
| CSV／merge／事件重播 | 不製造 grant，不清除 revoke／suppression | 稽核及冪等；不把註冊／LINE Login 當行銷同意 |
| legacy User flags | 保留原流程核准的規則；其 revoke／invalid／bounce 阻擋在 migration 中不能丟失 | 正向 global flag 不是新 workspace／purpose／channel 的同意證據 |

移除送達阻擋須有獨立、可稽核的地址修正／重新驗證／provider evidence 與授權操作，不由 AI 或一般 consent grant 自動執行；具體 provider reset 政策留對應 SR 決策，不在本表發明已存在的功能。

## 6. 匯入／匯出、失敗與恢復

| 階段 | 必須留下的資料／操作 | 成功與失敗邊界 |
| --- | --- | --- |
| 匯入預覽 | actor、workspace、檔案 hash、mappingVersion、規則版本、accepted／duplicate／rejected 與 row errors | 不寫正式 Contact／Consent；preview 不是 commit |
| 確認提交 | 操作人確認 accepted rows 與 duplicate policy；重新查權限／workspace／preview 版本 | 調整 mapping 或來源後原 preview 失效；invalid rows 不偷偷部分寫入 |
| 批次寫入 | job/row 去重鍵、checkpoint、實際寫入 IDs、失敗原因／retry | 每批 transaction 可回讀；重試同一行不重複資料／同意／事件；資料已變更要重新 review |
| 匯出 | server 解析 scope、Segment rule、referenceTime、准許欄位、來源版本、actor、job／file hash | 不接受客戶端傳入 orders／contact IDs 就繞過授權；執行與取檔再查權限，不跨 workspace |
| 回滾／清理 | 保留 import source、audit、revoke 與相關交易 reference；只撤回本 job 可恢復的新增部分 | 不抹既有 Contact history、User、Order 或有效權利；未完成批次可暫停恢復 |

文書案例 I1：W1 原有 learner@example.test；匯入 new@example.test、learner@example.test、invalid-email，預覽為 1 accepted／1 duplicate／1 rejected，預覽前後正式資料筆數不變。I2：操作者只可匯出 W1 email/tag，結果排除 W2/C9 與未核准欄位，記錄 actor／Segment／時間／file hash。這是應測條件，不是已執行的 CSV 或匯出驗收。

## 7. 本表與待辦的核對方式

對應 task 2.2、3.1、3.3、5.1～5.3 的文件契約核對：身份生命週期、交易快照與 union grants、分眾輸入／operators／clock／snapshot／audit、目的與 suppression、匯入／匯出／恢復皆有可觀察條件；對應 specs 的 8 個 CRM／14 個 commerce 情境仍須在各 runtime SR 映射成真實測試。其它 license 條款、provider、買家 repo 移轉及 UI／Git gates 不因本表完成自動通過。
