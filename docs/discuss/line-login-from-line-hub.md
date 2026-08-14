▋ LINE 登入：WordPress 版能不能接進教學 SaaS

狀態：confirmed（2026-08-14）

看的是 `8-外掛/line-hub`，不是 BuyGo 裡那層 LIFF 包裝。結論：協定可以接，PHP 不能搬。教學 SaaS 走 Better Auth 官方 `socialProviders.line`，用同一組 LINE Login Channel 憑證與同一組 API。

【line-hub 其實有兩條路】

網頁 OAuth（要接這條）。

`includes/auth/class-oauth-client.php`

`includes/auth/class-oauth-state.php`

`includes/auth/class-auth-callback.php`

流程：導去 `https://access.line.me/oauth2/v2.1/authorize` → callback 拿 code → `https://api.line.me/oauth2/v2.1/token` 換 token → `verify` 驗 id_token 拿 email → `https://api.line.me/v2/profile` 拿 userId／暱稱／頭像。scope 預設 `profile openid email`。

LIFF（先不要接）。

`includes/liff/*`、BuyGo 的 `class-liff-login-api.php`。這是在 LINE App 內開網頁、前端拿 access token 再打自家 API。教學 SaaS 第一版是瀏覽器前後台，不是 LIFF 商店。

兩條路共用 LINE Login Channel，但 callback、session、使用者建立完全不同。把 LIFF 塞進 Better Auth 會走錯門。

【跟 Better Auth 對得上的部分】

Better Auth 官方就有 LINE provider。設定長這樣：clientId、clientSecret，預設 scope 也是 openid / profile / email，callback 預設 `/api/auth/callback/line`。

這跟 line-hub 打的端點是同一套 LINE OAuth 2.0。所以「接進去」的意思是：學員去 LINE Developers 開 Login Channel，把 Channel ID / Secret 填進教學版後台或環境變數，Better Auth 自己跑完授權。不是把 `OAuthClient.php` 翻譯成 TypeScript。

line-hub 已經幫我們驗證過台灣實務會踩的點，教學版要沿用這些產品決策，不要沿用 PHP。

• Login Channel 跟 Messaging Channel 分開。line-hub 優先讀 `login_channel_id` / `login_channel_secret`，空了才 fallback Messaging。教學版只收 Login Channel，不要拿 Bot token 去登入。

• Email 在 id_token 裡，不在 profile API。line-hub 的 `exchangeAndVerifyTokens` 就是這樣拼 user_data。沒開 email 權限時 email 會是空字串，要有後備（合成 email 或補填），不能假設一定有。

• 帳號主鍵是 LINE `userId`，不是 displayName。

• Callback URL 必須跟 Developers 後台一字不差。教學課綱要寫：`https://學員網址/api/auth/callback/line`。

• 沒設 Channel 時不要讓按鈕看起來能按。line-hub 有 `isConfigured()`。教學版沒填 key 就藏 LINE 按鈕，跟 Simple-first 同一套。

【接不進去的部分】

WordPress transient + cookie 的 CSRF state。Better Auth 自己管 state。

`wp_insert_user`、角色 subscriber、綁定既有 WP user。SaaS 寫進 Better Auth 的 `account` 表，providerId = `line`。

`bot_prompt`、`disable_auto_login`、強制 reauth。那是加好友／防自動登入的台灣電商細節。v1 可略，標成進階。

LIFF ID、liff.line.me、在 LINE 裡開結帳。那是 BuyGo 賣場，不是 SaaS Dashboard。

【建議接法】

v1 只做登入。LINE Developers 只開 LINE Login Channel。不開 Messaging、不開 LIFF、不申請 Bot。

Better Auth `socialProviders.line` + `signIn.social({ provider: "line" })`。Callback：`/api/auth/callback/line`。沒填 Channel 就藏按鈕。

不要自寫 authorize／token／verify。line-hub 寫那些是因為 WordPress 沒有 Better Auth。

v2 才考慮：LIFF、加好友 bot_prompt、Messaging 通知。那是另一個產品，不是登入課。

【對「WordPress 版可以直接接進去」這個假設的挑戰】

不能。語言、session、使用者表、callback 路徑都不同。能接的是 LINE 平台契約，不是外掛。若堅持把 PHP OAuth client 搬進 Next.js，會跟 Better Auth 搶 callback，學員會修兩套登入。

LINE 台灣還有「一個 Channel 對一個國家／一個 callback」的限制。Better Auth 文件也寫了多國要 Generic OAuth 多 provider。教學 v1 只做台灣一個 Channel，夠了。
