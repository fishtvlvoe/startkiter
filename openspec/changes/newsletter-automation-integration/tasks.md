## 0. 前置檢查

- [ ] 0.1 確認 `mail-provider-tosend-smtp-support` change 的實作狀態（`spectra status --change mail-provider-tosend-smtp-support --json`）：若尚未 apply 完成，先完成那張 SR，因為本張所有寄信呼叫都依賴它的 `SendEmailHandler` 介面

## 1. Wave 0：資料模型（單一代理，其他 Wave 前置依賴，對應 Decision「資料模型命名直接採用 woomin PRD §2.1 仲裁結果，不重新設計」）

- [x] 1.1 在 `packages/database/prisma/schema.prisma` 新增 `NewsletterCampaign`／`NewsletterRecipient`／`NewsletterTemplate`／`NewsletterLink`／`EmailConsentLog`／`NewsletterAlert` 六個 model（欄位對齊 woomin schema 1225-1392 行），並在 `User` model 新增 `marketingConsent`／`marketingConsentAt`／`marketingConsentSource`／`marketingConsentIp`／`generalEmailConsent`／`generalEmailConsentAt`／`unsubscribedAt`／`emailInvalidAt`／`emailBounceState`／`emailBounceCount` 欄位（對應 Requirement「User consent fields as single source of truth」）；跑 `pnpm --filter @startkiter/database generate` 確認 Prisma client 產生無錯
- [x] 1.2 新增 `NewsletterAutomation`／`NewsletterAutomationStep`／`NewsletterAutomationEnrollment`／`NewsletterAutomationDelivery`／`NewsletterAutomationOpen`／`NewsletterAutomationClick` 六個 model（欄位對齊 woomin schema 1377-1480 行），並在 `Order` model 新增 `newsletterCampaignId` 欄位；跑 `pnpm --filter @startkiter/database generate` 確認無錯
- [x] 1.3 產生 migration（`pnpm --filter @startkiter/database migrate dev --name add_newsletter_automation`），本機資料庫跑過 migration 無報錯，確認既有資料表與資料不受影響（`git diff` 檢查 migration SQL 只有 `CREATE TABLE`／`ALTER TABLE ADD COLUMN`，沒有任何 `DROP`／`ALTER COLUMN TYPE`）

## 2. Wave 1A：法遵地基（可與 Wave 1B 平行，依賴 Wave 0，對應 capability `newsletter-consent-compliance`）

### 紅燈測試

- [x] 2.1 在 `packages/newsletter/lib/email-consent.test.ts` 寫紅燈測試涵蓋「Unified consent gate assertEmailConsent」全部場景（transactional 永遠允許、hard-bounce 擋 transactional、marketing 需明確 true、general 預設允許）與「Consent gate is not embedded in the mail transport layer」（斷言 `packages/mail` 的 provider 路由代碼不 import `assertEmailConsent`），確認測試先失敗（函式尚未存在）
- [x] 2.2 在 `packages/newsletter/lib/unsubscribe-token.test.ts` 寫紅燈測試涵蓋「HMAC unsubscribe token」（token scope 綁進簽章、換 scope 驗算失敗）與「退訂 token 用獨立環境變數 NEWSLETTER_UNSUBSCRIBE_SECRET」Decision（斷言簽章函式讀取 `NEWSLETTER_UNSUBSCRIBE_SECRET` 而非 `BETTER_AUTH_SECRET`）
- [x] 2.3 在 `apps/saas/app/(main)/unsubscribe/page.test.tsx` 與對應 API route 測試檔寫紅燈測試涵蓋「Unsubscribe page separates read from write」（GET 請求不寫 DB、POST 才生效）與「General unsubscribe does not affect marketing or transactional consent」場景

### 實作

- [x] 2.4 新增 `packages/newsletter/lib/email-consent.ts` 實作 `assertEmailConsent(userId, type)`（依 Decision「assertEmailConsent 插入點在業務層，不碰 packages/mail provider 層」，此函式放在 `packages/newsletter` 而非 `packages/mail`），含「Consent audit log」寫入 `EmailConsentLog`；跑 2.1 的測試轉綠燈
- [x] 2.5 新增 `packages/newsletter/lib/unsubscribe-token.ts` 實作 HMAC token 產生與驗算；跑 2.2 的測試轉綠燈
- [x] 2.6 新增 `apps/saas/app/(main)/unsubscribe/page.tsx`（偏好中心頁：促銷／一般／全部三個開關）與對應 POST API route；跑 2.3 的測試轉綠燈
- [x] 2.7 在既有結帳流程與註冊流程新增行銷同意 checkbox（預設不勾，對應「Consent audit log」的 `source="checkout"`／`source="register"` 場景），提交時呼叫 `EmailConsentLog` 寫入；補對應測試
- [x] 2.8 新增「Compliant footer with sender address gate」：在既有 `SiteSetting` 機制新增寄件人實體地址設定欄位，新增檢查函式在促銷 campaign 啟動前呼叫；寫測試涵蓋「地址未填阻擋啟動」場景

