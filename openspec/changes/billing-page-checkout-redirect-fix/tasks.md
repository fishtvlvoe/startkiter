## 1. 帳單頁導頁行為修正

- [x] 1.1 把 `/settings/billing` 頁面的購買方案動作，從呼叫 `payments.createCheckoutLink` 改成導向 `/checkout`，交付：非已購買使用者在帳單頁點擊方案動作，會被導到 `/checkout`，不再觸發任何 API 呼叫或錯誤提示。驗證：測試確認元件輸出包含導向 `/checkout` 的連結/導航行為，且不再呼叫 `createCheckoutLink` mutation。
- [x] 1.2 [after: 1.1] 已購買使用者（`userHasCourseAccess` 回傳 true）在帳單頁看到已擁有狀態並提供連結導向 `/course`，行為比照 `/checkout/page.tsx` 既有邏輯（直接重用 `userHasCourseAccess`，不重新實作一套判斷）。驗證：測試確認已購買使用者情境下顯示已擁有狀態文字與 `/course` 連結，不顯示購買動作。
- [x] 1.3 [after: 1.1] 確認先前 QA 巡查修復（BUG-02）加的 `notifyCheckoutError`/Toast 錯誤提示路徑是否還有其他呼叫點在用；若確認完全沒有其他地方呼叫，移除這個現在用不到的函式，若還有其他地方在用則保留不動。驗證：`grep -rn "notifyCheckoutError" apps packages` 結果作為判斷依據，附在完成紀錄裡。
  - 完成紀錄：`rg notifyCheckoutError apps packages` 無程式碼命中（僅 openspec 文件提及）；已從 `PricingTable.tsx` 移除 `notifyCheckoutError` 與其既有 toast 測試。

## 2. 整合驗證

- [x] 2.1 [after: 1.2, 1.3] 跑一次 `pnpm test` 確認全域測試全綠，交付：無失敗案例，且不影響 `/checkout` 頁面既有測試。驗證：測試輸出顯示 0 failed。
- [x] 2.2 [after: 2.1] 另一個 CLI（非實作方）做獨立 code review，聚焦「導頁邏輯有沒有遺漏某個 entitled/not-entitled 分支」「有沒有不小心動到 /checkout 或 provider 程式碼」，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆給 PM。
