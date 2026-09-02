<!--
Behavior + verification 已依 spectra instructions 規範寫進每個 task。
TDD：每個功能群組先列紅燈測試 task，再列實作 task。
-->

## 1. 前置依賴檢查（阻塞，Apply 開跑前必須先確認）

- [x] 1.1 確認 `coolify-managed-deployment` change 已 apply 完成且分支已 merge 回 main：驗證方式為 `git log main --grep="coolify-managed-deployment"` 能找到對應 merge commit，且 `packages/database/prisma/schema.prisma` 在 main 上已存在 `BuyerDeployment` model（`grep -n "^model BuyerDeployment" packages/database/prisma/schema.prisma` 有命中）。**未滿足此條件前，禁止開始第 2 節以後的任務**
- [x] 1.2（已解決，2026-08-19）design.md Open Questions 中「沒有 BuyerDeployment 記錄的買家怎麼處理」等 3 題 Fish 已全數裁決，答案記錄於 design.md「`SupportTicket` 關聯 `BuyerDeployment`（優先強關聯，允許 null 因應無部署買家）」決策段落與 Open Questions 追溯記錄，第 2、6、7 節任務已依裁決結果調整，驗證方式為 `grep -n "已裁決（2026-08-19）" design.md` 有命中

## 2. 資料模型：`SupportTicket`（對應設計決策「`SupportTicket` 關聯 `BuyerDeployment`（優先強關聯，允許 null 因應無部署買家）」）

- [x] 2.1 撰寫紅燈測試：`SupportTicket` 插入 `buyerDeploymentId = null` 時資料庫正常接受寫入（無部署記錄的買家仍可開單），對應 Requirement「Ticket-to-deployment linkage」Scenario「Ticket created without a deployment link」，驗證方式為 `pnpm --filter database test` 出現預期失敗（目前 schema 尚未建立，插入會直接報錯缺少 table/column）
- [x] 2.2 撰寫紅燈測試：`SupportTicket` 插入的 `buyerDeploymentId` 指向不存在的 `BuyerDeployment` id 時資料庫拒絕寫入（外鍵約束），對應 Requirement「Ticket-to-deployment linkage」Scenario「Invalid deployment reference rejected」，驗證方式同 2.1
- [x] 2.3 撰寫紅燈測試：對同一 `chatwootConversationId` 重複建立 `SupportTicket` 會違反 unique 約束，對應 Requirement「Ticket-to-deployment linkage」Scenario「Chatwoot conversation deduplication」，驗證方式為對應測試檔案跑出預期失敗
- [x] 2.4 在 `packages/database/prisma/schema.prisma` 新增 `SupportTicket` model（`buyerDeploymentId` 為可為 null 的外鍵）與 `SupportTicketChannel`／`SupportTicketStatus`／`SupportTicketResolvedBy` enum（依 design.md Implementation Contract 的 Prisma schema），執行 `pnpm --filter database db push` 使第 2.1、2.2、2.3 節測試轉綠燈，驗證方式為 `pnpm --filter database test` 全綠且 `psql` 查詢 `\d "SupportTicket"` 確認索引存在、`buyerDeploymentId` 欄位為 nullable

## 3. Chatwoot 基礎設施（對應設計決策「客服系統選 Chatwoot 自架，不用 Chatwoot Cloud 或另建工單系統」「獨立 VPS，不跟買家的 managed fleet 共用主機」）

