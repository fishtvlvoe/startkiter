## Why

創作者目前若要寄電子報／促銷信，只能把學員名單匯出到外部工具（Mailchimp／ConvertKit），造成資料外流風險、名單與購買狀態脫節、無法依「買過哪門課」精準分眾、退訂狀態與平台不同步。姊妹專案 `woomin` 已經完整開發並測試過這套「電子報自動化」系統（6528 行代碼、11 個資料表、8 支測試、完整 PRD 與 BDD），現在要把這套系統移植進 StartKiter，讓學員資料、購買行為、優惠券、發送與退訂形成單一閉環。

這是姊妹專案功能移植計畫（`docs/woomin-integration-master-plan.md`）本次規劃排查時發現的缺口：該總表涵蓋 15 張課程模組 SR，但完全沒有排入這套電子報系統，本次另開一張 SR 補上。

## What Changes

依 woomin PRD（`/Users/fishtv/Development/B-產品/products/woomin/dev/docs/prd/newsletter-prd.md`）§9 開發里程碑的 Phase 0–4（PRD 自訂 MVP 等級），移植以下能力：

- 新增 11 個資料表（`NewsletterCampaign`／`NewsletterRecipient`／`NewsletterTemplate`／`NewsletterLink`／`EmailConsentLog`／`NewsletterAlert`／`NewsletterAutomation`／`NewsletterAutomationStep`／`NewsletterAutomationEnrollment`／`NewsletterAutomationDelivery`／`NewsletterAutomationOpen`／`NewsletterAutomationClick`），命名與欄位對齊 woomin schema（PRD §2.1 單一事實來源仲裁結果）
- `User` model 新增行銷同意／退訂欄位：`marketingConsent`／`marketingConsentAt`／`marketingConsentSource`／`marketingConsentIp`／`generalEmailConsent`／`generalEmailConsentAt`／`unsubscribedAt`／`emailInvalidAt`／`emailBounceState`／`emailBounceCount`
- `Order` model 新增 `newsletterCampaignId`（歸因用，見 PROMO-07／ANALYTICS-05，本次只加欄位與寫入時機，完整歸因報表列 Non-Goals）
- 新增統一同意守門函式 `assertEmailConsent(userId, type: 'transactional' | 'general' | 'marketing')`，插入點在業務層（呼叫寄信前），不放進 `packages/mail` transport 層，避免誤殺既有交易信（購買確認、`course-lifecycle-email` 歡迎信、到期提醒）
- 新增 HMAC 免登入退訂 token 機制與 `/unsubscribe` 偏好中心頁（`NEWSLETTER_UNSUBSCRIBE_SECRET` 獨立環境變數，不用 `BETTER_AUTH_SECRET`）
- 新增後台「電子報」管理區（`/admin/newsletter`）：撰寫體驗（區塊編輯器＋單軌 HTML 渲染器）、對象管理與分眾（單層 AND／OR）、促銷專屬區塊（課程卡／優惠券／靜態倒數）、寄送前法遵 Checklist
- 新增排程與發送引擎：調度／執行分離架構（cron 做原子狀態轉換，批次引擎做實際發送），斷點續發、冪等鍵、Token Bucket 速率節流，沿用既有 `/api/cron/*` + `CRON_SECRET` 模式
- 依賴（前置）：`mail-provider-tosend-smtp-support`（已規劃、park 狀態）——電子報引擎透過 `packages/mail` 的 `SendEmailHandler` 送信，需要該 SR 先完成，`List-Unsubscribe` header 才有 provider 層可以透傳

## Non-Goals

