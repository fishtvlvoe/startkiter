## 1. 紅燈測試（TDD 先寫測試）

- [ ] 1.1 在 `packages/mail/provider/index.test.ts` 寫「Provider selection by EMAIL_PROVIDER」場景的紅燈測試：`EMAIL_PROVIDER=tosend` 且 `TOSEND_API_KEY` 有值時，`send` 呼叫的是 tosend provider（mock 驗證），此刻應失敗（tosend provider 尚未存在）
- [ ] 1.2 在同一測試檔補「Provider fallback chain」場景的紅燈測試：涵蓋 design.md 的 fallback 對照表（`EMAIL_PROVIDER=tosend` 缺金鑰 fallback resend、未設定 `EMAIL_PROVIDER` 時依 zsend→tosend→resend→smtp 順序挑選），跑 `pnpm --filter @startkiter/mail test` 確認全部紅燈
- [ ] 1.3 補「No provider configured in production」「No provider configured outside production」場景的紅燈測試：正式環境全無憑證要 throw、非正式環境全無憑證要 fallback console

## 2. ToSend / ZSend Provider 實作

- [ ] 2.1 新增 `packages/mail/provider/tosend.ts`（依 Decision「provider 介面對齊 SendEmailHandler 而非搬移 woomin 的 EmailTransport」，回傳 `Promise<void>` 不含 messageId），實作「ToSend provider sends via REST API」：`POST {TOSEND_API_BASE_URL}/emails`（預設 `https://api.tosend.com/v2`）、`Authorization: Bearer` header、`from`/`to` 用 `parseEmailAddress` 解析 `"Name <email>"` 格式，非 2xx 回應 throw error 含 status code；跑對應單元測試轉綠燈
- [ ] 2.2 新增 `packages/mail/provider/zsend.ts`，實作「ZSend provider sends via REST API」：`POST https://api.zeabur.com/api/v1/zsend/emails`、`Authorization: Bearer` header，非 2xx 回應 throw error 含 status code；跑對應單元測試轉綠燈

## 3. SMTP Provider 環境變數對齊

- [ ] 3.1 先確認命名變更安全：`grep -rn "MAIL_HOST\|MAIL_PORT\|MAIL_USER\|MAIL_PASS" .env* apps/saas` 確認本機專案沒有任何檔案在用這組舊命名（design.md 已初步確認，這裡是 apply 階段再次核實）
- [ ] 3.2 修改 `packages/mail/provider/nodemailer.ts`，實作「SMTP provider connection configuration」：改讀 `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_SECURE`（`SMTP_SECURE` 僅字面值 `"true"` 視為 true），`SMTP_HOST` 未設時視為此 provider 無可用憑證；跑對應單元測試轉綠燈

## 4. 路由邏輯改寫

- [ ] 4.1 改寫 `packages/mail/provider/index.ts`：依 Decision「Provider 選擇邏輯：明確指定優先於自動 fallback」實作 `getEmailProvider()`／完整 fallback 鏈邏輯，串接 tosend/zsend/resend/smtp 四個 provider；跑 `pnpm --filter @startkiter/mail test` 確認第 1 節全部測試轉綠燈
- [ ] 4.2 在 fallback 實際發生時（指定的 provider 缺憑證、改用其他 provider）用 `packages/logs` 的 `logger.warn` 記一筆訊息（對應 design.md Risk 1 的緩解措施），寫一個測試斷言 fallback 發生時 `logger.warn` 被呼叫

## 5. 文件與收尾

- [ ] 5.1 更新 `.env.example`，新增 `EMAIL_PROVIDER`／`TOSEND_API_KEY`／`TOSEND_FROM_EMAIL`／`TOSEND_API_BASE_URL`／`ZSEND_API_KEY`／`SMTP_HOST`／`SMTP_PORT`／`SMTP_USER`／`SMTP_PASS`／`SMTP_SECURE` 的說明註解；用 `cat .env.example` 人工核對每個變數都有一行說明
- [ ] 5.2 跑完整套件測試 `pnpm --filter @startkiter/mail test` 與型別檢查 `pnpm --filter @startkiter/mail typecheck`（或專案慣用的等效指令），確認全綠、無型別錯誤

## 6. 部署提醒（apply 完成、合併後的手動動作，不是程式碼任務）

- [ ] 6.1 提醒 Fish：正式站容器（Coolify `lmfjp5suzh08plloijhha5ke`）需要新增環境變數 `EMAIL_PROVIDER=tosend`，並確認 `TOSEND_API_KEY` 真的被帶進容器（先前查證容器裡只有 `TOSEND_FROM_EMAIL`，沒有 `TOSEND_API_KEY`），部署後用一次真實觸發（例如開啟一門課程的歡迎信開關並完成一筆測試購買）確認 `email_delivery_log` 表出現 `status=SENT` 記錄
