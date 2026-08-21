## MODIFIED Requirements

### Requirement: Course is a module on the sellable site

StartKiter 必須以「電馭學院（StartKiter Academy）」提供站內課程模組，而不是導向第三方課程平台。課程模組必須同時在 `schema.prisma`、`packages/api/modules/course/`、`apps/saas/app/.../course/` 與 `config/modules.ts` 有可追蹤的 `course` module id；`config/modules.ts` 是名稱、SVG icon key、導航群組、順序與 enabled 狀態的唯一註冊來源。

#### Scenario: 付費學員在站內進入電馭學院

- **WHEN** 擁有 `startkiter-mvp` 已付款訂單且 `courseAccess=true` 的學員開啟已發布單元
- **THEN** 系統必須在 StartKiter 站內的電馭學院教室播放，且不得要求啟動第三方課程平台

##### Example: 同一 module id 可跨四個 Mount Point 追蹤

- `config/modules.ts` 宣告 `id="course"` 與電馭學院的 SVG icon key
- Prisma migration、course oRPC router、學員頁與 Studio 頁都使用相同 `course` module id
- 測試找不到任一 Mount Point 或找到第二份 enabled 真相時失敗

### Requirement: Lesson catalog is served from the course package

`packages/course` 必須提供由已發布 Course、Chapter、Lesson 組成的確定排序課綱。公開 reader 只能輸出已發布資料；operator preview 可以讀 draft；任何 reader 都必須以 `position` 再以穩定 id 排序。

#### Scenario: 已發布課綱在公開頁與學員教室一致

- **WHEN** operator 發布一個含兩章、八個單元的 Course
- **THEN** 公開銷售頁和有權學員教室都必須以相同章節與單元順序顯示該已發布版本

##### Example: 草稿不外洩

- operator 建立尚未發布的 `lesson-draft-01`
- 匿名與一般學員查詢課綱時不會收到該 id、草稿內容、AI context 或影音 URL
- operator 使用 Studio preview 時才可讀到草稿

## ADDED Requirements

### Requirement: 電馭學院提供公開銷售、試看與學員教室三門戶

系統必須提供公開電馭學院銷售頁、已購買學員教室與 operator 專用 Course Studio 三個門戶。公開頁必須展示已發布的 Hero、課程亮點、講師／FAQ 內容、課綱、唯一 PAYUNi 結帳 CTA 與試看入口；價格與結帳行為必須讀取既有單一 SKU，不能另建 checkout。

#### Scenario: 匿名訪客只可試看標記單元

- **WHEN** 未登入訪客由公開銷售頁選擇 `isFreePreview=true` 的 `lesson-01`
- **THEN** 系統必須在 Fluent Player Shell 中提供該已發布試看內容，且不得輸出其他非試看單元的媒體或內容

##### Example: 鎖定單元不因公開課綱而解鎖

- 課綱顯示 `lesson-02` 但其 `isFreePreview=false`
- 匿名訪客開啟 `lesson-02` 時遭拒絕，回應不含可播放媒體 URL
- 已付款學員開啟同一單元時可進入學員教室

### Requirement: 學員進度由持久化單元完成狀態推導

系統必須以 `LessonProgress` 記錄目前使用者完成的已發布單元。頂部常駐進度列必須顯示 `round(100 * completed / total)` 與 `completed/total`，例如完成 3 個共 8 個已發布單元時顯示 `38% · 3/8 單元`。完成標記必須 idempotent，不能由 client 傳入百分比或其他 userId。

#### Scenario: 學員完成單元後立即看見一致進度

- **WHEN** 有課程權限的使用者將 `lesson-03` 標記完成
- **THEN** 系統必須持久化該使用者與該單元的完成狀態，立即更新頂部百分比、完成數和課綱中的綠色 SVG 勾選

##### Example: 重複完成不會重複計算

- user A 已完成 `lesson-01`、`lesson-02`、`lesson-03`，共 8 個已發布單元
- user A 再次送出 `lesson-03` 完成請求
- `LessonProgress(user A, lesson-03)` 仍只有一筆，畫面仍顯示 `38% · 3/8 單元`

### Requirement: 課綱側欄可收折且不破壞學習狀態

學員教室必須提供課綱側欄，顯示章節、單元編號、時長、目前播放中狀態和已完成單元的綠色 SVG 勾選。使用者可以一鍵收折或展開側欄；窄螢幕可以重排版面，但不可隱藏頂部進度資料。

#### Scenario: 收折側欄不切換或重置目前單元

