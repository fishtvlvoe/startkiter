# StartKiter Monorepo 全面架構與現況盤點

盤點日期：2026-08-30  
盤點範圍：`/Users/fishtv/Development/products/startkiter` 整個 Git worktree（排除 `node_modules/`、generated output）  
盤點性質：唯讀檢查；本報告是獨立文件，不是 Spectra change。

## 0. 結論先講

StartKiter 已不是空殼：3 個 Next.js 應用、30 個 workspace package、64 個 Prisma model、42 個 route、Better Auth／Permix／PAYUNi 與多個課程 plugin 都有實體代碼。

主要決策風險：

1. 原始測試命令在沒有 `DATABASE_URL` 時 exit 1；補 dummy URL 後才得到 578/578 passing tests。
2. 42 個 route 只有 20 個 SaaS API 同路徑 `route.test.ts(x)`；procedure test 不等於 HTTP adapter test。
3. 管理員判斷同時存在 `admin.access`、`isCourseOperator(ADMIN_EMAIL)`、Pages CMS email gate 三套邊界。
4. `packages/course/catalog.ts` 有 `PLACEHOLDER_MEDIA`；`packages/payments/provider/polar/index.ts:77` 是 `throw new Error("Not implemented")`。
5. active changes 是 `product-delivery-rollout`、`unified-support-desk`；後者 task 9.4 三管道 Chatwoot E2E 仍未完成。
6. Codex Security Deep Scan 被環境擋住：MCP 回報父工作階段未提供 managed filesystem permission profile。本報告不宣稱通過獨立 Deep Scan，也不宣稱沒有漏洞。

建議先處理測試自足、route 安全、授權模型收斂、placeholder／未實作 provider，再決定 Chatwoot、Mission、Organization 的下一輪投入。

## 1. 系統架構總覽

### 1.1 Monorepo 結構

`pnpm-workspace.yaml` 實際宣告 `apps/*`、`packages/*`、`tooling/*`；root `package.json` 顯示 pnpm `11.20.0`、Node `>=22`、Turbo `^2.10.10`。

| 區域 | 實際內容 | 證據 |
|---|---|---|
| `apps/saas` | 主產品：登入後 SaaS、課程前台、後台、operator、結帳、API adapter | manifest 依賴 api/auth/course/payments/permissions；`next.config.ts:9` standalone |
| `apps/marketing` | 公開銷售頁、課程/blog content、analytics、i18n | manifest 依賴 database/i18n/payments/ui/utils；Content Collections |
| `apps/docs` | Fumadocs 買家文件站 | `next.config.ts:1-4` 使用 Fumadocs MDX |
| `packages/api` | Hono/oRPC router、course、assignment、payments、admin、support、notifications | `packages/api/orpc/procedures.ts:7-49` |
| `packages/auth` | Better Auth、Email/OAuth、Passkey、2FA、Organization、login audit | `auth.ts:16-45` |
| `packages/database` | Prisma schema/client/query、migration，另有 Drizzle 遺留層 | 64 models、39 migration SQL |
| `packages/permissions` | Permix 規則 | `create-permission-rules.ts:40-62` |
| `packages/course` | course schema、MDX、player、interactive blocks、course pack | manifest 含 MDX、WebContainer、Zod |
| `packages/payments` | PAYUNi、Shopline、Stripe、Dodo、Polar abstraction、coupon/bundle/invoice | manifest 含各 SDK |
| `packages/bundles`／`coupons` | 組合包與折扣碼 domain | 各依賴 database；SaaS 有 API/UI |
| `packages/course-assignment`／`course-quiz`／`course-review` | plugin domain | 各有 router、model、tests |
| `packages/notifications`／`mail` | notification catalog/DB 與 Email provider | notifications source 7 files；mail 有多 provider |
| `packages/platform` | shell/plugin mount、lesson tool、CMS sanitization、deployment contract | SaaS transpile；platform tests |
| `packages/storage` | S3 signed URL/object storage | AWS SDK client/presigner |
| `packages/github-kit` | GitHub claim/repo grant/version | SaaS 依賴且有 routes |
| `packages/site-agent` | package 存在但沒有 `.ts/.tsx` source | source count 0；SaaS manifest 無依賴 |
| `legacy/`、`vendor/`、`docs/reference/` | 舊版／唯讀上游參考 | .gitignore 排除 vendor、code、.secrets，不是 current runtime |

依賴方向：

