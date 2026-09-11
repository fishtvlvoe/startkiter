## Context

2026-09-11 端到端買家流程實測（Agy + ego-browser，真實操作非猜測）發現：正式網站已部署上線（`startkiter.dev` HTTP 200），但買家唯一的兩種登入方式（GitHub OAuth、Google OAuth）都因為外部 OAuth App 後台的 redirect URI 設定跟正式網域 `app.startkiter.dev` 不一致而完全壞掉，導致付款前的登入步驟就卡死。另外還有 5 項非阻擋但影響專業度的殘留問題，多半是 supastarter 模板預設值沒清乾淨。

## Goals / Non-Goals

**Goals:**
- 讓買家能用 GitHub 或 Google 帳號成功登入
- 清掉所有讓網站看起來像「還沒做完」的殘留（品牌字樣、佔位文字、誤導連結）
- 修復手機版導航缺陷

**Non-Goals:**
- 不啟用 Chatwoot 產品站 widget
- 不重新設計版面
- 不處理跟本次測試無關的既有 SR

## Decisions

### Decision: OAuth redirect URI 修復走 ego-browser 直接操作外部後台，不走 API

GitHub OAuth App 的 callback URL 設定沒有對外 API（GitHub REST/GraphQL API 皆不支援修改 OAuth App 的 Authorization callback URL，只能網頁後台操作）；Google Cloud OAuth 2.0 用戶端的已授權重新導向 URI 同樣沒有 gcloud CLI 指令可改（`gcloud` 沒有對應的 `iam oauth-clients` 修改指令，這塊是 Google Cloud Console 網頁專屬設定）。因此兩項都用 ego-browser 直接進後台操作，不是本 repo 的程式碼或環境變數異動。

**Alternatives considered**：
1. 查 GitHub/Google 官方 API 有沒有隱藏端點可改 — 否決，兩邊官方文件都明確只支援 Console 操作，用非官方端點屬於繞過正規管道，風險不可控
2. 改用 email-only 登入繞過 OAuth 問題 — 否決，違反產品既有登入機制設計（README 明訂 GitHub 登入是核心交付路徑之一），且治標不治本

### Decision: 品牌殘留與佔位文字修復走一般代碼 PR，不特別隔離

Title、footer 連結、佔位文字、客服連結這幾項都是靜態內容/小段 JSX 修改，屬於同一批小改動，合併成一張 tasks group 處理，不拆成多個獨立 SR。

**Alternatives considered**：
1. 每個殘留問題各開一張 SR — 否決，過度拆分，5 個小修改沒有互相依賴，合併處理更有效率

## Implementation Contract

**行為**：
- 買家在 `app.startkiter.dev/login` 點擊「GitHub」或「Google」按鈕後，能成功跳轉回產品站並建立登入 session，不再看到 `Invalid Redirect URI` 或 `redirect_uri_mismatch` 錯誤
- 所有頁面 `<title>` 顯示 StartKiter 相關文字，不含 `supastarter for Next.js Demo`
- 登入/註冊頁頁尾不再顯示「Built with supastarter」對外連結
- `app.startkiter.dev` 首頁不再顯示 `Place your content here...` 佔位文字
- App 側邊欄「客服」連結點擊後導向 email 客服相關頁面或說明，不導向 `/chatbot`
- 手機版（400px）首頁 Header 有可點擊的選單入口，能展開查看登入/聯絡我們/價格連結

**驗證目標**：
- ego-browser 實測 GitHub 登入流程，走到 session 建立成功畫面（不是回到 GitHub 報錯頁）截圖佐證
- ego-browser 實測 Google 登入流程，同上
- `curl -s https://app.startkiter.dev/login | grep -i "supastarter"` 無命中
- 手機視窗（400px）截圖顯示漢堡選單且點擊後選單展開
- 側邊欄「客服」連結的 href 不含 `/chatbot`

**範圍邊界**：
- In scope：GitHub/Google OAuth App 後台設定、title/footer/佔位文字/客服連結/手機導航的程式碼修改
- Out of scope：任何金流、課程內容、資料庫 schema 變更；不修改結帳與 PAYUNi 流程（已實測 PASS）

## Risks / Trade-offs

- [Risk] ego-browser 操作 GitHub/Google 後台涉及帳號登入態，若 session 過期會操作失敗 → Mitigation：操作前先確認 ego-browser 已登入對應帳號，失敗時明確回報卡在哪一步而非假裝成功
- [Risk] 修改 OAuth App 設定屬於外部平台狀態變更，不像本 repo 代碼能用 git 回滾 → Mitigation：只新增 redirect URI，不刪除既有設定，變更前記錄原始設定值
