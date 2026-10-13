# StartKiter 總施工表：只看這張判斷先後與驗收

更新：2026-10-13。總SR：creator-platform-delivery-master（治理，不改產品功能）。架構真相仍在creator-operations-platform-blueprint；各功能SR保留各自程式owner。HTML：creator-delivery-master.html。

## 施工順序與驗收目標

| 順序 | 目標 | 現況／剩餘 | 唯一施工owner | 你驗收的入口／通過條件 |
| --- | --- | --- | --- | --- |
| M0 現在 | 舊單收尾與責任對齊 | 全部12張舊清單列入；3張全勾已審，2張發現缺口追加待辦；1張歷史QA封存完整方案待確認。未全部封存 | master治理＋原SR收尾task | 本總表／closeout register，能看到每張保留／收尾原因，沒有假完成 |
| M1 下一批 | **完整UI／UX設計驗收** | 部分原型已做；完整畫面matrix／狀態／路線仍待施工；新SR0/9，不能叫UI全完成 | creator-ui-ux-design-completion | creator-local-acceptance.html，所有列入頁面都有具體list/detail/form與適用state，三role/desktop/mobile路線可走；未接服務標清楚 |
| M2 M1核准後 | **真正本機後台驗收** | 0/7；不是file Demo。先解canonical role矛盾及隔離環境／route owner | creator-authenticated-shell-integration | http localhost真NextApp＋測試帳號登入；新上方主分類/左side、角色正確、原課程/preview不壞 |
| M3 M2過關後 | **一個商品真實保存驗收** | 原sales清單落後，程式已有，先校正原tasks；不新造四種全模型 | public-multi-course-sales-and-code-package的CourseOffer切片 | 同localhost真DB：新增一個課程方案→保存→登出登入→可讀可改；未知product kinds明確不支持 |
| M4 M3過關後 | **買家與交易交付驗收** | sandbox/payment/provider/退款/指定內容/資格要實驗證；原owner間只合併驗收批次 | 原sales＋buyer-bundle＋旅程补償；launch只管部署gate | 真測試買家只看指定內容；合法payment→grant→refund/其它有效grant保留；Demo acquire不可代替 |
| M5 逐模組排 | **營運與安全更新擴充** | newsletter先補清單/介面；CRM/live/AI/通用新商品與買家更新依能力分批，不同時承諾全完 | 原newsletter及總藍圖後續候選小SR | 每張小SR有專用入口/主控review/provider與rollback evidence，未選provider不阻擋M1 |

M0→M1→M2→M3→M4為主線。M0一些雲端歷史gate可留原owner而不必全部擋住M1；M2真正dependsOn=M1核准＋role語義修正＋隔離環境。M5不是已開工。上列SR工作量不同，禁止加總百分比。

## 本機驗收從何時開始

最新M1目標與時間：見creator-m1-acceptance-target.md。完整候選版開工後約5小時；若18:45實際開工，目標當晚23:45（台灣時間）可驗。這是估計，first batch耗时會校正；正式App/DB仍另排M2/M3。下方原60分鐘批次仍為first progress checkpoint，不是全部完工。

- 現在能驗的是已有部分原型（不是完整UI完成）。
- 第一個完整驗收目標=M1，完成screen matrix每列實際畫面／states／操作證據才標「可本機驗收」；不是文件寫好就過。
- 真正網站驗收目標=M2，必須HTTP真登入，不用file HTML role切換代替。
- 有資料功能的驗收目標=M3，必須真隔離DB及重登回讀；不以localStorage代替。

時間：規劃／清單整理已產出本輪文件；M1新增設計施工尚未開始。首個M1角色批次以60分鐘為估計，全部工時依1.1畫面matrix與state數量校正，不能承諾「下一個90分鐘全功能完成」。主控每30分鐘回報已新增實體畫面/測試/剩餘，M2環境與role前置未解前不給確定日期。這些是時間估計，不是驗收承諾或已完成證據。

## 分工與主控回寫

M1：主控matrix/共用state/模型保護；A管理員view/tests，B創作者view/tests分兩批，C買家view/tests。1.1→1.2穩定契約後才派，派工packet含task/spec/允許檔/測試/禁改shared，role state不是三人各自决定。

M2：主控sharedNavBar/AppWrapper/guard owner，A只新top/side renderer，B只role/preview regression tests；都在前置核定後，主控獨占接線。M3/M4由原owner依scope分工，不把同一Order/grant交兩個agent寫。

worker回報不是完成：主控讀diff、caller、資料權限／provider副作用、重跑focused tests、ego browser，附evidence後才將小SR狀態改「可驗收」。Git/部署另外列。只有需要外部authority或實際policy決策才問Fish；不把工具能做的驗證交用戶。

## 舊單合併／移交原則

沒有把11張檔案粗暴合一、沒有刪歷史；這張表把它們按目標收編。已存在功能留原owner，小SR只管缺的行為。

local-acceptance=原型交付；新UI-design=M1設計補齊；role-navigation=角色算法及canonical補正/遷移；app-feature-surfaces=既有課程routeQA；new authenticated-shell=M2純render接線；原sales=M3/M4。它們不能同時修改sharedroute/模型；衝突由主控先移交並記錄再開工。

完成的歷史QA可封存不代表新UI通過。missing-product-surfaces9/12、buyer-journey19/23增加收尾補償，舊[x]描述保持原样；新待辦是查證發現不是規劃膨脹。newsletter未知原紅綠歷史不能因source存在就一次勾掉，逐task核驗後補正。

## 狀態與证據

全局UI設計=未完成；真本機新版殼=未施工；真DB新版表單=未接線；既有正式功能地基存在，不全部未動工。詳細已查內容在creator-sr-audit-register.md與creator-sr-closeout-register.md。原Demo142tests及browser各範圍不換算設計百分比；新孩子SR0/9與0/7只是待辦，不冒充新UI已經完成。

Git：未commit/push；新總表與小SR本機建立；provider／DB／deployment未變。封存transaction若獲批准單獨執行並更新返回path；尚未批准就列待確認，不寫已封存。
