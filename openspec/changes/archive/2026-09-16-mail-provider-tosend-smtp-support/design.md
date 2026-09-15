## Context

`packages/mail` 是 StartKiter 的共用寄信套件，對外只有一個入口 `sendEmail`（`packages/mail/lib/send.ts` → `provider/index.ts` 的 `send`）。目前 `provider/index.ts` 只 import `console` 和 `resend` 兩個 provider，正式環境（`NODE_ENV === "production"`）不管有沒有設 `RESEND_API_KEY` 都硬寫死呼叫 `resendSend`；`RESEND_API_KEY` 未設定時，`resend.ts` 內的 `getResendClient()` 會直接 `throw new Error(...)`，讓呼叫方（例如 `sendWelcomeEmail`）的 try/catch 捕捉並記錄成 `FAILED`。

`packages/mail/provider/nodemailer.ts`（SMTP）已經寫好但從未被 `index.ts` import。`.env` 已有完整的 ToSend 憑證（`TOSEND_API_KEY`／`TOSEND_FROM_EMAIL`／`TOSEND_API_BASE_URL`），但 codebase 裡沒有任何 provider 實作去讀它們。

姊妹專案 `/Users/fishtv/Development/B-產品/products/woomin/dev/lib/email-transport.ts` 已經有一份驗證可用、四 provider 合一（Resend／SMTP／ZSend／ToSend）+ DB 設定覆蓋 + fallback 鏈的實作，是這次移植的參考藍本。StartKiter 版本刻意精簡：不做 DB 覆蓋（沒有對應的 site-setting 表），只做環境變數路由 + fallback。

## Goals / Non-Goals

**Goals:**
- `EMAIL_PROVIDER` 環境變數能明確指定要用哪個 provider（`resend`／`smtp`／`zsend`／`tosend`）
- 指定的 provider 缺必要憑證時，依固定順序 fallback 到下一個可用的 provider，而不是直接失敗
- 開發環境所有 provider 都無憑證時，維持現有行為（fallback 到 `console` provider，印在終端機不發真信）
- 正式環境所有 provider 都無憑證時，明確拋錯（不能靜默吞掉，呼叫方要能記錄到 `email_delivery_log` 的 `FAILED` 狀態）

**Non-Goals:**
- 不做後台 UI 可切換 provider（沿用 `woomin` 的 DB 覆蓋機制不在範圍內）
- 不改變 `sendWelcomeEmail`／`sendWelcomeEmailsForOrder` 的觸發時機與判斷邏輯
- 不處理「正式站尚無課程開啟歡迎信開關」這個資料面缺口

## Decisions

### Provider 介面對齊 SendEmailHandler 而非搬移 woomin 的 EmailTransport

`woomin` 的 `EmailTransport.send()` 回傳 `Promise<EmailSendResult>`（含 `messageId`），StartKiter 既有 `SendEmailHandler` 型別回傳 `Promise<void>`。新增的 `tosend.ts`／`zsend.ts` 直接實作 `SendEmailHandler`，內部呼叫 REST API 後只在非 2xx 回應時 `throw`，成功時不回傳訊息 ID（呼叫方目前也沒有使用 `messageId` 的地方）。

**Alternatives Considered**：
1. 完整搬移 `EmailTransport` 介面（含 `EmailSendResult`），連帶把 `resend.ts`／既有 `SendEmailHandler` 型別都改掉——否決，影響面過大，現有呼叫方（`send.ts`、所有寄信模板呼叫處）都要跟著改型別，超出本次 SR 範圍。
2. 讓新 provider 回傳 `Promise<void>` 但內部吞掉 message id ——採用此案，改動面最小，符合現有介面契約。

### Provider 選擇邏輯：明確指定優先於自動 fallback

`getEmailProvider()` 讀 `EMAIL_PROVIDER` 環境變數；若該 provider 缺憑證，才進入固定 fallback 鏈 `zsend → tosend → resend → smtp`（沿用 `woomin` 原始順序）。若 `EMAIL_PROVIDER` 未設定，直接從 fallback 鏈的第一個開始找。

