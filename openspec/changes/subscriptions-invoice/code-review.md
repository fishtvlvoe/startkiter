# subscriptions-invoice Code Review

日期：2026-08-26

## Review scope

逐檔檢查本 change 的 invoice schema、`InvoiceProvider`、一次買斷／訂閱期款 webhook、退款作廢、operator procedure，以及本次與 multi-gateway-checkout 的直接整合：

- correctness：Order／subscription source constraint、subscription period uniqueness、付款與開票的責任分離、void／allowance 狀態轉移。
- security：ECPay／ezPay 金鑰的 encrypted `SiteSetting`、解密失敗的 fail-closed、operator 權限、webhook 驗簽與 payload。
- performance：付款 webhook 先完成 DB 狀態，再以 `scheduleAfterResponse` 觸發開票；重複 period event 由唯一 `PaymentWebhookEvent` claim 防重入。

Codex 唯讀代理已被派到 main 工作樹，但因背景掃描反覆中斷沒有產出終稿；安全 TAC connector 亦回報未連線。以下為本 session 依相同範圍完成的逐檔唯讀 CR，沒有修改或提交代理產物。

## Final findings

沒有未關閉的 Critical、High、Medium、Low finding。

本輪與 multi-gateway-checkout 共同複驗時，發現 Shopline refund 電文缺少官方要求的 amount/currency、且只看 HTTP 200；已在 `packages/payments/provider/shopline/gateway.ts` 修正並加入 test。這個修正已同時納入兩張 change 的 final tree。

## 檢查證據

- `Invoice` migration 的 source CHECK 強制一筆資料只能屬於 Order 或 subscription period；subscription period partial unique index 防止同一期間重複開票。
- `triggerInvoiceForOrder` 與 `triggerInvoiceForSubscriptionPeriod` 都先檢查既有 Invoice；付款成功不依賴 invoice provider 成功，provider 失敗會留下 `FAILED` 記錄。
- period webhook 先驗 PayUni hash、merchant、period identity、金額，再 claim event；DB transaction 更新 subscription 與 webhook event，開票在 response 後執行。
- void 受同月規則保護；跨月改成 `REFUND_NEEDS_ALLOWANCE`，不會誤作廢。
- operator procedures 使用既有權限檢查；測試涵蓋 provider、schema、invoice、refund 與 webhook 路徑。
- 修改檔案與報告中沒有保存 ECPay／ezPay 金鑰或 token。

## Verdict

Final CR counts：Critical 0、High 0、Medium 0、Low 0。

task 11.3 的真實 E2E 已通過；task 12.1 仍保留未勾選，因正式金鑰、關閉測試模式與電子發票總開關是 Fish 明確保留的外部操作。
