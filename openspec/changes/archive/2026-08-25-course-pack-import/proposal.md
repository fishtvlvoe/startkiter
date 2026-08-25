## Why

課神（Awesome-Koson）已經能讓老師在無限畫布上設計 Mission/Evaluator/Recovery 結構，並匯出成符合 `CoursePackEnvelopeSchema`（`schema_version: "1.0.0"`, `target_runtime: "startkiter"`）的 JSON 檔案，但 StartKiter 目前的課程模組只支援 MDX Lesson 型態，沒有任何端點能讀取這份 JSON。兩個系統的規格已經定義好，卻沒有真正接上，老師設計完的內容進不了學員實際上課的平台。

## What Changes

- 新增 Course Pack JSON 匯入端點，接收課神匯出的 envelope（`schema_version` + `target_runtime` + `course_pack`），用與課神一致的驗證規則（Mission 必須有 id/title/goal/action/evaluator/feedback/consequence/recovery/至少一項必填 evidence）擋掉格式錯誤的檔案
- 新增資料表儲存匯入後的 Course Pack 與其 Mission 序列，讓匯入結果可被查詢與追蹤匯入歷史
- 新增管理端查詢端點，讓 operator 能列出已匯入的 Course Pack 與其驗證狀態

## Non-Goals (optional)

（design.md 會詳列 In Scope / Out of Scope，此處留空）

## Capabilities

### New Capabilities

- `course-pack-import`：接收、驗證、儲存課神匯出的 Course Pack JSON envelope，並提供匯入紀錄查詢

### Modified Capabilities

（無，本次不變更既有 capability 的需求層行為）

## Impact

- Affected specs: New: `course-pack-import`
- Affected code:
  - New:
    - `packages/database/prisma/migrations/<timestamp>_add_course_pack/migration.sql`
    - `packages/course/src/course-pack/schema.ts`（Course Pack envelope 的 zod 驗證，對齊課神 `CoursePackSchema`/`CoursePackEnvelopeSchema`）
    - `packages/course/src/course-pack/schema.test.ts`
    - `packages/api/modules/course/procedures/import-course-pack.ts`
    - `packages/api/modules/course/procedures/import-course-pack.test.ts`
    - `packages/api/modules/course/procedures/list-course-packs.ts`
  - Modified:
    - `packages/database/prisma/schema.prisma`（新增 `CoursePack`、`CoursePackMission` model）
    - `packages/api/modules/course/router.ts`（掛載 `importCoursePack`、`listCoursePacks` 到 `courseOperatorProcedure`）
- Dependencies 新增：無（`zod` 已是既有共用依賴）
- 環境變數新增：無
