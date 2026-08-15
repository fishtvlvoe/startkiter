▋ 已被 mvp-test-scope 取代

本篇是 repo-foundation 的舊 v1 邊界，不是現行規則。現行產品定義看 `openspec/specs/`（封存來源：`openspec/changes/archive/2026-08-14-mvp-test-scope/`）。

課 + 終身代碼包、主金流 PAYUNi、結帳 8800、課程模組、站內領 GitHub、agent 兩支唯讀工具、課程內 LINE 交流群、發票不在 MVP。

下列句子若還出現在本文，一律當過期：不是賣課平台、主金流 SHOPLINE、四堂課對 SHOPLINE、SHOPLINE 測一筆付款、發票在 MVP。

---

▋ v1 能力清單（過期稿，僅供對照）

狀態：superseded by mvp-test-scope（原稿 confirmed 2026-08-14）

成品目標是「程式一次齊、課分堂開」。本篇寫死抽什麼、不抽什麼、什麼必須新做。開始寫代碼時若要加東西，先改這篇，不要在施工時膨脹。

【v1 學員下課時手上要有的】

繁中前台公開頁，以及登入後的後台。

Email／密碼註冊登入。

Google 登入。

LINE 登入。

一家台灣金流能收到測試款（SHOPLINE）。後台看得到訂單狀態。

電子發票接在同一筆訂單上：個人載具、公司統編、捐贈。測試環境可走通。正式開立要營業登記，課綱必須講清楚。

TWD 方案，不是 USD。

【從 supastarter 抽】

apps/saas 的殼：未登入區（login / signup / forgot-password）、已登入區（後台 layout、帳號設定、管理頁）、checkout-return。

packages/auth 的 Better Auth 骨架與 session helper。拿掉 organization plugin、invitation-only、GitHub。

packages/ui、packages/utils、tooling（tsconfig / tailwind）。

packages/database 只留 user / session / account / verification。Purchase 改寫成台灣 Order，不要沿用 Stripe priceId 那套。

packages/api 的 payments / admin / users 當介面參考。實作改接台灣閘道，不是原樣複製 Stripe checkout。

packages/i18n 只留一份 zh-TW。en / de / es / fr 與 marketing 翻譯不搬。

packages/mail 可留最小驗證信用的信。不要整包多語系行銷信。

apps/saas/modules/auth、modules/settings（個人帳號）、modules/admin/users、modules/payments 的 UI 思路。文案改繁中、方案改 TWD。

【從 THE-TU `dev/thetu` 抽】

Simple-first：沒設金流／發票／OAuth 也能上線。Setup 可跳過。發票預設關閉。這套啟用方式比金流演算法更該進教學版。

lib/payment 的閘道介面與 SHOPLINE / PAYUNi 實作、crypto、webhook 事件指紋、return / notify 路由思路。來源路徑是 `THE-TU-Project/dev/thetu/`，不要用舊的 `realms-course-platform-v1.8.0`。

lib/invoice 整包抽象層（config / provider / issue / service / credentials / preflight）。依賴 `@paid-tw/einvoice`、`@paid-tw/einvoice-ecpay`、`@paid-tw/einvoice-ezpay`。

Order 與 Invoice 資料模型思路：一張訂單對一張發票、付款成功才開立、冪等。載具／統編／捐贈欄位。

後台金流設定頁與發票設定頁的「金鑰填在後台、不是只丟 .env」這個產品決策。小白課必須沿用這個，否則第 3 堂會卡死。

app/api/payment/*、app/api/webhooks/shopline、app/api/invoice/ecpay/allowance-notify 的路由契約（URL 形狀、誰呼叫誰）。

【必須新做，不是搬過去】

LINE Login。PHP 不能搬。接到 Better Auth 的 `socialProviders.line`。憑證用 LINE Login Channel（不是 Messaging）。產品決策抄 `8-外掛/line-hub` 的網頁 OAuth，不抄 LIFF。詳見 line-login-from-line-hub.md。

繁中 UI 文案、課綱、填空 SOP、.cursorrules / 給 AI 的話術。

TWD 價格表、結帳頁的發票偏好表單（從 thetu 結帳思路改寫，拿掉課程／組合包欄位）。預設不強制填發票，跟 thetu 一樣關掉時結帳不收載具。

訂單狀態機：把 thetu 的課程履約（開課權限）換成 SaaS 履約（開通方案）。付款成功後做的事不能複製 `post-payment-actions.ts` 裡的課程授權。

教學 repo 自己的 README 與 docs/course。

【明確不抽】

thetu 的課程、章節、影片、Cloudflare Stream、作業、電子報、優惠券、課程邀請、賣課用 onboarding skill、NextAuth、Apple 登入。

thetu 的 `course-invite-order-metadata.ts`、`coupon-redemption.ts`。這兩支綁死賣課。

`THE-TU-Project/code`（1.0.0 舊快照）。

supastarter 的 apps/marketing、apps/docs、apps/mail-preview。

supastarter 的 Lemon Squeezy / Polar / Dodo / Creem。國際金流最多留 Stripe 當選配，v1 課不上。

supastarter 的 Organization / Member / Invitation、organization 路由、邀請信、seat-based 計價。

supastarter 的 Passkey、TwoFactor、GitHub OAuth、AI chatbot、Notification 模組。小白第一週用不到。

libon.me 是客戶平台。裡面的 anismile / so / am 商務模組、以及任何 libon 代碼，都不准進 StartKiter。零耦合。

【邊界測試】

若一個檔案刪掉後，學員仍能「登入、付款、開發票、進後台」，它就不該進 v1。

若一個檔案刪掉後，金流 webhook 或發票冪等會壞，它必須進 v1。

LINE 沒有來源檔可搬。漏做 LINE 等於 v1 沒達標，不能用「以後再補」混過去。
