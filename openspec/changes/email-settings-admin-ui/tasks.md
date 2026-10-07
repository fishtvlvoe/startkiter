## 1. 紅燈測試（先寫測試，跑過確認失敗）

- [ ] 1.1 依「Stored settings take precedence over environment」與「Providers send with supplied credentials」在 `packages/mail/provider/index.test.ts` 新增紅燈測試：mock `readEmailSettings` 回傳 DB 設定，覆蓋 spec Example 表四列（DB tosend 蓋過 env resend、DB smtp 缺 host 落回 env tosend 並 `logger.warn` 一次、無 DB 用 env zsend、解密失敗落回 env resend）；既有環境變數測試全部保留不改預期。驗證：`pnpm --filter @startkiter/mail test` 新測試失敗、舊測試仍綠。
- [ ] 1.2 依「Platform admin saves email provider settings」「Settings input validation」「Stored secrets are never returned in plain text」「Stored settings cache」新增 `packages/mail/lib/email-settings.test.ts` 紅燈測試：空金鑰沿用舊值、`SETTINGS_ENCRYPTION_KEY` 空回 `settings_unavailable`、spec 驗證邊界表七列、summary JSON 不含 `tsend_abcd1234` 且 hint 結尾 `1234`、存檔後快取被清除。驗證：`pnpm --filter @startkiter/mail test` 新測試失敗。
- [ ] 1.3 依「Account menu does not duplicate sidebar entries」「Platform admin reaches platform settings from any app workspace」改寫 `apps/saas/modules/shared/lib/account-menu.test.ts` 預期為 spec Example 表四列，並更新 `UserMenu.test.tsx` 中對「帳號設定」「文件」的斷言。驗證：`pnpm --filter @startkiter/saas exec vitest run modules/shared` 這兩檔失敗。

## 2. 寄信設定儲存層與路由

- [x] 2.1 [after: 1.2] 依 Decision「寄信設定沿用 SiteSetting 加密列，不開新表」與「設定讀取加 30 秒行程內快取，存檔時清除」新增 `packages/mail/lib/email-settings.ts`，實作 design Implementation Contract 列出的 `readEmailSettings`／`getEmailSettingsSummary`／`saveEmailSettings`，沿用 `packages/api/modules/course/lib/settings-crypto.ts`；不新增 migration。驗證：1.2 的測試轉綠。
- [x] 2.2 [after: 1.1] 依 Decision「provider 改成接收憑證參數」把 `tosend.ts`、`zsend.ts`、`resend.ts`、`nodemailer.ts` 改成 `createXxxSender(credentials)` 形式，`resend.ts` 依 apiKey 建 client；既有 `tosend.test.ts`、`zsend.test.ts`、`nodemailer.test.ts` 改成傳入憑證但斷言內容不變。驗證：這三檔測試綠燈。
- [x] 2.3 [after: 2.1, 2.2] 依 Decision「路由優先序：DB 設定 → 環境變數 → fallback 鏈」改寫 `packages/mail/provider/index.ts`，對外 `send` 簽名不變。驗證：1.1 測試轉綠，且 `pnpm --filter @startkiter/mail test` 與 `pnpm --filter @startkiter/mail typecheck` 全綠。
- [x] 2.4 [after: 2.3] 依「Test email uses saved settings」在 `packages/mail/lib/email-settings.ts` 實作 `sendTestEmail(to)`：無設定時回錯誤、provider 失敗訊息含 HTTP status 但不含金鑰；補對應單元測試（成功、401 失敗、無設定三情境）。驗證：`pnpm --filter @startkiter/mail test` 綠燈。

## 3. 電子報讀後台設定

- [x] 3.1 [after: 2.1] 依 Decision「路由優先序：DB 設定 → 環境變數 → fallback 鏈」讓 `packages/newsletter/lib/send-engine.ts` 的寄件人名稱、寄件 Email、Reply-To、新 campaign 預設每分鐘上限，以及 `packages/newsletter/lib/render.ts` 的頁尾公司名、實體地址、聯絡 Email 先讀 `readEmailSettings()`，寄件快照 `SenderSnapshot.emailProvider` 改記實際生效的 provider（DB 優先），空值時沿用現行 `MAIL_FROM_NAME`／`MAIL_FROM`／`SMTP_FROM`／`NEWSLETTER_SENDER_ADDRESS`／`SUPPORT_ADDRESS`。先寫紅燈測試再實作。驗證：`pnpm --filter @startkiter/newsletter test` 全綠，含「DB 有值用 DB、DB 空用 env」兩組情境。

