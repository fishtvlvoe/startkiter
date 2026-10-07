## Why

總管理員點左側「控制台」時，進到的是 `/admin/course/dashboard` 課程儀表板，只有 3 個課程數字，看不到整站狀況；而且系統把 `/admin/course/...` 判定為「課程」工作區，左側選單整套換成課程管理員選單，要點左下角「總管理員」才回得去。Fish 2026-10-07 確認設計稿 `~/Downloads/startkiter-dashboard-mockup.html`，要一個像 WordPress 的整站控制台。

## What Changes

- 新增整站控制台頁 `/admin/dashboard`：數字概況（近 30 天營收、近 30 天訂單、學員總數、上架課程）、待處理（未讀學員私訊、未讀課程留言、未回覆評價、近 7 天寄送失敗信件）、網站設定檢查（寄信、金流、電子發票、客服信箱、AI 助手）、最近 5 筆訂單、快速操作連結
- 修改左側「控制台」：改連到 `/admin/dashboard`；課程儀表板回到「課程」子選單，名稱「課程儀表板」
- 修改工作區判斷：總管理員在任何 `/admin/...` 頁面都維持總管理員選單；只有不是總管理員的課程管理員進入 `/admin/course/...` 才顯示課程專用選單
- 新增控制台資料彙整函式，只讀既有資料表與既有設定讀取函式
- 移除右下帳號選單的「課程管理員設定」：它連到的 `/admin/course/settings` 沒有頁面，正式站點了是 404

## Non-Goals

- 不做「比前 30 天多幾 %」這類期間對比（設計稿示意有，第一版先只顯示當期數字）
- 不新增任何資料表、欄位或通知機制；「未讀」「未回覆」以既有欄位判斷
- 不改課程儀表板頁面內容
- 不做控制台小工具拖曳排序或自訂
- 不改學員端選單
- 不處理另外發現、存在但不在選單裡的頁面：`/admin/course/invites`、`/admin/settings/newsletter`（另開 change）

## Capabilities

### New Capabilities

- `platform-admin-dashboard`: 總管理員整站控制台的內容、資料來源、空值與失敗顯示

### Modified Capabilities

- `admin-sidebar-sections`: 核心分區「控制台」改連 `/admin/dashboard`，課程子選單加回「課程儀表板」
- `role-based-workspace-navigation`: 總管理員在 `/admin/...` 一律使用總管理員工作區

## Impact

- Affected specs: `platform-admin-dashboard`（新）、`admin-sidebar-sections`、`role-based-workspace-navigation`
- Affected code: 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/dashboard/page.tsx`、新增 `packages/api/modules/admin/lib/platform-dashboard.ts`、`packages/platform/src/mount-points.ts`、`apps/saas/modules/shared/lib/nav-menu-items.ts`、`packages/i18n/translations/zh-tw/saas.json`、`packages/i18n/translations/zh-cn/saas.json`、`packages/i18n/translations/en/saas.json`
- Dependencies 新增：無
- 環境變數新增：無
- 資料庫：不變
