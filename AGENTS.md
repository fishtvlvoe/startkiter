<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding → `$spectra-discuss`
- User wants to plan, propose, or design a change → `$spectra-propose`
- Tasks are ready to implement → `$spectra-apply`
- There's an in-progress change to continue → `$spectra-ingest`
- User asks about specs or how something works → `$spectra-ask`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? `ingest` → resume `apply`

## Apply gate（StartKiter 強制）

每張 change 落地順序固定，不准跳步：

1. Artifact 寫完（proposal／design／specs／tasks）→ 派 **Claude Code** 做一致性分析（`spectra analyze` + `validate`＋語意對照）。有阻塞問題先改 artifact，等 Claude 明確 OK。
2. 通過後才由本 session／Cursor **寫程式**（`spectra-apply`）。
3. 程式寫完 → 派 **Codex** 做 Code Review（不是 Codeless）；Critical 修完再收尾／archive。
4. Critical 修完 → **再派／再收** Codex（或至少重跑 test＋對照 Critical 清單），確認無新 Critical 才 archive。
5. archive 後自動進入下一張待施工 change（或 propose 下一張），直到佇列清空或卡在老闆才能解的密鑰／決策。

### 外出／自治合約（主控必須做得到）

老闆外出或說「一鼓作氣做完」時，主控 **SHALL** 自己跑滿閉環，不准等下一句話才繼續：

1. `orca terminal send` 派 Claude／Codex 後，立刻進入監工：`orca terminal wait --for tui-idle` → `orca terminal read` 收全文結論。
2. 有 Critical → 本 session 修 → test／type-check → 必要時再派 CR；不准只回報「還在跑」就結束 turn。
3. 對話進行中仍並行監工；抽樣一眼就停 = 流程違規 = 不配當主控。
4. 卡關條件只有：缺老闆才能給的密鑰／ORG／REPO／產品決策、或來源 repo 禁改衝突。卡關要寫進 handoff，其餘自己往下做。

一致性分析調度規則：

- 直接對 **main 工作樹上既有的 Claude Code 視窗**下指令（例如 `orca terminal send` 到該 terminal）。
- **不准**為一致性分析另開 git worktree／子視窗再等它跑回來。Worktree 隔離只留給真的要平行改應用程式碼、怕弄髒 main 的場景。
- 若 main 上 Claude 還沒起來，在同一 main 路徑啟動 Claude 後下指令即可，仍不要開 analyze 專用 worktree。

結構／部署類對焦：一律先文字＋圖解（見 `docs/deploy-and-public-url.md`），確認後再動手；測試站 repo 命名 `test-<專案名>`，與正式乾淨安裝包、學員 kit 分開。晉升規則見同一文件。外出自治閉環見 `docs/autonomous-apply-loop.md`。

派 Claude／Codex 做一致性分析或 Code Review 後：

- **回覆老闆或接下一動之前，必須先 `orca terminal read`（必要時先 `wait`）把結果收齊。**
- **不准等老闆提醒「跑完了你怎麼不看」。** 忘了收結果＝流程違規。
- **老闆在跟本 session 講話、交代新事情時，仍要並行盯其它代理的進度**；對話進行中 ≠ 暫停監工，不准因此漏收 Claude／Codex 結果。
- **不准只抽樣看一眼就結束 turn**：必須 `wait` 到代理 idle、讀完結論；有 Critical 就接著修。不准把「等老闆下一句」當唯一觸發器。

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# StartKiter

課 + 終身代碼包。對外課名可用「開站包」。

## 目前優先順序（2026-08-23 更新，每次 session 開始先看這裡）

