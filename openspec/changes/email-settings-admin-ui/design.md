## Context

- 寄信路由在 `packages/mail/provider/index.ts`：依 `EMAIL_PROVIDER` 環境變數挑 provider，缺憑證時走 `zsend → tosend → resend → smtp` fallback 鏈，正式環境全無憑證時 throw。四個 provider 檔案各自直接讀 `process.env`。
- 後台已有「加密設定存 DB」的既有模式：`SiteSetting` 表（`id` + `ciphertext`），用 `packages/api/modules/course/lib/settings-crypto.ts` 的 `encryptSettingsJson`／`decryptSettingsJson`／`maskSecret` 搭配 `SETTINGS_ENCRYPTION_KEY`。`packages/ai/lib/provider-settings.ts`（AI 助手模型設定）就是這樣做，留空金鑰欄位代表沿用舊值。
- `/admin/email-settings` 目前只有歡迎信模板、測試收件、送達紀錄（`EmailSettingsPanel.tsx`），選單名稱「郵件設定」。
- 電子報寄件人名稱讀 `MAIL_FROM_NAME`、頁尾地址讀 `SUPPORT_ADDRESS`、寄件地址讀 `SMTP_FROM`／`MAIL_FROM`，發送上限存在每個 campaign 的 `ratePerMinute`（預設 60）。
- 右下帳號選單（`apps/saas/modules/shared/lib/account-menu.ts`）與側邊欄重複「帳號設定」（`/settings/general`），「文件」與側邊欄「客服」都指向 `/support`；「平台管理設定」只在 `scope === "platform"` 時出現，平台管理員人在課程區時沒有入口。
- 2026-10-06 以 ego-browser 實測正式站：平台區連結清單裡第二組「用戶／課程／頁面管理」是桌面版隱藏的手機底部分頁列，不是畫面上的重複。
- 參考實作（只讀，不修改）：`/Users/fishtv/Development/C-客戶專案/woomin-main/components/admin/settings/email-settings-form.tsx`（欄位與版面）、`/Users/fishtv/Development/B-產品/products/woomin/dev/lib/email-transport.ts`（DB 覆蓋 + fallback 鏈）。

## Design Source

- Source：`~/Downloads/startkiter-email-settings-mockup.html`，2026-10-06 由 PM 產出、Fish 回覆「ok」確認
- Cache：`.spectra/design-cache/email-settings-admin-ui/startkiter-email-settings-mockup.html`
- 關鍵值：

| 項目 | 值 |
| --- | --- |
| 分頁順序 | ① 寄信服務 ② 寄件人與電子報 ③ 歡迎信模板 ④ 送達紀錄 |
| 服務選項 | ZSend／ToSend（標「推薦」）／Resend／SMTP，四格卡片單選 |
| 選中卡片 | 邊框 `#3d5a1e`、底色 `#eef2e6`，圓角 10px |
| 狀態條 | 未設定：底 `#fff4e5` 字 `#b54708` + 警示圖示；已設定：底 `#e8f5ea` 字 `#2f7a3a` + 勾選圖示 |
| 卡片 | 邊框 `#e7e4da`、圓角 12px、內距 20px |
| 圖示 | SVG 線條圖示（mail／alert／check），禁用 Emoji |
| 選單位置 | 「Email 設定」與金流設定、發票設定、AI 設定同在系統設定群組 |

實作時樣式用專案既有 `@startkiter/ui` 元件與 design tokens 對應上表，不手刻新色碼。

## Goals / Non-Goals

**Goals:**

- 老師在後台就能選寄信服務、填金鑰、存檔、寄測試信，全程不碰主機設定
- 後台設定優先，未設定時現行環境變數部署完全不受影響
- 金鑰加密存放，畫面與 API 回應永遠不回傳明碼
- 右下帳號選單不再重複側邊欄項目；平台管理員在任何工作區都進得了平台管理

**Non-Goals:**

- 手機版選單收合（正式站已用底部分頁列）
- 新增第五種寄信服務、多組織各自設定
- 修改歡迎信與到期提醒信的觸發邏輯、內容編輯器
- 修改 `role-based-workspace-navigation` 既有的 manifest 驅動選單機制

## Decisions

