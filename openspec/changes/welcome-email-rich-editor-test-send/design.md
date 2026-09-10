## Context

「課程郵件設定」頁（EmailSettingsPanel）目前是 Markdown 文字框 + 送達紀錄。歡迎信寄送管线現況：orpc `course.updateWelcomeEmailSettings` 存 `CourseWelcomeEmail.subjectTemplate` / `markdownTemplate`；寄出時 `renderCourseWelcomeEmail` 把 markdown 交給 react-email 的 CourseWelcome 元件渲染 HTML 與純文字。營運者（Fish）明确要求 realms-course-platform-v1.8.0 那套 BlockNote 編輯體驗，且 hua-ai 專案已發生過「按寄信沒有任何回饋」的實際客訴，測試寄送的可見回饋是硬性需求。

參照來源（只讀，禁止改來源 repo）：
- 來源 /Users/fishtv/Development/E-共用工具與開發底座/realms-course-platform-v1.8.0/components/admin/newsletter/blocknote-newsletter-composer.tsx → 目標 apps/saas 的 welcome-email-composer.tsx
- 來源 realms lib/newsletter/render.ts（blocks → 600px 表格 HTML + sanitizeEmailHtml 正則消毒 + assertHtmlSize）→ 目標 packages/mail/lib/welcome-email-render.ts

## Goals / Non-Goals

**Goals:**

- 營運者在後台用所見即所得編輯器撰寫歡迎信（標題、粗斜體、清單、引用、連結、CTA 按鈕），完全不接觸 Markdown/HTML 語法
- 編輯結果渲染成 email 客戶端相容的 HTML（table 排版、inline style、消毒）並附純文字版本
- 營運者能對任意信箱寄測試信，且 UI 明確顯示寄出中／已寄出／失敗原因
- 既有 Markdown 資料不中斷寄送（fallback 渲染）

**Non-Goals:**

- 課程卡、優惠券等行銷自訂區塊；segments、開信追蹤、退訂、排程
- 既有 Markdown 資料的批次遷移（留待營運者重存時自然轉換）
- 到期提醒信模板編輯改版
- 多語系編輯器介面（編輯器 UI 沿用繁中，與 realms 一致）

## Decisions

### 編輯器採用 BlockNote（@blocknote/core + react + mantine 0.51.4）

參照 realms 的 blocknote-newsletter-composer.tsx 實作簡化版（default block specs + 自訂 CTA button block），zhTW locale。

- **Alternatives Considered:**
  - Milkdown（realms 課程內容所用）：markdown 雙向轉換可零改 DB，但編輯體驗與營運者記憶中的 realms 電子報編輯器不同，且未來要加課程卡等自訂區塊時要重選型。否決。
  - 維持 Markdown 文字框 + 即時預覽分欄：營運者仍須學 Markdown 語法，不符合「用一般文字撰寫」的核心訴求。否決。
  - TipTap：功能足但本專案無既有資產，realms 已驗證 BlockNote 的繁中與 email 場景，直接沿用既有做法風險最低。否決。

### 儲存格式：新增 contentJson 欄位存 BlockNote 區塊 JSON，markdownTemplate 保留為 fallback

- **Alternatives Considered:**
  - 只存渲染後 HTML：儲存即固化版面，後續改版模板樣式時舊信無法跟上，且 HTML 消毒責任前移到寫入端。否決。
  - 維持只存 Markdown、由編輯器雙向轉換：需引入 markdown 雙向轉換器（Milkdown/turndown 組合），區塊語意（CTA 按鈕）在 markdown 中無原生表達，會以自訂語法 hack。否決。

### 渲染在 server 端由區塊 JSON 產生 email HTML，參照 realms render.ts 手法

`packages/mail/lib/welcome-email-render.ts`：BlockNote 區塊陣列 → 600px 單欄 table HTML（inline style）→ `sanitizeEmailHtml`（正則消毒，禁 script/on* 事件/外部樣式）→ `assertHtmlSize`（上限 256KB）→ 同步產生純文字版本。CTA button 區塊渲染為居中 bulletproof 按鈕（table + 圓角，不用 VML，非 Outlook 2007 目標客群）。

- **Alternatives Considered:**
  - Client 端 blocksToHTML 後存 HTML：同「只存 HTML」的固化問題。否決。
  - 每種區塊對應一個 react-email 元件：元件組合對齊 BlockNote 版面的維護成本高，且 BlockNote 官方即提供 blocksToHTML 可用於 server（@blocknote/core 無 DOM 依賴）。否決。

### 變數插值在渲染後的 HTML/純文字上進行

維持現有 `{{userName}}`／`{{courseName}}`／`{{courseUrl}}` 三個變數與現有跳脫規則（safeTemplateValue），套用到渲染結果字串。

- **Alternatives Considered:**
  - 編輯器內建特殊「變數區塊」：編輯器自訂複雜度大增，且營運者已習慣直接打 {{userName}} 文字。否決。
  - 逐區塊插值後再組 HTML：等價於渲染後插值但實作繞路。否決。

### 測試寄送為同步 orpc procedure，不經 emailDeliveryLog 佇列

