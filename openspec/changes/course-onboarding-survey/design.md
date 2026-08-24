## Context

問卷觸發時機需要判斷「使用者對這門課有存取權，且尚未填過問卷」，這只是讀取既有的 `canAccessCourseId` 判斷結果加上查詢 `CourseOnboardingSurveyResponse` 是否存在，不修改任何既有授權判斷邏輯。

## Goals / Non-Goals

**Goals:**

- 買家取得課程存取權後首次進入課程時彈出問卷，可跳過
- 固定欄位問卷，不做題目生成器

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: 問卷彈出時機讀取既有 canAccessCourseId 結果，不新增授權判斷邏輯

課程頁面載入時，若 `canAccessCourseId` 回傳 true 且該 `(userId, courseId)` 沒有 `CourseOnboardingSurveyResponse` 記錄，前端顯示問卷彈窗（可關閉跳過，跳過不記錄任何「已跳過」狀態，下次進入課程還會再彈出，直到真正填寫或該學員手動記得關閉——這次不做「已跳過」的持久化狀態，避免過度設計）。

Alternatives Considered:
- 新增一個「已跳過」欄位持久化記錄，跳過後不再彈出 → 否決：這次 MVP 範圍問卷是一次性調研工具，多次跳過提示不是嚴重的體驗問題，避免為了這個小細節新增額外的資料欄位與邏輯分支

## Implementation Contract

**Behavior:**
- 買家取得課程存取權後首次進入課程頁，若尚未填過問卷則顯示彈窗
- 填寫並送出後建立記錄，之後不再顯示
- 關閉彈窗跳過本次，下次進入課程可能再次顯示

**Interface / data shape:**
- `submitOnboardingSurvey(courseId, response): Promise<void>`

**DB DDL:**
```sql
CREATE TABLE "course_onboarding_survey_response" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL,
  "goals" TEXT[] NOT NULL DEFAULT '{}',
  "purchaseFactors" TEXT[] NOT NULL DEFAULT '{}',
  "hesitation" TEXT,
  "alternatives" TEXT,
  "discoverySource" TEXT,
  "discoverySourceOther" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "courseId")
);
```

**Failure modes:**
- 未取得課程存取權的使用者呼叫 `submitOnboardingSurvey` → 403

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test submit-onboarding-survey.test.ts` 涵蓋重複填答被唯一鍵拒絕、無存取權被拒絕
- `pnpm type-check`／`pnpm build` 全綠

**Scope boundaries:**
- In scope：`CourseOnboardingSurveyResponse` model；`submitOnboardingSurvey` procedure；問卷彈窗；operator 查詢頁
- Out of scope：可自訂題目的問卷生成器；填答提醒信；「已跳過」狀態持久化

## Risks / Trade-offs

- [Risk] 問卷可能每次進課程都彈出直到填寫，若學員一直跳過可能造成體驗干擾 → Mitigation: MVP 範圍先接受這個權衡，記錄在案，若上線後反饋不佳可另開 change 補「已跳過」持久化
