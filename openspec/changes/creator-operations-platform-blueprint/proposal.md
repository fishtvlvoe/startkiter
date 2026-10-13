## Why

2026-10-13 驗收目標重設：Fish 已確認先交付本機可操作後台，親自驗收 UI／UX 與商品→保存→買家視角的完整流程。保留原藍圖，新增範圍僅限隔離的本機示範程式，不改正式 application runtime；文件完成率不作本輪功能進度。

前次 REA 已確認 StartKiter 與 Systeme.io 的差距不是單純 UI，而是平台模組、創作者工作流、資料領域與事件流尚未收斂成一張可施工的總圖。現有 `creator-operations-platform-blueprint` 已有高層藍圖與六個 capability，但缺少逐模組逆向清單、可重用的 UI/UX screen contract、現況對照、SR 依賴與完整驗收順序；現在必須先把總計畫補齊，避免 `public-multi-course-sales-and-code-package` 變成孤立的課程銷售實作。

## What Changes

- 修改本機UI後續施工责任：2026-10-13 Fish核准後，未完成11.4／11.5交由 `creator-backoffice-local-acceptance`，本change保留既有完成的本機原型與架構規格，不重複施工三角色view或接線。
- 新增 Systeme.io 模組、頁面、流程、資料、角色、狀態、事件、整合與 UX 的完整逆向工程清單。
- 新增 `creator-ui-ux-foundation`：把任務導向頁面、共用列表／表單／狀態、桌面／手機、鍵盤與瀏覽器驗收寫成可重用契約。
- 新增 `buyer-saas-extension-and-deployment`：定義買家取得 CodePackage 後建立自己的 SaaS／會員網站、設定登入／Organization／權限／付費入口、選擇部署層級、管理更新與服務責任的產品邊界。
- 新增 `platform-extension-and-update-contract`：定義核心平台、官方模組、買家客製功能與版本更新之間的契約，避免新增 CRM、Funnel、SMS、Analytics 或其他 Systeme 能力時破壞既有課程、付款與買家程式。
- 新增 StartKiter 的 `ContentResource`、`Product`、`Offer`、`Order/Subscription`、`Entitlement`、`CodePackage` 分層契約。
- 新增 `creator-live-and-webinar`：將即時直播、預錄常青 Webinar、報名／出席／回放、CRM、Offer、Automation 與影音 provider adapter 分開定義。
- 補充 WebinarJam 已登入 Webinar 清單、Express／Full 設定差異、Right now／Schedule for later／Always on 場次選項、WebinarJam Live／YouTube Live／Facebook Live provider 標籤，以及 Analytics／Registrants 篩選的 REA 比較觀察；明確區分可見 UI 文案、StartKiter 設計推論與未確認的實際技術，供後續 `creator-live-and-webinar` 施工 SR 使用。
- 新增 `creator-ai-assistance`：讓創作者可用 AI 草擬內容、摘要名單／營運／直播資料與提出工作流程建議，同時明訂 workspace 權限、來源追溯與外部動作人工核准。
- 新增 Systeme 能力到 StartKiter 現有模組的 reused／extended／new／out-of-scope 對照矩陣。
- 新增從 creator workspace、名單、內容、Offer、checkout、交付、行銷、自動化到分析營運的端到端流程圖。
- 新增後續 SR 的依賴順序、每張 SR 的輸入／輸出／驗收／回滾邊界。
- 補 `creator-platform-capability-catalog.md` 的完整已知能力目錄：商機管道、日曆、SMS、分潤、實體與其它資源商品明列 owner／研究 gate／候選後續 SR，不因十五張核心卡片而漏列，也不宣稱其第三方未觀察流程已完成。
- 新增 `creator-platform-development-handoff.md` 的商品／授權矩陣、桌面 AI 買家使用流程、十五張能力交接卡片與政策阻擋；序號不作時間排序，優先收尾已施工的一次買斷銷售切片。
- 擴充現有藍圖，使 `public-multi-course-sales-and-code-package` 成為第一條產品垂直切片，而不是獨立定義商品真相。
- 明確保留 StartKiter 自己的課程深度、LINE、PAYUNi、台灣合規、GitHub CodePackage 與 plugin 平台邊界。
- 新增本機 UI 驗收切片：重用現有 HTML 樣式，建立單堂／組合包／程式碼包／SaaS 商品管理、一次／月／季／年收費、指定取得內容、本機保存、買家示範視角、CRM／直播查看與篩選；不修改正式 runtime、schema、provider 或部署設定。

## Non-Goals

