## 1. 確認既有測試 mock pattern

- [x] 1.1 讀 `apps/saas/app/api/checkout/route.test.ts`、`apps/saas/app/api/bundles/route.test.ts`、`apps/saas/app/api/course/studio/route.test.ts` 三支既有測試，確認 Better Auth session mock 與 Prisma test client 寫法，記錄為後續所有新測試沿用的統一模式，不自創新寫法。驗證：能在 PR 描述或 commit message 指出「沿用哪支測試的 mock pattern」。

## 2. Bundles／Checkout／Coupons 群組（跨 user 購買與序號驗證）

- [x] 2.1 `apps/saas/app/api/bundles/[id]/route.test.ts` 新增：未登入 GET → 401；非擁有該 bundle 的 user GET → 403 或依現有設計為 404；bundle id 不存在 → 404。驗證：`pnpm --filter saas test bundles` 全綠且斷言涵蓋三種狀態碼。
- [x] 2.2 `apps/saas/app/api/bundles/admin/route.test.ts` 新增：未登入 → 401；非 operator 呼叫 → 403。驗證：同上，斷言涵蓋 401/403。
- [x] 2.3 `apps/saas/app/api/bundles/route.test.ts` 補上未登入 → 401 情境（若尚未涵蓋）。驗證：測試檔案含至少一個 401 斷言。
- [x] 2.4 `apps/saas/app/api/checkout/route.test.ts` 補上未登入 → 401、非本人 checkout 目標 → 403 情境。驗證：`pnpm --filter saas test checkout` 全綠。
- [x] 2.5 `apps/saas/app/api/checkout/status/route.test.ts` 補上查詢他人訂單狀態 → 403 或 404（依現有實作行為，先讀代碼確認正確狀態碼再寫斷言，不可憑猜測）。驗證：測試斷言與實際代碼行為一致。
- [x] 2.6 `apps/saas/app/api/coupons/validate/route.test.ts` 補上無效／過期序號 → 4xx、未登入呼叫的行為驗證（依現有設計是否要求登入）。驗證：`pnpm --filter saas test coupons` 全綠。

## 3. Course 群組（AI 筆記、課程內容、Lesson 訊息）

- [x] 3.1 `apps/saas/app/api/course/ai-notes/settings/route.test.ts` 新增：未登入 → 401；非該課程 instructor → 403（per-instructor 隔離，比照 `course-ai-notes-single` SR 已建立的隔離模式）。驗證：`pnpm --filter saas test ai-notes` 全綠。
- [x] 3.2 `apps/saas/app/api/course/lessons/route.test.ts` 新增：未登入 → 401；未購買該課程的 user 存取 lesson 內容 → 403 或 404（依現有 ownership 檢查邏輯）。驗證：斷言涵蓋未購買情境。
- [x] 3.3 `apps/saas/app/api/course/lesson-messages/upload/route.test.ts` 新增：未登入 → 401；上傳到非本人課程 lesson → 403。驗證：`pnpm --filter saas test lesson-messages` 全綠。
- [x] 3.4 `apps/saas/app/api/assignment/upload/route.test.ts` 新增：未登入 → 401；上傳到非本人 assignment → 403。驗證：測試檔存在且全綠。
- [x] 3.5 `apps/saas/app/api/course/studio/route.test.ts` 補上非 instructor 操作 → 403 情境（若尚未涵蓋）。驗證：斷言涵蓋 403。

## 4. MCP／Pages CMS 群組

