# Creator UI 畫面與狀態驗收表

日期：2026-10-13
狀態：施工交接規則；不是正式後台驗收證據，也不是全部畫面已完成的宣告。
依據：本 blueprint 的 creator-ui-ux-foundation、creator-platform-foundation 與各領域規格；入口為 startkiter-creator-platform-progress-uiux.html。

## 每頁共用規則

| 狀態 | 畫面顯示 | 可做動作／恢復 |
| --- | --- | --- |
| 載入中 | 保留頁名與查詢條件；不顯示假的 0 筆 | 禁止重複提交；完成後呈現同一條件的結果 |
| 沒資料 | 分開「尚未建立」與「篩選無結果」 | 前者建立第一筆；後者清除篩選；無權限者不顯示建立入口 |
| 讀取失敗 | 說明未取得資料，不當成空結果 | 安全讀取可重試同一查詢並保留篩選；有副作用的 unknown 先對帳／人工處理，不顯盲重送 |
| 表單錯誤 | 欄位旁寫具體原因，頁首摘要連回欄位 | 保留輸入；焦點到第一個錯誤；不得暗存不完整資料 |
| 儲存中／成功 | 儲存中停用重複送出；成功顯示結果 | 成功後回讀已儲存版本；返回原列表與原篩選 |
| 無權限／功能停用 | 403 與未啟用分開；不暴露資料 | 返回可用工作區；失效操作不以隱藏按鈕代替伺服器拒絕 |
| 重大動作確認 | 顯示目標、影響、不可撤回部分 | 確認前無副作用；失敗後回讀真實結果，不能假裝已取消 |

## 按核心任務交接

以下是必備路徑，不表示 Demo 或 runtime 都已實作。

| 畫面／主要任務 | 桌機與 390px 路徑 | 特別失敗與恢復 | 負責 SR |
| --- | --- | --- | --- |
| 工作台：處理待辦 | 任務卡 → 對應紀錄 → 完成任務 → 回工作台；手機順序相同 | 來源不可取得不是 0；重試後只更新該來源 | SR-08；共用 shell 為 SR-01／02 |
| 商品：建立與修改方案 | 分區入口 → 列表／手機紀錄卡 → 編輯 → 預覽 → 儲存 → 回讀 | 未決訂閱／授權條款阻止新方案發布；歷史已售方案保留 | SR-07 一次買斷切片；SR-06 通用方案 |
| 買家：購買及領取 | 公開課程 → 選方案 → 登入返回 → 付款 → 我的課程／程式包 | 付款待確認不直接顯示成功；重播通知不多授權；領取失敗顯示可重試狀態 | SR-07；PAYUNi／github-kit 仍由既有模組管理 |
| 客戶：查找與同意 | 列表／手機卡 → 詳情 → 同意紀錄；匯入先預覽再確認 | 未登入 Contact 不被當成 User；撤回同意不能被匯入恢復 | SR-05 |
| 行銷：草稿到寄送 | 草稿 → 名單快照／排除清單 → 人工確認 → 排程 → 結果 | 缺同意排除；永久失敗停止；重送只針對允許的失敗收件人 | SR-09 |
| 網頁：預覽與發布 | 頁面 → 編輯 → 桌機／手機預覽 → 發布 → 開公開版本 | 草稿不蓋發布頁；保留路由拒絕；回復前一版不抹表單紀錄 | SR-10 |
| 直播：場次到回放 | 活動列表 → Live／Evergreen → 設定 → 報名 → 場次 → 回放／追蹤 | 缺 provider 不生假連結；缺出席資料不算未出席；取消需確認影響 | SR-13 |
| 報表：查詢及匯出 | 指定範圍／日期 → 結果 → 匯出 → 回讀條件 | 缺來源標不可取得；匯出與畫面使用同一 scope | SR-12 |
| AI：檢視與核准 | 指定資料 → 草稿／來源 → 確認動作與目標 → 核准 → 稽核 | 未核准無寄送／退款／授權；權限變動後重新檢查；拒絕跨工作區 | SR-14 |
| 買家更新：預覽及回退 | 專案檢查 → 版本差異 → 備份 → 衝突確認 → 更新 → 回讀 | 客製衝突停下；遷移失敗保留舊服務與資料；Skill 不相容阻止執行 | SR-03／04 |

