## Context

StartKiter 目前只有一次買斷金流路徑：`packages/payments/factory.ts` 的 `createMvpCheckoutGateway` 寫死只認 `"payuni"` 字串，回傳具體型別 `PayUniOneTimeGateway`，沒有共同 interface；`packages/payments/provider/index.ts` 同時 export 了 supastarter 底盤原生的 `stripe/index.ts`（完整實作，走 Stripe subscription/checkout API），但 `packages/payments/factory.test.ts` 明確測試「rejects shopline and stripe for MVP checkout」，確保這條一次性金流路徑 fail-closed 不會誤用 Stripe。這次新增訂閱制付費，不動這條既有一次性路徑（那是已封存 `payuni-checkout` capability），而是新增一條平行的訂閱路徑。

`openspec/specs/mvp-offer/spec.md` 現有 Requirement 明文規定「Checkout for the MVP SKU specifically MUST always charge 8800 TWD and MUST NOT offer a second paid tier for that SKU」——`startkiter-mvp` 這個 SKU 本身不能有第二付費層級，因此訂閱制必須走新 SKU `startkiter-mvp-subscription`，指向同一門課程內容，而不是讓 `startkiter-mvp` 自己多一種計價。

`openspec/config.yaml` 的 v1 硬邊界原本寫死「一次買斷 TWD，不做月繳、不做三階」，已於本次 propose 階段同步修正為「`startkiter-mvp` 維持 8800 一次買斷；另提供 `startkiter-mvp-subscription` 訂閱方案，同一門課支援兩種付費並存，仍不做三階定價」。

PAYUNi 定期定額（幕後交易 TokenAPI）需要另外向 PAYUNi 申請授權文件才能取得完整 API 規格；Fish 確認已申請取得文件。本機沒有該文件的直接副本，但 `/Users/fishtv/Development/products/woomin/realms/` 已有生產驗證過的完整實作可供照抄 API 呼叫規格：`lib/payment/payuni-gateway.ts`（`createSubscriptionSession`／`cancelSubscription`／`requestPeriodMdfStatus`／`queryPeriod`）、`lib/subscription/payuni-period.ts`、`lib/subscription/payuni-query.ts`、`app/api/payment/period-notify/route.ts`、`prisma/schema.prisma` 的 `CourseSubscriptionPlan`／`CourseSubscription`／`PaymentWebhookEvent` model。

Fish 在 propose 過程中明確要求：架構不能寫死成只服務 MVP 這一門課、只服務 PAYUNi 這一家金流、完全不留發票串接空間——「金流未來會越來越多」「沒留端口後面要改很麻煩」。這份 design 的多個 Decision 直接回應這個要求。

## Goals / Non-Goals

**Goals:**

- 買家可用月繳或年繳訂閱 `startkiter-mvp-subscription`，取得與 `startkiter-mvp` 相同的課程存取權
- `CourseSubscriptionPlan.courseId` 為通用外鍵，架構上任何課程都能建立訂閱方案，不寫死鎖定 MVP 課程
- 訂閱扣款流程透過通用 `SubscriptionGateway` interface 呼叫，`PayUniPeriodGateway` 是第一個實作，未來加其他金流商的訂閱功能時比照這個 interface 寫新類別，不需重寫呼叫端
- Webhook 入帳採用 claim-based 事件冪等（新增 `PaymentWebhookEvent` 表），避免 PAYUNi 重送通知造成重複入帳或並發寫入
- `CourseSubscription` 預留 `invoice*` 系列欄位（nullable，不做任何發票邏輯），供未來 `@paid-tw/einvoice*` 串接直接使用，不需要再開一次 migration
- 取消訂閱後立即收回課程權限

**Non-Goals:**

