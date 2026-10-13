## 1. 舊工作收尾與建立秩序

- [ ] 1.1 依「舊SR先查證收尾，規格衝突或缺證據不得當垃圾清掉」核對11active及1parked：每張標程式／UI／本機／部署／Git缺口，獨立review查三張全勾卡；驗證closeout register每張有source/evidence與archive preview或保留原因，不依checkbox猜完成。
- [ ] 1.2 [after: 1.1] 依「舊SR先查證收尾，規格衝突或缺證據不得當垃圾清掉」對可收尾者預覽完整delta計畫、取得必要確認、執行Spectra archive並更新引用；衝突者保留具體修正task，不用skip-specs隱藏；驗證archive返回path／spec操作／warnings及未完成保留清單。
- [ ] 1.3 [after: 1.1] 依「總施工表只管理里程碑，不代替各功能規格」建立M0～M5總表、唯一owner與排序、本機验收入口和通過條件；驗證每個孩子和前置可定位，沒有把Demo142tests算成正式完成率。
- [ ] 1.4 [after: 1.3] 依「共用契約固定後才分工，主控回跑再寫進總表」建立M1/M2小SR proposal/design/spec/tasks及worker packets；驗證analyze無Critical/Warning、validate通過，候選未實作功能不假勾完成。

## 2. 逐目標追蹤，不在此重複實作

- [ ] 2.1 [after: 1.4] 主控回寫M1完整UI設計與本機原型驗收：所有列入畫面的桌面／手機、空/錯/成功/返回與角色界線有實體對照；驗證孩子SR主控review、browser證據与Fish可驗入口，不冒稱真DB。
- [ ] 2.2 [after: 2.1] 主控回寫M2真正本機App導航接線：复用resolveNavigation與route guards，登入測試帳號看到新版殼；驗證localhost HTTP真實角色操作与旧routes regression，不只file HTML。
- [ ] 2.3 [after: 2.2] 主控回寫M3既有CourseOffer商品保存切片：更新原銷售SR對應owner與UI/DB验收，測試帳號新增重登仍可改；驗證隔離DB與browser／API證據、未接的新商品清楚延期。
- [ ] 2.4 [after: 2.3] 主控回寫M4交易交付闭環：沿用多課／Bundle／launch SR，sandbox付款→指定內容→退款／程式包资格；驗證provider與server grant實证，不用Demo模拟取得替代。
- [ ] 2.5 [after: 2.4] 更新M5營運與更新擴充的分期卡及已具備newsletter程式對照；只針對最近可執行能力拆SR，未決provider保留決策gate；驗證重用/新增界線与事件／授權／rollback owner不重複。

## 3. 審核與版本交付

- [ ] 3.1 [after: 1.2, 1.3, 1.4] 主控審核第一版總表與收尾结果，更新HTML／CONTEXT／本機dashboard，舊證據與取消task保持可追溯；驗證桌面手機可讀、links/source/task映射以及Git scoped plan，不把文件發布冒充程式上線。

總表2.1～2.5是審核回寫gate，不是已授權worker此刻全部平行施工。各正式小SR要通過各自preflight與範圍確認；主控不把總表10項當工程百分比。
