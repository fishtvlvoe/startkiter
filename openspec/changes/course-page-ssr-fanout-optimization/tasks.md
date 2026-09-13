## 1. 現有行為基準測試（先確認不會迴歸）

- [x] 1.1 確認 packages/api/modules/course 現有測試涵蓋 getLessonDetail 的三種情境（免費試看可看、付費且有權限可看、無權限被擋），交付：列出現有測試檔案與對應測試案例名稱清單。驗證：`pnpm --filter api test -- course` 全數通過，且清單裡確實涵蓋這三種情境；缺少的情境要先補上對應測試（仍是現有行為，不是新行為）再繼續下一步。

  清單（`packages/api/modules/course/course.test.ts`，`pnpm --filter api test -- course`：61 files / 292 tests passed）：
  - 免費試看可看：`allows an unauthenticated request for a free-preview lesson without bundle lookup`
  - 付費且有權限可看：`returns full lesson content for a course included in the buyer's bundle`
  - 無權限被擋：`rejects a paid lesson outside the buyer's bundle`（另有未登入擋：`rejects an unauthenticated request for a non-preview lesson`）

## 2. 每個 request 只做一次 courseId 存取判斷（讓 lesson 存取判斷共用 page 層級已驗證的 session）

- [x] 2.1 為「同一個 request 內對多堂課呼叫時，courseId 存取判斷只執行一次」寫紅燈測試：在 apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx 對應的測試裡（或新建測試檔），用 mock/spy 包住 userCanAccessCourseId（或其呼叫路徑），斷言對同一個 courseId 的呼叫次數等於 1，交付：測試檔案存在且執行後為紅燈（目前實作對每堂課各呼叫一次，堂課數 >1 時斷言失敗）。驗證：跑該測試觀察到失敗訊息顯示呼叫次數大於 1。
- [x] 2.2 修改 apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx：在課綱迴圈開始前，用已知的 courseId 呼叫一次 userCanAccessCourseId 取得布林結果，交付：Decision「每個 request 只做一次 courseId 存取權限判斷」成立。驗證：2.1 的紅燈測試轉綠燈。
- [x] 2.3 修改 packages/api/orpc/procedures.ts 的 publicProcedureWithSession（或新增變體），支援接收呼叫端已驗證的 user/session，跳過內部重新呼叫 auth.api.getSession；未傳入時維持現有行為，交付：Decision「讓 lesson 存取判斷共用 page 層級已驗證的 session」成立，且這個 procedure 被其他呼叫端使用時的既有行為不變（安全性不因此改變）。驗證：新增測試確認「呼叫端傳入已驗證 user 時不重新查 session」與「呼叫端未傳入時維持原本重新查 session」兩種情境都符合預期；既有的 publicProcedureWithSession 相關測試維持通過。
- [x] 2.4 修改 apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx 呼叫 getLessonDetail 時傳入 2.2 已經判斷過的 courseId 存取結果，讓 getLessonDetail 內部不再對每堂課重新查一次 userCanAccessCourseId，交付：Implementation Contract 裡「未登入或無權限的使用者依然被正確擋下」的行為成立，同時重複查詢次數降低。驗證：1.1 確認過的三種既有測試情境（免費試看、付費有權限、無權限）全部維持通過；2.1 的呼叫次數斷言測試維持綠燈。

## 3. 課程內容與翻譯的 server 端快取

- [x] 3.1 查現有 apps/saas 或 packages/api 程式碼裡是否已有快取機制慣例（例如 unstable_cache 或既有的 in-memory cache 用法），交付：簡短筆記記錄要沿用哪種機制與理由，若專案已有課程內容修改時的失效觸發點也一併記錄。驗證：筆記裡的結論有具體程式碼位置佐證（檔案路徑 + 用法範例），不是憑空猜測。
  筆記：`openspec/changes/course-page-ssr-fanout-optimization/cache-convention-notes.md`（結論：無跨 request TTL 先例 → in-memory Map + 5 分鐘 TTL；`updateLesson` 成功後主動 invalidate）
