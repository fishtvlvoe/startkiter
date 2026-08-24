## Context

跟 `course-quiz-plugin`／`course-assignment-plugin` 不同：那兩個都有「operator 預先定義的內容模板」（測驗設定、作業說明）這一層走 `PluginContent`，加上「使用者提交記錄」這一層走交易型表。這次的評價/留言完全沒有模板定義層——`CourseReview`／`LessonComment` 本身就是使用者直接產生的最終資料，`ReviewHelpful`／`ReviewReport` 是對評價的二次互動。四者性質上都是交易型資料，`platform-core-boundary` 既有 Requirement 允許這類資料開自己的 migration-based 表。

## Goals / Non-Goals

**Goals:**

- 課程評價（星等+文字+老師回覆+有用投票+檢舉）與單元留言（含匿名顯示、管理者已讀、軟刪除）全部走交易型獨立表
- 提供即時計算的評分摘要查詢，不修改 `course-module` 既有 `Course` model schema

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: 評價與留言全部走交易型獨立表，不使用 PluginContent

`PluginContent` 的欄位形狀（`id`／`pluginId`／`type`／`title`／`body`／`authorId`）是為「創作者編寫的內容」設計的：`title` 隱含「這是一份有標題的作品」，`body` 是整份內容的 JSON 快照。評價/留言不符合這個語意——沒有 `title`，且需要對個別欄位（`rating`、`helpfulCount`、`isVisible`）做高頻的結構化查詢與更新（例如列出某課程評價依 `helpfulCount` 排序），塞進 JSON `body` 裡每次更新都要整份重寫且無法用資料庫層索引個別欄位。四個 model 各自開表，比照 woomin 既有欄位形狀。

Alternatives Considered:
- 把評價塞進 `PluginContent{pluginId: "review", type: "course-review", body: {...}}` → 否決：`helpfulCount` 這種需要頻繁 `increment` 的計數器欄位若放在 JSON body 裡，每次投票都要整份讀出、修改、寫回，比獨立欄位的原子 `increment` 操作慢且有並發風險；`isVisible` 這種需要被列表查詢過濾的欄位放在 JSON body 裡無法建立資料庫索引
- 只做評價不做留言，縮小這次範圍 → 否決：兩者都是生產驗證過的既有功能，架構決策（走交易型表）完全相同，沒有理由分兩次做

### Decision: 評分摘要即時查詢，不快取進 Course model

`getCourseReviewSummary(courseId)` 對 `CourseReview` 表做 `AVG(rating)`／`COUNT(*)` 查詢，即時計算，不在 `Course` model 新增 `averageRating` 這類冗餘快取欄位。

Alternatives Considered:
- 在 `Course` model 新增 `averageRating`／`reviewCount` 快取欄位，每次新增評價時同步更新 → 否決：修改 `course-module` capability 的既有 `Course` model schema，超出這次 Plugin 新增的範圍且會產生跨 capability 的耦合；MVP 範圍內課程數量與評價數量都不大，即時查詢的效能可接受

## Implementation Contract

**Behavior:**
- 學員完成課程後可對課程評 1-5 星並留文字評價，每人每課只能評價一次
- 其他學員可對評價投「有用」或檢舉不當內容
- Operator 可隱藏個別評價、回覆評價、查看檢舉列表
- 學員可在單元下方留言（可選匿名顯示），operator 可標記已讀、軟刪除（保留真實身份供後台追蹤）

**Interface / data shape:**
- `getCourseReviewSummary(courseId: string): Promise<{ averageRating: number; reviewCount: number }>`

**DB DDL:**
```sql
CREATE TABLE "course_review" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "content" TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "helpfulCount" INTEGER NOT NULL DEFAULT 0,
  "replyContent" TEXT,
  "replyAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "courseId")
);
CREATE INDEX "course_review_courseId_idx" ON "course_review"("courseId");

CREATE TABLE "review_helpful" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewId" TEXT NOT NULL REFERENCES "course_review"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "reviewId")
);

CREATE TABLE "review_report" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewId" TEXT NOT NULL REFERENCES "course_review"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "reviewId")
);

CREATE TABLE "lesson_comment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "lessonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "lesson_comment_lessonId_createdAt_idx" ON "lesson_comment"("lessonId", "createdAt");
```

**Failure modes:**
- 重複評價同一課程 → 資料庫唯一鍵拒絕
- 重複投有用票／重複檢舉同一評價 → 資料庫唯一鍵拒絕（視為冪等，UI 顯示「已投票」而非錯誤）

**Acceptance criteria:**
- `pnpm --filter @startkiter/course-review test` 涵蓋 `getCourseReviewSummary` 計算正確性
- `pnpm type-check`／`pnpm build` 全綠
- `spectra validate course-review-plugin` 0 warnings

**Scope boundaries:**
- In scope：四個交易型 model；查詢函式；operator 管理頁；`MOUNT_POINTS` 新增 entry
- Out of scope：`course-module` 的 `Course` model schema 不修改；留言巢狀回覆；評價圖片附件

## Risks / Trade-offs

- [Risk] 匿名留言的真實 `userId` 仍存在資料庫裡，若查詢介面設計不當可能意外洩漏給非 operator 角色 → Mitigation: 前端顯示層依 `isAnonymous` 決定要不要顯示使用者名稱，`userId` 本身只在 operator 專用的管理介面才顯示真實身份
- [Risk] `helpfulCount` 是冗餘計數器，若投票寫入與計數器更新不是同一個 transaction，可能造成計數與實際 `ReviewHelpful` 記錄數不一致 → Mitigation: 投票與 `helpfulCount` 遞增放在同一個資料庫 transaction 內執行
