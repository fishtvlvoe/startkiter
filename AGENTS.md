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

產品現行邊界以 `openspec/specs/` 為準（由已封存的 `mvp-test-scope` 灌入）。`extract-shell-auth`、`extract-payuni-checkout`、`extract-course-module`、`test-to-clean-package-promotion` 已封存。兩倉＋晉升規則見 `openspec/specs/test-clean-package-promotion/` 與 `docs/deploy-and-public-url.md`。

MVP extract 佇列已清空：`extract-site-agent`、`extract-line-learner-community`、`extract-github-kit-fulfillment` 皆已封存。`bootstrap-test-startkiter` 已封存：TEST=`https://github.com/fishtvlvoe/test-startkiter`，站=`https://test-startkiter.vercel.app`（Neon；Git 自動部署已接通）。mvp-sell-flow-usable 已封存。仍卡老闆：GITHUB_KIT_ORG／REPO／完整 PEM、LINE_COMMUNITY_INVITE_URL、Google／LINE OAuth callback。

這是獨立 git repo。零耦合 libon.me。不要改抽取來源。站內 agent／LINE 社群／GitHub kit 履約已封存落地。本階段不以新 extract 白名單為準，而以 `openspec/specs/` 為現行真相。

【Allowed extract sources（只讀，禁止修改來源）】

殼：`/Users/fishtv/Development/supastarter-nextjs-main` → 已抽 `apps/saas`、`packages/auth`；後續可再抽 `packages/ai`

台灣金流／訂單：`/Users/fishtv/Development/THE-TU-Project/dev/thetu` 的 PAYUNi／訂單抽象 → `packages/payments`（含 Order 模型欄位契約）

課程 UI 當模組留下：從舊售出包（thetu）抽觀看與權限畫面 → `packages/course`。原「不抽整套學院營運」的範圍限制已封存作廢——2026-08-21 老闆定案：`dev/thetu` 全套內容/行銷/金流模組（courses、bundles、coupons、subscriptions、newsletters、course-invites、assignment、lesson-comments/private-messages、invoice）開放抽取，當成 StartKiter 的「核心基本模組」，各自拆成獨立 `packages/<name>/`（依 `docs/buyer-extension-convention.md` 慣例），實際拆解規劃走新開的 Spectra change，尚未 propose。

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

LINE Login Channel 做登入。學員社群用課程內 LINE 邀請連結，不能靜默入群。客服走 email。不做 SKOOL。

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
