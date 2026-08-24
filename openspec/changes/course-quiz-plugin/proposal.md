## Why

StartKiter 目前沒有課後測驗機制，買家無法考核學員是否真的學會。woomin 的 `Quiz`／`QuizQuestion`／`QuizAttempt` 三個 model（單選/多選/是非/填空四種題型、及格分數、時間限制、洗牌、答案顯示策略、阻擋後續單元）是生產驗證過的完整功能，但不能照抄其資料儲存方式：StartKiter 的 `platform-core-boundary` capability 明文規定「content-type Plugin 必須透過共用 `PluginContent` 表儲存，不得開專屬表存內容」，`platform-mount-points` capability 明文規定 v1 只保證渲染 `mount.content.kind: "auto"`，`"block"`（嵌入既有課程正文）平台不保證顯示。這次要在遵守這兩條既有架構邊界的前提下實作測驗功能。

## What Changes

- 新增 `course-quiz` Plugin：業務邏輯放在獨立的 `packages/course-quiz/`（比照既有 `packages/course` 的目錄慣例：根目錄 `index.ts` 進入點），在 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 靜態陣列新增一筆 manifest entry（`id: "quiz"`, `dataSpec: "content"`, `mount.content: { kind: "auto", boundTo: "/quiz" }`, `mount.route: { path: "/quiz-admin" }`）——StartKiter 的 Plugin「安裝」不是動態裝卸 UI，`platform-marketplace` 既有 Requirement 明文「Marketplace 頁面不提供安裝/卸載按鈕，安裝是靠 AI 工具修改買家倉庫代碼、git push 部署」，這次是把 Quiz 的 manifest 直接寫進代碼庫的靜態陣列
- 測驗定義（設定＋題目）存進共用 `PluginContent` 表：`pluginId: "quiz"`, `type: "quiz-definition"`, `body: { lessonId, passingScore, timeLimitMinutes, shuffleQuestions, shuffleOptions, showAnswers, blockNextLesson, questions: [...] }`
- 新增 `QuizAttempt` 獨立 Prisma model（交易型資料，`platform-core-boundary` 既有 Requirement 明文允許此類資料自己開 migration-based 表，只是 v1 不提供 CLI 鷹架，這次手動寫 migration）：記錄 `userId`、`pluginContentId`（對應測驗定義）、`answers`、`score`、`passed`、`timeTakenSeconds`、`startedAt`、`submittedAt`
- 買家在課程單元的 MDX 內容裡自行插入連結指向 `/quiz/[pluginContentId]`，不修改 `course-module` capability 的既有渲染邏輯（因為 v1 不保證 block 嵌入模式的渲染）
- 學員在測驗頁作答送出後，若 `passed` 且該測驗設定 `blockNextLesson: true`，把結果記錄下來供買家自己在課程內容裡串接「下一堂課連結是否要對這個學員顯示」的判斷（這次不修改 `course-module` 的既有解鎖邏輯，只提供 `hasPassedQuiz(userId, pluginContentId)` 查詢函式讓買家自己決定怎麼用）

## Non-Goals

- 不修改 `course-module`／`platform-mount-points`／`platform-core-boundary` 既有 capability 的 Requirement（這次是在既有架構邊界內新增一個服從規則的 Plugin，不是擴大 Core 邊界）
- 不做測驗題目的隨堂練習/即時回饋互動元件（`packages/course` 已有 `InstantQuiz` 元件是課程內容的一部分，跟這次「有及格分數/時間限制/正式記錄成績」的測驗系統是不同層級的功能，不合併）
- 不做題庫共享/題目匯入匯出
- 不做 `blockNextLesson` 的自動化強制解鎖判斷寫進 Core 課程引擎，維持買家自己在內容裡決定怎麼用查詢結果

## Capabilities

### New Capabilities

- `course-quiz-plugin`：課後測驗 Plugin，四種題型、及格判斷、成績記錄

## Impact

- Affected specs: `course-quiz-plugin`（新增）
- Affected code：
  - New:
    - `packages/course-quiz/index.ts`
    - `packages/course-quiz/package.json`
    - `packages/course-quiz/tsconfig.json`
    - `packages/course-quiz/quiz-definition.ts`
    - `packages/course-quiz/quiz-definition.test.ts`
    - `packages/course-quiz/quiz-grading.ts`（依題型計分邏輯）
    - `packages/course-quiz/quiz-grading.test.ts`
    - `apps/saas/app/(authenticated)/quiz/[pluginContentId]/page.tsx`
    - `apps/saas/app/(authenticated)/(operator)/quiz-admin/page.tsx`
    - `packages/api/modules/quiz/router.ts`
    - `packages/api/modules/quiz/router.test.ts`
    - `packages/database/prisma/migrations/`（新增 `QuizAttempt` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`（新增 `QuizAttempt` model）
    - `packages/platform/src/mount-points.ts`（在 `MOUNT_POINTS` 陣列新增 Quiz manifest entry）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
