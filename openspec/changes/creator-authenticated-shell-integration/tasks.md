## 1. 前置與回歸

- [ ] 1.1 依「renderer只吃一份NavigationModel，保留server角色與manifest真相」與「The authenticated shell SHALL consume one approved navigation model」確認M1畫面核准、canonical導航矛盾已由原owner解決、route/file ownership與隔離環境；驗證route-owner表無重複，未滿足前置保持blocked，不改runtime。
- [ ] 1.2 [after: 1.1] 先測「Local shell integration SHALL preserve existing routes and rollback」及「先本機選擇性啟用，保留舊殼與preview特殊路徑」：top/child selected、unknown route、denied、preview單外框、localflag回退；驗證focused tests預期行為RED，舊baseline綠。

## 2. renderer及最小接線

- [ ] 2.1 [after: 1.2] worker A實作「The authenticated shell SHALL consume one approved navigation model」的純top/side renderer及focused test，使用現有UI/i18n/icon，不讀DB或另造role；驗證renderer tests GREEN、欄位輸入對NavigationModel精確、write範圍僅新renderer檔。
- [ ] 2.2 [after: 1.2] worker B寫「Local shell integration SHALL preserve existing routes and rollback」的role與preview回歸測試，限定test檔不改shared殼；驗證具體不越權／無重複chrome／legacyflag例子預期RED，不連production。
- [ ] 2.3 [after: 2.1, 2.2] 主控接renderer到NavBar/AppWrapper及localflag，保留既有manifest/roles與原route；驗證所有focused/affected navigation tests GREEN、無新DB/provider變更，主控獨占shared寫入。

## 3. 本機登入驗收及回寫

- [ ] 3.1 [after: 2.3] 依「Application acceptance SHALL require real local authentication evidence」主控啟動隔離localhostApp，以三種測試角色走現有route與denial，1440/390截圖，直接URL與preview/reload回歸；驗證HTTP真登入與資料不變，fileDemo／mock／build不可代替，缺環境就保留未驗。
- [ ] 3.2 [after: 3.1] 主控獨立review與rollback回讀、Spectra validate/analyze、scoped Git plan核准後commit/push，將M2可本機驗收寫回總表；驗證證據path/role/route可追溯，未串接模組仍明示、不部署正式站。