- 不複製 Systeme.io 的品牌、版面、文案、元件或內部實作。
- 不在本 change 直接實作 CRM、Funnel builder、SMS、Automation engine、Analytics pipeline 或新的 payment endpoint。
- 不把所有後續功能塞進一張巨型施工 SR；後續依本總計畫拆成可獨立測試、部署、驗收與回滾的小 SR。
- 不改寫既有已驗證的課程、Bundle、PAYUNi、訂閱、電子報、客服或部署契約；若需要變更，另開或 ingest 到對應 SR。
- 不在本 change 自建即時影音串流／轉碼服務，也不把 Systeme.io 的高階 Evergreen Webinar 誤稱為原生 Live Streaming。
- 不讓 AI 自行寄送行銷訊息、發布內容、調價、退款、開立發票或授予／撤銷 Entitlement；這些動作須通過既有規則與核准邊界。
- 不在沒有實際證據時宣稱 Systeme 的未操作頁面、內部 API 或資料表已經確認。

## Capabilities

### New Capabilities

- `creator-platform-foundation`: 平台工作區、App registry、角色、權限、導覽、頁面狀態與總計畫入口契約。
- `creator-ui-ux-foundation`: 任務導向頁面、共用管理介面、狀態、responsive、keyboard、focus 與設計交接契約。
- `buyer-saas-extension-and-deployment`: CodePackage 的 buyer-owned SaaS 使用、部署 tier、credential handoff、upstream update、買家終端使用者權限與支援責任契約。
- `platform-extension-and-update-contract`: App／plugin mount、domain event、database migration、UI contract、version compatibility、feature flag、upstream sync、conflict、rollback 與 release channel 契約。
- `creator-crm-and-audience`: Contact、identity、標籤、分眾、互動時間線、Consent、Suppression、匯入與匯出契約。
- `creator-content-and-commerce`: ContentResource、Product、Offer、Course、Bundle、Coupon、checkout、Order、Subscription 與 Entitlement 的分層契約。
- `creator-marketing-automation`: Campaign、Template、Automation、Trigger、Condition、Action、Outbox、Delivery、Retry 與 Unsubscribe 契約。
- `taiwan-localization-and-compliance`: zh-TW、TWD、Asia/Taipei、PAYUNi、發票、LINE purpose、個資同意與稽核契約。
- `creator-analytics-and-operations`: Operations home、Domain event、報表、匯出、Audit、Notification、Support 與 failure alert 契約。
- `creator-live-and-webinar`: Live webinar 與 Evergreen webinar 的不同生命週期、provider、報名、場次、出席、回放及跨模組事件契約。
- `creator-ai-assistance`: workspace-scoped AI assistant、可核准的工具操作、資料來源／輸出追溯、隱私與人機協作契約。

### Modified Capabilities

- 無。本 change 更新的是藍圖與後續 SR 計畫；runtime capability 的行為變更由後續獨立 SR 負責。

## Impact

- Affected specs：上述十一個 blueprint capability specs；既有 `app-extension-contract`、`buyer-template-selection`、`buyer-dev-skill`、`buyer-credential-handoff`、`buyer-repo-upstream-sync`、`managed-hosting-tiers`、`official-site-deployment`、`organization-tenancy`、`subscription-billing` 作為相容性與邊界依據。
- Affected code：本 change 不修改正式 runtime；本機示範使用 `docs/blueprint/creator-local-model.js`、`creator-local-ui.js` 與 `creator-local-model.test.cjs`，入口為既有報告的 `?localAcceptance=1`。後續正式 SR 可能影響 `packages/platform`、`packages/database`、`packages/api`、`packages/course`、`packages/bundles`、`packages/payments`、`packages/newsletter`、`packages/github-kit`、`packages/ui`、`apps/saas` 與 `apps/marketing`。
- Affected documents：`docs/blueprint/startkiter-creator-platform.md`、`docs/blueprint/systeme-io-reverse-engineering-checklist.md`、`docs/blueprint/webinarjam-reverse-engineering-notes.md`、`docs/blueprint/creator-platform-development-handoff.md`、`docs/blueprint/creator-platform-acceptance-target.md`、`docs/blueprint/creator-platform-capability-catalog.md`、`docs/blueprint/creator-platform-source-ownership-map.md`、`docs/blueprint/creator-platform-ui-state-matrix.md`、`docs/blueprint/creator-platform-ui-browser-evidence.md`、`docs/blueprint/startkiter-creator-platform-progress-uiux.html`、`CONTEXT.md`，以及後續 SR 的 proposal/design/spec/tasks。
- Dependencies 新增：無；沿用現有 Next.js、React、TypeScript、Prisma/PostgreSQL、oRPC、Better Auth、TanStack Query、PAYUNi、email/newsletter、GitHub App、UI tokens 與 Coolify/VPS。
- Environment variables 新增：無；SMS、分析儲存與其他 provider 在各自 SR 拍板前不新增。