### 寄信設定沿用 SiteSetting 加密列，不開新表

用 `SiteSetting` 一列（`id = "email-provider-config"`），內容是加密後的 JSON，與 AI 助手模型設定同一套 `settings-crypto` 工具。

Alternatives Considered：
- 新開 `email_settings` 表、每欄位一個 column：要寫 migration，金鑰欄位仍需另外加密，與既有 AI 設定模式不一致，否決。
- 金鑰存明碼、其他欄位存明碼：DB 備份外洩即洩漏寄信金鑰，違反安全邊界，否決。

### 路由優先序：DB 設定 → 環境變數 → fallback 鏈

`getEmailProvider()` 改成 async：先讀 DB 設定，`provider` 有值且該 provider 憑證齊全 → 用它；否則完全沿用現行環境變數邏輯（含 `EMAIL_PROVIDER`、fallback 鏈、正式環境 throw、非正式環境 console）。DB 指定的 provider 缺憑證時記一筆 `logger.warn` 再落回環境變數邏輯。

Alternatives Considered：
- 環境變數優先、DB 為輔：老師在後台改了設定卻不生效，畫面與實際行為不一致，否決。
- DB 有設定就完全忽略環境變數（含 fallback）：DB 金鑰失效時整站寄不出信，失去現有的容錯，否決。

### provider 改成接收憑證參數

四個 provider 匯出 `createXxxSender(credentials)`，回傳 `SendEmailHandler`；環境變數路徑也改由 `index.ts` 把 `process.env` 組成 credentials 傳入。`resend.ts` 的模組層 client 快取改成依 apiKey 建立。

Alternatives Considered：
- 寄信前把 DB 值寫進 `process.env`：跨請求互相污染、無法測試，否決。
- 只讓 tosend 支援 DB 設定：四個選項畫面上都可選，行為不一致，否決。

### 設定讀取加 30 秒行程內快取，存檔時清除

`readEmailSettings()` 在同一 Node 行程快取 30 秒（估計值，依電子報每分鐘 60 封、每封都查 DB 的壓力推算；以 apply 時壓力測試的 DB 查詢次數確認），`saveEmailSettings()` 成功後清除快取。

Alternatives Considered：
- 不快取：電子報批次寄送每封都解密一次 DB 列，否決。
- 長效快取（重啟才更新）：老師存檔後測試信用到舊設定，否決。

### 帳號選單移除重複項，平台入口改看 platformAdmin

`getAccountMenuEntries(context, { platformAdmin })` 新增第二參數：移除 `user-settings` 與 `help` 兩個項目；`platform-admin-settings` 改為「`platformAdmin === true` 且目前不在 platform 工作區」才出現（在 platform 工作區時側邊欄本身就是平台選單）。

Alternatives Considered：
- 改把側邊欄的「帳號設定」「客服」拿掉、保留右下選單：側邊欄是一般學員的主要入口，否決。
- 把 platformAdmin 塞進 `WorkspaceContext` 型別：會動到 `role-based-workspace-navigation` 的共用型別與所有呼叫者（L103 A 壞 B 風險），否決。

## Implementation Contract

**Behavior**

- 平台管理員打開 `/admin/email-settings`：頁首狀態條顯示「尚未完成設定」或「目前使用 <服務名稱> 寄信」，下方四個分頁。
- 寄信服務分頁：選服務卡片後只顯示該服務欄位；已存過的金鑰欄位顯示 `maskSecret` 遮罩值作為 placeholder，留空送出代表沿用舊值。
- 存檔成功後狀態條轉為已設定；寄送測試信使用「已儲存」的設定，未儲存過任何服務時按鈕停用並提示先儲存。
- 非平台管理員直接開 `/admin/email-settings` 仍被 `requireGlobalAdmin` 擋下。
- 右下帳號選單：所有角色都不再出現「帳號設定」「文件」；平台管理員在 `/course` 等 App 工作區看得到「平台管理設定」。

**Interface / data shape**

