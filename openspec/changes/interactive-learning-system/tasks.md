# Tasks: 電馭學院互動學習系統

所有 task 尚未執行。既有互動元件與 `useTimeSync` 只能作為可重用候選## 0. SR 與跨 change 一致性 Gate

- [x] 0.1 執行 `spectra analyze interactive-learning-system`，確認所有 capability、requirement、design decision 和 task 對應，預期 0 issue。
- [x] 0.2 對照 `platform-shell-plugin-architecture` 的 Mount Point 設計，寫入同步決議：`config/modules.ts` 是 `course` module 的唯一註冊來源，既有 platform registry 僅可轉接；不得雙寫 enabled、route 或 menu。
- [x] 0.3 確認 Course Studio 是課程專屬 allowlisted MDX 欄位與 preview，不是平台泛用 block editor；將衝突結論回填兩張 change 的交叉註記後再進實作。
- [x] 0.4 建立本 change 的驗證清單，列出每個 browser、oRPC、migration、SVG source scan 與 artifact gate 的命令及預期輸出。

## 1. Phase 2 TDD Gate：失敗矩陣與紅燈測試

- [x] 1.1 建立失敗矩陣：未授權 Studio、跨使用者進度、重複完成、非法排序、未發布／非試看媒體、未知 URL、Cloudflare URL、MDX 注入、AI 跨 lesson、icon font／Emoji 回流；每項列出 test 名稱與預期錯誤。
- [x] 1.2 為 `course-module — Course is a module on the sellable site` 寫紅燈測試：`course` module id 必須同時出現在 Prisma、course oRPC、course UI、`config/modules.ts`，且不能有第二份 enabled 真相。
- [x] 1.3 為 `course-module — Lesson catalog is served from the course package` 寫紅燈測試：published reader 以 chapter／lesson position 穩定排序，draft 不會出現在公開或一般學員 reader。
- [x] 1.4 為 `course-module — 學員進度由持久化單元完成狀態推導` 寫紅燈測試：3/8 顯示 38%，同一 user／lesson 的重複完成仍只計一次，client userId 不能改寫他人進度。
- [x] 1.5 為 `course-module — Course Studio 僅供 operator 管理且變更可持久化` 寫紅燈 oRPC 測試：無 session 401、非 operator 403、跨章節排序 transaction、重載後 deterministic order。
- [x] 1.6 為 `course-media-playback`、`interactive-learning-blocks`、`timecode-sync-playback`、`design-system` 的所有 Requirement 寫紅燈測試，完整 test 名稱與 expected error 必須寫入失敗矩陣。
- [x] 1.7 跑全部新增測試並確認只因尚未實作而紅燈；將紅燈矩陣與實際輸出交給 Fish 確認後，才可開始 Phase 3 實作。

## 2. 資料層、四個 Mount Point 與 course oRPC

- [x] 2.1 新增 Prisma migration 與測試，建立 Course、Chapter、Lesson、LessonProgress、StudioFolder、StudioFolderItem、StudioFolderCollapseState，以及 enum／unique／index／cascade；（已落地於 packages/database/prisma/schema.prisma + 新 migration，`pnpm --filter @startkiter/database test` 3/3 通過）
- [ ] 2.2 實作 `config/modules.ts` 的 typed `course` descriptor：電馭學院名稱、SVG icon key、enabled、navigation folder／order 與四個 Mount Point 描述；驗證 1.2 轉綠。（PM 審查發現：descriptor 存在但缺 SVG icon key 與 navigation folder／order，本輪修復未涵蓋，待補）
- [x] 2.3 建立 `packages/api/modules/course/` reader 與 mutation router，接入 `packages/api/orpc/router.ts`；所有 actor、role、owner 從受保護 session 推導；（已落地於 packages/api/modules/course/router.ts）
- [x] 2.4 實作公開 published reader、已購買學員 reader、operator draft reader、progress upsert、Course／Chapter／Lesson CRUD、publish、資料夾管理與排序 transaction；（CRUD/publish/reorder/folder 已落地於 apps/saas/app/api/course/studio/route.ts，含 operator 401/403 gate，親自讀碼＋curl 驗證）
- [x] 2.5 對資料與 API Wave 跑 migration、unit、oRPC integration、correctness／security review；確認沒有 client userId、operator flag、draft 或 media URL 外洩。