- 不做多方案管理後台 UI（本次以 seed script／直接寫入資料庫建立 plan 記錄）
- 不做補扣／重新授權（reauth）機制，PAYUNi mdfStatus 的 `ReviseTradeStatus=reauth` 這次不實作
- 不做 PAST_DUE 後續提醒流程與管理員告警
- 不做 Stripe 或其他金流商的訂閱「實作」，只做抽象 interface 讓未來能接
- 不做真實發票開立邏輯，`invoice*` 欄位只是預留，不觸發任何 einvoice API 呼叫
- 不做多堂課同時訂閱／購物車流程，一次訂閱對應一個 plan

## Decisions

### Decision: 新增獨立 SKU startkiter-mvp-subscription，不修改 startkiter-mvp 定價規則

`startkiter-mvp` 受 `mvp-offer` spec 的 Requirement「Single MVP SKU price」約束，明文禁止該 SKU 有第二付費層級。訂閱制改用新 SKU `startkiter-mvp-subscription`，兩個 SKU 都指向同一門課程（`courseId` 相同），`canAccessCourseId` 判斷時不分辨買家是透過哪個 SKU 取得權限，只看是否存在有效的 Order（一次買斷）或 ACTIVE CourseSubscription（訂閱）。

Alternatives Considered:
- 直接讓 `startkiter-mvp` 這個 SKU 同時支援一次買斷與訂閱兩種計價 → 否決：直接違反 `mvp-offer` spec 既有 Requirement 與其測試斷言，且會讓「這個 SKU 多少錢」失去單一意義
- 訂閱做成完全獨立商品目錄，不與 `startkiter-mvp` 綁定同一門課程內容 → 否決：Fish 明確要求「同一門課」，訂閱是付費模式的選項，不是新課程

### Decision: CourseSubscriptionPlan.courseId 為通用外鍵，MVP 範圍先為 MVP 課程建一筆 plan

`CourseSubscriptionPlan` 的 `courseId` 是一般外鍵欄位（`@relation`），不是寫死的常數判斷。MVP 範圍內只透過 seed script 為 MVP 課程建立兩筆 plan 記錄（月繳、年繳），但 schema 與 `PayUniPeriodGateway.createSubscriptionSession` 的實作都不假設「只會有一門課」，任何課程都能比照建立新的 plan 記錄而不需要修改 schema 或 gateway 代碼。

Alternatives Considered:
- 用常數（如 `MVP_COURSE_ID`）寫死在 `packages/payments/constants.ts`，`createSubscriptionSession` 內部判斷 courseId 是否等於該常數 → 否決：Fish 明確要求不要寫死，未來每加一門課都要改代碼
- 這次就做完整的多課程訂閱管理後台 UI → 否決：超出 MVP Non-Goals 範圍，本次只需要架構上不寫死，不需要真的做管理介面

### Decision: 新增 SubscriptionGateway interface，PayUniPeriodGateway 是首個實作

在 `packages/payments/types.ts` 新增 `SubscriptionGateway` interface，定義 `createSubscriptionSession(params): Promise<FormPostResult>`、`cancelSubscription(params): Promise<{ success: boolean; error?: string }>`、`queryPeriod(periodTradeNo: string): Promise<PayUniPeriodQueryResult>` 三個方法簽名。`packages/payments/provider/payuni/period-gateway.ts` 的 `PayUniPeriodGateway` class 實作此 interface。呼叫端（checkout 頁面、webhook route、取消訂閱 action）一律透過 `SubscriptionGateway` 型別操作，不直接引用 `PayUniPeriodGateway` 具體類別，換一家金流商只需要新增一個實作此 interface 的類別。

Alternatives Considered:
- 直接在 checkout route handler／webhook route 裡寫死呼叫 `PayUniPeriodGateway` 的具體方法，不抽 interface → 否決：Fish 明確指出「金流未來會越來越多」，之後加第二家金流商的訂閱功能要整個重寫呼叫端
- 照抄 woomin 完整的多 gateway 工廠模式（含 Stripe subscription 的完整實作與 `getGatewayByType` 動態載入）→ 否決：超出這次 SR 範圍，這次只有 PAYUNi 一家要接，先把 interface 留好，不需要現在就寫一個用不到的 Stripe 訂閱實作

### Decision: 新增簡化版 PaymentWebhookEvent 表做 claim-based 冪等

