# Code Review Report: `course-ai-batch-import`（Round 2）

- **Review Date**: 2026-08-30
- **Review Scope**: branch `fishtvlvoe/course-ai-batch-import`（含 fix commit `296e6f49`）
- **Review Mode**: Independent Round-2 Code-First Truth Verification（只讀審查，未改代碼）
- **Prior Round**: Round-1 報告 2 Critical + 2 High + 3 Medium；本輪驗證修法是否真的接上、有無引入新洞

---

## 審查摘要與評級總覽

| 等級 | 數量 | 說明 |
| :--- | :--- | :--- |
| **Critical** | 0 | Round-1 兩項 Critical 皆已 Confirmed Fixed；本輪未新發現 Critical |
| **High** | 0 | Round-1 兩項 High 皆已 Confirmed Fixed；本輪未新發現 High |
| **Medium** | 2 | 既有殘留／新發現：部分失敗 207 被 UI 當成功；可選 client `lesson.slug` 仍可撞 unique |
| **Low** | 2 | 測試名稱與實作語意不符；已登入但無權使用者仍會先 parse multipart body |

**Verdict**: Round-1 指定的 5 項修復目標全部 **Confirmed Fixed**。修法疊加後權限鏈無誤放行漏洞。可合入前建議處理下方 2 個 Medium，但不阻擋「指定修復已落地」的結論。

---

## Round-1 指定 5 項驗證（Code-First Truth）

### 1. `upload-video` 開頭身分驗證 → **Confirmed Fixed**

**檔案**：`apps/saas/app/api/course/batch-import/upload-video/route.ts`

實際執行順序（逐行）：

1. L11–12：`auth.api.getSession({ headers })`；`!session` → **401 UNAUTHORIZED**（立即 return）
2. L13 才 `request.formData()`
3. L16–21：`canManageCourse(...)`；失敗 → **403**
4. L22 才取 `file`；L30 才呼叫 `uploadVideoToBunny`

**繞過檢查**：

- 未登入路徑在讀取 multipart／Bunny 設定／上傳之前就 return；`route.test.ts` 亦斷言 401 時 `canManageCourse` 與 `uploadVideoToBunny` 皆未呼叫。
- 無法用「先丟檔案再補 session」繞過 handler 內邏輯：session 檢查在 `formData()` 之前。
- 附註（非 Critical）：框架層可能仍會先收 body；但 handler 不會把未授權請求轉送到 Bunny。這與 Round-1 Critical（未認證即可消耗 Bunny 配額）已切斷。

### 2. Lesson slug 隨機唯一後綴 → **Confirmed Fixed**

**檔案**：`create-curriculum/route.ts` L49、L67–69

