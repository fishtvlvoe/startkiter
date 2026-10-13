# Creator 平台來源與施工責任表

日期：2026-10-13
目標：同一份登入、內容、訂單、授權、寄信或倉庫資格，不被不同 SR 重建成兩套。
證據範圍：本機 canonical specs、六張既有 SR 的 proposal／design／tasks，以及下列實際 source。這是文件／程式唯讀盤點，沒有重跑程式測試或外部付款、寄信、GitHub 驗收。

## 用這份表的方式

`reused` 是保留既有責任；`extended` 是新增契約並遷移；`new` 是目標能力需要獨立交接，不表示整個 repo 從未有任何相關代碼。資料庫統一由 migration 演進；頁面 owner 不等於可以修改付款、身份或授權核心。

所有路徑相對本文件，連結是來源定位，不是功能完成證據。正式是否可用仍需對應 SR 的測試與行為證據。

## 已驗證的四個契約落差

| 落差 | 現行證據 | 施工責任與進入條件 | 不能做的事 |
| --- | --- | --- | --- |
| 季訂閱尚未有資料／gateway 契約 | [Prisma schema](../../packages/database/prisma/schema.prisma) 的 SubscriptionInterval 只有 MONTH／YEAR；[subscription-billing](../../openspec/specs/subscription-billing/spec.md) 的方案目前指向 courseId；checkout 取 CourseSubscriptionPlan | SR-06 定義通用商品／週期；SR-11 驗證 PAYUNi 支援及映射；新增季方案要先有 migration、provider sandbox、取消及到期證據 | 只把 MONTH 改名成「季」；把目前月／年單課能力說成已支援季、Bundle 或獨立 CodePackage |
| 可寫倉庫承諾與唯讀交付不同 | [buyer-repo-upstream-sync](../../openspec/specs/buyer-repo-upstream-sync/spec.md) 寫 writable；[provisionBuyerRepo](../../packages/github-kit/provision-buyer-repo.ts) 呼叫 inviteReadOnlyCollaborator；[GitHub client](../../packages/github-kit/github-app-client.ts) 送 permission: pull | SR-07 只驗收其已確認的唯讀交付；SR-04 必須先定義「交付倉庫／買家開發倉庫」及寫入／版本追蹤責任，再提出 canonical delta 與移轉驗收 | 宣稱桌面 AI 改完可 push 回唯讀倉庫；逕自升／降既有客戶 GitHub 權限；刪 repo 解決 |
| App 工作區不等於租戶 | [WorkspaceContext](../../packages/platform/src/workspace/navigation.ts) 是 platform 或 appId＋app role；[Organization membership](../../packages/database/prisma/queries/organizations.ts) 是 organizationId＋userId | SR-01 明訂 organization、actor、app、capability 的解析橋接；同一請求只有一個租戶上下文；SR-02 只渲染該結果 | 用 appId 直接當 organizationId；複製另一套 Member／Invitation；以選單可見代替後端權限 |
| 版本提示不是安全更新流程 | [repo-version](../../packages/github-kit/repo-version.ts) 比較兩個版本並生成 fetch／merge 提示；現行 hint 含 allow-unrelated-histories，沒有本總計畫要求的備份／衝突預覽／Skill 相容矩陣 | SR-03 補安全更新契約與檢查；SR-04 用乾淨買家專案驗證本機→自有 repo→部署→更新；先解決上列倉庫責任 | 把現有提示當成已驗收的無損更新；直接 merge／覆蓋買家專案；版本欄缺失仍報已更新 |

「季訂閱」和「可寫開發倉庫」目標保留；這份表沒有用較小功能取代它們。唯讀交付是銷售切片的既有邊界，不是未來買家開發流程的完整答案。

## 十五張後續 SR 的 source／owner 對照