`period-notify` webhook 收到通知後，先用 `fingerprintPayUniPeriodEvent(decrypted)` 算出事件指紋，寫入 `PaymentWebhookEvent`（`gateway`／`eventId`／`eventType`／`payload`／`status`，`status` 為 `PROCESSING`／`COMPLETED`／`FAILED`）。`@@unique([gateway, eventId])` 確保同一事件只會被 claim 一次：重複到達的通知在 insert 時因唯一鍵衝突而被視為 `DUPLICATE`，直接回 200 不重複處理；claim 成功才繼續往下寫入 `CourseSubscription` 狀態。這是 woomin `claimWebhookEvent`／`completeWebhookEvent`／`failWebhookEvent` 的簡化版，不含 woomin 額外的 5 分鐘 lease 逾時重試機制。

Alternatives Considered:
- 比照現有一次性 `payuni/notify/route.ts` 的做法，只用 `db.courseSubscription.updateMany({ where: { ..., status: "PENDING" } })` 條件式更新做冪等 → 否決：一次性付款只會收到一次終態通知，訂閱每期都會收到通知且 PAYUNi 可能重送，用單一 `updateMany` 無法防止「兩個重複請求同時通過查詢、都判斷為未處理」的並發窗口，也無法保留事件軌跡供之後除錯
- 完整照抄 woomin 含 lease 逾時重試、`IN_PROGRESS` 503 Retry-After 語意 → 否決：MVP 範圍不需要這麼精細的重試保護，先有 claim-once 的基本冪等即可，之後若發現漏單問題可在原表上加欄位延伸，不需要重新設計

### Decision: CourseSubscription 預留 invoice* 欄位，不做發票邏輯

`CourseSubscription` 新增 `invoiceType`／`invoiceCarrierType`／`invoiceCarrierId`／`invoiceTaxId`／`invoiceTitle`（皆 nullable String/enum），比照 woomin schema 的發票偏好快照欄位命名。這次不寫入、不讀取、不觸發任何 einvoice API，欄位存在只是避免未來接 `@paid-tw/einvoice*`（config.yaml 既定「下一輪才接」）時需要重新 migration 並回填歷史資料。

Alternatives Considered:
- 完全不留欄位，等真的要做發票時再開新 change 加 migration → 否決：Fish 明確要求「沒留端口後面要改很麻煩」，屆時要對已存在的訂閱記錄回填發票資訊會比現在就留空欄位複雜得多
- 現在就實作完整發票邏輯與 API 串接 → 否決：直接違反 config.yaml 既有邊界「發票不在 MVP」，且超出這次 SR 的 Non-Goals

### Decision: canAccessCourseId 新增訂閱分支，取消後立即收回權限

`packages/course/access.ts` 的 `canAccessCourseId` 是依賴注入 reader 模式（`BundleCourseAccessReader`），刻意不在函式體內直接呼叫 db，讓 `access.test.ts` 能用假的 reader mock 測試，不需要連接真實資料庫。這次擴充延續同一個模式，不破壞它：`BundleCourseAccessReader` 新增一個方法 `hasActiveSubscription: (userId: string, courseId: string) => Promise<boolean>`，`canAccessCourseId` 在既有 MVP entitlement／bundle 判斷都不成立時，最後呼叫 `reader.hasActiveSubscription(userId, courseId)` 作為第三道判斷。production reader（`packages/api/modules/course/lib/course-access.ts` 的 `createPrismaBundleCourseAccessReader`）實作這個方法，查詢 `db.courseSubscription.findFirst({ where: { userId, courseId, status: "ACTIVE" } })` 是否存在。取消訂閱（呼叫 `cancelSubscription`）成功後，立即把 `status` 更新為 `CANCELED`，不保留「用到當期結束」的寬限期——下一次 `canAccessCourseId` 查詢就會拒絕。

