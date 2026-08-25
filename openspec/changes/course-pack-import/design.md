## Context

課神（Awesome-Koson，路徑 `/Users/fishtv/Development/Awesome-Koson`）是獨立的老師端課程設計引擎，PR #4 已實作老師端無限畫布，能把 Mission/Evaluator/Recovery 結構匯出成符合 `CoursePackEnvelopeSchema` 的 JSON（`src/domain/course-pack.ts`、`src/domain/export.ts`），範例見 `src/fixtures/saas-payment-course-pack.json`。envelope 結構固定為 `{ schema_version: "1.0.0", target_runtime: "startkiter", course_pack: { id, title, learning_outcomes[], missions[] } }`，每個 Mission 含 `action`（instructions + surface）、`evaluator`（deterministic + adapter + criteria）、`feedback`、`consequence`、`recovery`（按 attempt 遞增排序的救援階梯）、`evidence`（至少一項必填學習證據）。

StartKiter 目前的課程模組（`packages/course/`、`packages/api/modules/course/router.ts`）是 MDX Lesson 型態，資料庫只有 `Course`/`Lesson`/`LessonProgress` model，沒有任何結構能承接 Mission 序列，也沒有匯入端點。`course-code-sandbox` spec 已定義的 `WebContainerSandbox` MDX block 是唯一跟 Mission `action.surface: code_editor` 概念相近的既有能力，但本次不做串接。

## Goals / Non-Goals

**Goals:**

- StartKiter 能接收課神匯出的 Course Pack JSON envelope，用等價的 schema 規則驗證格式
- 驗證通過的 Course Pack 與其 Mission 序列被持久化，且可被查詢
- 同一個 `course_pack.id` 重複匯入時保留歷史版本，不靜默覆寫

**Non-Goals:**

- 不做學員端 Mission 執行 UI
- 不做 Evaluator/Recovery/WebContainerSandbox 判定串接（執行引擎留待下一個 change）
- 不做課神端無限畫布雙向同步（那是 Awesome-Koson 端的既有已知工作）
- 不做課程銷售 / `course-bundles` 掛勾
- 不做課神 schema 變動時的自動偵測或雙向套件共用

## Decisions

### 儲存結構：CoursePack + CoursePackMission 雙表，Mission 巢狀內容存 JSONB

- 選項 A：整包存單一 JSONB 欄位，不拆表 — 否決：無法對個別 Mission 建索引或未來做進度追蹤查詢
- 選項 B：把 Action/Evaluator/Feedback/Consequence/Recovery/Evidence 全部正規化拆成獨立表 — 否決：執行引擎尚未設計（Non-Goals 已排除），現在拆到欄位層級是過度工程化，且巢狀結構本來就是課神端驗證過的不可變 payload
- 採用：`CoursePack` 存查詢用欄位（id/title/schemaVersion/status/importedBy/importedAt），`CoursePackMission` 存 id/title/goal/sortOrder 供列表化 UI，加一個 `missionData` JSONB 欄位存完整 Mission 結構，供未來執行引擎讀取

### Schema 驗證：在 StartKiter 內重新定義等價 zod schema

- 選項 A：發布課神 schema 成獨立 npm package 讓兩邊 import 共用 — 否決：兩個系統目前是獨立 repo（課神 mission.md 明訂「不綁定單一引擎」），現在建套件發布/版本管理基礎設施範圍過大，超出本次 MVP
- 選項 B：只驗證 JSON 語法合法，不驗證結構 — 否決：格式錯誤的 Mission 資料會流進 DB，未來執行引擎讀到會直接炸裂
- 採用：在 `packages/course/src/course-pack/schema.ts` 重新定義一份等價 zod schema（規則對齊課神 `CoursePackSchema`/`CoursePackEnvelopeSchema`），代價是兩邊 schema 需人工同步，風險見下方 Risks

### API 介面：oRPC procedure 掛載於既有 `courseRouter`

- 選項 A：獨立 Next.js Route Handler（比照 `apps/saas/app/api/course/studio/route.ts`）— 否決：需另外處理 body parsing 與權限檢查，且未來 admin UI 要用既有 oRPC client 呼叫會更麻煩
- 選項 B：CLI script 本地匯入，不開 API — 否決：無法讓未來的 operator UI 直接觸發匯入
- 採用：新增 `importCoursePack`、`listCoursePacks` procedure，掛在既有 `courseOperatorProcedure`（沿用 `packages/api/modules/course/router.ts` 的 `isCourseOperator` 權限檢查，reuse-first）

### 重複匯入同一 `course_pack.id` 的處理：保留歷史版本

- 選項 A：直接覆寫（UPDATE）— 否決：正在被引用的舊資料會消失，無法追蹤誰在何時匯入了壞掉的版本
- 選項 B：拒絕匯入，要求換 id — 否決：違反課神端「同一個 id 迭代設計」的自然工作流程，體驗差
- 採用：每次匯入建立新的 `CoursePack` 記錄，`sourcePackId` 對應課神 `course_pack.id` 做業務識別；同一 `sourcePackId` 的舊記錄 `status` 改為 `superseded`，新記錄為 `active`

## Implementation Contract

