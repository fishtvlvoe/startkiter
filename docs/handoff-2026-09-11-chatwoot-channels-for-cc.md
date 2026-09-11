# Handoff → Claude Code：Chatwoot 多通道計畫（2026-09-11）

**給誰：** Claude Code（cc）寫總圖／小 SR；Cursor 可接 apply／實作。

**Repo：** `B-產品/products/startkiter`（獨立 git）

**主機：** Chatwoot 在 Oracle `opc@140.245.55.106`，目錄 `/opt/chatwoot`，URL `https://support.startkiter.dev/`

**Ego task space（瀏覽器）：** 曾用 `35`／`55`；Meta／Chatwoot 登入態在 Default「工作」profile。

---

▋ Fish 裁決（本次對話）

• 不要開一張超大 SR 想一次吃完所有通道。

• 先寫「總圖」，再拆小張 SR，一張一張 propose → apply → archive。

• Spectra 同時通常只跑一張 active change；舊的先 park／收尾。

• 「CC 寫 SR、Cursor 只寫碼」可以，但同一刀最好誰 propose 誰跟到 apply，避免脫節。

---

▋ 現行 active／parked

• Active：`openspec/changes/chatwoot-facebook-pages-messaging-live`（只做 Facebook Messenger → Live／路人）

• Parked：`oracle-chatwoot-anti-reclaim-cutover`（剩 NSG 收斂 2.3 + review 3.1；先別跟 FB 搶）

• 產品客服通道預設仍是 email；Chatwoot 公網可開 ≠ 產品 widget 已啟用。

---

▋ 總圖要寫什麼（請 CC 產出）

產出建議路徑：`docs/chatwoot-channels-roadmap.md`（總圖，不是 Spectra change）。

總圖必含：

• 通道清單與目標狀態（done／partial／not started／out of scope）

• 建議施工順序與依賴（例如：FB Live 前要 data-access renewal＋App Review）

• 每張「小 SR」的建議 change name、Why 一句話、Non-Goals

• 驗收標準（可觀測行為，不是「設定好了」）

• 明確寫：產品站 widget 預設不做，除非 Fish 另開刀

建議小 SR 切片（可改名，順序可微調）：

• `chatwoot-facebook-pages-messaging-live`（已存在，先收尾）

• `chatwoot-data-access-renewal-and-oauth`（Meta 資料存取更新＋粉專重 OAuth）

• `chatwoot-line-channel-hardening`（LINE webhook／inbox 健康與文件）

• `chatwoot-google-oauth-login`（Google OAuth redirect／登入）

• `chatwoot-email-inbound`（若要做入站信）

• （之後才考慮）WhatsApp／Instagram／TikTok — 預設 out of scope，除非 Fish 點名

---

▋ Facebook 現況（給總圖／收尾 SR 用）

已通：

• 粉專「Fishtv余啟彰」／vanity `fishotcom`＝Page id `660594740619142`

• Chatwoot inbox：`Fishtv余啟彰 (fishotcom)`（inbox id 3）

• Meta App：`opcos` id `2578433362383415`（Business「費雪資訊坊」`892689044076376`，商家驗證已過）

• Webhook callback：`https://support.startkiter.dev/bot`（App subscriptions active，含 `messages`）

• 管理員帳雙向私訊已通（開發模式門禁）

• 法律頁（公開 200）：`https://startkiter.dev/zh-tw/legal/privacy-policy`、`https://startkiter.dev/zh-tw/legal/terms`（已寫進 Meta 基本資料；opcos.me 線上無 `/legal/*`）

• 螢幕錄影：`openspec/changes/chatwoot-facebook-pages-messaging-live/assets/messenger-chatwoot-e2e.mov`（約 24MB）已上傳到 App Review 草稿，可見「檢視已上傳的螢幕錄影檔案」

• App Review 草稿：`submission_id=5004072023152858`

未完成／阻擋：

• App 仍「開發中」；必要動作有「資料存取權限更新」（約到 2026-11-09）；未完成前 Meta 擋切 Live

• `pages_messaging` 審核表「允許的使用方式」Requests 仍常顯示未完成（選粉專 Fishtv＋同意勾選儲存不穩）；尚未按「提交檢閱」

• Token `data_access_expires_at` 仍像停在 2020；需粉專管理員在 Chatwoot 互動式重 OAuth

• Meta 要真實 FB「測試人員」角色給審查員（禁止 App 內建測試用戶）

• Task 3.2（Live＋非角色進線）仍 `[ ]`

SSOT 細節：

• `docs/chatwoot-facebook-messaging.md`

• `openspec/changes/chatwoot-facebook-pages-messaging-live/assets/app-review-status.md`

• `docs/support-runtime-topology.md`

---

▋ 明確不是這輪 FB SR 的範圍（勿塞進同一張）

• WhatsApp／TikTok／Instagram 正式審核

• StartKiter 產品站啟用 Chatwoot widget

• 自動匯入 Facebook 歷史私訊

• 新建 Meta App（帳號已撞 15-app 上限；沿用 opcos）

• Oracle 防回收／NSG 收斂（parked 那張另收）

---

▋ 其它通道（對話裡提過、狀態未當「已完成」）

• LINE：曾接過 webhook／inbox 方向，勿假設正式硬化完成；需獨立小 SR 盤點＋驗收

• Google OAuth：曾卡 redirect／登入流程，需獨立小 SR

• Email inbound：未當完成

• InstallationConfig 曾見 `DISABLE_META_MESSAGE_SENDING`／`DISABLE_META_INBOX_CREATION`＝true（管理員測訊仍通過；勿亂翻，先查再動）

---

▋ 請 CC 立刻做的三步

• 寫 `docs/chatwoot-channels-roadmap.md` 總圖（上列切片＋順序＋Non-Goals＋驗收）

• 決定：先 ingest／續做 `chatwoot-facebook-pages-messaging-live` 收尾，或 park 它再開 `chatwoot-data-access-renewal-and-oauth`（若收尾會爆 scope 就拆）

• 每張小 SR 用 Spectra：`propose` 齊 artifacts → `analyze` Clean → 再 `apply`；完成才 archive

---

▋ Cursor 可接手的事（若 Fish 叫寫碼）

• ego-browser 操作 Meta／Chatwoot（唯一瀏覽器管道）

• Oracle SSH rails runner／log（禁止把 token 打進 chat）

• 法律頁／文件／runbook 補丁

• 實作小 SR tasks；不擅自擴大 Non-Goals

---

▋ 交接完成條件（給 CC）

• 總圖檔存在且 Fish／後續 agent 讀得懂「下一張小 SR 是哪張」

• 不把 WhatsApp／TikTok／widget 偷塞進 FB 收尾刀

• 不宣稱 Live／路人進線，除非 Task 3.2 真的驗過
