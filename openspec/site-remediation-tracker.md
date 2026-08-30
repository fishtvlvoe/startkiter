# 全站整改總表（site-remediation-tracker）

> 這是純追蹤文件，不是 Spectra change（不會出現在 `spectra list`，也不會被 park/unpark 影響）。
> 每件事項要實作時，開一張獨立的 Spectra change；封存合併進 main 後回來這裡打勾。

來源：`openspec/changes/archive/full-site-audit-2026-08-30.md` 第 7 節建議優先順序，PM 抽查驗證過。

狀態符號：`[ ]` 未開始　`[~]` 對應 SR 進行中　`[x]` 對應 SR 已封存合併進 main

- [x] 1. 修測試環境契約（`test-env-database-url` SR）— 測試指令沒 DATABASE_URL 會直接 exit 1，要能自足跑起來
- [x] 2. 統一 operator 權限模型（`unify-operator-permission-model` SR）— admin.access / isCourseOperator / Pages CMS 三套邊界收斂
- [ ] 3. Route adapter 資安補強 — 22 支 SaaS API 缺直接 HTTP 層測試（401/403/404、簽章、ownership）
- [ ] 4. Signed URL／image proxy／local upload 覆查 — 跨 user key、過期、撤銷、production fallback
- [~] 5. 清理 placeholder／未實作 provider — `PLACEHOLDER_MEDIA`（未處理）、Polar `Not implemented`（已刪除，`remove-unused-polar-provider` SR 完成：台灣/國際市場皆用量低，且 `v1-scope-boundary` 早已正式禁止 Polar 收款，代碼本來就是未接線的殘留鷹架，直接整份移除）
- [x] 6. 補通知／Email／storage／settings 測試 — notifications 7 source/0 test、mail 25 source/1 test 等缺口（`notification-mail-storage-test-coverage` SR 已封存合併）
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
