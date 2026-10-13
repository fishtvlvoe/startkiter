# 本機後台施工證據

SR：creator-backoffice-local-acceptance。日期：2026-10-13。

## 1.1 接管 baseline

Fish 已核准：舊內容不破壞，主控共用殼＋三個角色 worker。unpark後schema為spec-driven，14項待辦；preflight clean，dormancy fresh，analyze findings=[]。branch feature/public-multi-course-sales-and-code-package，開始時113條dirty entries，全數保留、不stage／reset／覆寫無關修改。

原model＋navigation focused tests實跑30 PASS／0 FAIL。這是baseline，不是新view已通過。

原UI另複製至ignored設計快照legacy-ui.baseline.js；baseline SHA256：

| 檔案 | SHA256 |
| --- | --- |
| creator-local-ui.js | a8c5ec541aa8fb69a085f72314d2c255b706bcebc14efab3e2265d3a95c18d7e |
| creator-local-model.js | 65f4b96273c048429c25e3a5000fbf72cafa915608c5d4269b2502fc57bc13fb |
| creator-local-navigation.js | db14ef9b27a3cfc040230ad79746ea8740337a002cd8c2f654d5c6e5bc29c9a5 |
| source.dc.html | 851da6ceb8c3ea376dae9fedbc29b59d97737d5ecd43217a70ae900fc1371f22 |

寫入責任：主控只有shared殼／model／navigation／整合／文件；A只有admin-view與test，B只有creator-view與test，C只有buyer-view與test。三view是新增檔案，worker不改原商品資料／本機storage，不碰apps／packages／Git／provider。缺完整註冊維持舊殼；rollback回原殼、不清保存資料。

總藍圖11.4／11.5未完成施工責任移交本SR；已完成11.1～11.3保持原描述與證據。舊待辦保留非checkbox移交記錄，不假勾完成，也不再由兩SR同時施工。

## 1.2／1.3 與三worker測試

shared shell初次行為RED：8tests 1PASS／7AssertionFAIL；實作後8PASS，原model/navigation合計38PASS。增加命令白名單後目前shared＋baseline為39PASS，未知命令不能交給provider。瀏覽器已回讀入口renderMode=legacy及原4商品，本輪未切到不完整view。

三個worker實際已派出：A Maxwell、B Herschel、C Ramanujan；寫入範圍各自兩個view/test，不碰shared檔案。

| worker測試階段 | 主控回跑結果 | 接續 |
| --- | --- | --- |
| A 管理員 | 18tests，3PASS／15AssertionRED | 2.2實作中 |
| B 創作者 | 42tests，2PASS／40AssertionRED | 已補contact/event詳情ID契約，2.4實作中 |
| C 買家 | 14tests，1PASS／13AssertionRED | 2.6實作中 |

命令：node --test docs/blueprint/creator-local-ROLE-view.test.cjs。缺module／syntax失敗未算RED；三份測試均可requirestub並產生預期AssertionError。主控只在收到RED並實跑後才派同一worker進下一task。

主控共用處理已實測未保存切頁：dialog=true，原name保留，選stay後name及focus保留，選discard才到settings；仍legacy、不寫本機商品。正式新view保存／三角色整合／1440與390全流程尚待驗證，不能以以上局部結果宣稱交付。

## 三路實作與整合（本段優先於前面中途狀態）

A18PASS、B66PASS、C18PASS；model25＋navigation5＋shell10合計142PASS，主控實跑。三worker工作完成並關閉，不留背景agent。B保留原profile／payment及CRM結構，13個未串接營運頁面以欄位列表／空狀態呈現，所有文字標明非正式資料。

三角色候選初次整合verify-backoffice-ui.sh33PASS（桌面1440／手機390），證據backoffice-integration-pElBf1。主控後續把舊原UI隔離至creator-local-legacy-ui.js，從新殼移除已移轉模板；完整三view才使用新殼，缺註冊或legacy=1載入舊殼；runtime render例外提供回退連結。新model／navigation SHA256仍與baseline完全一致，storage key/version不變。

最後導航verify-navigation-demo.sh106PASS，evidence/navigation-demo-LvmUwl。三角色實際DOM注入canary、儲存寫失敗／損壞JSON注入、原存檔bytes不变、未知命令拒絕與Escape取消離開，verify-backoffice-failures.sh8PASS，evidence/backoffice-failures-SoeiAb。注入只在頁面生命週期，完成即恢復，不把corrupt值寫進localStorage。

保存回歸中途失敗：第一輪直播詳情逐字文案不同，按同義「未串接」修正檢查；第二輪到手機code修正價格後未保存，原記錄kit=true但當次表單kit=false，原因尚不能確認。主控重開同商品，kit=true，錯價→價格提示→修正→保存回列表實測正常；加scroll穩定等待及「修正後保存回列表」check後重跑，結果待寫入。沒有把第二輪當PASS、不調model或view驗證繞過，沒有刪除用戶資料。

## 最終本機行為結果

| 命令／範圍 | 結果 | evidence |
| --- | --- | --- |
| node --test docs/blueprint/creator-local-*.test.cjs | 142 PASS／0 FAIL | model25、navigation5、shell10、admin18、creator66、buyer18 |
| bash docs/blueprint/verify-local-ui.sh | 92 PASS／0 FAIL、exit0；1440／390，四商品保存／修正／重整／指定取得 | local-acceptance-VYrxCt/result.json |
| bash docs/blueprint/verify-navigation-demo.sh | 106 PASS／0 FAIL、exit0；1440／390全部主／子分類與角色示意 | navigation-demo-LvmUwl/result.json |
| bash docs/blueprint/verify-backoffice-ui.sh | 最終33 PASS／0 FAIL、exit0；admin篩選／version／返回、dirty轉場、buyer沒有admin控制、legacy實際載入 | backoffice-integration-X4dWlL/result.json |
| bash docs/blueprint/verify-backoffice-failures.sh | 8 PASS／0 FAIL、exit0；三角色實際DOMcanary、get/set failure、存檔不改、未知命令／Escape | backoffice-failures-SoeiAb/result.json |

這些是不同範圍的assert數，不是259個不同功能；不推算正式系統百分比。142測試與上述真圖由主控回讀，不只worker自報。兩張SR analyze findings=[]、validate valid；6個JS語法、4個bash語法及git diff --check exit0。

主控看過桌面管理員／商品／買家／設定、390商品表單／買家／未保存確認／站點列表真圖。手機站點table回讀288px、content318px、viewport390px，無裁切／水平溢出；不只相信document overflow。原報告localAcceptance=0實際仍顯示原creator-admin-demo，新workspace不存在，original-report-retained.png已保存。

清理：依本Agent三次run的精確名稱移除19個測試商品及18個測試取得快照，保留原4商品及用戶已取得1筆。不清其它storage key、不刪正式資料；测试结果／截圖仍可回查。改版前UI保留legacy=1。最後僅調整新view卡片字級，以免繼承長報告段落大字級；屬單面排版檢查，另以真圖核對，不改model或事件邏輯。

目前本機可验收，13／14的最後Git交付待範圍核准；未stage／commit／push／merge／deploy，不宣稱整張SR完成、不archive。正式課程教材、權限、付款、續扣、寄信、直播、GitHub與SaaS服務仍未串接，配置頁面只是版型提案。
