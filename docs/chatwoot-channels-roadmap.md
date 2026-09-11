# Chatwoot 多通道總圖

> 這不是 Spectra change，是跨 SR 的施工地圖。每張小 SR 各自走 propose → apply → archive；這裡只記「切成幾刀、順序、驗收標準」。
> SSOT：Facebook 細節見 `docs/chatwoot-facebook-messaging.md`、`docs/support-runtime-topology.md`；App Review 進度見 `openspec/changes/chatwoot-facebook-pages-messaging-live/assets/app-review-status.md`。

最後更新：2026-09-11

## 硬規則（Fish 裁決，2026-09-11）

- 不開一張超大 SR 想一次吃完所有通道
- 一張一張 propose → apply → archive，同時通常只跑一張 active change
- 誰 propose 誰跟到 apply，避免脫節
- 產品站 widget 預設不做，除非 Fish 另開刀

## 通道清單與目標狀態

| 通道 | 目標狀態 | SR | 狀態 |
|---|---|---|---|
| Facebook Messenger（Fishtv 粉專） | 路人可雙向進線，Chatwoot 收得到 | `chatwoot-facebook-pages-messaging-live` | partial（7/8，卡 3.2） |
| Meta 資料存取更新 + 重 OAuth | data_access 不過期，App 能切 Live | `chatwoot-data-access-renewal-and-oauth` | not started（FB Live 的前置阻擋） |
| LINE | webhook/inbox 健康確認並補文件 | `chatwoot-line-channel-hardening` | not started（勿假設已硬化完成） |
| Google OAuth 登入 | redirect/登入流程正常 | `chatwoot-google-oauth-login` | not started（曾卡流程） |
| Email 入站 | 若要做，支援入站信解析進 inbox | `chatwoot-email-inbound` | not started |
| WhatsApp / Instagram / TikTok | — | — | out of scope（除非 Fish 點名） |
| 產品站 Chatwoot widget | — | — | out of scope（除非 Fish 另開刀） |

## 施工順序與依賴

```
1. chatwoot-facebook-pages-messaging-live（收尾到能送審）
       ↓ 依賴
2. chatwoot-data-access-renewal-and-oauth（Meta 資料存取更新 + 粉專重 OAuth）
       ↓ 解除阻擋，才能切 Live
   （回頭完成 chatwoot-facebook-pages-messaging-live Task 3.2：Live + 路人進線驗收）
       ↓ 之後平行皆可，看 Fish 排序
3. chatwoot-line-channel-hardening
4. chatwoot-google-oauth-login
5. chatwoot-email-inbound
```

**關鍵依賴**：FB Live（Task 3.2）卡在 Meta 「data access renewal assessment」完成 + App Review 核准，這正是 SR 2 要做的事，不是 FB SR 自己能解的，因此拆成獨立 SR。

## 各小 SR 摘要

### `chatwoot-facebook-pages-messaging-live`（已存在，先收尾）
- **Why 一句話**：Fishtv 粉專用 Chatwoot 接 Facebook Messenger，取代人工看粉專訊息
- **Non-Goals**：不啟用產品站 widget、不做其他 messaging 產品、不等 Meta 審核時程當唯一完成條件
- **驗收標準**：非 App 角色的真實帳號對粉專發新私訊，Chatwoot 對應 inbox 出現該對話，rails log 有 `POST /bot`（不是「設定好了」）

### `chatwoot-data-access-renewal-and-oauth`（下一張）
- **Why 一句話**：`data_access_expires_at` 停在 2020，Meta 擋切 Live 前必須完成資料存取權限更新與粉專重 OAuth
- **Non-Goals**：不新建 Meta App（帳號已撞 15-app 上限，沿用 `opcos`）、不動 FB SR 本身的送審流程
- **驗收標準**：Chatwoot 粉專 channel 的 `data_access_expires_at` 晚於執行當下；Meta Developer Console 「資料存取權限更新」顯示已完成，不再擋切 Live

### `chatwoot-line-channel-hardening`
- **Why 一句話**：LINE webhook/inbox 曾接過方向但未正式硬化驗收，需盤點現況補文件
- **Non-Goals**：不新增 LINE 官方帳號、不做主動推播功能
- **驗收標準**：實測 LINE 帳號發訊息，Chatwoot 對應 inbox 收到；webhook 健康檢查腳本或文件存在且可重跑

### `chatwoot-google-oauth-login`
- **Why 一句話**：Google OAuth redirect/登入流程曾卡住，需修好並驗收
- **Non-Goals**：不做其他登入方式（GitHub、Apple 等）
- **驗收標準**：實測用 Google 帳號走完整登入流程無報錯，session 正常建立

### `chatwoot-email-inbound`（若要做）
- **Why 一句話**：讓客服信箱入站信自動進 Chatwoot inbox，不用人工轉貼
- **Non-Goals**：不做行銷信/電子報相關功能
- **驗收標準**：實際寄一封信到指定信箱，Chatwoot inbox 出現對應對話

### WhatsApp / Instagram / TikTok（之後才考慮）
- 預設 out of scope，除非 Fish 點名；不預先寫 SR

## 驗收標準原則

每張 SR 的「完成」一律指**可觀測行為**，不是「設定完成」「已送審」這種狀態描述：
- 有沒有真人測試帳號實際發送過訊息
- Chatwoot inbox 有沒有真的看到對話
- 後端 log 有沒有實際命中對應 endpoint

## 目前決策（2026-09-11）

`chatwoot-facebook-pages-messaging-live` 剩下的 Task 3.2（Live + 路人進線）本質上依賴 `chatwoot-data-access-renewal-and-oauth` 先完成，FB SR 這邊已經做不動了（純外部審核 + 資料存取阻擋）。因此：

1. `chatwoot-facebook-pages-messaging-live` → park（7/8，Task 3.2 標註「等待 data-access-renewal SR 解阻擋」）
2. 開新 SR `chatwoot-data-access-renewal-and-oauth` 作為下一張 active change
3. 該 SR 完成後回頭 unpark FB SR，驗收 Task 3.2，才能真正 archive