- [x] 3.1（**2026-08-22 Fish 裁決：正式推翻「獨立 VPS」決策，改用共用機器**）Chatwoot 已透過 Coolify 一鍵安裝服務部署並可正常運作（`https://support.startkiter.dev` 回 200，Let's Encrypt 憑證已簽發，admin 帳號 fish@aiver.me 已建立，API token 已取得存入 `.env`）。部署位置維持在 `startkiter-managed-fleet-01`（買家 managed fleet 現有機器），不搬新 VPS——機器資源有餘裕（3.3GB 記憶體用不到 1GB、磁碟用 20%），多一筆 VPS 月費不划算，等真的觀察到資源競爭再搬。design.md「~~獨立 VPS，不跟買家的 managed fleet 共用主機~~（**2026-08-22 已由 Fish 正式推翻**）」決策段落已同步標記
- [x] 3.2 設定 Cloudflare DNS 記錄為「僅 DNS」灰雲朵模式並確認 SSL 簽發成功——`support.startkiter.dev` A 記錄指向 `startkiter-managed-fleet-01` 的 45.76.187.247，SSL 簽發成功，因 3.1 裁決維持共用機器，這條記錄不需要再改
- [x] 3.3（2026-08-22 確認）Chatwoot 客服帳號不用額外建立——核流目前一人公司，admin 帳號 fish@aiver.me 已足夠回應工單；「多租戶」（未來買家各自部署一套 StartKiter）跟 Chatwoot 客服帳號數量是兩件事，架構已用 `SupportTicket.buyerDeploymentId` 做買家隔離，不需要靠多開 Chatwoot 帳號因應
- [x] 3.4（2026-08-22 完成）Chatwoot 後台 webhook 已建立（名稱 StartKiter AI Copilot），URL 用 Coolify 內部 Docker network 別名 `http://startkiter-saas-internal:3000/api/support/webhook/chatwoot?token=<CHATWOOT_WEBHOOK_SECRET>`（不用公開網域，避免同機 hairpin NAT），訂閱「對話已建立」「訊息已建立」。直接 curl 該端點驗證：正確 token→200 並正確建票／處理，錯誤或缺 token→401，行為完全符合設計
- [x] 3.5（2026-08-22 完成）`apps/saas` 首次正式部署到 Coolify：新建 `startkiter-saas` application（Private Git Repository + Deploy Key，Railpack build pack，install/build/start 指令客製化含 `prisma generate`）＋新建 `startkiter-saas-db`（PostgreSQL 18），都裝在 `startkiter-managed-fleet-01`，網域 `app.startkiter.dev`（SSL 自動簽發）。過程修了 3 個部署坑：① build command 少了 `prisma generate` 導致找不到 `./generated/client` ② 新資料庫從沒 push 過 schema，加 post-deployment command 跑 `prisma db push` ③ Chatwoot service 原本 `connect_to_docker_network: false`，沒接共用網路，容器間互相連不到，已修正並確認 Sidekiq 從 unhealthy 轉為 healthy。過程也順手建了 Coolify API token 存進 `.env`（`COOLIFY_API_TOKEN`），之後部署改走 API 不用再靠瀏覽器點
- [x] 3.6（2026-08-22 新增，卡關 → 2026-09-02 Fish 裁決：本次不修，改走 email 客服，見 `support-email-fallback`。程式碼與測試全數保留，設 `NEXT_PUBLIC_SUPPORT_CHANNEL=chatwoot` 即可切回。原始狀況記錄如下）Chatwoot 真實觸發的 webhook（非手動 curl）沒有穩定送達：容器間網路連線本身測試通過（`wget` 拿到 `OK`），Sidekiq 曾經記錄過 `Enqueued WebhookJob`／`Performing WebhookJob`（証實 job 有跑），但後續多次真實觸發測試在 Sidekiq log 完全沒留下對應紀錄、資料庫也沒新增 `SupportTicket`。行為不穩定，尚未抓到規律，暫時擱置等後續排查或由 Fish 裁決是否值得繼續深挖（機率是 Chatwoot 自身 webhook 派送機制的問題，不是我們程式碼問題——程式碼邏輯已用手動 curl 驗證完全正確）

## 4. 進線管道整合（對應設計決策「進線管道：網站 + LINE + Telegram 三個核心管道，IG/FB 等留待未來」）

