## 1. 前置依賴檢查（阻塞，Apply 開跑前必須先確認）

- [x] 1.1 確認 `course-pack-import` 已 apply 完成，`CoursePackMission` 表已存在於目標環境，避免本 change 的 migration 找不到外鍵目標資料表：驗證方式為 `grep -n "^model CoursePackMission" packages/database/prisma/schema.prisma` 有命中，且 `prisma migrate status` 顯示對應 migration 已套用。**未滿足此條件前，禁止開始第 2 節以後的任務**

## 2. 資料模型：MissionFormValue（對應設計決策「買家填寫值新增獨立資料表，不塞進既有 SiteSetting」）

- [x] 2.1 撰寫紅燈測試：同一 (userId, coursePackMissionId, fieldKey) 組合第二次寫入會更新既有記錄而非新增第二筆，涵蓋 Requirement「Structured form field values are persisted per user per mission」；驗證目標：`pnpm --filter database test` 出現預期失敗（schema 尚未新增，型別或資料表不存在）
- [x] 2.2 在 `packages/database/prisma/schema.prisma` 新增 `MissionFormValue` model 與 (userId, coursePackMissionId, fieldKey) 唯一索引，執行 `prisma migrate dev` 產生 migration，使 2.1 測試轉綠燈；驗證目標：`pnpm --filter database test` 全綠，`psql` 查詢 `\d "MissionFormValue"` 確認唯一索引存在

## 3. Surface→積木對照表（對應設計決策「Surface→積木對照表採靜態 key-value map，不做條件判斷邏輯」）

- [ ] [P] 3.1 撰寫紅燈測試：4 個 surface 值（`code_editor`／`terminal`／`structured_form`／`embedded_tool`）各自解析到預期的既有積木，涵蓋 Requirement「Mission action surface resolves to a rendering block」；驗證目標：`pnpm --filter course test surface-block-map.test.ts` FAIL（模組尚未存在）
- [ ] 3.2 撰寫紅燈測試：surface 值在對照表找不到對應積木時回傳 fail-closed 錯誤、不拋出未捕捉例外、不讓頁面崩潰，涵蓋同一 Requirement 的 Scenario「Surface value has no registered block mapping」；驗證目標同 3.1
- [ ] 3.3 實作 `packages/course/src/course-pack/surface-block-map.ts`，使 3.1、3.2 測試轉綠燈；驗證目標：`pnpm --filter course test surface-block-map.test.ts` 全綠

## 4. structured_form 存值 API（對應設計決策「買家填寫值新增獨立資料表，不塞進既有 SiteSetting」）

- [x] [P] 4.1 撰寫紅燈測試：未登入呼叫 `POST /api/course/mission/form-value` 回傳 401 且不寫入任何值，涵蓋 Requirement「Structured form field values are persisted per user per mission」的 Scenario「Unauthenticated submission is rejected」；驗證目標：`pnpm --filter api test submit-mission-form-value.test.ts` FAIL
- [x] 4.2 撰寫紅燈測試：已登入使用者提交欄位值會加密並 upsert 一筆記錄，涵蓋同一 Requirement 的 Scenario「Submitting a field value creates or updates a stored record」；驗證目標同 4.1
- [x] 4.3 實作 `packages/api/modules/course/procedures/submit-mission-form-value.ts`，使 4.1、4.2 測試轉綠燈；驗證目標：`pnpm --filter api test submit-mission-form-value.test.ts` 全綠

## 5. check_id 具名檢查註冊表（對應設計決策「check_id 具名檢查註冊表，實作與金鑰完全留在 StartKiter 後端」）

- [x] 5.1 撰寫紅燈測試：未登入呼叫 `POST /api/course/mission/check` 回傳 401 且不執行任何 check 實作，涵蓋 Requirement「External check execution requires an authenticated learner」；驗證目標：`pnpm --filter api test run-mission-check.test.ts` FAIL
- [x] 5.2 撰寫紅燈測試：呼叫未註冊的 `check_id` 回傳 `reasonCode: unknown_check_id` 且不視為失敗學習嘗試，涵蓋 Requirement「External check evaluators dispatch to a named check registry」的 Scenario「Unregistered check_id is rejected distinctly from a failed check」；驗證目標同 5.1
- [x] 5.3 實作 `packages/course/src/course-pack/check-registry.ts` 與 `packages/api/modules/course/procedures/run-mission-check.ts`，使 5.1、5.2 測試轉綠燈；驗證目標：`pnpm --filter api test run-mission-check.test.ts`、`pnpm --filter course test check-registry.test.ts` 全綠

