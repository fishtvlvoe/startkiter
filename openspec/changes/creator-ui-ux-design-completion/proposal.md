## Why

目前本機Demo已具三角色及商品操作，但部分營運頁只剩通用列表提案，完整頁面狀態、詳情／編輯路線及正式UI交接仍未完成。本SR補完有限畫面清單的UI／UX，把「設計可驗收」與「真正後台接線」分開，讓Fish有第一個可達成的明確目標。

## What Changes

- 新增 docs/ux/creator-screen-acceptance-matrix.md：逐頁列角色、列表／詳情／表單、主要動作、狀態、桌面手機與驗收證據，使用既有導航目的地而非臨時發明新模組。
- 修改三份creator-local角色view及其focused tests，補已列畫面的正常／空／錯誤／成功／無權限／未設定狀態與返回流程；保留原商品儲存與買家快照，不假串provider。
- 新增就地狀態預覽控制與畫面到未來正式route/API/owner的交接表；未施工模組可操作設計預覽，不用假的設定保存成功冒充功能。
- 新增桌面1440／手機390各驗收路線與一個入口，主控回跑後寫回總施工表M1。

## Non-Goals

- 不改apps/packages/DB/provider，不把file HTML原型當正式網站登入。
- 不重畫已認可的兩層導航／品牌，不把總架構全部26能力一次畫成可用系統。
- 不做真付款／寄信／直播／GitHub；不修改取消、授權期限或更新數量政策。

## Capabilities

### New Capabilities

- `creator-screen-design-acceptance`: 有限完整畫面清單、每頁操作狀態與M1本機設計驗收。

### Modified Capabilities

無正式能力變更。此能力限定設計預覽。

## Impact

- Affected specs: 本SR新增creator-screen-design-acceptance，引用總藍圖UI/UX與local-backoffice原型契約，不改正式規格。
- Affected code: docs/blueprint/creator-local-admin-view.js、creator-local-creator-view.js、creator-local-buyer-view.js及tests；主控獨占creator-local-ui.js／navigation／共享helper，model不改。
- Affected documents: docs/ux/creator-screen-acceptance-matrix.md、docs/blueprint/creator-delivery-master.md、驗收evidence、CONTEXT。
- Dependencies新增: 無；原生模板與現有CSS/SVG、node:test、ego-browser。
- 環境變數新增: 無。