- `packages/mail/lib/email-settings.ts`
  - `EMAIL_SETTINGS_ID = "email-provider-config"`
  - `type StoredEmailSettings = { provider?: "zsend" | "tosend" | "resend" | "smtp"; zsendApiKey?: string; zsendDomain?: string; tosendApiKey?: string; tosendApiBaseUrl?: string; resendApiKey?: string; smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPass?: string; smtpSecure?: boolean; senderName?: string; fromEmail?: string; newsletterSenderName?: string; newsletterReplyTo?: string; footerCompany?: string; footerAddress?: string; footerEmail?: string; newsletterRatePerMinute?: number }`
  - `readEmailSettings(): Promise<StoredEmailSettings>`（解密失敗或無列回 `{}`）
  - `getEmailSettingsSummary(): Promise<EmailSettingsSummary>`：所有金鑰欄位只回 `hasXxx: boolean` 與 `xxxHint: string`（`maskSecret` 結果），不回明碼
  - `saveEmailSettings(input, updatedBy): Promise<{ ok: true } | { ok: false; error: "invalid_input" | "settings_unavailable" }>`：空字串金鑰沿用舊值；`fromEmail`、`newsletterReplyTo`、`footerEmail` 須為合法 email；`smtpPort` 1–65535；`newsletterRatePerMinute` 1–600
  - `sendTestEmail(to): Promise<{ ok: true; provider: string } | { ok: false; error: string }>`
- `packages/mail/provider/index.ts`：`send` 對外簽名不變（`SendEmailHandler`），內部改 async 解析 provider。
- Server actions 放在 `apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/` 內，每個 action 開頭呼叫 `requireGlobalAdmin()`。

**Failure modes**

- `SETTINGS_ENCRYPTION_KEY` 未設定：存檔回 `settings_unavailable`，畫面顯示「伺服器缺加密金鑰，無法儲存」；寄信路由視同 DB 無設定，沿用環境變數。
- DB 解密失敗（金鑰被換過）：視同無設定並 `logger.warn`，不 throw。
- 測試信寄送失敗：回傳 provider 的錯誤訊息（含 HTTP status），不含金鑰內容。

**Acceptance criteria**

- `pnpm --filter @startkiter/mail test` 全綠，含 DB 優先、DB 缺憑證落回環境變數、解密失敗落回環境變數三組情境。
- `pnpm --filter @startkiter/newsletter test` 全綠，含寄件人名稱、Reply-To、頁尾讀 DB 設定的情境。
- `account-menu.test.ts` 斷言三種工作區的項目清單（見 tasks）。
- 部署後 ego-browser 桌面 1440px 與手機 390px 截圖：Email 設定四分頁、存檔、寄測試信實際收到信。

**Scope boundaries**

- In scope：上述 mail 套件、電子報讀設定、Email 設定頁、帳號選單、選單名稱。
- Out of scope：Non-Goals 所列項目；`role-based-workspace-navigation` 的 resolver 與 manifest 結構。

## Risks / Trade-offs

- [Risk] `getEmailProvider()` 改 async 後，所有呼叫 `send` 的地方行為改變 → Mitigation：對外 `send` 本來就是 async，簽名不變；既有 `provider/index.test.ts` 全部保留並維持綠燈。
- [Risk] 正式站 `SETTINGS_ENCRYPTION_KEY` 未設定導致後台存不了 → Mitigation：畫面明示原因；部署任務先確認容器有此變數（AI 助手模型設定已依賴它）。
- [Risk] 移除右下「帳號設定」「文件」破壞既有測試或使用者習慣 → Mitigation：側邊欄仍有同一頁入口；更新 `account-menu.test.ts`、`UserMenu.test.tsx` 的預期清單。
- [Risk] 金鑰透過 server action 回應外洩 → Mitigation：summary 型別不含明碼欄位，加一支測試斷言回傳 JSON 不包含已存金鑰字串。

## Migration Plan

1. 合併後部署，DB 無 `email-provider-config` 列時行為與現在完全相同（純環境變數）。
2. 部署後確認正式站容器有 `SETTINGS_ENCRYPTION_KEY`，補 `NEXT_PUBLIC_SUPPORT_EMAIL`。
3. 在後台選 ToSend、填金鑰、存檔、寄測試信驗證。
4. 回滾：刪除 `site_setting` 表中 `id = 'email-provider-config'` 的列即回到純環境變數行為；程式碼回滾為 revert 本 change 的 commit，無 schema 變更需還原。
