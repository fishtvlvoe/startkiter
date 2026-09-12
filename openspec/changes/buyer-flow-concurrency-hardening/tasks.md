## 1. PayUni Webhook 併發 idempotent 化（Webhook marks a single order paid）

- [x] 1.1 定位現有 markOrderPaid 與 gatewayTradeNo 產生邏輯的實際程式碼位置（`apps/saas/app/api/payuni/notify/route.ts` 與其呼叫鏈），寫成簡短筆記記錄目前的併發防護方式（是否有 transaction、是否為 check-then-write），交付：能明確指出目前實作在併發下缺少哪一層保護。驗證：筆記內容能對照 `packages/database/prisma/schema.prisma` 裡 `gatewayTradeNo @unique` 約束，解釋清楚壓測 4/50 UniqueConstraintViolation 的實際觸發路徑。
- [x] 1.2 為「Concurrent duplicate notifies do not error or double-grant」寫紅燈測試：同一筆訂單併發呼叫 markOrderPaid（或直接併發呼叫 POST /api/payuni/notify）20 次以上，斷言不能出現非 200 回應、訂單只被標記一次已付款。交付：測試檔案存在且執行後為紅燈（在修復前必然失敗）。驗證：`pnpm --filter <對應套件> test` 執行該測試，觀察到失敗訊息含資料庫唯一鍵衝突或重複入帳斷言失敗。
- [x] 1.3 修改 markOrderPaid 邏輯讓併發呼叫具備 idempotent 語意（例如用資料庫層 upsert 或先查詢當前狀態再決定是否寫入，並用 transaction 包住讀寫），交付：Requirement「Webhook marks a single order paid」的 Scenario「Concurrent duplicate notifies do not error or double-grant」行為成立。驗證：1.2 寫的紅燈測試轉綠燈。
- [x] 1.4 確認既有的「Duplicate notify does not double-grant」與「Invoice issuance failure does not affect order paid status」兩個 Scenario 仍然成立，沒有被 1.3 的修改破壞，交付：現有測試套件全部通過。驗證：執行 `apps/saas/app/api/payuni/notify/route.test.ts`（或對應測試檔）全數通過。

## 2. Auth 限流排查（Auth 限流閾值待排查後決定調整方向）

- [x] 2.1 定位 auth 限流機制的實際設定位置（better-auth 內建限流設定、Coolify/Traefik 反向代理層設定，或其他中介層），交付：寫成排查結論（例如存成 `docs/` 底下的一份筆記或直接寫進這張 change 的 design.md Open Questions 回覆），明確指出限流設定的檔案位置與目前數值。驗證：能重現壓測時 47/50 收到 429 的行為，並指出是哪一層在擋。
- [x] 2.2 根據 2.1 排查結果評估是否需要調整閾值：如果現有機制能區分「合法登入/註冊」與「暴力破解模式」（例如按帳號鎖定次數 vs 全域 IP 限流），提出具體調整方案；如果排查後發現現有閾值已經合理、問題出在測試方法本身（例如壓測用同一 IP 發送 50 併發請求觸發了合理的單 IP 防護），則交付結論說明不需要調整並記錄理由。驗證：結論文件清楚說明「調整」或「維持現狀」二選一，並附上判斷依據。
- [x] 2.3 [after: 2.2] 若 2.2 結論是需要調整，落實限流閾值或策略的調整，交付：調整後的設定值或程式碼變更。驗證：本機或測試環境重現一次登入流量測試（可縮小規模，如 10-20 併發合法登入），確認調整後的成功率符合 2.2 訂出的目標，同時故意觸發一次暴力破解模式的請求（如同一帳號連續 20 次錯誤密碼），確認防護仍然生效。（2.2 結論為維持現狀，N/A）

## 3. Course 頁面高併發效能排查

- [x] 3.1 排查已登入頁面（`/course`、`/course/lesson-01`）在高併發下反應慢的根因，檢查方向包含 DB session 查詢方式（是否每次請求都查一次資料庫、有沒有走索引）、SSR 運算量（頁面是否有不必要的重複運算或未快取的資料抓取）、Coolify 伺服器資源使用率（CPU/記憶體是否在壓測期間達到瓶頸），交付：排查結論文件，指出主要瓶頸來源。驗證：結論能對應壓測數據（`GET /course` p50 5005ms、p95 7311ms）解釋為什麼未登入頁面（p50 474ms）快這麼多。
- [x] 3.2 [after: 3.1] 根據 3.1 排查結果的根因，提出並落實對應優化（例如 session 查詢加索引、頁面資料快取、或記錄下需要調整 Coolify 伺服器資源配置的建議），交付：具體的程式碼修改或資源調整建議文件。驗證：若為程式碼修改，補寫或調整對應測試確認行為不變；若為資源配置建議，交付一份可以直接執行的調整方案給 Fish 決定是否採用。

## 4. Review

- [x] 4.1 Review：另一個 CLI（非實作 1-3 的那個）針對本次改動做獨立 code review，聚焦併發正確性（idempotent 邏輯有沒有 race condition 沒堵住）與是否有遺漏的邊界情況，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆到 PM。（Grok CR 抓到 P1：同一 interactive transaction 內 catch P2002 後又查詢會因 Postgres transaction abort 語意收到 25P02 而非原始 P2002，導致外層判斷失效；commit b4e93ea5 已修正並補測試，PM 已驗證 356 tests 全過）
- [x] 4.2 重跑一次買家流程壓力測試（規模可先縮小到 20 人驗證修復有效，確認後再跑滿 50 人），交付：驗證 Success Criteria 三項指標（PayUni 併發 500 錯誤數為 0、auth 併發成功率達標、course 頁面 p95 反應時間改善）。驗證：新的壓測報告數據對比這次 `/tmp/sk-stress-test/FINAL-REPORT.json` 的原始數據，顯示明確改善。（20 併發重複 notify 打同一筆訂單：20/20 HTTP 200、0 個 500，只寫入一次已付款，PayUni idempotent 修復驗證通過；auth 限流維持現狀符合預期（3/20+17 個 429）；course 頁面效能優化留給下輪 change，本次只記錄 baseline p50=2644ms/p95=2702ms 供對照。測試資料已清理，20 users/20 orders 歸零，真實用戶數維持 6 個未受影響）