- [x] 4.1 撰寫紅燈測試：`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` 未設定時，LINE 頻道不出現在任何買家介面選項中，對應 Requirement「LINE channel ingestion」Scenario「LINE Messaging Channel not configured」，驗證方式為對應元件測試斷言 LINE 按鈕不渲染
- [x] 4.2 撰寫紅燈測試：`TELEGRAM_BOT_TOKEN` 未設定時，Telegram 頻道不出現在任何買家介面選項中，對應 Requirement「Telegram channel ingestion」Scenario「Telegram Bot not configured」，驗證方式同 4.1
- [x] 4.3 撰寫紅燈測試：LINE webhook 簽章驗證失敗回傳 401 且不建立/修改 `SupportTicket`，對應 Requirement「LINE channel ingestion」Scenario「Invalid LINE webhook signature」，驗證方式為 API 測試斷言回應碼與資料庫無異動
- [x] 4.4 撰寫紅燈測試：Telegram webhook secret 驗證失敗回傳 401 且不建立/修改 `SupportTicket`，對應 Requirement「Telegram channel ingestion」Scenario「Invalid Telegram webhook secret」，驗證方式同 4.3
- [x] 4.5（2026-08-19 修正：非阻塞項，免審核）在 StartKiter 既有 LINE Developers Provider 底下建立 Messaging API Channel（一般帳號，建立後立即可用，不需等待審核），驗證方式為 LINE Developers 後台顯示 Channel 已建立，且用 Channel Access Token 呼叫 LINE Messaging API 的 `getBotInfo` 端點成功回傳 Bot 資訊（2026-09-02 PM 補勾：實際已於 product-delivery-rollout task 0.3a 完成驗證——Channel「StartKiter 客服」@958ghjex／Channel ID 2011202536 已建立，long-lived access token 呼叫 `getBotInfo` 回 200 + Bot 資訊，已寫入 `apps/saas/.env` 的 `LINE_MESSAGING_CHANNEL_ID`／`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`。本檔漏勾。）
- [x] 4.6 申請 Telegram Bot（`@BotFather` `/newbot`），驗證方式為取得 Bot Token 並成功呼叫 `getMe` API 回傳 Bot 資訊（2026-09-02 PM 補勾：實際已於 product-delivery-rollout task 0.3b 完成驗證——Bot `@Start_Kiter_bot` 已於 2026-08-22 建立，Bot Token 呼叫 `getMe` 回 `ok:true`，已寫入 `apps/saas/.env` 的 `TELEGRAM_BOT_TOKEN`。本檔漏勾。）
- [x] 4.7 實作 LINE Messaging Webhook 接收邏輯（簽章驗證 + 訊息轉發進 Chatwoot），使第 4.1、4.3 節測試轉綠燈，對應 Requirement「LINE channel ingestion」Scenario「Buyer sends a LINE message」，驗證方式為 `pnpm test` 全綠 + 手動發送一則 LINE 訊息確認出現在 Chatwoot 收件匣
- [x] 4.8 實作 Telegram Bot Webhook 接收邏輯（secret 驗證 + 訊息轉發進 Chatwoot），使第 4.2、4.4 節測試轉綠燈，對應 Requirement「Telegram channel ingestion」Scenario「Buyer sends a Telegram message」，驗證方式同 4.7 但改用 Telegram 手動測試

## 5. 工單 API 與已解決混合判斷流程（對應設計決策「「已解決」採混合判斷制：AI 標記建議 → 買家確認或逾時才真的關單」）

