▋ 抽取清單

狀態：confirmed（2026-08-14）

台灣金流／發票來源改為 `THE-TU-Project/dev/thetu`（WooMin 1.8.0 優化版）。不要抽 `THE-TU-Project/code`（1.0.0），也不要再抽舊副本 `realms-course-platform-v1.8.0`。supastarter 來源不變。目標 repo：`products/startkiter`。

標記說明。

• 原樣抽：邏輯可搬，去掉課程 import 後能編譯

• 改寫抽：保留契約或演算法，拿掉課程／組織／USD

• 只借契約：看 URL、型別、狀態機，不複製檔案當地基

• 不抽：進 v1 會讓學員學錯東西

• 新做：兩邊都沒有，或履約對象已換

【thetu lib/payment】

`THE-TU-Project/dev/thetu/lib/payment/types.ts`

改寫抽。保留 PaymentGateway 介面、CreatePaymentResult（redirect | form_post）、gateway 型別。拿掉 course / bundle / CourseSubscription。改成 SaaS plan + Order。

目標：`packages/payments/src/types.ts`

`THE-TU-Project/dev/thetu/lib/payment/gateway-factory.ts`

改寫抽。保留「DB 設定優先、env fallback、一次讀一批金鑰」。拿掉課程站 SiteSetting key 名稱可改成教學版自己的 key。預設 gateway = shopline。

目標：`packages/payments/src/gateway-factory.ts`

`THE-TU-Project/dev/thetu/lib/payment/shopline-gateway.ts`

原樣抽為主。這是 v1 主閘道。CreatePaymentSessionParams 從 course.title 改成 plan.name。

目標：`packages/payments/src/provider/shopline/gateway.ts`

`THE-TU-Project/dev/thetu/lib/payment/shopline-methods.ts`

原樣抽。付款方式代碼正規化跟 SHOPLINE 綁在一起。

目標：`packages/payments/src/provider/shopline/methods.ts`

`THE-TU-Project/dev/thetu/lib/payment/payuni-gateway.ts`

改寫抽。v1 進階第二家。同樣拿掉 course 欄位。

目標：`packages/payments/src/provider/payuni/gateway.ts`

`THE-TU-Project/dev/thetu/lib/payment/payuni-crypto.ts`

原樣抽。檢查碼不能重寫碰運氣。

目標：`packages/payments/src/provider/payuni/crypto.ts`

`THE-TU-Project/dev/thetu/lib/payment/stripe-gateway.ts`

改寫抽、列為選配。課綱不上。不要把 Stripe Billing 的課程 Price ID 邏輯帶進來。

目標：`packages/payments/src/provider/stripe/gateway.ts`（可晚於 SHOPLINE）

`THE-TU-Project/dev/thetu/lib/payment/shared.ts`

改寫抽。共用金額、網址、錯誤字串。掃過一遍拿掉課程字眼。

目標：`packages/payments/src/shared.ts`

`THE-TU-Project/dev/thetu/lib/payment/webhook-events.ts`

原樣抽為主。冪等指紋留下。事件名稱若綁課程訂閱期款，改成 Order 期款或先只支援一次付清。

目標：`packages/payments/src/webhook-events.ts`

`THE-TU-Project/dev/thetu/lib/payment/payment-instructions.ts`

改寫抽。ATM / CVS 等待付款資訊對台灣小白有用。拿掉課程文案。

目標：`packages/payments/src/payment-instructions.ts`

`THE-TU-Project/dev/thetu/lib/payment/subscription-support.ts`

不抽進 v1 當訂閱功能。但要記住它的結論：shopline false。教學版若之後做月繳，預設閘道不能還是 SHOPLINE。

`THE-TU-Project/dev/thetu/lib/payment/post-payment-actions.ts`

不抽原檔。裡面綁課程授權、訪客開通信、Meta CAPI、電子報、課程歡迎信。只借「付款成功之後要做哪些 side effect」這個順序：標 PAID → 開通方案 → 開發票 → 通知。履約改寫成 SaaS entitlement。

