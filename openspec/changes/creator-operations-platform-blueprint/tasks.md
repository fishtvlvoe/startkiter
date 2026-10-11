## 1. 現況與產品邊界

- [ ] 1.1 完成 repo、branch、dirty files、現有 package、資料模型、外部服務與線上 UI 的 FACT 盤點；驗證：python3 /Users/fishtv/.mirasim/skills/dev-sop/scripts/status.py /Users/fishtv/Development/B-產品/products/startkiter、實際 route 盤點與 git status --short。
- [ ] 1.2 完成「以任務導向的 Creator Operations Shell 統一平台入口」與「UI/UX 以可完成任務作為驗收單位」的資訊架構和 UX 契約；驗證：docs/blueprint/startkiter-creator-platform.md 的工作流、頂層工作區、頁面狀態與 desktop/mobile 驗收內容審查。

## 2. 平台與資料領域模型

- [ ] 2.1 完成「以 Organization 作為 Creator Workspace 的持久化邊界」與「User 與 Contact 分離」的資料責任、權限邊界與 glossary；驗證：docs/agent/glossary.md、藍圖領域模型表與 creator-platform-foundation／creator-crm-and-audience spec 審查。
- [ ] 2.2 完成「The platform SHALL expose one creator workspace context」、「Navigation SHALL be task-oriented and capability-aware」、「The platform SHALL use one shared page-state contract」、「Desktop and mobile SHALL preserve the same core task」的可測試契約；驗證：openspec/changes/creator-operations-platform-blueprint/specs/creator-platform-foundation/spec.md scenarios 審查。
- [ ] 2.3 完成「A contact SHALL be independent from a user account」、「Creators SHALL manage tags and deterministic segments」、「Consent and suppression SHALL control outreach eligibility」、「Contact imports and exports SHALL be safe and reviewable」的資料生命週期與驗收案例；驗證：creator-crm-and-audience/spec.md scenarios 審查。

## 3. 內容、商品與台灣交易

- [ ] 3.1 完成「Content and sellable products SHALL have separate responsibilities」、「A creator SHALL manage a simple website and sales flow」、「Offers SHALL connect to Taiwan checkout and order records」、「Existing course operations SHALL remain reusable」的重用與新增邊界；驗證：creator-content-and-commerce/spec.md 與藍圖 Product／Offer／Course mapping 審查。
- [ ] 3.2 完成「台灣在產品核心，不是最後翻譯」與「Provider Ports/Adapters，不在 domain 內綁定供應商」的技術決策；驗證：藍圖台灣適用性與技術棧章節、taiwan-localization-and-compliance/spec.md 審查。
- [ ] 3.3 完成「Workspace display defaults SHALL be Taiwan-ready」、「Payment and invoice providers SHALL be isolated behind adapters」、「Personal-data processing SHALL be consented and auditable」、「LINE identity and messaging SHALL keep separate purposes」的規格；驗證：taiwan-localization-and-compliance/spec.md scenarios 與官方來源連結審查。

## 4. 行銷、自動化與營運

- [ ] 4.1 完成「事件驅動但可回放的 Automation Engine」與「A creator SHALL compose and schedule a campaign」、「Automation SHALL be driven by durable events」、「Provider delivery SHALL expose observable outcomes」、「Marketing actions SHALL honor consent and unsubscribe」的事件、重試與同意邊界；驗證：creator-marketing-automation/spec.md、藍圖核心事件流與 migration plan 審查。
- [ ] 4.2 完成「The operations home SHALL show actionable creator status」、「Domain events SHALL support deterministic reporting」、「Exports SHALL be permission-aware and reproducible」、「Operational failures SHALL produce actionable alerts」的報表、匯出、告警與權限契約；驗證：creator-analytics-and-operations/spec.md scenarios 審查。
- [ ] 4.3 完成「Provider Ports/Adapters，不在 domain 內綁定供應商」下的現有 PAYUNi、email/newsletter、invoice、LINE 與未決 SMS adapter 邊界；驗證：docs/agent/source-lineage.md、docs/agent/module-catalog.md 與藍圖技術棧矩陣審查。

## 5. 技術落地與 SR 拆解

- [ ] 5.1 完成技術棧、資料 migration、outbox、feature flag、rollback 與部署限制的設計；驗證：design.md 的「Implementation Contract」、「Migration Plan」與藍圖技術棧章節審查。
- [ ] 5.2 完成後續 SR 順序：workspace foundation → contact/consent → offer/commerce → operations home → campaign/automation → landing/funnel → Taiwan billing/invoice → analytics/export → mobile/accessibility → production rollout；驗證：藍圖「開發順序」與 proposal Non-Goals 審查。
- [ ] 5.3 完成 project map、architecture map、source lineage、module catalog 與 CONTEXT.md 更新；驗證：docs/agent/ 五份入口文件存在，CONTEXT.md 指向本 change 且記錄未修改 runtime。

## 6. consistency 與交接

- [ ] 6.1 完成 proposal、design、6 份 spec、tasks、藍圖互相對照；驗證：spectra analyze creator-operations-platform-blueprint --json。
- [ ] 6.2 完成 Spectra schema validation；驗證：spectra validate creator-operations-platform-blueprint exit 0。
- [ ] 6.3 完成 handoff review：明確列出待拍板事項，禁止在未拍板前執行 spectra apply；驗證：CONTEXT.md「未解問題／下一步」與本 change proposal/design 的 Open Questions 審查。