```text
apps/saas / apps/marketing / apps/docs
                 │
                 ▼
              @startkiter/api
        ┌────────┼────────┐
        ▼        ▼        ▼
      auth  permissions  domain packages
                         (course/payments/support)
                 │
                 ▼
       database / Prisma → PostgreSQL
```

### 1.2 技術棧與部署

版本來自 workspace catalog 與 manifests：

| 層 | 現況 |
|---|---|
| Runtime | Node `>=22`；本次實測 Node 26.6.0 |
| Build | pnpm 11.20.0、Turbo ^2.10.10、TypeScript 7.0.2、Vitest 4.1.10 |
| Web | Next ^16.3.1、React 19.2.8、Tailwind 4.3.3、next-intl 4.13.6 |
| API | Hono ^4.13.2、oRPC 1.15.0、Zod ^4.4.3 |
| DB | PostgreSQL；Prisma/@prisma-client 7.9.1、pg ^8.23.0；另保留 Drizzle |
| Auth | Better Auth 1.6.29；Passkey、magic link、openAPI、organization、2FA |
| AI | AI SDK 7.0.66、OpenAI SDK package；AI notes／course AI routes |
| Storage | AWS S3 client/presigner 3.1111.0；local upload 只有 development adapter |
| Deployment | SaaS/marketing Next standalone；README/SOP 指 Coolify + VPS + Docker；`deploy/zeabur.yaml` 是舊遺留 |
| Headers | SaaS config 有 X-Frame-Options、nosniff、COOP、COEP |

### 1.3 正式 specs 交叉比對

`openspec/specs/` 實際有 52 個 `spec.md`。下表依 source、route、router、schema、test 的 grep/讀碼判定；「核心落地」不等於已有 live E2E。

| spec | 判定 | 實體證據 |
|---|---|---|
| auth-login | 核心落地 | packages/auth、unauthenticated pages |
| buyer-credential-handoff | 部分 | deployment credential、settings encryption |
| buyer-dev-skill | 文件／工具 | agent skills/docs，非 runtime |
| buyer-docs-site | 核心落地 | apps/docs、Fumadocs、content test |
| buyer-extension-convention | 架構落地 | 多 packages/plugin convention |
| buyer-pages-cms | 核心落地 | Page、pages-cms handlers/admin UI |
| buyer-repo-upstream-sync | 部分 | promotion/upstream scripts/docs |
| buyer-status-panel | 核心落地 | BuyerDeployment、deployment components |
| buyer-template-selection | 部分 | templates route/UI；完整 flow 未 live 驗證 |
| checkout-coupons | 核心落地 | coupon package、validate route、Coupon model |
| coolify-fleet-management | 核心落地 | deployment procedures、BuyerDeployment |
| course-ai-batch-import | 核心代碼落地 | batch-import routes/tests；slug/failure 邊界 |
| course-ai-notes-single | 核心落地 | AI notes route、Gemini settings、dialog/tests |
| course-assignment-plugin | 核心落地 | assignment router/UI/models/tests |
| course-bundles | 核心落地 | Bundle/BundleCourse、admin/sales/routes |
| course-code-sandbox | 部分 | WebContainer dependency與sandbox code；需 runtime acceptance |
| course-instructor-scoped-access | 核心落地 | CourseInstructor、access helper、procedures |
| course-lifecycle-email | 核心落地 | EmailDeliveryLog、welcome/expiration、cron |
| course-media-library | 核心落地 | Media、media procedures/admin/tests |
| course-media-playback | 部分 | player/video resolver/lesson；real provider未由 unit 證明 |
| course-module | 核心落地 | Course/Chapter/Lesson、router、admin/learner |
| course-onboarding-survey | 核心落地 | response model、procedure、modal |
| course-pack-import | 核心落地 | CoursePack/Mission、import/list |
| course-pack-mission-execution | 部分／歷史混雜 | run-mission-check、MissionFormValue、AFC code |
| course-quiz-plugin | 核心落地 | QuizAttempt、quiz router/UI |
| course-review-plugin | 核心落地 | review models/router/UI |
| design-system | 核心落地 | packages/ui、theme、各 app 使用 |
| einvoice-issuance | 核心代碼落地 | Invoice/Allowance、ECPay/ezPay |
| github-kit-fulfillment | 部分 | github-kit、claim routes、GithubKitGrant |
| i18n-multilingual | 核心落地 | next-intl、6 locale translations |
| interactive-learning-blocks | 核心落地 | interactive components、registry、progress |
| lesson-private-message | 核心落地 | model、procedures、upload intent |
| lesson-tool-embed | 核心落地 | signed token、origin validation、tests |
| lesson-watch-time-tracking | 核心落地 | WatchTimeLog、record/toggle |
| line-learner-community | 部分 | invite URL/course invite；不做靜默入群 |
| login-admin-audit-log | 核心落地 | LoginAttempt/AdminLog、Auth hook |
| managed-hosting-tiers | 部分 | deployment UI/model；完整 tier lifecycle 外部化 |
| marketing-site-content | 核心落地 | marketing content collections/i18n |
| mcp-gateway | 核心代碼落地 | McpConnection、guard/handler/routes |
| multi-gateway-checkout | 核心代碼落地 | gateway settings、provider routes |
| mvp-offer | 核心落地 | MVP SKU、payments config、pricing |
| notifications | 核心代碼落地 | notification source/API/model/UI，package 無直接 test |
| official-site-deployment | 部分 | standalone/deployment docs；線上需 curl |
| one-click-deploy | 部分 | Dockerfile、promotion/docs |
| operator-settings | 核心落地 | admin settings、encrypted settings |
| organization-tenancy | 部分／待決策 | Better Auth organization/models/UI；與 v1 邊界並存 |
| payuni-checkout | 核心落地 | checkout、return/notify、crypto、Order |
| platform-core-boundary | 架構落地 | platform、permissions、buyer docs |
| platform-marketplace | 核心落地 | marketplace、PluginContent、plugins |
| platform-mount-points | 核心落地 | shell/menu/sidebar mount |
| project-governance | 文件／流程 | AGENTS、OpenSpec、docs/scripts |
| saas-shell | 核心落地 | authenticated layout、UnifiedShell、admin/course |
| sell-flow-ux | 部分 | pricing/checkout/coupon；完整 buyer flow 未本次跑 |
| sheets-export-engine | 核心落地 | sheets、export routes/procedures |
| site-agent | 缺失 | package source 0；SaaS 無 dependency |
| subscription-billing | 核心代碼落地 | plan/subscription、period notify、cancel |
| test-clean-package-promotion | 核心工具 | promote script/tests；需持續守 env negative cases |
| test-startkiter-bootstrap | 部分 | bootstrap/deploy docs；非 runtime |
| timecode-sync-playback | 部分 | player/watch-time；未見獨立 timecode domain/E2E |
| v1-scope-boundary | 文件／架構 | AGENTS、README、payments config |
| vps-production-deployment | 核心流程 | Docker standalone、Coolify/VPS SOP |