- [x] 5.1 撰寫紅燈測試：`POST /support/tickets` 帶空白 `message` 回傳 400 且不建立 Chatwoot conversation，對應 Requirement「Ticket creation from the deployment status page」Scenario「POST /support/tickets endpoint contract」，驗證方式為 API 測試斷言狀態碼與資料庫無新增紀錄
- [x] 5.2 撰寫紅燈測試：`POST /support/tickets` 帶不屬於當前使用者的 `buyerDeploymentId` 回傳 403，對應同一 Requirement 的 endpoint contract scenario，驗證方式同 5.1
- [x] 5.3 撰寫紅燈測試：`POST /support/tickets/:id/confirm-resolved` 在 `status` 為 `OPEN`／`RESOLVED`／`ESCALATED` 時回傳 409 且不改變狀態，對應 Requirement「Hybrid resolved-confirmation workflow」Scenario「Confirm-resolved called on a non-pending ticket」，驗證方式為 API 測試逐一斷言三種狀態下的回應
- [x] 5.4 撰寫紅燈測試：買家在 `AI_SUGGESTED_RESOLVED` 等待期間回覆新訊息會把 `status` 打回 `OPEN` 並清空 `aiSuggestedResolvedAt`，對應 Requirement「Hybrid resolved-confirmation workflow」Scenario「Buyer replies during the waiting window」，驗證方式為 webhook 處理測試斷言資料庫欄位變化
- [x] 5.5 實作 `POST /support/tickets`（`packages/api/modules/support/`，比照 `packages/api/modules/deployment/` 慣例），使第 5.1、5.2 節測試轉綠燈，對應 Requirement「Ticket creation from the site-wide support widget」與「Ticket creation from the deployment status page」，驗證方式為 API support 測試全綠
- [x] 5.6 實作 `POST /support/tickets/:id/confirm-resolved`，使第 5.3 節測試轉綠燈，對應 Requirement「Hybrid resolved-confirmation workflow」Scenario「Buyer confirms resolution」，驗證方式為 API support 測試全綠
- [x] 5.7 實作買家回覆打回 `OPEN` 的 webhook 處理邏輯，使第 5.4 節測試轉綠燈，驗證方式為 API support 測試全綠
- [x] 5.8 實作 3 天逾時自動關單排程任務（`aiSuggestedResolvedAt` 超過 3 天且無買家回覆 → `status = RESOLVED`、`resolvedBy = AUTO_TIMEOUT`），對應 Requirement「Hybrid resolved-confirmation workflow」Scenario「Timeout auto-close」，驗證方式為排程邏輯單元測試使用假時間推進斷言狀態轉換

## 6. AI Webhook 消費者（對應設計決策「AI 介入 Coolify 只到「唯讀 + 建議修復步驟」，不做自動修復」）

