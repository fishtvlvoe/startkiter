# 三個角色 worker 的固定介面

對應 creator-backoffice-local-acceptance 的1.3，Fish已核准分工。主控負責shared殼/model/navigation；worker不改其他檔案，不跑Spectra task／Git／部署／瀏覽器，不读.env／apps／packages。

## 寫入與實際 caller

A只写creator-local-admin-view.js及.test.cjs；B只寫creator-local-creator-view.js及.test.cjs；C只寫creator-local-buyer-view.js及.test.cjs。位於docs/blueprint；各自同一worker先測試再實作。

每檔U​​MD型匯出 `{render(context)}`：Node為module.exports；瀏覽器為 `window.CreatorLocalViews.admin|creator|buyer`。namespace存在則保留其他role鍵，不覆寫。render只回HTML字串；不讀storage、DOM、location，不修改context、不掛listener、不fetch。主控 creator-local-ui.js 建context，再經CreatorLocalShell.render核對三view完整性並呼叫選定role；測試直接require角色檔。

## context（由主控深複製凍結）

role: admin／creator／buyer。group／sub：CreatorLocalNavigation.groups/items中的ID。page: overview／products／form／contacts／live／buyer／navigation-preview／detail。

products／acquired: 有效model records的唯讀快照；record `{id,name,type,price,billing,period,status,courses,kit,service}`。price數值，type=course/bundle/code/saas，billing=once/subscription，period=null/month/quarter/year，status=draft/published。

editing: 表單要編輯的record或null（建立空表單）。filters:

- productKind=all/course/bundle/code/saas，productStatus=all/draft/published，productSearch字串。
- contactConsent=all/yes/no，contactSearch字串；liveKind=all/live/evergreen，liveSearch字串。
- userRole=all/creator/buyer，userSearch字串，detailId空或user:ID/module:ID/resource:ID/contact:ID/event:ID；CRM的contact:ID及直播的event:ID由主控依相應fixture解析，返回back保持原篩選。

fixtures:

- resources: `{id,name}`陣列，course-ai=AI自動化入門、course-saas=用AI建立會員服務、course-product=打造第一個線上產品。
- contacts: `{id,name,source,consent,tag}`；events: `{id,name,kind,time,status}`，全部示範。
- users: `{id,name,role,status}`；modules: `{id,name,version,status}`，全部示範，無真實個資／憑證。

helpers: escape(text)、button(label,action,id='',className='row-action')、heading(title,description,actionHTML='')、price(record)、resourceNames(record)。button自動轉義label及屬性，所以傳原文字、不先escape；heading轉義title/description；自組HTML必先escape任何變動字串。actionHTML只能由helper button或已轉義模板產生。

## 主控處理的標記與命令

按鈕用helper產生 `data-local-action`、`data-id`。已核准actions：nav/module/submenu、new/edit、filter（商品狀態all/draft/published；管理員role用user-role:all/creator/buyer）、contact-filter、live-filter、acquire、resource、contact、event、show-detail（user:ID/module:ID）、back。未知命令由主控明確拒絕。不設置inline onClick、不自動call model；表單submit由主控處理。

Creator商品表單必保留id=local-form、local-name、local-price、local-form-error、local-save。names=name/type/price/billing/period/status/courses/kit/service；type/billing/period/status是radio groups，courses多checkbox，kit/service單checkbox。local-period、local-courses、local-kit-label、local-service-label是主控顯示欄位的容器。表單 novalidate，不用native submit外送。新表單name/price空、course預設、once/month、draft、courses空、kit/service false。錯誤區 hidden由主控控制，聚焦／錯誤／保存不可由worker假報。

Creator商品列表保留local-search／local-products；卡片data-product-id，編輯action=edit。CRM保留local-contact-search/local-contacts；直播保留local-live-search/local-events。主控可用view重render列表，输入focus須保留，不能自行綁listener。內容模板可引用共用class，但不改CSS。

Buyer保留local-library；已取得卡片data-acquired-id，公開卡片data-product-id；acquire ID是product ID，resource ID=course ID／kit／service。不以role切換授予全站權限；只讀acquired快照。不顯示draft在可取得清單，重複取得以已取得標示，實際去重由model處理。

Admin保留local-admin-search／local-admin-users；filter用user-role:前綴，詳情show-detail=user:ID/module:ID，返回back。fixture缺少時顯示明確空狀態，不造真實人數／連線成功。模組更新、provider設定不放假的可執行按鈕。

未串接頁面要有結構化版型、位置說明和未串接標示，不能假報保存／付款／寄信／開播。所有可見按鈕有以上本機命令；做不到的動作以說明呈現，不塞裝飾用死按鈕。

## 回報

每個task回files、RED（setup失敗不算）、GREEN、未完成、blocker。寫tests階段不寫正式implementation；主控核對RED後回復同一worker實作。可讀舊UI、shared shell和本contract作reference，不讀完整總藍圖；禁止改非自己兩個檔案。Focused tests命令node --test docs/blueprint/creator-local-ROLE-view.test.cjs，常見輸入markup應轉義、空陣列／filters、凍結context不改。