## 6. 第一批 check 實作：deployment_heartbeat_fresh 與 bunny_zone_created

- [x] [P] 6.1 撰寫紅燈測試：`deployment_heartbeat_fresh` 在心跳資料時效內回傳 `passed`、過期或缺資料回傳 `pending`，涵蓋 Requirement「External check evaluators dispatch to a named check registry」；驗證目標：`pnpm --filter course test deployment-heartbeat-fresh.test.ts` FAIL
- [ ] 6.2 實作 `packages/course/src/course-pack/checks/deployment-heartbeat-fresh.ts`，使 6.1 測試轉綠燈並註冊進 check-registry；驗證目標：`pnpm --filter course test deployment-heartbeat-fresh.test.ts` 全綠
- [ ] [P] 6.3 撰寫紅燈測試：`bunny_zone_created` 在必要的 `MissionFormValue`（Bunny API Key）尚未提交時回傳 `pending` 且不發出任何外部網路呼叫，涵蓋 Requirement「A check that depends on a missing stored value fails closed」；驗證目標：`pnpm --filter course test bunny-zone-created.test.ts` FAIL
- [ ] 6.4 撰寫紅燈測試：`bunny_zone_created` 呼叫 Bunny API 遇到 401 回傳 `reasonCode: auth_error`、逾時或網路錯誤回傳 `reasonCode: network_error`，涵蓋 Requirement「External check failures are classified by reason」；驗證目標同 6.3
- [ ] 6.5 實作 `packages/course/src/course-pack/checks/bunny-zone-created.ts`，使 6.3、6.4 測試轉綠燈並註冊進 check-registry；驗證目標：`pnpm --filter course test bunny-zone-created.test.ts` 全綠

## 7. 積木渲染新增匯入資料來源（對應設計決策「積木渲染新增一條由匯入資料驅動的路徑，既有後台編輯路徑不變」）

- [ ] 7.1 確認既有由後台課程編輯器直接編寫積木內容的渲染行為維持不變，涵蓋 Requirement「Interactive blocks accept Mission-driven content as an alternate source」的 Scenario「Editor-authored content path is unaffected」；驗證目標：`pnpm --filter course test block-registry.test.ts` 既有測試案例全數維持綠燈（回歸基準）
- [ ] 7.2 撰寫紅燈測試：Mission 的結構化 action payload 能透過 3.3 的 surface-block-map 解析出的積木正確渲染出對應內容，涵蓋同一 Requirement 的 Scenario「Mission-sourced content renders through the existing block registry」；驗證目標：`pnpm --filter course test block-registry.test.ts` 新增案例 FAIL
- [ ] 7.3 修改 `packages/course/src/mdx/block-registry.ts` 新增匯入資料驅動的輸入來源，使 7.2 測試轉綠燈且 7.1 既有測試不受影響；驗證目標：`pnpm --filter course test block-registry.test.ts` 全綠（含既有與新增案例）

## 8. Review 與驗收

- [ ] 8.1 派 Codex 或等效工具對第 2-7 節的 diff 做 Code Review（correctness／security／performance 三角度），重點檢查 `MissionFormValue` 加解密邏輯是否沿用既有工具、check 失敗訊息是否洩漏金鑰片段、未登入呼叫是否皆被拒絕；驗證方式：CR 報告 Critical 數量為 0
- [ ] 8.2 執行 `pnpm test` 確認全專案測試套件（含本 change 新增的所有紅燈轉綠燈測試）全綠；驗證方式：指令 exit code 為 0
- [x] 8.3 執行 `spectra validate course-pack-mission-execution` 確認產出物驗證通過；驗證方式：指令輸出無錯誤