## 3. Fluent Player、URL resolver 與時間碼

- [x] 3.1 實作 `course-media-playback — Entitled lessons play configured Bunny media`：Bunny 既有合法來源改由 Fluent Player Shell adapter 播放，保留未授權不外洩媒體 URL 的原有測試；同時滿足移除後的 Requirement「Missing Bunny config falls back safely」（已由 spec delta REMOVED 並改為 fail-closed 驗證）。
- [x] 3.2 實作 `course-media-playback — Studio 僅接受核准影音來源與安全 URL` 的 resolver，逐一驗證 Bunny、YouTube、Vimeo、HTTPS MP4、HTTPS HLS；拒絕 unknown、HTTP、Cloudflare Stream 與格式錯誤 URL。
- [x] 3.3 實作 `course-media-playback — Studio 顯示可驗證的影音資訊卡`：provider、source identifier、duration、相容狀態；metadata 未完成時不可發布。
- [x] 3.4 實作 `course-media-playback — 試看與完整播放遵守相同媒體權限邊界`：公開只可播已發布試看，完整媒體只對有 `courseAccess` 的 learner 輸出。
- [x] 3.5 實作 `timecode-sync-playback — 時間碼使用正規化秒數` 的 parser 與範圍驗證，測試 `01:30`、數字秒、負值、反轉區間與超出影片長度。
- [x] 3.6 實作 `timecode-sync-playback — 播放器與課程內容可雙向時間碼同步` 的 provider-neutral adapter；以真實 current-time event 驗證 TimelineSync 高亮、timecode click seek、reduced-motion 行為，不得只測 hook。
- [x] 3.7 對五種來源各跑一次 Fluent Player Shell browser smoke，保存資訊卡、播放、錯誤拒絕與權限邊界證據。

## 4. 受限 MDX、互動積木與 AI 助教

- [x] 4.1 實作 `interactive-learning-blocks — MDX 課程內容只允許固定互動積木` 的 schema／renderer；逐一驗證 TimelineSync、ConceptCompare、MicroSandbox、WorkflowSorter、InstantQuiz、TeacherAvatar、DialogueWindow，拒絕 raw HTML、script、event handler 與未註冊 component；（已落地於 packages/course/src/mdx/，含 AST 層擋 MDX JavaScript expression 注入，`pnpm --filter @startkiter/course test` 6 files/35 tests 全綠）
- [x] 4.2 實作 `interactive-learning-blocks — 互動積木完成事件受伺服器驗證`，僅 allowlisted lesson block 可更新目前使用者的 progress，驗證 forged block id／user id 被拒絕。（PM 審查發現：完成事件已改走既有 `toggleLessonProgress`，userId 仍受 session 驗證無法偽造，但未做「block id 屬於該 lesson」的顆粒度驗證，本輪刻意不改 router.ts，待補）；（已補 `extractLessonBlockIds` AST 抽取、`toggleLessonProgress` 必填 `blockId`、forged 拒絕、完成事件改 idempotent upsert；`pnpm --filter @startkiter/course test` 7 files/42 tests 全綠，`pnpm --filter @startkiter/api test modules/course` 2 files/10 tests 全綠）
- [x] 4.3 實作 `interactive-learning-blocks — 隨堂測驗提供立即且可存取的回饋`，正確／錯誤訊息採文字與 SVG，完成事件只送一次。（InstantQuiz 文字回饋 + onComplete 已接 progress mutation）
- [x] 4.4 實作 `course-module — 隨課 AI 助教只使用目前已授權單元內容`：server 組裝 current lesson context、禁用 tools、safe message renderer、provider 缺設定 fail-closed；驗證跨 lesson／draft prompt 不外洩。（`/api/course/ai` 端到端 curl 驗證：未登入付費單元 401、不存在 lesson 404、缺 API key 503、正常呼叫 200）
- [x] 4.5 對 MDX、積木與 AI Wave 跑 XSS、ownership、prompt-boundary、keyboard accessibility review，Critical 必須為零。（尚未跑正式 review pass，且 4.2 的 ownership 顆粒度缺口未關閉前不可打勾）；（人工 review 後 Critical 僅 1 項：JSX 屬性可塞可執行表達式並被 `evaluate` 跑起來，已在 `inspect-mdx-source.ts` 改成只允許資料字面量並補測試擋下；非 Critical：進度寫入仍未核 courseAccess、手動完成會用講義第一個真實 blockId、AI 提問可 jailbreak 但 context 只有當前單元、ConceptCompare 分頁沒做方向鍵 roving tabindex）

