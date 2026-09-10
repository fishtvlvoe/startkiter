## 1. 紅燈測試（TDD 先行）

- [ ] 1.1 [P] 為 `renderWelcomeEmailFromBlocks` 寫紅燈單元測試（對應 Requirement: Server renders email-safe HTML from block JSON、Plain text version is generated with every render）：覆蓋標題/段落/清單/連結/CTA 按鈕區塊的 HTML 輸出、`<script>` 與 `onerror` 被消毒移除、未知區塊類型被跳過不報錯、輸出超過 256KB 拋錯、純文字版本含按鈕區塊的 `text (url)` 行。驗證方式：`pnpm --filter @startkiter/mail test` 中新增測試檔案，執行後這些案例全部失敗（函數尚不存在）。
- [ ] 1.2 [P] 為渲染後變數插值寫紅燈測試（對應 Requirement: Template variables are interpolated on rendered output with escaping）：變數值含 `_[test]` 等特殊字元時輸出保持字面文字，HTML 與純文字兩路都測。驗證方式：mail 套件測試執行後失敗。
- [ ] 1.3 [P] 為 `renderCourseWelcomeEmail` 渲染來源分流寫紅燈測試（對應 Requirement: Legacy Markdown rendering remains for records without block content、Welcome email content is rendered from block content when present）：`contentJson` 非 null 時走區塊渲染、為 null 時走既有 Markdown 渲染，寄信時機與 EmailDeliveryLog 行為不變。驗證方式：`packages/mail/lib/course-lifecycle.test.ts` 新增案例執行後失敗。
- [ ] 1.4 [P] 為 `course.sendWelcomeEmailTest` 寫紅燈測試（對應 Requirement: Operator can send a test welcome email to an arbitrary address、Test send does not write delivery logs）：成功路徑回傳 `{ ok: true, toEmail, subject }`；空字串與 `not-an-email` 被拒且未寄出；非管理者被拒；課程無模板回錯；成功後 `emailDeliveryLog` 無新增資料。驗證方式：api 套件測試執行後失敗。
- [ ] 1.5 [P] 為 EmailSettingsPanel 測試寄送回饋寫紅燈測試（對應 Requirement: UI shows explicit send feedback and locks the button while sending、Welcome email template is edited with a WYSIWYG block editor）：成功時依序顯示寄出中…（按鈕 disabled）→ 已寄出測試信到指定信箱；失敗顯示 沒有寄出：錯誤訊息；收件信箱為空時顯示 請輸入測試收件信箱 且未發 request。驗證方式：saas app 的 EmailSettingsPanel 測試執行後失敗。

## 2. 資料層

- [ ] 2.1 在 `CourseWelcomeEmail` 模型新增可空的 `contentJson`（TEXT）欄位並產生 migration（對應 Requirement: Editor content is persisted as block JSON、Decision：儲存格式：新增 contentJson 欄位存 BlockNote 區塊 JSON，markdownTemplate 保留為 fallback）：migration 僅含 `ALTER TABLE "course_welcome_email" ADD COLUMN "content_json" TEXT;`，無回填、無新索引。驗證方式：`pnpm --filter @startkiter/database exec prisma migrate dev` 產生 migration 檔，套用後 `prisma migrate status` 顯示已套用。

## 3. 渲染實作（mail 套件）

- [ ] 3.1 實作 `packages/mail/lib/welcome-email-render.ts` 的 `renderWelcomeEmailFromBlocks`（對應 Requirement: Server renders email-safe HTML from block JSON、Plain text version is generated with every render、Decision：渲染在 server 端由區塊 JSON 產生 email HTML，參照 realms render.ts 手法、Decision：變數插值在渲染後的 HTML/純文字上進行）：BlockNote 區塊陣列 → 600px 單欄 table HTML（inline style）→ 正則消毒（移除 script、on* 屬性、javascript:/data: URL）→ 256KB 上限 → 純文字版本；參照 realms lib/newsletter/render.ts 的 sanitizeEmailHtml 與 assertHtmlSize 手法重寫，不複製檔案。驗證方式：1.1、1.2 的紅燈測試轉綠。
- [ ] 3.2 修改 `renderCourseWelcomeEmail` 加渲染來源分流（對應 Requirement: Welcome email content is rendered from block content when present、Legacy Markdown rendering remains for records without block content）：`contentJson` 非 null 用 3.1 的渲染，為 null 維持既有 Markdown 路径，寄信時機與 log 寫入不變。驗證方式：1.3 測試轉綠。

