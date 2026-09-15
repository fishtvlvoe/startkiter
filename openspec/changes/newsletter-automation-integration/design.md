## Context

`woomin` 專案（`/Users/fishtv/Development/B-產品/products/woomin/dev/`）已經完整開發並測試過這套系統，正式 PRD 在 `docs/prd/newsletter-prd.md`（879 行，84 需求、113 驗收標準），BDD 在 `docs/bdd/newsletter.md`。PRD §2 已經做過「統一仲裁」，解決了資料模型命名衝突的問題，本次移植直接採用 PRD §2.1 的最終命名，不重新設計。

StartKiter 現有基礎設施可直接複用：
- `packages/mail` 的 `SendEmailHandler`（依賴 `mail-provider-tosend-smtp-support` SR 完成 provider 層）
- `SiteSetting` model（加密 key-value store，`packages/database/prisma/schema.prisma:385`）可用於寄件人品牌設定，不需新建設定表
- `AdminLog` model（`packages/database/prisma/schema.prisma:296`）可直接複用做稽核記錄
- `Coupon`／`CouponRedemption`／`Bundle`／`Course` model 已存在，促銷區塊可直接關聯
- `/api/cron/*` + `CRON_SECRET` 的既有排程模式（`apps/saas/app/api/cron/course-expiration/route.ts` 等 4 個既有 cron endpoint 可參考）
- `packages/storage` 的 bucket 設定模式（`StorageBucketNamesConfig` 介面）可比照新增 `newsletter` bucket

`course-lifecycle-email` capability（已封存）的交易信邏輯（`sendWelcomeEmailsForOrder`／`sendWelcomeEmail`）與退訂機制**無任何協調點**——這正是 PRD §2.3 指出的風險：新的同意守門必須明確定義「交易信永遠不受影響」，不能讓退訂邏輯誤套用到既有交易信。

## Goals / Non-Goals

**Goals:**
- 落地 PRD Phase 0–4（PRD 自訂 MVP 等級）：資料模型仲裁、法遵地基、可靠發送引擎、撰寫體驗、分眾與促銷
- 法遵地基（同意／退訂）與發送引擎必須先於撰寫體驗與促銷功能落地（PRD 的最高原則，見 PRD 第 67 行），本次的 Wave 順序照此排列
- 拆解成可由多個外部 CLI（Codex／Cursor）平行實作的任務結構，比照 `docs/woomin-integration-master-plan.md` 的 Wave／衝突組寫法

**Non-Goals:**
- 見 proposal.md「Non-Goals」章節（送達率自動化、成效追蹤報表、CSV 匯入、A/B 測試、Double Opt-in、地區分眾等 P1/P2 項目）

## Decisions

### 資料模型命名直接採用 woomin PRD §2.1 仲裁結果，不重新設計

PRD 花了完整一個 Phase（Phase 0）解決 8 個對弈主題互相衝突的命名問題（`Campaign` vs `EmailCampaign` vs `NewsletterCampaign` 等）。本次移植直接採用最終命名（`NewsletterCampaign`／`NewsletterRecipient`／`EmailConsentLog` 等 11 個 model），不重新討論。

**Alternatives Considered**：
1. 重新設計一套更符合 StartKiter 現有命名慣例的 schema——否決，StartKiter 現有 model 命名（`Order`／`CourseSubscription`／`EmailDeliveryLog`）跟 woomin 命名慣例本來就一致（都是 PascalCase 單數），沒有衝突理由需要重新設計，且會讓 woomin 的 PRD／BDD／測試案例都對不上，增加移植風險。
2. 把 11 個表全部放進既有 `packages/database` 單一 schema 檔——採用（StartKiter 目前就是單一 `schema.prisma` 檔案的架構，不像 woomin 有拆分成多檔的證據；沿用現有慣例）。

### `assertEmailConsent` 插入點在業務層，不碰 `packages/mail` provider 層

`packages/mail` 的職責只有「怎麼把信送出去」（provider 路由），不應該知道「這封信該不該寄」。同意檢查屬於業務邏輯，插入點在呼叫 `sendEmail`之前的業務函式內（例如電子報發送引擎的批次處理迴圈），不修改 `packages/mail` 本身。這跟 `mail-provider-tosend-smtp-support` SR 的 Non-Goals「不修改 `sendWelcomeEmail` 觸發邏輯」是同一個分層原則的延伸。

