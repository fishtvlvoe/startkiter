## Context

2026-09-11 對正式站 app.startkiter.dev 做的 50 人買家流程壓力測試（涵蓋登入、結帳、PayUni 付款回調、課程存取），抓到三個高併發下的健壯性問題。壓測用假帳號（email 開頭 `stress-test-`），完成後已清理測試資料。完整原始數據見 `/tmp/sk-stress-test/FINAL-REPORT.json`（本機暫存檔，非版控內容，apply 階段若需要複核數據要重新產生或請 Fish 提供）。

這張 change 涵蓋三個獨立問題，共同點是「高併發下的正確性/效能」，但根因分屬不同子系統（auth 限流、payment 併發寫入、SSR 效能），apply 階段可視情況拆成三個並行工作項處理。

## Goals / Non-Goals

**Goals:**

- 排查並記錄 auth 限流的實際設定位置與數值，評估是否需要調整
- 讓 PayUni 付款回調（markOrderPaid）在併發下具備 idempotent 語意，不會因重複或併發呼叫產生資料庫錯誤
- 排查已登入頁面（`/course`、`/course/lesson-01` 等）在高併發下反應慢（p95 5-7 秒）的根因

**Non-Goals:**

- 不處理未登入頁面效能（壓測顯示正常，`GET /login` p50 474ms）
- 不重新設計整體 auth 架構或引入新的限流方案（如 Redis 分散式限流），除非排查後發現現有機制無法簡單調整
- 不做全站效能調校，只鎖定本次壓測抓到的具體頁面/端點

## Decisions

### markOrderPaid 需要做成 idempotent

壓測時 `gatewayTradeNo` 使用格式為 `STRESS<毫秒時間戳>` 的假值（壓測腳本自產，非正式 PayUni callback 產生），在 20 併發下觀察到 4/50 次 UniqueConstraintViolation 500。資料庫層 `gatewayTradeNo` 欄位已有 `@unique` 約束（`packages/database/prisma/schema.prisma:323,688`），約束本身沒有問題。

這次衝突有兩種可能，apply 階段須先排查釐清：
1. 壓測腳本自己產生的假 `gatewayTradeNo` 熵值不足（同一毫秒內多個請求算出相同值），是測試方法本身的限制，不代表正式 PayUni callback 也有相同風險
2. 正式 markOrderPaid 邏輯在併發呼叫時（例如 PayUni 端重複送出 notify）沒有做「先查再寫」或資料庫層 upsert，導致競態條件下嘗試對同一筆訂單做兩次 insert

不論根因是哪一種，markOrderPaid 這類「標記訂單已付款」的操作都應該具備 idempotent 語意作為防禦性設計：同一筆訂單收到重複的付款回調時，第二次呼叫應該直接回傳已處理過的結果，而不是拋出資料庫錯誤或重複扣款/重複發放課程權限。

**Alternatives Considered:**
- 只重試失敗的請求（現況做法）：能讓單次請求成功，但不解決底層競態條件，遇到真實流量仍可能間歇性出現 500 錯誤回應給 PayUni（可能觸發 PayUni 端重試機制，形成惡性循環）
- 在應用層加分散式鎖（如 Redis lock）：能解決競態條件，但引入新依賴，且這次壓測規模（50 併發）不足以證明現有資料庫層方案（如 upsert 或先查後寫）不夠用，先用較輕量的方案排查

### Auth 限流閾值待排查後決定調整方向

目前不知道限流機制實際設定在哪一層（better-auth 內建限流、Coolify/Traefik 反向代理層、或其他中介層），也不知道具體閾值數字。50 併發下 429 率高達 94%（47/50），但這可能是合理的防暴力破解設計，也可能對真實促銷流量過度保守。

apply 階段第一步必須先定位限流設定位置與數值，才能決定是調高閾值、改用更精細的限流策略（如按 IP+User-Agent 而非單純計數），或維持現狀（如果排查後發現這是合理的防護閾值）。

