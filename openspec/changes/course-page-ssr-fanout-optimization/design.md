## Context

已確認的現況程式碼行為（`apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`）：`LessonPage` 一開始就用 `auth.api.getSession({ headers: requestHeaders })` 拿到 session，但接著對課綱裡的每一堂課（`for (const l of ch.lessons)` 巢狀迴圈）序列呼叫 `getLessonDetail({ lessonId: l.id })`，這個 oRPC procedure 走 `publicProcedureWithSession` middleware（`packages/api/orpc/procedures.ts:12-22`），middleware 內部又重新呼叫一次 `auth.api.getSession({ headers: context.headers })`，並用 middleware 自己查出來的 `session`/`user` 覆蓋呼叫端傳入 context 的 `user` 欄位。`getLessonDetail` 的 handler（`packages/api/modules/course/router.ts:139-163`）本身再對每堂課查一次 `db.lesson.findUnique`（含 chapter join）與 `userCanAccessCourseId(user.id, lesson.chapter.courseId)`（後者內部還會查 order 資料）。三堂課的正式站資料量下，這代表一次 request 至少觸發 3 次重複的 session 驗證、3 次 lesson 查詢、3 次（邏輯上其實是同一個 courseId）存取權限判斷，而所有課都屬於同一門課，courseId 相同，判斷結果理論上完全一樣。

`/course` 頁面（`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`）也有類似的 session 重複取得問題，但只查一次 course access（不是逐堂課迴圈），影響幅度較小，這次一併處理但重點在 lesson 頁面。

壓測數據對照：`/course` p50 5522ms/p95 6472ms、`/course/lesson-01` p50 7258ms/p95 7529ms（三堂課疊加後比 `/course` 更慢），未登入頁面 `/login` p50 474ms。

**追加排查（本次更新）**：上述修復完成並部署後，重跑 50 人壓測結果：`/course` p50 5604ms/p95 6876ms（幾乎沒變，甚至壓測雜訊上略差於 baseline）、`/course/lesson-01` p50 5305ms/p95 6425ms（明顯改善，但仍未達 3 秒內目標）。用程式碼讀取（非猜測）確認根因：`/course` 與 `/course/lesson-01` 共用 `apps/saas/app/(authenticated)/layout.tsx` → `(main)/layout.tsx` → `(account)/layout.tsx` 三層 layout。`(authenticated)/layout.tsx` 內，`getSession()` 之後依序 `await` 了四個彼此獨立的查詢：
1. `getOrganizationMembership(activeOrganizationId, userId)`（僅依賴 `session.session.activeOrganizationId`）
2. `queryClient.prefetchQuery(getOrganizationList)`（僅依賴 session 內的 user，`organizations.enable` 為 true 時執行）
3. `queryClient.prefetchQuery(listPurchases())`（僅依賴 session 內的 user，`paymentsConfig.billingAttachedTo === "user"` 為 true 時執行）
4. `findBuyerDeploymentsForUser(session.user.id)`

這四個查詢彼此沒有資料依賴關係（都只需要 `session`，不需要彼此的查詢結果），但現有程式碼寫成序列 `await`，逐一執行。`(main)/layout.tsx` 另外呼叫 `getOrganizationList()`（React `cache()` 包裝，同一 request 內與上面第 2 項自動去重，不算額外查詢）。`/course/page.tsx` 本身呼叫 `userHasCourseAccess(userId)`（內部序列查 `getOrganizationIdsForUser` → `db.order.findMany`，這兩者有資料依賴，不可平行化）與 `db.course.findFirst(...)`，後者目前寫成 `entitled ? await db.course.findFirst(...) : null`，被迫等 `userHasCourseAccess` 判斷完才發出，但查詢本身（`where: { status: "PUBLISHED", ... } `）並不依賴 `entitled` 的值，只有「要不要顯示結果」依賴。

`getSession()` 本身已用 React `cache()` 包裝（`apps/saas/modules/auth/lib/server.ts`），同一 request 內重複呼叫不會重複查資料庫，已排除為可疑對象。`apps/saas/.env` 的 `DATABASE_URL` 沒有設定 `connection_limit`，Prisma 預設連線池為 `num_physical_cpus * 2 + 1`，50 併發下每個 request 平行發出多個查詢時，池子可能成為排隊點，需要評估。

## Goals / Non-Goals

**Goals:**

