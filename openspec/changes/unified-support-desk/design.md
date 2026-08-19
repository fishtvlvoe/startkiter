## Context

買家網站出問題時，現有唯一出路是被動的「請聯絡我們」文案，沒有講清楚怎麼聯絡，實務上要靠人工引導買家加 LINE 或寄信。老闆要的效果：買家只跟網站上「一個介面」互動，背後怎麼分派、通知 StartKiter 團隊是系統的事，不該有「有問題請加 LINE」這種需要人工引導的斷點。

這張 change 建立在 `coolify-managed-deployment`（另一張同時期 change，尚未 merge 回 main）之上：那張 change 定義了「StartKiter 團隊能直接介入買家部署」的能力（Coolify API 客戶端、`BuyerDeployment` 資料模型、買家狀態面板 `/deployment` 頁面）。這張 change 把「買家回報問題」這個入口跟那個既有能力串起來，讓 AI 能唯讀查看部署狀態、生成修復建議，而不是憑空猜買家發生什麼事。

現行專案的 v1 硬邊界（`openspec/config.yaml`）明文規定「LINE Login Channel 做登入⋯不做 Messaging / LIFF / Bot」「客服走 email」。`docs/discuss/line-login-from-line-hub.md` 當初就把 Messaging/LIFF 標記為「v2 才考慮」，這張 change 就是把那塊 v2 範圍提前拉出來做，不是無中生有推翻決定。

## Goals / Non-Goals

**Goals:**

- 買家在網站上任何頁面都能開口求助，不用先被教「怎麼找到我們」
- 客服訊息不管從網站小工具、LINE、Telegram 哪個管道進來，StartKiter 團隊統一在一個收件匣（Chatwoot）處理，不用切換多個 App
- AI 先做第一輪回應與資訊整理（唯讀查部署狀態/log、生成修復建議），把人工只留給真正需要判斷的部分
- 工單天生帶著「這是哪個買家的哪個部署」的上下文，不用讓買家重複打字說明

**Non-Goals:**

- **AI 自動修復（自動觸發 Coolify 重啟/重新部署）不在本輪範圍**——本輪 AI 只能唯讀查狀態、生成建議修復步驟草稿，執行動作必須工程師手動確認。等 AI 判斷準確度被驗證夠可靠，才會啟動下一輪 change 評估升級到自動修復。這是明確排除、保留給未來的路徑，不是遺漏。
- **Instagram / Facebook 等其他社群客服管道不在本輪範圍**。Chatwoot 技術上支援更多管道，但本輪 AI bot 只串接 3 個核心管道：網站客服框、LINE、Telegram。行銷端未來若要接 IG/FB 導流，跟這輪的「AI bot 自動回應客服工單」是兩件事，留待下一輪評估。
- **不修改 `coolify-managed-deployment` 的任何既有程式碼或資料模型**，只新增唯讀呼叫；那張 change 本身未完成的部分（`provisionServer`/`submitCredential` 真的呼叫 Coolify API、endpoint 路徑驗證）不屬於這張 change 的範圍，這張 change 假設它已經 apply 完成。
- **不做工單系統的 SLA/客服排班/多客服帳號權限分級**——Chatwoot 本身支援，但本輪只設最低限度的帳號（1-5 個客服帳號，跟目前團隊規模一致），不特別設計權限矩陣。
- **不改動 `packages/notifications`（買家方向的站內通知）的行為**——那是「系統通知買家」，這張 change 是「買家通知 StartKiter 團隊」，方向相反，不合併也不互相依賴實作。

## Decisions

### 客服系統選 Chatwoot 自架，不用 Chatwoot Cloud 或另建工單系統

自架部署在既有 Coolify Cloud 帳號下的獨立 VPS，官方提供一鍵安裝服務，沿用 `coolify-managed-deployment` 已驗證過的 SOP（Cloudflare DNS 灰雲朵才能簽 SSL、Public Git 來源要手動接 webhook）。

**Alternatives considered：**
- **Chatwoot Cloud（官方託管版）**：否決。API/Webhook 存取要付費方案起跳 $19/agent/月，人數一多會疊；資料留在第三方，跟這個專案「零耦合外部帳號」的傾向不符。
- **從零自建工單系統**：否決。Chatwoot 已經做好多管道路由（LINE/Telegram/Web Widget 統一變成 conversation）、conversation 狀態機、Webhook 事件系統，自建等於重造一遍這些基礎設施，成本遠高於自架一套開源方案。
- **Zendesk / Freshdesk 等商用 SaaS**：否決。月費更高、黑盒 SaaS 難跟 Coolify 唯讀查詢整合進同一個 AI 判斷流程，且多數方案的 API 存取也要較高方案才開放。