- [x] 4.1 `apps/saas/app/api/mcp/connections/route.test.ts` 新增：未登入 → 401；列出他人 connections → 只回傳本人資料（ownership 過濾驗證，不是單純 403，需確認實際設計）。驗證：斷言驗證回傳資料只含當前 user 的 connection。
- [x] 4.2 `apps/saas/app/api/mcp/connections/[id]/route.test.ts` 新增：未登入 → 401；操作他人 connection id → 403 或 404。驗證：`pnpm --filter saas test mcp` 全綠。
- [x] 4.3 `apps/saas/app/api/pages-cms/route.test.ts` 新增：未登入 → 401；非 operator 寫入 → 403。驗證：測試檔存在且全綠。
- [x] 4.4 `apps/saas/app/api/pages-cms/[id]/route.test.ts` 新增：同上 + 資源不存在 → 404。驗證：斷言涵蓋 401/403/404 三種。
- [x] 4.5 `apps/saas/app/api/pages-cms/[id]/restore/route.test.ts` 新增：未登入 → 401；非 operator → 403；還原不存在版本 → 404。驗證：`pnpm --filter saas test pages-cms` 全綠。

## 5. Cron／Repo-version 群組（非用戶觸發，驗證授權機制）

- [x] 5.1 `apps/saas/app/api/cron/assignment-upload-cleanup/route.test.ts` 新增：缺少或錯誤 cron secret/授權標頭 → 401/403。驗證：測試檔存在且斷言涵蓋未授權情境。
- [x] 5.2 `apps/saas/app/api/cron/lesson-message-upload-cleanup/route.test.ts` 新增：同上。驗證：同上。
- [x] 5.3 `apps/saas/app/api/repo-version/route.test.ts` 新增：直接呼叫路由驗證回傳版本格式正確、未帶必要參數時的錯誤處理。與既有 `packages/github-kit/repo-version.test.ts` 的核心邏輯測試互補，不重複測相同邏輯。驗證：`pnpm --filter saas test repo-version` 全綠。

## 6. GitHub Claim 群組（一次性領取代碼包邏輯）

- [x] 6.1 `apps/saas/app/api/github/claim/route.test.ts` 新增：未登入 → 401；未付款 user 呼叫 → 403；重複 claim → 4xx（防止重複發放）。驗證：`pnpm --filter saas test github` 全綠。
- [x] 6.2 `apps/saas/app/api/github/claim-status/route.test.ts` 新增：未登入 → 401；查詢他人 claim 狀態 → 403 或只回傳本人資料。驗證：斷言涵蓋 ownership 情境。

## 7. Webhook／簽章群組（payuni／shopline／stripe）

- [x] 7.1 `apps/saas/app/api/payuni/notify/route.test.ts` 補上簽章錯誤 → 4xx 且不寫入 DB（用 spy 驗證未呼叫訂單更新函式）。驗證：斷言含「簽章錯誤時未呼叫寫入函式」。
- [x] 7.2 `apps/saas/app/api/payuni/period-notify/route.test.ts` 補上同樣的簽章錯誤情境。驗證：同上模式。
- [x] 7.3 `apps/saas/app/api/payuni/return/route.test.ts` 補上簽章錯誤或參數竄改情境。驗證：斷言涵蓋拒絕情境。
- [x] 7.4 `apps/saas/app/api/shopline/notify/route.test.ts` 補上簽章錯誤 → 4xx 情境（即使 Shopline 未接線，仍需驗證 webhook 入口本身的簽章防護不可繞過）。驗證：測試斷言存在。
- [x] 7.5 `apps/saas/app/api/stripe/webhook/route.test.ts` 補上簽章錯誤 → 4xx 情境（Stripe 同樣未接線但入口防護需驗證）。驗證：測試斷言存在。

## 8. PM 驗證與交叉審查