- 消除 lesson 頁面對每堂課重複驗證 session 與重複判斷同一門課存取權限的行為
- 對已發布課程內容、翻譯這類不常變動的資料加上有明確失效時機的 server 端快取
- **（本次追加）** 把 `(authenticated)/layout.tsx` 內彼此獨立的四個查詢改成 `Promise.all` 平行執行
- **（本次追加）** 把 `/course/page.tsx` 內 `userHasCourseAccess` 與 `db.course.findFirst` 改成平行發出
- **（本次追加）** 評估並視需要調整 `DATABASE_URL` 的 `connection_limit`
- 完成後 50 人併發下 course 頁面 p95 反應時間有明確改善（目標降到 3 秒以內）

**Non-Goals:**

- 不新增資料庫索引：上一輪排查用 `EXPLAIN (ANALYZE, BUFFERS)` 確認過，目前資料量下 Postgres planner 選 Seq Scan 合理，沒有依據加索引
- 不升級 Coolify VPS 規格：沒有觀測到 CPU/記憶體飽和證據
- 不改變 auth 限流或 PayUni webhook 邏輯：屬於上一輪已封存的 buyer-flow-concurrency-hardening SR
- 不引入 Redis 等外部快取服務：這次資料量小、單一伺服器部署，先用應用層或框架內建快取機制
- **（本次追加）** 不重構 `getCourseAccessOrdersForUser` 內部 `getOrganizationIdsForUser` → `order.findMany` 這兩段有資料依賴的序列查詢成單一 join：範圍只處理彼此獨立卻被誤寫成序列的查詢，不是所有序列查詢都要消除
- **（本次追加）** 不引入額外的連線池中介軟體（如 PgBouncer）：先評估 Prisma 內建 `connection_limit` 參數是否足夠，這是最小改動，額外基礎設施留待實際數據顯示不夠用時再評估

## Decisions

### 讓 lesson 存取判斷共用 page 層級已驗證的 session，procedure 內部不重複查詢

`LessonPage` 已經有 session，讓 `getLessonDetail` 支援接收呼叫端已驗證的使用者身分而不強制在 middleware 內重新呼叫 `auth.api.getSession`。具體做法：在 `publicProcedureWithSession` 旁新增一個變體（或調整 middleware 邏輯），允許呼叫端明確傳入已驗證的 `user`/`session` 物件時直接採用，不重新查詢；未傳入時維持現有行為（重新查一次），確保這個 procedure 被其他呼叫端（未來可能有的 client 端直接呼叫）使用時安全性不變。

**Alternatives Considered:**
- 完全繞過 oRPC，在 `page.tsx` 直接呼叫底層 db 查詢與存取判斷邏輯，不透過 `getLessonDetail` procedure：否決，因為會讓存取判斷邏輯分裂成兩份維護（page 端一份、procedure 端一份），未來其中一份修改忘記同步會產生安全漏洞
- 用 React `cache()` 包住 `auth.api.getSession`，指望同一次 render 內的呼叫自動合併：否決，因為 for 迴圈裡每次 `getLessonDetail` 呼叫是走獨立的 oRPC context 邊界（`createProcedureClient` 產生的呼叫），不保證跟 React 的 render cache 是同一個作用域，屬於不可靠的隱式依賴，且無法解決「重新設計成不用查」這個根本問題

### 每個 request 只做一次 courseId 存取權限判斷，結果供所有堂課與問卷判斷共用

`LessonPage` 裡巢狀迴圈對每一堂課都間接觸發一次 `userCanAccessCourseId`，但所有課的 `chapter.courseId` 相同（同一門課），判斷結果不會因為堂課不同而改變。在迴圈開始前，用已知的 `courseId` 呼叫一次 `userCanAccessCourseId`，把布林結果傳給每堂課的內容組裝邏輯與後面的 onboarding survey 判斷共用，procedure 內部收到呼叫端已經確認過權限的標記時跳過重複查詢。

**Alternatives Considered:**
- 保留現有的 per-lesson 呼叫模式，但在 procedure 內部加一層 in-memory 快取（用 `courseId` 當 key）：否決，這其實是用快取繞過同一個問題，多引入一層快取失效邏輯的複雜度，不如直接在呼叫端判斷一次乾淨，且這個快取只在單一 request 生命週期內有意義，範圍比正式的 server cache 窄卻要多寫一套邏輯
- 完全信任 page 層級已經判斷過，procedure 內部取消存取檢查：否決，這是安全性倒退（defense in depth 原則），procedure 作為可能被其他呼叫端使用的介面，必須保留自己的存取檢查，只是避免用「重新查一次」的方式做，改用呼叫端傳入的已驗證結果

