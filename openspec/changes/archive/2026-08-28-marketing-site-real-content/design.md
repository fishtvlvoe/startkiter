## Context

`apps/marketing` 是抽取自 supastarter 官方模板（`extract-supastarter-design-system` change 帶進來的 `design-system`／`i18n-multilingual` capability）的獨立 Next.js app，走 `startkiter.dev` 根網域（2026-08-22 定案的網域結構：本體=行銷首頁、`app.startkiter.dev`=主站、`support.startkiter.dev`=Chatwoot）。它的首頁（`apps/marketing/app/[locale]/(home)/page.tsx`）依序渲染 `HeroSection`／`FeaturesSection`／`TestimonialsSection`／`PricingSection`／`FaqSection`／`CtaSection`／`NewsletterSection`，內容全部來自 `packages/i18n/translations/<locale>/marketing.json` 的 `home.*` 與 `pricing.*` key，以及 `PricingSection.tsx` 讀取的 `packages/payments/config.ts` 的 `plans` 定義。

實測確認（2026-08-26）：
- `packages/payments/config.ts` 目前是 supastarter 原始 demo 資料（`pro` USD $29/月訂閱、`lifetime` USD $799 一次買斷、`enterprise`，讀取不存在的 `process.env.PRICE_ID_*`），跟 StartKiter 實際商品（`mvp-offer` spec 定義的 `startkiter-mvp`，8800 TWD 一次買斷）完全無關
- `packages/i18n/translations/{zh-tw,en}/marketing.json` 完全沒有 `pricing` 這個 key，`PricingSection.tsx` 內的 `t("pricing.products.*")` 系列翻譯調用會拿到空字串/undefined，畫面上定價區塊等於是空的
- `home.hero`（含 `preview` 子物件）、`home.features`、`home.testimonials`、`home.faq` 內容是 supastarter demo 文案：多租戶登入/帳單/組織功能賣點、假使用者 `Acme`／`Maya Chen`／`Jonas Weber`／`Amelia Ortiz`、假引言、訂閱制退款/免費試用問答——這些概念在 StartKiter 的商業模式（一次買斷、無組織/租戶概念，見 `openspec/config.yaml` v1 硬邊界「不做 Organization / Member / Invitation」）裡不存在
- `home.title`／`home.description`／`home.buyCta`／`home.loginCta` 這四個頂層 key **已經是正確的 StartKiter 內容**（「一次買斷，帶走課與終身代碼包」「付一次 NT$8,800」），但目前的首頁 `page.tsx` 沒有任何元件讀取這四個 key，是孤兒內容

**重要邊界澄清**：`openspec/specs/sell-flow-ux/spec.md` 的「Landing presents a sellable first viewport」Requirement，其 `@trace` 註記的程式碼路徑全部是 `apps/saas/app/*`（例如 `apps/saas/app/page.tsx`），不是 `apps/marketing`。這代表 StartKiter 現有兩個獨立的「首頁」：`apps/saas/app/page.tsx`（受 `sell-flow-ux` spec 保護、內容已正確）與 `apps/marketing` 的 supastarter 式首頁（本次要修的對象，目前沒有對應 spec 保護內容正確性）。兩者服務不同網域（`app.startkiter.dev` vs 根網域），不是同一個頁面的兩份拷貝，本次不觸碰前者。

## Goals / Non-Goals

**Goals:**

- `apps/marketing` 首頁的定價區塊顯示 StartKiter 實際商品（8800 TWD 一次買斷），不是 supastarter demo 的 USD 訂閱制方案
- `apps/marketing` 首頁的 Hero／Features／Testimonials／FAQ 內容描述 StartKiter 實際賣的東西（課程＋終身代碼包＋GitHub 代碼交付＋可掛載模組平台），不殘留 supastarter demo 的假使用者、假引言、跟本產品無關的多租戶/訂閱制概念
- README.md 的部署說明反映現行 Coolify+VPS 方向，不再呈現已作廢的 Zeabur 一鍵部署選項
- 新增 `marketing-site-content` capability，讓「行銷網站內容必須反映實際商品」成為受 spec 保護、可被 `spectra analyze` 追蹤的規則，避免未來再度出現同類 demo 內容殘留而沒人發現

