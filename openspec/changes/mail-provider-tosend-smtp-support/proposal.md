## Why

`packages/mail` 的 provider 路由邏輯（`provider/index.ts`）目前只接上 Resend：正式環境一律呼叫 `resendSend`，但正式站容器沒有部署 `RESEND_API_KEY`，任何觸發寄信的流程一旦真的被啟用（例如開啟課程歡迎信開關）都會在送出當下失敗。`.env` 裡已經有完整的 ToSend 服務憑證（`TOSEND_API_KEY`／`TOSEND_FROM_EMAIL`／`TOSEND_API_BASE_URL`），`packages/mail/provider/nodemailer.ts`（SMTP）也已經存在，但兩者都沒有被路由邏輯接上，形同半成品。需要把可用的 provider 接好，讓寄信功能在正式環境真的能送達。

## What Changes

- 新增 `packages/mail/provider/tosend.ts`：呼叫 ToSend REST API（`POST {TOSEND_API_BASE_URL}/emails`）的 provider，介面符合既有 `SendEmailHandler`（回傳 `Promise<void>`）
- 新增 `packages/mail/provider/zsend.ts`：呼叫 Zeabur Email（ZSend）REST API 的 provider，同上介面
- 修改 `packages/mail/provider/nodemailer.ts`：改讀 `SMTP_HOST`／`SMTP_PORT`／`SMTP_USER`／`SMTP_PASS`／`SMTP_SECURE` 環境變數（原本讀 `MAIL_HOST`／`MAIL_PORT`／`MAIL_USER`／`MAIL_PASS`，命名對齊既有 ToSend/ZSend 慣例，方便日後文件共用）
- 改寫 `packages/mail/provider/index.ts` 的路由邏輯：依 `EMAIL_PROVIDER` 環境變數（`resend`／`smtp`／`zsend`／`tosend`）選擇 provider；未設定或指定的 provider 缺少必要憑證時，依序 fallback：ZSend → ToSend → Resend → SMTP；開發環境（`NODE_ENV !== "production"`）在所有 provider 都無憑證時 fallback 到現有的 `console` provider
- 新增 `packages/mail/provider/index.test.ts` 的路由/fallback 測試（provider 選擇正確、fallback 順序正確、缺憑證時跳過）
- 更新 `.env.example` 新增 `EMAIL_PROVIDER`／`TOSEND_API_KEY`／`TOSEND_FROM_EMAIL`／`TOSEND_API_BASE_URL`／`ZSEND_API_KEY`／`SMTP_HOST`／`SMTP_PORT`／`SMTP_USER`／`SMTP_PASS`／`SMTP_SECURE` 的說明

## Non-Goals

- 不做 DB 設定覆蓋環境變數（StartKiter 沒有 site-setting 型的管理表；`woomin` 專案的 `getXxxApiKeyFromDB` 機制本次不移植，全部走環境變數）
- 不做後台「Email 服務設定」管理頁面（provider 切換只透過部署環境變數，不提供 UI）
- 不修改 `course-lifecycle-email` 既有的寄信觸發邏輯（`sendWelcomeEmailsForOrder`／`sendWelcomeEmail`），該邏輯已經正確存在，本次只補 provider 層
- 不處理「正式站目前沒有任何課程開啟歡迎信開關」這件事——那是 operator 後台操作缺口，不是程式碼缺口，本次 SR 範圍外
- 不在本次 SR 內執行正式站部署動作（設定 `EMAIL_PROVIDER=tosend` 並把 `TOSEND_API_KEY` 帶進容器環境變數）；tasks.md 最後會列一條部署提醒，但那是 apply 完成、程式碼合併後的手動動作

## Capabilities

### New Capabilities

- `mail-provider-routing`: email provider 選擇與 fallback 機制（resend／smtp／zsend／tosend 四合一路由層），provider 缺憑證時的降級行為

### Modified Capabilities

（無）

## Impact

- Affected specs: `mail-provider-routing`（新增）
- Affected code:
  - `packages/mail/provider/index.ts`（路由邏輯重寫）
  - `packages/mail/provider/tosend.ts`（新增）
  - `packages/mail/provider/zsend.ts`（新增）
  - `packages/mail/provider/nodemailer.ts`（環境變數命名調整）
  - `packages/mail/provider/index.test.ts`（新增測試）
  - `.env.example`（新增環境變數說明）
- Dependencies 新增：無（ToSend／ZSend 都用原生 `fetch`，不需要額外 npm 套件；SMTP 沿用既有 `nodemailer`）
- 環境變數新增：`EMAIL_PROVIDER`、`TOSEND_API_KEY`、`TOSEND_FROM_EMAIL`、`TOSEND_API_BASE_URL`、`ZSEND_API_KEY`、`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_SECURE`