### 獨立 VPS，不跟買家的 managed fleet 共用主機

Chatwoot 架在 Coolify Cloud 帳號下**新增一台獨立 VPS**，跟買家部署用的 managed fleet 分開。

**Alternatives considered：**
- **塞進既有 buyer-managed fleet 的某台機器**：否決。這是內部客服系統，不是買家資源，混在一起會讓「哪些資源屬於買家、哪些屬於公司內部」的權限模型混亂，未來稽核或买家資料保護要求時難以切割。
- **用 Vercel serverless 或其他 serverless 平台跑 Chatwoot**：否決。Chatwoot 是常駐 Rails + Redis + PostgreSQL 應用，官方本身建議跑在常駐容器/VM，不是為 serverless 冷啟動設計；跟這個專案「部署走常駐 Node/服務」的既有 Tech Stack 慣例一致，不要為了這張 change 另開一種部署形態。

### `SupportTicket` 強關聯 `BuyerDeployment`（NOT NULL 外鍵）

工單資料表的 `buyerDeploymentId` 是必填外鍵，不做成 nullable「先獨立、以後再接」。

**Alternatives considered：**
- **nullable 外鍵，日後再補關聯**：否決（Fish 明確選強關聯）。會導致早期工單資料「看不出這人在用哪台機器」，AI 唯讀查 Coolify 狀態這個核心價值就無法在工單建立當下自動生效，還要事後補資料。
- **不建自己的表，全部塞進 Chatwoot 的 custom attributes**：否決。Chatwoot 的自訂欄位是給人看的 metadata，不是關聯式資料庫外鍵，AI 判斷邏輯、報表、跨表查詢（例如「這個部署最近 3 個月開過幾張單」）都做不到型別安全的 join，效能與可維護性都差。

### 「已解決」採混合判斷制：AI 標記建議 → 買家確認或逾時才真的關單

AI 判斷像是解決了 → 狀態轉 `AI_SUGGESTED_RESOLVED`，不真的關單 → 買家按確認或 3 天無回應自動關單；若買家在等待期間又回覆，狀態打回 `OPEN`（處理中）。

**Alternatives considered：**
- **純買家自己按確認（選項 A）**：否決。買家常常懶得按確認鍵，工單會無限堆積在「等待確認」狀態，团队看板永遠一堆待清理的假活躍工單。
- **AI 全自動判斷關單（選項 B）**：否決。誤判風險最高——AI 覺得解決了但買家其實還沒解決，工單被關掉後買家再回覆會變成開新單，脈絡斷裂，客服體驗更差。

### AI 介入 Coolify 只到「唯讀 + 建議修復步驟」，不做自動修復

AI 收到工單後自動拉該部署的 Coolify 狀態/log 摘要、生成建議修復步驟草稿，寫進 Chatwoot 的 internal note（工程師才看得到，不會誤發給買家），但**不會自動執行任何指令**，一律工程師手動確認才動手。

**Alternatives considered：**
- **純唯讀，不生成修復建議（選項 A）**：否決。少了 AI 幫工程師先分析 log、省下第一輪判讀時間的核心價值，等於只做了一半。
- **自動修復（選項 C，明確排除但保留為未來路徑）**：本輪不做。AI 判斷失誤時會誤操作買家的正式站，風險太高；等這輪的「唯讀 + 建議」模式運行一段時間、AI 判斷準確度被驗證夠可靠，才會啟動下一輪 change 評估要不要升級到自動觸發修復。

### 客服入口：全站浮動客服框 + `/deployment` 頁面快捷按鈕

Chatwoot 官方 widget 注入全站 layout，`/deployment` 頁面另外加一顆「回報這個部署的問題」快捷按鈕，點擊時透過 Chatwoot widget API 夾帶 `buyerDeploymentId` 當自訂 metadata，開單當下就帶好上下文。

**Alternatives considered：**
- **只做全站浮動框（選項 A）**：否決。買家在 `/deployment` 頁面想回報「這個部署」的問題時，還是要重新打字說明是哪個網站，多一道摩擦，違背「工單強關聯 BuyerDeployment」這個決策的初衷。
- **只做 `/deployment` 頁面快捷按鈕（選項 B）**：否決。買家在其他頁面（例如課程頁）遇到問題時，求助入口整個消失，不符合「跟一個介面互動」的目標。