### 對已發布課程內容與翻譯資料加上有明確失效時機的 server 端快取

已發布的課程、章節、單元內容與翻譯資料變動頻率低（管理員手動編輯才會變），適合快取。用 Next.js 內建的快取機制（`unstable_cache` 或等效的既有專案慣例，apply 階段依 `apps/saas`/`packages/api` 現有快取用法決定，不引入新套件），對這類資料設定明確 TTL，管理員編輯課程內容的動作觸發快取失效（若專案現有的內容管理流程已經有失效機制可以掛上去，優先重用）。

**Alternatives Considered:**
- 不加快取，只靠減少重複查詢次數解決效能問題：否決，即使單次 request 的查詢次數降到最低，50 人併發時資料庫還是要處理 50 次獨立查詢，快取能進一步降低這類「不常變動資料」在高併發下的資料庫負載
- 引入 Redis 等外部快取服務：否決，這次資料量小、單一伺服器部署，沒有必要新增基礎設施依賴，先用應用層或框架內建機制驗證效果，不夠再評估外部快取

### （本次追加）把 authenticated layout 內彼此獨立的查詢改成 Promise.all 平行執行

`(authenticated)/layout.tsx` 目前對 `getOrganizationMembership`、`getOrganizationList` 預取、`listPurchases` 預取、`findBuyerDeploymentsForUser` 四個查詢用序列 `await` 逐一執行，但這四個查詢彼此不需要對方的結果，只共同依賴已經拿到的 `session`。改成先組出這四個（依 config flag 決定要不要納入）Promise，再用 `Promise.all` 一次等待全部完成，讓資料庫可以同時處理這些查詢而不是排隊。`getOrganizationMembership` 的結果只用於後面的 `setupPermissions`，`findBuyerDeploymentsForUser` 的結果只用於後面組 `deployments` 陣列，兩者跟 `queryClient.prefetchQuery` 的兩次呼叫之間沒有交叉依賴，可以安全地一起平行發出。

**Alternatives Considered:**
- 把這四個查詢搬到更上層或更下層的 layout，指望 Next.js 的部分渲染自動平行化：否決，Next.js 的 layout 巢狀渲染仍然是父層 `await` 完才渲染子層，不會自動平行化同一個 layout 內的多個 `await` 陳述式，必須顯式用 `Promise.all`
- 用 `unstable_cache` 或 React `cache()` 包裝這幾個查詢降低重複呼叫：否決，這四個查詢在單一 request 內本來就只呼叫一次，沒有重複呼叫的問題，真正的瓶頸是「序列等待」而非「重複查詢」，兩者是不同問題，快取解決不了序列等待

### （本次追加）讓 /course 頁面的 course 查詢跟 course access 判斷平行發出

`/course/page.tsx` 目前把 `db.course.findFirst(...)` 包在 `entitled ? await ... : null` 條件式裡，語意上暗示「只有有權限的人才需要查課程資料」，但實際上這個查詢本身（依 `status: "PUBLISHED"` 篩選）跟使用者是否有權限完全無關，只是「要不要把查詢結果顯示出來」跟權限有關。把 `userHasCourseAccess(userId)` 與 `db.course.findFirst(...)` 兩個 Promise 一起用 `Promise.all` 發出，取得兩個結果後再用 `entitled` 決定要不要使用 `course` 的值（沒有權限時捨棄查詢結果，不影響回應內容，只是讓兩個原本前後相依的網路往返改成同時發生）。

**Alternatives Considered:**
- 維持現有寫法，只在 `entitled === true` 才查 `course`：否決，這個微優化（省下無權限使用者的一次查詢）換來的是所有已授權使用者（多數情境）多等一次序列往返，在併發情境下淨損失更大；`db.course.findFirst` 對未授權使用者而言查詢成本很低（單一 `findFirst` 無 join 到深層資料），不值得為了省這次查詢犧牲平行化

### （本次追加）評估 DATABASE_URL 的 connection_limit 設定

