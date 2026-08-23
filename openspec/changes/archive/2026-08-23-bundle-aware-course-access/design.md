## Context

`packages/course/access.ts` 的 `canAccessCourseId(userId, courseId, reader)` 與 `BundleCourseAccessReader` 型別在 `core-module-bundles-coupons`（已封存）就寫好了，`apps/saas/tests/integration/bundle-course-access.test.ts` 也已經用一個 DB-backed reader 驗證過兩個情境：bundle 付款後對包內每堂課都拿到存取權、退款後對每堂課都撤銷存取權。但這個測試裡的 reader 是 test-only 實作，從未被搬進正式呼叫路徑。

目前買家端有兩個會讀取真實課程內容（`db.course` / `Chapter` / `Lesson`）的入口：`getLessonDetail`（`packages/api/modules/course/router.ts`）與站內 AI 助教（`apps/saas/app/api/course/ai/route.ts`）。`getLessonDetail` 是 `interactive-learning-system`（已封存）蓋的既有功能，前端由 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx` 呼叫，經 `AcademyClassroomClient` 顯示、`FluentPlayer` 播放。這條播放路徑本身完整可用，唯獨 `getLessonDetail` 內的授權判斷是：

```ts
const order = await db.order.findFirst({
  where: { userId, courseAccess: true, status: "paid" },
});
if (!order) throw new ORPCError("FORBIDDEN");
```

這段邏輯只問「有沒有任一筆付費訂單」，不問「這筆訂單對應的商品，有沒有包含正在請求的這堂課」。`Order.sku` 對 bundle 訂單存的是 `bundle.id`（`core-module-bundles-coupons` 定案的慣例），對單一開站包訂單存的是固定的 `MVP_SKU`。因此買了任何一個 bundle 的學員，目前可以讀取平台上所有已發布課程的內容，不限於自己那個 bundle 涵蓋的課程——這是規格已定義、實作未落地的授權缺口。

但現行 `openspec/specs/course-module/spec.md` 同時明定 `startkiter-mvp` 且 `courseAccess=true` 的學員可以播放課程。若只把兩個入口改成目前只認 bundle SKU 的 `canAccessCourseId`，會把合法 MVP 買家誤判成無權限。正確邊界是：MVP SKU 保留全課程 entitlement；bundle SKU 才依 `Bundle.courses` 做逐課程限制；任意其他付費 SKU 不得僅憑付款取得課程內容。

另外要注意：`apps/saas/lib/course-access.ts` 目前已有一個 `createPrismaCourseAccessReader()` + `userHasCourseAccess()`，服務的是舊的 `/course`（無 `[lessonId]`）平面頁面與 `packages/course/catalog.ts` 的 3 堂寫死 demo 課，走 `canAccessCourse()`（單一 `CourseAccessReader`，只判斷「有沒有 MVP_SKU 訂單」）。這條路徑與本次要修的 `getLessonDetail` 路徑完全獨立，本次不觸碰。

Cross-impact 檢查發現第二個受同樣缺口影響的入口：站內 AI 助教（`apps/saas/app/api/course/ai/route.ts`）對非免費試看單元的授權判斷，用的是完全一樣的「查任一筆 `courseAccess: true, status: "paid"` 訂單」邏輯。這個檔案是 Next.js Route Handler（不是 oRPC procedure），直接用 `auth.api.getSession({ headers: request.headers })` 取得 session，型別安全，沒有 `@ts-expect-error` 問題；但授權判斷邏輯本身有跟 `getLessonDetail` 一模一樣的缺口。若只修 `getLessonDetail`、不修這裡，買了 A bundle 的學員可以透過 AI 助教問到 B bundle 課程的內容（AI 助教會把 `lesson.content` 餵給模型），等於留了一個功能相同的繞道，這次修復就不完整。因此兩個入口在本次一起修，共用同一個 `userCanAccessCourseId` 判斷邏輯。

另外查證 supastarter 官方文件（`docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx`）確認 `getLessonDetail` 現有寫法有技術債：官方對「公開端點但需要選擇性拿到 session」定義了標準模式 `publicProcedureWithSession`（`publicProcedure.use()` 包一層取 session、不強制丟錯），但這個專案的 `packages/api/orpc/procedures.ts` 目前沒有這個 procedure，`getLessonDetail` 改用 `// @ts-expect-error optional user in context` 加 `context?.user?.id` 硬繞過型別檢查。這次改動剛好要動這段代碼，一併換成官方標準模式，不留新的型別債。