**Non-Goals:**

- 不做買家技術文件站（`apps/docs`）——見另一張 change `buyer-docs-site`
- 不做行銷內容 CMS（後台可視化編輯文案）——PM 已判斷維持 supastarter 原生的檔案型內容（改 MDX/JSON + git push）即可，本次不重新論證
- 不做 VPS 正式部署本身——見另一張 change `vps-production-deployment`，本次 README 只改文案不改實際部署流程
- 不觸碰 `apps/saas/app/page.tsx` 或任何受 `sell-flow-ux` spec 保護的頁面——那是不同網域的不同頁面，內容已經正確
- 不改動 `packages/payments/checkout.ts`、`apps/saas/app/api/checkout/route.ts` 或任何實際結帳/授權邏輯，只改 `packages/payments/config.ts` 裡供行銷頁展示用的 `plans` 定義
- 不逐字重寫 Blog／Changelog／Course／Legal／Contact 頁面內容，除非掃描後發現明顯殘留 demo 資料或與產品事實衝突（若發現，視為本次 Impact 的一部分處理，不另開 change）
- 不產出具體的行銷金句/賣點文案定案版本——本次由實作者先寫出貼近產品事實的草稿內容，最終文案措辭是否要調整，留給 Fish 事後審閱（見 Open Questions），不因此卡住本次 apply

## Decisions

### Decision: 定價區塊改用單一商品卡片，不比照 supastarter 三層訂閱方案排版硬套

`PricingSection.tsx` 現有排版預期多張方案卡片並排比較（`plans.length >= 2/3/4` 觸發多欄 grid），這是為訂閱制多方案 SaaS 設計的。StartKiter 只有一個 SKU（`startkiter-mvp` 8800 TWD 一次買斷），`packages/payments/config.ts` 的 `plans` 改成只保留一個對應 `startkiter-mvp` 的方案定義（`type: "one-time"`, `amount: 8800`, `currency: "TWD"`），讓現有排版邏輯自然渲染成單欄卡片。實際渲染驗證另外發現元件仍會在非訂閱設定下插入免費卡，且 TWD 會被格式化成美元樣式，因此以最小修改移除免費卡注入並固定顯示 `NT$8,800`。

Alternatives Considered:
- 保留多方案排版，硬湊出「基本版／進階版／企業版」多層假方案 → 否決：`mvp-offer` spec 明文「MVP product SHALL be one SKU」，湊多方案等於製造出跟結帳邏輯不符的展示內容，重蹈這次要修的覆轍
- 完全重寫 `PricingSection.tsx` 為客製化單商品版面 → 否決：現有元件邏輯本來就支援單一方案渲染（`plans.length === 1` 時不觸發多欄 grid）；本次只補上實測發現的免費卡注入與 TWD 顯示問題，改動範圍仍維持最小

### Decision: i18n 內容改動涵蓋全部六個語言檔，但以 zh-tw 為準稿、其餘語言先用直譯佔位

StartKiter i18n 起跳語言是 zh-tw／zh-cn／en（`openspec/config.yaml` context），`packages/i18n/translations/` 底下另外還有 de／fr／es 三個語言目錄（supastarter 原生保留）。本次 `pricing`／`home.hero`／`home.features`／`home.testimonials`／`home.faq` 六個 key 區塊，六個語言檔都要補齊結構（不能有些語言缺 key 導致 fallback 到 zh-tw 顯示錯誤語言），但 de／fr／es 三語的實際文案內容用「zh-tw 內容的直譯」處理即可，不用另外斟酌在地化語氣，因為這三語目前不是 v1 起跳語言，內容正確性優先於文筆道地。

Alternatives Considered:
- 只改 zh-tw／zh-cn／en 三個起跳語言，de／fr／es 維持現有 demo 內容或留空 → 否決：`i18n-multilingual` spec 要求「At least three locales are supported at launch」，若 de/fr/es 頁面繼續顯示 supastarter demo 內容，訪客切換到那三語會看到跟中英文版本矛盾的錯誤商品資訊，比索性補齊直譯更容易造成信任問題
- 六語言都找專業母語者潤飾 → 否決：超出本次「修正錯誤內容」的範圍，屬於後續在地化精修工作，不阻塞本次要解決的「顯示假資料」問題