## 2. 功能模組盤點

### 2.1 認證與權限：部分完成（核心完整，模型需收斂）

Better Auth + Prisma 在 `packages/auth/auth.ts:40-45`；login/signup/reset/verify pages 存在，Google/LINE/GitHub wiring 在 `auth.ts:87-92`。  
`packages/api/orpc/procedures.ts:26-49` 的 protectedProcedure 以 request headers 取得 session，無 session 丟 UNAUTHORIZED。  
`create-permission-rules.ts:44-61` 定義 global admin 與 organization owner/admin/instructor/user。  
同時存在 global `admin.access`、`isCourseOperator(email, ADMIN_EMAIL)`、Pages CMS `resolvePagesCmsAccess`。Passkey、2FA、organization、login audit 有 code，但不全是 v1 MVP 承諾。

### 2.2 課程系統：部分完成

建課／章節／單元：Course/Chapter/Lesson model、admin page、router、tests，核心完整。  
影片／字幕／媒體：Media、register/list/delete/upload signed URL、player、video resolver 有；真實 provider、字幕資料與 playback 仍需外部 acceptance。  
AI 講義：AI notes route、Gemini encrypted setting、dialog/tests 有。  
批次匯入：兩個 batch-import route、dialog、tests 有；CR 留下 slug 與 failure reporting 深度邊界。  
Course Pack／Mission：import/list/run check、MissionFormValue encryption、AFC blocks 有，但 Mission 被 rollout 列為進階、非交付必要路徑。  
Assignment、Quiz、Review、private message、course invite、lesson-tool、watch-time 各自有 model/API/UI/tests，屬核心落地。

### 2.3 金流與訂閱：核心代碼完整，正式 provider acceptance 分開計