**Alternatives Considered:**
- 直接調高閾值到能容納 50 併發：在未確認限流目的與威脅模型前直接調整，可能削弱對真實暴力破解攻擊的防護，风险高於效益
- 完全移除限流：明顯不可行，會讓服務暴露在暴力破解風險下

## Implementation Contract

**行為（markOrderPaid idempotent 化）：**
- 同一筆訂單（以 `orderNo` 或 `gatewayTradeNo` 識別）收到第二次付款回調時，API 回傳與第一次相同的成功結果（HTTP 200 + 訂單狀態），不拋出資料庫錯誤
- 資料庫不會因為重複回調產生第二筆重複記錄，也不會讓已發放的課程權限被重複處理

**驗證方式：**
- 針對 markOrderPaid 補寫測試：同一筆訂單併發呼叫兩次，斷言只有一次真正寫入、第二次回傳冪等結果
- 重跑一次 50 人壓力測試（可縮小規模，如 20 併發，先確認修復有效再視需要跑滿 50），驗證 `POST /api/payuni/notify` 併發下 UniqueConstraintViolation 500 數量為 0

**行為（auth 限流）：**
- 排查完成、決定調整方向後才能定義具體驗收標準；本次 design 階段先只要求「排查結果要寫成文件」，具體調整方案與驗收標準留給 apply 階段依排查結果補上對應的 task

**範圍邊界：**
- 這次只處理 markOrderPaid 的 idempotent 化與 auth 限流盤點/評估，不涉及 course 頁面效能修復的具體實作方案（該項待 apply 階段排查根因後才能定義具體修復任務）
- 不修改 PayUni 串接的簽章驗證邏輯，只處理標記付款狀態這一步的併發安全性

## Risks / Trade-offs

[Risk] markOrderPaid 改成 idempotent 後，如果識別邏輯用錯欄位（例如用不夠穩定的欄位判斷「是否已處理過」），可能誤判導致漏發課程權限 → Mitigation：用資料庫層唯一約束 + 交易（transaction）搭配讀取當前狀態判斷，並補齊併發測試覆蓋這個判斷邏輯

[Risk] Auth 限流排查可能發現閾值設定分散在多處（例如同時有應用層與反向代理層限流），調整不完整導致問題沒真正解決 → Mitigation：排查階段列出所有找到的限流設定點，逐一確認是否為此次問題的成因，不要只改第一個找到的地方就結案

[Risk] Course 頁面效能問題根因可能不是程式碼層面（如 Coolify 伺服器資源不足），這種情況下這次 change 能做的有限 → Mitigation：排查階段明確記錄是否為資源瓶頸，如果是則升級成基礎設施調整的獨立決定，不勉強在這張 change 裡用程式碼繞過

## Migration Plan

- 本次不涉及資料庫 schema 變更（`gatewayTradeNo` 唯一約束已存在），純邏輯層修改
- 部署步驟：走現有 CI/CD 流程（合併進 main → Coolify 自動建置部署），沒有特殊遷移步驟
- 回滾策略：如果 idempotent 化邏輯上線後發現誤判（漏發課程權限），直接 revert 該次 commit 並重新部署，同時人工排查受影響的訂單並手動補發

## Open Questions

- markOrderPaid 與 gatewayTradeNo 產生邏輯的實際程式碼位置尚未定位（這次搜尋 `packages/api/modules/payments` 沒找到，需要 apply 階段第一步先定位），定位後才能確認上述兩種假設何者為真
- Auth 限流的實際設定位置（better-auth 內建、反向代理層、或其他）尚未定位
- Course 頁面反應慢的根因（DB session 查詢、SSR 運算量、或 Coolify 伺服器資源）尚未定位，需要 apply 階段用 profiling 工具或伺服器監控數據排查
- Success Criteria 裡的具體數字目標（auth 成功率 ≥ 90%、頁面 p95 降到 3 秒內）是暫定值，需要與 Fish 確認是否合理，或依排查結果調整
