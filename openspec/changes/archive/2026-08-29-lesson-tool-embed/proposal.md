## Why

講師目前無法把外部互動工具安全地嵌入某一堂課的內容裡（例如線上白板、練習題網站、模擬器）。學員只能看影片跟文字，沒有辦法在同一個畫面互動操作外部工具。參考 WooMin（另一個課程平台）已驗證過的做法：每堂課可設定一個工具網址，用短效簽章通行證保護，避免未購課的人繞過授權直接拿到工具真實網址。

## What Changes

- `Lesson` model 新增 `toolUrl`、`toolTitle` 兩個可選欄位，供講師設定這堂課要內嵌的外部工具
- 新增講師端設定介面：在既有課程管理後台（`admin/course/page.tsx`）的單元編輯區塊，新增「內嵌工具」欄位（網址 + 標題），只有該課程的講師/操作員能設定，並顯示「這是外部工具，請確認來源可信」提示
- 新增短效簽章通行證機制：學員看課時，伺服器現場簽發一組 HMAC-SHA256 通行證（沿用既有 `BETTER_AUTH_SECRET` + 版本前綴 + `timingSafeEqual` 驗證模式，比照 `packages/api/modules/course/procedures/lesson-message-upload.ts` 既有慣例），效期 2 小時，綁定 `lessonId` + `userId`
- 新增代理／新分頁進入頁：`/lesson-tool/[lessonId]/[encodedOrigin]`，即使是分享出去的連結，開啟時也要重新呼叫既有課程存取判斷（購課/講師範圍），不因為連結本身就永久放行
- 新增內嵌工具白名單保護：伺服器端解析工具網址時，拒絕內網／localhost／私有 IP 範圍的網址，防止被用來探測內部服務
- 修改學員看課頁面（`packages/course` 播放器內容區）：有設定 `toolUrl` 的單元，內容區顯示 sandboxed iframe（`sandbox="allow-scripts allow-forms allow-popups allow-downloads"`），跟現有影片/文字內容並列

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `lesson-tool-embed`: 講師為單一課程單元設定外部互動工具網址，學員在安全的沙盒環境內存取，涵蓋通行證簽發驗證、SSRF 防護、新分頁重新授權

### Modified Capabilities

（無：設定權限檢查直接呼叫既有講師範圍判斷函式，不改動該函式本身的需求行為）

## Impact

- Affected specs: New: `lesson-tool-embed`
- Affected code:
  - New:
    - `packages/platform/src/lesson-tool/token.ts`（簽發/驗證 HMAC 通行證）
    - `packages/platform/src/lesson-tool/url-safety.ts`（工具網址 SSRF 黑名單檢查）
    - `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx`（新分頁進入頁）
    - `apps/saas/app/api/lesson-tool/config/route.ts`（講師設定 toolUrl/toolTitle 的 API）
  - Modified:
    - `packages/database/prisma/schema.prisma`（Lesson 新增 `toolUrl`、`toolTitle`）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（新增內嵌工具設定欄位）
    - `packages/course/src/mdx/LessonMdx.tsx` 或既有播放內容元件（新增 sandboxed iframe 顯示區塊）
    - `packages/api/modules/course/lib/course-instructor-access.ts`（沿用既有函式做設定權限檢查，不需改函式本身，僅新增呼叫點）
  - Removed: 無