## Goals / Non-Goals

**Goals:**

- `getLessonDetail` 對非免費試看單元的授權判斷，改為「使用者是否對該 lesson 所屬 courseId 具備存取權」，重用已測試驗證過的 `canAccessCourseId` 邏輯。
- 站內 AI 助教（`apps/saas/app/api/course/ai/route.ts`）採用同一套判斷邏輯，堵住繞道。
- 保留 `course-module` spec 對 `startkiter-mvp` + `courseAccess=true` 的全課程 entitlement；bundle SKU 仍只授予包內課程。
- 新增的 production reader 查詢邏輯必須與 `bundle-course-access.test.ts` 裡驗證過的 `createDbBundleCourseAccessReader()` 行為一致（同樣的 `db.order`／`db.bundle` 查詢 shape），讓既有整合測試可以作為這次改動的行為基準線。
- `getLessonDetail` 改用官方標準的 `publicProcedureWithSession`，移除 `@ts-expect-error` 型別繞過。

**Non-Goals:**

- 不處理 `/course` 平面頁面與 `canAccessCourse()`／`createPrismaCourseAccessReader()` 那條獨立路徑。
- 不重新設計單一開站包（MVP_SKU）買家對真實課程資料庫的存取範圍——沿用現行 `course-module` spec 的全課程 entitlement，只在 shared helper 補上相容性分支。
- 不修改 `toggleLessonProgress` 或其他 `getLessonDetail`／AI 助教以外的 procedure。
- 不改變 `BundleCourseAccessReader` 的介面；`canAccessCourseId` 只做最小的 MVP_SKU entitlement 相容性分支，並補測試，不重新設計 reader。
- 不修改 `getLearnerCurriculum`／`getPublicCurriculum` 目前用 `db.course.findFirst` 只回傳「任意一個已發布課程」的行為——多 bundle 對應多課程大綱的情境是功能缺口而非授權漏洞，留待另一張 change 處理，這裡只記錄為已知限制（見 Risks）。

## Decisions

### 1. Production reader 放在 `packages/api/modules/course/lib/course-access.ts`，讓兩個入口共用

這次的 reader 同時被 `packages/api/modules/course/router.ts` 的 oRPC procedure 與 `apps/saas/app/api/course/ai/route.ts` 的 Route Handler 使用，因此放在 API package 的 course module 內，讓兩個入口共用同一個 production 實作。`packages/api` 不依賴 `apps/saas`，SaaS app 反向依賴 API package，符合既有 package 邊界。

替代方案：放在 `apps/saas/lib/course-access.ts`。否決理由：oRPC router 位於 `packages/api`，不能反向 import app layer；把 reader 放在 SaaS app 會造成 package 邊界倒置。既有的 `apps/saas/lib/course-access.ts` 保留給舊 `/course` 平面頁面的 MVP reader，不在本次修改。

### 2. Reader 查詢邏輯照抄測試裡驗證過的 shape，不重新設計

`findGrantedSkusForUser` 查 `db.order.findMany({ where: { userId, courseAccess: true }, select: { sku: true } })`；`findBundleCourseIds` 查 `db.bundle.findUnique({ where: { id: sku }, include: { courses: true } })`，回傳 `courses.map(c => c.courseId)` 或 `null`。這跟 `bundle-course-access.test.ts` 的 `createDbBundleCourseAccessReader()` 完全一致，差別只在生產版本不需要測試專用的清理邏輯。

### 3. 保留 MVP_SKU entitlement，bundle SKU 逐課程判斷