| 能力索引 | 分類／現行規格來源 | 實際 source 或研究輸入 | 唯一施工責任／不重建的東西 |
| --- | --- | --- | --- |
| SR-01 platform foundation | extended：[organization-tenancy](../../openspec/specs/organization-tenancy/spec.md)、[role-based-workspace-navigation](../../openspec/specs/role-based-workspace-navigation/spec.md) | [navigation.ts](../../packages/platform/src/workspace/navigation.ts)、[registry.ts](../../packages/platform/src/workspace/registry.ts)、[organizations query](../../packages/database/prisma/queries/organizations.ts) | 解析租戶＋App＋actor；Organization／Member／Invitation 仍由身份與資料層管理；導航遷移證據留在既有 navigation SR |
| SR-02 UI/UX foundation | extended：[design-system](../../openspec/specs/design-system/spec.md)、[design-tokens](../../openspec/specs/design-tokens/spec.md) | [HTML 提案](startkiter-creator-platform-progress-uiux.html)、[狀態矩陣](creator-platform-ui-state-matrix.md)、同一 resolveNavigation | 共用列表／表單／狀態與焦點；不另建選單或資料權限真相；既有功能畫面施工仍屬原 SR |
| SR-03 extension/update | extended：[app-extension-contract](../../openspec/specs/app-extension-contract/spec.md)、[platform-core-boundary](../../openspec/specs/platform-core-boundary/spec.md)、[buyer-repo-upstream-sync](../../openspec/specs/buyer-repo-upstream-sync/spec.md) | [AppRegistrationManifest](../../packages/platform/src/app-registration.ts)、[core boundary checks](../../packages/platform/src/core-boundary.test.ts)、[repo-version](../../packages/github-kit/repo-version.ts) | 版本／事件／更新相容契約與衝突保護；付款、通知發送仍是固定 core，不變成可替換的付款外掛 |
| SR-04 buyer SaaS/deployment | extended：[buyer-dev-skill](../../openspec/specs/buyer-dev-skill/spec.md)、[buyer-credential-handoff](../../openspec/specs/buyer-credential-handoff/spec.md)、[managed-hosting-tiers](../../openspec/specs/managed-hosting-tiers/spec.md) | [買家擴充慣例](../buyer-extension-convention.md)、[tiers](../../packages/platform/src/deployment/tiers.ts)、[credentials](../../packages/platform/src/deployment/credentials.ts)、[submitCredential](../../packages/api/modules/deployment/procedures/submit-credential.ts) | 手冊／版本化 Skill／專案 Code 模式／自有開發倉庫／部署責任；買家終端客戶身份與付款留在買家系統。現行 credential endpoint 需要 managed deployment，不能對 self-hosted 宣稱同樣入口已可用 |
| SR-05 CRM/audience | new Contact linkage；reused／extended：[newsletter-consent-compliance](../../openspec/specs/newsletter-consent-compliance/spec.md)、[newsletter-audience-targeting](../../openspec/specs/newsletter-audience-targeting/spec.md) | [email-consent](../../packages/newsletter/lib/email-consent.ts)、[audience](../../packages/newsletter/lib/audience.ts)、[Prisma schema](../../packages/database/prisma/schema.prisma) | Contact／identity link／Tag／Segment／Consent／Suppression；現行寄信同意以 userId 查 User，不是匿名 Contact 引擎；User 登入生命週期不搬進 CRM |
| SR-06 offer commerce | extended：[course-bundles](../../openspec/specs/course-bundles/spec.md)、[subscription-billing](../../openspec/specs/subscription-billing/spec.md)、SR-07 快照 | [getProduct](../../packages/payments/catalog.ts)、[schema](../../packages/database/prisma/schema.prisma)、[subscription checkout](../../packages/api/modules/course/procedures/create-subscription-checkout.ts) | 通用 Product／Offer／交付政策與季／Bundle／CodePackage 訂閱；Course 保留內容、payment 保留金額與狀態；不另建平行 checkout |
| SR-07 public sales slice | extended：[現行銷售 SR](../../openspec/changes/public-multi-course-sales-and-code-package/proposal.md)、[payuni-checkout](../../openspec/specs/payuni-checkout/spec.md)、[github-kit-fulfillment](../../openspec/specs/github-kit-fulfillment/spec.md) | [Offer API](../../apps/saas/app/api/course/offers/route.ts)、[course access](../../packages/api/modules/course/lib/course-access.ts)、[claimGithubKit](../../packages/github-kit/claim.ts) | 目前一次買斷垂直切片；CourseOffer／OrderCourseEntitlement 由此增量；未提交 source 不是已驗收；不重做 Bundle 原入口，也不施工 CRM／新訂閱 |
| SR-08 operations home | extended：[course-dashboard](../../openspec/specs/course-dashboard/spec.md)、[platform-admin-dashboard](../../openspec/specs/platform-admin-dashboard/spec.md) | [course metrics](../../packages/api/modules/course/lib/course-dashboard.ts) | 跨領域可操作待辦 read model；課程指標只是來源，不代表已是營運台；CourseOffer SKU 與 courseId 的報表映射需重新核對，不能直接沿用 slug 判斷 |
| SR-09 automation | extended：[newsletter-send-engine](../../openspec/specs/newsletter-send-engine/spec.md)、[newsletter-consent-compliance](../../openspec/specs/newsletter-consent-compliance/spec.md) | [send-engine](../../packages/newsletter/lib/send-engine.ts)、[email-consent](../../packages/newsletter/lib/email-consent.ts)、[既有 newsletter SR](../../openspec/changes/newsletter-automation-integration/proposal.md) | 泛用事件→Outbox→Enrollment→Delivery；先接既有寄信責任，不重建 newsletter worker；transactional 與 marketing 同意不能混用 |
| SR-10 site/funnels | extended：[buyer-pages-cms](../../openspec/specs/buyer-pages-cms/spec.md)；new Funnel 關係契約 | [sanitized write](../../packages/platform/src/pages-cms/write.ts)、[restorePage](../../packages/platform/src/pages-cms/restore.ts)、[reserved slugs](../../packages/platform/src/pages-cms/reserved-slugs.ts) | Page／revision 沿用；新增 FunnelStep、表單 Contact linkage 與 Offer CTA；不是把 CMS 寫入搬進課程；完整 builder 未拍板不當前置 |
| SR-11 Taiwan billing | extended：[subscription-billing](../../openspec/specs/subscription-billing/spec.md)、[einvoice-issuance](../../openspec/specs/einvoice-issuance/spec.md)、[line-learner-community](../../openspec/specs/line-learner-community/spec.md) | [subscription factory](../../packages/payments/subscription-factory.ts)、[PAYUNi period events](../../packages/api/modules/course/lib/webhook-events.ts)、[schema](../../packages/database/prisma/schema.prisma) | 週期 provider 映射、發票／LINE 用途相容；付款由 payments 管理，發票成功不代替付款成功；未知 provider 不逕自換掉 |
| SR-12 analytics/export | extended：[sheets-export-engine](../../openspec/specs/sheets-export-engine/spec.md)、[course-dashboard](../../openspec/specs/course-dashboard/spec.md) | [exportOrdersSpreadsheet](../../packages/api/modules/admin/procedures/export-orders-spreadsheet.ts)、[course metrics](../../packages/api/modules/course/lib/course-dashboard.ts) | versioned events、日期／scope／重算與伺服器來源匯出；現行 export 接收呼叫者傳入 orders，不等於已驗證 server-filtered scoped export |
| SR-13 live/webinar | new 領域契約；沿用 SR-03／05／06／09／12 的規則 | [WebinarJam 證據](webinarjam-reverse-engineering-notes.md)、[Systeme 清單](systeme-io-reverse-engineering-checklist.md)、[live 規格](../../openspec/changes/creator-operations-platform-blueprint/specs/creator-live-and-webinar/spec.md) | 場次／報名／出席／回放 owner；CRM 保存 Contact／Consent、commerce 保存交易，影音 adapter 只處理影音；觀察到 UI 選單不代表知道串流技術 |
| SR-14 creator AI | extended provider config，new 營運核准工具契約：[ai-provider-config](../../openspec/specs/ai-provider-config/spec.md)、[site-agent](../../openspec/specs/site-agent/spec.md) | [provider settings](../../packages/api/modules/ai/lib/provider-settings.ts)、[site agent tools](../../packages/site-agent/src/tools.ts) | 創作者 scoped tool／draft／approval／audit；現有 site-agent 仍唯讀兩工具；不得把買家 Code Skill 或現有客服工具改成無審核副作用工具 |
| SR-15 mobile/rollout | reused gate：[上線驗證 SR](../../openspec/changes/platform-launch-verification-evidence/proposal.md)；extended 每張 UI SR 證據 | [狀態矩陣](creator-platform-ui-state-matrix.md)、各 SR 的驗證輸出 | 發布批次／角色／390px／鍵盤／回滾證據；手機每張 SR 做，不等最後補；不把部署資料填進 HTML 就說完成驗收 |

