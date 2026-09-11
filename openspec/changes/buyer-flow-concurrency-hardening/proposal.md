## Problem

50 人買家流程壓力測試（正式站 app.startkiter.dev，2026-09-11）發現三個高併發下的健壯性缺口：

1. 50 人同時登入/註冊，只有約 3 個成功（3/50），其餘 47 個被 HTTP 429 擋下（`POST /api/auth/sign-in` p95 1842ms，errorRate 0.94）。
2. 50 人同時完成 PayUni 付款回調（`POST /api/payuni/notify`），有 4/50 出現 HTTP 500 UniqueConstraintViolation，重試後才成功。
3. 已登入頁面在 50 併發下反應慢：`GET /course` p50 5005ms、p95 7311ms；`GET /course/lesson-01` p50 5610ms、p95 6688ms，明顯比未登入頁面（`GET /login` p50 474ms）慢一個量級。

完整數據見 `/tmp/sk-stress-test/FINAL-REPORT.json`。

## Root Cause

1. Auth 限流閾值未知是否對應真實促銷流量場景（rate limit 設定位置與臨界值待查，可能在 better-auth 層或反向代理層）。
2. `gatewayTradeNo` 交易編號產生機制疑似在併發下有碰撞機率，且標記訂單已付款（markOrderPaid）的邏輯疑似非 idempotent，導致併發回調時觸發資料庫唯一鍵衝突。
3. 已登入頁面反應慢的根因未定，待排查方向：DB session 查詢效率、SSR 運算量、或 Coolify 伺服器資源（CPU/記憶體）不足。

## Proposed Solution

- 盤點目前 auth rate limit 設定位置與數值，評估是否需要針對合法登入/註冊流量調高閾值，同時保留對暴力破解等惡意流量的防護。
- 讓 `gatewayTradeNo` 產生機制在併發下保證唯一（例如加入更高熵值或用資料庫序列/UUID），並讓 markOrderPaid 邏輯改為 idempotent（同一筆訂單重複收到付款回調不會拋錯或重複入帳）。
- 排查已登入頁面高併發反應慢的根因（DB session 查詢、SSR 運算、伺服器資源），視根因提出對應優化（如加索引、快取 session、調整 Coolify 資源配置）。

## Non-Goals (optional)

- 不在這次處理「未登入頁面」的效能（壓測顯示未登入頁面反應正常）。
- 不重新設計整體 auth 架構，只調整 rate limit 參數與相關防護邏輯。
- 不在這次做完整的資料庫效能調校，只針對本次壓測抓到的具體瓶頸處理。

## Success Criteria

- 50 人併發登入/註冊成功率從 3/50 提升到可接受範圍（具體目標值待與 Fish 確認，暫定 ≥ 90%，同時不能完全關閉暴力破解防護）。
- 50 人併發完成 PayUni 付款回調，UniqueConstraintViolation 500 錯誤數降為 0。
- 已登入頁面在 50 併發下 p95 反應時間從 5-7 秒降到 3 秒以內（具體目標值待與 Fish 確認）。
- 重跑一次相同規模（50 人）的壓力測試，驗證上述三項指標。

## Impact

- Affected specs: payuni-checkout（markOrderPaid idempotent 化是這次唯一能現在寫死的規格層行為改變；auth 限流調整方向與 course 頁面效能修復方案都要先排查才能決定，具體規格行為留待排查完成後另行 ingest 更新或開新 change）
- Affected code:
  - Modified: packages/auth/config.ts（或實際 rate limit 設定所在檔案，待排查確認）、packages/api/modules/payments/procedures/payuni 相關檔案（gatewayTradeNo 產生與 markOrderPaid 邏輯，待排查確認實際路徑）、apps/saas/app/(authenticated)/(main)/(account)/course 相關頁面（效能排查後視根因調整）
  - New: 無（除非效能排查後需要新增快取層或索引 migration）
  - Removed: 無
- Dependencies 新增：無（除非效能排查後需要引入監控/APM 工具）
- 環境變數新增：無（除非 rate limit 調整需要新增可設定的閾值環境變數）
