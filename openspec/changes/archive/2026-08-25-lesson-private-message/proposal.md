## Why

StartKiter 沒有學員對單元內容的私訊問答機制，學員對某堂課有疑問只能靠公開留言（若 `course-review-plugin` 已 apply）或站內客服（`unified-support-desk`，但那是處理網站/帳號/金流類問題，不是課程內容問答）。woomin 的 `LessonPrivateMessage` 是學員與老師針對特定單元的一對一私訊（含附件），是活躍功能（未被標注為舊版），跟客服系統跟公開留言都不重疊。

## What Changes

- 新增 `LessonPrivateMessage` model（`lessonId`／`userId`／`content`／附件欄位／`isFromTeacher`／`readByTeacher`）
- 新增私訊 API procedure：學員發送私訊、老師/operator 回覆（`isFromTeacher: true`）、標記已讀
- 附件上傳複用 `packages/storage`（比照 `course-assignment-plugin` 的做法，新增 `lesson-messages` bucket，`storageKey` 用系統產生 ID）
- 學員在課程單元頁可看到私訊面板；operator 後台可看到所有單元的未讀私訊列表

## Non-Goals

- 不做多人群組對話，維持一位學員對老師的一對一私訊
- 不做即時推播通知（新私訊到達的 email/站內通知留給未來 Email 生命週期自動化模組）
- 不做已讀後的訊息撤回/編輯

## Capabilities

### New Capabilities

- `lesson-private-message`：學員與老師的單元私訊問答

## Impact

- Affected specs: `lesson-private-message`（新增）
- Affected code：
  - New:
    - `packages/api/modules/course/procedures/send-lesson-message.ts`
    - `packages/api/modules/course/procedures/send-lesson-message.test.ts`
    - `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-messages-panel.tsx`
    - `apps/saas/app/(authenticated)/(operator)/lesson-messages/page.tsx`
    - `packages/database/prisma/migrations/`（新增 `LessonPrivateMessage` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/api/modules/course/router.ts`
    - `packages/storage/types.ts`（新增 `lessonMessages` bucket）
    - `packages/storage/config.ts`
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
