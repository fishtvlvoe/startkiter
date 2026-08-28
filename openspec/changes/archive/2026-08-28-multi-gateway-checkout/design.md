## Context

`packages/payments/factory.ts` 目前的 `createMvpCheckoutGateway` 寫死判斷字串 `"payuni"`，其餘一律拋錯，`packages/payments/factory.test.ts` 明確斷言「rejects shopline and stripe」。`openspec/specs/payuni-checkout/spec.md` 的核心 Requirement「PAYUNi is the only MVP gateway」是這條硬邊界的正式規範來源。`Order.paymentGateway`（`String @default("payuni")`）欄位型別本身早就是通用字串，不受這次改動影響。

`/Users/fishtv/Development/products/woomin/realms/lib/payment/`（`types.ts`／`gateway-factory.ts`／`shopline-gateway.ts`／`stripe-gateway.ts`）已有生產驗證過的完整三金流實作，採「單一啟用金流」模式：後台設定決定當下用哪一家，不是買家結帳時自選；`CreatePaymentResult` 統一用 `type: 'redirect' | 'form_post'` 分辨導向方式（Shopline／Stripe 是 hosted checkout 跳轉，PAYUNi 是表單 POST）。

這次跟 `subscriptions-invoice` change 有直接介面依賴：該 change 已定義 `packages/api/modules/course/lib/invoice-events.ts` 的 `triggerInvoiceForOrder(orderId)` 共用函式，任何金流的付款成功 webhook 都應該呼叫這個函式觸發開票，不應該重新設計。同樣地，`apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb` 是目前唯一生產路徑上的退款函式（`packages/payments/refund.ts` 是操作 in-memory store 的舊代碼，未被任何生產路徑引用，不受這次改動影響），這次退款要延伸這個函式依 `Order.paymentGateway` 呼叫對應金流的退款 API。

## Goals / Non-Goals

**Goals:**

- 後台可切換啟用的一次買斷金流：PAYUNi／Shopline／Stripe 三選一
- `CheckoutGateway` 抽象讓三家金流可切換，呼叫端（`/api/checkout` route）不寫死具體金流類別
- 三家金流的付款成功 webhook 都呼叫同一個既有的 `triggerInvoiceForOrder` 共用函式，不重複開票判斷邏輯
- 退款延伸 `markOrderRefundedInDb`，依 `Order.paymentGateway` 分派到對應金流的退款 API

**Non-Goals：**（同 proposal.md，不重複列出，見該檔案 Non-Goals 段落）

## Decisions

### Decision: CheckoutGateway 用 redirect/form_post 兩種型態統一介面，不用單一導向方式

`packages/payments/types.ts` 新增 `CheckoutGateway` interface：`createPaymentSession(params): Promise<{ type: "redirect"; checkoutUrl: string } | { type: "form_post"; formData: Record<string, string> }>`。PAYUNi 既有的 `PayUniOneTimeGateway` 回傳 `form_post`（既有行為不變）；新增的 `ShoplineGateway`／`StripeGateway` 回傳 `redirect`（hosted checkout URL），呼叫端（`/api/checkout` route 與對應前端頁面）依回傳的 `type` 決定要導向 URL 還是提交表單。

Alternatives Considered:
- 統一都用 `redirect` 型態，PAYUNi 也包一層跳轉頁 → 否決：PAYUNi 既有 `form_post` 行為已經上線運作且有既有測試涵蓋，強行統一格式只是為了介面好看，換來的是重寫一個已經正確運作的既有流程，沒有實質收益
- 每家金流各自定義回傳型別，呼叫端用 `instanceof`／型別守衛個別判斷 → 否決：這正是要避免的「呼叫端寫死具體金流類別」，判別聯合型別（discriminated union）已經是 TypeScript 慣用的統一介面手法，不需要引入型別守衛的額外複雜度

### Decision: 全站同一時間只有一家啟用金流，不做買家結帳頁自選