**Alternatives Considered**：
1. 在 `packages/mail` 的 `send()` 內部做同意檢查——否決，PRD 明確警告這是常見錯誤（R5 風險：「插入點錯誤放 transport 層會誤殺交易信」），因為 `packages/mail` 的呼叫方包含 `sendWelcomeEmail` 這類永遠該送達的交易信，混在一起做判斷容易誤判。
2. 每個呼叫 `sendEmail` 的地方各自手寫檢查邏輯——否決，容易漏檢查、規則不一致，統一函式 `assertEmailConsent` 才能保證規則單一事實來源。

### 退訂 token 用獨立環境變數 `NEWSLETTER_UNSUBSCRIBE_SECRET`，不共用既有 auth secret

比照 PRD `CONSENT-03` 的要求，退訂 token 用 HMAC-SHA256 簽章，`secret` 獨立於認證系統的密鑰，避免認證密鑰輪替時意外讓所有退訂連結失效（或反過來，退訂密鑰外洩波及認證系統）。

**Alternatives Considered**：
1. 複用 `BETTER_AUTH_SECRET`——否決，職責混用，且 PRD 明確禁止（原文禁用 `NEXTAUTH_SECRET`，StartKiter 對應的是 `BETTER_AUTH_SECRET`）。
2. Token 存 DB 而非用 HMAC 驗算——否決，PRD 採用 HMAC 是為了「永久有效、免登入、不佔資料庫空間」，且退訂連結要能在信寄出很久後依然有效，存 DB 版本反而要處理過期／清理邏輯，增加複雜度。

### 發送引擎排程觸發：沿用既有 `/api/cron/*` + `CRON_SECRET` 模式（PRD 建議的方案 A）

新增 `apps/saas/app/api/cron/newsletter-dispatch/route.ts`，比照 `course-expiration` 既有 cron endpoint 的模式：`Authorization: Bearer ${CRON_SECRET}` 驗證、每次執行處理一批（上限筆數參考 `course-expiration` 的 500 筆／批模式）、心跳欄位記錄在 DB。

**Alternatives Considered**：
1. 常駐 worker 容器輪詢 DB job queue（PRD 方案 B，進階選項）——否決本次採用，StartKiter 目前沒有常駐 worker 容器的部署慣例，且 MVP 範圍下方案 A 已足夠；若未來發送量大到方案 A 撐不住，可另開 SR 升級。
2. 外部排程器打 endpoint（PRD 方案 C，降級選項）——否決，StartKiter 已經有 `/api/cron/*` + Coolify 部署模式可以掛排程觸發，不需要引入外部服務依賴。

### HTML sanitize：apply 階段先確認 `packages/mail` 現有 sanitizer 可否複用，不預先綁定套件

`packages/mail/emails/`（既有模板系統）可能已經有 HTML 轉義／sanitize 邏輯（`course-lifecycle-email` 的 `renderCourseWelcomeEmail` 有處理 Markdown 轉 HTML 的邏輯，可能已含防注入）。design 階段不預先鎖定要新增 `sanitize-html` 套件，交給 apply 第一個任務先查證。

**Alternatives Considered**：
1. 直接指定用 `sanitize-html` npm 套件——否決，還沒確認 StartKiter 現有代碼庫是否已有等效工具，先加任務查證比直接引入新依賴更保守。

## Implementation Contract

**行為**：
- 創作者（ADMIN／EDITOR／INSTRUCTOR）能在 `/admin/newsletter` 撰寫一封電子報（一般或促銷）、選擇收件對象、排程或立即發送；系統依 `assertEmailConsent` 規則過濾收件人，只送給同意的對象
- 任何收到電子報的使用者，信件頁尾都有可運作的退訂連結，點擊後導向 `/unsubscribe` 偏好中心頁，GET 只顯示頁面不寫入，POST 才真正生效
- 既有交易信（`course-lifecycle-email` 的歡迎信／到期提醒、購買確認）行為完全不受影響，不論收件人有沒有退訂電子報

**介面／資料形狀**：
- `assertEmailConsent(userId: string, type: "transactional" | "general" | "marketing"): Promise<{ allowed: boolean; reason?: string }>`
- Campaign 狀態機：`DRAFT → SCHEDULED → QUEUED → SENDING → (SENT | PARTIAL_FAILED | FAILED)`，另有 `PAUSED`／`CANCELLED` 分支，所有轉換必須是 DB 原子操作（`UPDATE ... WHERE status = <expected>`）
- `NewsletterRecipient` 的冪等鍵：`@@unique([campaignId, userId])` 與 `@@unique([campaignId, toEmail])`
- 退訂 token 格式：`HMAC-SHA256(NEWSLETTER_UNSUBSCRIBE_SECRET, userId + ":" + email + ":" + scope)`，`scope ∈ {all, marketing, general}`

