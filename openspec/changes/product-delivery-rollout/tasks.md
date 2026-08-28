## 排序控制 Tasks

### 0. 現有進行中／待決定項目（既有 change，不是本次新開，先列清楚才算「全部功能串一起」）

- [x] 0.1 `multi-gateway-checkout` 14/14 完成。PM 親自用全新測試帳號走完整結帳流程驗證（開帳號→登入→結帳→Stripe 官方付款頁→測試卡刷卡→webhook 200→訂單 paid→ECPay 發票 LA25029705 ISSUED），不只信 Codex 自報。獨立 CR：Critical 0、High 0。commit c3788102 已 push。
- [x] 0.2 `subscriptions-invoice` 22/22 完成。第 6 輪全新獨立 CR：Critical 0、High 0、Medium 0，PASS。API 209/209、Payments 76/76、SaaS 196/196 全綠。ezPay 正式帳號真實開票（DQ70632357）→作廢已驗證。commit 01045ae2 已 push。**兩張皆保持開啟未 archive（Fish 裁決先不封存，等本 change 全部子項完成後一次檢視）。**
- [x] 0.3a `unified-support-desk` 4.5 LINE Messaging API Channel：確認 Fish 已建立既有 Channel「StartKiter 客服」（@958ghjex，Channel ID 2011202536，Provider「1-開發」）。PM 取得 Channel access token（long-lived），呼叫 `getBotInfo` 驗證回傳 200 + Bot 資訊，已寫入 `apps/saas/.env`（`LINE_MESSAGING_CHANNEL_ID`、`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`）。
- [x] 0.3b `unified-support-desk` 4.6 Telegram Bot：確認 Fish 已於 2026-08-22 透過 @BotFather 建立既有 Bot `@Start_Kiter_bot`。PM 取得 Bot Token，呼叫 `getMe` 驗證回傳 `ok:true`，已寫入 `apps/saas/.env`（`TELEGRAM_BOT_TOKEN`）。
- [ ] 0.3c `unified-support-desk` 9.4：三管道（網站/LINE/Telegram）端對端驗證能成功建立工單並在 Chatwoot 收件匣看到。前置條件（4.5/4.6）已補齊，交 Codex 完成 Chatwoot 串接與端對端驗證。
- [ ] 0.4 **`course-pack-mission-execution`（顯示已封存但實際只做了 7/23，剩 16 項）**：核實這是「課神匯入教案的互動關卡執行系統」，屬於進階教學功能，不是本次「把產品交付上線」必要路徑。**判斷：本次不排入交付隊列，不擋主線，待 5 張新交付 change 全部完成後再回頭問 Fish 要不要補或明確 descope。**
- [ ] 0.5 每次本 change 的 task 有進度更新時，順手跑一次「幽靈狀態檢查」：`spectra list` 顯示的完成度是否跟 `git log`／`openspec/changes/archive/` 實際狀態一致，若發現「已封存但 spectra list 誤顯示進行中」的純顯示同步問題可用 `spectra archive <name> -y` 修復（僅限確認 archive/ 目錄已存在的情況）；若發現「顯示封存但實際任務未完成」比照 0.4 回報 Fish，不擅自處理

### 1. 新開的 5 張交付 change（依序 apply）

- [x] 1.1 確認 `vps-production-deployment` 完成 `/spectra-apply`：test/type-check/build 全綠（20/20、26/26、2/2）、第三輪全新 context 獨立 CR Critical/High/Medium/Low 全 0、Coolify 以 `228847af` 部署成功，`curl -L -s -o /dev/null -w "%{http_code}" https://startkiter.dev` 回傳 200。CR 報告：`/tmp/startkiter-vps-independent-cr-final-3.txt`；headers：`/tmp/startkiter-vps-production-final-startkiter-dev.headers`、`/tmp/startkiter-vps-production-final-app.headers`。
- [x] 1.2 Fish 同意，已 `spectra archive vps-production-deployment` → `openspec/changes/archive/2026-08-28-vps-production-deployment`。

- [x] 2.1 確認 `marketing-site-real-content` 完成 `/spectra-apply`：`packages/payments/config.ts` 方案改為 NT$8800 一次買斷、6 語系 `pricing` i18n key 補齊、Acme/Maya Chen 等示範假資料清除；獨立 CR PASS，Critical／High／Medium／Low 全 0。Coolify deployment `h9kn9yhyvytax9pne2srm05j` 以 commit `4fc4ec93` finished，resource running、restart count 0；`curl` 驗證 `startkiter.dev` 與三語路徑 HTTP 200，ego-browser 實測三語首頁與 pricing 均為單一 `NT$8,800` 一次買斷且無舊模板文案。截圖：`/tmp/startkiter-marketing-zh-tw.png`、`/tmp/startkiter-marketing-zh-cn.png`、`/tmp/startkiter-marketing-en.png`、`/tmp/startkiter-marketing-zh-tw-pricing.png`、`/tmp/startkiter-marketing-zh-cn-pricing.png`、`/tmp/startkiter-marketing-en-pricing.png`。
- [x] 2.2 Fish 同意，已 `spectra archive marketing-site-real-content` → `openspec/changes/archive/2026-08-28-marketing-site-real-content`。