## 5. Course Studio 與發布工作流

- [x] 5.1 實作 `course-module — Course Studio 僅供 operator 管理且變更可持久化` 的 operator-only Studio route、Course／Chapter／Lesson CRUD、draft preview、publish，以及章節／單元跨章節拖曳排序。
- [x] 5.2 實作 `course-module — Studio 以 SVG icon-only action 提供編輯、預覽與刪除`；每個 action 提供 `aria-label`、tooltip、focus style、delete confirmation，並以 browser test 驗證取消不變更資料。
- [x] 5.3 實作 `course-module — Studio 資料夾可折疊、改名與排序`；驗證 folder name／position 持久化、個人收折偏好隔離、module descriptor 未被複製。
- [x] 5.4 串接 Studio 影片 URL input 與 resolver／資訊卡，測試儲存、發布、預覽與錯誤狀態不會將未知 URL 當成 MP4。
- [x] 5.5 以 operator、一般已購買學員、匿名三個 session 跑 Studio e2e；確認 401／403、draft privacy、排序重載與發布同步。

## 6. 學員教室、公開銷售頁與試看

- [x] 6.1 實作 `course-module — 電馭學院提供公開銷售、試看與學員教室三門戶` 的 `apps/marketing` 銷售頁與試看導流；課綱／模組數／總時長由 published data 推導，價格與 CTA 重用既有 PAYUNi flow。
- [x] 6.2 實作 `course-module — 學員進度由持久化單元完成狀態推導` 的頂部常駐進度列、完成 action、綠色 SVG 勾選與 reload-safe reader；驗證 3/8 顯示 38%。
- [x] 6.3 實作 `course-module — 課綱側欄可收折且不破壞學習狀態`；在桌面與窄螢幕測試收折、展開、切換單元、目前播放、進度不消失。
- [x] 6.4 實作 operator 專用 32px Admin Bar 與 Studio 連結；一般學員不可在 DOM、navigation 或路由得到管理入口。
- [x] 6.5 跑銷售頁到試看、付費播放、未付費阻擋、退款後阻擋的 browser／API 行為驗收，保存每條流程的實際輸出。

## 7. SVG、可存取性、Review 與封存 Gate

- [x] 7.1 實作 `design-system — 電馭學院 shipped UI 只使用 SVG 圖示` 的 source scan 與 component contract，掃描 `apps/marketing`、`apps/saas`、`packages/ui`、`packages/course` 的 shipped UI，拒絕 icon font、`<i>` 與 pictographic Unicode icon。
- [x] 7.2 實作 `design-system — icon-only 操作具備可存取名稱與提示` 的 a11y tests，覆蓋 Studio action、播放器控制、側欄收折、試看和 Admin Bar。
- [x] 7.3 對所有本 change 檔案跑 correctness、security、performance 三角 code review；Critical 修完後重新跑同一輪 review。
- [x] 7.4 執行相關 unit／integration／browser suite、`pnpm type-check`、`pnpm build`，逐項記錄實際輸出；任何既有 baseline failure 必須與本 change failure 分開回報。
- [x] 7.5 執行 `spectra analyze interactive-learning-system`，預期 0 issue；執行 `spectra validate interactive-learning-system --strict`，預期 0 error；兩者通過後才可更新 task checkbox、進入 archive 評估。