## 3. Wave 1B：發送引擎（可與 Wave 1A 平行，依賴 Wave 0，對應 capability `newsletter-send-engine`）

### 紅燈測試

- [x] 3.1 在 `packages/newsletter/lib/send-engine.test.ts` 寫紅燈測試涵蓋「Campaign state machine with atomic transitions」（雙擊立即發送只成功一次、終態不可回退）
- [x] 3.2 補紅燈測試涵蓋「Idempotent recipient dispatch with resume」（模擬容器重啟後從斷點續發，不重寄已完成筆數）與「Pause, resume, and cancel」
- [x] 3.3 補紅燈測試涵蓋「Rate-limited dispatch」（跨批次窗速率節流）、「Consent re-checked at dispatch time, not at campaign creation」（發送當下重查同意狀態）、「Zero eligible recipients blocks send」、「Sender configuration snapshot locked at send time」
- [x] 3.4 在 `apps/saas/app/api/cron/newsletter-dispatch/route.test.ts` 寫紅燈測試涵蓋「Cron performs only atomic scheduling transitions」（近同時兩次觸發只轉換一次狀態），比照既有 `apps/saas/app/api/cron/course-expiration/route.test.ts` 的測試模式

### 實作

- [x] 3.5 新增 `packages/newsletter/lib/send-engine.ts` 實作 Campaign 狀態機（原子 DB 轉換）與斷點續發批次處理邏輯；跑 3.1／3.2 的測試轉綠燈
- [x] 3.6 在 `send-engine.ts` 實作 Token Bucket 速率節流、發送當下同意重查（呼叫 Wave 1A 的 `assertEmailConsent`，此任務需等 2.4 完成或先用已定案的函式簽章 mock）、零收件人阻擋、`senderSnapshot` 鎖定；跑 3.3 的測試轉綠燈
- [x] 3.7 新增 `apps/saas/app/api/cron/newsletter-dispatch/route.ts`（對應 Decision「發送引擎排程觸發：沿用既有 /api/cron/* + CRON_SECRET 模式」，比照 `course-expiration/route.ts` 的 `CRON_SECRET` 驗證與批次處理模式）；跑 3.4 的測試轉綠燈

## 4. Wave 1 收斂

- [x] 4.1 確認 Wave 1A（`assertEmailConsent` 簽章）與 Wave 1B（`send-engine.ts` 對它的呼叫）介面一致，跑 `packages/newsletter` 全套測試（`pnpm --filter @startkiter/newsletter test`）確認整合後全綠
- [ ] 4.2 派一個不同於 Wave 1A／1B 實作者的代理做 Code Review（correctness／security／performance），聚焦「Consent gate is not embedded in the mail transport layer」是否真的沒有被繞過、HMAC 驗算是否用固定時間比對；Critical 清零才進 Wave 2

## 5. Wave 2C：撰寫器（design.md「並行執行結構」章節定義的 Wave 2（可 2 個代理平行，依賴 Wave 1 兩者皆完成）之一，可與 Wave 2D 平行，依賴 Wave 1 收斂完成，對應 capability `newsletter-composer`；建議代理分派見 design.md「建議代理分派（呼應 Fish 要求的多代理＋Codex 加速）」）

### 紅燈測試

- [ ] 5.1 在 `packages/newsletter/lib/render.test.ts` 寫紅燈測試涵蓋「Single rendering path for preview, test send, and real send」（比對兩次渲染輸出除測試 banner 外一致）、「Table-based inline-style HTML output」（斷言輸出不含 `<style>`／`display:flex`／`display:grid`）
- [ ] 5.2 補紅燈測試涵蓋「HTML size guard」（>102KB 觸發警告）、「Server-side HTML sanitization」（`<script>` 被移除）、「Automatic plain-text alternative」（輸出含非空純文字版）
- [ ] 5.3 在對應撰寫器 UI 測試檔寫紅燈測試涵蓋「Draft autosave」（idle 後自動儲存）、「Test send restricted to internal accounts」（非內部帳號被拒）、「Send confirmation with recipient estimate」（確認畫面顯示人數、二次提交被擋）

### 實作

- [ ] 5.4 先查證 `packages/mail`／既有 `renderCourseWelcomeEmail` 是否已有可複用的 HTML sanitize 邏輯（對應 Decision「HTML sanitize：apply 階段先確認 packages/mail 現有 sanitizer 可否複用」），有則複用、沒有則評估引入套件，記錄決定
- [ ] 5.5 新增 `packages/newsletter/lib/render.ts`（單軌渲染器 `renderCampaignHtml`）與純文字轉換邏輯；跑 5.1／5.2 的測試轉綠燈
- [ ] 5.6 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/`（列表頁、撰寫器：區塊編輯、草稿自動儲存、測試信、發送前確認對話框）；跑 5.3 的測試轉綠燈；依 design.md「衝突組細節」的協調點，在此任務中定義並匯出 `contentJson` 基礎區塊型別（標題／段落／圖片／按鈕／分隔線／影片卡），供 Wave 2D 的促銷區塊擴充
- [ ] 5.7 在 `packages/platform/src/mount-points.ts` 新增 `newsletter` 選單項目，掛載到 `/admin/newsletter`

## 6. Wave 2D：分眾與促銷（可與 Wave 2C 平行，依賴 Wave 1 收斂完成，對應 capability `newsletter-audience-targeting` 與 `newsletter-promo-campaign`）

### 紅燈測試

- [ ] 6.1 在 `packages/newsletter/lib/audience.test.ts` 寫紅燈測試涵蓋「Single-layer AND/OR audience conditions」、「Live deduplicated recipient estimate」（OR 模式去重人數）、「Automatic exclusion of unsubscribed and invalid recipients」、「Deduplication by recipient email」、「Audience recomputed at dispatch time」
- [ ] 6.2 補紅燈測試涵蓋「Send to all or manually selected recipients」
- [ ] 6.3 在對應促銷區塊測試檔寫紅燈測試涵蓋「Coupon block bound to an existing coupon」（券碼欄位唯讀）、「Coupon validity checked before send」（過期券阻擋發送）、「Course/bundle CTA card pulled from catalog data」（價格唯讀）、「Static countdown text」（無 JS 動態計時）、「Automatic UTM tagging on promotional links」、「Marketing consent lock on promotional audience」（API 層繞過 UI 仍被拒）

### 實作

- [ ] 6.4 新增 `packages/newsletter/lib/audience.ts` 實作分眾條件查詢、即時人數預估（debounce）、去重邏輯；跑 6.1／6.2 的測試轉綠燈
- [ ] 6.5 依 Wave 2C（5.6）定義的 `contentJson` 基礎區塊型別，擴充促銷專屬區塊型別（課程卡／優惠券／靜態倒數），並在 `render.ts` 新增對應的渲染邏輯（優惠券綁定唯讀、課程卡自動帶價、倒數純文字、UTM 自動標記）；跑 6.3 的測試轉綠燈
- [ ] 6.6 在分眾 UI／發送 API 實作「促銷模式強制鎖定行銷同意篩選」（對應 `newsletter-promo-campaign` 的 Marketing consent lock 需求），確保 UI 層 disabled 且 API 層有獨立校驗，不只靠前端限制

## 7. Wave 2 收斂與整體驗收

- [ ] 7.1 確認 Wave 2C（`contentJson` 基礎型別）與 Wave 2D（促銷區塊擴充型別）介面一致，跑 `packages/newsletter` 全套測試確認整合後全綠
- [ ] 7.2 派一個不同於 Wave 2C／2D 實作者的代理做 Code Review（correctness／security／performance），聚焦「Marketing consent lock on promotional audience」的 API 層防繞過是否確實生效、`renderCampaignHtml` 是否真的是唯一渲染路徑；Critical 清零才進下一步
- [ ] 7.3 跑整套 `pnpm test`／`pnpm type-check`／`pnpm build`，確認全數 exit code 0
- [ ] 7.4 端對端手動驗證（ego-browser 或等效工具）：以 ADMIN 身分建立一封測試促銷電子報（含優惠券區塊）、送測試信給自己、確認渲染與退訂連結正常，接著實際排程/發送給一個測試分眾（少量收件人），確認 `NewsletterRecipient` 狀態正確、收件人真的收到信、退訂連結點擊後偏好中心正常運作
- [ ] 7.5 端對端手動驗證：確認既有交易信（`course-lifecycle-email` 的歡迎信、到期提醒）在本次改動後行為完全不受影響（挑一筆既有測試訂單觸發歡迎信，確認正常送達，不受任何 `assertEmailConsent` 的 `general`/`marketing` 判斷影響）
- [ ] 7.6 `spectra analyze`／`spectra validate` 通過，`git status` 乾淨、已 commit

## 8. 部署提醒（apply 完成、合併後的手動動作，不是程式碼任務）

- [ ] 8.1 提醒 Fish：正式站容器需要新增環境變數 `NEWSLETTER_UNSUBSCRIBE_SECRET`（獨立於 `BETTER_AUTH_SECRET` 的隨機字串），並確認 Coolify 有排程觸發 `/api/cron/newsletter-dispatch`；同時提醒先前排查發現 `CRON_SECRET` 正式站完全未設定，若不一併補上，包括這次新增的排程在內的所有 `/api/cron/*` 端點都無法運作