## 4. API 層

- [ ] 4.1 修改 `course.updateWelcomeEmailSettings` 接受並儲存 `contentJson`（對應 Requirement: Editor content is persisted as block JSON）：request 含 `contentJson` 時寫入該欄位並同步把區塊純文字匯出寫入 `markdownTemplate`；未含時兩欄行為維持現狀。驗證方式：api 套件 procedure 測試通過（含「僅更新主旨不改 contentJson」案例）。
- [ ] 4.2 實作 orpc procedure `course.sendWelcomeEmailTest`（對應 Requirement: Operator can send a test welcome email to an arbitrary address、Test send does not write delivery logs、Decision：測試寄送為同步 orpc procedure，不經 emailDeliveryLog 佇列）：管理者權限檢查同 updateWelcomeEmailSettings；輸入驗證 `toEmail`（空或非 email 回 400）；用範例變數（userName=測試學員、courseName=課程標題、courseUrl=課程頁網址）渲染並以既有 sendEmail 同步寄一封；成功回 `{ ok: true, toEmail, subject }`；不寫 EmailDeliveryLog。驗證方式：1.4 測試轉綠。

## 5. 前端（saas app）

- [ ] 5.1 安裝 BlockNote 依賴並建立 `welcome-email-composer.tsx`（對應 Requirement: Welcome email template is edited with a WYSIWYG block editor、Decision：編輯器採用 BlockNote（@blocknote/core + react + mantine 0.51.4））：安裝 @blocknote/core、@blocknote/react、@blocknote/mantine 0.51.4 與 @mantine/core；元件以 zhTW locale 提供標題、粗斜體、清單、引用、連結與 CTA 按鈕區塊，以 next/dynamic 動態載入，value/onChange 為 BlockNote 區塊 JSON。驗證方式：於 EmailSettingsPanel 暫時掛上元件，`pnpm --filter saas build` 通過且 mail 設定頁外的 bundle 不含 blocknote（檢查 build 輸出的 dynamic chunk）。
- [ ] 5.2 整合 EmailSettingsPanel：換上編輯器、加測試寄送 UI（對應 Requirement: Editor content is persisted as block JSON、UI shows explicit send feedback and locks the button while sending）：Markdown 文字框換成 5.1 編輯器（讀取既有 contentJson 回呈，無則以現有 markdownTemplate 內容初始化）；新增測試收件信箱輸入框與寄測試信按鈕，按下呼叫 `course.sendWelcomeEmailTest` 並依序顯示寄出中／已寄出／沒有寄出三態，寄送中鎖定按鈕。驗證方式：1.5 測試轉綠。

## 6. 收尾驗證

- [ ] 6.1 全量驗證：`pnpm test`、`pnpm type-check`、`pnpm --filter saas build` 全綠，無新 lint 錯誤。驗證方式：三個指令皆 exit 0。
- [ ] 6.2 手動驗收：後台編輯器輸入一段文字、一個標題與一個 CTA 按鈕 → 儲存 → 寄測試信到 Gmail → 版面正常、按鈕可點、無原始 HTML 外洩、按鈕下方有已寄出提示。驗證方式：人工在測試環境走一遍並記錄於 PR 描述。

## 7. Code Review

- [ ] 7.1 派 Codex 做 code review，修完 Critical 問題後重跑 6.1。驗證方式：review 結論無未修復的 Critical，且 6.1 三指令仍全綠。
