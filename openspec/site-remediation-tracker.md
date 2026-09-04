# 全站整改總表（site-remediation-tracker）

> 這是純追蹤文件，不是 Spectra change（不會出現在 `spectra list`，也不會被 park/unpark 影響）。
> 每件事項要實作時，開一張獨立的 Spectra change；封存合併進 main 後回來這裡打勾。

## 🎯 里程碑：讓網站完整到可以做「正式金流測試」

**目標**：#10a／#10b／#10c／#11 全部完成，代表網站功能面完整、經過群眾模擬壓力測試站得住，Fish 才進場做 #8（真實金流：訂閱、退款、發票，需要親自在電腦前填信用卡/ATM資訊）跟 #7（Chatwoot 客服）。

**分工（2026-08-31 Fish 定案）**：
- **開發**：Codex、cursor-agent、Grok 各接一張 SR 動手實作
  - Codex → `mission-frontend-entry`（範圍最大，需要新增 2 個頁面 + 串接既有 API）
  - cursor-agent → `organization-completeness-review`（需要細膩的稽核+修復流程）
  - Grok → `port-site-agent`（範圍最小最機械化，搬遷+調整 import，符合 Grok 目前只接輕量任務的定位）
- **測試**：agy 用 `/ego-browser` 執行群眾模擬壓力測試（#11）
- **驗收**：PM（我）親自 grep+重跑測試+走一次流程，不只信 CLI 自報

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
- [x] 9. Schema/migration rehearsal（2026-08-31 PM 完成）— 查出1個 redundant index（`CourseSubscription.userId` 單獨索引被 `[userId, courseId]` 複合索引覆蓋，已移除）；slug 欄位全數有 `@unique`/`@@unique` 約束，無缺口；status 欄位發現型別不一致（部分 model 用 enum、部分用 plain String 且大小寫慣例不一）但屬既有設計、非本輪範圍，記錄備查不強改；用 colima 起乾淨 PostgreSQL 16 容器，42 個 migration 全部 `migrate deploy` 成功且 `migrate status` 確認無 drift；700 tests + type-check 全綠（mail package 在 turbo 平行執行下有既有 env 汙染 flaky，單獨跑 3 次穩定通過，與本次改動無關，不在本輪修復範圍）
- [x] 10. Mission／Organization／site-agent（2026-08-31 Fish 已裁決方向，拆成 3 張獨立 SR，3 子項全完成）
  - [x] 10a. site-agent 補搬遷（`port-site-agent` SR 已完成合併，commit 959eeecd；Grok 搬遷代碼，PM 驗證全部任務通過：auth 檢查正確、工具白名單安全、測試全綠）
  - [x] 10b. Mission 補前台入口（`mission-frontend-entry` SR 已完成合併，commit f16d5497；Codex 實作前台頁面，cursor-agent 審查發現 C1 Critical 問題並修正：後台列表+詳情頁、學員端詳情頁、表單提交完整串接；688 tests passing，C1 修正後測試全綠）
  - [x] 10c. Organization 完整度覆查（`organization-completeness-review` SR，已完成合併，commit 7f94d89a；cursor-agent 完成 Phase 1 稽核+Phase 2 修復：checkout→order.organizationId、成員課程存取、邀請 owner 邊界、錯誤通知、刪 org 政策；687 tests passing）
- [x] 11. 群眾模擬壓力測試（2026-08-31 Fish 新增+完成，commit c766327a）— 3支agy（Antigravity CLI）+ego-browser平行扮演新手學員/付費學員/講師三種角色，高頻互動測試。發現並修復2個真實UI bug：
  - 課程教室播放頁（classroom-client.tsx等3檔）原本寫死`bg-neutral-950`等硬編碼深色class，不跟隨淺色/深色主題設定；已改用語意化theme token（bg-background/bg-card/text-foreground等），淺色/深色皆正確渲染（crowd-test-newbie實測驗證）
  - 側邊欄選單「管理」項目與「一般使用者」項目混雜無分區；已加`requiresOperator`旗標+視覺分隔線+「管理」分組標題，一般學員只看到4項基本選單，operator才看到完整管理分區（crowd-test-paid-learner實測驗證，含真實非operator帳號buyer-sandbox@example.com測試）
  - 3支agy中2支（paid-learner／instructor）獨立做出幾乎相同的側邊欄分區修復，判定後採用paid-learner版本（測試覆蓋較完整），instructor的重複實作未合併（其worktree已捨棄）
  - 額外確認：0元coupon結帳流程（TEST100OFF）在補齊本機PAYUNi Sandbox測試憑證後，正確導向沙箱結帳通道，訂單/課程權限開通正常
  - 最終驗證：700個測試全過（含site-agent 10個），type-check全綠
