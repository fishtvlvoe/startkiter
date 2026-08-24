## Why

StartKiter 沒有購買後的新生問卷機制，無法系統性收集「學員為什麼買這門課、猶豫過什麼、怎麼發現的」這類產品/行銷調研資料。woomin 的 `CourseOnboardingSurveyResponse` 是固定欄位的問卷（不是可自訂題目的問卷生成器），這次照抄同樣的固定欄位設計，範圍單純。

## What Changes

- 新增 `CourseOnboardingSurveyResponse` model（`goals`／`purchaseFactors`／`hesitation`／`alternatives`／`discoverySource`／`discoverySourceOther`，`@@unique([userId, courseId])` 一位學員對一門課只填一次）
- 買家在課程存取權生效後（一次買斷付款成功、bundle 授予、訂閱首期成功、或邀請兌換成功，四種來源都算）首次進入課程時彈出問卷，可跳過
- Operator 後台新增問卷回應查詢頁（依課程分組查看填答統計）

## Non-Goals

- 不做可自訂題目的問卷生成器，固定欄位比照 woomin 既有設計
- 不做問卷填答提醒信
- 不強制填答（可跳過），不影響課程存取權本身

## Capabilities

### New Capabilities

- `course-onboarding-survey`：購買後新生問卷

## Impact

- Affected specs: `course-onboarding-survey`（新增）
- Affected code：
  - New:
    - `packages/api/modules/course/procedures/submit-onboarding-survey.ts`
    - `packages/api/modules/course/procedures/submit-onboarding-survey.test.ts`
    - `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/onboarding-survey-modal.tsx`
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/onboarding-surveys/page.tsx`
    - `packages/database/prisma/migrations/`（新增 `CourseOnboardingSurveyResponse` model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/api/modules/course/router.ts`
    - `packages/platform/src/mount-points.ts`（`MOUNT_POINTS` 新增一筆 entry：`route.path: "/admin/onboarding-surveys"`、`menu: { requiresOperator: true }`，比照既有 `bundles`/`admin` entry 慣例，operator 才會在側邊選單看到入口）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
