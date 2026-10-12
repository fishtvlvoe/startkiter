# Creator 平台開發交接

日期：2026-10-13
對應：`creator-operations-platform-blueprint`
狀態：交接草稿；需要與十一份 specs 逐項核對，不能據此宣稱功能或總藍圖已全部驗收。

## 下一張工作

先收尾正在修改的 `public-multi-course-sales-and-code-package`。它交付「公開課程 → 選一次買斷方案 → 登入 → PAYUNi → 精確課程資格 → LINE／Email → 同一 CodePackage」。不需要等完整 CRM、Funnel 或直播；必須先完成歷史訂單映射與通用商品邊界對照。

總藍圖中的 SR-01～15 是能力索引。銷售切片已在工作樹施工，後續不能用序號要求從零重建。`creator-offer-commerce` 負責更通用的商品／訂閱／交付政策，重用切片產生的 CourseOffer、訂單快照及外部交付結果。

### 銷售切片進入與退出條件

| 階段 | 條件 |
| --- | --- |
| 進入 | proposal／design／spec／tasks 一致；確認目前實作差異、legacy 指定課程、隔離資料庫、Bundle 舊路徑責任；一次買斷 TWD 的範圍不混入新訂閱 |
| 退出 | 公開目錄不顯示草稿；登入回來保留所選 Offer；價格由伺服器決定；付款通知重播不重複授權；買家只看已買課程；多買不建立第二個 repo；退款保留其他有效訂單資格 |
| 外部證據 | 該 SR 的桌機／390px、PAYUNi sandbox、真實 Email、GitHub pull 權限、部署回讀與回滾各自記錄；單元測試不能替代 |
| 回滾 | 關閉新入口並保留歷史 Order／Entitlement；additive migration 不以刪除交易或買家倉庫恢復舊版；外部撤銷按現行退款契約 |
| 責任 | Course／Lesson 仍由課程模組管理；CourseOffer 管銷售條件；付款模組管訂單狀態；Entitlement 管觀看；github-kit 管外部交付 |

## 商品矩陣

| 販售內容 | 收費方式 | 交付邊界 | 政策狀態 |
| --- | --- | --- | --- |
| 單堂課 | 一次買斷 | 一個指定 courseId；不取得其他課程 | 目前切片 |
| Bundle | 一次買斷 | 付款當下指定課程集合的快照 | 沿用既有 Bundle，補相容性驗收 |
| 獨立 CodePackage | 一次買斷或月／季／年 | 程式包授權，不必綁課；平台目前單一 template、每人最多一個 repo | 通用 commerce 後續規格；價格、授權數量、更新期限需拍板 |
| 單課／Bundle 訂閱 | 月／季／年 | 指定內容有效期間；取消／付款失敗後的期限須明訂 | 週期能力保留；新 Offer 的取消政策未定案 |
| 課程附程式包 | Offer 設定 | 課程資格與 repo／更新資格分開保存 | 目前切片提供同一程式包；未來可用 none／perpetual／active_period |

程式包原始碼已交付後不能靠撤銷 GitHub 權限抹除買家已下載副本。`active_period` 要明確區分服務存取、更新頻道、GitHub grant 和已交付原始碼的授權條款；條款未決定前不得承諾可收回已下載程式。

## 買家從程式包到自己的 SaaS

| 流程 | 我們交付的東西 | 買家／AI 的工作 | 驗收結果 |
| --- | --- | --- | --- |
| 取得 | Repo、版本、授權、更新／支援說明 | 開啟有資格的私人 repo | 看得到正確版本與權限 |
| 開啟專案 | README、AGENTS.md／CLAUDE.md、相容版本的 Skill | 桌面 AI 的專案／Code 模式讀取資料夾，先做環境檢查 | 列出缺少設定與下一步；一般聊天模式不承諾能改檔 |
| 設定與啟動 | 安裝、設定清單、故障處理說明 | AI 執行必要命令；買家提供其服務帳號，憑證留在其環境 | 本機登入與受保護頁面正常，缺憑證有清楚提示 |
| 建立服務 | 模組註冊／權限／付費入口慣例 | 買家自己的登入、客戶、收費和訂閱 | 終端客戶的付費資格由買家服務判斷，不用 StartKiter 課程資格 |
| 部署 | self-hosted／managed／advanced 指引 | 依 hosting tier 設主機、網域與第三方服務 | HTTPS、登入、付款回調和維運責任各有證據 |
| 更新 | 版本差異、相容矩陣、遷移、Skill 更新 | 先備份／預覽；有客製衝突就停在衝突列表 | 保留客製、資料和既有服務；可退回先前版本 |