目標新做：`packages/payments/src/post-payment.ts`

`THE-TU-Project/dev/thetu/lib/payment/course-invite-order-metadata.ts`

不抽。

`THE-TU-Project/dev/thetu/lib/payment/coupon-redemption.ts`

不抽。

【thetu 金流路由（只借契約，再於新 repo 實作）】

`app/api/payment/create/route.ts` → 新做 `apps/saas/app/api/payment/create/route.ts`

`app/api/payment/notify/route.ts` → 新做 `apps/saas/app/api/payment/notify/route.ts`

`app/api/payment/return/route.ts` → 新做 `apps/saas/app/api/payment/return/route.ts`

`app/api/payment/order-status/route.ts` → 新做 `apps/saas/app/api/payment/order-status/route.ts`

`app/api/payment/shopline/return/route.ts` → 新做 `apps/saas/app/api/payment/shopline/return/route.ts`

`app/api/webhooks/shopline/route.ts` → 新做 `apps/saas/app/api/webhooks/shopline/route.ts`

`app/api/payment/period-return/route.ts` 與 `period-notify/route.ts` 不抽進 v1（定期定額）。

`app/api/webhooks/stripe/route.ts` 選配，v1 課不上。

【thetu lib/invoice】

這包幾乎整組要，因為發票冪等、折讓、作廢不能從零發明。

`lib/invoice/index.ts` 原樣抽 → `packages/invoice/src/index.ts`

`lib/invoice/config.ts` 改寫抽（設定來源改教學版 SiteSetting）→ `packages/invoice/src/config.ts`

`lib/invoice/provider.ts` 原樣抽 → `packages/invoice/src/provider.ts`

`lib/invoice/issue.ts` 改寫抽（Order 不再有課程品名，改方案名稱當品名）→ `packages/invoice/src/issue.ts`

`lib/invoice/service.ts` 改寫抽（拿掉對課程 post-payment 的耦合，改對新的 post-payment）→ `packages/invoice/src/service.ts`

`lib/invoice/query.ts` 原樣抽 → `packages/invoice/src/query.ts`

`lib/invoice/credentials.ts` 原樣抽 → `packages/invoice/src/credentials.ts`

`lib/invoice/preflight.ts` 原樣抽 → `packages/invoice/src/preflight.ts`

`lib/invoice/provider-limits.ts` 原樣抽 → `packages/invoice/src/provider-limits.ts`

`lib/invoice/provider-order-id.ts` 原樣抽 → `packages/invoice/src/provider-order-id.ts`

`lib/invoice/ecpay-online-allowance.ts` 原樣抽 → `packages/invoice/src/ecpay-online-allowance.ts`

`app/api/invoice/ecpay/allowance-notify/route.ts` 只借契約 → 新做對應 route

`lib/actions/einvoice.ts` 與 `lib/validations/einvoice.ts` 改寫抽（權限改 Better Auth admin，不要 NextAuth）

`components/admin/payments/einvoice-settings-form.tsx` 改寫抽，接到 supastarter 後台 UI

`components/admin/orders/invoice-actions.ts` 改寫抽

`components/main/my-subscriptions/invoice-prefs-form.tsx` 改寫抽成結帳／帳號頁的發票偏好，拿掉「訂閱未來期款」課程文案

`docs/bdd/taiwan-einvoice.md` 可當內部參考，不進學員課綱原文

npm 依賴一併帶進新 repo：`@paid-tw/einvoice`、`@paid-tw/einvoice-ecpay`、`@paid-tw/einvoice-ezpay`。next.config 必須標 server-only / external，跟 thetu 一樣。

【thetu Simple-first 啟用（改寫抽，拿掉課程步驟）】

`app/(setup)/admin/setup/page.tsx` 與 `setup-client.tsx`、`lib/actions/setup.ts`

只借「可跳過的逐步啟用」。教學版步驟改成：前後台上線 → Google → LINE → SHOPLINE → 發票。不要搬影片方案、YouTube、Cloudflare Stream。