## 工作區與身份解析契約

Creator context 是日常營運的資料邊界，不是另一套 tenant。Organization 決定工作區 identity，Member 決定 actor 的成員關係，Invitation 只是待接受邀請，CreatorProfile 是該 Organization 的品牌／locale／timezone／currency defaults；profile 不另持會員或付款真相。App registry 決定該 app 的入口／能力宣告，不直接授予付費內容。

| 解析資料 | 權威來源／新舊橋接 | 拒絕與恢復 |
| --- | --- | --- |
| actorUserId | server session，不能信任 URL／表單送來的 userId | 未登入回登入並保留安全返回位置；不洩漏資料 |
| organizationId／membership | 現有 Organization／Member；選擇 active workspace 後驗證成員 | 沒 active membership 顯示 setup／invitation，不默認別人的 org |
| invitation | 尚未接受不等於 Member／capability；接受由既有身份流程處理 | 過期／取消顯示明確原因；不借它開 creator 資料 |
| profile | 一對一 brand/defaults，資料未定義採已核准 defaults：zh-TW 語意、Asia/Taipei、TWD | UI catalog 的實際 locale key 依既有 i18n adapter 映射，不新建第二套字典 |
| appId／appRole／capability | 既有 WorkspaceContext 是 platform 或 app＋角色，與 Organization context 分開橋接；Member 的 owner/admin/instructor/user 不直接當 app role | App 未啟用／actor 未獲能力分 disabled／denied；不把 org owner 猜成所有 app-admin |
| platform-admin | 與 creator membership 分開，跨 workspace 操作需明確平台能力／選定目標／audit | 支援診斷不是持有所有 buyer source license；不隱式改課程資格 |
| effective context | server 同次請求固定 actor/org/app/capabilities/profile version，consumer 使用同一結果 | 切換工作區後清舊資料／cache scope，未保存輸入先確認；不攜帶 W1 rows 到 W2 |

`resolveNavigation` 的輸入是 pathname／appRoles／platformAdmin，未包含 organization；讀到的 app role fallback `app-user` 是導航結果，不能當資料授權證據。SR-01 bridge 要在 server 驗證後才讓 renderer／domain tools 使用能力；直接 API、匯出、AI、provider action 每次仍重查 actor/resource scope。未加入 creator workspace 不妨礙買家依原 course/order/license 使用自己的學習／交付入口；不能強迫所有學員建立 Organization 才能看已買課。

### 白話術語與唯一來源

工作區＝操作這個團隊的資料；功能入口＝app/module 的路徑；成員＝該工作區的 Member；聯絡人＝CRM Contact，不一定能登入；買家＝StartKiter 的購買主體；終端客戶＝買家自己的 SaaS 使用者。這六種不互換，特別是 Contact／Member／Subscriber 不合併為 User。Organization／Member／Invitation 與課程觀看資格的個別契約沿用 canonical，不由 UI 重建。

## Screen contract：目的、操作、輸入與權限

能力名稱是待 runtime SR 對應的語意宣告，不聲稱已有同名 capability key 或新增 route。所有入口正式由同一 registry／resolveNavigation 渲染；內部 route／field names 不當作面向創作者的主要標籤。

