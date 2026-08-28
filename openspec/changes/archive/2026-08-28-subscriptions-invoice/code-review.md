# subscriptions-invoice Code Review

日期：2026-08-27

## Review scope

逐檔檢查本 change 的 Invoice schema、`InvoiceProvider`、一次買斷／訂閱期款 webhook、退款作廢、operator procedure，以及與 `multi-gateway-checkout` 的直接整合：correctness、security、performance、真實 E2E 證據與文件邊界。

## Independent review history

- 第四輪全新 context CR 發現 2 個 High：期款 webhook 的付款狀態 transaction 與開票耦合、取消訂閱 stale lease 對遠端狀態判斷不足；本 session 已修正。
- 第五輪全新 context CR 確認前述 6 個既有 High 全部關閉，但另發現 Shopline webhook 金額單位錯誤；本 session 已修正 checkout／notify 與 regression test。
- 第六輪全新 context CR（`/tmp/startkiter-independent-cr-sixth.txt`）只讀檢查本批 diff，沒有修改、提交或封存，最終結果：`Critical 0 / High 0 / Medium 0`，Verdict `PASS`。

## Six previous High findings — final status

1. **PAYUNi 期款 webhook claim／lease／race**：subscription lock、PayUNi 實際期數與可恢復 claim 一起保護，亂序與重播不會重複入帳。
2. **模糊開票結果重試重複開票**：保留 operation marker，先查 provider／恢復狀態；只有明確 `NOT_FOUND` 才重新送出，避免 ambiguous response 造成 duplicate invoice。
3. **provider／credentials 切換防護**：provider 與加密 credentials 綁定檢查，解密失敗 fail-closed，不會用錯金流或把 secret 回填到頁面／錯誤。
4. **訂閱取消 stale reconciliation**：stale lease 先查遠端取消狀態；遠端已取消時只完成本地狀態，遠端未知時保留 token 並回 `CONFLICT`，不盲目重送取消。
5. **退款 race／recovery／partial refund**：refund lease、重試前查詢與實際退款金額檢查已接上；部分退款或金額不符不會被標成完整退款。
6. **付款成功不被開票 persistence 失敗回滾**：付款／訂閱狀態 transaction 與 provider 開票分離；開票失敗留下可重試狀態，不回滾已完成的付款成果。

## 檢查證據

- `Invoice` migration 的 source CHECK 強制一筆資料只能屬於 Order 或 subscription period；subscription period partial unique index 防止同一期重複開票。
- `triggerInvoiceForOrder` 與 `triggerInvoiceForSubscriptionPeriod` 先在短 transaction 留下／claim intent，再在 transaction 外呼叫 provider；付款成功不依賴 provider 成功。
- period webhook 先驗 hash、merchant、period identity、金額，再以 subscription lock 更新付款狀態與 PENDING intent；外部開票不占用付款 transaction。
- void 與跨月 allowance 路徑保留 operation marker，stale operation 可恢復；ezPay `InvoiceStatus` 字串／數字 `2` 均由 patch 正規化為 `VOIDED`。
- 修改檔案與報告沒有保存 ECPay／ezPay 金鑰或 token。

## Writable verification

- API：`48 files / 209 tests` 全數通過。
- payments：`17 files / 76 tests` 全數通過。
- SaaS：`39 files / 195 tests` 全數通過。
- API、payments、database、SaaS type-check 全數 exit 0；SaaS 與 marketing production build 全數 exit 0。
- `spectra validate subscriptions-invoice`、`spectra validate multi-gateway-checkout` 均 valid；`spectra analyze` 只有既有 Suggestion，沒有 Warning／Error。
- 第六輪 CR 的 focused test 未以 CR sandbox 宣稱通過：該唯讀 sandbox 建立 system temp `ssr` 時遭 `EPERM`；上列測試是本 session 在可寫環境獨立實跑的結果。

## E2E boundary

- ezPay 正式商家 API smoke test 只在完整複製資料庫的隔離 clone 執行，開票 `DQ70632357` 後對同一張發票作廢；operator 畫面、clone DB 與 provider raw `InvoiceStatus=2` 均有證據，詳見 `e2e.md`。
- 這不是正式部署／正式資料庫 acceptance；正式資料庫沒有切換 provider，也沒有寫入這筆測試訂閱。
- Shopline／Stripe 真實帳號 E2E 仍屬 `multi-gateway-checkout` 的環境阻塞，不冒充本 change 的完成證據。

## Verdict

第六輪全新 context CR：`Critical 0 / High 0 / Medium 0`，`PASS`。`subscriptions-invoice` tasks 為 `22/22`；依目前指示兩張 change 保持開啟，不執行 archive。