## 與五張既有 SR 的修改責任分界

2026-10-13 `spectra list --json` 確認下列五張為 active；完成數只是其清單現況，不作功能完成比例。

| 既有 SR | 本輪讀到的待驗收責任 | 總藍圖的使用方式 | 新 SR 不得搶走的責任 |
| --- | --- | --- | --- |
| role-based-workspace-navigation，30／31 | task 6.3 adapter→manifest→shell migration／rollback | SR-01／02 重用其導航解析與遷移基線 | 不另做 navigation registry；新 Creator 租戶橋接另列 delta，不暗勾原回滾證據 |
| app-feature-surfaces，10／12 | task 3.2 部署後課程角色巡查、4.3 review／analyze／validate | SR-02 確認原畫面與新 shell 可共存 | 原 Course Studio CRUD／沙盒等驗收仍由原 SR 取得，不用新 Demo 覆蓋 |
| newsletter-automation-integration，18／41 | Wave 整合、交易信回歸、排程與交付證據仍待收尾 | SR-09 引用既有 send-engine／consent；泛用 Outbox 另做 delta | 既有寄信 worker／退訂真相不複製；不把歡迎信改成 marketing 信 |
| buyer-bundle-checkout-entry，12／13 | task 7.2 真實／sandbox Bundle 購買流程 | SR-07 保持舊 Bundle 入口；SR-06 擴充通用 Offer | 原 /bundles 與 /bundles/[slug] 驗收歸原 SR；通用新方案不得重建同 route |
| platform-launch-verification-evidence，14／15 | task 4.1 TEST／preview 真實回滾演練 | SR-15 使用同類證據格式但為新批次重新驗收 | 原回滾演練仍未驗證，不因新文件通過自動完成 |