- [x] 12. UI/UX 一致性掃描（`ui-ux-consistency-sweep` SR，已完成合併，commit `0633d9f4`，2026-08-31）— 三階段完成：
  - Phase 1：PM 用 ego-browser 截圖盤點 20 張（學員端/後台/通用元件）
  - Phase 2：網頁設計師 subagent 審查，PM 交叉驗證發現子代理原判 2 個 Critical 是截圖流程失誤造成的誤判（深色模式其實跟隨正常、學員側邊欄權限其實正確無外洩），訂正後真正 Critical 只有 1 個：`(operator)` route group（quiz-admin/review-admin/assignment-admin 等）缺 AppWrapper，完全沒有共用 header/側邊欄
  - Phase 3：cursor-agent 修復並經 PM 親自複驗（328 tests + 28 type-check 全綠，用 ego-browser 建 operator 帳號實測點過三處修復）：
    - `(operator)/layout.tsx` 補上 AppWrapper，6個後台頁面現在有完整 shell
    - 課程模組 8 個子功能（課程管理/測驗管理/評價與留言管理/作業管理/課程綁定包/新生問卷/媒體庫/CoursePack任務）收攏成一個「課程」一級選單，側邊欄巢狀展開（方案A），原路徑全部保留，`isOperator` 權限判斷不受影響
    - 額外發現並修復：側邊欄拖曳自訂分組模式的 isActive 判斷讀取 stale prop，改用 `usePathname()` 即時計算，順帶修好 admin/media、admin/email-settings 選中無高亮的問題
    - `docs/buyer-extension-convention.md` 補上「側邊欄選單掛載（MOUNT_POINTS）」規範章節，用課程模組整合後的真實代碼當範例，買家未來擴充自己的模組有規範可循
- [x] 7. Chatwoot 三管道 E2E（`unified-support-desk` task 9.4）— **2026-09-02 Fish 裁決「路 C：先不做客服，用 email 頂著」，本項以「不做」結案**：Chatwoot webhook 派送不穩定（3.6）是第三方軟體自身問題，產品尚未開賣、無真實客戶進線，不值得修或自建客服後台。
  - 已開 `support-email-fallback` SR 並封存：新增 `NEXT_PUBLIC_SUPPORT_CHANNEL` 開關（預設 email），客服入口改開 mailto（收件 fish@fishot.com），不載入 Chatwoot widget
  - Chatwoot／LINE／Telegram 程式碼、資料表與測試全數保留，設 `NEXT_PUBLIC_SUPPORT_CHANNEL=chatwoot` 即可切回，屆時再補做三管道 E2E
  - `unified-support-desk` 已達 55/55 並封存（`archive/2026-09-02-unified-support-desk/`）
  - 驗證：apps/saas 346 tests 全過、type-check exit 0、ego-browser 實測 mailto 導航正確
- [ ] 8. Real provider acceptance matrix — subscription/period notify/退款/發票要留 webhook+DB+idempotency 證據。**排序調整（2026-08-31）**：移到最後，同上原因

## 2026-09-02 SR 狀態校正與客服決策

**幽靈狀態修正**：`spectra list` 顯示 `port-site-agent` 0/7、`mission-frontend-entry` 0/7，
實際上代碼早已合併進 main（493c3a4e、b167a273），只是勾選 commit 留在未合併的
`fishtvlvoe/port-site-agent` 分支上。PM 親自重跑驗證後補齊勾選並封存：
- `2026-09-02-port-site-agent`（site-agent 測試 10/10；ego-browser 實測未登入導向 /login、
  登入後對話只查得到自己的訂單）
