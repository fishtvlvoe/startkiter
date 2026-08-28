## Context

課神（Awesome-Koson）是獨立的老師端課程設計工具，輸出符合 `CoursePackEnvelopeSchema` 的 JSON。StartKiter 暫存中的 `course-pack-import` change 負責把這份 JSON 匯入、驗證、存成 `CoursePack`／`CoursePackMission` 資料表，但匯入之後「怎麼真的跑給買家玩」完全空白：不知道 Mission 的抽象動作要用哪個積木呈現、不知道怎麼判定買家真的完成一關、買家填的設定值沒有地方存。

跟課神那邊的 session 已經對過技術方案並達成共識（2026-08-25）：
- 課神會把 `ActionSchema` 依 `surface` 改成 discriminated union，`structured_form` 帶結構化 `fields` 陣列，`embedded_tool` 帶 `{ url?, mode }`
- 課神會把 `EvaluatorSchema` 的 `type` 改成 discriminated union，新增 `external_check` 型態（`check_id` + `params` + `poll_interval_seconds` + `timeout_seconds`），密鑰與實作細節完全留在 StartKiter

第一個實際應用場景：老闆用課神設計「教買家部署自己的 StartKiter 網站」教學課程，關卡包含填 Bunny API Key、確認網站心跳等步驟，每一關都要真判定。

**重要依賴**：本 change 的資料模型參照 `course-pack-import` 產出的 `CoursePackMission` 表，本 change 必須排在 `course-pack-import` 之後 apply。

## Goals / Non-Goals

**Goals:**

- 提供一份 surface→積木對照層，讓匯入的 Mission 動作能用 `packages/course/` 既有積木正確渲染
- 提供 check_id 具名檢查註冊表架構，第一批落地兩個 check：`deployment_heartbeat_fresh`、`bunny_zone_created`
- 提供買家在 Mission 裡填寫的值（如 API Key）的加密儲存與讀取路徑

**Non-Goals:**

- 不做 `course-pack-import` 本身的匯入／驗證／儲存邏輯
- 不修改課神（Awesome-Koson）repo 的任何程式碼
- 不設計「教買家部署」課程的實際教案內容
- 不做 LINE Login／Google OAuth 的 check_id（無法 API 自動判定，留待後續 change）
- 不補齊 `deterministic`／`ai_rubric`／`teacher` 三種既有 Evaluator 型態尚未完成的執行邏輯

## Decisions

### Surface→積木對照表採靜態 key-value map，不做條件判斷邏輯

`ActionSchema` 依 surface 改成 discriminated union 之後，每個 surface 都帶足夠的結構化 payload（`structured_form` 有 `fields`、`embedded_tool` 有 `url`/`mode`），複雜度已經吸收在 payload 裡，對照表只需要單純決定「這個 surface 用哪個積木家族」，不需要再依其他欄位動態選擇。

Alternatives Considered：
- 讓 StartKiter 自己解析 `Mission.action.instructions` 純文字猜測欄位——否決，脆弱且無法通過型別檢查，等於用 NLP 猜測結構化資料
- 對照表本身帶條件判斷（依課程內容、買家狀態等動態選積木）——否決，目前 4 個 surface 都能一一對應到一個積木家族，条件判斷只會增加不必要的耦合與測試面

### check_id 具名檢查註冊表，實作與金鑰完全留在 StartKiter 後端

Evaluator 的 `external_check` 型態只帶 `check_id` 具名字串與非機密 `params`，StartKiter 維護一份 `check-registry.ts`，把 `check_id` 對應到實際執行函式；函式自己決定要查哪張資料庫表或用買家哪組金鑰呼叫外部 API。

Alternatives Considered：
- 讓課神 schema 直接帶 `endpoint` + `expected`——否決，會把買家金鑰或內部 API 形狀焊進可攜的 Course Pack JSON，換一個學員端執行平台就要重寫，也違反課神「引擎無關」的既定原則
- 讓 Evaluator 內嵌一段可執行程式碼字串（script）動態執行——否決，等於允許外部匯入的 JSON 攜帶可執行程式碼，是嚴重的安全風險

