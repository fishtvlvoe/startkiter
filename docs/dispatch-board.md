# StartKiter 派工看板

> 派工師讀這份決定要派誰做什麼。每次任務狀態改變，派工師／PM 都要更新這份檔案（勾選、改狀態、填 E2E 結果），再重新產生 `docs/dispatch-board.html`。
> 進度數字一律用 `grep -c '^\- \[x\]' openspec/changes/<name>/tasks.md` 實跑算出來，不用 `spectra list` 的快取數字（2026-08-21 發現對不上）。

## 派工分級原則（2026-08-21 老闆定案）

不是「PM 寫計畫、其他都能外包」這條線，是**任務能不能被獨立、可靠地驗證**：

| 特徵 | 派給誰 |
|---|---|
| 有明確規格照抄、機械性、輸出容易肉眼核對（讀檔摘要、照 design.md 抄的型別/CRUD、照現有格式翻譯、純文件） | **Haiku 子代理** |
| 需要抓根因、跨檔案除錯、架構判斷、驗收別人做的東西（含驗收 Haiku/外部 CLI 自報）、UI 視覺 demo（會踩到平台限制，如 CSP/元件庫，需要有經驗判斷） | **Sonnet 子代理**（我自己或 Sonnet 等級） |
| money-related（金流計算、結帳、退款、資料庫 schema 遷移）、git/worktree 等高風險基礎設施操作 | **PM 親自**，不外派 |

依據：2026-08-21 這個 session 踩的坑（子代理漏寫測試、tasks.md 假完成沒 commit、icon bug 只有真人點才抓到、worktree 分支衝突）全部發生在「除錯/驗證/判斷」類工作，不是規劃——Haiku 弱在這塊，派下去只會讓漏洞更難被抓到。

## 圖例

- 狀態：🟢 可收尾／✅ 已完成／🔵 進行中／⏸️ 排隊中／📝 待規劃／🔴 卡關
- E2E：⬜ 未跑／🟡 跑過有失敗／✅ 全過

---

## 工作項目

### 1. interactive-learning-system
- 狀態：✅ 已封存（2026-08-21）
- Task 進度：43/43（100%）
- E2E：⬜ 未跑正式 e2e（archive 前已用行為驗證代替）

### 2. unified-support-desk
- 狀態：🔵 進行中（僅剩卡關項目）
- Task 進度：43/49（88%）
- 指派對象：
  - 第 3 節（Chatwoot VPS 建置）→ 🔴 卡關，需要真人開帳號/花錢，經老闆確認先跳過不做
  - 第 4.5/4.6（LINE/Telegram bot 帳號申請）→ 🔴 卡關，需要真人操作，跳過不做
  - 第 4.1-4.4/4.7/4.8（LINE/Telegram webhook 程式碼）→ ✅ 已完成，agy→codex（agy 額度用完自動切換），PM 合併時發現並修正一個真實 bug（E/F 兩包各自加了同名不同簽章的 `createConversation`，物件字面量後定義的悄悄蓋掉前一個）
  - 第 7 節（前端客服入口）→ ✅ 已完成，agy→codex
  - 第 9 節（Review 與驗收）→ ✅ 9.1-9.3 完成，9.4（三管道實際截圖）依賴第 3/4.5/4.6 節卡關，暫時擱置
- E2E：⬜ 未跑（9.4 卡關，無真實 Chatwoot 實例可測）
- 備註：Chatwoot VPS 老闆一度以為在別的地方（「ego」專案）設定過，PM 查證 `.env`／`.env.local`／`/Users/fishtv/Development/ego`（完全不相關的 Cloudflare Workers 專案）皆無 Chatwoot 憑證，確認尚未真的建置，經老闆確認暫時擱置不追

### 3. platform-shell-plugin-architecture
- 狀態：🔵 進行中
- Task 進度：90/129（70%，2026-08-21 22:xx 重算：K 包 Marketplace + Phase 8 github-kit 補 commit 後的真數字）
- 子項：
  - Phase 4（Marketplace 展示+模版選擇，task 15-23）→ ✅ 已完成並**補進 main**（原本做完的分支 `worktree-bundles-coupons` 一直沒合併，main 上顯示「待做」是假象，2026-08-21 PM 發現並 fast-forward 合併）
  - Phase 6（Core 邊界文件，task 28-30）→ ✅ 已完成（agy）
  - Phase 7（既有測試更新+全面驗收，task 31-32）→ 待做，**PM 親自驗收**，實作可派 Codex
  - Phase 8（per-buyer 專屬倉庫+版本比對 API，task 33-41）→ 33-38 ✅ 已補 commit（原本 tasks.md 標 `[x]` 但代碼一直卡在 stash 沒進版控，2026-08-21 PM 發現並修復，型別檢查通過），39-41 待做
  - Phase 9（側邊欄 WordPress 視覺+拖曳分組持久化，task 43-48）→ 部分完成（拖曳把手 bug 已修），其餘待做，**下一波優先派 Codex**