`SiteSetting{id: "checkout-gateway"}` 存放 `{ enabledGateway: "payuni" | "shopline" | "stripe", ...對應金流的金鑰欄位 }`。目前呼叫鏈是 `apps/saas/app/api/checkout/route.ts` 先呼叫 `loadPayUniCredentials()` 讀 PAYUNi 專屬憑證，再呼叫 `createMvpCheckoutGateway("payuni", credentials)`——第一個參數在呼叫端就已經寫死傳入字串 `"payuni"`，不是只有 `factory.ts` 內部判斷寫死。這次要同步改三處：(1) 新增 `loadEnabledGatewayCredentials()`（`apps/saas/lib/orders.ts` 或新檔案），依 `enabledGateway` 讀取對應格式的憑證（PAYUNi／Shopline／Stripe 三種憑證形狀不同）；(2) `createMvpCheckoutGateway` 簽章改為 `createMvpCheckoutGateway(enabledGateway, credentials): CheckoutGateway`，依 `enabledGateway` 分派建立對應實例，不再是「非 payuni 就拋錯」；(3) `checkout/route.ts` 改為呼叫 `loadEnabledGatewayCredentials()` 取得 `{ enabledGateway, credentials }`，再傳給 `createMvpCheckoutGateway(enabledGateway, credentials)`，不再寫死傳入 `"payuni"`。未設定或設定的金流缺金鑰時，`/api/checkout` 維持既有 fail-closed 慣例（503）。買家結帳頁不出現「選擇付款方式」的 UI，永遠只看到當下啟用的那一家。

Alternatives Considered:
- 買家結帳頁列出所有已設定金鑰的金流供自選 → 否決：Fish 的使用情境是「依客群/時期切換金流」而非「同時開放多選項」，woomin 的生產驗證版本也是單一啟用模式；買家自選會讓 `Order.paymentGateway` 的欄位語意從「當下設定值」變成「這筆訂單的多選一結果」，需要額外處理每個金流各自的最低/最高金額限制、幣別等差異，超出這次 MVP 範圍
- 用環境變數決定啟用金流，不做後台 UI → 否決：`config.yaml` 既定「金鑰填後台、env fallback」模式，且切換金流是 Fish 會直接操作的營運行為，後台 UI 比改環境變數重新部署更符合實際操作流程

### Decision: 三家金流的付款成功 webhook 都呼叫既有的 triggerInvoiceForOrder 共用函式

`apps/saas/app/api/shopline/notify/route.ts`／`apps/saas/app/api/stripe/webhook/route.ts` 各自驗簽、更新 `Order` 狀態後，呼叫 `subscriptions-invoice` change 已定義的 `packages/api/modules/course/lib/invoice-events.ts` 的 `triggerInvoiceForOrder(orderId)`，不在這兩個新 route 裡重新寫一份開票判斷邏輯。這是這次 propose 過程中明確要求的跨 change 一致性：`triggerInvoiceForOrder` 的參數本來就不含 PAYUNi 專屬概念，可以直接被新金流的 webhook 呼叫。

Alternatives Considered:
- 在這兩個新 route 各自重新判斷「電子發票是否啟用」並呼叫 `InvoiceProvider.issue` → 否決：這正是 `subscriptions-invoice` change 的 Decision 明確要避免的重複邏輯，若 `subscriptions-invoice` 尚未部署（apply 順序在這張 change 之後），改為在 apply 階段先確認該共用函式是否已存在，若不存在則此任務標記為阻塞，等待 `subscriptions-invoice` 完成後再繼續，不自行重新實作一份

### Decision: 退款依 Order.paymentGateway 分派到對應金流的退款 API

`apps/saas/lib/orders.ts` 的 `markOrderRefundedInDb` 延伸：在既有的資料庫狀態更新（`status: "refunded"`, `courseAccess: false`）之前，先依 `Order.paymentGateway` 呼叫對應的 `CheckoutGateway` 的退款方法（`PayUniOneTimeGateway` 需要新增 `processRefund` 方法，目前尚未實作退款 API 呼叫，只有 `refundedAt` 欄位標記；`ShoplineGateway`／`StripeGateway` 各自呼叫其官方退款 API）。若金流端退款呼叫失敗，`markOrderRefundedInDb` 不得標記為已退款，讓操作員知道退款尚未真正生效。

Alternatives Considered:
- 退款維持現狀（只更新本地資料庫狀態，不呼叫任何金流退款 API）→ 否決：這是既有的功能缺口而非本次刻意排除的範圍——如果只更新本地狀態，Shopline／Stripe 那邊沒有真的退款，買家沒收到錢卻被標記已退款，是嚴重的營運風險；PAYUNi 既有流程沒有這個問題是因為金額小、Fish 手動處理退款，但多金流上線後需要程式化避免混亂
- 退款 API 呼叫失敗時仍標記本地為已退款，靠人工事後核對 → 否決：資料庫狀態應該反映真實情況，先標記再核對容易造成「系統顯示已退款但其實沒有」的資料不一致，之後排查更困難