Alternatives Considered:
- 在 `canAccessCourseId` 函式體內直接 `import db` 查詢 `CourseSubscription` → 否決：破壞既有的依賴注入設計，`access.test.ts` 會被迫直接連真實資料庫或改用複雜的 mock 框架，且違反這次 SR 反覆強調的「不要寫死」精神——寫死呼叫具體實作，而不是透過抽象介面
- 取消後保留到 `currentPeriodEnd` 才收權限（類似 Stripe 慣例的寬限期）→ 否決：MVP 範圍先求邏輯單純，寬限期需要额外的排程 job 在到期時收回權限，屬於 Non-Goals 之外的複雜度，記錄在 Risks 供未來評估
- 把訂閱判斷完全獨立於 `BundleCourseAccessReader` 之外，另開一個平行的 `SubscriptionAccessReader` 讓 `canAccessCourseId` 接收兩個 reader 參數 → 否決：徒增呼叫端複雜度，`BundleCourseAccessReader` 本來就是「查這個使用者對這個課程有沒有存取權」的統一介面，加一個方法比新增第二個參數更符合現有介面的職責

### Decision: 訂閱不建立 Order 記錄，不授予 GitHub kit 領取資格

訂閱的扣款記錄只寫入 `CourseSubscription.paidPeriods`／`currentPeriodEnd`，不透過 `apps/saas/lib/orders.ts` 的 `createPendingOrderForUser` 建立 `Order` 記錄。這代表：(1) `apps/saas/lib/github-kit.ts` 的 `kitClaimEligible` 資格判斷（只查 `Order.sku === MVP_SKU`）不會把訂閱買家算進去，訂閱買家不會取得 GitHub 組織私人倉庫的終身代碼包領取資格；(2) `apps/saas/app/api/coupons/validate/route.ts`／優惠券系統不適用於訂閱結帳（Non-Goals 已排除訂閱使用優惠券）。這是刻意的商業邏輯差異化：一次買斷 8800 TWD 包含「課程 + 終身代碼包」，訂閱制只包含「課程存取權」，價格與權益對稱。

Alternatives Considered:
- 訂閱買家每期成功扣款也建立一筆 `Order`（比照 woomin「每期扣款各建一張 Order」設計）→ 否決：超出 MVP 範圍，且會讓 `Order` 表混雜「一次買斷」與「訂閱期款」兩種語意不同的記錄，既有查詢 `Order.sku === MVP_SKU` 的多處代碼（`github-kit.ts`／`course/page.tsx`／`coupons/validate`）都要重新審視是否該把訂閱期款排除在外，改動面過大
- 訂閱買家也給 GitHub kit 領取資格 → 否決：這次 propose 過程 Fish 沒有提出這個要求，且與「一次買斷=課程+終身代碼包」的既定定位（config.yaml）不一致，屬於需要另外明確決策的範圍，不在本次隱含帶過

## Implementation Contract

**Behavior:**
- 買家在訂閱制結帳頁選擇月繳或年繳方案，提交後被導向 PAYUNi 幕後交易頁面完成首期授權（可能觸發 3D 驗證，僅首次）
- 首期授權成功後，PAYUNi 透過 `period-notify` webhook 通知本站，本站建立/更新 `CourseSubscription` 為 `ACTIVE`，買家立即能存取對應課程的所有單元
- 每期續期扣款成功時，PAYUNi 再次呼叫 `period-notify`，本站更新 `paidPeriods`、`currentPeriodEnd`（採 `max(現值, 新值)` 防止晚到通知造成回退）
- 買家在帳號設定內點擊「取消訂閱」，本站呼叫 PAYUNi mdfStatus 終止，成功後 `CourseSubscription.status` 立即轉為 `CANCELED`，該買家對該課程立即失去訂閱來源的存取權（若買家同時有一次買斷的 Order 或 bundle 權限，仍可透過那些管道繼續存取）

