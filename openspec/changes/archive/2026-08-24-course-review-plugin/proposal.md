## Why

StartKiter 沒有評價/評論機制，買家的課程頁面缺乏社會證明（星等、學員評價）跟課程內單元的問答互動（留言）。woomin 的 `CourseReview`／`ReviewHelpful`／`ReviewReport`／`LessonComment` 四個 model 是完整生產驗證過的功能。這四個 model 跟 `course-quiz-plugin`／`course-assignment-plugin` 不同：沒有「operator 預先定義的內容模板」這一層，評價與留言本身就是使用者直接產生的最終資料（UGC），不適合塞進共用 `PluginContent` 表（那張表的 `title`／`body` 欄位形狀是為「創作者編寫的內容」設計的，評分/投票/檢舉這類結構化程度高、需要複雜查詢的資料放進 JSON body 效能與查詢複雜度都不理想），這次全部走交易型獨立表。

## What Changes

- 新增 `course-review` Plugin：業務邏輯放 `packages/course-review/`，在 `MOUNT_POINTS` 新增 manifest entry：`dataSpec: "none"`（沒有 content-type 的定義層，只有交易型資料）、`mount.route: { path: "/review-admin" }`（operator 查看檢舉列表、管理留言已讀/軟刪除）、`mount.menu: { label: "評價與留言管理", icon: "message-square", order: 6, requiresOperator: true }`；不宣告 `mount.content`——評價/留言是嵌入在既有課程頁面裡顯示的元件，不是獨立的訪客瀏覽路由，買家自行在課程頁面引入 `packages/course-review` 匯出的顯示元件
- 新增四個交易型 Prisma model：`CourseReview`（星等 1-5、文字評價、`@@unique([userId, courseId])` 一位學員對一門課只能評價一次、老師回覆、`isVisible` 隱藏開關）、`ReviewHelpful`（有用投票，`@@unique([userId, reviewId])`）、`ReviewReport`（檢舉，`@@unique([userId, reviewId])`）、`LessonComment`（單元留言，支援匿名顯示但後台保留真實 `userId`，管理者已讀狀態，軟刪除）
- 提供查詢函式 `getCourseReviewSummary(courseId)`（平均分數、總數，即時計算不快取進 `Course` model，避免修改 `course-module` 既有 schema）供買家自行在課程頁面顯示

## Non-Goals

- 不修改 `course-module` capability 的既有 `Course` model 新增平均分數快取欄位，即時查詢即可，MVP 範圍內評價數量不會大到需要快取優化
- 不做評價/留言的內容審核 AI 過濾，只做基本的檢舉機制供 operator 人工處理
- 不做留言的巢狀回覆（threading），只做單層留言
- 不做評價的圖片/影片附件

## Capabilities

### New Capabilities

- `course-review-plugin`：課程評價與單元留言

## Impact

- Affected specs: `course-review-plugin`（新增）
- Affected code：
  - New:
    - `packages/course-review/index.ts`
    - `packages/course-review/package.json`
    - `packages/course-review/tsconfig.json`
    - `packages/course-review/review-summary.ts`
    - `packages/course-review/review-summary.test.ts`
    - `packages/api/modules/review/router.ts`
    - `packages/api/modules/review/router.test.ts`
    - `packages/database/prisma/migrations/`（新增 `CourseReview`／`ReviewHelpful`／`ReviewReport`／`LessonComment` 四個 model migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`
    - `packages/platform/src/mount-points.ts`（新增 Review Plugin 的 manifest entry）
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