### 進線管道：網站 + LINE + Telegram 三個核心管道，IG/FB 等留待未來

**Alternatives considered：**
- **只做 LINE（選項 A）**：否決。LINE Messaging Channel 申請要企業認證，審核期間完全沒有 Messaging 管道可用/可測，且排除掉 Fish 提到「可能有國外客戶」的情境。
- **只做 Telegram（選項 B）**：否決。台灣一般消費者幾乎不用 Telegram，等於主力客群要多裝一個不熟的 App 才能找到客服，體驗反而變差。

### v1 邊界政策文字同步改寫（`config.yaml` + `AGENTS.md` + `README.md` 三處）

三個檔案目前都各自獨立寫死同一條規則（cross-impact 預檢已確認：`README.md:5`、`AGENTS.md:106`、`openspec/config.yaml:6,35` 皆有對應文字），apply 階段要三處同步改寫，並依專案既有慣例（參照已封存的 `extract-line-learner-community` change 做法）在 `config.yaml` 的「已廢」段落加一行標記舊規則已被取代。

**Alternatives considered：**
- **只改 `config.yaml`，不動 `AGENTS.md`/`README.md`**：否決。三份文件目前文字一致，只改一處會讓其他文件跟現狀矛盾，之後任何 Agent 讀到哪一份都可能依照過期規則行動。
- **保留舊文字、另外加註解說明例外**：否決。既有專案慣例是「已廢」段落明講取代關係，不是在原句旁加註解，維持一致的文件維護模式。

## Implementation Contract

**Behavior（可觀察行為）：**

- 買家在任一頁面點開右下角客服氣泡，或在 `/deployment` 頁面點「回報這個部署的問題」，都能打開一個對話框輸入訊息並送出
- 送出後，訊息出現在 StartKiter 團隊的 Chatwoot 收件匣，同時系統建立一筆 `SupportTicket` 記錄，`status = OPEN`
- 若買家透過 `/deployment` 頁面快捷按鈕開單，該 `SupportTicket.buyerDeploymentId` 自動帶入對應部署，不需買家手動選擇
- 若買家透過全站浮動框開單且帳號名下有多個 `BuyerDeployment`，需要選擇「這是關於哪個部署」（單一部署時自動帶入，不用選）
- 買家透過 LINE 官方帳號、Telegram Bot 傳訊息，同樣進同一個 Chatwoot 收件匣，`SupportTicket.channel` 對應標記為 `LINE` / `TELEGRAM`
- AI 收到新工單後，在 Chatwoot 對話中自動回覆（買家看得到）或標記轉真人（買家看不到內部標記，但團隊看得到）；同時在 internal note 貼上唯讀查詢到的部署狀態/log 摘要與建議修復步驟（僅團隊可見）
- AI 判斷像是解決了 → `SupportTicket.status` 轉 `AI_SUGGESTED_RESOLVED`，買家在對話中看到確認提示；買家點確認 → `status = RESOLVED`；3 天無回應 → 系統自動關單 `status = RESOLVED`，`resolvedBy = AUTO_TIMEOUT`；買家在等待期間再回覆 → `status` 打回 `OPEN`

**Interface / data shape：**

- Prisma model `SupportTicket`（`packages/database/prisma/schema.prisma`）：

```prisma
enum SupportTicketChannel {
  WEB_WIDGET
  LINE
  TELEGRAM
}

enum SupportTicketStatus {
  OPEN
  AI_SUGGESTED_RESOLVED
  RESOLVED
  ESCALATED
}

enum SupportTicketResolvedBy {
  BUYER_CONFIRMED
  AUTO_TIMEOUT
}

model SupportTicket {
  id                     String                   @id @default(cuid())
  buyerDeploymentId      String
  buyerDeployment        BuyerDeployment          @relation(fields: [buyerDeploymentId], references: [id])
  userId                 String
  user                   User                     @relation(fields: [userId], references: [id])
  chatwootConversationId Int                      @unique
  channel                SupportTicketChannel
  status                 SupportTicketStatus      @default(OPEN)
  aiSuggestedResolvedAt  DateTime?
  resolvedAt             DateTime?
  resolvedBy             SupportTicketResolvedBy?
  createdAt              DateTime                 @default(now())
  updatedAt              DateTime                 @updatedAt

  @@index([buyerDeploymentId])
  @@index([status])
  @@index([aiSuggestedResolvedAt])
}
```

  SQL DDL（`db push` 產出，供設計對照，非手寫 migration）：

