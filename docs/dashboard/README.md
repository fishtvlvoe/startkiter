# StartKiter 專案儀表板 SOP

固定位置的進度儀表板，取代「每次對話重新對焦一次」。任何 Claude Code / Codex / Cursor session 接手這個專案時，先看這份 SOP，再看目前發布的網址。

## 目前發布網址

- **https://share.onorca.dev/a/3CEeYhHiSGfP**
- 平台：orca artifacts share（30 天到期，到期要重新發布拿新網址，見下方「到期怎麼辦」）
- 本地檔案：`docs/dashboard/status.html`（這是唯一真本，網址只是這個檔案發布出去的結果）

## 什麼時候要更新

- 任何 Spectra change 的 tasks.md 進度有變化（打勾數變了）
- 基礎設施現況有變化（VPS、網域、Cloudflare、LINE/Telegram、部署平台等決定）
- 有新的待老闆確認事項，或舊的確認事項有了答案
- 老闆明確要求「更新一下現況」

## 更新步驟

1. **收集現況**（不要憑記憶猜，實際查）：
   - `for d in openspec/changes/*/; do echo $d; grep -c '^- \[' "$d/tasks.md"; grep -c '^- \[x\]' "$d/tasks.md"; done` 拿到每張進行中 change 的真實打勾數
   - 讀最新一份 `docs/discuss/*.md` 看有沒有新的決策或待確認事項
   - 讀 `AGENTS.md` 確認產品定位、抽取來源等有沒有變
2. **改 `docs/dashboard/status.html`**：用 Edit 工具改內容，不要整份重寫。保留現有的 CSS/版面結構，只動內容（進度數字、卡片文字、新增/移除區塊）。
3. **發布**：
   ```bash
   orca artifacts update /Users/fishtv/Development/products/startkiter/docs/dashboard/status.html --json
   ```
   （第一次發布用 `orca artifacts share`，之後都用 `update`，網址不會變）
4. **驗證**（不要只憑工具回傳 `ok:true` 就當完成）：
   ```bash
   curl -sS -o /dev/null -w "%{http_code}\n" https://share.onorca.dev/a/3CEeYhHiSGfP
   ```
   要是 200 才算真的發布成功。
5. **commit `docs/dashboard/status.html` 到 git**（版本留痕，之後要回溯改了什麼看 git log 就好）。

## 到期怎麼辦（30 天）

`orca artifacts update` 失敗、或 curl 不是 200 且確認過不是網路問題時，代表舊連結失效了：

1. 用 `orca artifacts share docs/dashboard/status.html --json` 重新發布，拿到新的 `shareUrl`
2. 更新這份 README 最上面「目前發布網址」那一行
3. 主動告訴老闆新網址（不要等他發現舊的打不開才講）

## 什麼可以放進儀表板

- 進度數字、卡片文字（純文字更新，隨時做）
- 截圖：需要展示「這個頁面長怎樣」時，用 `ego-browser` 的 `captureScreenshot`（或 `snapshotText` 描述後手動畫示意）拿到圖，轉成 base64 內嵌進 `<img src="data:image/png;base64,...">`——**不要用外部圖片連結**，Artifact 的 CSP 只允許自包在單一 HTML 檔裡的東西
- 連結：直接用 `<a href="...">`，正常超連結，不用特別處理

## 為什麼不做成一個獨立 Agent

這個流程是「讀狀態 → 套進既有 HTML → 發布 → curl 驗證」，一個人（一個 session）就能做完，不需要獨立 context、不需要平行跑多個子任務。開 Agent 是為了處理需要脫離主線 context 的複雜工作，這個不算。真的需要固定排程自動更新（例如每天早上自動跑一次）可以考慮 `CronCreate`／`superset-automate`，但目前是「有變化才更新」，人工觸發就夠。

## 相關硬規則（跟這個 SOP 有關的，不要違反）

- 所有網頁瀏覽器操作只用 `/ego-browser`，不用 mirasim gui_task / peekaboo browser 等其他工具（見 `~/.agent-guardrails/deny-list.md`）
- 有 API（Cloudflare、Coolify 之後也會有）就直接打 API/CLI，不要為了走「正規流程」硬去開瀏覽器；ego-browser 只留給真的沒有 API 的操作（建 LINE Channel、第一次建 Cloudflare Token 之類）
