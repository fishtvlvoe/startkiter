# 全站整改總表（site-remediation-tracker）

> 這是純追蹤文件，不是 Spectra change（不會出現在 `spectra list`，也不會被 park/unpark 影響）。
> 每件事項要實作時，開一張獨立的 Spectra change；封存合併進 main 後回來這裡打勾。

來源：`openspec/changes/archive/full-site-audit-2026-08-30.md` 第 7 節建議優先順序，PM 抽查驗證過。

狀態符號：`[ ]` 未開始　`[~]` 對應 SR 進行中　`[x]` 對應 SR 已封存合併進 main

- [x] 1. 修測試環境契約（`test-env-database-url` SR）— 測試指令沒 DATABASE_URL 會直接 exit 1，要能自足跑起來
- [x] 2. 統一 operator 權限模型（`unify-operator-permission-model` SR）— admin.access / isCourseOperator / Pages CMS 三套邊界收斂
- [x] 3. Route adapter 資安補強 — 22 支 SaaS API 缺直接 HTTP 層測試（401/403/404、簽章、ownership）
  - SR `route-adapter-security-hardening`：5 commits，22 個測試檔（16 新增 + 6 修改），283 tests 全通過
  - 交叉審查：codex security-diff-scan，詳細報告 `/tmp/codex-security-review.md`（154 行）；無 Critical，發現 2 個 Medium + 1 個 Low 漏洞（見下方新增項目）
- [x] 4. Signed URL／image proxy／local upload 覆查 — 跨 user key、過期、撤銷、production fallback（交叉審查完成：✓ 無真實漏洞；10 個新測試檔案驗證了 ownership 綁定、SSRF 基本防護、expiresIn 檢查、local fallback 存取控制；後續強化建議已記錄至「額外發現」）
- [x] 5. 清理 placeholder／未實作 provider — `PLACEHOLDER_MEDIA`（已處理：`packages/course/catalog.ts` 沒設定 `BUNNY_LIBRARY_ID` 時，production 環境改為 fail-closed 直接拋錯，不再用 demo 影片頂替付費課程內容；dev/test 環境維持 fallback 方便開發，比照結帳金流「沒設定就 503」的既有規則）、Polar `Not implemented`（已刪除，`remove-unused-polar-provider` SR 完成：台灣/國際市場皆用量低，且 `v1-scope-boundary` 早已正式禁止 Polar 收款，代碼本來就是未接線的殘留鷹架，直接整份移除）
- [x] 6. 補通知／Email／storage／settings 測試 — notifications 7 source/0 test、mail 25 source/1 test 等缺口（`notification-mail-storage-test-coverage` SR 已封存合併：notifications 9 tests、mail 15 tests、storage 3 tests、settings-crypto 全綠；交叉審查確認 mail mock 未過度、settings-crypto 用 AES-256-GCM 正確實作 IV 隨機生成+認證tag驗證）
- [ ] 7. Chatwoot 三管道 E2E（`unified-support-desk` task 9.4）— 已由老闆確認暫時擱置，非本輪優先
- [ ] 8. Real provider acceptance matrix — subscription/period notify/退款/發票要留 webhook+DB+idempotency 證據
- [ ] 9. Schema/migration rehearsal — 查 redundant index、status/slug contract，乾淨 DB 跑一次 migrate deploy
- [ ] 10. Mission／Organization／site-agent 去留決策 — 先由老闆做產品取捨，避免多條半完成主線

## 對應 SR 一覽（隨開隨補）

| # | SR 名稱 | 狀態 |
|---|---|---|
| 1 | test-env-database-url | 已封存合併（`openspec/changes/archive/2026-08-30-test-env-database-url/`） |
| 2 | unify-operator-permission-model | 已封存合併（`openspec/changes/archive/2026-08-30-unify-operator-permission-model/`） |
| 3 | remove-unused-polar-provider | 已封存合併（`openspec/changes/archive/2026-08-30-remove-unused-polar-provider/`，只涵蓋第5項的 Polar 部分，`PLACEHOLDER_MEDIA` 仍未處理） |

## 額外發現（本次整改過程中新增，未在原盤點報告出現）

- Prisma 產生的型別檔案過期：`pnpm --filter api type-check` 有 `PrismaClient` 缺 `page` 屬性、`ContentType`/`ContentStatus` 缺匯出的錯誤，確認是既有問題（改 SR1 前後皆存在，非本次改動造成）。需要另開 SR 處理（跑 `prisma generate` 重新產生型別，或確認 schema 是否同步）。
- SR2 撰寫過程發現：權限邏輯不是原盤點報告講的 3 套，是 **4 套**（多一個 `apps/saas/lib/operator.ts`，含 1 個死代碼函式），且有 **2 份正式規格文件**（`operator-settings`、`course-instructor-scoped-access`）寫死了舊規則，這次需要一併發 MODIFIED delta 更新，否則規格跟代碼會對不上。已補進 SR2 的 proposal/design/tasks。
- 買家更新機制盤點（Fish 提問後查證，非缺失，記錄現況）：買家拿到的是 GitHub「用範本建立」的獨立倉庫（等同下載，非 fork，跟我們的乾淨倉庫沒有 git 血緣關係）。更新機制已落地：`STARTKITER_VERSION` 版本比對（`packages/github-kit/repo-version.ts`，有測試）+ `/api/repo-version`（**沒有直接路由測試**，跟第 3 項的 22 支缺測試 API 是同一批缺口）+ `/marketplace` 頁面顯示可複製的同步提示 + 買家自己用本機 AI 工具觸發 `git pull upstream main --rebase`（跟 supastarter 官方文件的更新方式一致，不衝突）。**待辦**：`/api/repo-version` 補一支直接路由測試（併入第 3 項一起做，不用單獨開 SR）。