| 畫面 | 目的／唯一主要動作 | 必要輸入／輸出與下一步 | 權限邊界／恢復 |
| --- | --- | --- | --- |
| 工作台 | 先處理最重要任務；「查看待辦」 | workspace、日期、來源版本→任務列表→指定紀錄 | 只看被授權來源；某來源失敗只重試該來源，不畫 0 |
| 課程列表／詳情 | 管理內容；「建立課程」或詳情的「編輯內容」 | Course scope／發布狀態→既有 Course Studio→返回原列表條件 | course 管理能力與學員觀看資格分開；無管理能力不開 mutation |
| 方案列表／編輯 | 定義怎麼賣；列表「建立方案」、編輯「儲存草稿」 | 名稱／resource IDs／price／policy version→draft 回讀→預覽或已核准發布 | Offer mutation 不自動帶 payment settings；未定政策禁止新 Offer 發布 |
| 買家課程／程式包 | 使用已購內容；「觀看」或「領取程式包」依該任務 | session＋有效來源→指定 Course／claim 狀態→下一步 | 不因登入開全站；provider/claim 失敗保留狀態與合法重試 |
| Contact 列表／詳情 | 理解客戶與同意；「建立聯絡人」或詳情「編輯資料」 | search/filter／verified link／來源→Contact timeline／consent | read、write、import/export 分能力；撤回／刪除保留應留 audit，不改 User |
| Campaign 編輯／結果 | 準備訊息；「預覽收件人」後明確人審排程 | purpose／channel／sender／revision／受眾→eligible/excluded→schedule／outcome | 單一階段一 CTA；無 sender／eligible=0／未核准不可寄；unknown 先對帳 |
| Page/Funnel 編輯 | 建公開流程；「預覽」後「發布已核准版本」 | page revision／slug／form／Offer CTA→公開版回讀 | 保留路由拒絕；draft 不蓋 published；回復版本不刪 form submissions |
| Webinar 列表／場次 | 建與管理活動；「建立活動」或場次的「管理場次」 | delivery mode／schedule／provider／registration/retention policy→session／replay | 主持、報名、觀眾、付費觀看分權；缺影音配置不顯假 link，取消需確認影響 |
| Analytics／匯出 | 看可追溯結果；「套用條件」後「匯出」 | workspace/filter／時間／版本／欄位政策→結果／file refs | 報表讀取不等於匯出；執行／取檔重查 scope，缺來源標 unavailable |
| Creator AI review | 由人審建議；「檢視草稿」後「核准指定動作」 | sources／scope／model／draft／affected target/version→domain action audit | approval 不等於模型可任意執行；執行前再查權限／資料版本，不跨 buyer app |
| 設定／更新／部署 | 完成核准設定；每階段有明確檢查／預覽／確認 | target instance／tier／versions／safe diff／配置缺失→驗證與rollback | secret 不回顯；付費／部署設定需對應能力，衝突或未核准 target 停止 |

## 共用列表、表單、詳情與動作規則

列表合併 search＋filter＋sort＋page cursor，條件變動重設適當 cursor，workspace／欄位政策加入 query scope。手機以紀錄卡或合適詳細頁保留名稱、價格、狀態、主要動作；不是把資料列縮成看不到欄位的表格。空列表／搜尋零結果不畫誤導 empty table，分別建立第一筆／清條件；恢復後保留原可用輸入。

表單先載入正確 resource/version，建立清空、編輯回填；required 與進階區分，label 對應 control，所有欄位錯誤一次解析成 field error map，顯示摘要並聚焦第一項，保留其它 safe input。server mutation 仍是最終判斷；未保存／未知結果不顯已保存，成功回讀 persisted version，再提供下一步與原列表／篩選返回。並行變更明確 conflict，不默蓋新資料。

詳情頁、預覽與 editor 使用同一 breadcrumb／resource identity；back/cancel 不提交 mutation，dirty form 離開需明確選擇保留／放棄。action menu 收次要操作；封存、取消活動、退款、撤回等先顯示 target、影響、不可撤回部分、owner 與確認，取消對話框沒有副作用。確認後仍重查權限／版本，未知 provider 結果保留人工回讀，而不是直接說成功或取消。

每個 loading/empty/error/success/disabled/denied/retry 與 destructive confirmation 都對應本表共用契約。Demo 的七種 fixture 是設計說明，不是這些 server 流程已實作；目前單欄驗證亦不代表已完成一次顯示全部 invalid fields。

## Keyboard／焦點／手機／復用元件檢查表

