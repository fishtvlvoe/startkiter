## MODIFIED Requirements

### Requirement: MDX 課程內容只允許固定互動積木

課程 MDX renderer 必須只允許透過 Block Schema Registry 動態註冊的積木；registry 目前收錄 TimelineSync、ConceptCompare、MicroSandbox、WorkflowSorter、InstantQuiz、TeacherAvatar、DialogueWindow、WebContainerSandbox 八個積木。每個積木 props 必須先通過其在 registry 中宣告的 Zod schema 驗證；renderer 不得執行 raw HTML、script、event handler、未註冊 JSX component 或遠端 import。新增積木必須透過在 registry 加入一筆定義完成，`allowed-components.ts` 導出的名稱集合與 `LessonMdx.tsx` 的 component map 必須由 registry 動態衍生，不得手動維護獨立清單。

#### Scenario: 合法的 InstantQuiz 被安全渲染

- **WHEN** 已發布 lesson 的 MDX 包含合法 InstantQuiz props
- **THEN** renderer 必須渲染 registry 中登記的積木，並保留其可存取題目、選項與回饋結構

##### Example: 已發布單元安全呈現測驗

- lesson-03 的 MDX 只含已註冊 InstantQuiz 與合法 question、options、answerIndex
- 有權學員開啟 lesson-03 時看到題目與可用鍵盤選擇的選項
- renderer 不執行 lesson 內容以外的 HTML 或 script

#### Scenario: 未在 registry 中的 component 被拒絕

- **WHEN** operator 儲存含 registry 未收錄 component 名稱或 raw script 的 MDX
- **THEN** Studio 必須回傳驗證錯誤，不能發布或在學員端渲染該內容

##### Example: registry 收錄的積木可逐一測試

- 測試依序提供 registry 目前收錄的每個積木的最小合法 props
- 每個都可渲染或驗證成功
- 任何一個不在 registry 中的名稱都被拒絕