- E2E：🟡 跑過有失敗——PM 用真實登入 session 點過多個頁面，抓到一個真 server/client boundary bug 並修復；nav-menu-items.test.ts 從 6/7 失敗修到全綠
- 待處理清單（2026-08-21 老闆點出，先列清單再修，不當場亂改）進度：
  1. ✅ NavBar `iconMap` 缺圖示 key 問題 → 已修（icon fallback 修復 + 側邊欄拖曳把手定位 bug 修復，commit `703ce9fe`）
  2. ✅ 側邊欄拖曳把手定位邏輯 → 已修
  3. ✅ task 6.2（sidebar-context 涵蓋全部路由）→ 已確認補齊
  4. ✅ task 5.1/5.2/9.3 紅燈測試 → 已補寫
  5. ⬜ task 11.1-11.3（Review、Chrome MCP 截圖、build+test 全綠）未做，待推進
  6. ✅ nav-menu-items.test.ts 過時斷言（task 50.7）→ agy 自報完成但實際只改措辭沒改對數值，PM 親自核對 MOUNT_POINTS 真實內容重寫，7/7 真綠燈

### 4. core-module-bundles-coupons
- 狀態：🟢 可收尾（實質完工，剩一項老闆裁決延後）
- Task 進度：55/56（98%）
- 指派對象：
  - Phase 1-2（資料表＋Bundle CRUD）→ 已完成，PM 親自+Sonnet 子代理混合，PM 全數驗證
  - Phase 3（Coupon 驗證＋結帳整合）→ ✅ 已完成，**PM 親自**（金流計算邏輯，風險最高，不外派）。順帶修正 `packages/payments` 既有的 `order.ts`／`notify.ts` 硬寫死 MVP_AMOUNT_TWD 的問題，改為信任伺服器端算出的折扣金額並守住上限
  - Phase 4（商品目錄改造，BREAKING）→ ✅ 已完成（15.1-15.3），**PM 親自**。task 15.4（bundle-aware 課程存取權整合）確認卡在買家播放頁 `/course` 跟 `Bundle.courseIds` 指向的 `db.course` 是兩套無關系統，經老闆裁決縮小範圍、留到買家播放頁做出來才接（=不阻擋本張 change 收尾）
  - Phase 5（既有 spec 對齊＋全面驗收，task 17-18）→ ✅ 已完成
- E2E：🟡 跑過有失敗——PM 用真實登入 session 點過 `/admin/bundles`、`/settings/security`、`/course`（均 200，畫面正確），過程中抓到一個真 build bug（NavBar 透過 barrel import 拉進 server-only Prisma 依賴）並已修復
- ⚠️ 2026-08-21 新發現：`packages/coupons/src/validate.test.ts` SAVE20PCT 測試無資料清理，跟同套件其他測試共用真實 DB 會撞號，多跑幾次必有一次失敗（flaky，非本次改動造成）。**下一步待修**，機械性小改可派 Haiku（加 beforeEach 清資料）
- 下一步：跑一次 `spectra archive core-module-bundles-coupons` 前置檢查（build+test 全綠、含修 flaky test），過了就能封存
- 備註：Phase 3/4 禁止外派，money-related 一律 PM 親自

### 4.5 sheets-export-engine（新增，2026-08-21 補進 dispatch board）
- 狀態：🟢 可收尾（Phase 1-3 全做完，只剩 Phase 4 AI 整合非本輪必要）
- Task 進度：16/18（89%）
- 指派對象：
  - Phase 1（核心套件+匯出服務）→ ✅ 已完成
  - Phase 2（bundles/coupons 報表範本）→ ✅ 已完成，Codex（orca worktree `sheets-phase2-3`）
  - Phase 3（SaaS API+前端匯出按鈕）→ ✅ 已完成，Codex
  - Phase 4（AI Agent 產表整合）→ 待做，需要判斷 MCP tool 介面設計，**Sonnet/PM**，非阻塞可另排
- Codex 自報「完整 test/type-check 被既有問題擋住」但沒講清楚是哪個問題，**PM 沒採信自報**，親自重跑抓到三個真問題並修掉：
  1. `packages/sheets` 全套件對 `@open-sheet/core` 的 JSX 元件回傳自訂 Node 型別（非 ReactNode），tsc 判為 TS2786——根因是 tsconfig 用預設 React JSX 型別檢查，@open-sheet/core 有自己的 `jsx-runtime`。修法：每個 template 檔案頂部加 `/** @jsxImportSource @open-sheet/core */` pragma（Codex 後來自己也补上了同樣修法）
  2. `packages/sheets/src/index.ts` 用 `.js` 副檔名 re-export `.tsx` 檔（`export * from './templates/orders.js'`），tsc/vitest 靠 moduleResolution 能自動映射回 `.tsx`，但 Next.js Turbopack 打包時不吃這套映射，直接報 Module not found——這個問題要等到有人真的在 apps/saas 裡 import 這個套件才會噴出來（Phase 1 沒人用，Phase 3 才第一次真的接上），改成不寫副檔名（比照 `packages/bundles`／`packages/course` 既有慣例）
  3. `@open-sheet/core/node` 內部依賴 `vite`（含 `lightningcss` 原生 `.node` binary），一旦 API route 匯入 sheets exporter，Next.js 會想把 vite 整個打包進 server bundle 而失敗——`next.config.ts` 加 `serverExternalPackages: ["@open-sheet/core", "vite", "lightningcss"]` 排除