1. **`platform-shell-plugin-architecture`：129/129，已於 2026-08-23 archive**（`openspec/changes/archive/2026-08-23-platform-shell-plugin-architecture/`）。WordPress 式可擴充骨架（Mount Points、Marketplace、WordPress 視覺後台外殼、買家專屬 write repo 履約、MCP Gateway）已全部完成並驗證，這是 StartKiter 的產品地基，不用再回頭動，除非發現新缺口才另開 change。
2. **`course-studio-upgrade`：26/26，已於 2026-08-23 archive**（`openspec/changes/archive/2026-08-23-course-studio-upgrade/`）。課程管理後台編輯器（章節/單元 CRUD、講義編輯器、block schema registry、WebContainer 沙盒、即時預覽、拖曳排序）已在另一 worktree 完成、經 PR #2 合併進 origin/main，本次拉回並封存。CR 與 E2E 驗收待補（見下一步）。
3. **`core-module-bundles-coupons`（55/56）**：剩最後一項已裁決本輪不做（等買家播放頁做出來才接），這張視同完成，不用再動，等播放頁那張新 SR 立案後才回頭接。
4. **`unified-support-desk`（51/55）**：Chatwoot 真實 webhook 送達不穩定的疑難雜症已擱置（老闆裁決優先度排最後）；LINE/Telegram 帳號申請不卡人，隨時可做。
5. **`notifications` 缺 spec（2026-08-23 盤點發現）**：`packages/notifications/` 有實作（catalog、create-notification、welcome 等）但 `openspec/specs/` 沒有對應規格，已裁決開新 SR 補齊，走完整 discuss/propose 流程。

下一步該做的：派工師指揮 Codex 對 course-studio-upgrade 合併結果做 CR + E2E 驗收、並啟動 `notifications` 補 spec 的新 SR；或推進 `unified-support-desk` 剩的項目。

**課程引擎（課神，暫稱）方向（2026-08-23 定案，先驗證再拆 SR）**：課程系統的長期方向從「單一功能」改成「通用課程引擎」，但**先驗證假說，不直接動工大規模建設**。

- **現有已實作、非半成品**：`packages/course/` 的 MDX + 7 積木架構（TimelineSync/ConceptCompare/MicroSandbox/WorkflowSorter/InstantQuiz/TeacherAvatar/DialogueWindow）已完整實作（2026-08-21 `interactive-learning-system` change 43/43 完成），積木刻意寫死不可擴充（防 XSS 安全邊界）。`admin/course/page.tsx`（672 行）Course/Chapter/Lesson CRUD 已有，但內容編輯只是純 textarea，拖曳排序沒接（`order` 欄位有）。
- **第一步（已驗證，2026-08-23）**：AFC Loop（Action-Feedback-Consequence）原型 https://share.onorca.dev/a/xCSxh5HajjAK 老闆親自玩過，回饋「最少可以知道我是不是真的懂」——判斷→看後果→修正這個機制對學習者有實際價值，通過驗證。原型本身是寫死單一練習的 demo（沒有 Mission schema／Evaluator／Block Registry 這層通用抽象），拿來證明機制有感，不是引擎本體。
- **驗證通過後，可以做（成本可控，跟現有方向一致）**：
  1. 積木架構升級成 Zod Schema Registry（可動態擴充積木，取代現在寫死的 allowlist）
  2. 補一款真的用 WebContainer 的程式沙盒積木（取代假的 `MicroSandbox`），加打擊感回饋（hit-stop、里程碑慶祝）
  3. SR-A（後台拖曳排序＋內容編輯器升級）併進來一起做
- **先寫起來、明確不做**（怕忘記，不是待辦，需求沒驗證前不排時間）：
  - AI 自動生成動漫短片補課（需串 SeaArt/可靈 Kling AI，每次學員卡關就要打一次外部影片生成 API，成本會滾，且未驗證是否真的有效）
  - 學生自製關卡的 MOD 地圖編輯器／社群工坊（UGC 審核機制是完全獨立的產品規模，不是課程系統附加功能）
  - 這兩項來自一份「課程引擎產品戰略規格書 v2.0」（`~/Downloads/course-engine-architecture-gameplay-spec.md`），該文件自稱「Approved for SR Decomposition」，但尚未經過驗證步驟，不採信其核准狀態，仍走「先驗證再擴張」原則。

**每次做完事，回頭更新 `docs/dashboard`（見下方「專案儀表板」段）的 state.json，不要只在對話裡口頭報告——這是本檔案能被下一個 session 讀到的正式進度來源，對話記錄會斷。**