- `2026-09-02-mission-frontend-entry`（course-pack 測試 10/10；ego-browser 實測後台權限擋下、
  學員端 5 個 Mission 渲染、表單送出、檢查結果）
- `2026-09-02-organization-completeness-review`（17/17 早已完成，只差封存）

**客服決策**：見上方第 7 項。

**2026-09-03 更正一筆誤記**：先前 `product-delivery-rollout` task 0.4 記載
`course-pack-mission-execution` 只做了 7/23、剩 16 項待補。查證後確認是引用到過期快照——
該 change 封存過兩次，`archive/2026-08-25-...`（7/23）是中途版，`archive/2026-08-28-...`（23/23）
才是最終版。代碼實證：surface-block-map / check-registry / deployment-heartbeat-fresh /
bunny-zone-created / run-mission-check 五個檔案皆存在；`packages/course` 測試 109 passed / 0 failed，
course-pack 相關 5 檔 22 tests 全過。**不需補做、不需 descope，0.4 已改為完成。**
教訓：同一張 change 若封存多次，引用時要確認取的是最新那份日期目錄。

**新發現的既有問題（2026-09-03 已修）**：`packages/api` 有 2 個發票作廢測試把 `invoiceDate` 寫死
`2026-08-24`，而 `assertInvoiceVoidable` 用真實 `now` 判斷是否跨月，因此 2026-09-01 起
必然失敗（`invoice-events.test.ts`、`invoice-operations.test.ts`）。非本次改動造成，
修法應為測試注入固定的 `now` 或改用相對日期。待 Fish 排優先順序。

## 2026-09-03 跨月退款自動折讓（`auto-allowance-on-cross-month-refund`，已封存）

Fish 裁決：退款一律全額，跨月時「開多少折讓」無決策價值，不該每筆都要人進後台按一次。

- 跨月退款由「標記 `REFUND_NEEDS_ALLOWANCE` 等人工」改為自動開立全額折讓（`amount - allowanceTotal`）
- **不放寬**「跨月不可作廢」的法規界線；不動「void 已送出但成敗未知」的路徑（雙重沖銷風險）
- 抽出含全部 13 條併發保護的共用核心供 admin 與自動流程共用，不複製第二套
- 順帶修掉 2 個寫死 `invoiceDate` 導致 9/1 起必然失敗的測試（注入固定 `now`，業務規則未動）

**PM 兩輪攔截（都不是靠測試抓到的，是人工覆核）**：
1. 實作方在範圍外拿掉 provider allowance 的 `ambiguous` 旗標，理由「與 void 對齊」。覆核不成立：
   void 重複執行冪等、allowance 重複執行累加金額；且 `FAILED` 狀態在重試路徑無任何檢查
   （僅擋 `SUCCEEDED`/`PENDING`），逾時將造成雙重折讓。已退回還原並補測試。
2. 獨立 CR 判 FAIL：併發測試的 `updateMany` mock 不比對 `where`、一律回 `count:1`，
   樂觀鎖從未被驗證（測試會過是靠業務層短路）。PM 親自改為真比對，改嚴格後 17 tests 仍全過，
   證實樂觀鎖有效非假 mock 蒙混。

**過程教訓（已記入 pm-evidence.md）**：判斷外部 CLI 是否還在工作，**用量百分比是否上升比畫面
轉圈動畫可靠**——cursor-agent 卡死時 spinner 仍在轉，但用量 25 分鐘沒動、CPU 掉到 1.3%。
agy（Antigravity）接獨立審查跑 30 分鐘後 terminal 直接 exited，未產出任何報告，
畫面在執行中即無法透過 `orca terminal read` 取得完整內容。兩者最後皆由 PM 接手完成。

**已知未涵蓋**：未連真實 DB、未打真實發票商 API。建議正式環境第一筆跨月退款由 Fish 親自確認。