### 買家填寫值新增獨立資料表，不塞進既有 SiteSetting

新增 `MissionFormValue` 表，`(userId, coursePackMissionId, fieldKey)` 唯一鍵，加密值比照既有 SiteSetting 加解密工具處理。

Alternatives Considered：
- 直接寫進既有 `SiteSetting`——否決，`SiteSetting` 是全站單例設定（一個 key 一個值），`MissionFormValue` 是「每個買家、每個 Mission、每個欄位」的多筆資料，語意不同，硬塞會讓既有 `SiteSetting` 的讀寫邏輯變複雜
- 存進 `CoursePackMission` 自己的 JSON 欄位——否決，填寫值是買家個人資料/密鑰，不該跟教案內容（`course-pack-import` 管的範圍）混在同一張表，也不利個別加密與查詢

### 積木渲染新增一條由匯入資料驅動的路徑，既有後台編輯路徑不變

`packages/course/src/mdx/block-registry.ts` 新增一個接受 Mission 結構化 action payload 的輸入來源；既有由後台課程編輯器直接編寫積木內容（Lesson content）的路徑完全不動。

Alternatives Considered：
- 把 Mission 資料轉換成跟後台編輯器一樣的積木 JSON 格式直接寫進 Lesson content——否決，會讓 Mission 專屬的判定/救援欄位污染一般課程內容的資料模型，一般課程編輯器也要被迫理解 check_id 等用不到的欄位
- 完全獨立寫一套渲染器，不重用既有 `block-registry.ts`——否決，重複造輪子，既有 7 個積木已經成熟穩定，只需要多一個資料來源適配層

## Implementation Contract

**Behavior**：買家在執行 Mission 時，前端依 `action.surface` 呼叫對照表取得要渲染的積木；若 surface 為 `structured_form`，買家填寫欄位後呼叫 API 存值；Mission 的 Evaluator 若為 `external_check`，前端依 `poll_interval_seconds` 週期呼叫檢查 API，直到回傳 `passed`／`failed`，或累積耗時超過 `timeout_seconds` 由前端自行判定逾時並提示買家。

**Interface / data shape**：

```typescript
// packages/course/src/course-pack/check-registry.ts
type CheckContext = {
  userId: string
  coursePackMissionId: string
  formValues: Record<string, string> // 已解密的 MissionFormValue，依 fieldKey 索引
}

type CheckResult =
  | { status: "passed"; detail?: string }
  | { status: "pending"; detail?: string }
  | { status: "failed"; reasonCode: "auth_error" | "network_error" | "not_found" | "unknown_check_id"; detail?: string }

type CheckImplementation = (
  params: Record<string, string>,
  context: CheckContext,
) => Promise<CheckResult>

export const checkRegistry: Record<string, CheckImplementation>
```

```typescript
// packages/course/src/course-pack/surface-block-map.ts
type Surface = "code_editor" | "terminal" | "structured_form" | "embedded_tool"
export const surfaceBlockMap: Record<Surface, string> // 對應到 block-registry.ts 既有積木名稱
```

```sql
-- packages/database/prisma/schema.prisma 對應 migration
CREATE TABLE "MissionFormValue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "coursePackMissionId" TEXT NOT NULL REFERENCES "CoursePackMission"("id") ON DELETE CASCADE,
  "fieldKey" TEXT NOT NULL,
  "encryptedValue" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "mission_form_value_user_mission_field_key"
  ON "MissionFormValue" ("userId", "coursePackMissionId", "fieldKey");
CREATE INDEX "mission_form_value_user_idx" ON "MissionFormValue" ("userId");
```

API procedures（`packages/api/modules/course/procedures/`）：
- `submitMissionFormValue({ coursePackMissionId, fieldKey, value }) → { success: true }`：僅接受登入使用者，加密後 upsert 對應 `MissionFormValue`
- `runMissionCheck({ coursePackMissionId, checkId, params }) → CheckResult`：查 `checkRegistry`，找不到 `check_id` 回傳 `{ status: "failed", reasonCode: "unknown_check_id" }`；找到則組出 `CheckContext`（讀取該使用者對應的 `MissionFormValue`）並執行

