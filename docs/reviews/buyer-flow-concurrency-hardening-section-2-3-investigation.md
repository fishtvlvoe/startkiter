# buyer-flow-concurrency-hardening：Section 2、3 排查結論

日期：2026-09-12（Asia/Taipei）  
工作樹：`fishtvlvoe/concurrency-hardening-investigate`  
範圍：只處理 `tasks.md` 的 2.1–2.3、3.1–3.2；未修改 Section 1、4，也未修改 `apps/saas/app/api/payuni/`。

## 結論摘要

| 任務 | 結論 | 交付狀態 |
| --- | --- | --- |
| 2.1 | 429 由 Better Auth 1.6.29 應用層內建限流回應；Coolify/Traefik 沒有這條路由的 rate-limit middleware。規則是登入/註冊每個 IP、每個 path，10 秒最多 3 次。 | 完成 |
| 2.2 | 維持現狀。原始壓測 50 個請求從同一個出口 IP 同時打登入，正好觸發單 IP 防暴力破解規則；不能用這組測試要求把閾值調到 50。 | 完成 |
| 2.3 | 不適用。2.2 沒有選擇調整，因此沒有程式碼或設定修改。 | N/A |
| 3.1 | 主要瓶頸是已登入頁面的 SSR 資料扇出與重複資料庫往返，尤其 lesson 頁逐課程單元串行做 session、lesson、access 檢查；不是目前已知的缺少 session index。 | 完成 |
| 3.2 | 本次不直接改產品程式碼；交付可執行的程式優化方向與下一輪壓測時的主機資源觀測/升級方案。 | 完成 |

## 2. Auth 限流

### 2.1 實際設定位置與重現

應用程式的 auth handler 在 `packages/api/index.ts:35-36` 直接把 `/api/auth/**` 交給 `auth.handler`。`packages/auth/auth.ts:40-54` 的 `betterAuth({...})` 沒有提供 `rateLimit` override；`packages/auth/config.ts:3-29` 也沒有另一份 auth 限流設定。依 `pnpm-lock.yaml`，目前 Better Auth 版本是 `1.6.29`。

Better Auth 1.6.29 的實際套件實作顯示：production 預設啟用 rate limit；登入、註冊、改密碼、改 email 的 special rule 是 `window=10s`、`max=3`，key 是「IP + normalized path」，未設定 `secondaryStorage` 時使用單一 Node process memory storage。429 回應包含 `X-Retry-After`，body 為 `{"message":"Too many requests. Please try again later."}`。

`apps/saas/lib/rate-limit.ts:1-82` 是另一個給 coupons/AI 等功能使用的固定窗口 helper（預設 10/min），沒有接到 auth route，不能當成這次登入限流的設定來源。

正式站現場的 Coolify/Traefik 檢查結果：`coolify-proxy` 是 Traefik v3.6.25；`app.startkiter.dev` router 只有 gzip 與 HTTP→HTTPS redirect，沒有 `rateLimit` middleware 或同類 labels。app container 沒有 CPU/memory limit，但這不會產生 429。故 429 的擋截層是 Better Auth 應用層，不是 Traefik。

在 2026-09-11 23:33（壓測主機輸出時間）對 `https://app.startkiter.dev/api/auth/sign-in/email` 等待超過 10 秒後發出 50 個並行錯誤帳號登入：

```text
status 401: 3
status 429: 47
429 X-Retry-After: 10
429 body: {"message":"Too many requests. Please try again later."}
401 body: {"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
```

這與 Better Auth 內建 limiter 的規則、header、body 完全相符，重現了原始壓測的 47/50。另一次 20 個請求各自帶不同的使用者 `X-Forwarded-For` 值，仍得到 `401:3`、`429:17`；正式代理鏈會把請求歸入同一個受信任 client-IP bucket，不能靠 caller 偽造 header 繞過限制。這個 header 行為是從正式代理結果與 Better Auth 的受信任 IP 規則推得，沒有把它當成獨立的代理限流證據。

### 2.2 決定：維持現狀

選擇「維持現狀」，理由如下：