`docs/simple-first-platform-plan.md` 只當內部原則，不進學員教材原文。

`docs/deployment/AGENT.md` 與 `docs/customer-deployment.md` 只借契約：客戶自己的 GitHub／Zeabur、`/data` volume、secrets 不進 git。

【thetu 後台金流 UI】

`app/(admin)/admin/settings/payment/page.tsx` 只借資訊架構（金鑰表單、webhook 網址提示）

`components/admin/settings/payment-settings-form.tsx` 改寫抽 → 接到 apps/saas 設定頁，不要搬 Mantine 專用寫法若與 shadcn 衝突。教學殼用 supastarter 的 shadcn。

`components/admin/payments/payments-tabs.tsx` 只借「金流／發票分頁」

不抽：課程定價頁、訂閱列表、課程分析 pie chart、reauth-button（PAYUNi 課程續期）。

【thetu 資料模型要借的欄位】

從 `prisma/schema.prisma` 的 Order 借：orderNo、amount、currency 預設 TWD、status、paymentGateway、gateway session / payment id、paidAt、退款欄位、發票偏好六欄（invoiceType / carrier / taxId / title / loveCode / address）。

不借：courseId、bundleId、coupon、planSlug 課程方案、Meta CAPI、UTM、newsletter、subscriptionId / periodNumber（v1 一次付清）。

從 Invoice 模型幾乎整張借：provider、status、invoiceNumber、randomCode、allowance*、voidedAt、failReason、rawResponse、orderId @unique。

SiteSetting 金鑰值模式要借（金流與發票設定存 DB），不要把整個課程站設定表搬過來。

【supastarter packages/auth】

`packages/auth/auth.ts` 改寫抽。留 betterAuth、prismaAdapter、admin plugin、email/password、Google socialProvider。拿掉 organization、passkey、twoFactor、invitationOnly、GitHub、seat 更新 hook、createWelcomeNotification 若通知模組不抽。

新做：socialProviders.line（Better Auth 官方 LINE provider，不要自己實作 OAuth state）。

`packages/auth/config.ts` 改寫抽

`packages/auth/index.ts` 原樣抽

`packages/auth/client.ts` 改寫抽（client plugin 對齊，拿掉 organizationClient）

`packages/auth/types.ts` 改寫抽

`packages/auth/lib/helper.ts` 改寫抽

`packages/auth/lib/organization.ts` 不抽

`packages/auth/lib/organization-member-role-order.ts` 不抽

`packages/auth/plugins/invitation-only/index.ts` 不抽

【supastarter apps/saas 殼】

抽這些路由當前後台骨架。

`app/layout.tsx`

`app/(unauthenticated)/layout.tsx`

`app/(unauthenticated)/login/page.tsx`

`app/(unauthenticated)/signup/page.tsx`

`app/(unauthenticated)/forgot-password/page.tsx`

`app/(unauthenticated)/verify/page.tsx`

`app/(unauthenticated)/reset-password/page.tsx`

`app/(authenticated)/layout.tsx`

`app/(authenticated)/(main)/layout.tsx`

`app/(authenticated)/(main)/(account)/page.tsx`

`app/(authenticated)/(main)/(account)/layout.tsx`

`app/(authenticated)/(main)/(account)/settings/general/page.tsx`

`app/(authenticated)/(main)/(account)/settings/security/page.tsx`

`app/(authenticated)/(main)/(account)/settings/billing/page.tsx`

`app/(authenticated)/checkout-return/page.tsx`

`app/(authenticated)/choose-plan/page.tsx`

`app/(authenticated)/(main)/(account)/admin/layout.tsx`

`app/(authenticated)/(main)/(account)/admin/users/page.tsx`

`modules/auth/` 整組改寫抽。`constants/oauth-providers.tsx` 刪 GitHub、加 LINE icon。

`modules/settings/` 抽帳號資料、密碼、刪除帳號、已連社群。不抽 PasskeysBlock、TwoFactorBlock、NotificationPreferencesForm、UserLanguageForm（v1 單一 zh-TW）。CustomerPortalButton 改寫成台灣金流後台訂單，不是 Stripe portal。

