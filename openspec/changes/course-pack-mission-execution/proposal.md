## Why

課神（Awesome-Koson，獨立教學設計工具）已經能匯出標準化的 Course Pack Mission JSON，但 StartKiter 目前沒有任何機制能真正「執行」這份教案——不知道怎麼把抽象的 Mission 動作渲染成畫面、怎麼判定買家是否真的完成一個關卡、買家填的設定值該存去哪。第一個急迫的應用場景是用課神設計一門「教買家部署自己的 StartKiter 網站」的互動教學課程，每一關都需要真實可驗證的判定，不能只是走個過場。

## What Changes

- 新增 surface→block 對照層：依課神 `Mission.action.surface`（`code_editor` / `terminal` / `structured_form` / `embedded_tool`）決定用 `packages/course/` 既有哪個積木家族渲染，並消費課神同步新增的結構化 action payload（`structured_form` 的 `fields` 陣列、`embedded_tool` 的 `url`/`mode`）
- 新增 check_id 具名檢查註冊表：實作課神 Evaluator 新增的 `external_check` 型態（`check_id` + `params` + `poll_interval_seconds` + `timeout_seconds`），第一批至少支援兩個 check：`deployment_heartbeat_fresh`（查詢 StartKiter 自己的部署心跳資料）、`bunny_zone_created`（用買家自己存的 Bunny API Key 呼叫 Bunny API 確認 storage zone 已建立）
- 新增 structured_form 填寫值的存取邏輯：買家在 Mission 裡填的值（例如貼上 Bunny API Key），比照既有 SiteSetting 加密表模式存放，供對應 check_id 執行時讀取
- 修改 `interactive-learning-blocks`：新增「由匯入的 Mission 資料驅動積木渲染」這個輸入來源；既有由後台課程編輯器直接編寫積木內容的路徑不變、不受影響

## Non-Goals (optional)

- 不做 `course-pack-import` 本身的匯入、驗證、儲存邏輯（既有暫存中的 change，範圍不變，本次不擴充也不重疊）
- 不修改課神（Awesome-Koson）repo 的任何程式碼，本 change 只單向消費課神輸出的 `CoursePackEnvelopeSchema` 新版本
- 不做「教買家部署 StartKiter 網站」這門課程的實際教案內容（Mission 文案、救援提示文字、關卡順序），內容由老闆在課神老師端自行設計，本 change 只提供執行這份內容所需的技術能力
- 不做 LINE Login／Google OAuth 這類無法用 API 自動判定完成與否的 check_id（這些平台不開放第三方用 API 建立帳號級資源，只能引導買家手動操作；對應的 check_id 邏輯留待後續 change 另行規劃）
- 不做金流／發票申請流程的一鍵自動化（已知需要人工審核，不在本次範圍）
- 不新增或修改 `check_id` 之外的 Evaluator 型態（`deterministic`／`ai_rubric`／`teacher` 三種既有型態的執行邏輯，若尚未實作，不在本次一併補齊）

## Capabilities

### New Capabilities

- `course-pack-mission-execution`: 執行課神匯出的 Course Pack Mission，涵蓋 surface 與積木的對照分派、check_id 具名檢查註冊表與執行、structured_form 填寫值的存取

### Modified Capabilities

- `interactive-learning-blocks`: 新增由匯入的 Course Pack Mission 資料驅動積木渲染這個輸入來源

## Impact

- Affected specs: New: `course-pack-mission-execution`；Modified: `interactive-learning-blocks`
- Affected code:
  - New:
    - packages/course/src/course-pack/surface-block-map.ts
    - packages/course/src/course-pack/check-registry.ts
    - packages/course/src/course-pack/checks/deployment-heartbeat-fresh.ts
    - packages/course/src/course-pack/checks/bunny-zone-created.ts
    - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - Modified:
    - packages/course/src/mdx/block-registry.ts（消費 Mission action 結構化 payload，新增由匯入資料驅動的渲染路徑）
    - packages/database/prisma/schema.prisma（新增 Mission 填寫值的儲存 model，比照既有 SiteSetting 加密欄位模式）
- Dependencies 新增：無（沿用既有加密工具與 HTTP client）
- 環境變數新增：無（金鑰走既有 SiteSetting 後台設定模式，不用 env）
