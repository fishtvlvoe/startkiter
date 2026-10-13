# 舊 SR 收尾與不重工清單

2026-10-13。總owner：creator-platform-delivery-master／M0。此輪沒有取消未完成功能，沒有把未驗證任務勾成完成，沒有批次park隱藏。

| 舊SR | 收尾分類 | 明確動作／前置 | owner |
| --- | --- | --- | --- |
| site-wide-functional-qa-sweep | 可收歷史巡查；封存完整方案待確認 | preview 0 incomplete、no deltas/warnings；保留findings/screenshots；198d3e67修復commit存在；不聲稱現今全部新UI通過 | master M0 archive gate |
| missing-product-surfaces | 不可封存；9勾不是全功能完成 | 缺停用coupon UI、operator vs admin.access、DB/workbook邊界未驗、design作廢領碼文字；保留歴史並加收尾tasks | 原SR，不重開所有功能 |
| buyer-journey-gap-completion | 不可安全套規格 | proposal選單 vs preview、canonical role自矛盾、官網reader契約、每課LINE access、6.4部署勾/文矛盾；增加補正與驗證gate | 原旅程SR＋原role SR＋sales分界 |
| creator-backoffice-local-acceptance | 本機原型收尾，不當完整UI完成 | 13/14剩Git；現有view/model作M1基底，缺的頁面/狀態由新設計SR補；不重做local保存 | 原SR交付，M1設計新增owner |
| creator-operations-platform-blueprint | 保留架構，停止充當施工總表 | 71/79仍8項文書；scope/owner/update/snapshot未解，細拆後總表引用；全功能沒有被取消 | 架構SR，不配provider阻擋M1 |
| role-based-workspace-navigation | 正式殼前置修正＋雲端gate | 真source已用resolveNavigation；/admin/course角色新舊contradiction先補正；原migration/rollback仍待 | 原role owner，M2只renderer |
| app-feature-surfaces | 接線已有，保留真實巡查 | 10/12；課程工作室/teacher/learner功能routes不重建，M2只接殼；原deploy QA獨立 | 原surfaces owner |
| public-multi-course-sales-and-code-package | 必需，清單落後須逐task驗 | 2/15，已有source/tests；M3真商品保存與M4交付共用本SR，禁止Demo四種類直接替代CourseOffer | 原sales owner |
| buyer-bundle-checkout-entry | 必需，剩付款閉環 | 12/13；與sales M4共用一批provider/買家驗證，不合併DB真相或取消grant | 原Bundle owner |
| platform-launch-verification-evidence | 必需，最後部署回滾 | 14/15，工具測試不是演練，M4後統一release gate | 原launch owner |
| newsletter-automation-integration | 排M5，先重核舊清單 | 18/41，render/audience/send engine已存在；前置ToSend已封存，但真delivery/cron/interface仍待 | 原newsletter owner |
| oracle-chatwoot-anti-reclaim-cutover | 已暫存、後續基礎設施安全 | 5/7；不做M1/M2前置，沒有授權新雲端變更，本輪不unpark | 原infra owner |

## 主控核對結果與限制

兩個唯讀worker分別回報coupon11檔39個mock tests與buyer13檔66個mock tests通過；未跑DB6個deleteMany測試、未送信、未碰provider／production。主控已讀coupon/page無deactivate control、通知route用admin.access、CoursePage全站access＋findFirst、nav-menu-items在adminpath採platform source，與review不符的點不能當完成。詳細測試數只為worker目前證據，不當全SR獨立驗收已通過。

封存preview的conflict_source是來源版本提示，不自動等於真正衝突。旅程review確認github-kit新增UI／LINE明確MODIFIED／course新增並不直接撞同名；真正阻擋是規格自身新舊role及文字與source的矛盾。不能只憑preview warnings=[]就套所有delta。

Git：legacy source相關commit已有，但本機Demo／新規劃仍dirty未提交；不合併整個working tree。QA archive預覽不改spec；其他兩張含delta，須修正及完整批准後才執行。取消工作沒有新拍板，不刪功能需求；已移交的原型11.4/11.5仍保留映射。

## 封存方案（截至本輪尚未執行）

site-wide-functional-qa-sweep：執行spectra archive NAME --json一次，預覽無delta、無incomplete、無warning，不選mark-tasks-complete／skip-specs，不做手動spec套用；完整選擇等待Fish async回覆。其它全勾卡未準備執行，先補缺口。