這是交付契約；操作手冊與 Skill 的本機實跑是 SR-04 的退出條件，不能因矩陣寫好就說買家安裝已可用。

## 所有 SR 的共用交接規則

每張施工 SR 建立自己的 proposal／design／spec／tasks；使用既有 AppRegistrationManifest、權限、UI 和 provider adapter。資料只用 migration 演進；先增加新契約，舊路徑並存，分批回讀，再移除舊形狀。

| 必填欄位 | 內容 |
| --- | --- |
| 輸入 | 既有 spec、實際 source、被依賴 SR、待決政策 |
| 輸出 | 使用者能完成的一條流程與資料責任 |
| 修改邊界 | 哪個模組 owns 哪個 route／table／事件，哪些沿用 |
| 驗收 | 邏輯、資料、API、桌機／手機、外部服務、部署分別列證據 |
| 回滾 | 關閉入口／flag、保留資料／稽核、客製衝突處理、責任人 |

## SR-01～04：共用地基與買家交付

### SR-01 creator-platform-foundation

- 輸入／前置：現行 workspace/navigation 與 App registry；先確認 Organization／Member／Invitation 的現行 spec。
- 交付／owner：平台解析 actor、workspace、capability，給所有模組唯一權限與入口；沿用 packages/platform，不另建租戶真相。
- 驗收：有權限者只見允許入口；未加入工作區看到設定／邀請；直接輸入禁止 route 不洩漏資料。
- 回滾：保留舊導航 adapter，用 flag 切回；workspace 資料保留。

### SR-02 creator-ui-ux-foundation

- 輸入／前置：SR-01 的權限；HTML Demo 與 screen contract 作設計參考。
- 交付／owner：共用 page/list/form/state。頂端分區、單層選單是提案；正式接線仍走同一 resolveNavigation，不能讓 HTML 選單成新真相。
- 驗收：桌機列表／編輯／返回；390px 用卡片呈現價格、狀態與操作；鍵盤焦點、空資料、錯誤、無權限和重試有明確路徑。
- 回滾：共用 shell 可切回舊版，不能刪原 route；視覺 Demo 不算 runtime 驗收。

### SR-03 platform-extension-and-update-contract

- 輸入／前置：SR-01、02 與既有 app-extension-contract、buyer-repo-upstream-sync。
- 交付／owner：註冊／版本相容、事件／API 版本、官方 core/module/custom 邊界與更新預覽。
- 驗收：不合法模組拒絕註冊；版本不符解釋原因；客製衝突停下；失敗更新保留舊服務與資料。
- 回滾：停用新增模組／release channel，保留舊 consumer；不得整包覆蓋買家 repo。

### SR-04 buyer-saas-extension-and-deployment

- 輸入／前置：SR-03、CodePackage 版本、現有 hosting tiers／credential handoff。
- 交付／owner：買家手冊、版本化 Skill、桌面 AI 安裝／排障／部署／更新流程；買家自己 owns 終端客戶與收款。
- 決策阻擋：授權 app 數、更新期限、商用與支援 tier 需寫清楚再公開販售。
- 驗收：拿一份乾淨買家專案，照手冊完成本機、付費頁面與指定 tier 部署；Skill 版本不符時停下並提示；秘密不進 repo／log。
- 回滾：可退回 template／Skill 版本；買家客製和資料保留。

## SR-05～08：客戶與交易

### SR-05 creator-crm-and-audience

