## Context

已確認的現況程式碼行為（`apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx`）：`LessonPage` 一開始就用 `auth.api.getSession({ headers: requestHeaders })` 拿到 session，但接著對課綱裡的每一堂課（`for (const l of ch.lessons)` 巢狀迴圈）序列呼叫 `getLessonDetail({ lessonId: l.id })`，這個 oRPC procedure 走 `publicProcedureWithSession` middleware（`packages/api/orpc/procedures.ts:12-22`），middleware 內部又重新呼叫一次 `auth.api.getSession({ headers: context.headers })`，並用 middleware 自己查出來的 `session`/`user` 覆蓋呼叫端傳入 context 的 `user` 欄位。`getLessonDetail` 的 handler（`packages/api/modules/course/router.ts:139-163`）本身再對每堂課查一次 `db.lesson.findUnique`（含 chapter join）與 `userCanAccessCourseId(user.id, lesson.chapter.courseId)`（後者內部還會查 order 資料）。三堂課的正式站資料量下，這代表一次 request 至少觸發 3 次重複的 session 驗證、3 次 lesson 查詢、3 次（邏輯上其實是同一個 courseId）存取權限判斷，而所有課都屬於同一門課，courseId 相同，判斷結果理論上完全一樣。

`/course` 頁面（`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`）也有類似的 session 重複取得問題，但只查一次 course access（不是逐堂課迴圈），影響幅度較小，這次一併處理但重點在 lesson 頁面。

壓測數據對照：`/course` p50 5522ms/p95 6472ms、`/course/lesson-01` p50 7258ms/p95 7529ms（三堂課疊加後比 `/course` 更慢），未登入頁面 `/login` p50 474ms。

## Goals / Non-Goals

**Goals:**

- 消除 lesson 頁面對每堂課重複驗證 session 與重複判斷同一門課存取權限的行為
- 對已發布課程內容、翻譯這類不常變動的資料加上有明確失效時機的 server 端快取
- 完成後 50 人併發下 course 頁面 p95 反應時間有明確改善（目標降到 3 秒以內）

**Non-Goals:**

- 不新增資料庫索引：上一輪排查用 `EXPLAIN (ANALYZE, BUFFERS)` 確認過，目前資料量下 Postgres planner 選 Seq Scan 合理，沒有依據加索引
- 不升級 Coolify VPS 規格：沒有觀測到 CPU/記憶體飽和證據
- 不改變 auth 限流或 PayUni webhook 邏輯：屬於上一輪已封存的 buyer-flow-concurrency-hardening SR
- 不引入 Redis 等外部快取服務：這次資料量小、單一伺服器部署，先用應用層或框架內建快取機制

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

## Implementation Contract

**行為：**
- 使用者在課程頁面看到的內容、能不能存取每堂課、免費試看的判斷結果，跟優化前完全一致；未登入或無權限的使用者依然被正確擋下（`ORPCError("UNAUTHORIZED")`/`ORPCError("FORBIDDEN")`），不會因為這次優化而意外放行
- 管理員修改已發布課程內容後，前台頁面在快取 TTL 到期後看到最新內容（TTL 秒數待 apply 階段依現有專案慣例決定，若無先例則先用 5 分鐘）

**驗證方式：**
- 既有的付費/免費試看/未登入測試案例（`packages/api/modules/course` 相關測試檔）全部維持通過，不因這次改動而失敗
- 新增測試驗證：同一個 request 內對多堂課呼叫時，`userCanAccessCourseId` 或等效的存取判斷邏輯只被呼叫一次（可用 mock/spy 斷言呼叫次數）
- 重跑一次 50 人買家流程壓力測試（新的測試帳號前綴），確認 `/course`、`/course/lesson-01` 的 p95 反應時間比這次 baseline（p50=5522ms/p95=6472ms，lesson 頁 p50=7258ms/p95=7529ms）有明顯改善，目標 p95 降到 3 秒以內
- 手動或自動化驗證：管理員編輯課程內容後，在承諾的快取 TTL 時間內能看到內容更新（不是永久卡住舊內容）

**範圍邊界：**
- 只處理 `/course`、`/course/[lessonId]` 這兩個頁面與其呼叫鏈（`getLessonDetail`、`userCanAccessCourseId` 相關路徑）的重複查詢問題
- 不涉及其他頁面（如 settings、admin 後台）的效能優化
- 不改變 auth、PayUni 相關模組的邏輯（上一輪 SR 已處理完畢）

## Risks / Trade-offs

[Risk] 修改 session context 傳遞方式時，若判斷邏輯寫錯，可能讓存取判斷被意外繞過（安全漏洞：未授權使用者看到付費內容）→ Mitigation: procedure 內部保留 defense-in-depth 檢查，只是避免重複查詢而非移除判斷；每個修改步驟都補測試覆蓋未登入、無權限、免費試看三種情境，確保行為跟優化前逐一比對一致

[Risk] 加了 server 端快取後，管理員在後台修改課程內容，前台可能因快取還沒過期顯示舊內容，造成困惑（例如已下架的課程還顯示著）→ Mitigation: 設定合理的短 TTL（如 5 分鐘），並在 apply 階段確認現有內容管理流程是否已有可掛上去的失效機制；若沒有，先用短 TTL 上線觀察，比完全不設快取的效能風險小

[Risk] 效能優化過程中容易不小心改變原本的業務邏輯（例如免費試看與付費判斷的邊界條件）→ Mitigation: 每個修改都先確認現有測試涵蓋該情境、跑一次紅燈確認測試真的能抓到迴歸，再動手改

## Migration Plan

- 部署步驟：走現有 CI/CD 流程（合併進 main → Coolify 自動觸發建置部署），沒有特殊遷移步驟；上一輪 SR 踩過 Coolify build 卡在 TypeScript typecheck 失敗、以及 image 建好但容器不會自動切換的坑，這次部署驗證時要主動 SSH 確認容器版本，不能只看 git log 或 API 回應
- 回滾策略：如果優化後發現存取判斷有誤（例如誤放行未授權使用者看到付費內容），立即 revert 該次 commit 並重新部署，同時檢查受影響時間窗內是否有真實使用者異常存取到不該看的內容，若有需要另外處理

## Open Questions

- Server 端快取具體用哪種機制（Next.js `unstable_cache`、React `cache`、或專案裡已有的慣例做法）待 apply 階段查現有 `apps/saas`/`packages/api` 程式碼慣例後決定
- 快取 TTL 具體秒數待 apply 階段查現有內容管理流程是否已有主動失效機制；若沒有，先用 5 分鐘作為起始值，上線觀察後可再調整