`Order` 有 orderNo unique、gatewayTradeNo unique、user/org indexes、paid/refund fields（schema 約 313-348 行）。PAYUNi checkout/return/notify/period-notify、簽章、加密、webhook claim code/tests 都有。Bundle/Coupon、subscription plan/subscription/cancel/expiration、Invoice/Allowance、ECPay/ezPay 也有。  
payments 仍列 Lemon/Polar/Dodo/Creem SDK；Polar provider 是 Not implemented。依賴存在不等於 provider 可用。

### 2.4 後台管理：核心完整，權限分層需驗證

實際 admin page/layout 18 個：bundles、course、email-settings、media、onboarding-surveys、orders、organizations、pages、revenue、settings/checkout-gateway、settings/einvoice、settings/gemini、settings、users，加 admin layout。  
operator page 6 個：assignment-admin、audit-log、course-invites、lesson-messages、quiz-admin、review-admin。  
`admin/layout.tsx:15-25` 允許 global operator 或有 instructor assignment 者進 admin shell；子頁/API 再做 mutation gate。不能靠隱藏 menu 當安全控制。

### 2.5 CMS：核心落地

`Page` model 有 type/slug/locale/body/status/previousSnapshot，`@@unique([slug, locale])` 與 status/type/locale index。  
`packages/api/modules/pages-cms/handlers.ts` 實作 GET/POST/PATCH/DELETE/restore、snapshot、status validation、sanitized write。SaaS route 只是 re-export，handler 的 `resolvePagesCmsAccess` 才是 auth。已有 handlers/access tests，但沒有同路徑 route adapter test。

### 2.6 通知／Email：部分完成

notifications catalog/create/API procedures（list/unread/read/preferences）、Notification/UserNotificationPreference、mail 多 provider、EmailDeliveryLog、welcome/expiration lease 都有。  
缺口：`packages/notifications` 7 source/0 tests；`packages/mail` 25 source/1 test；provider accepted、delivery、bounce/complaint 未形成完整 observability。

### 2.7 SaaS 其他模組

| 模組 | 判定 | 證據 |
|---|---|---|
| deployment/managed hosting | 部分 | BuyerDeployment、Coolify procedures/status panel；VPS 是外部 gate |
| support desk | 部分 | SupportTicket、Chatwoot/LINE/Telegram procedures/widget；9.4 未完成 |
| MCP gateway | 核心代碼 | connections model、guard、handler、routes/tests |
| marketplace/plugin shell | 核心代碼 | marketplace、PluginContent、plugins/sidebar |
| organization UI | 部分 | Better Auth organization、member/invitation/billing；邊界需定案 |
| site-agent | 缺失 | package 無 source、SaaS 無 dependency |
| image proxy | 核心但需 ownership review | `image-proxy/[...path]/route.ts:14-27` 只允許 avatars/media bucket，簽 1 小時 URL；route 無 session |

## 3. 測試覆蓋率現況

### 3.1 指定命令實跑

原樣執行 `pnpm --filter platform --filter api --filter saas test`：**exit 1**。

- platform：22 files／114 tests passed。
- api：51 files passed、1 failed，共 52；228 tests passed。失敗檔 `modules/assignment/assignment-lifecycle.test.ts`，錯誤 `DATABASE_URL is not set`，來源 `packages/database/prisma/client.ts:7`。
- pnpm first-fail 使 saas 沒執行。

補上非敏感 dummy URL：

```text
DATABASE_URL='postgresql://mock:mock@localhost:5432/mock' pnpm --filter platform --filter api --filter saas test
```

結果 **exit 0、578/578**：

- platform 22 files／114 tests
- api 52 files／230 tests
- saas 49 files／234 tests

三個 package 都有 Vitest native config 的 ESM/CommonJS warning，但本次沒有因此失敗。

### 3.2 route 與 test 比對

實際 find 結果：全 repo `route.ts` 42 個；SaaS API 41 個；同路徑 SaaS `route.test.ts(x)` 20 個；全 repo test/spec 216 個。

沒有直接 route test 的 SaaS API：

```text
[[...rest]], assignment/upload, bundles/[id], bundles/admin,
course/ai-notes/settings, course/lesson-messages/upload, course/lessons,
cron/assignment-upload-cleanup, cron/lesson-message-upload-cleanup,
github/claim-status, github/claim, mcp/connections/[id],
mcp/connections, pages-cms/[id]/restore, pages-cms/[id],
pages-cms, repo-version
```