**Interface / data shape:**
- `SubscriptionGateway`（`packages/payments/types.ts`）：
  ```ts
  interface SubscriptionGateway {
    createSubscriptionSession(params: {
      subscriptionId: string;
      gatewayTradeNo: string;
      pricePerPeriod: number;
      interval: "MONTH" | "YEAR";
      courseTitle: string;
      baseUrl: string;
      payerEmail?: string;
    }): Promise<{ type: "form_post"; formData: Record<string, string>; gatewaySessionId: string }>;
    cancelSubscription(params: { gatewaySubscriptionId: string }): Promise<{ success: boolean; error?: string }>;
    queryPeriod(gatewaySubscriptionId: string): Promise<{ status: string; totalTimes: number; alreadyTimes: number }>;
  }
  ```
- `CourseSubscriptionPlan`／`CourseSubscription`／`PaymentWebhookEvent` 三個 Prisma model，DDL 見下方 SQL
- `POST /api/payuni/period-notify`：接收 `multipart/form-data`（`EncryptInfo`／`HashInfo`），回傳 `{ message: "OK" }` 或 `{ error: string }`
- `userCanAccessCourseId(userId: string, courseId: string): Promise<boolean>`（既有函式，簽章不變，內部呼叫 `canAccessCourseId` 的邏輯不變）
- `BundleCourseAccessReader`（`packages/course/access.ts`）新增方法：`hasActiveSubscription: (userId: string, courseId: string) => Promise<boolean>`；`createPrismaBundleCourseAccessReader`（`packages/api/modules/course/lib/course-access.ts`）實作此方法，查詢 `db.courseSubscription.findFirst({ where: { userId, courseId, status: "ACTIVE" } })`

**DB DDL:**
```sql
CREATE TABLE "course_subscription_plan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseId" TEXT NOT NULL REFERENCES "course"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "interval" TEXT NOT NULL CHECK ("interval" IN ('MONTH', 'YEAR')),
  "price" INTEGER NOT NULL CHECK ("price" >= 2),
  "sku" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "course_subscription_plan_courseId_idx" ON "course_subscription_plan"("courseId");

CREATE TABLE "course_subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "course"("id") ON DELETE CASCADE,
  "planId" TEXT NOT NULL REFERENCES "course_subscription_plan"("id") ON DELETE RESTRICT,
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'ACTIVE', 'CANCELED')),
  "gatewayTradeNo" TEXT UNIQUE NOT NULL,
  "gatewaySubscriptionId" TEXT,
  "interval" TEXT NOT NULL CHECK ("interval" IN ('MONTH', 'YEAR')),
  "pricePerPeriod" INTEGER NOT NULL,
  "paidPeriods" INTEGER NOT NULL DEFAULT 0,
  "currentPeriodEnd" TIMESTAMP,
  "lastPaymentAt" TIMESTAMP,
  "canceledAt" TIMESTAMP,
  "invoiceType" TEXT,
  "invoiceCarrierType" TEXT,
  "invoiceCarrierId" TEXT,
  "invoiceTaxId" TEXT,
  "invoiceTitle" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "course_subscription_userId_idx" ON "course_subscription"("userId");
CREATE INDEX "course_subscription_courseId_idx" ON "course_subscription"("courseId");
CREATE UNIQUE INDEX "course_subscription_active_unique" ON "course_subscription"("userId", "courseId") WHERE "status" IN ('PENDING', 'ACTIVE');

CREATE TABLE "payment_webhook_event" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gateway" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING' CHECK ("status" IN ('PROCESSING', 'COMPLETED', 'FAILED')),
  "payload" JSONB NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "payment_webhook_event_gateway_eventId_key" ON "payment_webhook_event"("gateway", "eventId");
```

