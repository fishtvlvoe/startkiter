## Context

StartKiter 目前已經有平台殼、App-scoped navigation 的方向、課程與課程管理、PAYUNi 訂單／訂閱、電子報自動化、頁面管理、客服與 AI 入口。實際線上介面仍以課程管理為主，創作者要完成「收集名單 → 培養關係 → 建立內容／商品 → 銷售 → 追蹤營運」時，缺少一條整體工作流。

本設計只建立產品級藍圖與後續 SR 的共同契約，不修改 runtime。現有程式碼與資料模型是可重用地基；既有進行中的 `role-based-workspace-navigation`、`app-feature-surfaces`、`newsletter-automation-integration`、`buyer-bundle-checkout-entry`、`platform-launch-verification-evidence` 保留原責任範圍。

主要限制：

- 主 repo 是 pnpm monorepo，使用 Next.js 16 App Router、React 19、TypeScript、Prisma 7/PostgreSQL、oRPC、Better Auth、TanStack Query、Vitest、Playwright。
- 現有課程、訂單、發票、電子報自動化、頁面、支援與通知資料模型已存在；新模組不得重新建立相同真相來源。
- 台灣適用性必須涵蓋 zh-TW、TWD、Asia/Taipei、PAYUNi、電子發票、LINE 與個資同意；法律結論仍需營業人與專業顧問確認。
- 部署沿用 Coolify/VPS；新的外部 provider 必須有 adapter、secret 分類、錯誤回退與回滾計畫。

## Goals / Non-Goals

**Goals:**

- 建立台灣創作者營運平台的完整模組地圖、資料生命週期與跨模組事件流。
- 用現有 `Organization`／`Member`／`Invitation` 作为團隊邊界，避免再造第二套 tenant 真相。
- 把 `User` 與 `Contact` 分開，讓尚未註冊的潛在客戶也能進入 CRM 與行銷流程。
- 以 task-based navigation、progressive disclosure 與共用 page shell 降低操作負擔。
- 將後續工作拆成可獨立測試、部署、驗收與回滾的小 SR。

**Non-Goals:**

- 本 change 不建立 CRM、網站編輯器、漏斗編輯器、SMS provider 或新的付款 endpoint。
- 本 change 不改動既有課程、PAYUNi、訂單、電子報與部署程式碼。
- 本 change 不複製 Systeme.io 的品牌、文案、元件或內部設計。
- 本 change 不決定單一 SMS 廠商、完整定價策略、跨國稅務或法律意見。
- 本 change 不把所有未來功能放進一個巨型 migration 或一個巨型 SR。

## Decisions

### 以任務導向的 Creator Operations Shell 統一平台入口

平台外層保留現有 App registry 與角色模型，但頂層工作入口按創作者任務分組：

1. 今天要做什麼：待辦、草稿、待審核、失敗寄送、待處理訂單。
2. 找到並理解客戶：聯絡人、標籤、分眾、互動紀錄。
3. 做出可賣的東西：頁面、漏斗、商品、課程、組合包、優惠券。
4. 讓客戶收到訊息：電子報、活動、工作流程、LINE 客服、SMS adapter。
5. 看懂結果：營收、轉換、名單、內容使用、寄送與付款狀態。

Alternatives Considered:
- 直接複製 Systeme.io 的八個頂部模組：否決，會帶入別人的資訊架構與術語，且無法反映 StartKiter 的課程、LINE、PAYUNi 與台灣流程。
- 維持現有課程／總管理員雙側欄：否決，現場已證實同一功能分散、手機版密度高，無法承接創作者工作流。
- 每個功能建立獨立 App 與獨立首頁：否決，會增加切換成本；App registry 只負責邊界與權限，日常任務仍需要統一工作台。

### 以 Organization 作為 Creator Workspace 的持久化邊界

領域模型把「Creator Workspace」定義為產品概念；第一版物理儲存沿用既有 `Organization`、`Member`、`Invitation`，另以一對一的 creator profile 儲存品牌、時區、預設語系與營運設定。沒有團隊的個人帳號建立私有 workspace，不另造第二套 tenant table。

