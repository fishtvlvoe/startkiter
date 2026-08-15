## 1. 治理與失敗測試（TDD）

- [x] 1.1 更新 AGENTS.md、README.md、openspec/config.yaml，標明現行施工為 extract-payuni-checkout，並寫明白名單含 packages/payments 與 Order；滿足 Decision: 來源對應採白名單改寫抽，禁止改來源。驗證：rg -n "extract-payuni-checkout|packages/payments" AGENTS.md README.md openspec/config.yaml 命中。 [Tool: sonnet]

- [x] 1.2 先寫失敗 Vitest：鎖定 Single MVP SKU price 與 MVP SKU constant is startkiter-mvp（伺服器金額 8800／TWD／sku=startkiter-mvp；客戶端改價仍寫 8800；非法 sku → 400；Order 建立輔助函式若收到 amount 0 或缺 amount 必須 fail-closed，對應 Empty or zero price is rejected）。驗證：測試存在且實作前紅燈。 [Tool: sonnet]

- [x] 1.3 [P] 先寫失敗 Vitest：鎖定 Checkout requires an authenticated session（無 session → 401 且無 Order）與 PAYUNi is the only MVP gateway 的 Unconfigured PAYUNi fails closed（缺金鑰 → 503 非 500）。驗證：實作前紅燈。 [Tool: sonnet]

- [x] 1.4 [P] 先寫失敗 Vitest：鎖定 Webhook marks a single order paid（首通 paid + 雙旗標 true；重複 notify 冪等；簽章失敗 400）以及 Course and kit are the same purchase。驗證：實作前紅燈。 [Tool: sonnet]

- [x] 1.5 先寫失敗 Vitest：鎖定 Refund clears entitlement flags on the order 與 Refund revokes kit eligibility（refunded 後兩旗標 false，且不呼叫 GitHub API）。驗證：實作前紅燈。 [Tool: sonnet]

## 2. 資料模型與 payments 套件

- [x] 2.1 依 Decision: Order 掛 user，權益用欄位而非獨立 entitlement 表 新增 Prisma Order（含 courseAccess、kitClaimEligible、status、orderNo unique）與 migration。驗證：prisma migrate 後 schema 有 Order、無 organization；rg -n "model Order" packages/database/prisma/schema.prisma 命中。 [Tool: sonnet]

- [x] 2.2 依 Decision: 改寫抽 PAYUNi，預設閘道鎖 payuni 建立 packages/payments（types、shared、payuni crypto／gateway）；只允許 payuni 進入結帳。驗證：單元測試可驗證簽章 helper；工廠拒絕 shopline／stripe 作為 MVP checkout gateway。 [Tool: sonnet]

- [x] 2.3 依 Decision: 金鑰 DB 優先、env fallback；缺則 fail-closed 503 實作金鑰讀取（settings→env；settings 可先回空但介面必須存在）並讓 1.3 的 503 測試轉綠。驗證：缺任一 HASH／MERCHANT 時 checkout focused 測試全綠；單元測試可斷言讀取順序先問 settings。 [Tool: sonnet]

## 3. API 與結帳行為

- [x] 3.1 依 Decision: Checkout 必須有 session；金額與 SKU 由伺服器鎖定 實作 POST /api/checkout，讓 1.2／1.3 測試轉綠；回應含 PAYUNi 送出資料。驗證：pnpm test 相關案例全綠；非法 sku → 400。 [Tool: sonnet]

- [x] 3.2 實作 POST /api/payuni/notify，讓 1.4 測試轉綠（paid + 雙旗標、冪等、400）。驗證：pnpm test 通知案例全綠。 [Tool: sonnet]

- [x] 3.3 依 Decision: 退款本刀只改訂單與旗標，不呼叫 GitHub 實作退款標記函式（或最小內部 API），讓 1.5 測試轉綠。驗證：refund focused 測試全綠；測試 spy 確認無 GitHub HTTP。 [Tool: sonnet]

- [x] 3.4 [P] 加上最小繁中結帳／付款導向 UI（已登入可觸發 checkout；未登入導向登入），不接 Shopline／Stripe 成功路徑。驗證：手動或 route smoke：結帳頁存在；rg -n "shopline|stripe" apps/saas/app 若命中不得成為可收款成功路徑。 [Tool: sonnet]

- [x] 3.5 實作最小 PAYUNi form_post／redirect 結帳結果頁：checkout 成功後使用者能在站內看到並送出付款（或完成 redirect），落實 design Risk form_post 中繼頁遺漏的 Mitigation 與 Implementation Contract 結帳結果頁。驗證：結果頁可渲染 checkout 回傳的 action／欄位或 redirect 目標；focused 測試或 smoke 斷言頁面含可送出的付款表單資料。 [Tool: sonnet]

## 4. Review

- [x] 4.1 確認來源未被寫入：對 thetu lib/payment 與 supastarter 路徑做 newer-than proposal 檢查為空；滿足 Decision: 來源對應採白名單改寫抽，禁止改來源。驗證：find 結果為空。 [Tool: sonnet]

- [x] 4.2 跑 spectra analyze extract-payuni-checkout --json 與 spectra validate extract-payuni-checkout；Critical／Warning 為 0；pnpm test 全綠。驗證：analyze／validate 通過；測試全綠。 [Tool: sonnet]
