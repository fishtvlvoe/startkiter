# Meta App Review status — opcos `2578433362383415`

**更新：** 2026-09-11 12:20（錄影已上傳）

## 狀態總覽

**App Review：in-progress（尚未按提交檢閱）** — 螢幕錄影已上傳並顯示「檢視已上傳的螢幕錄影檔案」；允許的使用方式表單仍顯示 Requests 未完成（粉專選擇／同意勾選儲存不穩）。不可宣稱已送審。

**Live／路人進線（Task 3.2）：waiting** — Meta 跳出「data access renewal assessment」必須完成才能切 Live。

## 本輪新完成

- 端對端螢幕錄影檔：`assets/messenger-chatwoot-e2e.mov`（約 24MB，screencapture）
- 實測流程：Messenger 發「AppReview錄影測試 …」→ Chatwoot inbox 可見 → Chatwoot 回「AppReview錄影：Chatwoot 已收到並回覆」→ Messenger 可見
- Meta 允許的使用方式對話框已上傳該 `.mov`，處理完成後有「檢視已上傳的螢幕錄影檔案」連結
- 已點「取得評估」（data access renewal assessment）

## 已完成（本側）

- Graph page webhook：`https://support.startkiter.dev/bot` · `active=true` · fields 含 `messages`
- Page `660594740619142` subscribed_apps 含 `opcos` + `messages`
- Chatwoot inbox `Fishtv余啟彰 (fishotcom)`
- Meta 基本資料法律 URL：`startkiter.dev/zh-tw/legal/privacy-policy` 與 `.../terms`
- 商家驗證／存取權驗證：已通過
- `pages_messaging` 草稿：`submission_id=5004072023152858`
- API 測試呼叫：`pages_messaging` 已完成

## 仍缺／不穩

1. **允許的使用方式表單儲存**：說明／重現步驟／勾選同意可填，但「選擇粉絲專頁 → Fishtv余啟彰」選完按鈕文字常不Sticky，儲存後仍顯示 Requests 未完成。需再把粉專選取存進表單。
2. **真實測試人員帳號**：Meta 要求審查用真實 FB 帳號加「測試人員」角色（禁止 App 內建測試用戶）。管理員「曾芝文」可測功能，但審核說明要另給 Tester。
3. **data access renewal**：已點取得評估；完成前不能切 Live。Chatwoot `data_access_expires_at` 仍停 2020，重 OAuth 仍待做。
4. **資料處理／審查人員指示**：錄影補上後需走完再按「提交檢閱」。

## 非阻擋

- 不需再交政府證件（商家驗證已過）
- 法律頁 HTTPS 200 可用