Prisma 沒有在 `DATABASE_URL` 設定 `connection_limit` 時，預設池大小為 `num_physical_cpus * 2 + 1`。50 人併發、每人多個平行查詢的情境下，若實際可用連線數低於瞬時查詢數，查詢會在 Prisma 內部排隊，表現為「查詢已平行發出，但延遲沒有等比例下降」。apply 階段需要：先查詢正式站主機的實際 CPU 核心數推算目前預設池大小，再依 Postgres 伺服器本身 `max_connections` 上限，抓一個安全值設定 `connection_limit`（不超過 Postgres `max_connections` 扣掉其他服務保留的餘量）。若查出來目前設定已經足夠（例如核心數夠多、池子夠大），則明確記錄「不需要調整」與判斷依據，不強行加參數。

**Alternatives Considered:**
- 直接調大到一個經驗值（如 20）不查證：否決，違反「用工具驗證不猜」的原則，且過大的 `connection_limit` 若超過 Postgres `max_connections` 實際上限，會導致連線被拒絕而不是變快
- 引入 PgBouncer 等外部連線池服務：否決，這次規模與資源下屬於過度工程，先用 Prisma 內建參數調整，數據顯示不夠再評估

## Implementation Contract

**行為：**
- 使用者在課程頁面看到的內容、能不能存取每堂課、免費試看的判斷結果，跟優化前完全一致；未登入或無權限的使用者依然被正確擋下（`ORPCError("UNAUTHORIZED")`/`ORPCError("FORBIDDEN")`），不會因為這次優化而意外放行
- 管理員修改已發布課程內容後，前台頁面在快取 TTL 到期後看到最新內容（TTL 秒數待 apply 階段依現有專案慣例決定，若無先例則先用 5 分鐘）
- **（本次追加）** `(authenticated)/layout.tsx` 平行化後，`setupPermissions`、`deployments` 陣列組成、`HydrationBoundary` 的 dehydrate 內容，跟平行化前逐一比對必須完全一致；四個查詢裡任一個失敗（reject）時的錯誤處理行為（目前序列寫法下，前面查詢失敗會讓後面查詢完全不執行）改成 `Promise.all` 後行為改變（任一個 reject 就整個 layout render 失敗），這個行為差異要在測試裡明確驗證並記錄是否可接受
- **（本次追加）** `/course/page.tsx` 平行化後，未授權使用者看到的畫面（`lockedNotice`、checkout 連結）與授權使用者看到的課程封面／內容，跟平行化前逐一比對必須完全一致

**驗證方式：**
- 既有的付費/免費試看/未登入測試案例（`packages/api/modules/course` 相關測試檔）全部維持通過，不因這次改動而失敗
- 新增測試驗證：同一個 request 內對多堂課呼叫時，`userCanAccessCourseId` 或等效的存取判斷邏輯只被呼叫一次（可用 mock/spy 斷言呼叫次數）
- 重跑一次 50 人買家流程壓力測試（新的測試帳號前綴），確認 `/course`、`/course/lesson-01` 的 p95 反應時間比這次 baseline（p50=5522ms/p95=6472ms，lesson 頁 p50=7258ms/p95=7529ms）有明顯改善，目標 p95 降到 3 秒以內
- 手動或自動化驗證：管理員編輯課程內容後，在承諾的快取 TTL 時間內能看到內容更新（不是永久卡住舊內容）
- **（本次追加）** 新增測試驗證 `(authenticated)/layout.tsx` 內四個查詢確實平行發出（用 mock 記錄各查詢被呼叫的時間戳或呼叫順序，斷言彼此呼叫時間差在同一個事件循環 tick 內，而非前一個完成後才呼叫下一個）
- **（本次追加）** 新增測試驗證 `/course/page.tsx` 內 `userHasCourseAccess` 與 `db.course.findFirst` 平行發出，斷言方式同上
- **（本次追加）** 重跑 50 人壓測後，`/course` 的 p50/p95 需比這次的新 baseline（p50=5604ms/p95=6876ms）有明確改善；若仍未達 3 秒內目標，需在 tasks.md 5.2 明講實際數字與可能原因（不可含糊帶過或宣稱已解決）

