# 總 SR 表與現況差異：2026-10-13 核對

HTML入口：creator-sr-roadmap-alignment.html。狀態：清單全數列入、代表性實體程式與focused tests已核對；不是所有功能的完整安全／部署稽核。沒有更改舊SR勾選、還原暫存、正式資料或provider。

## 清單快照與責任建議

| SR | 清單 | 本輪判斷／下一步 |
| --- | --- | --- |
| creator-backoffice-local-acceptance | 13/14 | 本機三角色可驗；正式接線未施工，剩scoped Git交付 |
| creator-operations-platform-blueprint | 71/79 | 保留總架構；8條待辦需核對更新／快照／UI移交；非產品百分比 |
| public-multi-course-sales-and-code-package | 2/15 | 有實體API／交付程式，先核對清單與來源，不能說只寫2項；沿用 |
| role-based-workspace-navigation | 30/31 | NavBar實際呼叫resolveNavigation；重用而非重建，剩遷移／回滾證據 |
| app-feature-surfaces | 10/12 | 有feature-surfaces與navigation程式；保留正式課程入口、補真實巡查 |
| buyer-bundle-checkout-entry | 12/13 | Bundle列表／詳情／結帳存在；保留，真實/sandbox購買閉環未重驗 |
| newsletter-automation-integration | 18/41 | 清單落後：render／audience／send-engine已存在；補正後做，不重寫 |
| platform-launch-verification-evidence | 14/15 | evidence工具存在；TEST回滾未執行，工具測試不代表演練 |
| oracle-chatwoot-anti-reclaim-cutover | 5/7，暫存 | 不作本機UI前置；未查雲端安全與服務，保留暫存 |
| missing-product-surfaces | 9/9 | 清單全勾；路由／權限／Git完整核對尚待做，不直接封存 |
| buyer-journey-gap-completion | 19/19 | 清單全勾；部署驗收task描述仍留「待上線」，需證據消除歧義 |
| site-wide-functional-qa-sweep | 4/4 | 有歷史修復commit／巡查引用；未重查目前線上版本，不直接封存 |

共8張進行中、1暫存、3清單全勾；來源spectra list --json及--parked。只把每張清單數列出，不加總成產品完成率。tracking裡來源檔數混有歷史及文件，不用它判斷已做百分比。

## 本輪實體與測試證據

1. 正式殼：apps/saas/modules/shared/components/NavBar.tsx有resolveNavigation import及實際caller；packages/platform/src/workspace/navigation.ts存在。新版上方主分類＋情境側欄目前仍是docs本機殼，不是正式導航已換成新版。
2. 電子報：packages/newsletter/lib/render.ts有renderCampaignHtml／Async，audience.ts有getAudienceUsers／estimateAudience／resolveDispatchRecipients，send-engine.ts有assertEmailConsent caller。vitest focused render／audience／email-consent 3檔24PASS，未寄送真實信件。
3. ToSend前置：openspec/changes/archive/2026-09-16-mail-provider-tosend-smtp-support存在；newsletter待辦0.1仍留前置完成確認。需驗接口與部署現況，不重開已封存程式。
4. 多課：apps/saas/app/api/public/courses及[slug]/route.ts與測試存在；2檔5PASS。packages/api/modules/course/lib/send-welcome-email.ts／test實跑12PASS。均非真實付款／寄信送達。
5. 本機與上線工具：node --test docs/blueprint/creator-local-*.test.cjs docs/verification/launch-evidence-report.test.mjs，154PASS（142本機＋12報表工具），不是154個正式業務功能。rollbackRehearsal仍需真執行記錄，不能填假資料補過。

上述命令exit0；沒有載入憑證，沒有DB／外部寫入。沒有重跑完整pnpm test/build，也没有對全部已勾項做逐一code review。正式資料庫、payment webhook真環境、退款、GitHub grant、跨角色／部署／mail delivery與現有UI巡查仍待專項驗證。

## 建議施工次序（尚未批准新程式修改）

先收本機Demo Git範圍與補正舊SR → 新版正式殼接現有角色／導航 → 已有課程方案API接新版表單及DB保存 → 真實買家指定內容與交易交付 → 通用商品／訂閱／CRM／直播等分期。正式UI接線是否新建SR，需先確定與role-navigation／app-surfaces的route/file owner；本輪未建立或啟動该候選SR。

第一個正式網站驗收切片：用真實本機後台帳號新增一個課程銷售方案，重新登入後可讀、可改。通用四種商品、季訂閱與獨立SaaS不混為此切片已具備能力；需要新模型就後續另排。

每批流程：清點 → 固定目標／UX → SR契約 → 共用規則後平行施工 → 測試／browser／Git／部署分層交付。不破壞舊紀錄：additive migration、feature flag、snapshot、回退與read-back在真正施工SR寫明；本輪只有報告，沒有migration。

總表是索引，總藍圖仍是架構與交接依據，功能SR各管自己的程式真相。過時待辦的checkbox不在報告輪自行勾選或刪除；確認後用Spectra ingest補正，完成SR需證據及Git再封存。

## 交付狀態

HTML與本紀錄本機寫入，未commit／push、未部署；原HEAD76bedd1b。功能／Git完成不可因報告生成而宣稱。HTML桌面／手機圖與開啟狀態由ego另記，不使用Playwright或跨其它task space。