**失敗模式**：
- 收件人 0 人時，發送前確認畫面必須阻擋，不能靜默排程後發 0 封
- Provider 呼叫失敗時，`NewsletterRecipient.status = FAILED` 並記 `errorMessage`，不重試超過既有 `packages/mail` 的行為（本次不新增 SR 層級的重試機制，`SEND-11` 失敗重試列 P1 不在本次範圍）
- 容器重啟後，`SENDING` 狀態的 campaign 靠 `lastHeartbeatAt` 逾時偵測被 cron 撿回繼續，不永久卡死

**驗收標準**：
- 每個 capability 對應的 `spec.md` 場景，見 specs/ 目錄
- 手動驗證（apply 完成後）：建立一封測試電子報，走完整流程（撰寫→選對象→發送前確認→發送→查看收件狀態），確認交易信（歡迎信）仍正常運作不受影響

**範圍邊界**：見 proposal.md「Non-Goals」；本次只做 proposal 列出的 5 個新 capability，不碰既有 `course-lifecycle-email`／`notifications` capability 的 spec 本身。

## 並行執行結構（給多代理平行派工用）

比照 `docs/woomin-integration-master-plan.md` 的寫法。這張 SR 的所有任務都在**同一個 change**（`newsletter-automation-integration`）的 tasks.md 底下，不是拆成多張獨立 SR；但 tasks.md 內部依檔案群組分 Wave，同 Wave 內可以派不同代理平行做，跨 Wave 有依賴順序。

### Wave 0（單一代理，其他 Wave 的前置）
`packages/database/prisma/schema.prisma` 的 11 個新 model + `User`/`Order` 欄位擴充 + migration。這張表其他所有 Wave 都依賴，必須第一個做完、合併，且只能一個代理做（避免多人同時改同一個 schema 檔案衝突）。

### Wave 1（可 2 個代理平行，皆依賴 Wave 0）
- **代理 A**：`packages/newsletter/lib/email-consent.ts`（`assertEmailConsent` 統一守門）+ `packages/newsletter/lib/unsubscribe-token.ts`（HMAC token）+ `apps/saas/app/(main)/unsubscribe/`（偏好中心頁）+ 結帳／註冊流程加同意 checkbox。對應 capability `newsletter-consent-compliance`。
- **代理 B**：`apps/saas/app/api/cron/newsletter-dispatch/route.ts` + `packages/newsletter/lib/send-engine.ts`（狀態機、斷點續發、Token Bucket 節流）。對應 capability `newsletter-send-engine`。這兩塊檔案不重疊，可平行；代理 B 的發送引擎呼叫 `packages/mail` 的 `sendEmail`，但同意檢查的實際呼叫點（把 `assertEmailConsent` 接進批次迴圈）要等代理 A 的函式簽章定案，此處用 design.md 已定義的簽章先行 mock，Wave 2 收斂時對齊。

### Wave 2（可 2 個代理平行，依賴 Wave 1 兩者皆完成）
- **代理 C**：`packages/newsletter/lib/render.ts`（單軌 HTML 渲染器）+ `apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/`（撰寫器 UI、草稿自動儲存、測試信）。對應 capability `newsletter-composer`。
- **代理 D**：`packages/newsletter/lib/audience.ts`（分眾條件、即時人數預估）+ 促銷專屬區塊（課程卡／優惠券／倒數，掛在代理 C 的撰寫器 UI 底下，故需等代理 C 的區塊編輯器基礎結構先有雛形——**建議代理 D 稍晚於代理 C 起步，或兩者先約定 `contentJson` 的區塊 schema 介面**）。對應 capability `newsletter-audience-targeting` + `newsletter-promo-campaign`。

### 衝突組細節
- `packages/database/prisma/schema.prisma`：Wave 0 唯一動這個檔案的任務，後續 Wave 只讀不改。
- 撰寫器 UI 的 `contentJson` 區塊 schema：代理 C 定義基礎區塊型別（標題／段落／圖片／按鈕），代理 D 在此之上擴充促銷專屬區塊型別（課程卡／優惠券／倒數）。若平行進行，兩者在 Wave 2 開始前先對齊一次型別介面（design 已在 Implementation Contract 定義核心資料形狀，細節型別留給 apply 階段的第一個任務產出共用型別檔）。

