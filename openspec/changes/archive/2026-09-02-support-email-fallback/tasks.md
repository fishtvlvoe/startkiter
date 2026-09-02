# Tasks: support-email-fallback

## 1. 開關與設定

- [x] 1.1 新增 `SUPPORT_CHANNEL` 環境變數（`email` | `chatwoot`，未設定時預設 `email`），驗證方式為單元測試斷言未設定與設為非法值時皆回退 `email`。（PM 實作+實跑）`apps/saas/modules/deployment/support-channel.ts`；`pnpm vitest run support-channel` 9/9 全過，含未設定、非法值 slack、大小寫空白三種情境皆回退/正確判斷
- [x] 1.2 `apps/saas/.env.example` 補上 `SUPPORT_CHANNEL` 與既有 `SUPPORT_EMAIL` 的說明；本機 `apps/saas/.env` 設 `SUPPORT_EMAIL=fish@fishot.com`，驗證方式為 `grep` 命中。（PM 完成）`.env.example` 已加註解區塊；`apps/saas/.env` 與主 repo 皆設 `NEXT_PUBLIC_SUPPORT_CHANNEL=email`／`NEXT_PUBLIC_SUPPORT_EMAIL=fish@fishot.com`／`SUPPORT_EMAIL=fish@fishot.com`，`grep -n SUPPORT apps/saas/.env` 命中 3 行

## 2. 紅燈測試（先寫，確認會失敗）

- [x] 2.1 撰寫紅燈測試：`SUPPORT_CHANNEL=email`（或未設定）時，`SupportWidget` 點擊不呼叫 `window.$chatwoot`，改產生 `mailto:` 連結且收件人為 `SUPPORT_EMAIL`，驗證方式為對應測試跑出預期失敗。（PM 先寫紅燈）`support-channel.test.ts` 首跑失敗（Failed to resolve import './support-channel'），確認測試真的抓得到問題
- [x] 2.2 撰寫紅燈測試：`email` 模式下 `ReportIssueButton` 產生的 `mailto:` 內文含該 `buyerDeploymentId`，驗證方式同上。（PM 先寫紅燈）`support-email-mode.test.ts` 撰寫時對應實作尚未接線，功能接上後才轉綠
- [x] 2.3 撰寫紅燈測試：`email` 模式下 `initChatwootSdk` 不注入 script、回傳 false，驗證方式同上。（PM 先寫紅燈）同上，`initChatwootSdk` 在 email 模式回 false 的斷言
- [x] 2.4 撰寫紅燈測試：`SUPPORT_CHANNEL=chatwoot` 時三者行為與現況完全一致（回歸保護），驗證方式同上。（PM 先寫紅燈）`support-email-mode.test.ts` 下半段 chatwoot 模式回歸保護 3 案

## 3. 實作（讓紅燈轉綠）

- [x] 3.1 `SupportWidget.tsx` 依 `SUPPORT_CHANNEL` 分流：`email` 走 `mailto:`（主旨「客服諮詢」，內文帶部署網址；多部署時沿用既有選擇對話框，選完帶入該部署），`chatwoot` 維持現行邏輯。（PM 實作）`SupportWidget.tsx` 三個分支（無部署／單一部署／多部署已選）皆加 `emailMode` 分流，多部署未選時仍走既有選擇對話框
- [x] 3.2 `ReportIssueButton.tsx` 同樣依開關分流，`email` 模式內文帶 `buyerDeploymentId`。（PM 實作）`ReportIssueButton.tsx` 新增 `openSupportMailForDeployment()`，email 模式帶入 `buyerDeploymentId`
- [x] 3.3 `ChatwootScript.tsx` 在 `email` 模式直接 early return 不注入 script。（PM 實作）`ChatwootScript.tsx` 的 `initChatwootSdk` 與 `useEffect` 皆在 email 模式 early return
- [x] 3.4 執行測試確認 2.1-2.4 全數轉綠，驗證方式為 `pnpm --filter @startkiter/saas test` exit 0。（PM 實跑）`vitest run support-email-mode` 9/9 全過（email 模式 6 案 + chatwoot 回歸 3 案）

## 4. 政策文件同步

- [x] 4.1 `openspec/config.yaml` 三處「客服走 Chatwoot 統一工單」改為「客服走 email（`SUPPORT_CHANNEL=email`）；Chatwoot 統一工單已實作完成、暫停啟用」，驗證方式為 `grep -n "客服走" openspec/config.yaml` 顯示新文字。（PM 完成）`grep -n "客服走" openspec/config.yaml` 兩處已改為新文字；第 50 行「已廢」註記同步改寫為「已實作但暫停啟用」
- [x] 4.2 `AGENTS.md` 對應兩處同步改寫，驗證方式同上。（PM 完成）`AGENTS.md` 第 139 行政策文字 + 第 73 行 unified-support-desk 狀態說明皆已更新
- [x] 4.3 `README.md` 第 5 行附近同步改寫，驗證方式同上。（PM 完成）`README.md` 第 5 行已更新

## 5. 驗收

- [x] 5.1 PM 實跑 `pnpm --filter @startkiter/saas test` 與 `type-check` 全綠，附實際數字。（PM 實跑）`apps/saas` 全套 346 passed / 0 failed / total 346；`pnpm type-check` exit 0。過程中 5 個既有 Chatwoot 測試因預設改變而失敗，已於 `support-widget.test.tsx`／`chatwoot-script.test.ts` 的 beforeEach 明確 stub `NEXT_PUBLIC_SUPPORT_CHANNEL=chatwoot`（該兩檔本就在測 Chatwoot 路徑），非弱化測試
- [x] 5.2 PM 用 ego-browser 實測：登入後右下角客服按鈕點下去產生正確的 `mailto:` 連結（收件人 fish@fishot.com）、`/deployment` 回報按鈕帶對部署 ID、頁面不再載入 Chatwoot script，附截圖。（PM 實測）ego-browser 登入 `/app`：`document.getElementById('chatwoot-sdk-script')` 為 false、`window.$chatwoot` 為 undefined、浮動客服按鈕存在；點擊後 CDP 事件攔到實際導航 `mailto:fish@fishot.com?subject=客服諮詢&body=請描述你遇到的問題：…`。截圖 `/tmp/sr-verify-email-support.png`
- [x] 5.3 `unified-support-desk` 標記為「已完成實作、暫停啟用」並封存（3.6／9.4 於該檔明記為「本次不修，改走 email，程式碼保留待啟用」），驗證方式為 `spectra list` 不再顯示該 change。（PM 完成）`unified-support-desk` 3.6／9.4 已標記為「Fish 裁決不修、改走 email、程式碼保留待啟用」，該 change 達 55/55 並一併封存
