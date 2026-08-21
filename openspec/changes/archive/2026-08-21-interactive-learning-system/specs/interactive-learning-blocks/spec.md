## ADDED Requirements

### Requirement: MDX 課程內容只允許固定互動積木

課程 MDX renderer 必須只允許 TimelineSync、ConceptCompare、MicroSandbox、WorkflowSorter、InstantQuiz、TeacherAvatar、DialogueWindow 七個已註冊積木。每個積木 props 必須先通過 schema 驗證；renderer 不得執行 raw HTML、script、event handler、未註冊 JSX component 或遠端 import。

#### Scenario: 合法的 InstantQuiz 被安全渲染

- **WHEN** 已發布 lesson 的 MDX 包含合法 InstantQuiz props
- **THEN** renderer 必須渲染 allowlisted 積木，並保留其可存取題目、選項與回饋結構

##### Example: 已發布單元安全呈現測驗

- lesson-03 的 MDX 只含已註冊 InstantQuiz 與合法 question、options、answerIndex
- 有權學員開啟 lesson-03 時看到題目與可用鍵盤選擇的選項
- renderer 不執行 lesson 內容以外的 HTML 或 script

#### Scenario: 未註冊 component 被拒絕

- **WHEN** operator 儲存含未註冊 component 或 raw script 的 MDX
- **THEN** Studio 必須回傳驗證錯誤，不能發布或在學員端渲染該內容

##### Example: 受限集合可逐一測試

- 測試依序提供七個已註冊積木的最小合法 props
- 每個都可渲染或驗證成功
- 第八個未註冊名稱被拒絕

### Requirement: 互動積木完成事件受伺服器驗證

互動積木的完成事件必須帶有 server 可驗證的 lesson id 與 allowlisted block id。server 必須從 session 推導 user，確認該 user 有權讀取 lesson 後才可寫入 progress；client 不能以任意 userId、草稿 lesson id 或偽造 block id 寫入資料。

#### Scenario: 學員完成合法 block

- **WHEN** 有權學員完成 lesson-03 中已註冊的 quiz-01
- **THEN** server 必須只為該學員記錄一次完成事件，並回傳更新後的自身進度

#### Scenario: client 偽造其他使用者進度

- **WHEN** user A 在完成事件 payload 填入 user B 的 id
- **THEN** server 必須忽略 client user id、只以 user A session 判定，或拒絕格式不合法請求；user B 資料不得改變

##### Example: 重複事件 idempotent

- user A 對同一 lesson-03／quiz-01 送出兩次完成事件
- 持久化資料只有一個對應完成紀錄
- 聚合進度不會因第二次請求增加

### Requirement: 隨堂測驗提供立即且可存取的回饋

InstantQuiz 必須在使用者選擇後提供立即的正確或錯誤文字回饋、解析與可存取狀態，不以 Emoji 或僅靠顏色表意。完成狀態只能在題目被有效回答後送出，並遵守 server 驗證與 idempotence。

#### Scenario: 選錯後仍可理解結果

- **WHEN** 學員選擇錯誤選項
- **THEN** 元件必須顯示文字化錯誤提示與解析，讓鍵盤與螢幕閱讀器使用者也能取得結果

##### Example: 選對後觸發一次完成事件

- 學員選擇正確答案
- 元件顯示文字化正確提示與解析
- 完成事件只送出一次，即使使用者重複點選同一答案