- 這次也順手修了一個**跟 sheets 無關但擋住全 repo `pnpm build`／`pnpm test` 的循環依賴**：`payments→bundles→course→payments`。根因是 `packages/bundles` 有一份整合測試 import `@startkiter/course`（僅測試用），造成三個套件互相依賴成環。搬到 `apps/saas/tests/integration/`（apps/saas 本來就同時依賴兩者，安全落點），並發現 **15/20 個套件沒有自己的 vitest.config.ts**，會 fallback 抓 repo 根目錄設定去掃全 repo 測試——這才是 `packages/coupons` flaky test（SAVE20PCT 撞號）的真正根因，不是缺清理邏輯。已補齊全部 15 個套件的獨立 vitest config + coupons 建立前先清同碼舊資料，`pnpm test`／`pnpm build`／`pnpm type-check` 三者連跑兩輪皆穩定全綠。
- E2E：⬜ 未跑（後台按鈕實際下載 Excel 檔的視覺驗證還沒做）

### 5. plan-clean-install-package-repo（已 park）
- 狀態：⏸️ 排隊中，優先序未定
- Task 進度：0/10
- 指派對象：待老闆排優先序，內容若非金流/資料庫相關，機械性部分可用 Haiku

### 6-9. 待 propose 的 4 張 change
- payuni-recurring-billing（PAYUNi 定期扣款地基）→ 📝 待 discuss/propose，PM 親自（金流，不外派）
- core-module-subscriptions-invoice → 📝 待 propose，依賴 #6，金流相關 PM 親自
- core-module-newsletter → 📝 待 propose，非金流，apply 階段機械性部分可用 Haiku，整合判斷部分 Sonnet/外部 CLI（優先 `agy`）
- core-module-assignment-course-invites → 📝 待 propose，非金流，同上

---

## 2026-08-21 晚間 Git 衛生修復（PM 親自，不外派）

老闆問「怎麼把網站做完，要定目標」時發現主工作樹在一個落後 main 34 個 commit 的舊分支（`feature/sheets-integration`）上，之前給的排序建議整個作廢。順手做了一次全面稽核：

1. **7 個孤兒 orca worktree**：5 個（F/G/H/I/J 包）內容已完全併入 main，1 個（`worktree-bundles-coupons`，K 包 Marketplace）**做完但從沒合併回 main**，main 上 Phase 4 顯示「待做」是假象。已 fast-forward 合併 + 清空全部孤兒 worktree 與分支。
2. **tasks.md 假完成**：Phase 8（task 33-38，per-buyer 專屬倉庫）標 `[x]` 但代碼一直卡在 `git stash` 沒進版控。已找回、型別檢查、補 commit。
3. **sheets-export-engine 整包**（含 SR 文件）卡在舊分支沒進 main，已 cherry-pick 進來，lockfile 衝突已解。
4. **新發現待修**：
   - `packages/coupons/src/validate.test.ts` 缺測試隔離，SAVE20PCT 案例會跟其他測試撞號（flaky）
   - `pnpm build` 對 `@startkiter/course` / `@startkiter/bundles` / `@startkiter/payments` 三個套件跑出**循環依賴**（course→payments→bundles→course），根因待查，會擋掉全專案一次性 `pnpm build`（單套件各自 build 沒事）
5. 全部改動已 push 到 `origin/main`，工作區現在乾淨。

**教訓**：worktree 派工完成後「合併回 main」跟「更新 tasks.md」必須同一個動作內完成，不能分兩步（分兩步就會發生「文件說做完、代碼沒進去」）。

---

## 外部 CLI 派工規則（引用 routing.md，不重複展開）

- 可用 CLI：`codex`、`cursor-agent`、`kimi`、`agy`（Antigravity）
- **優先序（2026-08-21 老闆定案）：優先派 `agy`，其他三個（`codex`／`cursor-agent`／`kimi`）少派**，除非 `agy` 明顯不適合這類任務才退回用其他 CLI
- 派法：`orca worktree create` 開隔離 worktree → `orca terminal create --worktree path:<path> --command "<cli>"`，**禁止** `--command "claude"`（等於自己分身，不算交叉驗證）
- **禁止** `codex exec "..."` / `kimi -p "..."` 這類背景一次性 headless 呼叫冒充派工，要開真正互動 terminal session
- 派工師負責：開 worktree、送指令、盯完成度、`git diff` 驗證實際改了什麼——不相信代理自報「做完了」
- **money-related（金流計算、結帳、退款、資料庫 schema 遷移）一律不外派**，只能 PM 親自或至少 PM 逐行 review 後才能算數

---

## 更新方式

1. 完成/開始一項工作 → 改這份檔案的狀態欄與進度數字（進度數字用 grep 實跑，不用記憶）
2. E2E 跑完 → 填 ⬜/🟡/✅，🟡 或有失敗時附一行失敗原因
3. 改完這份 → 同步更新 `docs/dispatch-board.html`（把這份的內容渲染進去，不要讓兩份內容分岔）