**後續建議 → 已完成（2026-09-04，`allowance-needs-review-admin-action` SR）**：
`ALLOWANCE_NEEDS_REVIEW`／`VOID_NEEDS_REVIEW` 後台補上「確認已完成」「確認未完成，
解除卡住」兩顆按鈕，operator 查過供應商後台後回來人工登記結果。獨立審查（資安稽核師
子代理）未發現 Critical/High 漏洞；ego-browser 實測兩條路徑並用 SQL 直接讀 DB 驗證
`allowanceTotal`／`status`／`attentionReason` 皆正確；273 + 349 tests 全綠，type-check
全綠。已知限制：這是「人工判斷後補登記」，系統不驗證 operator 講的是否屬實
（跟現有「開立折讓」讓 operator 自己輸入金額同一個信任前提）。

## 對應 SR 一覽（隨開隨補）

| # | SR 名稱 | 狀態 |
|---|---|---|
| 1 | test-env-database-url | 已封存合併（`openspec/changes/archive/2026-08-30-test-env-database-url/`） |
| 2 | unify-operator-permission-model | 已封存合併（`openspec/changes/archive/2026-08-30-unify-operator-permission-model/`） |
| 3 | remove-unused-polar-provider | 已封存合併（`openspec/changes/archive/2026-08-30-remove-unused-polar-provider/`，只涵蓋第5項的 Polar 部分，`PLACEHOLDER_MEDIA` 仍未處理） |
| 4 | coupon-security-fixes | 已封存合併（`openspec/changes/archive/2026-08-31-coupon-security-fixes/`，commit f5961a93，671 tests 全過） |

**2026-08-31 真實瀏覽器實測（agy + ego-browser，commit 320d3ca6）**：單元測試全過之後，額外用真實瀏覽器操作驗證 coupon-security-fixes 這批改動，抓到 2 個單元測試測不到的問題並當場修好：
1. 結帳頁面完全沒有 coupon 輸入框——後端邏輯修好了，但前端從來沒有 UI 讓使用者真的用到，等於功能做完但用戶用不到。已補上輸入框、驗證、即時折扣顯示。
2. Course Studio 頁面在瀏覽器會直接崩潰（`Module not found: Can't resolve 'dns'`）——`BatchImportDialog.tsx` 從 barrel 檔案匯入，意外拉進了 server-only 的 Prisma/pg 依賴到瀏覽器端。已改成子路徑匯入隔離。
修復後 rate-limit 實測：18-25 次高頻請求精準觸發 429，正常使用不受影響。666 個既有測試全過，type-check 全綠。

## 群眾模擬測試計畫（2026-08-31 Fish 提出，參考 Nate Herk「Clone Calendly」影片的 agentic swarm testing 模式）

**核心概念**：不是等人工一步步點，是叫多支 AI 代理人假扮成不同使用者，高頻率反覆操作、互相測試、找到 bug 就修，修完繼續測，循環到穩定為止。全程用 `agy`（Antigravity CLI）驅動 `/ego-browser` skill（唯一核准的瀏覽器自動化工具，deny-list.md 硬規則）。

**步驟**：
1. 建一個 0 元課程（測試用，不涉及真實金流）
2. 多支 agy + ego-browser 各自扮演不同角色的使用者，用不同方式註冊/登入這個課程
3. 每個角色驗證：影片播放正常、私訊功能正常、所有課程內功能都可互動
4. 多輪高頻互動模擬真實使用者亂點的情境（不是照劇本走一次，是重複、隨機、多角度）
5. 派 3 支平行 agy，各自從不同使用者情境切入（例如：新手第一次用／付費學員／講師視角），同時測試+回報問題
6. 發現的 UI/邏輯問題直接修，修完同一輪重新驗證

**與參考影片的對照**：影片裡是「50 個 agent 同時衝一個 app 找 bug，修完再測」的循環，我們規模小很多（3 支 agy），但精神一樣——不靠人工一步步點，讓 AI 大量、高頻、多角度地把使用者會做的事都做一遍。

## 額外發現（本次整改過程中新增，未在原盤點報告出現）

