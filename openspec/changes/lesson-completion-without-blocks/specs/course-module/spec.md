## MODIFIED Requirements

### Requirement: 學員進度由持久化單元完成狀態推導

系統必須以 `LessonProgress` 記錄目前使用者完成的已發布單元。頂部常駐進度列必須顯示 `round(100 * completed / total)` 與 `completed/total`，例如完成 3 個共 8 個已發布單元時顯示 `38% · 3/8 單元`。完成標記必須 idempotent，不能由 client 傳入百分比或其他 userId。

單元內容含至少一個互動積木（`blockId`）時，完成請求必須附上屬於該單元的合法 `blockId`，伺服器必須重新解析單元內容驗證這個 `blockId` 確實存在，防止偽造完成事件。單元內容不含任何互動積木時（純文字或純影片單元），系統必須允許使用者直接標記完成，不得要求一個實際上不存在的 `blockId`。

#### Scenario: 學員完成單元後立即看見一致進度

- **WHEN** 有課程權限的使用者將 `lesson-03` 標記完成
- **THEN** 系統必須持久化該使用者與該單元的完成狀態，立即更新頂部百分比、完成數和課綱中的綠色 SVG 勾選

##### Example: 重複完成不會重複計算

- user A 已完成 `lesson-01`、`lesson-02`、`lesson-03`，共 8 個已發布單元
- user A 再次送出 `lesson-03` 完成請求
- `LessonProgress(user A, lesson-03)` 仍只有一筆，畫面仍顯示 `38% · 3/8 單元`

#### Scenario: 沒有互動積木的單元可以直接標記完成

- **WHEN** 使用者對一個內容裡沒有任何互動積木的單元送出完成請求（不附 `blockId`）
- **THEN** 系統必須持久化完成狀態，不得因為缺少 `blockId` 而拒絕請求

#### Scenario: 有互動積木的單元仍必須驗證 blockId 才能完成

- **WHEN** 使用者對一個內容裡含有互動積木的單元送出完成請求，但沒有附上 `blockId`，或附上的 `blockId` 不屬於該單元
- **THEN** 系統必須拒絕請求，不得持久化完成狀態