| 檢查 | 必須可觀察的結果 | 實際復用來源／限制 |
| --- | --- | --- |
| 導覽與選單 | Tab/Shift+Tab 順序與可見焦點、Enter/Space 操作、Escape 關閉並回觸發者；原生 select 用原生 keyboard 行為 | resolveNavigation／registry；新 UI 不另造 menu authority；Demo 原生 state select 尚未驗收通過 |
| Form／錯誤 | 每控件有 label／error association，摘要可到欄位，錯誤不只靠顏色，修正後 aria-invalid 正確清理 | [form.tsx](../../packages/ui/components/form.tsx)、[input.tsx](../../packages/ui/components/input.tsx)；元件存在不證明 caller 有正確接線 |
| Dialog／確認 | 打開聚焦、focus trap、Escape／cancel 無副作用、關閉回原 trigger；背景不可操作 | [dialog.tsx](../../packages/ui/components/dialog.tsx)，依已裝 primitive，不自造不可鍵盤操作的 div 彈窗 |
| 列表／回饋 | 語意 table/卡片、active filter／可用重試、成功 role=status、需要提醒的 error 適當 announce | [table.tsx](../../packages/ui/components/table.tsx)、[alert.tsx](../../packages/ui/components/alert.tsx)、[skeleton.tsx](../../packages/ui/components/skeleton.tsx)；不可隱藏必要動作 |
| 按鈕／圖示 | button 正確 type／disabled／busy／可讀名稱；decorative SVG aria-hidden、icon-only 有 accessible name | [button.tsx](../../packages/ui/components/button.tsx)、既有標準 SVG／Lucide；不用 Emoji，文字箭頭不是拿 emoji 當 icon |
| 390px／密度 | 同一主要結果、順序、required inputs 與 recovery 可達，documentWidth≤viewport；長表改 task/detail/card，不藏核心操作 | 現行 UI tokens／globals；用 ego-browser 螢幕與實際操作驗證，不用 DOM fixture 或 build 冒充 |
| Handoff／特殊互動 | 每 screen 記 purpose、輸入、CTA、permission、states、desk/mobile、focus、reuse sources、event/error、gate owner | 特殊 interaction 要列新增行為／鍵盤 fallback；未施工標示不可用，不接死按鈕 |

本輪文件對照了 Foundation 8／UI 11 個 spec 情境、實際 Organization／Member／Invitation schema、navigation resolver 與已讀 form/input/dialog/button；不是執行 keyboard／mutation／角色／手機正式站測試。移除平行導航／切回 adapter 仍由原 navigation SR 的 migration／rollback 取得證據；新 context bridge 尚未存在於當前 resolver。具體可執行角色／狀態／跨 viewport acceptance script 仍需配當批 fixtures 審查，因此不把 task 2.8 的完整腳本 gate 自動勾選。

## 每張 UI SR 的退出證據

1. 桌機及 390px 各完成主要路徑，保存 ego-browser 截圖與操作紀錄；手機主要操作不靠橫向捲動。
2. 逐一驗證上方共用狀態；測試 fixture 與正式資料分開，Demo 標示示意資料。
3. Tab 順序合理、焦點可見；對話框開啟聚焦、關閉返回觸發按鈕；表單具 label，錯誤可定位。
4. 每個可見按鈕／連結有結果，未施工入口明確說明不可用；不把死按鈕當成已完成設計。
5. API／資料回讀、付款／寄信／GitHub／影音證據按該 SR 需求另列，不能用畫面截圖代替。

本表的鍵盤、狀態與回讀均為待執行驗收目標。本輪沒有新增正式後台，也沒有執行付款、寄信、GitHub 權限或部署驗收。

目前可執行 [原型腳本](verify-demo-ui.sh) 最新46 assertions／兩種viewport PASS，原型Live三篩選已接並回讀；來源 [UI證據](creator-platform-ui-browser-evidence.md)同列unverified。這只涵蓋已畫的原型subset，不完成正式mutation/角色/所有按鈕；ArrowDown popup、完整keyboard/provider等保留2.8 pending。