**Alternatives Considered**：
1. `EMAIL_PROVIDER` 缺憑證時直接報錯，不 fallback——否決，會讓「部署時忘記帶某個 provider 的完整憑證」直接變成寄信全滅，不利於漸進式修復。
2. Fallback 順序改成 `tosend → smtp → resend → zsend`（優先用 `.env` 已經有憑證的 tosend）——否決，維持跟 `woomin` 一致的順序，降低未來兩專案對照文件的落差；且目前 `.env` 只有 tosend 有憑證，不管哪個排序結果相同，先維持原始順序留 Open Question。

### SMTP 環境變數命名改用 SMTP_* 而非既有 MAIL_*

現有 `nodemailer.ts` 讀 `MAIL_HOST`／`MAIL_PORT`／`MAIL_USER`／`MAIL_PASS`，這組命名目前沒有任何 `.env` 設定使用中（grep 確認 `.env` 無 `MAIL_HOST` 等變數）。改為 `SMTP_HOST`／`SMTP_PORT`／`SMTP_USER`／`SMTP_PASS`／`SMTP_SECURE`，跟 `woomin` 一致。

**Alternatives Considered**：
1. 保留 `MAIL_*` 命名，只新增 `tosend`/`zsend`——否決，`MAIL_FROM`（`packages/mail/config.ts` 已用）跟 `MAIL_HOST` 前綴相同但語意不同（寄件位址 vs SMTP 主機），容易讓人誤以為兩者相關；改用 `SMTP_*` 前綴語意更明確。
2. 兩種命名並存（`MAIL_HOST` 或 `SMTP_HOST` 都讀）——否決，增加不必要的分支複雜度，且目前沒有任何正式環境依賴 `MAIL_HOST`，沒有相容性負擔。

## Implementation Contract

**行為**：呼叫方（`sendEmail` / `packages/mail` 的所有現有呼叫處）行為不變——傳入 `SendEmailParams`，成功回傳 `void`，失敗時 `throw Error`。差異只在底層實際呼叫哪個 provider。

**介面**：
- `packages/mail/provider/tosend.ts` 匯出 `send: SendEmailHandler`，內部：
  - 讀 `process.env.TOSEND_API_KEY`（必要，缺少時由呼叫端 `index.ts` 判斷跳過此 provider，不在 `tosend.ts` 內部拋錯）
  - `POST {process.env.TOSEND_API_BASE_URL ?? "https://api.tosend.com/v2"}/emails`，header `Authorization: Bearer ${TOSEND_API_KEY}`
  - body：`from`／`to` 轉換為 `{ name?, email }` 結構（沿用 `woomin` 的 `parseEmailAddress` 邏輯：解析 `"Name <email>"` 格式）
  - 非 2xx 回應：`throw new Error(`ToSend API error (${status}): ${body}`)`
- `packages/mail/provider/zsend.ts` 匯出 `send: SendEmailHandler`，結構同上但呼叫 `https://api.zeabur.com/api/v1/zsend/emails`，body 為單純 JSON（不需要 `parseEmailAddress`，直接傳 email 字串陣列）
- `packages/mail/provider/nodemailer.ts` 改讀 `SMTP_HOST`／`SMTP_PORT`／`SMTP_USER`／`SMTP_PASS`／`SMTP_SECURE`（`SMTP_SECURE === "true"` 才視為 true，其餘一律 false）
- `packages/mail/provider/index.ts` 匯出的 `send` 邏輯：
  1. 讀 `EMAIL_PROVIDER`（值需為 `resend`／`smtp`／`zsend`／`tosend` 其一，否則視為未指定）
  2. 依指定的 provider 檢查對應憑證是否存在（`tosend`→`TOSEND_API_KEY`、`zsend`→`ZSEND_API_KEY`、`resend`→`RESEND_API_KEY`、`smtp`→`SMTP_HOST`）；存在就用該 provider
  3. 不存在（或未指定 `EMAIL_PROVIDER`）：依序檢查 `zsend → tosend → resend → smtp` 憑證，用第一個有憑證的
  4. 都沒有憑證：`NODE_ENV !== "production"` 時 fallback `console`；正式環境 `throw new Error("No email provider is configured (checked EMAIL_PROVIDER, TOSEND_API_KEY, ZSEND_API_KEY, RESEND_API_KEY, SMTP_HOST)")`