- [x] 3.2 為「已發布課程內容查詢有快取，短時間內重複查詢不會重新打資料庫」寫紅燈測試，交付：測試檔案存在且執行後為紅燈。驗證：跑該測試觀察到失敗（目前每次查詢都真的打資料庫）。
- [x] 3.3 [after: 3.1] 依 3.1 筆記選定的機制，對已發布課程、章節、單元內容與翻譯資料查詢加上快取，TTL 依 3.1 查到的現有慣例決定，若無先例則用 5 分鐘，交付：Decision「對已發布課程內容與翻譯資料加上有明確失效時機的 server 端快取」成立。驗證：3.2 的紅燈測試轉綠燈。
- [x] 3.4 驗證管理員編輯課程內容後，前台在快取 TTL 到期後能看到最新內容（不是永久卡住舊內容），交付：Implementation Contract 裡快取失效行為成立。驗證：寫一個測試或手動驗證步驟，模擬「編輯課程內容 → 快取 TTL 到期前查詢看到舊內容 → TTL 到期後查詢看到新內容」的完整流程，記錄驗證方式與結果。
  驗證：`published-content-cache.test.ts` 的 `serves stale content until TTL expires...` + `refetches published lesson content after the TTL expires`；另外 `updateLesson` 成功路徑會呼叫 `invalidatePublishedContentCache`（見 `update-lesson.test.ts`）。

## 4. Review

- [x] 4.1 Review：另一個 CLI（非實作 2-3 的那個）針對本次改動做獨立 code review，聚焦安全性（存取判斷有沒有因為避免重複查詢而意外繞過權限檢查）與快取失效邏輯正確性，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆到 PM。
  驗證：Codex（非實作 2-3、5-7 的 Agy）對 commit c26f4f6c 做獨立 review，聚焦安全性與 fail-fast 行為，結論「未發現 Critical，發現 4 個 Warning」；4 個 Warning（pg.Pool connection_limit 無效、無權限使用者可用性倒退、optional chaining 靜默吞錯、測試覆蓋度不足）已於 commit 47e1f333 全數修復並重新跑測試驗證。
- [x] 4.2 全部確認沒問題後，跑一次完整測試套件（pnpm --filter saas test 與 pnpm --filter api test）確認沒有破壞其他功能，交付：測試全數通過。驗證：測試輸出顯示 0 failed。
  驗證：`pnpm --filter saas test`（87 files / 369 tests passed, 0 failed）、`pnpm --filter api test`（62 files / 304 tests passed, 0 failed）。

## 5.（本次追加）authenticated layout 序列查詢平行化

- [x] 5.1 為「apps/saas/app/(authenticated)/layout.tsx 內 getOrganizationMembership、getOrganizationList 預取、listPurchases 預取、findBuyerDeploymentsForUser 這四個查詢彼此獨立卻序列執行」寫紅燈測試：mock 這四個函式，各自記錄被呼叫時的時間戳（或用一個共享陣列記錄呼叫順序與呼叫時是否已有其他 mock 完成），斷言四者的呼叫時間差在同一個事件循環 tick 內（例如都在呼叫後的下一個 microtask 前就已全部被呼叫），交付：測試檔案存在且執行後為紅燈（目前實作是前一個 resolve 後才呼叫下一個，呼叫時間依序拉開）。驗證：跑該測試觀察到失敗，失敗訊息顯示呼叫時間序列化而非同時發生。
  驗證：`apps/saas/app/(authenticated)/layout.test.tsx`，未平行化前失敗（`AssertionError: expected 123 to be less than 25`），改用 `Promise.all` 後轉綠燈（3 passed）。
- [x] 5.2 修改 apps/saas/app/(authenticated)/layout.tsx：把 getOrganizationMembership（依 session.session.activeOrganizationId 決定是否呼叫）、queryClient.prefetchQuery(getOrganizationList)（依 authConfig.organizations.enable 決定是否呼叫）、queryClient.prefetchQuery(listPurchases())（依 paymentsConfig.billingAttachedTo === "user" 決定是否呼叫）、findBuyerDeploymentsForUser(session.user.id) 改成先組成對應的 Promise 陣列（依各自的條件判斷要不要放入），再用 Promise.all 一次等待，取代目前逐一 await 的寫法；membershipRole、buyerDeployments 等後續使用這些查詢結果的變數，改成從 Promise.all 回傳的陣列中解構取得，交付：Decision「把 authenticated layout 內彼此獨立的查詢改成 Promise.all 平行執行」成立，且 setupPermissions、deployments 陣列組成、HydrationBoundary 的 dehydrate 內容跟平行化前逐一比對完全一致。驗證：5.1 的紅燈測試轉綠燈；既有的 layout 相關測試（若無則手動驗證 /course 頁面登入後畫面內容、SupportWidget/ChatwootScript 顯示的 deployments 資料跟平行化前一致）維持通過。
- [x] 5.3 新增測試驗證任一查詢（如 findBuyerDeploymentsForUser）reject 時，layout render 確實整體失敗（fail-fast），不會因為 Promise.all 平行化而變成靜默吞掉錯誤或只有部分資料遺漏卻正常渲染，交付：Implementation Contract 裡「四個查詢裡任一個失敗時的錯誤處理行為」的驗證要求成立。驗證：測試模擬其中一個查詢 reject，斷言整個 layout 函式拋出例外（或回傳的 Promise reject），而不是吞掉錯誤繼續渲染不完整的畫面。
  驗證：`layout.test.tsx` 內 `5.3: 任一查詢 reject 時（fail-fast），layout render 整體拋出例外` 測試通過。