Alternatives Considered:
- 新增獨立 `creator_workspace` 並與 Organization 雙向同步：否決，會產生兩套成員、邀請與權限真相。
- 只使用 User，不支援 workspace：否決，無法支援團隊協作、代理人與企業創作者。
- 把品牌設定全部塞進 Organization：否決，會讓通用帳號資料與創作者營運設定耦合；品牌設定使用一對一 profile。

### User 與 Contact 分離

`User` 代表可以登入的平台身份；`Contact` 代表創作者可以經營的關係資料。Contact 可只有 email、手機、LINE identity 或表單來源，尚未註冊也能進入名單；註冊後透過 identity link 關聯 User，不合併兩者的生命週期。

Alternatives Considered:
- 直接把 User 當 CRM 聯絡人：否決，會漏掉未註冊名單，也會讓刪除／合併／退訂影響登入身份。
- 把 CRM 外包給外部服務：否決，核心名單、同意與購買關係需要和訂單、課程權限保持同一真相。
- 只存一個 email 欄位：否決，台灣創作者需要 email、手機、LINE、來源與多次同意紀錄的可追溯關係。

### 事件驅動但可回放的 Automation Engine

跨模組副作用使用 domain event + transactional outbox。交易先完成自己的資料寫入，再以 outbox 發布事件；automation worker 以 idempotency key 取事件，建立 enrollment 與 step execution，外部寄送由 provider adapter 執行。每次執行保留狀態、錯誤、重試次數與 provider reference。

Alternatives Considered:
- 在 HTTP request 內同步寄信／加標籤：否決，會把付款、表單與寄送綁在同一個 timeout 與失敗邊界。
- 只用 cron 掃描資料表：否決，事件順序、重試與重播都難以保證。
- 先導入完整第三方 marketing automation：否決，會把核心名單與同意資料移出 StartKiter，且供應商尚未裁決。

### Provider Ports/Adapters，不在 domain 內綁定供應商

付款、電子發票、email、LINE 與 SMS 都以 domain port 接入。現有 PAYUNi、既有 email/newsletter、既有 ezPay／電子發票邊界優先包成 adapter；新 provider 只透過 adapter 加入，不讓 provider SDK 進入 `packages/api` 的業務規則。

Alternatives Considered:
- 在每個 procedure 直接呼叫 provider SDK：否決，測試、替換與回滾都會被供應商耦合。
- 一次同時支援所有台灣 provider：否決，先確定核心事件契約與一個可驗證 adapter，避免過早擴張。
- 只留空 interface、不實作現有 adapter：否決，會讓規格無法用真實事件驗證；既有 PAYUNi 與 email 必須先被包裝成可觀測 adapter。

### 台灣在產品核心，不是最後翻譯

預設 locale 為 zh-TW；貨幣使用 TWD 的整數最小單位；顯示與排程以 Asia/Taipei 為預設；地址、電話、統一編號／載具等欄位依營業人開票需求分層收集；電子報同意、退訂與個資請求保留可稽核紀錄。zh-CN／en 保留現有多語系能力，不得以硬編碼中文取代 locale catalog。

Alternatives Considered:
- 先做英文全球版再補台灣：否決，會把付款、發票、電話、時間與文案模型做成難以遷移的預設。
- 只做 zh-TW 翻譯，不改資料契約：否決，台灣適用性包含金額、發票、同意、LINE 與 provider 事件。
- 每個頁面自行判斷 locale／currency／timezone：否決，會造成頁面與寄信內容不一致；改由 workspace settings 與 request context 統一解析。

### UI/UX 以可完成任務作為驗收單位

每個核心流程先產出 user flow 與 UI contract，再寫頁面。共用頁面狀態固定包含 loading、empty、error、success、disabled、permission denied；每頁一個主要 CTA；進階設定採 progressive disclosure；桌面與手機都必須完成相同核心任務。視覺保留 StartKiter 自己的品牌與 tokens，不複製 Systeme。