```ts
slug: lesson.slug ?? generateLessonSlug(body.courseId)
// generateLessonSlug => `${courseId}-lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
```

**Prisma**：`packages/database/prisma/schema.prisma` `model Lesson` → `slug String @unique`（全域 unique，非 per-course）。

**重匯入**：預設路徑（前端 `confirmImport` 不傳 `slug`）每次寫入都帶 timestamp + 6 字元 base36 隨機後綴；同一門課重複匯入不再使用 Round-1 的固定 `${courseId}-${chapterIndex}-${lessonIndex}`。

**測試證據**：`create-curriculum/route.test.ts`「generates a unique slug for every lesson」斷言兩筆 slug 皆符合 `/^course-1-lesson-/` 且互異。

殘留風險見下方 New Medium（client 仍可自行傳 `slug`）。

### 3. `create-curriculum` 改用 `canManageCourse` → **Confirmed Fixed**

**檔案**：`create-curriculum/route.ts` L30–35

- 真實 import：`canManageCourse` from `course-instructor-access`；`isCourseOperator` from `course-operator`。
- 真實呼叫：`await canManageCourse({ userId: session.user.id, courseId: body.courseId, isOperator: isCourseOperator(...) })`。
- **不是**只改 import 卻仍寫 `if (!isOperator(...))`。

`canManageCourse` 本體（`course-instructor-access.ts`）：

- `isOperator === true` → 直接放行
- 否則查 `courseInstructor` composite unique `courseId_userId`；有指派才 true

被指派講師（非 ADMIN_EMAIL）可通過；未指派 → 403。

### 4. `BatchImportDialog` 渲染 `lesson.warnings` → **Confirmed Fixed**

**檔案**：`BatchImportDialog.tsx` L108

```tsx
{lesson.warnings.map((warning) => (
  <span ...>
    {warning === "MISSING_VIDEO" ? "缺少影片" : "缺少字幕/講義"}
  </span>
))}
```

**類型對照**：`folder-parser.ts` 的 `ParsedWarning = "MISSING_VIDEO" | "MISSING_NOTES_OR_SUBTITLE"`，僅此兩種；mapping 完整正確，無第三種會被誤標。

### 5. `admin/layout.tsx` 還原 `checkPermission(..., "admin.access")` → **Confirmed Fixed**

**檔案**：`admin/layout.tsx` L22

```ts
const isOperator = checkPermission({ user: session.user }, "admin.access");
```

**Git 證據**：

- `94c83111` 曾把全域判定改成 `isCourseOperator(...)`（Round-1 Medium #6）
- `296e6f49` 已還原為 `checkPermission`
- `git diff main...HEAD -- admin/layout.tsx` 僅註解換行差異；權限語意與 main 一致

`hasAnyCourseInstructorAssignment` 仍存在，但那是 main 既有講師後台入口模式，不是批次匯入那次「用 ADMIN_EMAIL 取代 admin.access」的權宜殘留。

---

## 疊加檢查：C-1 身分驗證 × H-3 canManageCourse

兩端點現況鏈：

1. `getSession` → 無 session → 401（硬停）
2. 解析 `courseId`
3. `canManageCourse({ isOperator: isCourseOperator(email, ADMIN_EMAIL) })` → false → 403
4. 才進行上傳／寫入

**有沒有「兩者都通過導致誤放行」？** 沒有。這是刻意的 OR：

- Operator（ADMIN_EMAIL）→ `canManageCourse` 早退 true（可管任何課）
- 非 operator → 必須有該課 `courseInstructor` 指派

兩者同時「通過」只發生在 operator；那本來就該放行，不是洞。

**前提挑戰**：`admin.access`（layout RBAC）與 `isCourseOperator`（API 用 ADMIN_EMAIL）本來就不是同一集合。這是課程模組既有模式（`studio`／`ai-notes` 同樣），不是這次修法新引入的邏輯漏洞。本輪不升級為 High。

---

## SRT 是否只在後端解析一次 → **Confirmed Fixed**

| 位置 | 行為 |
| :--- | :--- |
| `generateBatchLessonContent` | 傳 `await input.subtitle.text()`（raw SRT），**不再**呼叫 `srtToText` |
| `ai-notes/generate/route.ts` L94 | **唯一**執行路徑呼叫 `srtToText(srtContent)` |
| 全庫 `srtToText(` 呼叫點 | 僅後端 route + 單元測試 |

Round-1 Medium #5（前後端各濾一次）已消除。

---

## 本輪新發現／殘留

### 🟡 Medium

#### N1. `create-curriculum` 回 207 時，UI 當成功關閉
- **檔案**：`BatchImportDialog.tsx` L97–99；`create-curriculum/route.ts` L64
- **理由**：部分 lesson 失敗時 API 回 **207** + `failures[]`。`fetch` 的 `response.ok` 對 207 為 true，前端直接 `onImported?.()` + `onClose()`，講師看不到哪些單元沒寫進去。
- **判定**：New Issue（Medium）。非 Round-1 五項回歸，但影響「失敗可見性」。

#### N2. 可選 `lesson.slug` 仍信任客戶端
- **檔案**：`create-curriculum/route.ts` L49
- **理由**：預設路徑已安全；若呼叫端（或惡意客戶端）傳入固定 `slug`，仍可撞 `@unique`。Round-1 Critical 的「重複匯入」場景在官方 UI 已修好，但 server 未強制忽略／覆寫 client slug。
- **判定**：New Issue（Medium，防禦深度）。建議永遠 `generateLessonSlug`，或對 client slug 再加隨機後綴。

### 🟢 Low

#### N3. 並行控制測試名稱過時
- `concurrency-controller.test.ts` 仍名為「converts SRT to plain text…」，斷言卻是 raw SRT 直通。易誤導後續維護。

#### N4. 已登入無權使用者仍會先 `formData()`
- session 通過後、`canManageCourse` 之前就 parse multipart。無法未授權打 Bunny，但可對已登入帳號做較大的 body 解析成本。屬殘留資源面，非身分繞過。

### Round-1 其餘項目狀態（順便確認）

| Round-1 | 狀態 |
| :--- | :--- |
| Medium #5 SRT 雙重解析 | Confirmed Fixed |
| Medium #6 layout 權宜改 operator | Confirmed Fixed |
| Medium #7 單元標題編輯／跳過 | Confirmed Fixed（現有 input + `enabled` checkbox） |
| Low #8 相對路徑 import | Confirmed Fixed（改 `@startkiter/platform`） |
| Low #9 2GB buffer | 仍在（未修；可接受延後） |

---

## 實跑驗證（本 session 親自執行，非抄 commit message）

指令：`pnpm --filter platform --filter api --filter saas test`（需載入 root `.env` 的 `DATABASE_URL`；未載入時 `api` 會因 `assignment-lifecycle.test.ts` 炸 suite）

| Package | Test Files | Tests | 結果 |
| :--- | ---: | ---: | :--- |
| `@startkiter/platform` | 19 | 93 | passed |
| `@startkiter/api` | 52 | 230 | passed |
| `@startkiter/saas` | 45 | 221 | passed |
| **合計** | **116** | **544** | **全部通過** |

Type-check：`pnpm --filter platform --filter api --filter saas type-check` → **全部通過**（saas：`next typegen && tsc --noEmit`）。

相關單測補強（fix commit 內）：`upload-video/route.test.ts`（401／403）、`create-curriculum/route.test.ts`（unique slug）均包含在上述 saas 221 內。

---

## 最終判定表（Round-1 五項 + 疊加）

| # | 檢查項 | 判定 |
| :--- | :--- | :--- |
| 1 | upload-video 開頭 `getSession`／401／不可繞過 | **Confirmed Fixed** |
| 2 | Lesson slug 隨機後綴 + Prisma `@unique` | **Confirmed Fixed** |
| 3 | create-curriculum 真用 `canManageCourse` | **Confirmed Fixed** |
| 4 | UI 渲染 warnings 且文案對應類型 | **Confirmed Fixed** |
| 5 | admin layout 還原 `checkPermission("admin.access")` | **Confirmed Fixed** |
| — | C-1 × H-3 權限疊加漏洞 | **無誤放行漏洞** |
| — | SRT 只後端解析一次 | **Confirmed Fixed** |
| N1 | 207 partial failure UI | **New Issue (Medium)** |
| N2 | client-supplied slug | **New Issue (Medium)** |

**總結一句**：指定修的洞都真的接上了；剩下是部分失敗回報與 slug 防禦深度，不是 Round-1 Critical／High 沒修好。
