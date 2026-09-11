## 1. 健康檢查與法律頁

- [x] 1.1 Goals：維持 Fishtv 頻道可用。落實 Requirement「Meta page webhook remains subscribed for Chatwoot」與 Decision: 沿用既有 Meta App opcos，不新建 App。確認 Graph app subscriptions 與粉專 subscribed_apps 含 messages，callback 為 `https://support.startkiter.dev/bot`（Observable behavior）。Failure modes：若 webhook 訂閱變空，先修復再送審。驗證：rails runner／Graph 查詢輸出含 active page subscription 與 messages 欄位。

- [x] 1.2 落實 Requirement「Public legal URLs exist for Meta App Review」與 Decision: App Review 材料以公開 HTTPS 法律頁為準，優先複用 opcos.me legal 內容（Scope in）。提供可公開開啟的 Privacy／Terms HTTPS URL。Failure modes：法律頁 404／非 HTTPS 則不得宣稱可送審。驗證：對兩 URL 執行 curl -sI 皆為 HTTP 200 且 Content-Type 含 html。

- [x] 1.3 檢查 page／user token debug_token（含 data_access_expires_at）；若資料存取已過期則重新 OAuth 寫回 Channel::FacebookPage。驗證：debug_token is_valid=true 且 data_access_expires_at 晚於執行當下，或 runbook 記錄無法換發的阻擋原因。

## 2. 文件與多客戶邊界

- [x] 2.1 Non-Goals：不啟用產品站 widget。Scope out：不啟用產品 widget、不做其他 messaging 產品、不等待 Meta 審核員時程當唯一完成條件。落實 Requirement「Facebook Messenger channel facts are part of support topology docs」與 Scenario「Product channel remains email by default」。更新 docs/support-runtime-topology.md（必要時 AGENTS.md）寫入 App id／webhook／Fishtv 頻道／Dev 或 Live。驗證：rg -n "2578433362383415|support.startkiter.dev/bot|Fishtv|開發|Live|email" docs/support-runtime-topology.md 命中齊全。

- [x] 2.2 落實 Requirement「Development mode restricts inbound senders」與「Customer-owned pages bind as separate Chatwoot inboxes」及 Decision: 多客戶粉專採 Chatwoot 每頁一 inbox，共用同一 Meta App。新增 docs/chatwoot-facebook-messaging.md。驗證：文件含「開發模式／App 角色」「每頁一 inbox」「不共用 Fishtv inbox」可檢索字樣。

## 3. 送審與 Live 驗收

- [x] 3.1 落實 Decision: 「正式可用」分兩階驗收：本側就緒 + Meta Live。在 Meta Developer Console 填妥法律 URL 與 Messenger 審核材料；材料齊則送出 pages_messaging 審核，否則 runbook 標 blocked。驗證：runbook 或 change 筆記記錄「已送審」狀態，或「blocked + 缺件清單」。

- [ ] 3.2 落實 Requirement「Live mode accepts non-role fan messages on the connected page」。Meta 核准後切 Live，用非 App 角色個人帳對 Fishtv 粉專發新私訊並在 Chatwoot 對應 inbox 看見。Failure modes：Live 後路人仍不進線時，查 App Review 權限、粉專 subscribed_apps、rails `POST /bot` log，不得只改文件結案。驗證：Chatwoot 該 inbox 新增對話；rails log 有 POST /bot；若未核准則保持未勾並寫等待狀態。

- [x] 3.3 Review：spectra analyze chatwoot-facebook-pages-messaging-live --json 無 Critical／Consistency Warning；tasks 勾選與 Implementation Contract／Observable behavior 對得上。驗證：analyze 輸出與 rg "\[ \]" tasks.md 狀態一致。