**Failure modes:**
- `period-notify` 收到重複事件（相同 `gateway`+`eventId`）→ insert 因唯一鍵衝突失敗 → 視為 `DUPLICATE`，回 `{ message: "OK" }`，不重複處理
- `period-notify` 簽章驗證失敗 → 回 400 `{ error: "Invalid signature" }`，不寫入任何狀態
- `period-notify` 找不到對應 `CourseSubscription`（`gatewayTradeNo` 查無資料）→ 回 400 `{ error: "Subscription not found" }`
- 取消訂閱時 PAYUNi mdfStatus 呼叫失敗 → 回傳 `{ success: false, error }`，`CourseSubscription.status` 維持原狀不變，UI 顯示取消失敗訊息，買家可重試
- 未登入使用者呼叫訂閱結帳 API → 401；已登入但重複訂閱同一門課（已有 PENDING/ACTIVE 記錄）→ 409，由 DB 的 partial unique index 保證不會產生重複記錄

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test` 涵蓋：建立訂閱 session 成功案例、`period-notify` 首期成功入帳、`period-notify` 重複事件被擋下、`period-notify` 簽章驗證失敗案例、取消訂閱成功案例
- `pnpm --filter @startkiter/saas test` 涵蓋：`canAccessCourseId` 對 ACTIVE 訂閱放行、對 CANCELED 訂閱拒絕、與既有 MVP／bundle entitlement 並存不衝突（回歸測試）
- `pnpm type-check`／`pnpm build` 全綠
- `spectra validate payuni-recurring-billing` 0 warnings

**Scope boundaries:**
- In scope：`CourseSubscriptionPlan`／`CourseSubscription`／`PaymentWebhookEvent` 三個新 model；`SubscriptionGateway` interface 與 `PayUniPeriodGateway` 實作；訂閱結帳頁；`period-notify` webhook；取消訂閱 action；`BundleCourseAccessReader` 新增 `hasActiveSubscription` 方法與 `canAccessCourseId` 新增判斷分支
- Out of scope：既有 `packages/payments/factory.ts`（一次性金流 factory）不修改；`packages/payments/provider/stripe/index.ts` 不修改、不接線；多方案管理後台 UI；補扣/reauth；PAST_DUE 提醒；發票 API 實際呼叫；`getLearnerCurriculum`／`getPublicCurriculum` 的多課程大綱限制（已知既有限制，不在本次處理）；`apps/saas/lib/orders.ts`／`apps/saas/lib/github-kit.ts`／`apps/saas/app/api/coupons/validate/route.ts` 不修改（訂閱不建立 Order、不授予 GitHub kit 資格、不適用優惠券）；`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx` 舊版 demo 頁面不修改（既有技術債，bundle 買家目前也一樣不受這個頁面的 `canAccessCourse` 判斷覆蓋，不因本次改動而惡化）

## Risks / Trade-offs

- [Risk] 買家同時擁有一次買斷 Order 與訂閱 CourseSubscription（例如先訂閱後又買斷）→ Mitigation: `canAccessCourseId` 任一條件成立即放行，不互斥，不需要處理「兩者衝突」的情境
- [Risk] Webhook 重複到達造成並發寫入 race condition → Mitigation: `PaymentWebhookEvent` 的 `@@unique([gateway, eventId])` 在 DB 層面擋下重複 claim
- [Risk] 取消訂閱後立即收回權限（不留寬限期），買家可能認為「都付了這期的錢還看不到」而客訴 → Mitigation: MVP 先求邏輯單純並記錄此決策，若上線後客訴多，可在 `CourseSubscription` 現有 `currentPeriodEnd` 欄位基礎上加一個排程 job 延後收權限，不需要改 schema
- [Risk] `mvp-offer`／v1 硬邊界已於本次修改，可能有其他既有 change 或代碼假設「MVP SKU 只有一種計價」→ Mitigation: apply 前執行 cross-impact 分析（grep `MVP_SKU`／`startkiter-mvp` 所有引用點）
- [Risk] PAYUNi 定期定額為幕後交易，`PAYUNI_HASH_KEY`／`PAYUNI_HASH_IV` 若不慎外洩，攻擊者可偽造扣款成功通知 → Mitigation: 沿用既有 `timingSafeEqual` 簽章比對機制（`packages/payments/provider/payuni/crypto.ts`），不新增額外金鑰
- [Risk] `PaymentWebhookEvent` 表持續增長無清理機制 → Mitigation: MVP 範圍不處理，記錄為未來維運事項，非本次 SR 阻塞項
