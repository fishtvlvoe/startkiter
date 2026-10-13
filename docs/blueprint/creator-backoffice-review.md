# 本機三角色後台：獨立 review 與驗收映射

日期：2026-10-13。對應creator-backoffice-local-acceptance。範圍只限本機示範，不等同正式產品完成。

## Spec → 證據

| Scenario | 證據入口 |
| --- | --- |
| Module selection replaces the submenu | navigation.test.cjs與verify-navigation-demo.sh的106項入口／子功能回讀 |
| Unsupported navigation cannot mutate data | shell.test.cjs未知角色／入口；verify-backoffice-failures.sh未知命令與原保存bytes比較 |
| A role view is missing during migration | shell.test.cjs缺view／例外／非字串回退；獨立legacy-ui與legacy=1入口 |
| User-controlled text is rendered as text | 三份role-view測試literal escaping及真事件／javascript屬性反例；三角色實際DOM canary無img／inline events／執行 |
| Administrator filters users and returns from detail | admin-view.test.cjs與verify-backoffice-ui.sh角色篩選、詳情、返回保留條件 |
| Administrator inspects a module version | admin-view.test.cjs及browser module:course回讀demo-1／未串接 |
| Saved quarterly bundle is restored | model.test.cjs quarter1200／兩指定課程；verify-local-ui.sh四商品保存／reload／編輯回填 |
| Invalid product preserves entered data | model.test.cjs範圍／數量／未知資源／價格；creator-view表單狀態；browser名稱／價格focus及輸入保留 |
| Buyer sees only acquired resources | buyer-view.test.cjs取得快照／後改／原商品移除仍保留；browser取得指定內容／重整／不重複 |
| Independent code or SaaS does not force course access | model與buyer-view.test.cjs code／saas-only；browser取得不包含課程 |
| Creator inspects an unconnected setting | creator-view.test.cjs profile四readonly欄位、PAYUNi未連線、13個future列表提案；導航browser每個子項 |
| User stays in an unsaved editor | verify-backoffice-ui.sh 1440／390 stay保留名稱及focus／discard切換；failures.sh Escape保留 |
| Storage failure cannot masquerade as success | model.test.cjs腐敗JSON／版本2／setItem失敗；failures.sh注入get/set例外、輸入保留且存檔bytes未改 |

只有single-surface像素、字距、圓角不另作單元測試，按TDD test-scope排除；由截圖人工看。其餘上述observable契約都有實測或focused assertion，不把11份總藍圖111個文件例子當test。

## 自審

| 項目 | 結果 |
| --- | --- |
| 重用／DRY | PASS：model與navigation不改，三view純模板，共用helper和事件只由主控處理；重複的原view模板從新殼移除，原整套UI只在legacy回退路徑執行 |
| Tasks真實進度 | PASS：測試RED與GREEN由主控回跑後才記錄；未提交推送交付任務保持待辦，不把worker回報當全專案完成 |
| callers | PASS：report script tags註冊三view；local-ui經S.context/S.render呼叫，缺註冊使用legacy入口，不保留無caller export |
| DoD證據 | PASS（本機範圍）：node focused142PASS；每份browser result.json及真圖分別记录，Git／部署另列未做 |
| Secrets／trust boundary | PASS：本輪view/shell/UI token patterns無匹配、無fetch、view無storage／listener；model權限只是模擬，未讀.env、不接provider；實際DOM canary只把惡意字串當文字 |
| Git | FAIL／待核准交付：未stage／commit／push，原dirty修改保留；整張SR不宣稱完成，不archive |
| 查詢字元規則 | N/A：無series或多來源關聯，課程仍用既有固定ID；搜尋只是本機展示，不重新翻譯匹配欄位 |
| Code-first | PASS：三view實體程式與tests、sharedhandler及legacy入口存在並實跑；保存重整不是build證據；model/navigation baseline SHA未變 |
| 文章防污染 | N/A：無長文故事生成 |

## 失敗紀錄與修正

初次creator／buyer markup測試誤用跨屬性正則，把已轉義input value或data-id內的onerror字樣判成真正handler。修正為解析實際attribute，加入真正onclick/onerror/javascript值必须拒絕的反例；escape實作不改、不刪除注入測試；主控再用實際DOM確認。

第一次保存回歸在直播詳情因「供應商尚未串接」與新文案「供應商未串接」的逐字期待失敗，改成辨識相同未串接語意，不改view假報成功。導航角色检查同樣以未串接語意验证。

手機future table原min-width760落在overflow-hidden殼內，document無水平溢出仍會被裁。主控實測table760／viewport390，改成此殼專用min-width0／fixed table與換行；必須看真圖，不以無overflow當唯一layout證據。

原操作版保留creator-local-legacy-ui.js，與baseline差異只有renderMode辨識標記；新版缺完整註冊或legacy=1會載入原版，runtime render例外提供明確回退連結。storage key/version不改，資料不清空；切換不重算已取得快照。