Alternatives Considered:
- 先做完整 sidebar，再讓使用者自己找功能：否決，這正是目前的認知負擔來源。
- 先做視覺翻新，再補資料流程：否決，會產生漂亮但無法完成任務的空殼。
- 每個模組自行定義 empty/error/loading：否決，使用者會在不同頁面遇到不同操作語言。

## Implementation Contract

本 change 的可交付結果是規格與藍圖，不是 runtime：

- 產品藍圖必須列出角色、核心任務、模組、資料實體、事件流、台灣契約、非範圍與後續 SR。
- 六份 capability spec 必須各自列出可測試的使用者行為與錯誤邊界。
- 技術棧必須區分「現有可重用」、「需要新增」、「待決策」。
- UI/UX 契約必須列出桌面、手機、鍵盤、焦點、空狀態、錯誤狀態與權限拒絕的驗收方式。
- 本 change 完成時，`spectra analyze creator-operations-platform-blueprint --json` 無 Critical／Warning，`spectra validate creator-operations-platform-blueprint` exit 0；不執行 `spectra apply`，不宣稱 runtime 已完成。

## Risks / Trade-offs

- [Risk] 創作者平台範圍過大，藍圖變成沒有順序的功能清單 → Mitigation：以核心任務、事件流與小 SR 交付順序分層，先完成一條可用的名單到成交流程。
- [Risk] 現有 newsletter／billing SR 與新藍圖重疊 → Mitigation：藍圖只定義上層邊界；每張後續 SR 明確標記 reused／extended／new，不改寫既有已驗證契約。
- [Risk] Contact、User、Organization、Member 的關係被重複建模 → Mitigation：先固定 identity link、workspace scope 與資料擁有者，再建立 migration contract。
- [Risk] 外部 provider 回應慢、重試或重複送出 → Mitigation：outbox、idempotency、provider reference、dead-letter 與人工重送入口。
- [Risk] 手機 UI 只做縮版而沒有重排 → Mitigation：每張 UI SR 同時附 desktop/mobile flow，並以 ego-browser 實際完成任務。
- [Risk] 台灣法規或發票流程變動 → Mitigation：法規欄位與 provider adapter 分離，正式上線前由營業人與專業顧問確認。
- [Risk] 現有 Coolify/VPS 資源無法承接 worker 與事件量 → Mitigation：先做事件量、queue latency、失敗率與記憶體基線，再決定 worker 拆分與資源升級。

## Migration Plan

1. 先提交本 change 的藍圖、六份 capability spec、資料字典、UI/UX contract 與 SR 拆解；不部署 runtime。
2. 先完成既有 platform navigation／App contract／account UI 的相依 SR，再建立 Creator Operations Shell 的第一張施工 SR。
3. 新資料表採 additive migration；既有 User、Organization、Member、Order、Course、Newsletter 與 Invoice 不刪除、不改語意。
4. 新事件先寫 outbox 並以 shadow／no-op consumer 驗證，再開啟實際寄送或自動化 side effect。
5. 每一張施工 SR 都必須有 focused tests、type-check、API 行為、桌面／手機瀏覽器驗收與回滾證據。
6. 若任何新模組造成錯誤，關閉 feature flag／consumer，保留既有課程、訂單、付款與電子報流程；資料 migration 只允許向前相容，不以 destructive rollback 取代修復。

## Open Questions

- 第一個主要創作者族群是課程講師、顧問／教練、接案服務者，還是代理商；這會決定第一條 end-to-end flow。
- 第一版網站能力要做完整網站、單頁銷售頁，還是先做漏斗與表單；三者的內容模型與編輯器成本不同。
- SMS 第一個 provider、計價、台灣簡訊合規與退訂格式尚未裁決。
- Creator Workspace 是否需要正式團隊計費與多品牌管理尚未裁決；現有 Organization 可先承接成員與邀請。
- 電子發票第一版要沿用現有 ezPay adapter，還是抽象成可替換 provider port 後再接其他加值中心，尚未裁決。
- 行為分析事件保存期限、匿名化與資料匯出格式尚未裁決。