部分路徑有 oRPC/handler 間接測試，但 adapter 的 method/header/body/HTTP status 仍缺直接 coverage。

### 3.3 完全沒有直接測試的模組

以 source/test find 比對，明顯缺口：

- `packages/notifications`：7 source／0 tests。
- `packages/logs`：3／0；`packages/storage`：6／0；`packages/utils`：4／0。
- `packages/mail`：25／1。
- `apps/saas/modules/auth`：14／0；`modules/course`：2／0；`modules/payments`：13／0；`modules/settings`：17／0。
- `packages/site-agent`：0／0，這是缺失，不是測試缺口。

### 3.4 E2E

找到 5 個 Playwright spec 檔：

- `e2e/startkiter.spec.ts`：6 個 test 宣告。
- `apps/marketing/tests/blog.spec.ts`
- `apps/marketing/tests/changelog.spec.ts`
- `apps/marketing/tests/home.spec.ts`
- `apps/saas/tests/login.spec.ts`

本次沒有啟動 browser server，沒有把 E2E 宣稱為本輪通過。已知涵蓋 marketing public content 與 login；沒有看到 checkout/payment webhook、course admin CRUD、media upload、AI notes、batch import、assignment、quiz、CMS、MCP、Chatwoot 三管道的完整 Playwright coverage。

## 4. 資安／風險掃描

### 4.1 所有 route 的身分驗證交叉檢查

本次對全部 42 個 route.ts 執行 rg。結果分四類：

**明確使用 session／operator gate**：bundles、checkout、checkout/status、course AI、AI notes、batch import、course lessons、course studio、exports、github claim、lesson-tool config、MCP、plugins、repo-version、sidebar-layout、templates 等 route 有 auth.api.getSession 或 delegated auth marker。

**Public by design，但由簽章／secret 保護**：

- PAYUNi notify/period-notify/return、Shopline notify、Stripe webhook：使用 signature/payload validation，不應加 user session。
- cleanup cron：ASSIGNMENT_UPLOAD_CLEANUP_SECRET、LESSON_MESSAGE_UPLOAD_CLEANUP_SECRET Bearer secret + timingSafeEqual；其他 cron 使用 CRON_SECRET。
- assignment 與 lesson-message upload：production 直接 404；development 用短效 signed token、storage key、content type/size、DB intent。
- coupon validate：公開查詢，以 60 秒 20 次 client identifier rate limit、body validation、product lookup 保護。

**route file 沒有 session marker，但 handler 內有授權**：Pages CMS 三個 adapter 只有 re-export。apps/saas/app/api/pages-cms/route.ts 第 1 行直接 export handlers；packages/api/modules/pages-cms/handlers.ts 內呼叫 resolvePagesCmsAccess；access.ts 第 26-31 行對無 session 回 401、email 不等於 ADMIN_EMAIL 回 403。這是 grep false positive，不能直接列為缺 auth。

**持續 review 對象**：

- apps/saas/app/api/[[...rest]]/route.ts 只把所有 method 轉給 Hono；安全性取決於每個 oRPC procedure 的 public/protected/admin 分類。
- image proxy 沒有 session，改靠 bucket allowlist + signed URL；必須確認 getSignedUrl 不允許跨 user 猜 key。
- route adapter 缺多個直接 HTTP tests，不能只看 procedure tests。

### 4.2 權限判斷不一致

| 邊界 | 實作 | 風險 |
|---|---|---|
| global admin | checkPermission(..., admin.access)，來源 user.role === admin | 適合全域後台，但不是 email operator |
| course operator | isCourseOperator(email, ADMIN_EMAIL)／courseOperatorProcedure | 單一設定 email；與 role admin/instructor 不必然相同 |
| Pages CMS | resolvePagesCmsAccess 只認 session email 與 ADMIN_EMAIL | 與 admin.access 刻意不同；NavBar 顯示曾有歷史 CR 不一致風險 |
| organization | membership role + organization.* permission | target organizationId 查 membership 的方向正確；需確保每個 mutation 都走 helper |
| oRPC | protectedProcedure 只保證登入，adminProcedure 才保證 global admin | procedure 若誤用 protected 且沒有 resource ownership，會形成 IDOR 風險 |

目前沒有足夠 current-code 證據把上述差異直接定為已利用漏洞；這是最高價值後續 review target。

### 4.3 環境變數／密鑰

正面證據：

