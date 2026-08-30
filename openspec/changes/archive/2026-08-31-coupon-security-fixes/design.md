## Context

`route-adapter-security-hardening` SR交叉審查（codex，2026-08-30，`/tmp/codex-security-review.md`）發現3項既有代碼漏洞，已記錄在 `openspec/site-remediation-tracker.md`「額外發現」段落。這張SR負責實際修復，而非只補測試。

## Goals / Non-Goals

**Goals:**
- Coupon兌換次數在checkout流程中原子性遞增並持久化，訂單保存coupon關聯，重複呼叫無法超過`maxRedemptions`
- 匿名coupon驗證的rate-limit無法被客戶端偽造的x-forwarded-for繞過
- Course studio的500錯誤不再外洩內部例外字串

**Non-Goals:**
- 不重構coupon或rate-limit整體架構
- 不引入新基礎設施（Redis等），除非DB transaction方式證明不可行
- 不修改coupon業務規則本身（折扣邏輯、有效期等）

## Decisions

1. **Coupon兌換次數修復**：在checkout建立訂單的同一DB transaction內，用悲觀鎖（`SELECT ... FOR UPDATE`或Prisma等效機制）讀取coupon目前`timesRedeemed`，檢查未超過`maxRedemptions`才允許繼續，訂單寫入時同時遞增並保存coupon關聯，確保原子性。
2. **Rate-limit修復**：不直接信任完整的`x-forwarded-for`字串（可能是逗號分隔多層代理，客戶端可在最前面插入任意偽造值）。以環境變數`TRUSTED_PROXY_COUNT`（預設`1`，對應 Coolify+Traefik 單層）從右往左數固定跳數取可信段；左側偽造前綴忽略。代理架構變更只改設定、不改代碼。前提：流量必須經過那 N 層會 append 的代理；app 被直連時 header 整條仍可偽造（網路層責任，非本函式可獨力保證）。
3. **錯誤訊息修復**：course studio的catch block不再把`String(error)`塞進JSON response，改成固定訊息，完整內容用現有logger（若無則加最小log呼叫）記錄，附加可追蹤的correlation id方便事後查log。

## Implementation Contract

- **Behavior**：同一coupon code在多次併發checkout請求下，最終成功兌換數不超過`maxRedemptions`；rate-limit在偽造x-forwarded-for的情況下仍能正確限制同一真實來源的請求頻率；course studio發生例外時客戶端只收到`INTERNAL_ERROR`，看不到Prisma/資料庫細節。
- **Interface**：不改變checkout/coupon validate/course studio API的正常回應格式，只改變邊界情況（超額兌換、rate-limit判斷、錯誤訊息）的行為。
- **Failure modes**：DB transaction衝突時（悲觀鎖等待逾時），checkout回傳明確的重試提示而非靜默失敗。
- **Acceptance criteria**：新增並行競態測試（多個併發請求模擬同一coupon兌換）驗證不超過上限；rate-limit測試驗證偽造x-forwarded-for無法繞過；course studio測試驗證500回應不含內部例外字串；`pnpm test`全部通過（PM親自重跑）；`spectra validate`通過。
- **Scope boundaries**：只修復這3項具體漏洞，不擴大到其他rate-limit或錯誤處理邏輯的全面重構。

## Risks / Trade-offs

- **風險：修復過程中發現部署環境（Zeabur/Traefik）實際的x-forwarded-for注入行為跟假設不同**。對策：實作前先確認實際部署層架構（讀`docs/deploy-and-public-url.md`或詢問Fish），不可憑空寫死header解析邏輯。
- **風險：DB transaction悲觀鎖可能影響checkout效能**。對策：鎖範圍限定在coupon本身這一列，不鎖整個訂單流程，將影響降到最低。
- **風險：這是修復類SR（不是純補測試），改動生產邏輯，風險等級較高**。對策：走完整標準流程（TDD紅燈→實作→PM驗證→交叉審查），不可簡化。