- Prisma 產生的型別檔案過期：`pnpm --filter api type-check` 有 `PrismaClient` 缺 `page` 屬性、`ContentType`/`ContentStatus` 缺匯出的錯誤，確認是既有問題（改 SR1 前後皆存在，非本次改動造成）。需要另開 SR 處理（跑 `prisma generate` 重新產生型別，或確認 schema 是否同步）。
- SR2 撰寫過程發現：權限邏輯不是原盤點報告講的 3 套，是 **4 套**（多一個 `apps/saas/lib/operator.ts`，含 1 個死代碼函式），且有 **2 份正式規格文件**（`operator-settings`、`course-instructor-scoped-access`）寫死了舊規則，這次需要一併發 MODIFIED delta 更新，否則規格跟代碼會對不上。已補進 SR2 的 proposal/design/tasks。
- 買家更新機制盤點（Fish 提問後查證，非缺失，記錄現況）：買家拿到的是 GitHub「用範本建立」的獨立倉庫（等同下載，非 fork，跟我們的乾淨倉庫沒有 git 血緣關係）。更新機制已落地：`STARTKITER_VERSION` 版本比對（`packages/github-kit/repo-version.ts`，有測試）+ `/api/repo-version`（**沒有直接路由測試**，跟第 3 項的 22 支缺測試 API 是同一批缺口）+ `/marketplace` 頁面顯示可複製的同步提示 + 買家自己用本機 AI 工具觸發 `git pull upstream main --rebase`（跟 supastarter 官方文件的更新方式一致，不衝突）。**待辦**：`/api/repo-version` 補一支直接路由測試（併入第 3 項一起做，不用單獨開 SR）。

### 【新增】SR 第 3 項審查發現的安全漏洞（待開新 SR 修復）

route-adapter-security-hardening SR 的 codex 交叉審查（2026-08-30）發現 3 項現有代碼設計漏洞，非本次新增測試造成，但應記錄便於後續修復排程。詳細審查報告：`/tmp/codex-security-review.md`。

**✅ 已於 `coupon-security-fixes` SR 修復（commit f5961a93，2026-08-31）**：以下 3 個漏洞全部修好，PM 驗證 + 兩輪交叉審查（cursor-agent 實作、Codex 審查）確認 Confirmed Fixed。

1. **[Medium，已修復] Coupon 最大兌換次數未被消耗、可重複利用超過限制**
   - 程式碼位置：
     - `packages/coupons/src/validate.ts:15-29` — 僅讀取並檢查，未持久化消耗
     - `apps/saas/app/api/checkout/route.ts:63-71, 82-84` — 驗證後未保存 coupon 關聯、未遞增 timesRedeemed
     - `apps/saas/lib/orders.ts:34-60` — Order 寫入不保存 coupon id/code
   - 攻擊路徑：已登入買家取得 maxRedemptions 有限的碼 → 重複呼叫 checkout → 每次讀到未增加的 timesRedeemed → 建立折扣訂單超過上限
   - 建議修復：訂單保存 coupon 關聯；同一 DB transaction 中原子檢查+遞增兌換次數；失敗/逾時釋放策略；補並行競態測試
   - 審查詳情：`/tmp/codex-security-review.md` L59-84

2. **[Medium，已修復] 匿名 Coupon rate-limit 可被偽造 x-forwarded-for 規避、20/min 限制失效**
   - 程式碼位置：
     - `apps/saas/app/api/coupons/validate/route.ts:11-17` — 直接把完整 x-forwarded-for 當 rate-limit key
     - `apps/saas/lib/rate-limit.ts:1-24` — 只依傳入字串計數，無可信 proxy 正規化、無伺服器端身分綁定
   - 已知限制：repo 既有文件明載「v1 已知限制是可被偽造」（tasks.md 記載）；Traefik ingress 若強制覆寫可降低風險但未綁成應用不變量
   - 攻擊路徑：未登入遠端 caller 每次換 x-forwarded-for → 每個值新 Map key → 20/min 限制無法累積 → 可大量猜 coupon 碼
   - 建議修復：只接受受信 proxy 產生的規範化 client IP；或 ingress 注入不可覆寫 header；改用跨 instance shared limiter；測試走真 limiter 並變更 header 驗證
   - 審查詳情：`/tmp/codex-security-review.md` L76-89

3. **[Low，已修復] Course Studio 500 回應洩露內部例外字串**
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
