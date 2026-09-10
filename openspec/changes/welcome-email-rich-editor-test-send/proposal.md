## Why

營運者在「課程郵件設定」頁編輯歡迎信時，只能用 Markdown 原始語法文字框撰寫，且頁面上沒有任何「寄測試信」的入口，完全無法在正式寄出前確認版面與內容。realms-course-platform 已有一套成熟的 BlockNote 所見即所得編輯器與 email 渲染管线可參照移植，營運者明確要求相同的編輯體驗。

## What Changes

- 新增 `CourseWelcomeEmail.contentJson` 欄位（Prisma schema + migration），以 BlockNote 區塊 JSON 儲存所見即所得內容；既有 `markdownTemplate` 欄位保留作為舊資料 fallback
- 修改信件渲染管线（packages/mail/lib/course-lifecycle.ts）：優先由區塊 JSON 渲染 email 相容 HTML（600px 表格排版、inline style、HTML 消毒，參照 realms lib/newsletter/render.ts），同時產生純文字版本；無 contentJson 的舊資料維持既有 Markdown 渲染
- 新增 orpc procedure `course.sendWelcomeEmailTest`：以範例變數值（測試學員姓名、課程標題、課程網址）渲染目前模板並寄到指定信箱，回傳成功/失敗與錯誤訊息
- 修改 EmailSettingsPanel.tsx：Markdown 文字框換成 BlockNote 所見即所得編輯器（標題、粗斜體、清單、引用、連結、CTA 按鈕區塊），並新增「寄測試信」按鈕，按下後顯示寄出中／已寄出／失敗原因，寄送期間鎖定按鈕
- 變數插值（{{userName}}、{{courseName}}、{{courseUrl}}）改在渲染後的 HTML 與純文字上進行，維持現有跳脫規則

## Non-Goals (optional)

- 不做 realms 電子報的課程卡、優惠券自訂區塊（歡迎信範圍只需要文字排版與 CTA 按鈕）
- 不做電子報的行銷功能（名單 segments、開信追蹤、排程發送、退訂連結）
- 不搬移 realms 的 BlockNote 元件原始碼以外的 newsletter 模組（audience、consent、unsubscribe 等）
- 不強制遷移既有 Markdown 資料到 BlockNote JSON；舊資料維持 Markdown 渲染直到營運者用編輯器重存
- 不動到期提醒信（EXPIRATION_REMINDER）的模板編輯方式

## Capabilities

### New Capabilities

- `welcome-email-rich-editor`: 課程歡迎信的所見即所得編輯、區塊 JSON 儲存、email 相容 HTML 與純文字渲染（含消毒與變數插值）
- `welcome-email-test-send`: 在後台對指定信箱寄出測試歡迎信，並在 UI 顯示寄出中／成功／失敗回饋

### Modified Capabilities

- `course-lifecycle-email`: 歡迎信內容來源改為「有 contentJson 用區塊渲染、否則用既有 Markdown」，且新增測試寄送為支援的操作

## Impact

- Affected specs: `welcome-email-rich-editor`（新增）、`welcome-email-test-send`（新增）、`course-lifecycle-email`（修改）
- Affected code:
  - New: packages/mail/lib/welcome-email-render.ts（區塊 JSON → email HTML/純文字 + 消毒）
  - New: apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/welcome-email-composer.tsx（BlockNote 編輯器元件）
  - New: packages/api/modules/course/procedures/send-welcome-email-test.ts（測試寄送 procedure）
  - New: packages/database/prisma/migrations/<timestamp>_add_welcome_email_content_json/migration.sql
  - Modified: packages/database/prisma/schema.prisma（CourseWelcomeEmail 加 contentJson 欄位）
  - Modified: packages/api/modules/course/procedures/update-welcome-email-settings.ts（接受並儲存 contentJson）
  - Modified: packages/api/modules/course/router.ts（註冊 sendWelcomeEmailTest）
  - Modified: packages/mail/lib/course-lifecycle.ts（渲染來源分流：contentJson 優先、Markdown fallback）
  - Modified: apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx（換編輯器、加測試寄送按鈕與狀態回饋）
  - Modified: packages/mail/lib/course-lifecycle.test.ts 與相關 api 測試（新渲染與測試寄送案例）
- Dependencies 新增: @blocknote/core、@blocknote/react、@blocknote/mantine（對齊 realms 版本 0.51.4）、@mantine/core（BlockNote 樣式宿主）；HTML 消毒沿用 realms 的正則式 sanitizeEmailHtml 手法，不新增套件
- 環境變數新增: 無（沿用現有寄信 provider 設定）