**失敗模式**：任何 provider 呼叫失敗（HTTP 非 2xx、網路錯誤、SMTP connect 失敗）一律 `throw`，交由呼叫方（`sendWelcomeEmail` 等）的既有 try/catch 記錄為 `FAILED`；本次不新增額外的重試機制。

**驗收標準**：
- `packages/mail/provider/index.test.ts` 覆蓋：(a) `EMAIL_PROVIDER=tosend` 且有 `TOSEND_API_KEY` → 選中 tosend；(b) `EMAIL_PROVIDER=tosend` 但無 `TOSEND_API_KEY` → fallback 到下一個有憑證的 provider；(c) 都無憑證 + 非正式環境 → fallback console；(d) 都無憑證 + 正式環境 → throw
- `pnpm --filter @startkiter/mail test` 全綠
- 手動驗證（apply 完成後、部署前）：本機用 `EMAIL_PROVIDER=tosend` + 真實 `TOSEND_API_KEY` 跑一次 `sendEmail`，確認 ToSend Dashboard 收到送達記錄

**範圍邊界**：只改 `packages/mail/provider/` 底下的路由與 provider 實作 + `.env.example` 文件；不碰 `packages/mail/lib/send.ts`、`packages/mail/emails/`、任何呼叫 `sendEmail` 的業務邏輯層代碼。

## Risks / Trade-offs

[Risk] Fallback 邏輯讓「明明指定了 tosend 但憑證填錯」的情況被靜默吞掉、改用別的 provider 寄出，掩蓋設定錯誤 → Mitigation：`index.ts` 在 fallback 發生時用 `packages/logs` 的 `logger.warn` 記一筆「指定的 provider 不可用，已 fallback 到 X」，方便事後從 log 追查，但不阻斷寄信本身。

[Risk] SMTP 環境變數改名（`MAIL_*` → `SMTP_*`）如果之後才發現正式站或別的環境已經在用舊名稱，會造成 SMTP provider 悄悄失效 → Mitigation：apply 階段的任務會先 grep 確認 `MAIL_HOST`／`MAIL_PORT`／`MAIL_USER`／`MAIL_PASS` 目前沒有任何 `.env*` 檔案或容器環境變數在使用（design 撰寫時已用 `grep` 確認本機 `.env` 無此變數，apply 時對正式站容器環境變數再查一次）。

[Risk] ToSend／ZSend 的 REST API 回應格式與本次實作假設（`message_id` / `id` 欄位）不符，導致解析失敗 → Mitigation：解析失敗時仍視為成功（送出的 HTTP 狀態碼才是成敗依據，訊息 ID 只是附加資訊，非必要欄位），不因為欄位缺失丟錯。

## Migration Plan

1. 開發分支完成 provider 實作 + 測試，`pnpm --filter @startkiter/mail test` 全綠
2. Code review 通過、合併進 main
3. **部署步驟（apply 完成後的手動動作，列在 tasks.md 最後一條，不算入程式碼任務）**：
   - 正式站容器（Coolify `lmfjp5suzh08plloijhha5ke`）環境變數新增 `EMAIL_PROVIDER=tosend`（`TOSEND_API_KEY`／`TOSEND_FROM_EMAIL`／`TOSEND_API_BASE_URL` 已存在於部署用的 `.env`，需確認這次部署時真的帶進容器——先前查證只看到 `TOSEND_FROM_EMAIL` 進了容器，`TOSEND_API_KEY` 沒有）
   - 觸發 Coolify 重新部署
   - 部署後用一筆測試訂單或後台功能觸發一次寄信，查 `email_delivery_log` 表確認 `status=SENT`
4. **回滾策略**：`EMAIL_PROVIDER` 環境變數改回未設定或空值，容器重啟後即回到 fallback 鏈行為（若當時 Resend 也沒設定，等同回到目前的失敗狀態，不會比部署前更差）；程式碼層面若要回滾，`git revert` 這次合併的 commit 即可，`provider/index.ts` 的舊邏輯沒有被破壞式修改。

## Open Questions

- Fallback 順序固定沿用 `woomin` 的 `zsend → tosend → resend → smtp`，還是要調整成優先用目前唯一有真實憑證的 `tosend`（例如 `tosend → resend → smtp → zsend`）？目前傾向維持原順序（因為結果一致，只有未來新增憑證時才有差異），若 Fish 有不同偏好在 apply 前確認。
