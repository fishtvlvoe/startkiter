# Hyperagent 參考記錄（2026-08-17）

來源：https://hyperagent.com（Fish 已登入帳號 余啟彰 / fish.myfb@gmail.com），Fish 提供作為「未來 StartKiter 可能做成的外掛/服務」參考,實際瀏覽 Settings、MCP access、Marketplace 三頁。

## 一句話

一個「多 Agent 管理平台」，核心資訊架構是 Agents + Threads + Teams + Skills + Memories + Marketplace,外部 AI 可透過 MCP access 頁面連進來授權操作帳號,自己也能反過來掛外部 AI provider 帳號降成本。

## 左側 sidebar 資訊架構

- New thread、Search（⌘K）
- **Agents**（可建立多個、可收合的 agent 清單）
- **Recent threads**（歷史對話,可篩選）
- Resources：Teams、Skills、Memories、Learning、Projects、Library、**Marketplace**

## Settings 頁面分三類

**一般**
- Profile
- Personalization（讓系統知道你的公司/產業,推薦客製化）
- Security
- Notifications（背景執行的 agent 活動通知）
- **Agent defaults**（幫新對話選預設 model、tools、execution time、delegation policy）

**資料存取**
- Integrations（OAuth 連 250+ 第三方服務,像 Zapier 那種 hub）
- Import from OpenClaw / Manus import（從別的 agent 工具把 workspace/tasks 搬過來,含記憶與排程）
- **MCP access**——見下方獨立小節,對應我們討論過的「外部 AI 可以接進我們系統操作」那個方向

**訂閱**
- Billing
- **AI providers**（可以接自己的 ChatGPT 訂閱,讓 agent 跑在自己帳號上、算自己的錢,不算 Hyperagent 的）
- Referrals（推薦得 credit）

## MCP access 的具體做法（原文摘錄）

> Add Hyperagent as an MCP server in any client that supports it (Claude, IDEs, other agents). You'll be asked to sign in and approve access — no API key to copy or paste.

- 固定的 MCP server URL：`https://hyperagent.com/api/mcp`
- 任何支援 MCP 的 client 把這個 URL 加進去 → 跳出登入畫面 → 授權 → 連上,不用複製貼上 API key（OAuth 式,不是 API key 式）
- 頁面下方有「Active connections」清單,列出目前連著的 app,可隨時撤銷,即時生效

## Marketplace 的具體做法

分兩種可裝的東西,各自獨立列表：

- **Agents**（完整自動化角色）：例如「Inbound」— 自動處理業務信件回覆、排會議、產出會前簡報;「AdPilot」— 接 Meta Ads 帳號,每天監控成效,在使用者設定的護欄內自動調預算
- **Skills**（單一能力）：例如「Veo + Hyperframes Videos」— 一套產影片的 pipeline;「Roast My Idea」— 召集 5 個角色 persona 對點子提出質疑

每個項目卡片顯示：作者、一段功能描述、所屬分類（可多個）、star 數、install 數。有分類瀏覽頁（Sales & outreach、Research、Development & engineering、Content creation……),每類標出「N skills, M agents」。

## 對 StartKiter 的意義

跟我們之前對焦過的「核心／主題／外掛」架構完全對得上：Marketplace 就是「外掛市場」的具體範例長相——Agents/Skills 分開陳列、有作者/分類/星數/安裝數,這是「客戶做完功能包上傳,系統自動變成一個可安裝項目」這個願景的現成參考介面。MCP access 頁面則是「外部 AI 接進我們系統操作」這個已確認要做的方向的具體做法：固定 endpoint + OAuth 式授權 + 可撤銷連線清單,不是發 API key。

（(b) 方向——StartKiter 自己的 AI 連過去客戶的伺服器自動部署——Fish 已明確表示暫不需要,見同日對話紀錄。）

## 待辦

Fish 說之後要派工把 hyperagent.com 整站做逆向工程（架構、資料模型、互動細節），等他喊開始再排進 Spectra change。