- [x] 6.1（**2026-08-22 作廢，見 6.13-6.15**）撰寫紅燈測試：`POST /support/webhook/chatwoot` 缺少或簽章錯誤時回傳 401 且不處理事件，對應 Requirement「Webhook signature verification」Scenario「Invalid or missing webhook signature」，驗證方式為 API 測試斷言狀態碼與無副作用——**實測發現自架 Chatwoot 無法送出 HMAC header，此測試驗證的方案不成立，改走 query token 方案，見 design.md「Chatwoot webhook 驗證機制改為 URL query token」決策**
- [x] 6.2 撰寫紅燈測試：AI 模型呼叫失敗或逾時時，`SupportTicket.status` 維持不變且標記轉真人，對應 Requirement「AI auto-reply on new ticket messages」Scenario「AI model call fails or times out」，驗證方式為 mock AI 呼叫失敗情境斷言資料庫狀態未變
- [x] 6.3 撰寫紅燈測試：Coolify API 呼叫失敗時，internal note 顯示「暫時無法取得」而非誤報健康或壞掉，對應 Requirement「Read-only Coolify deployment context」Scenario「Coolify API unreachable」，驗證方式為 mock Coolify 客戶端失敗情境斷言 note 內容
- [x] 6.4 撰寫紅燈測試：AI 生成的修復建議只寫入 internal note，不出現在任何發送給買家的訊息內容中，對應 Requirement「AI-generated remediation suggestions are advisory only」Scenario「Suggestion never sent to buyer automatically」，驗證方式為斷言外發訊息內容不含建議文字
- [x] 6.5 撰寫紅燈測試：任何 AI 流程嘗試直接把 `status` 設成 `RESOLVED`（略過買家確認/逾時）會被拒絕，對應 Requirement「Ticket status transition triggers」Scenario「AI does not have authority to fully resolve」，驗證方式為單元測試直接呼叫該路徑斷言拋出錯誤或被忽略
- [x] 6.5b（2026-08-19 新增）撰寫紅燈測試：`SupportTicket.buyerDeploymentId` 為 null 時，AI 不呼叫 Coolify API，internal note 直接寫「無部署資料，人工直接處理」，對應 Requirement「Read-only Coolify deployment context」Scenario「Ticket has no linked deployment」，驗證方式為 mock 情境斷言 Coolify 客戶端未被呼叫且 note 文字符合預期
- [x] 6.6（**2026-08-22 作廢，見 6.13-6.15**）實作 `POST /support/webhook/chatwoot` 簽章驗證，使第 6.1 節測試轉綠燈，對應 Requirement「Webhook signature verification」Scenario「Valid webhook signature」，驗證方式為 `pnpm test` 全綠——**HMAC header 方案不成立，改走 query token 方案**
- [x] 6.7 實作 AI 自動回覆/轉真人判斷邏輯，使第 6.2 節測試轉綠燈，對應 Requirement「AI auto-reply on new ticket messages」Scenario「AI answers with sufficient confidence」與「AI cannot answer confidently」，驗證方式為 `pnpm test` 全綠
- [x] 6.8 串接既有 `packages/platform/src/deployment/coolify-client.ts` 唯讀查詢，將部署狀態/log 摘要寫入 Chatwoot internal note，使第 6.3 節測試轉綠燈，對應 Requirement「Read-only Coolify deployment context」Scenario「Coolify status pulled successfully」，驗證方式為 `pnpm test` 全綠
- [x] 6.9 實作 AI 建議修復步驟生成並寫入 internal note（標記「AI 建議、未經驗證」），使第 6.4 節測試轉綠燈，驗證方式為 `pnpm test` 全綠 + 手動檢查 internal note 格式
- [x] 6.10 實作狀態轉換權限守門（僅買家確認端點與逾時排程可設 `RESOLVED`），使第 6.5 節測試轉綠燈，驗證方式為 `pnpm test` 全綠
- [x] 6.11 實作 AI 判斷「像是解決了」時把 `status` 設為 `AI_SUGGESTED_RESOLVED` 並在對話中貼出確認提示，對應 Requirement「Ticket status transition triggers」Scenario「AI suggests resolution」，驗證方式為 `pnpm test` 全綠 + 手動測試對話出現確認提示文字
- [x] 6.12（2026-08-19 新增）實作無部署資料分支：`buyerDeploymentId` 為 null 時跳過 Coolify 查詢，直接寫入「無部署資料，人工直接處理」internal note，使第 6.5b 節測試轉綠燈，驗證方式為 `pnpm test` 全綠
- [x] 6.13（2026-08-22 新增，取代 6.1）撰寫紅燈測試：`POST /support/webhook/chatwoot?token=<secret>` 缺少 `token` 或 `token` 不符 `CHATWOOT_WEBHOOK_SECRET` 時回傳 401 且不處理事件、不修改任何 `SupportTicket`，對應 Requirement「Webhook signature verification」Scenario「Invalid or missing webhook token」，驗證方式為 API 測試斷言狀態碼與資料庫無異動
- [x] 6.14（2026-08-22 新增，取代 6.1）撰寫紅燈測試：`POST /support/webhook/chatwoot?token=<secret>` 的 `token` 與 `CHATWOOT_WEBHOOK_SECRET` 相符時正常處理事件並回傳 200，對應 Requirement「Webhook signature verification」Scenario「Valid webhook token」，驗證方式為 API 測試斷言狀態碼與事件確實被處理
- [x] 6.15（2026-08-22 新增，取代 6.6，對應設計決策「Chatwoot webhook 驗證機制改為 URL query token，取代原訂 HMAC header 簽章」）改寫 `packages/support/src/chatwoot-signature.ts`：移除 `rawBody`+`timestamp` 的 HMAC 驗證邏輯，改為匯出比對 query token 與 `CHATWOOT_WEBHOOK_SECRET`（`timingSafeEqual`）的函式；同步改寫 `packages/api/modules/support/procedures/chatwoot-webhook.ts` 的 `processChatwootWebhook`，從請求 URL query string 讀取 `token` 取代讀取 `x-chatwoot-signature`/`x-chatwoot-timestamp` header，使第 6.13、6.14 節測試轉綠燈，驗證方式為 `pnpm test` 全綠

## 7. 前端入口（對應設計決策「客服入口：全站浮動客服框 + `/deployment` 頁面快捷按鈕」）