- [ ] 8.1 PM 在同一個 worktree 重新執行 `pnpm --filter saas test`，記錄實際通過/失敗數字，比對 CLI 自報數字是否一致，不一致則列出差異送回原 CLI 修正。驗證：PM 自己跑出的測試輸出貼在驗收記錄中。
- [ ] 8.2 每支新測試先跑一次確認會失敗（紅燈驗證），若某支測試「怎麼跑都過」（例如 mock 掉了真正要驗證的防護），視為無效測試打回重寫。驗證：PM 抽查至少 5 支新測試的紅燈過程截圖/log。
- [ ] 8.3 開另一支外部 CLI（與步驟 1-7 實作方不同工具）做交叉審查，聚焦找出「測試涵蓋率夠但邏輯本身有洞」的情況（ownership 檢查抓錯 user id 來源、簽章比對用 `==` 而非 timing-safe 比較）。驗證：審查方產出書面審查記錄，列出檢查過的每支 route 與結論。
- [ ] 8.4 若審查或測試過程中發現真實安全漏洞，記錄在本 tasks.md 對應項目並標註「⚠️ 發現漏洞，已回報 Fish，未修復」，不得為了讓測試通過而放寬斷言掩蓋問題。驗證：若有此情況，tasks.md 有對應標註且已實際告知 Fish。
- [ ] 8.5 全部測試通過、審查無 Critical 問題後，更新 `openspec/site-remediation-tracker.md` 第 3 項打勾，執行 `/spectra:archive` 封存本 change，commit + push。驗證：`git log` 有對應 commit，總表檔案已更新。

## ⚠️ 發現的安全漏洞（codex 交叉審查 2026-08-30）

根據 task 8.3 / 8.4：codex 交叉審查產出 3 項發現，其中 2 個 Medium、1 個 Low。均為現有代碼設計缺陷，超出本 SR 補測試的範圍，但應記錄便於後續修復排程。

1. **[Medium] Coupon 最大兌換次數未被消耗**
   - 位置：packages/coupons/src/validate.ts + apps/saas/app/api/checkout/route.ts + apps/saas/lib/orders.ts
   - 現象：驗證 coupon 時檢查 timesRedeemed vs maxRedemptions；建立訂單時沒有原子保留兌換次數，導致同一 coupon 可被重複利用超過限制
   - 風險：已登入買家可無限重複使用受限制的折扣碼，超過 operator 設定上限
   - 建議修復：訂單表存 coupon 關聯；在同一 DB transaction 中原子檢查並遞增 timesRedeemed；失敗/逾時釋放機制
   - 審查詳情：/tmp/codex-security-review.md L74-84

2. **[Medium] 匿名 Coupon rate-limit 可被偽造 x-forwarded-for 規避**
   - 位置：apps/saas/app/api/coupons/validate/route.ts + apps/saas/lib/rate-limit.ts
   - 現象：rate-limit key 直接用完整 x-forwarded-for header；存在已知 repo 文件表示「v1 已知限制是可被偽造」；測試 mock 掉真正 limiter 無法驗證實際可偽造性
   - 風險：未登入遠端 caller 每次變更 x-forwarded-for → 每個值產生新 rate-limit key → 20/min 全局限制無法累積 → 可大量猜測 coupon 碼
   - 建議修復：只接受受信 proxy 產生的規範化 client IP；或由 ingress 注入不可覆寫 header；共享 limiter（非 per-instance map）；測試走真 limiter 並變更 header 驗證
   - 審查詳情：/tmp/codex-security-review.md L86-96

3. **[Low] Course Studio 500 回應洩露內部例外**
   - 位置：apps/saas/app/api/course/studio/route.ts:400-404
   - 現象：將 String(error) 放入 JSON response 的 details 欄位；Prisma 例外可能含 model、constraint、欄位或資料庫實作資訊
   - 風險：有後台權限的 operator/instructor 觸發例外時可取得內部錯誤字串；目前未證明洩露 secret，定為 Low
   - 建議修復：response 只回固定 INTERNAL_ERROR；完整例外寫入 server log 附 correlation id
   - 審查詳情：/tmp/codex-security-review.md L98-104

**結論**：3 項漏洞均為現有生產代碼設計問題，不是本次新增測試造成的缺陷。測試層本身無 Critical 問題，通過交叉審查。後續修復由單獨 SR 排程處理。