**Failure modes**：
- `check_id` 不存在於註冊表 → `reasonCode: "unknown_check_id"`，前端顯示「教案設定有誤，請聯絡客服」，不是「請重試」
- 外部 API（Bunny）呼叫因金鑰錯誤失敗 → `reasonCode: "auth_error"`
- 外部 API 逾時或網路錯誤 → `reasonCode: "network_error"`
- 條件尚未成立（如心跳還沒進來）→ `status: "pending"`，不是 failed
- 未登入呼叫 `submitMissionFormValue`／`runMissionCheck` → 拒絕，回傳既有 API 層一致的未授權錯誤

**Acceptance criteria**：
- `check-registry.test.ts`：未知 `check_id` 回傳 `unknown_check_id`；已知 `check_id` 正確分派到對應實作
- `deployment-heartbeat-fresh.test.ts`：心跳資料在時效內回傳 `passed`，過期或缺資料回傳 `pending`
- `bunny-zone-created.test.ts`：mock Bunny API 成功回傳 `passed`；401 回傳 `auth_error`；逾時回傳 `network_error`
- `submit-mission-form-value.test.ts`：正確加密並 upsert；未登入呼叫被拒絕
- `surface-block-map.test.ts`：4 個 surface 各自解析到預期的既有積木

**Scope boundaries**：範圍內＝上述三塊能力與對應的資料表／API／測試；範圍外＝`course-pack-import` 本身、課神 repo 程式碼、教案內容、LINE/Google 相關 check_id。

## Risks / Trade-offs

- [Risk] 本 change 的 `MissionFormValue` 表外鍵依賴 `course-pack-import` 產出的 `CoursePackMission` 表，若後者尚未 apply，本 change 的 migration 無法執行 → Mitigation：Migration Plan 明確排序，tasks.md 第一項列為阻塞前置檢查，先確認 `course-pack-import` 已 apply 完成
- [Risk] `bunny_zone_created` 等外部 check 呼叫第三方 API，買家金鑰錯誤或過期會持續失敗 → Mitigation：`reasonCode` 分類（`auth_error`／`network_error`）讓前端能顯示對應的具體救援提示，不是統一顯示「失敗」
- [Risk] 買家填寫的 API Key 若未妥善加密可能外洩 → Mitigation：沿用既有 SiteSetting 同一套加解密工具，不另外發明加密機制
- [Risk] 課神那邊的 schema discriminated union 改動若與本 change 的實作時間點沒對齊，會造成解析失敗 → Mitigation：匯入驗證時比對 schema 版本號，版本不符明確拒絕並提示需要更新，不寬鬆解析

## Migration Plan

1. 確認目標環境 `course-pack-import` 已 apply（`CoursePackMission` 表存在）
2. 執行本 change 的 Prisma migration，新增 `MissionFormValue` 表與索引
3. 部署 `surface-block-map.ts`／`check-registry.ts`／兩個 check 實作／`submitMissionFormValue`／`runMissionCheck` procedure
4. 修改 `packages/course/src/mdx/block-registry.ts` 新增匯入資料驅動路徑，於 staging 驗證既有後台編輯路徑不受影響
5. Rollback：本次為新增表與新增程式碼路徑，未修改既有資料或既有路徑；回滾＝revert commit，並 drop 新增的 `MissionFormValue` 表，既有課程／Mission 功能不受影響

## Open Questions

- `structured_form` 的 `fields[].inputType` 完整列舉值課神那邊尚未定案（目前確定會有 text／password，其餘型別待課神補齊），本 change 先支援 text／password 兩種，其餘等課神 schema 定案後再擴充
- `check_id` 的失敗分類（`auth_error`／`network_error`／`not_found`）目前只是本 change 內部草案，是否需要訂一份兩個 check 共用的標準錯誤碼清單，留待 apply 階段實作第一批兩個 check 時一併定案