### Decision: README 部署段落改為文字說明現行 Coolify+VPS 方向，不放尚未完成的具體操作步驟

README.md「一鍵部署」段落現有 Zeabur 按鈕連結拿掉；不新增 Coolify 一鍵部署按鈕或具體 VPS 部署步驟，因為「怎麼把 StartKiter 主站真的部署上去的實際步驟」是另一張 change `vps-production-deployment` 的範圍且尚未完成。本次改成一段簡短文字說明：現行部署走 Coolify + VPS 自架，具體步驟另見文件（先指向 `docs/coolify-vps-setup-runbook.md`，待 `vps-production-deployment` change 完成後再視情況更新連結指向該張 change 產出的正式文件）。

Alternatives Considered:
- 直接留白，不提部署方式 → 否決：README 是買家/訪客理解專案的第一份文件，完全不提部署方式會讓人誤以為專案沒有部署路徑
- 等 `vps-production-deployment` change 完成後再一起改 README → 否決：現在 README 顯示的 Zeabur 按鈕是**主動誤導**（訪客點下去會導向已經停用的部署路徑），比起「留白待補」更急迫，應該先移除錯誤資訊，具體步驟可以晚一點再補

## Implementation Contract

**Behavior:**
- 訪客開啟 `apps/marketing` 首頁，定價區塊顯示「NT$8,800 一次買斷」單一商品卡片，卡片文案（標題/描述/features）為繁中且描述 StartKiter 實際提供的內容（課程＋終身代碼包＋GitHub 代碼交付），不再是空白
- Hero／Features／Testimonials／FAQ 區塊文案改為描述 StartKiter 實際產品事實，不出現 `Acme`／`Maya Chen`／`Jonas Weber`／`Amelia Ortiz` 等假使用者、不出現「組織」「租戶」「訂閱取消」「免費試用」等跟本產品商業模式無關的概念
- README.md 開啟後，部署段落文字指向 Coolify+VPS 方向，不含任何導向 Zeabur 的連結或按鈕

**Interface / data shape:**
- `packages/payments/config.ts` 的 `PaymentsConfig["plans"]` 只保留一個 key（例如 `startkiter-mvp`），其 `prices` 陣列只含一筆 `{ type: "one-time", amount: 8800, currency: "TWD" }`（不含 `priceId` 讀取不存在環境變數的寫法，若既有型別要求 `priceId` 欄位則填固定字串常數，不讀 `process.env`）
- `packages/i18n/translations/<locale>/marketing.json` 新增／修改的 key 路徑：`pricing.badge`／`pricing.title`／`pricing.description`／`pricing.products.<planId>.title`／`pricing.products.<planId>.description`／`pricing.products.<planId>.features`（物件，value 為字串陣列項目）／`pricing.getStarted`／`pricing.monthly`／`pricing.year`／`pricing.month`（即使單一方案是一次買斷不需要月年切換，`PricingSection.tsx` 的 `hasSubscriptions` 判斷會是 false 因此不會渲染 Tabs，但這幾個 key 仍需存在避免其他共用元件讀取報錯——實作前應先確認 `hasSubscriptions` 邏輯是否真的能安全跳過這些 key，若不能則照補）；`home.hero.*`／`home.features.*`／`home.testimonials.*`／`home.faq.*` 沿用既有 key 結構，只替換 value
- `planId` 命名須跟 `packages/payments/config.ts` 的 key 一致（例如都用 `startkiter-mvp`），避免 i18n key 跟資料源頭對不上導致翻譯調用失敗

**Failure modes:**
- 若 `packages/payments/config.ts` 改動後型別檢查失敗（例如既有 `PaidPlan`／`PlanPrices` 型別要求某些欄位），須先讀 `packages/payments/types.ts` 確認型別定義，讓新的 `plans` 定義符合既有型別，不得為了塞資料而放寬既有型別的必要性檢查
- 若某語言檔漏改導致該語言版本的定價區塊或 Hero 區塊出現 `undefined`／空字串，視為本次未完成，不能以「其他語言已修好」為由結案

