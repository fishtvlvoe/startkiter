## Context

`apps/saas/app/api/` 有 40 支 route，其中 22 支已有 `route.test.ts`，但多數測試只涵蓋業務邏輯正常路徑（呼叫 handler 傳入合法 payload），沒有直接打 HTTP 層驗證未登入、跨 user、簽章錯誤、資源不存在時的行為。另有多支 route 完全沒有測試檔（見 proposal Impact 的 New 清單）。全站盤點報告第 7 節列為優先項目 #3。

## Goals / Non-Goals

**Goals:**
- 每支 SaaS API route 至少有一組測試驗證：未登入 → 401、無權限/非 owner → 403、資源不存在 → 404
- webhook/簽章型 route（payuni notify/period-notify、shopline notify、stripe webhook、github claim）驗證簽章錯誤時拒絕請求
- 涉及跨 user 資料存取的 route（bundles、course/lessons、mcp/connections、pages-cms 等）驗證無法讀取/操作他人資料
- `/api/repo-version` 補上直接路由測試（既有核心邏輯測試在 `packages/github-kit/repo-version.test.ts`，API 層目前沒有）

**Non-Goals:**
- 不重構 route adapter 架構、不抽共用 auth middleware
- 不新增功能、不改變任何 API 的請求/回應格式
- 不處理 signed URL／image proxy（#4）、通知測試（#6）等總表其他項目
- 測試抓到真實漏洞時只記錄不修復（除非 Fish 明確要求併入本輪處理）

## Decisions

1. **測試框架沿用既有**：專案已用 Vitest，HTTP 層測試透過直接呼叫 route handler（`GET`/`POST` export）並建構 `Request` 物件，不啟動真實 server，維持與既有 `route.test.ts` 一致的模式（可參考 `apps/saas/app/api/checkout/route.test.ts` 現有寫法）。
2. **驗證資料來源**：401/403 情境用 Better Auth 的 session mock（比照現有測試 mock 方式，不呼叫真實資料庫 auth）；ownership 情境用 Prisma test client 建立兩個不同 user 的資料列，驗證跨 user 存取被拒。
3. **簽章型 route 測試方式**：payuni/shopline/stripe webhook 測試錯誤簽章時 handler 回傳 4xx 且不寫入 DB（用 spy 驗證未呼叫寫入函式）。
4. **紅燈驗證強制**：每支新測試先確認會失敗（route 目前若真的沒有該項防護，測試會抓到真漏洞——依 proposal Non-Goals 處理：停下回報，不在本 SR 修）。
5. **不分批 SR**：22+16 支 route 測試工作量大但都是同一種模式（照 checklist 逐支補），交給同一支 CLI 依 tasks.md 清單依序做，不拆多張 SR 增加封存管理成本。

## Implementation Contract

- **Behavior**：每支 route 測試檔在 `pnpm --filter saas test`（或 `pnpm test`）下可獨立執行且通過；未登入請求得到 401、非 owner 請求得到 403、不存在資源得到 404、簽章錯誤請求得到 4xx 且無副作用寫入。
- **Interface**：不新增/修改任何 route 的對外介面，測試檔案本身遵循現有 `route.test.ts` 的 import 與 mock 慣例（`vi.mock`、Better Auth session mock、Prisma test client）。
- **Failure modes**：若測試撰寫過程發現 route 缺少對應防護（例如完全沒有 ownership 檢查），該支測試允許先寫成「記錄現況」的紅燈測試並在 tasks.md 對應項目標註「⚠️ 發現漏洞，已回報 Fish，未修復」，不得為了讓測試通過而放寬斷言掩蓋問題。
- **Acceptance criteria**：`pnpm --filter saas test` 全部通過（PM 親自重跑驗證，不採信 CLI 自報數字）；每支測試檔至少涵蓋 401/403/404 三種情境（webhook route 以簽章錯誤取代 403/404）；`spectra validate` 通過。
- **Scope boundaries**：只新增/擴充測試檔，不改動 `route.ts` 生產邏輯本身；不動 route 以外的檔案（除非需要新增測試 fixture/helper）。

## Risks / Trade-offs

- **風險：測試撰寫過程抓到真實漏洞**（例如發現某支 route 真的缺 ownership 檢查）。對策：立即停止該項繼續其他項目，記錄在 tasks.md 對應項並回報 Fish，不擅自決定修復與否（對齊本次新增的資安類 SR 驗收關卡第4條）。
- **風險：22+16 支 route 工作量偏大，單一 CLI 一次做完可能出現後段品質下滑**。對策：tasks.md 依模組分組（bundles/course/mcp/pages-cms/cron/webhook），CLI 依序做完一組就提交一次，PM 分組驗證而非等全部做完才驗。
- **風險：mock Better Auth session 方式與既有測試不一致，導致新測試風格分裂**。對策：實作前先讀 2-3 支既有 `route.test.ts` 確認現有 mock pattern，新測試沿用同一套，不自創新寫法（對齊 lessons.md L077 風格衝突處置）。