- 輸入／前置：SR-01、02、03；現有 User、名單與 consent source mapping。
- 交付／owner：Contact 與 User 分開；Tag、Segment、同意／退訂、匯入預覽與匯出，由 CRM owns。
- 驗收：未登入聯絡人可存在；註冊後正確關聯；同一規則可重算分群；退訂不被匯入恢復；跨工作區不可讀／匯出。
- 回滾：停用新增匯入與行銷 consumer；保留已撤回同意與來源紀錄。

### SR-06 creator-offer-commerce

- 輸入／前置：SR-07 的已驗收一次買斷切片及資料快照；SR-03；需要 CRM linkage 時引用 SR-05。
- 交付／owner：將 CourseOffer 擴展到單課／Bundle／獨立 CodePackage 和新訂閱政策；沿用付款／內容／GitHub 模組。
- 決策阻擋：新訂閱的到期／取消、程式包 license／更新政策、未來價格；保留既有 recurring 能力，先確認現行 subscription-billing，不能重建第二套。
- 驗收：歷史交易不受改價／改 Bundle 污染；不同 Offer 只授予其範圍；重播付款與退款不重複交付；程式包單賣不暗授課程。
- 回滾：保留已售 Offer、歷史快照與既有訂閱；新 Offer 先停止銷售，不删除交易。

### SR-07 public-multi-course-sales-and-code-package

- 輸入／前置：本交接文件「下一張工作」；此 SR 已有程式修改，先按實際 diff 核對。
- 交付／owner：公開銷售、一次買斷 CourseOffer、精確權限、課程通知、唯一 CodePackage；不是新 CRM／訂閱 implementation。
- 驗收／回滾：依開頭進入／退出矩陣與其既有 tasks；不重做 buyer-bundle-checkout-entry。

### SR-08 creator-operations-home

- 輸入／前置：SR-01／02、付款／課程／寄信的實際來源；待 CRM 存在再接名單。
- 交付／owner：可返回任務的待辦、失敗、待發布、審核與最近動態；報表來源不造假。
- 驗收：每個可點卡片到對應任務；缺資料顯示不可取得而非 0；日期範圍與來源一致；權限不足不暴露紀錄。
- 回滾：停用新讀模型與卡片，原任務入口仍可使用。

## SR-09～12：行銷與營運

### SR-09 creator-marketing-automation

- 輸入／前置：SR-05 Consent、SR-03 event contract、既有 newsletter-automation-integration／mail provider。
- 交付／owner：Campaign、recipient snapshot、Outbox、Enrollment、Delivery、Retry、Unsubscribe；先完成一條歡迎流程。
- 驗收：事件重播不重複寄送；退訂後排程再檢查；暫時失敗可重試、永久失敗停止；worker 狀態與 provider reference 可回讀。
- 回滾：停止新 enrollment／寄送排程，保留執行紀錄；避免已寄通知被回放再次送出。

### SR-10 creator-site-and-funnels

- 輸入／前置：現有 Page/CMS、SR-05 表單名單、SR-06 或 SR-07 Offer CTA、SR-02 UI。
- 交付／owner：先銷售頁 → 表單／checkout → thank-you，不把完整視覺 builder 當前置。
- 決策阻擋：完整 builder 是後續範圍選擇，需單獨定義。
- 驗收：草稿不取代發布頁；表單記 consent／來源；CMS 不覆蓋保留 route；手機 CTA 導到正確 Offer。
- 回滾：回復先前 published revision，保留訂單與表單提交。

### SR-11 taiwan-billing-and-compliance

- 輸入／前置：現有 PAYUNi／invoice／recurring adapters 與 SR-06 的正式新政策。
- 交付／owner：TWD、Asia/Taipei、發票／訂閱／LINE 用途映射；先重用現有 provider。
- 決策阻擋：發票／SMS 新供應商、適用範圍和條款；不因總藍圖逕換 provider。
- 驗收：server 金額、通知簽章／重播、退款、發票狀態和權限可回讀；LINE Login、邀請與訊息用途分開。
- 回滾：關閉新增收款模式，保留既有訂單與發票稽核；退款由正式流程處理。