**產品定位（2026-08-22 補寫，之前遺漏）：StartKiter 要做成類似 WordPress 的平台，不是單一固定功能的 SaaS。** 買家拿到的不是一個寫死功能清單的網站，而是一個殼（platform shell）＋可掛載的模組（plugin）架構：後台掛載點、Marketplace 展示頁、模組各自獨立 `packages/<name>/`，買家或第三方可以像裝 WordPress 外掛一樣加裝功能。這個定位對應 `openspec/changes/platform-shell-plugin-architecture/`（Mount Points、PluginContent、Marketplace、MCP Gateway 唯讀連線），不是事後補的功能，是產品第一性——之前的對焦摘要漏講這段，只講了「一次買斷拿到 SaaS 骨架」，沒講「這骨架長成什麼架構」。

產品現行邊界以 `openspec/specs/` 為準（由已封存的 `mvp-test-scope` 灌入）。`extract-shell-auth`、`extract-payuni-checkout`、`extract-course-module`、`test-to-clean-package-promotion` 已封存。兩倉＋晉升規則見 `openspec/specs/test-clean-package-promotion/` 與 `docs/deploy-and-public-url.md`。

MVP extract 佇列已清空：`extract-site-agent`、`extract-line-learner-community`、`extract-github-kit-fulfillment` 皆已封存。`bootstrap-test-startkiter` 已封存：TEST=`https://github.com/fishtvlvoe/test-startkiter`。mvp-sell-flow-usable 已封存。GITHUB_KIT_ORG／REPO／完整 PEM 已於 2026-08-23 確認在根目錄 `.env` 早就設好，只是沒同步到 `apps/saas/.env`，已修（見上方優先順序第 2 點）。仍卡老闆：LINE_COMMUNITY_INVITE_URL、Google／LINE OAuth callback。

**部署方向轉彎（2026-08-22 老闆定案）：不再用 Vercel，全部搬到 Coolify + VPS**（`https://test-startkiter.vercel.app` 部署已停止更新，該站最後一次真正部署是 2026-08-15，之後 6+ 天的 commit 都沒反映上去，過去查 webhook 404 才發現）。現有唯一一台 Coolify 伺服器 `startkiter-managed-fleet-01`（Vultr，Ubuntu 26.04、2 vCPU/3.3GB、Docker 29.7.2，2026-08-18 建立，IP `45.76.187.247`，DNS `coolify-test.startkiter.dev` 已指過去）目前只跑兩個測試用 resource（nginx demo image、一個 git-deploy 測試），還沒正式扛過主站。細節與遷移步驟待寫成新 Spectra change，尚未 propose。`startkiter.dev` 這個網域已在 Cloudflare 買好、zone 已啟用（zone id `631be2a55e0c1b0a15038ad244b7665d`），新建了一個只管這個 zone 的 DNS 編輯 API Token 存在 `.env` 的 `CLOUDFLARE_API_TOKEN`。

這是獨立 git repo。零耦合 libon.me。不要改抽取來源。站內 agent／LINE 社群／GitHub kit 履約已封存落地。本階段不以新 extract 白名單為準，而以 `openspec/specs/` 為現行真相。

**專案儀表板**：固定網址的進度儀表板 → `docs/dashboard/README.md`（含目前發布網址、更新 SOP、到期換網址流程）。任何 change 進度或基礎設施決策有變化，照那份 SOP 更新，不要只在對話裡講講就算了。

【Allowed extract sources（只讀，禁止修改來源）】

殼：`/Users/fishtv/Development/supastarter-nextjs-main` → 已抽 `apps/saas`、`packages/auth`；後續可再抽 `packages/ai`

台灣金流／訂單：`/Users/fishtv/Development/THE-TU-Project/dev/thetu` 的 PAYUNi／訂單抽象 → `packages/payments`（含 Order 模型欄位契約）

課程 UI 當模組留下：從舊售出包（thetu）抽觀看與權限畫面 → `packages/course`。原「不抽整套學院營運」的範圍限制已封存作廢——2026-08-21 老闆定案：`dev/thetu` 全套內容/行銷/金流模組（courses、bundles、coupons、subscriptions、newsletters、course-invites、assignment、lesson-comments/private-messages、invoice）開放抽取，當成 StartKiter 的「核心基本模組」，各自拆成獨立 `packages/<name>/`（依 `docs/buyer-extension-convention.md` 慣例），實際拆解規劃走新開的 Spectra change，尚未 propose。

