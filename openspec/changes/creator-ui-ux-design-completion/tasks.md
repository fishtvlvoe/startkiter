## 1. 固定畫面與狀態

- [ ] 1.1 依「先固定有限畫面清單，不拿26能力全貌當一輪畫面交付」與「The screen matrix SHALL enumerate every in-scope destination」列出導航每個destination、role、layout/actions/back/states/applicability/owner及缺口；驗證matrix與CreatorLocalNavigation逐项一對一，已有與未畫清楚分開。
- [ ] 1.2 [after: 1.1] 先測「Each preview screen SHALL expose recoverable states」及「共用狀態由主控維持，角色view獨立補齊」的狀態selector、retry保留query、unknown page/state拒絕及不動storage；驗證focused tests預期行為RED後主控補shared state contract到GREEN。

## 2. 角色畫面獨立兩批施工

- [ ] 2.1 [after: 1.2] Agent A補「The screen matrix SHALL enumerate every in-scope destination」管理員list/detail/setting版型，先測再畫；驗證A matrix列對應實體markup、state/frame無placeholder，admin view tests GREEN，只有admin view/test寫入。
- [ ] 2.2 [after: 1.2] Agent B補「The screen matrix SHALL enumerate every in-scope destination」的creator營運list與setting/form版型第一批（CRM/site/email），先測再畫；驗證B指定矩陣列及未串接邊界，creator view tests GREEN，shared檔不動。
- [ ] 2.3 [after: 2.2] Agent B補creator第二批（automation/sales/live/settings與已有商品回归），依「Each preview screen SHALL expose recoverable states」給錯誤/空/重試/返回實體畫面；驗證每destination欄位/狀態對應，不假實作provider，focused tests GREEN。
- [ ] 2.4 [after: 1.2] Agent C補「Design acceptance SHALL retain existing local workflows」的buyer library/catalog/resources/detail estados，空/錯/未取得/返回完整；驗證buyer view tests GREEN且不出管理員入口、不擴grant、不改model。

## 3. 主控整合、驗收與回寫

- [ ] 3.1 [after: 2.1, 2.3, 2.4] 主控獨立review與回归「Design acceptance SHALL retain existing local workflows」：sharedhandler/escape/狀態副作用、存檔/reload/取得快照/legacy全部正常；驗證focused測試全過、自審無未處理Critical，worker reports只作輸入證據。
- [ ] 3.2 [after: 3.1] 主控ego走matrix1440/390與keyboard、截图逐列回寫，提供單一入口及短操作路線；驗證matrix每列有實际圖与scopeKind，Fish可驗M1而不误認HTTP App/DB已接；總表M1標可本機驗收，不提前標正式功能完成。
- [ ] 3.3 [after: 3.2] 主控完成Spectra validate/analyze與scoped Git計畫、commit/push核准交付；驗證远端commit及總表/CONTEXT/evidence引用一致，未提交或Fish設計回饋未收斂不archive。