- .gitignore 忽略 .env、.env.*，只放行 .env.example／.env.template，也忽略 *.pem、.secrets/。
- git ls-files 顯示 tracked env-like 檔只有模板，沒有 tracked .env、private key 或 credentials。
- git grep 沒命中 sk-、AWS AKIA、GitHub ghp_、private key header、production password literal；private key 命中只在 test fixture。
- sensitive settings 使用 SiteSetting.ciphertext，payment／Gemini／invoice 有 SETTINGS_ENCRYPTION_KEY 路徑。

風險：

- assignment upload、lesson-tool token 有 local fallback secret；production 沒 secret 會 throw，但 fallback 不可被誤帶入 production 或 clean package。
- image proxy signed redirect 的 Cache-Control max-age=3600 需符合撤銷需求。
- promotion script 的歷史 CR 曾抓到 .env.production.local 等變體風險；後續每次 promotion 仍要用 negative test 與實拷證明。
- 本次沒有讀取或回報實際 .env secret value。

### 4.4 Deep Scan 限制

已呼叫 Codex Security Deep Scan，但 MCP 原文是：

    Deep Scan cannot safely start a read-only worker: the parent must provide a managed filesystem permission profile.

因此沒有 scan manifest/findings/coverage 可引用；本節是本機 grep／讀碼，不是獨立 security certification。

## 5. 技術債與已知問題

### 5.1 TODO/FIXME/HACK

rg -n -i TODO/FIXME/HACK/XXX/not implemented/未完成/尚未 的明確未處理項目：

- apps/saas/modules/organizations/components/OrganizationInvitationModal.tsx:58：TODO: handle error。
- packages/payments/provider/polar/index.ts:77：throw new Error("Not implemented")。
- packages/course/catalog.ts:7,22,79-80：LessonMediaKind 含 placeholder，且使用 PLACEHOLDER_MEDIA。
- 多處「尚未完成」是 payment/invoice 未設定時 fail-closed 的錯誤訊息，不應全部當 TODO。
- 大量 placeholder= 是 input placeholder，不等於假資料。

### 5.2 假資料、mock、空殼

- 排除 test files 後，沒有找到一般 runtime fake data／mock data 被主流程直接使用的明確證據。
- apps/marketing/next.config.ts:18-22 仍允許 placehold.co、picsum.photos；若正式銷售頁引用，屬內容完成度風險。
- PLACEHOLDER_MEDIA 是明確 runtime placeholder，應決定保留為模板、改空值、或阻擋 publish。
- Polar 未實作若仍能從 UI/settings 選到，會變成 runtime 500；若非支援 provider，應在 catalog/settings 排除並加 test。
- ConsentProvider 的 default no-op context 不足以判定功能缺失，需看實際 provider。
- packages/site-agent 是最明確的「有 spec、無 runtime source」案例。

### 5.3 Prisma schema

實際統計：64 models、22 enums、128 個 index/unique 命中；大部分 user/course/關聯 lookup 已有 index。改善候選：

1. Purchase.subscriptionId 同時 @unique 與 @@index([subscriptionId])（schema:230-236）；unique 通常已自帶 index，應查 PostgreSQL catalog 確認是否冗餘。
2. 多個 status 仍是 String：CoursePack、Order refund fields、Bundle、upload/invoice 等；application validation 外的非法狀態較難防。
3. Organization.slug String? @unique（schema:170-180）允許 null；若每組織都必須有 slug，schema 沒強制。
4. Lesson.slug String @unique 是全域 unique，不是 courseId + slug；是否允許不同課程重複 slug 需產品決策。
5. Notification 只有 userId index；若 query 是 userId + read + createdAt，需 query log/EXPLAIN 證明是否要複合 index。
6. TwoFactor.secret 有 index；secret 通常不是 query key，可作 schema hygiene 候選，不是已確認漏洞。
7. migration 目錄有 39 個增量 SQL；本次沒有對 production DB 寫入，也沒有把 db push 當 production migration 證明。應在乾淨 PostgreSQL 實跑 prisma migrate deploy。

## 6. 對照舊系統與整合狀態

使用 repo 內 docs/discuss、openspec/changes/archive、docs/cr-report-*，再以 current code 交叉確認；歷史文件不單獨視為 runtime 證據。