**Behavior**：具備 `courseOperatorProcedure` 權限的使用者呼叫 `courseRouter.importCoursePack({ envelope })`：
- envelope 通過 schema 驗證 → 建立 1 筆 `CoursePack`（status=active）與對應筆數的 `CoursePackMission`，若同一 `sourcePackId` 已有 `active` 記錄則先改為 `superseded`；回傳 `{ id, sourcePackId, title, missionCount, importedAt }`
- envelope 驗證失敗 → 拋出 `ORPCError('BAD_REQUEST')`，附上 `errors: { path: string; message: string }[]`（格式對齊課神 `ValidationResult.errors`）
- 非 operator 呼叫 → `ORPCError('FORBIDDEN')`

`courseRouter.listCoursePacks()`：回傳所有 `CoursePack`（含 status）依 `importedAt` 遞減排序，供 operator 查看匯入歷史。

**Interface / data shape**：
- 輸入：`{ envelope: unknown }`，內部用 `CoursePackEnvelopeSchema.safeParse` 驗證（`schema_version` 字面值 "1.0.0"，`target_runtime` 字面值 "startkiter"）
- 輸出（成功）：`{ id: string; sourcePackId: string; title: string; missionCount: number; importedAt: string }`
- 輸出（列表）：`{ id: string; sourcePackId: string; title: string; status: "active" | "superseded"; missionCount: number; importedAt: string }[]`

**Failure modes**：
- Schema 驗證失敗：400 BAD_REQUEST，不寫入 DB，回傳逐欄位 errors 陣列
- DB 寫入失敗：500，不吞錯，原始錯誤往上拋
- 權限不足：403 FORBIDDEN，不揭露是否存在該 Course Pack

**Acceptance criteria**：
- 用 Awesome-Koson `src/fixtures/saas-payment-course-pack.json` 的內容呼叫 `importCoursePack`，成功建立 1 筆 `CoursePack` + 1 筆 `CoursePackMission`，`listCoursePacks` 查得到且 status=active
- 傳入缺少 `evaluator` 欄位的 payload，回 400 且 `errors` 非空陣列
- 非 operator 身份呼叫 `importCoursePack` 回 403
- 對同一 `sourcePackId` 匯入第二次，第一筆記錄 status 變 `superseded`，第二筆 status=active，`listCoursePacks` 兩筆都查得到

**Scope boundaries**：
- In scope：`importCoursePack`/`listCoursePacks` procedure、`CoursePack`/`CoursePackMission` schema 與 migration、operator 權限檢查、zod 驗證
- Out of scope：學員端 UI、Evaluator/Recovery 執行邏輯、WebContainerSandbox 串接、課神主動推送（本次只做被動接收）、課神 schema 版本自動偵測

## Risks / Trade-offs

- [Risk] 課神端 schema 未來新增/修改欄位，StartKiter 這份手動同步的 zod schema 沒跟著更新，導致新格式被誤判無效 → Mitigation：`schema.test.ts` 用課神 fixture 鎖住當前約定版本，未來課神 schema 變動時需另開 change 同步更新
- [Risk] `course_pack.id`（即 `sourcePackId`）沒有跨系統唯一性保證，兩位老師可能各自取同一個 id → Mitigation：記錄 `importedBy`，衝突時由 operator 人工排查，MVP 不做自動防撞機制
- [Risk] Mission 巢狀結構存成 JSONB，未來要做單一 Mission 進度追蹤時需要重新拆表遷移 → Mitigation：`missionData` JSONB 已與 id/title/goal 索引欄位分離，未來只需新增遷移，不影響匯入 API 介面契約

## Migration Plan

1. 開發環境執行 `prisma migrate dev` 產生上方 DDL 對應的 migration 檔
2. Review migration SQL：確認新增 `CoursePack`/`CoursePackMission` 表不含對 `Course`/`Lesson` 的外鍵依賴，不影響既有資料
3. 部署到 TEST（`test-startkiter.vercel.app`，Neon）執行 `prisma migrate deploy`
4. 用課神 fixture 手動呼叫一次 `importCoursePack` 驗證端到端可用
5. 正式環境比照 TEST 流程執行 `prisma migrate deploy`

**回滾策略**：新表對既有表無外鍵依賴，回滾只需 `prisma migrate resolve --rolled-back <migration>` 並移除新表；不影響 `Course`/`Lesson`/`LessonProgress` 既有資料。

## Data Model DDL

```sql
CREATE TABLE "CoursePack" (
    "id" TEXT NOT NULL,
    "sourcePackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "learningOutcomes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursePack_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoursePack_sourcePackId_idx" ON "CoursePack"("sourcePackId");
CREATE INDEX "CoursePack_status_idx" ON "CoursePack"("status");

CREATE TABLE "CoursePackMission" (
    "id" TEXT NOT NULL,
    "coursePackId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "missionData" JSONB NOT NULL,

    CONSTRAINT "CoursePackMission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CoursePackMission_coursePackId_fkey" FOREIGN KEY ("coursePackId") REFERENCES "CoursePack"("id") ON DELETE CASCADE
);

CREATE INDEX "CoursePackMission_coursePackId_idx" ON "CoursePackMission"("coursePackId");
CREATE UNIQUE INDEX "CoursePackMission_coursePackId_missionId_key" ON "CoursePackMission"("coursePackId", "missionId");
```