1. 目前機制是單 IP + path 的短窗口保護，能擋住同一出口 IP 的密集錯誤登入，但不能用這個規則本身區分「合法登入」與「暴力破解」；合法使用者與攻擊流量的區分必須放在更高層的帳號失敗次數、風險驗證或 challenge 策略。
2. 原始 50 併發登入請求全部從同一個出口 IP 發出，測試本身製造了真實使用者不會同時產生的單 IP burst。這能證明防護生效，不能證明正常多使用者登入成功率只有 6%。
3. 把 `max=3` 直接放寬到 50 會削弱同一 IP 的暴力破解防護；目前沒有實際使用者 NAT 誤傷數據支持這個風險交換。

若未來真實活動證明大型 NAT 造成誤傷，應另開安全變更：保留每 IP 短窗口，加上每帳號失敗退避與 Turnstile/風險 challenge，再用分流規則調整合法登入路徑；不要在本 change 全域放寬到 50。

### 2.3 結果

因 2.2 選擇維持現狀，2.3 為 N/A。沒有 auth source、env、Coolify 或 Traefik 設定修改，也沒有假裝用縮小測試驗證不存在的調整。

## 3. Course 頁面效能

### 3.1 實際瓶頸

原始壓測數據：

| 路徑 | p50 | p95 | 解讀 |
| --- | ---: | ---: | --- |
| 未登入 `/login` | 474 ms | — | 沒有 authenticated layout 與課程 entitlement 查詢 |
| 已登入 `/course` | 5,005 ms | 7,311 ms | SSR 頁面資料扇出 |
| 已登入 `/course/lesson-01` | 5,610 ms | 6,688 ms | SSR curriculum + 逐 lesson 驗證 |
| `/api/course/lessons` | 612 ms | 1,128 ms | 同一課程資料的 API 層明顯較快，隔離出 HTML SSR/組裝成本 |

#### `/course` 的查詢鏈

- `apps/saas/app/(authenticated)/layout.tsx:25-79` 強制 dynamic、`revalidate=0`，每次已登入 request 都會取得 authoritative session，並依序處理 membership、organization list、user purchases、buyer deployments。
- `apps/saas/modules/auth/lib/server.ts:7-16` 的 `getSession` 明確使用 `disableCookieCache: true`，所以每次 request 都會做資料庫 session 驗證；React `cache` 只合併同一次 render 內的呼叫，不是跨 request cache。
- `apps/saas/app/(authenticated)/(main)/layout.tsx:10-22` 再取得 session 與 organization list；同一 render 可能由 React cache 合併，但每個 request 仍要付資料庫/應用層成本。
- `apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx:13-33` 先做 `userHasCourseAccess`，再查 published course，並做 translations、lesson list 與本地化。
- `apps/saas/lib/course-access.ts:10-12` → `packages/database/prisma/queries/orders.ts:3-30` 會先查 member，再查 course-access orders；這是 entitlement 的至少兩段 DB 往返。

#### `/course/[lessonId]` 的額外串行扇出

- `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx:95-131` 先做一次 session，再一次性查 chapters、course watermark 與所有 published lessons。
- 同檔 `:145-182` 以巢狀 `for` 串行處理每個 lesson。每個 lesson 先 `buildToolEmbed`，再呼叫 `getLessonDetail`。
- `packages/api/orpc/procedures.ts:13-24` 的 `publicProcedureWithSession` 會再次呼叫 `auth.api.getSession`；因此 page 已有 session，逐 lesson procedure 仍重新驗證 session。
- `packages/api/modules/course/router.ts:141-166` 每個 lesson 又做 `lesson.findUnique`，非免費課再呼叫 `userCanAccessCourseId`；該 access reader 會查 orders，並視 SKU 進一步查 bundle/subscription/invite。
- page 結尾 `:191-207` 再做一次 course access，成功後再查 onboarding survey。

目前正式資料庫只有 1 course、1 chapter、3 published lessons、4 sessions。session 有 `@@unique([token])` 與 `@@index([userId])`（`packages/database/prisma/schema.prisma:76-95`）；member、order、chapter、lesson 也都有目前查詢使用的基本 index。遠端 `EXPLAIN` 顯示 session token 查詢雖因只有 4 rows 選 Seq Scan，但這是小表的合理 planner 選擇，不是缺少 unique index；member userId 查詢走 index。order 的 `courseAccess + (userId OR organizationId)` 在 4-row 小表選 Seq Scan，不能由這次資料量推導需要新增 composite index。