```sql
CREATE TABLE "SupportTicket" (
  "id" TEXT PRIMARY KEY,
  "buyerDeploymentId" TEXT NOT NULL REFERENCES "BuyerDeployment"("id"),
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "chatwootConversationId" INTEGER NOT NULL UNIQUE,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "aiSuggestedResolvedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE INDEX "SupportTicket_buyerDeploymentId_idx" ON "SupportTicket"("buyerDeploymentId");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_aiSuggestedResolvedAt_idx" ON "SupportTicket"("aiSuggestedResolvedAt");
```

- oRPC 模組 `packages/api/modules/support/`（比照 `packages/api/modules/deployment/` 慣例）：
  - `POST /support/tickets`（`protectedProcedure`）：買家從網站介面開單，帶 `buyerDeploymentId`（可選，未帶時若帳號只有一個部署自動帶入）+ 訊息內容，代理呼叫 Chatwoot API 建立 conversation，寫入 `SupportTicket`
  - `POST /support/webhook/chatwoot`（`publicProcedure` + signature 驗證）：Chatwoot Webhook 進線，驅動 AI 判斷邏輯與狀態轉換
  - `POST /support/tickets/:id/confirm-resolved`（`protectedProcedure`）：買家按確認已解決
- Chatwoot Webhook payload 形狀依 Chatwoot 官方文件（`conversation_created`、`message_created`、`conversation_status_changed` 事件），這裡不重寫，實作時讀官方文件確認欄位名稱

**Failure modes：**

- Chatwoot API 打不通（VPS 掛了/網路問題）→ 買家端開單按鈕顯示「客服系統暫時無法使用，請稍後再試」，不誤報成功；比照 `coolify-managed-deployment` 的 `status.ts` 安全降級慣例，不猜測狀態
- LINE/Telegram Webhook 簽章驗證失敗 → 直接拒絕（401），不寫入任何 `SupportTicket`，避免偽造訊息污染工單
- AI 判斷邏輯本身呼叫外部模型失敗/逾時 → 工單保持 `OPEN`，不自動標記已解決，寧可讓真人多看一眼也不要誤關單
- 買家帳號名下沒有任何 `BuyerDeployment`（例如 Tier 1 自行部署、或購買流程尚未完成 provisioning）→ 見下方 Open Questions，本輪先假設這類買家不會出現在 `/deployment` 快捷按鈕入口，全站浮動框入口的處理方式待 Fish 確認

**Acceptance criteria：**

- 三個管道（網站/LINE/Telegram）送出的訊息都能在 Chatwoot 收件匣看到，且都對應到一筆 `SupportTicket`（`spectra apply` 階段的 TDD 紅燈矩陣會列出對應測試）
- `/deployment` 頁面快捷按鈕開單，`SupportTicket.buyerDeploymentId` 正確帶入，不需手動選擇
- AI 標記 `AI_SUGGESTED_RESOLVED` 後，買家確認或 3 天逾時兩條路徑都能正確轉成 `RESOLVED`，且逾時前買家回覆能打回 `OPEN`
- AI 生成的建議修復步驟只出現在 internal note，不會被自動發送給買家
- 未設定 LINE/Telegram 憑證時，對應管道的功能安全降級（不出現在客服介面，不是顯示壞掉的按鈕）——比照 `line-login-from-line-hub.md` 的 `isConfigured()` 慣例

**Scope boundaries：**

- 範圍內：Chatwoot 自架部署、3 管道路由、`SupportTicket` 資料模型、AI Webhook 消費者（唯讀 Coolify + 建議修復步驟）、已解決混合判斷流程、v1 邊界政策文字同步改寫
- 範圍外：AI 自動修復執行、IG/FB 等額外管道、客服排班/權限分級、`coolify-managed-deployment` 既有未完成項目（`provisionServer`/`submitCredential` 真實 API 呼叫）

## Risks / Trade-offs