`course.sendWelcomeEmailTest({ courseId, toEmail })`：即時渲染（用範例值：userName=「測試學員」、courseName=該課標題、courseUrl=課程頁網址）並經既有 sendEmail 寄出，回傳 `{ ok: true, toEmail }` 或拋出含訊息的 orpc 錯誤。權限沿用 updateWelcomeEmailSettings 的管理者檢查。

- **Alternatives Considered:**
  - 走 PENDING 佇列非同步寄：測試信的目的就是立刻確認版面，佇列延遲與狀態輪詢徒增 UI 複雜度。否決。
  - 只寄 HTML 不寄純文字：既有 sendEmail 一律雙格式，無需為測試破例。否決。

## Implementation Contract

**行為：** 營運者在課程郵件設定頁看到的是所見即所得編輯器；儲存後再開啟內容原樣回呈；按下「寄測試信」並輸入收件信箱後，按鈕旁依序顯示「正在寄出…」（按鈕鎖定）→「已寄出測試信到 <email>」或「沒有寄出：<錯誤訊息>」。付款成功後實際寄出的歡迎信：有 contentJson 的課程用新渲染，舊課程維持 Markdown 渲染，寄信行為（時機、去重、log）不變。

**資料介面：**
- Prisma：`CourseWelcomeEmail` 新增 `contentJson String? @db.Text`；無新增索引（此欄位僅 by courseId 單筆讀取，既有 courseId 唯一鍵已覆蓋）。DDL：
  ```sql
  ALTER TABLE "course_welcome_email" ADD COLUMN "content_json" TEXT;
  ```
- orpc `course.updateWelcomeEmailSettings`：input 增 `contentJson`（選用，BlockNote 區塊 JSON 陣列）；儲存時有給 contentJson 就一併更新。
- orpc `course.sendWelcomeEmailTest`：input `{ courseId: string, toEmail: string }`（toEmail 需為合法 email，空值或非 email 直接 400）；output `{ ok: true, toEmail, subject }`；失敗拋 orpc 錯誤帶 provider 錯誤訊息（截斷 500 字元，同現行 errorMessage 慣例）。
- `packages/mail/lib/welcome-email-render.ts` 匯出：`renderWelcomeEmailFromBlocks(contentJson, context): Promise<{ html, text }>`，context 含 subject/courseName/userName/courseUrl/品牌色；html 經 sanitizeEmailHtml 與 assertHtmlSize（256KB）。

**失敗模式：** contentJson 為 null 走 Markdown fallback（現行路径）；contentJson 解析失敗或含未知區塊類型 → 該區塊跳過，其餘照渲染，不整封失敗；測試寄送地址不合法 → procedure 直接回錯，UI 顯示「請輸入正確的測試收件信箱」。

**驗收：**
- packages/mail 層：renderWelcomeEmailFromBlocks 單元測試覆蓋標題/清單/連結/CTA 按鈕區塊渲染、script 與 onerror 被消毒移除、純文字版本產出、256KB 上限；course-lifecycle.test.ts 補 contentJson 優先於 markdownTemplate 的案例。
- api 層：sendWelcomeEmailTest 的輸入驗證（空 email、非 email、無權限）與成功 mock 寄送案例。
- UI 層：EmailSettingsPanel 的測試涵蓋「測試寄出成功顯示已寄出訊息」、「失敗顯示錯誤」、「寄送中按鈕 disabled」。
- 手動驗收：後台編輯器輸入文字加粗與一個 CTA 按鈕 → 儲存 → 寄測試信到 Gmail → 版面正常、按鈕可點、無原始 HTML 外洩。

**範圍邊界：** 只動歡迎信（WELCOME_EMAIL）的編輯、渲染、測試寄送；不動到期提醒、不動送達紀錄 schema、不動 CourseWelcome react-email 元件本身（fallback 仍用它）。

## Risks / Trade-offs

- [BlockNote 依賴體積讓 admin bundle 變大] → 編輯器元件以 next/dynamic 動態載入（realms newsletter-editor.tsx 同款做法），只在進入郵件設定頁時載入。
- [雙渲染路径（blocks + markdown）並存造成維護兩套] → 過渡期必要成本；spec 明定 contentJson 優先順序，測試鎖定分流邏輯；待所有課程重存後另開 change 移除 Markdown 路径。
- [sanitizeEmailHtml 正則消毒被繞過] → 規則對齊 realms 已在正式電子報使用的同款實作；測試含逃逸案例（屬性內大小寫混雜、data: URL）。
- [測試信被濫發] → procedure 沿用管理者權限檢查 + 單次單封同步寄，無名單功能，濫發成本高。

## Migration Plan

1. 合併前在 feature 分支跑 `pnpm --filter @startkiter/database prisma migrate dev` 產生 migration（僅 ADD COLUMN，可空，無回填）。
2. 部署順序：先上 DB migration，再上 api/mail 套件，最後上 apps/saas（前端動態載入編輯器，舊版前端無 contentJson 欄位也不影響）。
3. 回滾：ADD COLUMN 無破壞性，前端/Worker 回上一版即可；不需降級 migration（欄位留空不影響舊版程式）。

## Open Questions

- CTA 按鈕區塊的預設樣式（顏色用品牌主色變數還是固定色）——實作時對齊 apps/saas 現有 primary 色票後寫入 design 補遺。
