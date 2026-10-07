## Why

買 StartKiter 的老師不會改主機環境變數，但寄信服務（ZSend／ToSend／Resend／SMTP）目前只能靠部署時設定 `EMAIL_PROVIDER` 等環境變數，後台沒有任何欄位，等於老師自己無法讓網站寄出信。同時後台選單有兩處重複入口、一處缺入口，管理員從課程區找不到平台管理（含郵件設定）。

## What Changes

- 新增後台「Email 設定」寄信服務分頁：在 `/admin/email-settings` 選擇 ZSend／ToSend／Resend／SMTP，填入金鑰或 SMTP 連線資料，加密存進既有 `SiteSetting` 表（id `email-provider-config`），回顯只顯示金鑰末 4 碼
- 新增寄件人與電子報設定分頁：寄件人名稱、寄件 Email、電子報寄件人名稱、Reply-To、頁尾公司名稱、頁尾實體地址、頁尾聯絡 Email、每分鐘發送上限預設值
- 新增「寄送測試信」動作：用目前已儲存的設定寄一封測試信到指定信箱，回報成功或錯誤原因
- 修改 `packages/mail/provider/index.ts` 路由：後台已儲存的設定優先，沒有儲存時沿用現行環境變數路由與 fallback 鏈
- 修改 `packages/mail/provider/tosend.ts`、`zsend.ts`、`resend.ts`、`nodemailer.ts`：改成接收傳入的憑證，不再直接讀 `process.env`
- 修改 `packages/newsletter/lib/send-engine.ts` 與 `packages/newsletter/lib/render.ts`：寄件人名稱、Reply-To、頁尾資訊、發送上限預設值改讀後台設定，未設定時沿用現行環境變數
- 修改 `/admin/email-settings` 頁面：既有「歡迎信模板」「送達紀錄」改為同頁分頁，頁首顯示寄信設定狀態（未設定＝警示、已設定＝顯示目前服務名稱）
- 修改平台區選單：`packages/platform/src/mount-points.ts` 的 `email-settings` 顯示名稱改為「Email 設定」，與金流、發票、AI 設定同屬系統設定群組
- 修改 `apps/saas/modules/shared/lib/account-menu.ts`：移除右下選單與側邊欄重複的「帳號設定」；「文件」與側邊欄「客服」指向同一頁 `/support`，從右下選單移除；平台管理員在任何工作區都看得到「平台管理設定」入口
- 移除 `openspec/changes/mail-provider-tosend-smtp-support` 殘留副本（該 change 已於 2026-09-16 歸檔，副本只差未勾的部署提醒）

## Non-Goals

- 不做手機版選單收合：正式站手機版已使用底部分頁列（`getTabBarItems`），設計稿中的攤開選單只是示意
- 不處理平台區「用戶／課程／頁面管理」出現兩次：2026-10-06 以 ego-browser 實測，第二組是桌面版隱藏的手機底部分頁列，畫面上沒有重複
- 不新增 Mailgun、Postmark 等第五種寄信服務（`packages/mail/provider/` 雖有檔案，但不在本次選項內）
- 不修改歡迎信、到期提醒信的觸發邏輯與內容編輯器
- 不做多組織各自的寄信設定：整站共用一組
- 不在本 change 內執行正式站部署；正式站補 `NEXT_PUBLIC_SUPPORT_EMAIL`、`SETTINGS_ENCRYPTION_KEY` 確認列為最後一個任務

## Capabilities

### New Capabilities

- `email-service-settings`: 後台寄信服務、寄件人、電子報寄送設定的儲存、遮罩回顯、測試寄送與設定狀態顯示

### Modified Capabilities

- `mail-provider-routing`: 後台已儲存的寄信設定優先於環境變數；provider 改由傳入的憑證寄送
- `role-based-workspace-navigation`: 右下帳號選單不重複側邊欄項目；平台管理員在 App 工作區也能進入平台管理

## Impact

- Affected specs: `email-service-settings`（新）、`mail-provider-routing`、`role-based-workspace-navigation`
- Affected code: `packages/mail/provider/index.ts`、`packages/mail/provider/tosend.ts`、`packages/mail/provider/zsend.ts`、`packages/mail/provider/resend.ts`、`packages/mail/provider/nodemailer.ts`、新增 `packages/mail/lib/email-settings.ts`、`packages/newsletter/lib/send-engine.ts`、`packages/newsletter/lib/render.ts`、`apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/page.tsx`、`apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/EmailSettingsPanel.tsx`、`packages/platform/src/mount-points.ts`、`apps/saas/modules/shared/lib/account-menu.ts`、`packages/i18n/translations/zh-tw/saas.json`
- Dependencies 新增：無（沿用既有 `nodemailer`、`resend`、`packages/api/modules/course/lib/settings-crypto.ts`）
- 環境變數新增：無；沿用既有 `SETTINGS_ENCRYPTION_KEY` 加密金鑰。正式站需補 `NEXT_PUBLIC_SUPPORT_EMAIL`
- 資料庫：沿用既有 `SiteSetting` 表，不新增 migration