**`https://github.com/woomini-flow/woomin`（WuMin 買方專屬課程 repo 樣板）跟 `THE-TU-Project/dev/thetu` 是同一套代碼家族**（2026-08-22 核對：`app/`、`lib/` 檔案清單逐一比對幾乎完全一致，`.env` 裡多處「from woomin notes」的設定其實就是這套代碼本身的設定，不是另一個獨立來源）。**2026-08-22 老闆定案：抽取以 `woomin` repo 為主，`thetu` 為輔**——兩邊檔案結構雖幾乎一樣，但細部功能實作不完全同步，woomin 是目前維護中的正本，thetu 不確定是不是舊版本；之後要抽任何模組先看 woomin 那邊的實作，thetu 只在 woomin 缺檔案時當備援參考。部署層不通用（woomin 走 Zeabur，thetu/StartKiter 走 Coolify+VPS），不影響抽取優先順序。

LINE 登入契約：`/Users/fishtv/Development/8-外掛/line-hub`（網頁 OAuth 決策；PHP／LIFF／Bot 不搬）

GitHub kit 邀請已封存（GitHub App + 站內 OAuth）。本刀不做 kit 履約。

【Forbidden extract targets】

不准拷任何 libon.me 代碼、帳號、網域。libon.me 只當可看的案例網址。

不准抽 `THE-TU-Project/code`（舊版凍結產線代碼，跟目前抽取來源 `THE-TU-Project/dev/thetu` 是不同目錄）或 `realms-course-platform-v1.8.0`。

~~THE-TU 只抽觀看／金流。不准抽電子報、優惠券、作業、NextAuth、Apple、課程邀請、賣課 onboarding skill。~~ 2026-08-21 老闆定案作廢：電子報、優惠券、訂閱、bundles、作業、課程邀請、金流/發票（含 Shopline/Stripe 收款路徑）全部開放抽取，見上方「課程 UI 當模組留下」段落新決策。NextAuth／Apple 登入方式**不隨此決定開放**——StartKiter 登入機制維持既有 Better Auth 決策不變，只抽這些模組的業務邏輯與資料模型，不抽 THE-TU 的登入層。

不准抽 supastarter 的 marketing／docs、Lemon／Polar／Dodo／Creem、Passkey／2FA、Organization 多租戶。

站內 agent 只掛唯讀兩工具（已落地）。

【v1 硬規則】

主金流 PAYUNi，一次買斷 TWD。結帳鎖 8800。Shopline／Stripe 不接線、不上課。

課與終身代碼包同一 SKU。退款取消領取資格。

不做 Organization 多租戶。帳單掛 user。

LINE Login Channel 做登入。學員社群用課程內 LINE 邀請連結，不能靜默入群；允許客服用途的 LINE Messaging。客服走 Chatwoot 統一工單（網站/LINE/Telegram）。不做 SKOOL。

金鑰填後台，env fallback。沒設金流 fail-closed。

發票不在 MVP。

站內 agent 只掛 `get_my_orders` 與 `get_my_course_progress`，唯讀、只查自己。

【文件】

產品規格 SSOT：`openspec/specs/`

已封存 change：`openspec/changes/archive/2026-08-14-mvp-test-scope/`、`openspec/changes/archive/2026-08-15-extract-shell-auth/`、`openspec/changes/archive/2026-08-15-extract-payuni-checkout/`

討論紀錄：`docs/discuss/`（歷史稿；與 specs 衝突時以 specs 為準）

【已廢（不是現行規則）】

「不是賣課平台」「主金流 SHOPLINE」「四堂課對 SHOPLINE」「發票在 MVP」「目前施工 extract-shell-auth」「現行待施工 extract-payuni-checkout」

<!-- graphify:auto:start -->
## graphify

This project keeps a local knowledge graph in `graphify-out/`.

Rules:
- For broad codebase questions, read `graphify-out/GRAPH_REPORT.md` before opening source files.
- For relationship questions, prefer `graphify query`, `graphify path`, or `graphify explain` against this project's local `graphify-out/graph.json`.
- Do not inspect unrelated sibling projects unless the user explicitly asks for cross-project context.
- The workspace-level project index is `/Users/fishtv/Development/graphify-projects.json`.
- Maintained by `/Users/fishtv/Development/batch-graphify.sh` for `products/startkiter`.
<!-- graphify:auto:end -->