所以這次可被證據支持的主要根因是：已登入頁面每 request 都進 authoritative session + authenticated layout fan-out，lesson 頁再對每個 lesson 做串行且重複的 session/access/lesson 查詢。它能解釋為何 `/course` 和 lesson HTML 比未登入頁面慢一個量級，也能解釋為何 API p95 只有約 1.1 秒而 HTML p95 升到 6.7–7.3 秒。

### Coolify 資源檢查與限制

正式 VPS 是 2 vCPU、約 3.3 GiB RAM、約 7.9 GiB swap。檢查當下 app container 約 185 MiB、CPU 0%，Postgres 約 6 MiB，Traefik 約 23 MiB；但常駐 `buildx_buildkit_coolify-railpack0` 約 1.58 GiB（47.55% host memory）。app 沒有 container CPU/memory limit，當下 load 約 0.3，且沒有 OOM/restart 紀錄。

壓測時段沒有保留 `vmstat`、Docker stats 或 Postgres activity 歷史資料，因此不能把 CPU/RAM 飽和宣稱為 2026-09-11 那次 5–7 秒 latency 的已證實根因。主機容量是併發時的放大風險，現有證據仍先指向 SSR/DB fan-out；不應在沒有壓測時 telemetry 的情況下直接升級主機並宣稱已修好。

## 3.2 交付方案：程式優化方向 + 可執行資源決策包

本次沒有直接修改產品程式碼，原因是目前 change contract 要求先排查；改動 session/access 邊界需要獨立測試，且不能用小資料庫的 Seq Scan 結果硬加 index。建議另開效能 change，依序做：

1. 將 page 已取得的 session/user 傳入 `getLessonDetail` 的 server-side access path，避免每個 lesson 再呼叫 `auth.api.getSession`。
2. 每個 request 只做一次 course entitlement decision；把同一 course 的 access 結果傳給 curriculum 組裝與 survey 判斷。獨立的 tool embed 工作才在確認副作用後用 `Promise.all`，保留敏感內容的權限邊界。
3. 對 published curriculum/translations 做有明確失效策略的 server cache；對真實資料量先重跑 `EXPLAIN (ANALYZE, BUFFERS)`，只有 planner 顯示 order scope 成為熱點時才補 composite index。

下一輪壓測前，先在正式 VPS 執行以下觀測，保留與壓測同一時間窗的資料：

```sh
timeout 120 vmstat 1 > /tmp/startkiter-vmstat.log
docker stats --no-stream > /tmp/startkiter-docker-stats-before.log
docker stats --format '{{.Name}} {{.CPUPerc}} {{.MemUsage}}' > /tmp/startkiter-docker-stats.log
docker exec reh3ixu6o48kngohhelg5epd psql -U startkiter -d startkiter \
  -c 'select state, count(*) from pg_stat_activity group by state;' \
  > /tmp/startkiter-pg-activity.log
```

第一行會在 120 秒後自動停止，避免長駐。Fish 的資源決策門檻：若壓測時 CPU 長時間接近 100%、available memory 持續低於約 512 MiB、出現 swap thrash/OOM，才升級至至少 4 vCPU/8 GiB，並優先把 Coolify buildkit 與 runtime 資源隔離；若資源仍低於門檻，先做 SSR fan-out 優化再重測。這次沒有執行主機升級，也沒有改 Coolify 資源配置。

## 驗證與限制

- 已完成正式站 auth 50 併發重現：3 個 401、47 個 429；429 的 body 與 `X-Retry-After: 10` 對應 Better Auth 1.6.29。
- 已完成 Traefik labels、container limit、Docker stats、kernel OOM/restart 與 PostgreSQL schema/EXPLAIN 的唯讀檢查。
- 原始壓測使用的測試帳號已清理；本次沒有建立新測試帳號。現有舊 cookie 已失效，直接回 `/login`，因此本報告的 course latency 以既有壓測報告與程式/DB/主機證據為準，不把失效 cookie 的 redirect 當成新的 authenticated rerun。
- `tasks.md` 只更新 Section 2、3 的 checkbox；Section 1、4 與 PayUni API 檔案保持未修改。