`course-module` spec 已把 `startkiter-mvp` + `courseAccess=true` 定義成全課程 entitlement，不能因這次接上 bundle-aware reader 而失效。`canAccessCourseId` 維持同一個入口，但在逐 bundle 反查前先處理 `MVP_SKU`：只要 reader 回傳該 SKU，直接視為有指定課程的存取權；其他 SKU 仍要由 `findBundleCourseIds` 回傳包含目標 `courseId` 才放行。退款後 `courseAccess=false` 的 MVP 訂單不會出現在 reader 結果，因此仍會被拒絕。

這個分支放在既有 shared helper，而不是讓兩個 API 入口各自認 `MVP_SKU`，確保播放 API 與 AI 助教永遠共用同一套 entitlement 規則。

### 4. `getLessonDetail` 的判斷順序：先查 lesson，再查 courseId 授權

現有流程是「查 lesson → 若非免費試看 → 查是否有付費訂單」。新流程改成「查 lesson（含 `chapter.courseId`）→ 若非免費試看 → 呼叫 `userCanAccessCourseId(userId, lesson.chapter.courseId)`」。未登入時維持原本 401（`UNAUTHORIZED`）；已登入但無權時維持 403（`FORBIDDEN`），只是判斷依據換了，回應行為對前端不變。

### 5. 新增 `publicProcedureWithSession`，取代 `getLessonDetail` 的 `@ts-expect-error` hack

`docs/reference/supastarter-nextjs-docs/api/protect-endpoints.mdx` 定義了官方標準模式：`publicProcedureWithSession` 是 `publicProcedure.use()` 包一層取 session、session 不存在時傳 `null` 而非丟錯，讓 handler 可以選擇性拿到已登入使用者。在 `packages/api/orpc/procedures.ts` 新增這個 procedure，`getLessonDetail` 改用它取代目前的 `publicProcedure` + `// @ts-expect-error optional user in context` + 手動 `context?.user?.id`。這是新增一個共用 procedure，不修改既有的 `publicProcedure`／`protectedProcedure`／`adminProcedure`，其他既有 procedure 的行為不受影響。

站內 AI 助教（`apps/saas/app/api/course/ai/route.ts`）是 Next.js Route Handler，不是 oRPC procedure，本來就直接用 `auth.api.getSession({ headers: request.headers })` 取得型別安全的 session；它不受 `publicProcedureWithSession` 這個決策影響，但仍要改用同一個 `userCanAccessCourseId` helper。

## Implementation Contract

### Behavior

- 已登入使用者請求 `getLessonDetail({ lessonId })`：
  - lesson 不存在或 `status !== "PUBLISHED"` → `NOT_FOUND`（不變）。
  - lesson 為免費試看（`isFreePreview: true`）→ 直接回傳（不變）。
  - lesson 非免費試看、使用者未登入 → `UNAUTHORIZED`（不變）。
  - lesson 非免費試看、使用者已登入：
    - 若使用者持有 `startkiter-mvp` 且 `courseAccess=true` 的訂單 → 回傳 lesson 完整內容。
    - 或持有一筆 `courseAccess: true` 訂單，其 `sku` 對應的 `Bundle` 的 `courses` 清單包含這個 lesson 所屬的 `courseId` → 回傳 lesson 完整內容。
    - 否則（沒有 MVP entitlement，也沒有任何訂單的 sku 能反查到包含這個 courseId 的 bundle）→ `FORBIDDEN`。
- 已登入使用者對 `apps/saas/app/api/course/ai/route.ts` 發出請求（針對某個 `lessonId` 問 AI 助教）：授權判斷邏輯與上述 `getLessonDetail` 完全一致（同一個 `userCanAccessCourseId` 呼叫），行為對稱：403/401 條件相同，差別只在回應格式維持該路由既有的 `NextResponse.json({ error, message }, { status })` shape，不改成 oRPC 錯誤格式。

### Interface / data shape

新增於 `packages/api/modules/course/lib/course-access.ts`：