- **WHEN** 學員正在播放 `lesson-03` 並收折、再展開課綱側欄
- **THEN** `lesson-03` 必須仍是目前單元，播放時間、完成狀態與進度數值不得改變

##### Example: 單元切換重新載入合法資料

- user A 從 `lesson-03` 點選 `lesson-04`
- 系統只讀取 user A 可播放的 `lesson-04` 已發布內容與 AI context
- 側欄指出 `lesson-04` 為目前單元，並保留 user A 原有完成勾選

### Requirement: Course Studio 僅供 operator 管理且變更可持久化

Course Studio 必須沿用既有 `ADMIN_EMAIL` operator 判定。operator 可以管理 Course、Chapter、Lesson、資料夾、模組排列、`isFreePreview`、發布狀態、allowlisted MDX、AI context 與影音設定；章節與單元必須支援確定排序與跨章節移動。所有 mutation 必須由伺服器 session 推導 actor，使用 transaction 保證排序完整性。

#### Scenario: 非 operator 無法讀寫 Studio 資料

- **WHEN** 未登入請求 Studio reader 或 mutation
- **THEN** 系統必須回 401，且不回傳 draft、影音 URL、AI context 或資料夾資料

#### Scenario: 已登入非 operator 無法讀寫 Studio 資料

- **WHEN** 一般已購買學員請求相同 Studio reader 或 mutation
- **THEN** 系統必須回 403，且不改變任何課綱、排序或發布狀態

##### Example: operator 跨章節拖曳後重新載入仍一致

- operator 把 `lesson-03` 從 `chapter-01` 拖到 `chapter-02` 的 position 1
- mutation 在單一 transaction 更新原章節與目標章節 position
- 重新載入 Studio、公開課綱與學員教室後，`lesson-03` 都只在 `chapter-02` position 1 出現一次

### Requirement: Studio 以 SVG icon-only action 提供編輯、預覽與刪除

Studio 的單元列必須以 imported SVG icon-only action 提供編輯、預覽與刪除語義。每個 action 必須有 `aria-label`、visible tooltip、keyboard focus 樣式；刪除前必須二次確認。不得以 Emoji、Unicode 圖像字元、Font Awesome font icon 或 `<i>` 標籤當作圖示。

#### Scenario: operator 刪除單元前必須確認

- **WHEN** operator 啟動某單元的刪除 action
- **THEN** 系統必須先顯示確認 dialog，只有確認後才呼叫刪除 mutation

##### Example: 取消刪除不改變公開課綱

- operator 開啟 `lesson-03` 的刪除 dialog 後取消
- `lesson-03` 仍在 Studio、公開已發布課綱與學員教室中存在

### Requirement: Studio 資料夾可折疊、改名與排序

operator 必須能管理 Studio 側欄資料夾：建立、改名、排序、將 module item 移至其他資料夾，以及為自己收折或展開資料夾。全站資料夾名稱與順序必須持久化；個人收折狀態不得改寫其他 operator 的偏好或 module descriptor。

#### Scenario: 資料夾改名與排序在重新載入後仍存在

- **WHEN** operator 將資料夾 `內容` 改名為 `課程內容` 並移至 position 1
- **THEN** 重新載入 Studio 後，所有 operator 都看到新名稱與順序，而各自的收折偏好仍保持各自狀態

##### Example: module item 保持單一註冊來源

- operator 將 `course` item 移入另一個 Studio 資料夾
- `config/modules.ts` 仍是 `course` 的 enabled、SVG icon key 與路由宣告來源
- 資料庫只保存資料夾與 item 排列，不複製第二份 module descriptor

### Requirement: 隨課 AI 助教只使用目前已授權單元內容

隨課文字 AI 助教必須由 server 派生目前使用者、目前 lesson id、已發布 lesson content 與該 lesson 的 AI context。它不得接受 client 指定其他 lesson 或 actor、不得註冊 tools、不得寫入進度或內容；provider 缺設定或輸入無效時必須 fail-closed。

#### Scenario: AI 助教拒絕跨單元內容

- **WHEN** 已付款學員在 `lesson-03` 的 AI 助教中要求讀取尚未發布的 `lesson-draft-01`
- **THEN** server 不得把草稿或其 AI context 傳給模型，回應只可基於 `lesson-03` 的已授權內容

##### Example: provider 未設定時不降級成未受限 chat

- AI provider 必要設定缺失
- 學員送出問題時收到白話的暫時不可用錯誤
- 系統不呼叫 site-agent tools，不寫入資料，也不回傳其他單元內容