## 4. Email 設定頁面

- [x] 4.1 [after: 2.4] 依「Platform admin saves email provider settings」「Test email uses saved settings」在 `apps/saas/app/(authenticated)/(main)/(account)/admin/email-settings/` 新增 server actions（儲存設定、寄測試信），每個 action 開頭呼叫 `requireGlobalAdmin()`，回傳值只含 summary 不含明碼。驗證：action 單元測試斷言非管理員被 redirect、回應不含金鑰字串。
- [x] 4.2 [after: 4.1] 依「Email settings page layout」與 design「Design Source」表，把 `EmailSettingsPanel.tsx` 改為狀態條 + 四分頁（寄信服務／寄件人與電子報／歡迎信模板／送達紀錄），服務卡片切換只顯示對應欄位，金鑰欄位以遮罩值當 placeholder，未儲存時測試信按鈕停用；歡迎信與送達紀錄沿用現有元件不改行為；圖示用 SVG。驗證：`EmailSettingsPanel.test.tsx` 新增「選 SMTP 只顯示 SMTP 欄位」「未設定顯示警示」「未儲存時測試按鈕停用」三個測試並綠燈，既有測試仍綠。
- [x] 4.3 依「Email settings page layout」把 `packages/i18n/translations/zh-tw/saas.json` 的 `admin.menu.emailSettings` 改為「Email 設定」，並確認 `packages/platform/src/mount-points.ts` 的 `email-settings` 與金流、發票、AI 設定同屬系統設定群組顯示。同步更新 `apps/saas/modules/shared/lib/nav-menu-items.test.ts` 寫死的「郵件設定」標籤。驗證：`pnpm --filter @startkiter/platform test` 與 `nav-menu-items.test.ts` 綠燈，ego-browser 於本機 dev server 看到側邊欄文字「Email 設定」。

## 5. 帳號選單去重

- [x] 5.1 [after: 1.3] 依 Decision「帳號選單移除重複項，平台入口改看 platformAdmin」修改 `apps/saas/modules/shared/lib/account-menu.ts`：`getAccountMenuEntries(context, { platformAdmin })` 移除 `user-settings`、`help`，平台入口只在「platformAdmin 且非 platform 工作區」出現；`UserMenu.tsx` 從 NavBar 既有的 `canAccessAdmin` 傳入 `platformAdmin`。不修改 `WorkspaceContext` 型別。驗證：1.3 測試轉綠，`grep -rn "getAccountMenuEntries" apps packages` 每個呼叫點都已傳入第二參數。

## 6. Review

- [ ] 6.1 [after: 2.3, 3.1, 4.2, 5.1] 派不同於實作方的 CLI 做獨立 code review，聚焦：金鑰是否有任何路徑以明碼回到前端或 log、`requireGlobalAdmin` 是否涵蓋每個 action、DB 設定失效時是否仍能落回環境變數寄信。驗證：review 報告無 Critical，抓到的問題修完重跑 `pnpm --filter @startkiter/mail test`、`pnpm --filter @startkiter/newsletter test`、`pnpm --filter @startkiter/saas exec vitest run` 全綠。

## 7. 部署與收尾

- [ ] 7.1 [after: 6.1] 移除 `openspec/changes/mail-provider-tosend-smtp-support` 殘留副本（正本在 `openspec/changes/archive/2026-09-16-mail-provider-tosend-smtp-support`）。驗證：`spectra list` 不再列出該 change，且 archive 目錄仍存在。
- [ ] 7.2 [after: 6.1] 部署正式站前確認容器有 `SETTINGS_ENCRYPTION_KEY`，補 `NEXT_PUBLIC_SUPPORT_EMAIL`；部署後在後台選 ToSend 填金鑰、存檔、寄測試信到 fish@fishot.com。驗證：收件匣收到測試信、`email_delivery_log` 或測試結果顯示成功；ego-browser 桌面 1440px 與手機 390px 截圖 Email 設定四分頁與 `/course` 右下選單（只剩「我的訂閱」「平台管理設定」「登出」等 spec 列出項目），客服頁不再顯示缺 `NEXT_PUBLIC_SUPPORT_EMAIL` 紅字。