```ts
export function createPrismaBundleCourseAccessReader(): BundleCourseAccessReader {
  return {
    findGrantedSkusForUser: async (userId: string) => {
      const rows = await db.order.findMany({
        where: { userId, courseAccess: true },
        select: { sku: true },
      });
      return rows.map((r) => r.sku);
    },
    findBundleCourseIds: async (sku: string) => {
      const bundle = await db.bundle.findUnique({
        where: { id: sku },
        include: { courses: true },
      });
      if (!bundle) return null;
      return bundle.courses.map((c) => c.courseId);
    },
  };
}

export async function userCanAccessCourseId(userId: string, courseId: string): Promise<boolean> {
  return canAccessCourseId(userId, courseId, createPrismaBundleCourseAccessReader());
}
```

新增於 `packages/api/orpc/procedures.ts`（依 supastarter 官方 `publicProcedureWithSession` 範例）：

```ts
export const publicProcedureWithSession = publicProcedure.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return await next({
    context: {
      session: session?.session || null,
      user: session?.user || null,
    },
  });
});
```

`packages/api/modules/course/router.ts` 的 `getLessonDetail` procedure 從 `publicProcedure` 換成 `publicProcedureWithSession`；handler 內原本查 `db.order.findFirst(...)` 那段替換為：

```ts
import { userCanAccessCourseId } from "./lib/course-access";
```

```ts
if (!user?.id) {
  throw new ORPCError("UNAUTHORIZED");
}
const allowed = await userCanAccessCourseId(user.id, lesson.chapter.courseId);
if (!allowed) {
  throw new ORPCError("FORBIDDEN");
}
```

`db.lesson.findUnique` 的 `include` 需確認 `chapter` 已含 `courseId`（目前 `include: { chapter: true }` 已足夠，`Chapter` model 本身有 `courseId` 欄位）。

`apps/saas/app/api/course/ai/route.ts` 目前的 `db.lesson.findUnique({ where: { id: lessonId } })` 沒有 `include`／`select`，`Lesson` model 本身沒有 `courseId` 欄位（`courseId` 掛在 `Chapter` 上，`Lesson` 只有 `chapterId`）。此 Route Handler 從 API package 匯入共用 helper：

```ts
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
```

再把查詢改為：

```ts
const lesson = await db.lesson.findUnique({
  where: { id: lessonId },
  include: { chapter: true },
});
```

原本查 `db.order.findFirst(...)` 那段替換為：

```ts
const allowed = await userCanAccessCourseId(session.user.id, lesson.chapter.courseId);
if (!allowed) {
  return NextResponse.json({ error: "forbidden", message: "沒有觀看這個單元的權限" }, { status: 403 });
}
```

（`session` 已由該路由既有的 `auth.api.getSession(...)` 取得，此改動點在 `!lesson.isFreePreview` 判斷區塊內，與現有程式碼順序一致。）

### Failure modes

- `db.bundle.findUnique` 找不到對應 sku（例如 sku 是 `MVP_SKU` 或已刪除的 bundle）→ `findBundleCourseIds` 回傳 `null`，該筆訂單視為與此 courseId 無關，不拋錯，繼續檢查使用者名下其他訂單。
- `findGrantedSkusForUser` 回傳 `MVP_SKU` → `canAccessCourseId` 直接視為全課程 entitlement；退款後因 `courseAccess=false` 不會回傳該 SKU。
- 使用者名下沒有任何 `courseAccess: true` 訂單 → `findGrantedSkusForUser` 回傳空陣列，`canAccessCourseId` 直接回傳 `false` → API 回 `FORBIDDEN`。
- 不新增任何會讓現有免費試看或未登入路徑改變行為的分支。
- AI 助教路由若 `lesson.chapter` 為 `null`（孤兒 Lesson），維持該路由既有的 try/catch 外層，回傳 503（`ai_unavailable`），不額外新增錯誤分支。

### Acceptance criteria

