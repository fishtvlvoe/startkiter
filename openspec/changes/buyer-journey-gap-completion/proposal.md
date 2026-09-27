## Why

正式站已上架，但買家從「進教室」到「領到終身代碼、加入 LINE 學習群」這段路，畫面上沒有出口；課程首頁的課程清單跟教室大綱是兩套內容；課程管理員身份雖已正確顯示，卻沒有選單入口可以走到 `/admin/course`。三件事都是「後台能力已存在、畫面沒接上」或「畫面內容跟真實資料不同步」，不是新功能，屬於補齊上架路徑的缺口。

## What Changes

- 修正課程首頁（`/course`）改讀已發布課程的章節與單元樹，標題、順序、連結與官網課綱、教室大綱一致，不再讀寫死的 `listLessons()` 固定清單
- 課程管理員在 `/course`（學員視角）看到自己是課程管理員時，選單新增一條進入 `/admin/course` 課程工作室的入口；學員角色的選單維持現狀五項不變
- 結帳頁（已購買狀態）與課程頁新增「領取代碼包」按鈕，沿用既有 `POST /api/github/claim`、`GET /api/github/claim-status`，未達資格者不顯示可按按鈕
- `Course` 資料表新增 `lineInviteUrl` 欄位（每門課各自一個連結，不是全站共用一個環境變數），課程工作室（Course Studio）設定頁沿用既有課程更新路徑（`apps/saas/app/api/course/studio/route.ts`）新增這個欄位的存檔；只有對該課程有購買權限的學員，在該課程的課程頁看到這個連結，僅當值為 https 網址才顯示

## Non-Goals

- 不重畫官網、不改登入流程
- 不接 LINE Login 或任何 LINE 官方介面，只放一個對外連結
- 不做優惠券建立/停用、組合包與優惠券報表下載、站內通知發送（留待下一張 change）
- 不做正式站回滾演練、不做電子報自動寄信
- 不新增 GitHub claim 相關的新 API 端點，沿用既有端點；LINE 連結存檔沿用既有課程更新路徑，不另開一支新端點
- 不做「全站環境變數 `LINE_COMMUNITY_INVITE_URL`」這個舊方案；改為每門課各自的資料庫欄位

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-module`：新增「課程首頁必須與教室、官網共用同一份已發布課綱」的可觀察場景，修正目前 `/course` 讀取寫死清單導致三套內容不同步的問題
- `role-based-workspace-navigation`：新增「使用者在學員路由（`/course`）且實際角色為課程管理員時，選單提供進入課程工作室的入口；純學員角色不顯示此入口」的場景
- `github-kit-fulfillment`：新增「已購買且符合資格的使用者，在結帳頁或課程頁能看到可點擊的領取代碼包入口，不符資格則不顯示可按按鈕」的場景
- `line-learner-community`：改為「LINE 學習群連結是每門課各自的資料庫欄位，不是全站環境變數」；新增「課程管理員能在課程設定存入該課程的 LINE 連結；已購買該課程的學員在該課程頁看到可點擊連結，僅 https 網址才顯示」的場景

## Impact

- Affected specs：`course-module`、`role-based-workspace-navigation`、`github-kit-fulfillment`、`line-learner-community`
- Affected code：`apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx`、`apps/saas/app/(authenticated)/checkout/checkout-button.tsx`、`apps/saas/modules/shared/lib/nav-menu-items.ts`、`packages/platform/src/mount-points.ts`、`apps/saas/app/api/course/studio/route.ts`、`packages/database/prisma/schema.prisma`
- Dependencies 新增：無
- 環境變數新增：無；既有 `LINE_COMMUNITY_INVITE_URL` 這個方案在本次改動後不再使用
