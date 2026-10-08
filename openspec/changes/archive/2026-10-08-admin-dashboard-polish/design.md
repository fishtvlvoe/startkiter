## Context

`platform-admin-dashboard`（10/7 封存）已上線。10/8 對照設計稿 `~/Downloads/startkiter-dashboard-mockup.html` 巡查正式站（截圖 `~/Downloads/startkiter-dashboard-check/desktop.png`、`mobile.png`、`course-page.png`），有 3 個差異：

- 快速操作只有 4 個按鈕，少了「新增單元」。新增課程和新增單元目前都是課程頁 `/admin/course` 裡的 Dialog，由 `showCreateCourseDialog`、`showCreateLessonDialog` 這兩個 state 控制。開「新增單元」視窗前要先呼叫 `handleCreateLesson(chapterId)` 指定章節
- 「後台管理／管理你的應用程式」這行標題來自 admin `layout.tsx` 的 `PageHeader`，所有後台頁共用；控制台頁自己又有一個 `控制台` 標題
- 控制台頁的 `<main>` 用 `p-6`，外層 `AppWrapper` 也有邊距。390px 寬時 KPI 每張卡只剩約 139px 內容寬（估計值，計算方式是 (390 − 外層邊距 − p-6×2 − gap) ÷ 2 − 卡片 p-4×2，以 mobile.png 量測確認），`text-2xl` 的 `NT$ 8,830` 因此斷成兩行

## Goals / Non-Goals

**Goals:**

- 從控制台點「新增課程」「新增單元」，到課程頁時對應視窗已經開好
- 控制台只剩一層標題
- 390px 手機寬度下，金額在 `NT$ 999,999` 以內不換行

**Non-Goals:**

- 不改其他後台頁的標題
- 新增單元視窗不加章節下拉選單
- 不改課程頁 API（`/api/course/studio`）和資料表
- 不做期間對比 %

## Decisions

### 用網址參數 `?action=` 觸發課程頁的視窗

控制台是 server component，課程頁是 client component，兩邊不共用 state，所以用網址參數傳遞要開哪個視窗。課程頁在 `loadStudio()` 拿到課程資料之後才讀參數，因為新增單元需要知道章節。開完視窗後用 `router.replace("/admin/course")` 把參數清掉，重新整理頁面時視窗就不會再自己跳出來。

判斷要開哪個視窗的邏輯抽成純函式 `resolveStudioQuickAction(action, courses)`，放在 `admin/course/studio-quick-action.ts`，這樣不用 render 整個課程頁就能測試。

Alternatives Considered:
- 另做獨立的「新增單元」頁面：要重寫一份新增單元的表單，和課程頁的 Dialog 重複，否決
- 用 localStorage 傳旗標：跨分頁會殘留，也沒辦法從連結直接分享，否決

### 新增單元固定加到第一門課的最後一個章節

課程頁本來就預設選第一門課（`loadStudio` 裡的 `data.courses[0]`），單元通常也是往最新的章節加，所以挑 `order` 最大的章節。視窗的說明文字寫成「加到「<課程名>／<章節名>」」，讓使用者知道新單元會加在哪裡。

Alternatives Considered:
- 在視窗裡加章節下拉：多一個表單元件和驗證，超出這次「補按鈕」的範圍，否決
- 加到第一個章節：新單元通常不屬於第一章，否決

### 用 client 元件依網址決定要不要顯示 admin 標題

新增 `AdminLayoutHeader`（`"use client"`），用 `usePathname()` 判斷：路徑是 `/admin/dashboard` 就回傳 `null`，其他路徑照常 render `PageHeader`。admin `layout.tsx` 改成用這個元件。

Alternatives Considered:
- 把 PageHeader 從 layout 拿掉，改由每一頁自己放：要改 20 幾個後台頁，否決
- 在 layout 用 `headers()` 讀路徑：Next.js 的 layout 拿不到穩定的 pathname，否決

### 手機版縮小邊距與字級

控制台 `<main>` 改成 `px-0 py-2 sm:p-6`。KPI 數字改成 `text-xl sm:text-2xl whitespace-nowrap`。桌面版（640px 以上）維持原本的樣子。

Alternatives Considered:
- 手機版改成一列一張卡：原本 4 張卡要多捲一倍的高度，否決
- 只加 `whitespace-nowrap`：數字會撐破卡片、出現橫向捲動，否決

## Implementation Contract

**Behavior:**

- 控制台快速操作依序是：新增課程、新增單元、寫電子報、建立優惠券、查看前台
- 點「新增課程」：進入 `/admin/course`，新增課程視窗已開
- 點「新增單元」：新增單元視窗已開，說明文字寫出要加到的課程和章節
- 沒有章節時：顯示錯誤提示 `請先新增章節，再新增單元`
- 沒有課程時：顯示錯誤提示 `請先新增課程，再新增單元`
- 以上視窗開完後，網址列變回 `/admin/course`
- `/admin/dashboard` 不顯示「後台管理」，其他 `/admin/...` 頁照常顯示

**Interface:**

```ts
type StudioQuickActionResult =
  | { type: "none" }
  | { type: "open-course-dialog" }
  | { type: "open-lesson-dialog"; courseId: string; chapterId: string; courseTitle: string; chapterTitle: string }
  | { type: "error"; message: string };

function resolveStudioQuickAction(
  action: string | null,
  courses: Array<{ id: string; title: string; chapters: Array<{ id: string; title: string; order: number }> }>,
): StudioQuickActionResult;
```

**Failure modes:** `action` 不是 `new-course` 或 `new-lesson`（包含沒帶參數）時回傳 `none`，畫面上沒有任何提示。課程資料載入失敗時，沿用課程頁原本的錯誤提示，不另外處理 `action`。

**Acceptance criteria:**

- `studio-quick-action.test.ts` 涵蓋 spec 裡 Action resolution 表格的 6 列
- `dashboard/page.test.tsx` 確認快速操作的順序和兩個 href、確認 KPI 數字有 `whitespace-nowrap`
- `layout.test.ts` 確認 layout 用的是 `AdminLayoutHeader`；`AdminLayoutHeader` 在 `/admin/dashboard` 回傳 null，在 `/admin/course/dashboard` 有 render 出標題
- 正式站用 ego-browser 檢查：在 390px 和 1440px 寬度下截圖 `/admin/dashboard`；390px 時 `scrollWidth === 390`；點兩個快速操作按鈕，各截一張視窗已開的圖

**Scope:** 只改 Impact 段列出的檔案。

## Risks / Trade-offs

- [Risk] 課程頁原本的 `loadStudio` 會預設選 `courses[0]`，如果之後改成記住上次選的課，新增單元的目標課程會跟畫面上選的課不一致 → Mitigation：`resolveStudioQuickAction` 的輸入直接用 `loadStudio` 拿到的同一份 courses，並在 tasks 註明這個相依關係
- [Risk] 課程管理員（不是總管理員）的 courses 只有自己負責的課 → 這是預期行為，課程管理員看不到控制台，這條路徑只有總管理員會走
- [Trade-off] 新增單元不能選章節，要加到別的章節得關掉視窗、手動從章節旁邊的按鈕新增

## Migration Plan

部署：照一般 git push 走 auto-deploy，不需要資料遷移。回滾：revert 這張 change 的 commit 再重新部署即可。