- **[Risk]** Chatwoot 自架在單一 VPS，這台機器掛掉會讓網站/LINE/Telegram 三個管道同時斷線（單點故障，客服系統本身也需要客服）→ **Mitigation**：沿用 Coolify 健康檢查機制；本輪不做高可用/多機器容錯，故障時人工重啟，SLA 保證不在本輪範圍內，記錄進 Open Questions 供未來評估
- **[Risk]** LINE Messaging Channel 審核可能卡數天，阻塞這輪 apply 時程 → **Mitigation**：apply 開跑當下立刻送出 LINE 官方帳號審核（可與等待 `coolify-managed-deployment` merge 平行進行），Telegram Bot 申請幾分鐘完成，不受阻塞，可以先行整合測試
- **[Risk]** AI 誤判「像解決了」，買家沒注意到確認提示，3 天逾時自動關單但問題其實還在 → **Mitigation**：逾時關單前系統於同一管道發一次提醒通知；Chatwoot 原生行為是買家在已關閉的 conversation 回覆會自動重開，不會真的失聯
- **[Risk]** AI 生成的「建議修復步驟」被工程師無腦照做、跳過人工判斷本意 → **Mitigation**：草稿只寫進 internal note（買家看不到），且草稿內容明確標記「AI 建議、未經驗證」字樣，不偽裝成已確認的操作手冊
- **[Risk]** `SupportTicket` 強關聯 `BuyerDeployment`，沒有部署記錄的買家（Tier 1 自行部署／購買流程中）可能開不了工單 → **Mitigation**：見 Open Questions，需要 Fish 在 apply 前明確裁決這類邊界情況怎麼處理，不能讓 apply 階段自己猜
- **[Risk]** 這張 change 完全依賴 `coolify-managed-deployment` 先 merge，若那張 change 進度延誤，這張 change 會跟著卡住 → **Mitigation**：tasks.md 第一項明文列為阻塞前置條件，propose/design/specs 現在先寫完準備好，apply 階段開跑前再次確認 merge 狀態

## Migration Plan

1. 確認 `coolify-managed-deployment` 已 merge 回 main（阻塞前提，見 tasks.md 第一項）
2. `packages/database/prisma/schema.prisma` 新增 `SupportTicket` model + 3 個 enum，執行 `pnpm --filter database db push`（沿用本專案既有慣例，不用 `migrate dev`——多個 worktree 共用本機 Postgres，`migrate dev` 會要求 reset 整個資料庫）
3. 在 Coolify Cloud 帳號新增獨立 VPS，走 Chatwoot 官方一鍵安裝服務（沿用 `docs/coolify-vps-setup-runbook.md` 已驗證過的 Cloudflare DNS 灰雲朵 + SSL 簽發 SOP）
4. 申請 LINE Messaging Channel（企業審核，需提前送出）、Telegram Bot（`@BotFather`，即時完成）
5. 三個管道接進 Chatwoot：Web Widget script 注入全站 layout、LINE/Telegram 官方 Channel 串接 Chatwoot 對應整合設定
6. 新增 `packages/api/modules/support/` oRPC 模組 + Webhook endpoint，部署上線
7. `/deployment` 頁面加「回報這個部署的問題」快捷按鈕
8. `openspec/config.yaml`、`AGENTS.md`、`README.md` 三處同步改寫政策文字
9. **回滾策略**：這張 change 是新增能力，不修改任何既有 model 或既有頁面的既有行為（只新增按鈕），回滾只需要：(a) 停用/移除客服框 script 注入、(b) 移除 `/deployment` 頁面的新按鈕、(c) `SupportTicket` 表可保留不需砍（不影響既有功能運作）、(d) v1 邊界政策文字若已誤改可用 git revert 還原三份文件

## Open Questions

- **沒有 `BuyerDeployment` 記錄的買家（Tier 1 自行部署、或購買流程中尚未完成 provisioning）遇到問題時，工單要怎麼處理？** 強關聯外鍵目前假設每個開單的買家都有至少一筆 `BuyerDeployment`，但這個假設可能不成立。需要 Fish 在 apply 開始前明確裁決：(a) 允許這類買家開單但走一個特殊的「無部署關聯」分類，需要放寬外鍵或另建分類欄位；(b) 這類買家一律走既有的 email 客服（不接進 Chatwoot 統一工單），只有 Tier 2（Coolify managed）買家用這套新系統
- **Chatwoot 自架的高可用/備援策略**——本輪明確不做，但要不要在 design 層先預留擴充空間（例如 Coolify 支援的多副本），還是完全不用考慮，等真的出問題再處理？
- **LINE Messaging Channel 審核所需的企業資料/流程細節**——需要在 apply 開始前實際跑一次 LINE Developers 申請流程確認，目前只查過費用結構，沒查過審核所需文件與時程