- **不做 PRD §3.7 送達率模組（DELIV）的自動化部分**（P1）：Resend webhook 接收退信／投訴（`DELIV-01/02/03`）、退信率自動暫停、SPF/DKIM/DMARC 設定引導。本次只做 `User.emailBounceState` 欄位與手動維護入口，硬退／投訴事件的自動 webhook 處理另開 SR
- **不做 PRD §3.8 成效分析模組（ANALYTICS）的追蹤與報表**（P1／P2）：開信像素、點擊改寫追蹤、PostHog 事件、CSV 匯出。本次只落地 `NewsletterLink`／開信/點擊統計欄位的 schema，不做追蹤端點與報表 UI
- **不做地區／語言分眾與雙幣別自動分版**（`AUD-08`／`PROMO-08` P2）：`User.locale`／`country` 欄位命名先保留但本次不做資料收集流程與分眾條件
- **不做 CSV 外部名單匯入**（`AUD-06` P1）：本次僅支援站內既有使用者的全發／條件分眾／手動勾選
- **不做 A/B 測試**（`PROMO-09` P2）
- **不做 Double Opt-in**（`CONSENT-12` P2）
- **不做另存為自訂模板**（`TMPL-05` P1）與**可重用內容區塊庫**（`TMPL-07` P2）：本次僅提供固定內建版型
- **不做並發編輯鎖定的樂觀鎖 UI 提示**（`WRITE-08` 的完整版）：本次先用「後儲存者覆蓋前者」的簡化行為，衝突偵測列後續加強
- **不做主力市場法遵模式下拉選單**（`CONSENT-10` P1）：統一採 PRD 建議的「香港 PDPO opt-in 最嚴格基準」全平台套用，不提供地區切換 UI
- **不搬遷 SalesChat/SalesInquiry**：woomin schema 自己標注為舊版相容用途，與 StartKiter 既有 `unified-support-desk`（Chatwoot）功能重疊
- **不修改來源專案** `woomin`：本次只讀取其代碼與文件作為移植藍本，不修改該 repo 任何檔案

## Capabilities

### New Capabilities

- `newsletter-consent-compliance`: User 同意／退訂欄位、`EmailConsentLog` 稽核、`assertEmailConsent` 統一守門、HMAC 退訂 token 與偏好中心頁、合規頁尾與實體地址閘門（PRD Phase 0–1，`CONSENT-*`）
- `newsletter-send-engine`: Campaign 狀態機、斷點續發批次引擎、Zeabur 友善排程觸發、Token Bucket 速率節流、`senderSnapshot` 鎖定（PRD Phase 2，`SEND-*`）
- `newsletter-composer`: 區塊式編輯器、單軌 HTML 渲染器、相容性護欄、sanitize、草稿自動儲存、測試信（PRD Phase 3，`WRITE-*`／`TMPL-*`）
- `newsletter-audience-targeting`: 全發／批次勾選、單層 AND／OR 分眾、即時人數預估、自動排除去重（PRD Phase 4 前半，`AUD-*`）
- `newsletter-promo-campaign`: 優惠券綁定與防超賣、課程／組合包 CTA 卡、靜態倒數、UTM 自動標記（PRD Phase 4 後半，`PROMO-*`）

### Modified Capabilities

（無：既有交易信邏輯不變，只是新增一個「同意檢查」的協調點，該協調點屬於新 capability `newsletter-consent-compliance` 的職責，不修改任何既有 capability 的 spec 行為）

## Impact

- Affected specs: `newsletter-consent-compliance`（新增）、`newsletter-send-engine`（新增）、`newsletter-composer`（新增）、`newsletter-audience-targeting`（新增）、`newsletter-promo-campaign`（新增）
- Affected code（依 Wave 分批，詳見 design.md「並行執行結構」）：
  - `packages/database/prisma/schema.prisma`（新增 11 model + `User`/`Order` 欄位擴充 + migration）
  - `packages/newsletter/`（新套件：`lib/email-consent.ts`、`lib/send-engine.ts`、`lib/audience.ts`、`lib/render.ts`、`lib/unsubscribe-token.ts`）
  - `apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/`（後台撰寫／分眾／列表頁）
  - `apps/saas/app/(main)/unsubscribe/`（免登入退訂偏好中心頁）
  - `apps/saas/app/api/cron/newsletter-dispatch/route.ts`（新增 cron 端點）
  - `apps/saas/app/(authenticated)/(main)/(account)/settings/`（結帳／註冊流程新增行銷同意 checkbox）
  - `packages/platform/src/mount-points.ts`（新增 `newsletter` 選單項目）
  - `.env.example`（新增 `NEWSLETTER_UNSUBSCRIBE_SECRET`）
- Dependencies 新增：無新 npm 套件（HTML sanitize 用既有可用的 `sanitize-html` 或等效套件，apply 階段確認 `packages/mail` 是否已有可複用的 sanitizer）
- 前置依賴：`mail-provider-tosend-smtp-support`（park 狀態，需先 apply 完成，本次的 `SendEmailHandler` 呼叫與 `List-Unsubscribe` header 透傳都依賴它）
- 環境變數新增：`NEWSLETTER_UNSUBSCRIBE_SECRET`