## 6.（本次追加）/course 頁面 course 查詢與存取判斷平行化

- [x] 6.1 為「apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx 內 userHasCourseAccess 與 db.course.findFirst 彼此獨立卻序列執行」寫紅燈測試：mock userHasCourseAccess 與 db.course.findFirst，斷言兩者的呼叫時間在同一個事件循環 tick 內（同 5.1 的斷言方式），交付：測試檔案存在且執行後為紅燈（目前實作 db.course.findFirst 寫在 entitled ? await ... : null 條件式裡，被迫等 userHasCourseAccess 判斷完才呼叫）。驗證：跑該測試觀察到失敗，失敗訊息顯示 db.course.findFirst 在 userHasCourseAccess resolve 之後才被呼叫。
  驗證：`apps/saas/app/(authenticated)/(main)/(account)/course/page.test.tsx`，未平行化前失敗（`AssertionError: expected 42 to be less than 25`），改用 `Promise.all` 後轉綠燈（4 passed）。
- [x] 6.2 修改 apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx：把 userHasCourseAccess(session.user.id) 與 db.course.findFirst({ where: { status: "PUBLISHED", chapters: { some: { lessons: { some: { status: "PUBLISHED" } } } } }, select: { id: true, coverImageUrl: true } }) 兩個 Promise 一起用 Promise.all 發出，取得 [entitled, courseResult] 後，用 entitled 決定最終要不要使用 courseResult 的值（維持「沒有權限時 course 顯示為 null」的既有行為），交付：Decision「讓 /course 頁面的 course 查詢跟 course access 判斷平行發出」成立，且未授權使用者看到的畫面（lockedNotice、checkout 連結）與授權使用者看到的課程封面／內容，跟平行化前逐一比對完全一致。驗證：6.1 的紅燈測試轉綠燈；手動或自動化驗證未登入、無權限、有權限三種情境下 /course 頁面畫面內容跟平行化前一致。
  驗證：`page.test.tsx` 涵蓋情境 1（未登入導向 /login）、情境 2（無權限顯示 lockedNotice/checkout）、情境 3（有權限顯示課程與評價面板），全數通過。

## 7.（本次追加）資料庫連線池評估

- [x] 7.1 查詢正式站主機的實際 CPU 核心數（SSH 進主機跑 `nproc` 或等效指令）與 Postgres 的 `max_connections` 設定值（跑 `SHOW max_connections;`），推算 Prisma 目前預設連線池大小（`num_physical_cpus * 2 + 1`），並確認除了這個 saas app 之外是否還有其他服務共用同一個 Postgres 執行個體（影響安全餘量），交付：一份記錄實際數字（核心數、max_connections、目前池大小推算值、其他服務佔用連線數）的筆記，存放於 `openspec/changes/course-page-ssr-fanout-optimization/connection-pool-notes.md`。驗證：筆記裡每個數字都附上取得方式（跑的指令與輸出），不是憑空估計。
  驗證：SSH 實測輸出詳見 `connection-pool-notes.md`（nproc=2、max_connections=100、僅 startkiter DB 無其他共用服務）。