**Acceptance criteria:**
- `pnpm --filter @startkiter/marketing build` 或對應 type-check 指令成功
- 用 ego-browser skill 依序切換 zh-tw／zh-cn／en 三語瀏覽 `apps/marketing` 首頁，確認定價區塊顯示 NT$8,800 且無空白/undefined，Hero/Features/Testimonials/FAQ 皆為描述 StartKiter 實際產品的文字，無 `Acme`／`Maya Chen` 等假資料殘留
- `git grep -i "Maya Chen\|Acme\|Jonas Weber\|Amelia Ortiz"` 在 `packages/i18n/translations/` 與 `apps/marketing/` 範圍內回傳空結果
- README.md 不含任何 Zeabur 相關連結/按鈕文字

**Scope boundaries:**
- In scope：`packages/payments/config.ts` 的 `plans` 定義、六個語言檔的 `pricing`／`home.hero`／`home.features`／`home.testimonials`／`home.faq` key、README.md 部署段落、掃描並視情況修正 Blog／Changelog／Course/Legal/Contact 頁面殘留 demo 內容
- Out of scope：`apps/saas` 任何頁面、`apps/docs`（尚不存在）、CMS、實際 VPS 部署步驟、行銷頁面整體重排；`PricingSection.tsx` 與 `HeroWireframe.tsx` 僅因實際頁面驗證發現錯誤而做最小修正，不擴大成元件重寫

## Risks / Trade-offs

- [Risk] 掃描 Blog／Changelog／Course/Legal/Contact 頁面時可能發現範圍比預期大（例如整個 Legal 頁面法律條款文字都是 supastarter 通用範本，需要 Fish 提供真實條款內容才能換） → Mitigation: 若發現這類需要 Fish 提供事實性內容（不是工程師能自行編造的法律文字）才能完成的項目，在 tasks.md 對應 task 標記為需要 Fish 決策/提供內容，不強行編造，其餘不受影響的部分照常完成
- [Risk] de／fr／es 三語直譯內容品質可能不夠道地，未來若這三語變成正式起跳語言需要重新精修 → Mitigation: 這是刻意的權衡（見 Decision 2），已知的技術債，不影響本次要解決的「內容錯誤」問題
- [Risk] `packages/payments/config.ts` 的 `plans` 型別若被其他既有測試（例如 `packages/payments/factory.test.ts`）依賴具體的 `pro`／`lifetime`／`enterprise` key 名稱斷言，改掉 key 名稱可能連帶讓不相關的既有測試失敗 → Mitigation: 實作前先 `grep -rn "config.plans\." packages/ apps/` 找出所有讀取這個設定的呼叫點，確認除了 `PricingSection.tsx` 外沒有其他生產路徑依賴具體 plan key 名稱

## Migration Plan

1. 修改 `packages/payments/config.ts` 的 `plans` 定義
2. 六個語言檔同步補齊/修改對應 key（可平行進行，各語言檔互不依賴）
3. 修改 README.md 部署段落
4. 掃描其餘行銷頁面，視發現內容決定是否需要額外修正
5. Build + ego-browser 視覺驗證三語首頁

**Rollback**：純內容/設定變更，`git revert` 對應 commit 即可，不涉及資料庫或不可逆操作。

## Open Questions

- 首頁 Hero／Features／Testimonials 的具體行銷金句措辭（例如主打賣點要強調「AI 開發技能」還是「一次買斷不訂閱」還是「可擴充模組架構」）由實作者先寫出貼近產品事實的草稿，最終是否要調整語氣/順序，需要 Fish apply 完成後親自審閱一次首頁畫面再定案，不因此卡住本次 apply
- README「一鍵部署」段落文字要不要暫時整段拿掉、只保留「本地開發啟動方式」，等 `vps-production-deployment` change 完成後才補回部署段落，或是先放一段簡短過渡文字——留給實作者判斷，兩種做法都能滿足「不誤導訪客點進已停用的 Zeabur」這個核心要求