### 【新增】SR 第 3 項審查發現的安全漏洞（待開新 SR 修復）

route-adapter-security-hardening SR 的 codex 交叉審查（2026-08-30）發現 3 項現有代碼設計漏洞，非本次新增測試造成，但應記錄便於後續修復排程。詳細審查報告：`/tmp/codex-security-review.md`。

1. **[Medium] Coupon 最大兌換次數未被消耗、可重複利用超過限制**
   - 程式碼位置：
     - `packages/coupons/src/validate.ts:15-29` — 僅讀取並檢查，未持久化消耗
     - `apps/saas/app/api/checkout/route.ts:63-71, 82-84` — 驗證後未保存 coupon 關聯、未遞增 timesRedeemed
     - `apps/saas/lib/orders.ts:34-60` — Order 寫入不保存 coupon id/code
   - 攻擊路徑：已登入買家取得 maxRedemptions 有限的碼 → 重複呼叫 checkout → 每次讀到未增加的 timesRedeemed → 建立折扣訂單超過上限
   - 建議修復：訂單保存 coupon 關聯；同一 DB transaction 中原子檢查+遞增兌換次數；失敗/逾時釋放策略；補並行競態測試
   - 審查詳情：`/tmp/codex-security-review.md` L59-84

2. **[Medium] 匿名 Coupon rate-limit 可被偽造 x-forwarded-for 規避、20/min 限制失效**
   - 程式碼位置：
     - `apps/saas/app/api/coupons/validate/route.ts:11-17` — 直接把完整 x-forwarded-for 當 rate-limit key
     - `apps/saas/lib/rate-limit.ts:1-24` — 只依傳入字串計數，無可信 proxy 正規化、無伺服器端身分綁定
   - 已知限制：repo 既有文件明載「v1 已知限制是可被偽造」（tasks.md 記載）；Traefik ingress 若強制覆寫可降低風險但未綁成應用不變量
   - 攻擊路徑：未登入遠端 caller 每次換 x-forwarded-for → 每個值新 Map key → 20/min 限制無法累積 → 可大量猜 coupon 碼
   - 建議修復：只接受受信 proxy 產生的規範化 client IP；或 ingress 注入不可覆寫 header；改用跨 instance shared limiter；測試走真 limiter 並變更 header 驗證
   - 審查詳情：`/tmp/codex-security-review.md` L76-89

3. **[Low] Course Studio 500 回應洩露內部例外字串**
   - 程式碼位置：
     - `apps/saas/app/api/course/studio/route.ts:400-404` — 將 `String(error)` 放入 JSON response 的 `details` 欄位
   - 洩露內容：Prisma 例外可能含 model、constraint、欄位或資料庫實作資訊
   - 風險等級：Low（需要既有後台權限且觸發例外；目前未見洩露 secret）
   - 攻擊路徑：已登入且可進入 Course Studio 的 operator/instructor 觸發資料庫或 handler 例外 → 取得內部錯誤字串
   - 建議修復：response 只回固定 `INTERNAL_ERROR`；完整例外寫入 server log 附 correlation id
   - 審查詳情：`/tmp/codex-security-review.md` L91-99

**後續決策**：Fish 待判斷修復 SR 優先順序（立刻排進 #8/#9 前，或留給後續排程）。

- 第 4 項（signed-url-access-review）後續強化建議（非本 SR 必須項，可作為下一輪 change 考慮）：image-proxy SSRF 測試目前覆蓋基本繞過（loopback IP、大小寫、百分比編碼），建議後續補充高級攻擊向量測試——DNS rebinding（localhost 解析為攻擊者 IP）、HTTP redirect 繞過（合法 CDN 但 302 跳轉到內網）、IPv6 loopback（::1）與 IPv6-mapped IPv4（::ffff:127.0.0.1）、協議升級嘗試（ws:// 等）。交叉審查確認目前實裝無真實漏洞，上述為「防禦深度」加強項。
- **2026-08-31 修正記錄**：發現先前 SR#3（route-adapter-security-hardening）的合併是空 merge，代碼從未真正進入 main（`git merge-base --is-ancestor` 驗證確認），總表誤標為「已封存合併」。已補做真正合併，補回 13 個遺漏的測試檔案（bundles/[id]、bundles/admin、checkout、coupons/validate、course/ai-notes/settings、course/lessons、cron 相關、github/claim 相關、mcp/connections、pages-cms 三份、payuni/notify、payuni/return、repo-version）。教訓：合併前只看 commit message／tracker 記錄不夠，要用 `git merge-base --is-ancestor` 或直接 diff stat 驗證內容真的進來了。