| 舊系統／來源 | 已整合 | 尚未／邊界 |
|---|---|---|
| supastarter shell/UI/i18n/Better Auth | apps/saas、marketing、docs、auth/ui/i18n | 原始 marketing/docs與被禁止 provider 不應當現行產品 |
| THE-TU／woomin 課程觀看、媒體、comments、assignment、bundles、coupons、subscriptions、invoice | Course/Chapter/Lesson、Media、LessonComment、Assignment、Bundle/Coupon、Subscription、Invoice models/package/API/UI | 原始 NextAuth/Apple/login layer 不搬；內容資料搬遷非 source 自動證明 |
| PAYUNi checkout/crypto/return/notify | payments payuni、checkout/notify/return、Order、tests | merchant credentials、付款、退款是外部 acceptance |
| Shopline／Stripe | abstraction、notify/webhook、multi-gateway code | v1 主金流仍是 PAYUNi；provider code 存在不代表啟用 |
| LINE Login | Better Auth social provider、login/config | callback/external OAuth 仍受 credentials/domain gate |
| LINE learner community | course invite／LINE invite URL | 禁止靜默入群；community URL 是外部設定 |
| GitHub kit | github-kit、GithubKitGrant、claim routes | GitHub App、org invite、repo access live flow 未由本次證明 |
| Coolify fleet | deployment package、BuyerDeployment、SOP、standalone Docker | VPS/DNS/SSL/Coolify API 是外部狀態 |
| Chatwoot support | SupportTicket、Chatwoot/LINE/Telegram webhook、widget | active change 9.4 三管道 E2E 未完成 |
| site-agent | 無 | package source 0、SaaS 無 dependency，未整合 |
| platform shell/plugin/marketplace | platform、PluginContent、marketplace、sidebar/mount | 第三方 plugin 生態與商業流程尚非完整產品 |

重要矛盾：早期 docs/discuss/extract-map.md 的抽取順序／邊界，不能覆寫後來 AGENTS.md 與 openspec/specs/；決策時以現行 specs 為準。

## 7. 建議下一步優先順序

| 順位 | 建議 | 完成證據 | 工作量 |
|---:|---|---|---|
| 1 | 修測試環境契約 | 原始命令自足或有明確 setup；重跑取得 578 tests | 小 |
| 2 | Route adapter security hardening | 補未測 route 的 401/403/404、method/header/body、signature/ownership HTTP tests | 中 |
| 3 | 統一 operator 權限模型 | 決定 admin.access、ADMIN_EMAIL、course operator 集合，抽共用 server guard | 中 |
| 4 | Signed URL／image proxy／local upload review | 驗跨 user key、過期、撤銷、cache、production fallback | 中 |
| 5 | 清理 placeholder／未實作 provider | publish gate 或移除 PLACEHOLDER_MEDIA；Polar 排除或完成 | 小～中 |
| 6 | 補通知／Email／storage／settings tests | 覆蓋 catalog、provider fail-closed、未讀 query、delivery/retry | 中 |
| 7 | 完成或移除 Chatwoot 9.4 主線 | 三管道建立 ticket 並在 Chatwoot 收件匣看到；否則 descope | 中～大 |
| 8 | Real provider acceptance matrix | subscription、period notify、退款、發票留下 webhook、DB、idempotency、retry evidence | 大 |
| 9 | Schema/migration rehearsal | 查 redundant index、status/slug contract、notification EXPLAIN；乾淨 DB migrate deploy | 中 |
| 10 | 再決定 Mission、Organization、site-agent | 先產品取捨，避免多條半完成主線 | 小（決策）／大（實作） |

## 8. 執行證據索引與限制

本次使用的主要命令：

    git rev-parse --show-toplevel
    git status --short --branch
    find apps packages -type f -name route.ts
    find apps packages -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \)
    rg -n getSession/isCourseOperator/auth.api/verify/signature/CRON_SECRET apps packages --glob route.ts
    rg -n TODO/FIXME/HACK/not implemented apps packages
    git ls-files | rg env/credentials/pem/key
    git grep -n sk-/AKIA/ghp_/PRIVATE KEY
    pnpm --filter platform --filter api --filter saas test
    DATABASE_URL=postgresql://mock:mock@localhost:5432/mock pnpm --filter platform --filter api --filter saas test

本次沒有修改程式碼、schema、migration、tasks、Git history 或部署環境；沒有啟動 browser E2E；沒有讀取或回報實際 secret；沒有對 production DB 寫入；Deep Scan 因 managed filesystem permission profile 缺失而未啟動。
