## Summary

修正總控制台與 10/7 對焦稿 `~/Downloads/startkiter-dashboard-mockup.html` 的 3 個差異：快速操作補「新增單元」並讓「新增課程」「新增單元」點了直接開視窗、控制台頁移除重複的外層標題、手機版數字卡片的金額不再斷行。

## Motivation

10/8 正式站巡查（截圖 `~/Downloads/startkiter-dashboard-check/`）發現：快速操作少了稿上的「新增單元」，且「新增課程」只連到課程頁、還要再按一次按鈕；控制台頁上方同時有「後台管理」與「控制台」兩層標題；390px 手機寬度下「NT$ 8,830」被擠成兩行。

## Proposed Solution

- 新增：課程頁 `/admin/course` 支援網址參數 `?action=new-course` 與 `?action=new-lesson`，載入完成後自動開啟對應視窗，開啟後把參數從網址拿掉
- 修改：控制台快速操作「新增課程」改連 `/admin/course?action=new-course`，並新增「新增單元」連到 `/admin/course?action=new-lesson`
- 修改：admin layout 的「後台管理／管理你的應用程式」標題在 `/admin/dashboard` 不顯示，其他後台頁維持原樣
- 修改：控制台頁在手機寬度縮小外層邊距與數字字級，金額不換行

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `platform-admin-dashboard`: 新增快速操作、單一頁面標題、手機數字一行顯示三項需求

## Non-Goals

- 不改其他後台頁的「後台管理」標題
- 新增單元視窗不加「選擇章節」下拉；固定加到第一門課的最後一個章節，視窗內寫明加到哪裡
- 不改課程頁其他行為、不改 API、不新增資料表
- 不做設計稿上「比前 30 天多 12%」期間對比（沿用上一張 change 的決定）

## Alternatives Considered

- 「新增單元」只連到課程頁：功能和「新增課程」重複，Fish 10/8 選擇直接開視窗
- 把 PageHeader 從 admin layout 整個拿掉：會影響全部後台頁，範圍過大

## Impact

- Affected specs: `platform-admin-dashboard`
- Affected code:
  - Modified: apps/saas/app/(authenticated)/(main)/(account)/admin/dashboard/page.tsx、apps/saas/app/(authenticated)/(main)/(account)/admin/dashboard/page.test.tsx、apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx、apps/saas/app/(authenticated)/(main)/(account)/admin/layout.test.ts、apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - New: apps/saas/modules/shared/components/AdminLayoutHeader.tsx、apps/saas/app/(authenticated)/(main)/(account)/admin/course/studio-quick-action.ts、apps/saas/app/(authenticated)/(main)/(account)/admin/course/studio-quick-action.test.ts
  - Removed: 無
- Dependencies 新增：無
- 環境變數新增：無
