## Why

比對參考課程平台（`realms-course-platform-v1.8.0`，`docs/bdd/*.md` 17 份行為規格）與 StartKiter 現況後，確認以下 4 項功能參考平台已有、StartKiter 完全或部分缺少，且 Fish 已明確要求全部一起做：

1. **課程儀表板重構**（course-dashboard-restructure）— StartKiter 無獨立 dashboard 頁面
2. **設計系統色票語意化**（design-system-refactor）— StartKiter 無 `text-heading`/`text-body`/`text-caption` 等語意化色票；已知 5 個檔案（`admin/course/page.tsx`、`classroom-client.tsx`、`lesson-tool-embed.tsx`、`course-review-panel.tsx`、`MediaPicker.tsx`）寫死深色文字顏色，在淺色主題下對比不足
3. **留言/私訊拆分 + 測驗成績查看**（comments-dm-split-and-quiz-results）— 資料庫已有 `LessonComment`、`LessonPrivateMessage`、`QuizAttempt` 三個 model，但前後台未拆分展示，也完全沒有測驗成績查看功能
4. **多講師系統**（multi-instructor-system）— 資料庫已有 `CourseInstructor` model，但無管理畫面、無角色分頁、無權限檢查（講師目前理論上可看到不該看的後台功能）

## What Changes

### 1. 課程儀表板重構
- 新增獨立課程管理儀表板頁面（彙總課程數量、學員數、營收概況等既有可用資料，不新增資料來源）

### 2. 設計系統色票語意化
- `globals.css`（或對應樣式進入點）新增語意化 CSS 變數：`--heading`、`--body`、`--caption`、`--surface`、`--surface-hover`、`--divider`（參考 `realms-course-platform-v1.8.0` 的命名慣例）
- 淺色/深色模式各自定義變數值
- 5 個已知檔案的寫死深色類別（`text-neutral-*` 等）替換為語意化 class

### 3. 留言/私訊拆分 + 測驗成績查看
- 前台播放頁拆出獨立「私訊老師」入口，與現有課程留言分開
- 後台拆成「課程留言」「學員私訊」兩個獨立路由/頁面；私訊頁改為 Messenger 式介面（聚合清單、未讀狀態、行內回覆）
- 新增測驗成績查看：`getQuizAttemptsForAdmin`、`getQuizAttemptDetail` server action + 後台頁面（成績列表、逐題對照、CSV 匯出）

### 4. 多講師系統
- 用戶管理頁升級：新增角色分頁（全部/學員/講師/管理員）、講師角色指派 UI
- 課程資訊頁新增「講師管理權限」區塊（可多選講師，未指定時預設所有講師可管）
- 新增共用權限 helper：`requireCourseManageAccess`、`manageableCourseWhereForUser`
- 後台選單依角色隱藏：講師預設看不到銷售分析、系統設定、隱私權、服務條款、組合包等 5 項總管理員專屬功能
- 優惠券管理權限依講師角色隔離
- 使用者角色修改僅限總管理員（講師無法變更他人角色）

## Non-Goals

- 不包含稽核日誌（AuditLog/ActivityLog）— 這是參考平台規格提到的附加項，StartKiter 目前無此基礎設施，列為未來獨立需求，不在本次範圍
- 不重做整個後台視覺風格（Ghost 風格重排版是另一份規格 `settings-redesign-ghost-style`，StartKiter 已有基礎後台設定頁，不在本次強制範圍）
- 不處理 Vimeo 影片提供商前後台完整性驗證（資料庫層已支援，UI 完整度另案處理）

## Capabilities

### New Capabilities

- `course-dashboard`: 課程管理儀表板頁面，彙總既有課程/學員/營收資料
- `lesson-comments-dm-split`: 課程留言與學員私訊前後台獨立展示，私訊改為 Messenger 式介面
- `quiz-results-review`: 講師/管理員查看測驗成績（列表、逐題對照、CSV 匯出）
- `multi-instructor-management`: 多講師角色管理、課程講師授權、講師權限隔離

### Modified Capabilities

- `design-tokens`: 新增語意化色票變數系統，既有硬編碼深色類別改用語意化 class（不改變視覺結果，僅改變實作方式，除了修正已知的淺色主題對比度問題）

## Impact

- **資料庫**：需新增權限相關欄位/表（多講師課程授權範圍，若現有 `CourseInstructor` 欄位不足）；不涉及既有表的破壞性遷移
- **前端**：`apps/saas/modules/course/*`、`apps/saas/app/(authenticated)/(main)/(account)/admin/*`、`apps/saas/app/(authenticated)/(operator)/*`、`apps/saas/modules/shared/*`（NavBar 選單依角色隱藏項目）
- **後端**：`packages/api/modules/course/*` 新增 server action；新增或擴充 `packages/permissions/` 權限 helper
- **共用邏輯**：`lesson-comments-dm-split` 與 `multi-instructor-management` 共用同一套課程權限判斷邏輯（`manageableCourseWhereForUser`），需同批規劃避免重複實作