- `packages/api/modules/course/course.test.ts` 新增至少 3 個案例：(1) 買了包含該課程的 bundle → 200 且回傳完整內容；(2) 買了不包含該課程的其他 bundle → `FORBIDDEN`；(3) 沒有任何訂單 → `UNAUTHORIZED`（未登入）或 `FORBIDDEN`（已登入無訂單）。
- `apps/saas/app/api/course/ai/route.test.ts`（新建或既有補測）新增對稱的 3 個案例，驗證 HTTP 狀態碼 200／403／401 與 `getLessonDetail` 一致。
- `packages/course/access.test.ts` 新增 `MVP_SKU + courseAccess=true` 可存取指定課程、退款後因 reader 不回傳 SKU 而拒絕的相容性案例。
- `apps/saas/tests/integration/bundle-course-access.test.ts` 維持全綠，不因這次改動而回歸失敗。
- `pnpm --filter @startkiter/api test`、`pnpm --filter @startkiter/saas test` 與 `pnpm --filter @startkiter/saas test:integration -- tests/integration/bundle-course-access.test.ts` 全綠。
- `pnpm type-check` 全綠（`lesson.chapter.courseId` 型別存在於兩個檔案，不需要 `any` 或 `@ts-expect-error`；`getLessonDetail` 的 `@ts-expect-error optional user in context` 這行必須被移除）。

> 驗收界線註記（2026-08-23）：驗證過程發現 API Vitest 未啟用 OXC automatic JSX runtime，導致既有 `ConceptCompare.tsx` 被錯誤解析；另發現 `sandbox-runtime.ts` 使用目前 TypeScript lib 不接受的 `Array.prototype.at`。兩項皆已在本 change 內以最小相容性修復處理，並由 API 全套測試、course 全套測試與全域 type-check/build 實跑驗證通過；這些修復不改產品授權行為。

### Scope boundaries

In scope：`packages/api/modules/course/lib/course-access.ts` 新增 export、`packages/course/access.ts` 的 MVP entitlement 相容性分支、`packages/api/orpc/procedures.ts` 新增 `publicProcedureWithSession`、`packages/api/modules/course/router.ts` 的 `getLessonDetail` 授權邏輯、`apps/saas/app/api/course/ai/route.ts` 的授權邏輯、對應的測試檔案，以及讓本 change 能完成 repo baseline gate 的最小測試設定與 TypeScript 相容性修復（`packages/api/vitest.config.ts`、`packages/course/src/webcontainer/sandbox-runtime.ts`、`packages/course/src/webcontainer/sandbox-runtime.test.ts`）。

Out of scope：`/course` 平面頁面、`packages/course/catalog.ts`、前端任何 UI 檔案、資料庫 schema、`toggleLessonProgress`、`getLearnerCurriculum`／`getPublicCurriculum`、或其他 course procedure。

## Risks / Trade-offs

- [風險] 若 `Chapter` 與 `Lesson` 之間存在孤兒資料（`Lesson.chapterId` 指向不存在的 `Chapter`），`include: { chapter: true }` 會讓 `lesson.chapter` 為 `null`，`lesson.chapter.courseId` 會丟未捕捉例外。→ 緩解：既有 schema 對 `Chapter → Lesson` 是 `onDelete: Cascade`，正常操作下不會產生孤兒 Lesson；仍在 handler 內對 `lesson.chapter` 缺失明確拋 `NOT_FOUND` 而非讓例外外洩。
- [風險] 效能：每次 `getLessonDetail`／AI 助教呼叫都要多一次 `db.order.findMany` + 逐 sku 查 `db.bundle`。→ 緩解：MVP 階段訂單與 bundle 數量都小，且原邏輯本來就有一次 `db.order.findFirst` 查詢，量級相近，不做提前最佳化。
- [已知限制，非本次處理] `getLearnerCurriculum`／`getPublicCurriculum` 目前用 `db.course.findFirst({ where: { status: "PUBLISHED" } })` 只回傳「隨便一個已發布課程」的大綱，不區分使用者實際持有哪個 bundle。這次修完 `getLessonDetail` 後，單一 lesson 的內容授權正確了，但學員教室頁面顯示的課程大綱清單本身還不會依 bundle 過濾——這是既有的功能缺口，不是本次改動引入的退化，留待另一張 change 處理。