若同一檔案不得不被兩張 SR 修改：先將共享契約變更放入唯一 producer SR，再由 consumer SR 引用已提交版本；對共用 route／schema 的 concurrent edits 停止合流直到 owner 與順序明確。

## 下一張可以準備施工的 SR

買家交付新 gate：現行 credential handoff 的三個通用 key，與 PAYUNi／ToSend reader 的實際配置欄位不同；managed endpoint 也不等於 self-hosted 路徑。SR-04 要先做 provider-specific mapping／目標 instance／乾淨 install 與外部行為驗收，不能把 allowlist 接受／env write 當成收款寄信已可用。canonical 舊 self-hosted README Zeabur 路徑與目前平台 Coolify 部署文件須核對，不能靜默換買家指南。詳見 handoff 的買家補充契約；本輪不改 provider／env。

`public-multi-course-sales-and-code-package`，不是本 blueprint。繼續前先讀其實際 diff，確認隔離資料庫、legacy MVP courseId mapping 與既有 Bundle 入口。其一次買斷交易驗收不需要等完整 CRM、直播或泛用訂閱，但不能宣稱這些已被一併完成。

## 更新不做 A 壞 B 的 release 對照

| 新變更 | 必跑回歸（由施工 SR 執行，本輪未跑） | 安全回退 |
| --- | --- | --- |
| 季／通用 Offer 訂閱 | 既有 MONTH／YEAR 單課、一次買斷、付款重播、取消、到期、已售快照 | 停止新增方案；維持既有 subscription／Order 與 provider 紀錄，不刪歷史 |
| Contact／Consent | 現有 User 同意／退訂、交易信、newsletter 排程；身份不能靠未驗證 email 連結 | 停新匯入／consumer；保留退訂與稽核，不能恢復被撤回的同意 |
| 新工作區／頂部分區 | 原平台與 App 角色、直接 route denial、課程閱讀／管理、原 adapter 回滾 | 切回舊 renderer／adapter；Organization 與 App roles 不抹除 |
| Live／AI | 課程權限、Order、Newsletter、GitHub grant；重複事件、缺 provider、未核准拒絕 | 停新報名／新工具，保留已付款場次、出席、核准及通知紀錄 |
| 買家 template／Skill 更新 | 乾淨 install、自有 repo push、客製 diff、migration read-back、桌面 Code 模式、部署回滾 | 衝突先停；舊服務可運行，資料與客製保留，無證據不發布新版本 |
