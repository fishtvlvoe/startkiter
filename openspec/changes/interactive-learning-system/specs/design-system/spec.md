## ADDED Requirements

### Requirement: 電馭學院 shipped UI 只使用 SVG 圖示

電馭學院與本 change 所觸及的 shipped UI 必須使用 imported SVG component 作為所有使用者可見圖示。禁止 Emoji、pictographic Unicode 字元、Font Awesome font icon、其他 icon font 與以 i 標籤呈現圖示。這項規則涵蓋公開銷售頁、學員教室、Fluent Player Shell、Admin Bar、Studio、navigation 與 shared UI primitives。

#### Scenario: shipped UI 不會載入 icon font 或渲染 pictographic icon

- **WHEN** source scan 檢查 apps/marketing、apps/saas、packages/ui 與 packages/course 的 shipped UI
- **THEN** scan 必須找不到 icon font import、i icon markup 或 pictographic Unicode icon，並能辨識 icon 由 SVG component 提供

##### Example: Studio 列表 action 使用 SVG component

- 單元列表需要編輯、預覽與刪除 action
- 每個 action 渲染為 imported SVG component 的 button content
- 原始碼與 DOM 不含以字符模擬這三種圖示的內容

### Requirement: icon-only 操作具備可存取名稱與提示

所有 icon-only 操作必須有穩定的可存取名稱、visible tooltip、keyboard focus 樣式與正確 action semantics。刪除等破壞性 action 還必須先要求使用者確認；圖示本身不能是唯一的狀態或錯誤訊息載體。

#### Scenario: 鍵盤使用者可理解並操作 Studio action

- **WHEN** 使用者以鍵盤聚焦 Studio 的編輯、預覽或刪除 action
- **THEN** 螢幕閱讀器可讀到 action 名稱、畫面顯示 focus 與 tooltip，且 Enter／Space 觸發對應行為

##### Example: 刪除 action 需要二次確認

- keyboard 使用者聚焦刪除 action 並觸發
- 系統開啟可聚焦的 confirmation dialog
- 在未確認前不會送出 mutation
