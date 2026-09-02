## Why

買家網站出問題時，目前唯一出路是「請聯絡我們」，沒有講清楚怎麼聯絡，實際上要靠人工引導買家加 LINE 或寄信，等於還是斷點式的人工客服。現在有 AI，這個「聯絡」動作本身應該自動化：買家只跟網站上的一個介面互動，背後怎麼分派、怎麼通知 StartKiter 團隊是系統的事，不該再靠人工銜接。

## What Changes

- 新增自架 Chatwoot（開源客服收件匣），部署在既有 Coolify Cloud 帳號下的獨立 VPS（跟 `coolify-managed-deployment` 的 buyer-managed fleet 分開，這是內部工具不是買家部署對象）
- 新增 3 個進線管道，全部匯進 Chatwoot 同一個收件匣，每則新訊息自動變成一張 conversation（= 工單）：
  - 網站全站浮動客服框（Chatwoot 官方 widget）
  - `/deployment` 頁面新增「回報這個部署的問題」快捷按鈕，自動帶入 `BuyerDeployment` ID 開單
  - LINE 官方帳號（Messaging API，需另申請 Messaging Channel，與現有 Login Channel 分開）
  - Telegram Bot（`@BotFather` 申請，免審核）
- 新增工單資料模型 `SupportTicket`，強關聯 `BuyerDeployment`（每張工單綁定「哪個買家的哪個部署」）
- 新增 AI Webhook 消費者：接 Chatwoot Webhook，收到新訊息後：
  - 答得出來的自動回覆
  - 答不出來的標記轉真人
  - 額外唯讀串接 `coolify-managed-deployment` 的 Coolify API 客戶端：自動拉該部署的狀態/log 摘要貼進工單，並生成「建議修復步驟」草稿給工程師參考，**不自動執行任何指令**
- 新增「已解決」混合判斷流程：AI 判斷像是解決了 → 標記「AI 建議已解決」但不真的關單 → 等買家按確認或逾時（3 天）才真的關單；買家在等待期間若又回覆，自動打回「處理中」狀態
- **BREAKING**：修改專案既有 v1 硬邊界——`openspec/config.yaml`、`AGENTS.md`、`README.md` 目前明文「LINE Login Channel 做登入⋯不做 Messaging / LIFF / Bot」「客服走 email」，這兩條規則需要改寫成「允許 LINE Messaging（客服用途）」「客服走 Chatwoot 統一工單（網站/LINE/Telegram）」

## Capabilities

### New Capabilities

- `unified-support-inbox`：Chatwoot 自架基礎設施、3 管道路由（網站/LINE/Telegram）、`SupportTicket` 資料模型與 `BuyerDeployment` 關聯、已解決混合判斷流程（AI 標記→買家確認/逾時關單）
- `ai-support-copilot`：AI Webhook 消費者行為——自動回覆/轉真人判斷、唯讀串接 Coolify 狀態與 log、生成建議修復步驟草稿（不自動執行）

### Modified Capabilities

(none — 此變更為全新能力，不修改既有 spec 的規格行為。專案政策文件（config.yaml、AGENTS.md、README.md）的文字更新記錄在 design.md 與 tasks.md，屬於文件同步，非 spec 層級的 requirement 變更，不建立 delta spec)

## Impact

- **Affected specs**：新增 `specs/unified-support-inbox/spec.md`、`specs/ai-support-copilot/spec.md`
- **Affected code**：
  - `packages/database` — 新增 `SupportTicket` Prisma model（外鍵至 `BuyerDeployment`）
  - `packages/notifications` — 現有站內通知（買家方向）架構可參考，不直接複用（方向相反：這次是買家→StartKiter 團隊）
  - `packages/platform/src/deployment/coolify-client.ts` — 新增唯讀呼叫（拉 log/狀態），沿用 `coolify-managed-deployment` 既有客戶端
  - `apps/saas/app/(authenticated)/(main)/(account)/deployment/page.tsx` — 新增「回報問題」快捷按鈕
  - `apps/saas` 全站 layout — 新增 Chatwoot widget script 注入
  - 新增 `packages/support` 或等效模組 — Chatwoot Webhook 接收 endpoint、AI 判斷邏輯、LINE Messaging/Telegram Bot 整合
  - `openspec/config.yaml`、`AGENTS.md`、`README.md` — 政策文字更新（v1 邊界修改）
- **Dependencies 新增**：Chatwoot（自架，Docker/Coolify 一鍵服務，非 npm 套件）、可能新增 `@line/bot-sdk`（LINE Messaging）、`node-telegram-bot-api` 或等效套件（Telegram Bot，待 design.md 選型）
- **環境變數新增**：Chatwoot Webhook secret、LINE Messaging Channel Access Token/Secret（與現有 Login Channel 憑證分開）、Telegram Bot Token
- **前置依賴（阻塞）**：本變更需要 `coolify-managed-deployment`（`BuyerDeployment` model、Coolify API 客戶端）先 apply 完並 merge 回 main，才能開始 apply——`BuyerDeployment` 目前只存在未合併的 worktree 分支 `/Users/fishtv/orca/workspaces/startkiter/sr-self-service-plugin-pipeline`，main 上完全沒有這張表
