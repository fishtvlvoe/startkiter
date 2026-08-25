## 1. 資料模型

- [x] 1.1 在 `packages/database/prisma/schema.prisma` 新增 `CoursePack`（id/sourcePackId/title/schemaVersion/learningOutcomes/status/importedBy/importedAt）與 `CoursePackMission`（id/coursePackId/missionId/title/goal/sortOrder/missionData，含 `coursePackId+missionId` 唯一索引與 `sourcePackId`/`status` 索引），對應設計決策「儲存結構：CoursePack + CoursePackMission 雙表，Mission 巢狀內容存 JSONB」，執行 `prisma migrate dev` 產生 migration；驗證：`prisma migrate status` 顯示新 migration 已套用，且 `psql` 查得到 `CoursePack`／`CoursePackMission` 兩張表結構符合 design.md DDL

## 2. Course Pack Envelope Schema（TDD）

- [ ] 2.1 [P] 撰寫 `packages/course/src/course-pack/schema.test.ts` 紅燈測試，涵蓋 Requirement「Operator can import a Course Pack envelope」的驗證邊界：合法 fixture 通過、缺少 `evaluator` 欄位失敗、`schema_version` 非 `"1.0.0"` 失敗、`target_runtime` 非 `"startkiter"` 失敗、`missions` 空陣列失敗；驗證：`pnpm --filter course vitest run schema.test.ts` 全部因模組不存在而失敗
- [ ] 2.2 實作 `packages/course/src/course-pack/schema.ts`（對應設計決策「Schema 驗證：在 StartKiter 內重新定義等價 zod schema」），提供與課神 `CoursePackEnvelopeSchema` 等價的 zod 驗證與 `validateCoursePackEnvelope` 函式；驗證：`pnpm --filter course vitest run schema.test.ts` 全部通過

## 3. Import Course Pack Procedure（TDD）

- [ ] 3.1 [P] 撰寫 `packages/api/modules/course/procedures/import-course-pack.test.ts` 紅燈測試，涵蓋 Requirement「Operator can import a Course Pack envelope」與「Re-importing the same source Course Pack id preserves history」：合法 envelope 回 200 且建立 `CoursePack`+`CoursePackMission`、缺欄位回 400 附非空 `errors`、非 operator 呼叫回 403 且不寫入、同一 `sourcePackId` 二次匯入使前筆 `status` 變 `superseded`；驗證：`pnpm --filter api vitest run import-course-pack.test.ts` 全部因 handler 不存在而失敗
- [ ] 3.2 實作 `packages/api/modules/course/procedures/import-course-pack.ts`（對應設計決策「API 介面：oRPC procedure 掛載於既有 `courseRouter`」與「重複匯入同一 `course_pack.id` 的處理：保留歷史版本」），掛 `.route({ method: "POST", path: "/course/packs/import" })`，使用 2.2 的 schema 驗證並落地 supersede 邏輯；驗證：`pnpm --filter api vitest run import-course-pack.test.ts` 全部通過

## 4. List Course Packs Procedure（TDD）

- [ ] 4.1 [P] 撰寫 `packages/api/modules/course/procedures/list-course-packs.test.ts` 紅燈測試，涵蓋 Requirement「Operator can list imported Course Packs」：匯入 a 再匯入 b 後 list 回傳 `[b, a]`、未匯入任何 pack 時回傳 `[]`；驗證：`pnpm --filter api vitest run list-course-packs.test.ts` 全部因 handler 不存在而失敗
- [ ] 4.2 實作 `packages/api/modules/course/procedures/list-course-packs.ts`，掛 `.route({ method: "GET", path: "/course/packs" })`，依 `importedAt` 遞減排序回傳；驗證：`pnpm --filter api vitest run list-course-packs.test.ts` 全部通過

## 5. 路由掛載

- [ ] 5.1 把 `importCoursePack`、`listCoursePacks` 加進 `packages/api/modules/course/router.ts` 的 `courseOperatorProcedure` 底下（對應設計決策「API 介面：oRPC procedure 掛載於既有 `courseRouter`」），讓兩支 procedure 對外可被呼叫；驗證：`grep -n "importCoursePack\|listCoursePacks" packages/api/modules/course/router.ts` 各命中至少一處，且 `pnpm --filter api type-check` 通過

## 6. 端到端驗證

- [ ] 6.1 用 Awesome-Koson `src/fixtures/saas-payment-course-pack.json` 的內容對本機測試環境完整跑一次 import → list 流程，確認 import 回傳 `missionCount: 1`、list 查得到該筆且 `status: "active"`；驗證：呼叫紀錄與回應內容存成 `/tmp/course-pack-import-verify.json`

## 7. Review

- [ ] 7.1 對 1-6 的變更跑一輪 correctness／security 角度 code review，確認 envelope 驗證邊界、operator 權限檢查、supersede 邏輯三項無 blocking 問題；驗證：CR 報告附進 PR 說明