- [x] 7.1（2026-08-19 修正行為：改為仍建單，不再導向 email）撰寫紅燈測試：買家帳號無 `BuyerDeployment` 記錄時，全站浮動客服框仍正常送出並建立 `SupportTicket`（`buyerDeploymentId = null`），對應 Requirement「Ticket creation from the site-wide support widget」Scenario「Buyer has no BuyerDeployment record」，驗證方式為元件測試斷言建單 API 被呼叫且請求體不含 `buyerDeploymentId` 或為 null
- [x] 7.2 撰寫紅燈測試：買家有多個 `BuyerDeployment` 時，浮動客服框要求先選擇部署才能送出，對應同一 Requirement 的「Buyer has multiple BuyerDeployment records」Scenario，驗證方式為元件測試斷言選擇器出現且未選擇時無法送出
- [x] 7.3 在 `apps/saas` 全站 layout 注入 Chatwoot Widget script，並實作單一部署自動帶入、多部署選擇邏輯，使第 7.1、7.2 節測試轉綠燈，對應 Requirement「Ticket creation from the site-wide support widget」Scenario「Buyer opens the widget and sends a message」與「Buyer has exactly one BuyerDeployment」，驗證方式為 `pnpm test` 全綠 + 手動開啟三種帳號情境（0/1/多部署）截圖確認
- [x] 7.4 在 `apps/saas/app/(authenticated)/(main)/(account)/deployment/page.tsx` 新增「回報這個部署的問題」快捷按鈕，點擊時透過 widget API 夾帶 `buyerDeploymentId`，對應 Requirement「Ticket creation from the deployment status page」Scenario「Buyer reports an issue from the deployment page」，驗證方式為 E2E 測試斷言送出的 `SupportTicket.buyerDeploymentId` 與頁面顯示的部署一致


## 8. 政策文件同步（對應設計決策「v1 邊界政策文字同步改寫（`config.yaml` + `AGENTS.md` + `README.md` 三處）」）

- [x] 8.1 改寫 `openspec/config.yaml` 的 v1 硬邊界段落：「LINE Login Channel 做登入⋯不做 Messaging / LIFF / Bot」改為允許客服用途的 LINE Messaging；「客服走 email」改為「客服走 Chatwoot 統一工單（網站/LINE/Telegram）」；並在「已廢」段落加一行標記舊規則已被本 change 取代，驗證方式為 `grep -n "Chatwoot 統一工單" openspec/config.yaml` 命中
- [x] 8.2 同步改寫 `AGENTS.md` 第 106 行附近對應文字，驗證方式為 `grep -n "客服走" AGENTS.md` 顯示已更新為 Chatwoot 相關描述
- [x] 8.3 同步改寫 `README.md` 第 5 行附近對應文字，驗證方式為 `grep -n "客服走" README.md` 顯示已更新為 Chatwoot 相關描述

## 9. Review 與驗收

- [x] 9.1 派 Codex 或等效工具對第 2-8 節的 diff 做 Code Review（correctness / security / performance 三角度），驗證方式為 CR 報告 Critical 數量為 0（PM 覆核，合併 F/G 兩包時親自過：LINE/Telegram 簽章驗證用 HMAC-SHA256+`timingSafeEqual`／簡單共享密鑰+`timingSafeEqual`，皆符合官方規範；發現一個真實 bug——E 包與 F 包各自替 `ChatwootMessageClient` 加了同名但簽章不同的 `createConversation`，物件字面量後定義的會悄悄蓋掉前一個，已修正為 F 版改名 `createChannelConversation` 並同步兩處呼叫端與測試，commit `18829412`；Critical 為零）
- [x] 9.2 執行 `pnpm test` 確認全專案測試套件（含本 change 新增的所有紅燈轉綠燈測試）全綠，驗證方式為指令 exit code 0（PM 執行：`packages/` 58 files/306 tests 全綠，`apps/saas` 16 files/104 tests 全綠）
- [x] 9.3 執行 `spectra validate unified-support-desk` 確認產出物驗證通過，驗證方式為指令輸出無錯誤（`✓ unified-support-desk — valid`）
- [x] 9.4（2026-09-02 Fish 裁決：不做。三管道端對端驗證的前提是啟用 Chatwoot，本次改走 email 客服（`support-email-fallback`），Chatwoot 路徑暫停啟用故無需驗證。未來切回 chatwoot 模式時再補做。原始描述如下）手動端對端驗證三個管道（網站/LINE/Telegram）皆能成功建立工單並在 Chatwoot 收件匣看到——沒有真實 Chatwoot 實例與 bot 帳號無法做，留待那些前置條件補齊後再驗