### 建議代理分派（呼應 Fish 要求的多代理＋Codex 加速）
- Wave 0：1 個代理（建議 Codex，schema 變更風險較高，需要仔細核對既有 model 沒有破壞性修改）
- Wave 1：2 個代理平行（代理 A／B，建議 Cursor + Codex 各一）
- Wave 2：2 個代理平行（代理 C／D，建議 Cursor + Codex 各一）
- 每個 Wave 完成後，比照既有流程派一個不同代理做獨立 Code Review，抓完問題才進下一 Wave

## Risks / Trade-offs

[Risk] PRD 附錄 A 的 R8：自建 email HTML 渲染器工程量被低估，Outlook／Gmail 相容性坑多 → Mitigation：`WRITE-02`／`WRITE-03` 的 table-based layout + 102KB 檢查規則已經在 PRD 明確定義，apply 階段的渲染器任務直接照抄這些規則，不自由發揮；若時間壓力大，可考慮 apply 階段評估引入 `react-email` 降低自建風險（PRD 附錄 A 也提到這個備案），但這個決策留給 apply 執行時依實際工作量判斷。

[Risk] Wave 0 的 schema migration 在 StartKiter 現有正式站資料上執行的風險（新增 `User` 欄位、11 張新表）→ Mitigation：這些欄位／表都是新增（非修改既有欄位型別），且有預設值（`marketingConsent` 預設 `null`、`generalEmailConsent` 預設 `true`），屬於低風險的 additive migration；apply 階段的驗收仍要求先在本機/測試環境跑過 migration 再合併。

[Risk] `EMAIL_PROVIDER`（`mail-provider-tosend-smtp-support` SR）若尚未 apply 完成，這張 SR 的發送引擎會卡住沒有可用的 provider → Mitigation：proposal.md 已明列此依賴，tasks.md 第一個任務會先確認該 SR 狀態，未完成則先 apply 那張。

[Risk] 4 個代理平行 Wave 1/Wave 2 若對 `contentJson` 型別介面認知不一致，事後合併會產生大量衝突 → Mitigation：design 已在「衝突組細節」明訂協調點，tasks.md 會把「定義共用型別檔」列為 Wave 2 開始前的獨立任務，由其中一個代理先做完、雙方 review 過再分頭進行。

## Migration Plan

1. Wave 0 完成 schema + migration，本機跑過 `pnpm --filter @startkiter/database migrate dev` 確認無誤，合併進 main
2. Wave 1 兩個代理平行完成，各自 Code Review 過、合併
3. Wave 2 兩個代理平行完成（確認 Wave 1 已合併、`assertEmailConsent` 簽章可用），各自 Code Review 過、合併
4. 全部合併後，一次完整的端對端驗收（依 tasks.md 最後一節）：建一封測試電子報、走完整流程、確認交易信不受影響
5. 部署：正式站容器需要新增 `NEWSLETTER_UNSUBSCRIBE_SECRET` 環境變數（不能是空字串或跟認證密鑰相同），並確認 Coolify 有排程觸發 `/api/cron/newsletter-dispatch`（比照既有 `course-expiration` cron 的觸發方式，若那個 cron 目前也沒被正確觸發——見先前排查發現 `CRON_SECRET` 正式站未設定——這張 SR 的部署清單要把這個環境變數一併補上，否則排程引擎完全不會動）
6. **回滾策略**：新增的 model／欄位都是 additive，不影響既有資料；功能層面若要緊急關閉，`/admin/newsletter` 整個路由可以透過 `packages/platform/src/mount-points.ts` 移除選單項目快速隱藏入口，不需要 revert 資料庫變更

## Open Questions

- PRD §8 列出的開放問題（Q1-Q16）多數已經在本次 Decisions 中拍板（沿用 PRD 建議值）。以下幾項留到 apply 階段依實測情況決定，不阻擋動工：
  - 單次 campaign 收件上限（PRD Q9 建議 5000-10000，StartKiter 目前使用者規模遠小於此，apply 階段可以先設一個保守值如 2000，之後依實際規模調整）
  - 發送頻率上限（PRD Q10，同上，先設保守預設值）
  - HTML sanitize 套件選擇（見 Decisions 章節，apply 第一個任務查證）
- 是否要在 Wave 0 完成後、Wave 1/2 開始前，先讓 Fish review 一次 schema 設計？（建議：是，因為這是後續所有 Wave 的地基，改起來成本最低的時間點就是現在）