`modules/payments/` 改寫抽。PricingTable / CheckoutReturn / ActivePlan 留下。價格改 TWD。拿掉 organizationSlug 路徑。

`modules/admin/component/users/UserList.tsx` 與 `EmailVerified.tsx`、`lib/links.ts` 改寫抽。organizations 那兩支不抽。

`modules/shared/` 抽 layout 會用到的 AuthWrapper、PageHeader、UserAvatar、session 相關。NotificationCenter 可晚點或不進 v1。

不抽這些路由。

`app/(authenticated)/onboarding/page.tsx`（組織導向）

`app/(authenticated)/new-organization/page.tsx`

`app/(authenticated)/organization-invitation/**`

`app/(authenticated)/(main)/(organizations)/**`

`app/(authenticated)/(main)/(account)/admin/organizations/**`

`app/(authenticated)/(main)/(account)/chatbot/**`

`app/(authenticated)/(main)/(account)/settings/notifications/page.tsx`

`modules/organizations/**` 整包

`modules/ai/**`

`modules/onboarding/**`

apps/marketing、apps/docs、apps/mail-preview 整包不抽。

【supastarter packages/payments（國際那包）】

不要當台灣金流地基。只借 `types.ts` 的 Plan / Price 形狀，改 currency 為 TWD、拿掉 seatBased。

`provider/stripe` 最多當選配對照，不要當課上預設。

`provider/lemonsqueezy`、`provider/polar`、`provider/dodopayments`、`provider/creem` 不抽。

`packages/api/modules/payments/*` 只借 procedure 名稱（create-checkout-link、list-purchases）。實作改打 thetu 閘道，回傳 redirect URL 或 PAYUNi form_post。organization 授權檢查刪掉，改 user 自己的訂單。

【supastarter packages/database】

改寫抽 Prisma schema。留 User、Session、Account、Verification。

不留 Organization、Member、Invitation、Passkey、TwoFactor、Notification*。

Purchase 不要沿用。改成 Order + Invoice，欄位見上方 thetu 模型。

`billingAttachedTo: user` 這個決策留下（本來就在 payments config）。

【LINE 怎麼接（有 WordPress 版當契約，沒有可 copy 的 TS）】

來源契約：`8-外掛/line-hub/includes/auth/class-oauth-client.php`、`class-auth-callback.php`、`includes/class-line-api-endpoints.php`。

實作：Better Auth `socialProviders.line`（clientId / clientSecret，預設 scope openid profile email）。Callback 用 `/api/auth/callback/line`。

`apps/saas/modules/auth/constants/oauth-providers.tsx` 加 line，刪 GitHub。

沒填 Channel 就藏按鈕，對齊 line-hub 的 `isConfigured()`。

Email 可能空（id_token 沒開 email）。要有後備，不要假設一定有信箱。

不抽：`includes/liff/*`、BuyGo `class-liff-login-api.php`、WP user 綁定、bot_prompt。

漏 LINE = v1 沒做完。自己重寫 OAuth client = 做錯。

【建議施工順序（仍不是寫碼日）】

先複製精簡後的 apps/saas 殼 + Better Auth（Email + Google），zh-TW。

再搬 SHOPLINE 閘道 + Order 表 + notify/return。

再搬 invoice 包，接到 PAID hook。

最後加 LINE。不要先做 LINE 再做金流，課的失敗點會疊在一起。

【對這份清單的挑戰】

「原樣抽 invoice service.ts」可能過度樂觀。那支超過八百行，且 import 了課程站的 prisma 與 app-url。實際搬運時應當改寫抽，測試用 thetu 既有 `tests/invoice-system.test.ts` 當行為契約，不要整檔貼上就當完成。

「不抽訂閱」代表 v1 的 SaaS 只能一次買斷或手動開通。若老闆之後堅持第一版就要月繳，那是範圍變更，要回頭改 payment-and-deploy.md，不能偷偷把 CourseSubscription 改名塞進來。