### SR-12 creator-analytics-and-export

- 輸入／前置：SR-03 versioned events，SR-05／06／09 的來源與資料權限。
- 交付／owner：有來源／日期／去重的營收、轉換、名單與寄送報表；匯出使用同一 filter scope。
- 驗收：同一來源可重算；缺來源不畫成 0；重播不多算；匯出與畫面篩選一致，跨工作區拒絕。
- 回滾：停用新報表 consumer／export，保留原始事件與稽核。

## SR-13～15：直播、AI 與發布

### SR-13 creator-live-and-webinar

- 輸入／前置：SR-03／05／06／09／12 的權限、事件、交易與報名關係；WebinarJam 只引用已觀察流程。
- 交付／owner：LiveEvent／EvergreenWebinar、排程與影音 provider 分開；報名 → 提醒 → 出席 → 回放 → follow-up。
- 決策阻擋：影音 provider、容量／錄影費用、回放保留期限、逐字稿與同意；未取得 provider 不產生假 join link。
- 驗收：重複 provider event 不多算出席；缺出席資料不是 no-show；clone 不複製報名／秘密／session；archive 保留交易；export 依權限與篩選。
- 回滾：關閉新報名／發布，通知受影響場次；保留付款、出席及已授權回放資料。

### SR-14 creator-ai-assistance

- 輸入／前置：SR-03 tool permission／audit、各資料模組的來源；買家開發 Skill 與營運 AI 隔離。
- 交付／owner：來源可追溯的摘要、草稿與建議；寄送／發布／退款／調價／授權須人工核准並走 domain tool。
- 決策阻擋：模型／provider、可送出的欄位、保存期限；沒有授權的資料不得送出。
- 驗收：跨工作區拒絕；未核准無副作用；模型輸出不能決定付款／分眾／授權真相；來源與人審紀錄可回讀。
- 回滾：停用模型工具／provider，保留 deterministic 操作入口及已核准動作的稽核。

### SR-15 mobile-accessibility-and-rollout

- 輸入／前置：當批功能各自的證據，SR-01／02 共用契約；手機／無障礙每張 SR 都先處理，不等最後才做。
- 交付／owner：正式發布批次、角色驗收、回滾演練和已知限制。
- 驗收：桌機／390px 完整流程、鍵盤／焦點、資料／API 回讀、必要外部付款／寄信／GitHub／影音證據；Spectra 與提交／推送分開記錄。
- 回滾：部署版與 flag 回退，保留後續生成的交易和資料，逐模組恢復。

## 決策何時需要 Fish

| 尚未決定 | 阻擋哪張 | 拍板前可做 |
| --- | --- | --- |
| 第一個創作者族群 | 新 UI／內容定位 | 沿用已確認課程銷售切片，列不同角色任務 |
| Bundle／CodePackage 新訂閱取消與更新期限 | SR-06、04 | 保留周期欄位與 policy 模型；不發布新方案 |
| CodePackage 商用 app 數／支援 tier | SR-04 | 寫授權矩陣與安裝流程，不承諾授權數 |
| Funnel builder 深度 | SR-10 | 完成最小頁面／表單／CTA 對照 |
| SMS／發票／分析新 provider | SR-11、12 | 現有實作與 adapter 對照，不新增憑證 |
| 未操作的 Systeme 頁面 | 各對應 research | inventory 標未觀察；不用產品入口猜行為 |
| 直播 provider／錄影保留／外部直播替代 | SR-13 | 場次／報名／事件／權限規格與故障路徑 |
| AI provider／來源欄位／保留／核准例外 | SR-14 | 工具授權與人工核准流程；無例外默認需核准 |

## 更新後不做 A 壞 B 的具體證據

每個新模組必須列出受影響的 Course、Order、Entitlement、Newsletter、GitHub grant 與 buyer custom，逐項標「沿用／擴充／不影響」並說明來源。新增 schema／事件先讓舊 consumer 正常，資料批次遷移後回讀；新版有衝突先停下。只在切換與回滾證據都齊全時移除舊契約。