## Implementation Contract

**Behavior:**
- 操作員在後台設定啟用金流（PAYUNi／Shopline／Stripe 其中一家）並填入對應金鑰
- 買家結帳時，`/api/checkout` 依當下啟用的金流建立付款 session，導向對應的付款頁面（PAYUNi 表單提交或 Shopline/Stripe hosted checkout）
- 付款成功後，對應金流的 webhook route 更新訂單狀態並觸發既有的發票共用函式（若 `subscriptions-invoice` 已上線且啟用電子發票）
- 操作員對訂單執行退款時，先呼叫對應金流的退款 API，成功才標記訂單為已退款

**Interface / data shape:**
- `CheckoutGateway`（`packages/payments/types.ts`）：
  ```ts
  interface CheckoutGateway {
    createPaymentSession(params: {
      orderId: string; orderNo: string; amount: number; productTitle: string;
      customerEmail?: string; baseUrl: string;
    }): Promise<
      | { type: "form_post"; formData: Record<string, string> }
      | { type: "redirect"; checkoutUrl: string }
    >;
    processRefund(params: { gatewayPaymentId: string; amount: number }): Promise<{ success: boolean; error?: string }>;
  }
  ```
- `POST /api/shopline/notify`、`POST /api/stripe/webhook`：驗簽 + 更新訂單，回傳格式比照既有 `payuni/notify` 慣例

**Failure modes:**
- 未設定啟用金流或缺金鑰 → `/api/checkout` 回 503（沿用既有 `payuni-checkout` fail-closed 慣例）
- Webhook 簽章驗證失敗 → 400，不更新訂單狀態
- 退款 API 呼叫失敗 → 訂單狀態維持不變，操作員看到失敗訊息，可重試

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test` 涵蓋：三家金流各自建立 payment session 成功、`factory.test.ts` 斷言改為「accepts shopline and stripe when configured」且金流未設定時 fail-closed 維持不變
- `pnpm --filter @startkiter/saas test` 涵蓋：Shopline／Stripe webhook 成功案例、簽章失敗案例、成功時呼叫 `triggerInvoiceForOrder`
- `pnpm type-check`／`pnpm build` 全綠

**Scope boundaries:**
- In scope：`CheckoutGateway` 抽象；Shopline／Stripe 兩個 gateway 實作；對應 webhook route；後台設定頁；退款分派邏輯
- Out of scope：買家結帳頁自選金流 UI；訂閱路徑的多金流（`SubscriptionGateway` 不動）；Shopline 電商生態系整合；多金流分潤/對帳

## Risks / Trade-offs

- [Risk] `subscriptions-invoice` 與這張 change 若同時被 Codex 平行 apply，`triggerInvoiceForOrder` 可能尚未存在導致這張 change 的 webhook route 編譯失敗 → Mitigation: apply 順序上這張 change 排在 `subscriptions-invoice` 之後（見總 SR 計畫的依賴順序），apply 前先確認該函式已存在
- [Risk] 切換啟用金流的瞬間，尚在進行中的舊金流訂單（PENDING）可能收到舊金流的 webhook 但系統已經切到新金流 → Mitigation: webhook route 各自綁定各自的金流類型（`/api/shopline/notify` 只處理 `paymentGateway === "shopline"` 的訂單），不受當下啟用設定影響，舊訂單仍能被正確處理
- [Risk] PAYUNi 目前沒有 `processRefund` 實作（只有本地標記），這次要新增才能跟其他兩家一致 → Mitigation: 這是本次 Scope 內要補的，不是額外風險，用既有 PAYUNi 官方退款 API（沙盒可測）

## Migration Plan

1. 跑 Prisma migration（若有新增欄位；`Order.paymentGateway` 已存在不需異動 schema）
2. 安裝 `stripe` 套件
3. 部署 `CheckoutGateway` 抽象與三個 gateway 實作、後台設定頁，此時預設仍是 `payuni`（`SiteSetting{id: "checkout-gateway"}` 不存在時 fallback 到既有 `PayUniOneTimeGateway` 行為，不影響現有結帳流程）
4. Fish 在後台測試模式下驗證 Shopline／Stripe 沙盒付款流程
5. 需要時 Fish 切換 `enabledGateway` 到正式使用的金流

**Rollback**：把 `enabledGateway` 切回 `payuni` 即可讓結帳流程回到現在的行為，不需要 revert migration。
