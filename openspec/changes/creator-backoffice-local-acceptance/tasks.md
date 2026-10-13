<!-- 本輪僅計畫，全部待辦保留未勾。三個worker須先有共用介面、Fish核准再派工。 -->

## 1. 主控固定共用殼與責任

- [x] 1.1 依「一張本機 UI SR 承接交付，總藍圖保留研究與正式功能邊界」記錄逐檔baseline、既有測試及使用者dirty修改；核准後把總藍圖未完成11.4／11.5的本機責任引用本SR，保留已完成歷史；驗證：責任表無雙重owner、實體model/view/test定位與scope diff審查。
- [x] 1.2 [after: 1.1] 先為「The local shell SHALL distinguish roles and contextual navigation」、「Parallel role views SHALL share a single rendering and action contract」寫focused tests：上下選單映射、未知入口不寫資料、view缺漏fallback、轉義字串、caller介面；驗證：creator-local-shell.test.cjs出現預期行為失敗，既有model/navigation baseline不回退。
- [x] 1.3 [after: 1.2] 依「共用殼先固定，三個角色 view 以不重疊檔案平行施工」建立RoleViewContext、共享helper、命令處理與可用舊殼fallback，worker不能另造資料／事件契約；驗證：shell focused tests通過、三個caller介面具體、舊本機入口能走既有操作，派工包明列各自檔案與spec例子。

## 2. 三個 worker 平行處理獨立角色

- [x] 2.1 [after: 1.3] Agent A先為「Administrator previews SHALL provide isolated fixture workflows」寫管理員測試：角色篩選、使用者／模組詳情及返回、未串接標示、輸入轉義；驗證：creator-local-admin-view.test.cjs有預期行為RED，只動A的tests。
- [x] 2.2 [after: 2.1] Agent A實作「Administrator previews SHALL provide isolated fixture workflows」的平台概況、示範使用者／角色、模組／版本與設定狀態；驗證：A focused tests GREEN，view只回傳模板且不讀storage／fetch、不改共用殼，回報檔案與未完成。
- [x] 2.3 [after: 1.3] Agent B先為「Creator workflows SHALL preserve product editing and selected delivery」與「Unconnected workflows SHALL disclose their acceptance boundary」寫創作者模板測試：四類／週期／指定交付／空與錯誤／CRM直播詳情返回／未串接頁面；驗證：creator-local-creator-view.test.cjs有預期RED，expected values取spec例子，不複製model計算。
- [x] 2.4 [after: 2.3] Agent B實作「Creator workflows SHALL preserve product editing and selected delivery」與「Unconnected workflows SHALL disclose their acceptance boundary」的creator view，提取既有商品／CRM／直播模板並補完整分類版型，保存命令交主控；驗證：B focused tests GREEN，無直接儲存／provider副作用，未串接設定不假報成功。
- [x] 2.5 [after: 1.3] Agent C先為「Buyer previews SHALL show acquired snapshots rather than global access」寫買家測試：空庫、published／draft、指定資源、程式包／SaaS獨立入口與返回、快照後改／重複取得的呈現；驗證：creator-local-buyer-view.test.cjs有預期RED，model語意沿用原tests。
- [x] 2.6 [after: 2.5] Agent C實作「Buyer previews SHALL show acquired snapshots rather than global access」的可取得商品與我的內容／資源詳情；驗證：C focused tests GREEN，不擴成全站unlock、不付款／下載／登入外部服務，模板與handler契約符合主控介面。

## 3. 主控整合與本機驗收

- [x] 3.1 [after: 2.2, 2.4, 2.6] 依「保留操作版與版型提案的可見界線，先兼容再切換」集中接線三個views、檢查caller及來源、不重複實作；全部角色可用才切預設入口，刪已移轉的重复模板；驗證：node --test docs/blueprint/creator-local-*.test.cjs全過、缺view的fallback案例通過，storage version不變。
- [x] 3.2 [after: 3.1] 實作並回歸「Shell transitions and storage failures SHALL preserve recoverability」：未保存轉場先留／放棄、錯誤保留輸入、corrupt／new-version不覆寫；商品從任一子類保存後能找到新資料；驗證：先行為RED再GREEN、原model／navigation tests與新增shell案例全過，保存重整與取得快照回讀一致。
- [x] 3.3 [after: 3.2] 對「The local shell SHALL distinguish roles and contextual navigation」及三角色所有受影響入口做ego-browser1440／390集中巡查：主分類、子選單、列表／表單／詳情／返回、空與錯誤、鍵盤focus及無水平溢出；驗證：本機verify-local-ui.sh／verify-navigation-demo.sh與三角色整合腳本exit0，每畫面有實際截圖／回讀，不觸碰其它工作空間或用戶資料。

## 4. 獨立自審與交付

- [x] 4.1 [after: 3.3] 依「Parallel role views SHALL share a single rendering and action contract」及「Unconnected workflows SHALL disclose their acceptance boundary」做主控獨立review：worker寫入範圍、XSS／未知命令／秘密／副作用／重複／dead code／狀態標示／失敗恢復；驗證：self-review各條附證據、diff check、spectra analyze及validate無Critical／Warning，不把worker自報PASS當整體通過。
- [ ] 4.2 [after: 4.1] 交付「一張本機 UI SR 承接交付，總藍圖保留研究與正式功能邊界」的單一本機入口、三分鐘驗收路線、狀態／證據／rollback及本機dashboard；提出只含本SR檔案／hunks的scoped Git plan，核准後commit／push正確功能分支；驗證：入口由ego開啟、證據可讀、遠端commit回讀、無誤stage其他dirty修改；Git未核准或未完成時本項不勾，不發布正式站。

三組依賴鏈：2.1→2.2、2.3→2.4、2.5→2.6在1.3之後可同時執行，各自同一worker，主控集中3.1後續。任務時間以單項30分鐘內為估計目標，超出就以行為切片再拆，不取消測試來符合時間。worker不執行Spectra task start/done、Git、部署或瀏覽器。Fish核准前不派工。