- [x] 3.1 確認 `buyer-docs-site` 完成 `/spectra-apply`：`apps/docs` 以 Fumadocs 建立且可本機啟動、涵蓋環境變數/本機開發/Core-Plugin 邊界/Upstream Sync 章節，獨立 CR PASS 且 0 Critical。驗證：docs 測試 5/5、`pnpm type-check` 27/27、`pnpm build` docs/marketing/saas 3/3；ego-browser 實測首頁三分類、五個章節頁（環境變數表格 88 列）、搜尋「環境變數／PAYUNi／dataSpec」皆命中。commit `dc3949c2` 已 push。CR：`openspec/changes/buyer-docs-site/code-review.md`（Critical 0 / High 1 / Medium 3 / Low 4）。`docs.startkiter.dev` DNS 尚未建立：本 change 設計把正式網域列為 Open Question、Migration Plan 明寫本次不部署，因此不擋這張 apply。
- [x] 3.2 Fish 同意，已 `spectra archive buyer-docs-site` → `openspec/changes/archive/2026-08-28-buyer-docs-site`。

- [x] 4.1 確認 `plan-clean-install-package-repo` 完成 `/spectra-apply`：買家最終交付的乾淨代碼包產出流程可重複執行，獨立 CR 第二輪 PASS 且 0 Critical。驗證：單元測試 9/9；`pnpm tsx tooling/scripts/promote-clean-package.ts --dry-run` 納入 1189、排除 4765，included 無 `.env*`／`.pem`／demo／docs/discuss；實拷 `/tmp/startkiter-clean-package-export` 1191 檔無 aiver.me／demo／discuss。第一輪 CR Critical 1（`.env.*` 變體）已修。報告：`openspec/changes/plan-clean-install-package-repo/code-review.md`、`code-review-round2.md`。遠端 `fishtvlvoe/startkiter-starter-kit` 依 Non-Goals 未建立。
- [x] 4.2 Fish 同意，已 `spectra archive plan-clean-install-package-repo` → `openspec/changes/archive/2026-08-28-plan-clean-install-package-repo`。

- [x] 5.1 確認 `course-lifecycle-email` 完成 `/spectra-apply`：訂閱到期等生命週期通知事件觸發正確，獨立 CR 三輪後 PASS 且 0 Critical／0 High。Round 1 CR 抓到 High 3（H1 歡迎信 PENDING 冪等鎖死、H2 訂閱首期重放漏寄、H3 到期提醒失敗誤刪導致重寄），Codex 修復後 Round 2 CR 把 H1 的修法升級為新 Critical（C1：並發過期重放仍會雙寄），Codex 再修（刷新 lease 時間戳）後 Round 3 CR 確認 C1 解決，Critical 0／High 0。PM 自行覆核：`pnpm --filter @startkiter/api test` 212/212、`pnpm --filter @startkiter/saas test period-notify` 9/9、API／SaaS `type-check` 全綠、`spectra analyze` 四維 Clean。全部 10 個 commit（`a81a06ec`…`465a278c`）已 push（`122b03e3..465a278c`）。報告：`openspec/changes/course-lifecycle-email/code-review.md`。**task 5.2 真實買斷+信箱 e2e 已完成**：過程中抓到並修復真實 bug（MVP_SKU 選課邏輯選錯課程，commit `afc36953` 已 push），修復後 PM 直接查 DB（`email_delivery_log` 表）確認寄對課程、狀態 SENT；到期提醒 cron 三次驗證（寄出1筆/不重複/401）皆通過。PM 最終覆核：`pnpm --filter @startkiter/api test` 213/213。
- [x] 5.2 Fish 同意，已 `spectra archive course-lifecycle-email` → `openspec/changes/archive/2026-08-28-course-lifecycle-email`。另從一個孤兒 orca worktree 中救回一份未提交的送達記錄 type/status 篩選功能（對應舊 CR 的 M3 發現），已補進 commit `fac83b24` 並 push。

- [x] 6.1 五張子 change 全數完成，已更新 `docs/discuss/2026-08-27-product-delivery-master-roadmap.md` 反映最終狀態（五張皆完成並封存、`course-pack-mission-execution`／Chatwoot 9.4 為已知未完成項）。`spectra list` 確認僅剩 `product-delivery-rollout`（本身）與 `unified-support-desk`（51/55，卡在 9.4 待 Chatwoot 新家決定）。
