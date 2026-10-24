<!-- SPECTRA:START v1.3.0 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- An explicitly requested Spectra decision needs structure → `$spectra-discuss`
- User explicitly requests a Spectra change proposal → `$spectra-propose`
- Continue tasks for an identified change → `$spectra-apply`
- Update requirements or plans for an identified change → `$spectra-ingest`
- Check implementation matches artifacts → `$spectra-verify`
- Review implementation quality and logic issues → `$spectra-review`
- Analyze artifact consistency before coding → `$spectra-analyze`
- Audit security sharp edges → `$spectra-audit`
- Check stale changes before resuming → `$spectra-drift`
- Debug a concrete bug systematically → `$spectra-debug`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

Explicit skill invocation takes precedence. Apply existing authorization within its unchanged scope.

## Workflow

discuss? → propose → apply ⇄ ingest → verify / review → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode (`/plan`) → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills disclose parking and restore when the named operation is already explicitly requested; respect a known refusal, otherwise ask for missing authorization.

<!-- SPECTRA:END -->

# StartKiter

課 + 終身代碼包。對外課名可用「開站包」。

## 目前優先順序（2026-09-24 更新，每次 session 開始先看這裡）

**狀態總覽：產品功能面基本完成（84 份 spec、25 個模組、3 個 app 都在線），剩餘工作集中在「上線前雲端驗證」與「newsletter 自動化」。2026-09-23 單日合併 8 個 PR（#7~#14），4 個 orca worktree 已全部 merge 並清除。**

進行中的 SR（`spectra list` 為準）：

1. **`newsletter-automation-integration`（18/41，最大缺口）**：電子報寄信引擎 Wave 1/2 整合、CR、渲染器測試未完成。前置依賴 `mail-provider-tosend-smtp-support` 先完成。分支 `fishtvlvoe/newsletter-automation-integration` 保留（已 merge 進 main，遠端仍在）。
2. **`platform-launch-verification-evidence`（14/15）**：只剩回滾演練（TEST 環境實際跑一次 rollback 並記錄證據）。
3. **`role-based-workspace-navigation`（30/31）**：只剩 adapter→manifest 分階段切換的 migration + rollback 證據。
4. **`mail-provider-tosend-smtp-support`（11/12）**：只剩 Coolify 容器加 `EMAIL_PROVIDER=tosend` + 確認 `TOSEND_API_KEY` 進容器 + 真實寄信驗證。
5. **`buyer-bundle-checkout-entry`（12/13）**：只剩正式站建測試 Bundle 走一次真實購買全流程。
6. **`app-feature-surfaces`（10/12）**：只剩部署後 ego-browser 驗收 + analyze/validate。
7. **`site-wide-functional-qa-sweep`（4/4）**：完成待 archive。
8. **🅿️ parked：`oracle-chatwoot-anti-reclaim-cutover`（5/7）**：剩 NSG 過寬入站規則收斂。

**建議執行順序**：先把 2~6 集中成一個「部署驗收批次」一次做完（都是雲端操作不是寫碼），再啃 newsletter；最後整批 archive。

**歷史地基（已完成封存，不用回頭動）**：`platform-shell-plugin-architecture`（129/129，2026-08-23 archive，WordPress 式骨架）、`course-studio-upgrade`（26/26）、`core-module-bundles-coupons`（55/56，視同完成）、`unified-support-desk`（53/55，2026-09-02 暫停啟用封存；本次已移除其產品客服接線，現行客服只走 email）。`notifications-spec-backfill` 規格已補完（純文件，15 個檢查項刻意留給未來改通知功能時驗證）。

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

**部署方向轉彎（2026-08-22 老闆定案）：不再用 Vercel，全部搬到 Coolify + VPS**（`https://test-startkiter.vercel.app` 部署已停止更新）。現有唯一一台 Coolify 伺服器 `startkiter-managed-fleet-01`（Vultr，Ubuntu 26.04、2 vCPU/3.3GB、Docker 29.7.2，2026-08-18 建立，IP `45.76.187.247`）目前由 Coolify 管理 `apps/saas` 與 `apps/marketing`；`app.startkiter.dev` 回 `307` 導向登入，`startkiter.dev` 已於 2026-08-28 修復 standalone runtime 缺少 `@swc/helpers` ESM 檔案造成的 503，follow redirect 回 `200`。正式、可重複的部署流程見 [`docs/vps-deployment-sop.md`](docs/vps-deployment-sop.md)，本次對應 Spectra change `vps-production-deployment`（尚未 archive）。`startkiter.dev` 這個網域已在 Cloudflare 買好、zone 已啟用（zone id `631be2a55e0c1b0a15038ad244b7665d`），Cloudflare 憑證已集中到 `~/.cloudflared/api-tokens.json`：DNS 讀 `.cloudflare.tokens.startkiter_dns`，Pages 讀 `.cloudflare.tokens.pages_deploy`，Worker KV 讀 `.cloudflare.tokens.worker_kv_deploy`；`.env` 不再存 Cloudflare token。

**客服現況**：產品客服只開啟預填 `mailto` 信件，收件地址由 `NEXT_PUBLIC_SUPPORT_EMAIL` 提供。既有 Oracle 主機、DNS 與其他外部資源不屬於產品客服程式的執行依賴，本次不操作也不刪除。

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

LINE Login Channel 做登入。學員社群用課程內 LINE 邀請連結，不能靜默入群。客服只走 email，收件地址由 `SUPPORT_EMAIL`／`NEXT_PUBLIC_SUPPORT_EMAIL` 提供。不做 SKOOL。

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
- Maintained by `/Users/fishtv/Development/batch-graphify.sh` for `B-產品/products/startkiter`.
<!-- graphify:auto:end -->

## App 擴充註冊契約

新增 App 固定走 `AppRegistrationManifest` 註冊契約，不直接繞過平台註冊入口。完整欄位、驗證規則與新增流程以 [app-extension-contract canonical spec](openspec/changes/app-extension-contract/specs/app-extension-contract/spec.md) 為準；實作前先查可重用 App，完成註冊資料與測試參照。
