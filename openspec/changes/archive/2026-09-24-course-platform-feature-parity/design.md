## Context

比對參考課程平台（`realms-course-platform-v1.8.0`，17 份 `docs/bdd/*.md` 行為規格）與 StartKiter 現況，確認 4 項功能缺口。資料庫層多半已預留欄位（`CourseInstructor`、`LessonPrivateMessage`、`QuizAttempt`），但業務邏輯與 UI 完全沒做。

## Goals / Non-Goals

**Goals:**

- 補齊課程儀表板、色票語意化、留言私訊拆分＋測驗成績、多講師管理 4 項功能
- `lesson-comments-dm-split` 與 `multi-instructor-management` 共用同一套課程權限判斷邏輯，避免重複實作

**Non-Goals:**

- 稽核日誌（AuditLog/ActivityLog）不在本次範圍
- 後台整體視覺風格重排版（Ghost 風格）不在本次範圍
- Vimeo 前後台完整性驗證另案處理

## Decisions

### 共用權限層優先於各功能獨立實作

`requireCourseManageAccess`、`manageableCourseWhereForUser` 這兩個權限 helper 先做，`lesson-comments-dm-split`（私訊需要判斷講師能看哪些學員私訊）與 `multi-instructor-management`（課程管理範圍本身）都依賴它，避免兩邊各寫一套邏輯造成行為不一致。

### 色票變數命名沿用參考專案慣例

`--heading`/`--body`/`--caption`/`--surface`/`--surface-hover`/`--divider` 沿用 `realms-course-platform-v1.8.0` 的 `docs/bdd/design-system-refactor.md` 命名，降低理解成本，不自創一套新命名。

## Implementation Contract

**Behavior：**

- 總管理員與講師登入後台，選單與可操作範圍依角色/課程授權動態顯示，講師看不到未授權課程與總管理員專屬功能
- 學員在播放頁能分別使用「留言」與「私訊老師」兩個獨立入口
- 講師/管理員能查看測驗成績列表、逐題對照、CSV 匯出
- 課程管理儀表板顯示範圍受權限限制的營運指標

**介面/資料形狀：**

- `requireCourseManageAccess(userId, courseId): Promise<void>`（無權限時 throw）
- `manageableCourseWhereForUser(userId): Prisma.CourseWhereInput`（給列表查詢用）
- `getQuizAttemptsForAdmin(courseId, lessonId): QuizAttemptSummary[]`
- `getQuizAttemptDetail(attemptId): QuizAttemptDetail`

**失敗模式：**

- 未授權呼叫課程管理 API → 403，不洩漏課程資料
- 講師嘗試修改他人角色 → 拒絕，僅 ADMIN 可操作角色欄位

**驗收標準：**

- 各 spec 檔案的 Scenario 逐一對應自動化測試（unit/integration）
- 講師跨課程存取的權限隔離要有負向測試（嘗試存取未授權課程應被拒絕）
- `pnpm build` 通過

**範圍邊界：**

- 只做本 proposal 列出的 4 項功能，不順手擴大到其他參考專案功能

## Risks / Trade-offs

- 多講師權限層改動範圍較大，涉及後台選單、API、優惠券等多處，需要完整回歸測試避免破壞現有單講師（目前隱含的總管理員全權）行為
- 私訊 Messenger 式重設計 UI 工作量較大，若時間有限可先做基本聚合清單，行內回覆列為快速迭代項
- 色票替換若遺漏檔案，可能造成視覺不一致；限定在本次已知的 5 個檔案範圍內，不做全站掃描
