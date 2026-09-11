# Chatwoot Facebook Messenger（opcos App）操作真相

**版本日期：** 2026-09-11  
**相關 SR：** `openspec/changes/chatwoot-facebook-pages-messaging-live`  
**產品站 widget：** 不啟用（`NEXT_PUBLIC_SUPPORT_CHANNEL` 維持 `email`）。本文件只講 Chatwoot 後台 Facebook 頻道。

## 一句話

Meta App `opcos`（id `2578433362383415`）接著 Oracle Chatwoot；粉專「Fishtv余啟彰」有獨立 inbox。現在仍是**開發模式／App 角色**門禁：只有 App 的 admin／developer／tester 私訊預期進線。路人與客戶自綁粉專要等 `pages_messaging` Live 核准。

## 現況快照（2026-09-11 實測）

| 項目 | 值 |
| --- | --- |
| Meta App | `opcos` · `2578433362383415` |
| App 模式 | 開發（Development） |
| Webhook callback | `https://support.startkiter.dev/bot` |
| Graph app subscriptions | `object=page` · `active=true` · fields 含 `messages` |
| Page id | `660594740619142` |
| Page subscribed_apps | `opcos` · fields 含 `messages` |
| Chatwoot inbox | `Fishtv余啟彰 (fishotcom)` · `Channel::FacebookPage` id `1` |
| Privacy URL | `https://startkiter.dev/zh-tw/legal/privacy-policy`（短網址 `/legal/...` 會 307） |
| Terms URL | `https://startkiter.dev/zh-tw/legal/terms` |
| Meta 基本資料已填 | 2026-09-11 重載確認：隱私／條款／資料刪除網址皆為上列 startkiter URL（先前存檔失敗是彈窗擋住＋舊值黏貼；已排除） |

### 為什麼法律頁用 startkiter.dev 而不是 opcos.me

`opcos.me` 線上是另一套落地頁，沒有 `/legal/*` 路由（curl 全 404）；repo 裡 marketing legal 仍是 placeholder。`startkiter.dev` marketing 已有真實 Privacy／Terms 且 HTTPS 200 HTML。Design 驗收以「公開 URL 可達」為準，不綁單一 repo 路徑。

## 開發模式／App 角色（重要）

開發模式下，**只有** Meta App 角色使用者（admin、developer、tester）對粉專發 Messenger，才預期會在 Chatwoot 建立對話。

非角色個人帳號在開發模式下**不預期**進線；這不是 Chatwoot 壞掉，是 Meta 門禁。

Live + `pages_messaging` 核准後，才用非 App 角色帳號做路人驗收。

## 多客戶粉專：每頁一 inbox

共用同一 Meta App `opcos`。

每個客戶粉專在 Chatwoot 走一次 Facebook channel OAuth → **每頁一 inbox**。

**不共用 Fishtv inbox**：客戶粉專流量不得路由進 `Fishtv余啟彰 (fishotcom)`。

## Token 健康（data_access）

2026-09-11 rails runner `debug_token`：

- page／user token 皆 `is_valid=true`，`expires_at=0`（長效／不過期型）
- `data_access_expires_at=1599604324`（2020-09-08 UTC）→ **相對現在已過期**
- `fb_exchange_token` 可換新 token，但 **data_access 仍停在 2020**，故未寫回 Channel（避免無意義覆蓋）

阻擋原因：Graph 長效交換無法延長 data access；需要粉專管理員在 Chatwoot 重新跑 Facebook OAuth（互動式同意畫面）。Agent 無法代點個人 FB 登入同意。

在管理員測試私訊仍雙向可用的前提下，先不強制中斷頻道；送審／Live 前應完成重授權並確認 `data_access_expires_at` 晚於當下。

### InstallationConfig 觀察

主機 Chatwoot `InstallationConfig` 可見：

- `FB_APP_ID` / `FB_APP_SECRET` / `FB_VERIFY_TOKEN`（值在 DB，不在 container ENV）
- `DISABLE_META_MESSAGE_SENDING=true`
- `DISABLE_META_INBOX_CREATION=true`

管理員測試私訊仍曾雙向成功；這兩旗標先記錄、不擅自翻轉。若之後 outbound 失敗，優先核對這兩項。

## 驗收指令（不印 token）

```bash
ssh opc@140.245.55.106
cd /opt/chatwoot
docker compose exec -T rails bundle exec rails runner '
app_id = InstallationConfig.find_by(name: "FB_APP_ID").value
secret = InstallationConfig.find_by(name: "FB_APP_SECRET").value
# 查 app subscriptions / page subscribed_apps / debug_token
# 禁止 puts token 本體
'
```

法律頁：

```bash
curl -sI https://startkiter.dev/zh-tw/legal/privacy-policy
curl -sI https://startkiter.dev/zh-tw/legal/terms
```

期望：HTTP 200，`content-type` 含 `html`（不要用會 307 的 `/legal/...` 短網址填 Meta）。

## App Review / Live 狀態

### 2026-09-11 apply 證據摘要

- Task 1.1：Graph `/{app-id}/subscriptions` → page · active · callback `https://support.startkiter.dev/bot` · fields 含 messages；Page `subscribed_apps` 含 opcos+messages。
- Task 1.2：上述法律 URL curl HEAD 200 + `text/html`。opcos.me 線上無 legal 路由（全 404），故改用 startkiter.dev；Meta 基本資料已寫入並存檔。
- Task 1.3：tokens `is_valid=true`；`data_access_expires_at` 停在 2020；`fb_exchange_token` 無法延長 → **blocked 需粉專管理員互動式重 OAuth**。
- Task 3.1：**blocked（未送審）**。`pages_messaging` 已進草稿 `submission_id=5004072023152858`；商家驗證已過；缺螢幕錄影與真實測試人員帳號。詳見 `openspec/changes/chatwoot-facebook-pages-messaging-live/assets/app-review-status.md`。
- Task 3.2：**waiting** — 未核准、未切 Live；不得宣稱路人進線。

未核准前 **不得**宣稱路人進線已通。

## 相關文件

- `docs/support-runtime-topology.md`
- `openspec/changes/chatwoot-facebook-pages-messaging-live/`