**範圍邊界：**
- 只處理 `/course`、`/course/[lessonId]` 這兩個頁面與其呼叫鏈（`getLessonDetail`、`userCanAccessCourseId` 相關路徑）的重複查詢問題，以及這兩個頁面共用的 `(authenticated)`／`(main)`／`(account)` 三層 layout 內的序列化查詢
- 不涉及其他頁面（如 settings、admin 後台）的效能優化，即使它們共用同一層 layout（本次只驗證 `/course` 系列頁面的效能改善，不擴大驗證範圍）
- 不改變 auth、PayUni 相關模組的邏輯（上一輪 SR 已處理完畢）
- 不動 `getCourseAccessOrdersForUser` 內部有資料依賴的序列查詢

## Risks / Trade-offs

[Risk] 修改 session context 傳遞方式時，若判斷邏輯寫錯，可能讓存取判斷被意外繞過（安全漏洞：未授權使用者看到付費內容）→ Mitigation: procedure 內部保留 defense-in-depth 檢查，只是避免重複查詢而非移除判斷；每個修改步驟都補測試覆蓋未登入、無權限、免費試看三種情境，確保行為跟優化前逐一比對一致

[Risk] 加了 server 端快取後，管理員在後台修改課程內容，前台可能因快取還沒過期顯示舊內容，造成困惑（例如已下架的課程還顯示著）→ Mitigation: 設定合理的短 TTL（如 5 分鐘），並在 apply 階段確認現有內容管理流程是否已有可掛上去的失效機制；若沒有，先用短 TTL 上線觀察，比完全不設快取的效能風險小

[Risk] 效能優化過程中容易不小心改變原本的業務邏輯（例如免費試看與付費判斷的邊界條件）→ Mitigation: 每個修改都先確認現有測試涵蓋該情境、跑一次紅燈確認測試真的能抓到迴歸，再動手改

[Risk]（本次追加）`Promise.all` 平行化後，若其中一個查詢因為程式錯誤丟出非預期例外，會讓整個 layout render 失敗（現有序列寫法下同樣會失敗，但失敗前面的查詢已經完成，行為差異不大）；但若原本某個查詢有意寫成「失敗也不影響其他部分」的假設（目前程式碼沒有這種寫法，但要在改動時確認），平行化後這個假設會被打破 → Mitigation: 逐一確認四個查詢目前都沒有 try/catch 吞掉錯誤的邏輯（目前程式碼皆為直接 `await`，失敗即拋出），平行化前後错误传播路径一致；新增測試驗證任一查詢失敗時 layout render 確實失敗（維持原有的 fail-fast 行為，不因平行化而變成靜默忽略錯誤）

[Risk]（本次追加）調整 `connection_limit` 若設定過大，可能超過 Postgres `max_connections` 實際上限，導致其他服務（如背景排程、其他 app）連線被拒絕 → Mitigation: 調整前先查 Postgres 實際 `max_connections` 設定值與目前其他服務佔用的連線數，抓一個有安全餘量的值；調整後在測試環境驗證過再上線，並在壓測期間監控是否有連線被拒絕的錯誤

## Migration Plan

- 部署步驟：走現有 CI/CD 流程（合併進 main → Coolify 自動觸發建置部署），沒有特殊遷移步驟；上一輪 SR 踩過 Coolify build 卡在 TypeScript typecheck 失敗、以及 image 建好但容器不會自動切換的坑，這次部署驗證時要主動 SSH 確認容器版本，不能只看 git log 或 API 回應
- 回滾策略：如果優化後發現存取判斷有誤（例如誤放行未授權使用者看到付費內容），立即 revert 該次 commit 並重新部署，同時檢查受影響時間窗內是否有真實使用者異常存取到不該看的內容，若有需要另外處理
- **（本次追加）** 若調整了 `connection_limit`，回滾策略是移除該參數（恢復 Prisma 預設池大小），這是單純的環境變數變更，回滾成本低

## Open Questions

- Server 端快取具體用哪種機制（Next.js `unstable_cache`、React `cache`、或專案裡已有的慣例做法）待 apply 階段查現有 `apps/saas`/`packages/api` 程式碼慣例後決定（**已於 3.1 解決**：採用 in-memory Map + 5 分鐘 TTL，見 `cache-convention-notes.md`）
- 快取 TTL 具體秒數待 apply 階段查現有內容管理流程是否已有主動失效機制；若沒有，先用 5 分鐘作為起始值，上線觀察後可再調整（**已於 3.3 解決**）
- **（本次追加）** `connection_limit` 的具體建議值待 apply 階段查正式站主機規格與 Postgres `max_connections` 設定後決定
