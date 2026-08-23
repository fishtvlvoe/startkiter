## MODIFIED Requirements

### Requirement: Course Studio 僅供 operator 管理且變更可持久化

Course Studio 必須沿用既有 `ADMIN_EMAIL` operator 判定。operator 可以管理 Course、Chapter、Lesson、資料夾、模組排列、`isFreePreview`、發布狀態、allowlisted MDX、AI context 與影音設定；章節與單元必須支援確定排序與跨章節移動。所有 mutation 必須由伺服器 session 推導 actor，使用 transaction 保證排序完整性。Studio UI 必須提供可直接拖曳的排序控制（不能只有底層 API 支援排序而 UI 無對應互動）。

#### Scenario: 非 operator 無法讀寫 Studio 資料

- **WHEN** 未登入請求 Studio reader 或 mutation
- **THEN** 系統必須回 401，且不回傳 draft、影音 URL、AI context 或資料夾資料

#### Scenario: 已登入非 operator 無法讀寫 Studio 資料

- **WHEN** 一般已購買學員請求相同 Studio reader 或 mutation
- **THEN** 系統必須回 403，且不改變任何課綱、排序或發布狀態

#### Scenario: Studio UI 提供跨章節拖曳排序的互動控制

- **WHEN** operator 在 Studio 畫面用滑鼠把某個單元從其所屬章節拖到另一個章節的特定位置
- **THEN** UI 必須即時反映新的排序位置，並呼叫既有的 `reorder_lessons` mutation 持久化變更，不需要重新整理頁面才看到結果

##### Example: operator 跨章節拖曳後重新載入仍一致

- operator 把 `lesson-03` 從 `chapter-01` 拖到 `chapter-02` 的 position 1
- mutation 在單一 transaction 更新原章節與目標章節 position
- 重新載入 Studio、公開課綱與學員教室後，`lesson-03` 都只在 `chapter-02` position 1 出現一次

## ADDED Requirements

### Requirement: Course Studio 內容編輯提供即時預覽

operator 在 Course Studio 編輯 Lesson 的 MDX 內容時，系統必須在同一畫面提供即時預覽面板，使用學員端渲染時採用的同一個 renderer 呈現目前輸入內容，並套用與存檔時相同的積木 allowlist 檢查。預覽必須在 operator 停止輸入後的短暫延遲內更新，不需要另外觸發或切換頁面。

#### Scenario: 即時預覽反映目前輸入內容

- **WHEN** operator 在內容編輯欄位輸入合法的 MDX 內容
- **THEN** 預覽面板必須在短暫延遲後顯示渲染後的結果，且渲染結果必須跟學員實際看到的畫面一致

##### Example: 輸入合法 InstantQuiz 後預覽即時更新

- **GIVEN** operator 正在編輯 `lesson-05`，內容編輯欄位目前是空白
- **WHEN** operator 輸入 `<InstantQuiz question="1+1=?" options={["1","2","3"]} answerIndex={1} />` 後停止輸入
- **THEN** 300ms 內預覽面板必須顯示題目「1+1=?」與三個選項，渲染結果與學員開啟 `lesson-05` 時看到的畫面一致

#### Scenario: 即時預覽顯示未授權積木的錯誤

- **WHEN** operator 在內容編輯欄位輸入含未授權積木名稱或 raw HTML 的內容
- **THEN** 預覽面板必須顯示跟存檔時會出現的相同驗證錯誤訊息，且不得靜默忽略錯誤或顯示空白畫面

##### Example: 輸入未註冊積木名稱時預覽顯示錯誤

- **GIVEN** operator 正在編輯 `lesson-05`
- **WHEN** operator 輸入 `<UnregisteredWidget foo="bar" />`
- **THEN** 預覽面板必須顯示「講義內容含有未授權元件：UnregisteredWidget」，而不是空白畫面或靜默略過該段內容
