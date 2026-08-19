# StartKiter vs 官方 supastarter 落差風險報告（2026-08-17）

比對 StartKiter 現有後端實作（`packages/auth`、`packages/payments`、`packages/database`、`packages/course`）與官方 `docs/reference/supastarter-nextjs-docs/` 最新文件。目的：判斷是否有真正的安全/邏輯問題,還是只是版本新舊差異。**不動任何代碼。**

## 風險總覽

| 模組 | 風險 | 一句話理由 |
|---|---|---|
| Payments（PAYUNi webhook） | 🟢 低 | 簽章驗證、timing-safe 比對、金額/訂單防竄改、冪等處理都有做,邏輯紮實 |
| Course（entitlement） | 🟢 低 | 存取判斷完全依賴伺服器端資料庫查詢,無前端可操控的繞過點 |
| Database（schema） | 🟢 低 | Session/Account/Verification 結構跟官方 better-auth 標準一致 |
| Auth（admin 角色機制） | 🟡 中 | 不是漏洞,是刻意簡化——官方用資料庫 `role` 欄位 + Permix,StartKiter 用環境變數字串比對,只能一個管理員、沒有官方 Admin UI |
| Shell／UI 視覺 token | 🟡 中 | 純視覺落後(圓角/顏色/locale switcher 結構),已經在另一個 SR 規劃處理,不影響安全 |

**沒有發現任何真正的安全或邏輯問題。目前查到的落差全部是「功能範圍刻意簡化」或「版本新舊」,不是「寫錯」。**

## Auth

StartKiter `packages/auth/src/auth.ts` 用 better-auth,`emailAndPassword.enabled: true`、`accountLinking` 設定合理,`trustedOrigins` 有明確列出。跟官方一致的部分：session/account/verification 的 schema 結構、better-auth 核心設定方式。

落差（單純簡化,非邏輯錯誤）：
- 官方用 `user.role === "admin"` 資料庫欄位 + Permix 權限矩陣(`admin.access`)判斷管理員;StartKiter 用 `process.env.ADMIN_EMAIL` 字串比對（`isOperator` / `shouldShowOperatorSettings`)。**後果**：只能有一個管理員,沒有官方內建的 Admin UI（瀏覽 users、ban/unban）。這是 v1 刻意排除 organization 多租戶後的合理簡化,但 `platform-shell-plugin-architecture` SR 裡的 `requiresOperator: boolean` 权限设计正是延续这个简化——已经在那份 SR 的 design.md 记了一条 Open Question 要补。
- `packages/database/prisma/schema.prisma` 的 `User` model 沒有 `role`、`onboardingComplete` 欄位(官方有)。這是上面那條簡化的資料庫層面對應,不是遺漏,是配套。
- 沒看到強制 email 驗證流程(官方有 `/verify` 路由跟 email verification flow),StartKiter 的付款驗證走 webhook 金額比對,不依賴 email 驗證,所以這個落差目前不構成安全風險,但如果之後要開放自助註冊多角色,需要補上。

## Payments

官方支援 Stripe/Lemonsqueezy/Creem/Polar/Dodo Payments 五個 provider,**沒有 PAYUNi**——PAYUNi 是 StartKiter 自己為台灣市場加的,官方文件對它沒有直接參考,這部分無從比對「是否照官方做法」,只能看邏輯本身。

實測 `packages/payments/src/provider/payuni/crypto.ts` 與 `notify.ts`：
- `verifyAndDecrypt` 做 hash 簽章驗證,且用 `timingSafeEqual` 比對,防 timing attack——符合官方「verifies webhook signatures for security」的要求精神
- `decidePayuniNotify` 檢查金額是否等於 `MVP_AMOUNT_TWD`（防金額竄改)、訂單編號/gateway/sku 是否跟資料庫記錄一致（防用別的通知偽造付款)、已付款/已退款訂單的冪等與拒絕邏輯都有處理

這塊實作品質好,不是「重做比較安全」的候選對象。

## Database

`User`／`Session`／`Account`／`Verification` 四張表結構跟官方 `authentication/user-and-session.mdx` 描述的欄位對得上（除了上述 `role`／`onboardingComplete` 這兩個刻意省略的欄位)。`Order`、`GithubKitGrant`、`SiteSetting` 是 StartKiter 自己的擴充表,官方沒有對應可比對,但從欄位設計看沒有明顯的約束缺失。

## Course

`canAccessCourse` 邏輯：查資料庫該 userId 名下是否有 `sku === MVP_SKU && courseAccess === true` 的訂單。判斷完全在伺服器端、依賴資料庫,沒有可被前端參數操控的繞過路徑。`courseAccess` 只在 `notify.ts` 驗證 webhook 簽章成功後才被設為 `true`。這塊沒有問題。

## 建議

**不建議整包重做。** 沒有查到需要優先搶修的安全漏洞,「重做比較安全」這個假設在這次比對裡沒有得到支持——查到的落差都是刻意的 v1 範圍簡化(單一管理員、不做 organization),不是寫錯。

如果仍然要重做,建議優先順序（風險由高到低,但這裡的「高」相對其他項目而言,不是絕對意義的高風險）：
1. Auth 的 admin 角色機制——如果 `platform-shell-plugin-architecture` 這個 SR 的 Plugin 數量以後真的變多需要細粒度權限,這塊最值得對照官方 Permix 模式重新設計,而不是繼續加 `requiresOperator: boolean`
2. Shell／UI 視覺 token——已經在另一個 SR 規劃,不用因為這份報告重新排序
3. Payments／Course／Database——目前查到的都健康,不需要列進重做優先序
