## Why

正式站平台後台左側選單把 12 個項目平鋪在「管理」一組：5 個設定頁沒有收合、課程底下 11 個子頁完全看不到，跟當初 demo（`docs/demo/course-admin-studio-demo.html`）的「分組 + 可展開子選單」差很多。Fish 已於 2026-10-07 確認設計稿 `~/Downloads/startkiter-sidebar-mockup.html` 右側的樣子。

## What Changes

- 新增平台選單分區：核心、內容、會員與行銷、營收、系統五個分區，各自有可收合的分區標題，取代目前單一「管理」區
- 新增「系統設定」上層項目（路由 `/admin/settings`），把 Email 設定、金流設定、發票設定、Gemini 設定、AI 助手模型收進它的子選單
- 修改平台後台的「課程」：帶出既有的 10 個課程子頁（測驗、作業、評價與留言、留言、私訊、優惠券、綁定包、新生問卷、媒體庫、CoursePack 任務）成為子選單，並在子選單第一項提供「課程列表」
- 修改平台工作區的導覽解析：課程等 App 項目在平台後台也帶出子選單（目前刻意不帶）
- 修改有子選單的項目：點一下展開／收合，目前所在頁面屬於它時自動展開；課程儀表板改放在「核心」分區，名稱顯示為「控制台」
- 修改手機底部「更多」：子選單項目也列出來，不會因為收進上層而在手機上找不到

## Non-Goals

- 不新增 demo 裡的「主機」「外掛」頁面（Fish 2026-10-07 選 A）
- 不改任何頁面內容，只改選單
- 不改使用者自建分組（拖曳、新增分組、改名）的既有行為；使用者自建分組仍優先於預設分區
- 不改學員端（課程區 `/course`）選單
- 不改 `/admin/settings` 頁面本身

## Capabilities

### New Capabilities

- `admin-sidebar-sections`: 平台後台側邊欄依預設分區顯示、分區可收合、有子選單的項目可展開收合，手機「更多」包含子選單項目

### Modified Capabilities

- `role-based-workspace-navigation`: 平台工作區解析 App 根項目時帶出其子選單

## Impact

- Affected specs: `admin-sidebar-sections`（新）、`role-based-workspace-navigation`
- Affected code: `packages/platform/src/mount-points.ts`、`packages/platform/src/types.ts`、`packages/platform/src/workspace/navigation.ts`、`apps/saas/modules/shared/lib/nav-menu-items.ts`、`apps/saas/modules/shared/components/NavBar.tsx`、`packages/i18n/translations/zh-tw/saas.json`、`packages/i18n/translations/zh-cn/saas.json`、`packages/i18n/translations/en/saas.json`
- Dependencies 新增：無
- 環境變數新增：無
- 資料庫：不變（使用者自建分組沿用既有資料表）