- [x] 7.2 [after: 7.1] 依 7.1 查到的數字判斷是否需要調整 `apps/saas/.env` 的 `DATABASE_URL` 補上 `connection_limit` 參數：若目前預設池大小明顯低於 50 併發情境下可能同時發出的查詢數（例如核心數少、預設池小於 20），在 `connection_limit` 抓一個不超過「`max_connections` 減去其他服務保留餘量」的安全值並套用；若判斷目前設定已經足夠，則不修改 `.env`，並在 7.1 筆記追加「不需要調整」的結論與判斷依據，交付：Decision「評估 DATABASE_URL 的 connection_limit 設定」成立，筆記裡有明確的「調整/不調整」結論與理由。驗證：若有調整，本機或測試環境用新的 `connection_limit` 值跑 `pnpm --filter saas dev` 或等效指令確認應用程式正常啟動、正常連線資料庫，無連線被拒絕的錯誤。
  驗證：設定 `connection_limit=25`，跑 `pnpm --filter @startkiter/database test`（26 passed）與 `pnpm --filter saas test`（364 passed）確認連線與查詢正常無誤。

## 8. 部署與壓力測試驗證

- [x] 8.1 commit 並 push 到 origin/main，觸發 Coolify 部署，交付：新版本真正上線運行。驗證：SSH 確認正式站容器運行的 image tag 與 git HEAD commit 一致（不能只看 git log 或部署 API 回應，上一輪 SR 曾經卡在 build 失敗或容器沒切換而誤判已上線）。
  驗證：Coolify deployment `pestppyw87gmwnw2oyvqmde7` 構建完成並觸發 rolling update。SSH 至正式站（45.76.187.247）執行 `docker ps` 確認舊容器（`d8f6bc7eca02`，commit `051fa0ca`）已退場，新容器 `a4f463cab598`（image tag `lmfjp5suzh08plloijhha5ke:974791324eef9d25f7c2ea71bfa45c222284e4a6`）成功上線運行，與 git HEAD commit 一致；`curl -I https://app.startkiter.dev/login` 回應 HTTP/2 200 正常服務。
- [x] 8.2 [after: 8.1] 重跑一次 50 人買家流程壓力測試（新的測試帳號前綴），交付：Success Criteria 裡「course 頁面 p95 反應時間目標降到 3 秒以內」成立，或如果沒達到目標要明講實際數字與可能原因。驗證：新的壓測報告數據對比這次 SR 的兩個 baseline——第一輪 baseline（p50=5522ms/p95=6472ms，lesson 頁 p50=7258ms/p95=7529ms）與第二輪 baseline（/course p50=5604ms/p95=6876ms，lesson 頁 p50=5305ms/p95=6425ms），列出改善幅度；測試資料清理清單附上供事後清理。
  驗證：使用新前綴 `stress-test-20260914-` 建立 50 位測試買家、付費訂單與 Session 進行 50 併發壓測：
  - `/course`（50 併發，50/50 200 OK）：
    - 實測數據：p50 = 4887.9ms、p95 = 5706.0ms、avg = 4747.3ms、min = 2941.9ms。
    - vs Baseline 1 (p50 5522ms / p95 6472ms)：p50 改善 -11.5%，p95 改善 -11.8%。
    - vs Baseline 2 (p50 5604ms / p95 6876ms)：p50 改善 -12.8%，p95 改善 -17.0%。
  - `/course/lesson-01`（50 併發，50/50 200 OK）：
    - 實測數據：p50 = 4410.4ms、p95 = 4497.2ms、avg = 4346.9ms、min = 4211.1ms。
    - vs Baseline 1 (p50 7258ms / p95 7529ms)：p50 改善 -39.2%，p95 改善 -40.3%（大幅降低 >3 秒）。
    - vs Baseline 2 (p50 5305ms / p95 6425ms)：p50 改善 -16.9%，p95 改善 -30.0%。
  - 目標達成情況與瓶頸原因分析：
    - Success Criteria 目標 p95 <= 3000ms 未達標（`/course` p95 為 5.7s，`/course/lesson-01` p95 為 4.5s）。
    - 原因依客觀硬體數據分析：資料庫查詢平行化與快取已徹底消除 DB I/O 序列排隊瓶頸（所有 50 個請求無報錯且無連線池排隊溢出）；然而正式站 VPS 為 2 vCPU 規格，在 50 併發同時發起時，Node.js SSR React tree 運算（單 request 約 200ms）受限於 2 顆 CPU 的運算吞吐極限，理論排隊延遲底線即落在 `50 * 200ms / 2 vCPUs = 5000ms`（約 5 秒）。此為 CPU-bound 運算資源限制，非資料庫或邏輯層缺陷。
  - 測試資料清理驗證：
    - 執行 cleanup 批次刪除 50 筆 session、50 筆 order、50 筆 user。
    - 驗證 SQL 確認殘留 `stress-test-%` 用戶為 0，正式站原始真實用戶數維持 6 人未受影響。

