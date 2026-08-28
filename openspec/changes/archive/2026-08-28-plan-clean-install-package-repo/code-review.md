## Code Review 報告 — 2026-08-28

**Change:** `plan-clean-install-package-repo`  
**審查範圍:** `tooling/scripts/promote-clean-package.ts`、`promote-clean-package.test.ts`、`docs/clean-package-promotion-guide.md`、`docs/deploy-and-public-url.md`、`README.md`、`vitest.config.ts`  
**契約:** `design.md` Implementation Contract、`tasks.md`、`specs/test-clean-package-promotion/spec.md`  
**角度:** correctness / security / performance  
**方法:** 只讀審查，未改檔、未跑測試（測試結果 unverified）

### Verdict: **FAIL**
### Critical: **1**
### High: **6** / Medium: **8** / Low: **3**

---

### CRITICAL（1 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 1 | `tooling/scripts/promote-clean-package.ts:80-85`、`:97-108`、`:134-148` | **工作樹上的 Next.js 環境檔會進乾淨包。** 腳本走 `readdirSync` 實體檔案、不看 gitignore。`isForbiddenFileName` 只擋 `.env`、`.env.local`、`.env.production`、`.env.development`。下列常見檔名在 `apps/saas/`（Allow prefix）底下會被當成 included：`.env.development.local`、`.env.production.local`、`.env.test`、`.env.test.local`、`.env.staging`、`.env.coolify`。內容掃描只找 `startkiter.aiver.me` 與 `BEGIN (RSA\|OPENSSH)? PRIVATE KEY`，**抓不到** `DATABASE_URL`、`PAYUNI_HASH_*`、OAuth secret、`sk-proj-`、`sk_test_`、`whsec_`。現況：`apps/saas/.env`（精確檔名）有被 `.env$` 擋下；同目錄若出現 Next.js 預設的 `*.local` 變體，金鑰會被 copy 進 starter-kit。測試完全沒覆蓋 `.env` / `*.pem` 排除。 | Deny 改成「任何名為 `.env` 或 `.env.*` 的檔，只放行 `.env.example` / `.env.template`」。掃描前先套 gitignore。補測試：`apps/saas/.env.production.local`、`.env.development.local`、`.env.test` 必須出現在 excluded、且目標不存在該檔。 |

Critical: 1（上表 #1）

---

### HIGH（6 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 1 | `promote-clean-package.ts:118-119`、`:230-233` | 公開 CLI `--skip-verify` 不在契約參數裡（契約只有 `--dry-run` / `--target` / `--release`），指引也沒寫。帶此旗標時不跑 `pnpm install && build && test`，仍回傳成功 report。規格 SHALL 自動驗收。 | 刪掉公開旗標，或預設禁止、僅測試注入 `runVerify`。若保留，失敗／跳過不得當成 promotion 成功。 |
| 2 | `promote-clean-package.ts:151-163` | 內容掃描對 `*.test.ts(x|js|jsx)` 直接 `continue`，但 Allow List 含整個 `packages/` 與 `apps/saas/`，測試檔仍會被複製。把真金鑰或 `startkiter.aiver.me` 放進 `foo.test.ts` 即可繞過掃描。規格：staged 檔含內部網域或 test secret tokens 必須非 0 中止。 | 要嘛不把測試檔送進乾淨包，要嘛掃描仍跑、僅對「明顯 mock PEM」（例如單行 `BEGIN PRIVATE KEY` + `X`）白名單。禁止「叫 `.test.ts` 就不掃」。 |
| 3 | `promote-clean-package.ts:196-203`、`:222-232` | 目標目錄不清空、也不是 rsync `--delete`。第二次 promotion 不會刪已從 Allow 拿掉或新進 Forbid 的舊檔。先 `copyIncluded` 再 `verify`：verify 失敗時函式有 throw（不當成成功），但目標工作樹已寫入，後續手動 `git add` 可能把半成品當發布。 | copy 前清空目標（保留 `.git`）；verify 失敗則回滾本次寫入，或先寫暫存目錄、通過再交換。 |
| 4 | `promote-clean-package.ts:34-46`；`AGENTS.md`；`README.md` | `AGENTS.md` 與根 `README.md` 在 Allow List。學員包會拿到 Spectra／蓋神／Orca 工寮流程，以及本機路徑 `/Users/fishtv/Development/docs/orca`。規格要排除 install-tooling clutter。README 還指向不會被複製的 `docs/clean-package-promotion-guide.md`（該檔靠 `docs/` 規則排除）。 | 乾淨包用買家 README 模板。`AGENTS.md` 移出 Allow。操作者 README 不要當學員入口。 |
| 5 | `promote-clean-package.ts:40-45`；`docs/vps-deployment-sop.md:12-13,33,51,159-169` | `docs/vps-deployment-sop.md` 被整份複製。檔內有操作者基礎設施：VPS 名 `startkiter-managed-fleet-01`、私有庫 `fishtvlvoe/startkiter`、Coolify resource id `8x5bmcpct9dri6tnnhjleeed`、deployment id、commit、`/tmp/...headers`。這是工寮事故紀錄，不是買家安裝包該有的內容。 | 拆成「買家通用 VPS SOP」（可晉升）與「內部 runbook」（Forbid）。Allow 只放前者。 |
| 6 | `promote-clean-package.test.ts` 全文 | 測試覆蓋 classify 的 demo／test-users／discuss／legacy、dry-run 不寫檔、forbidden token abort、verify throw。**沒有** `.env`、`.env.production.local`、`*.pem`、目標殘留、`--skip-verify` 契約。安全門檻等於沒回歸。 | 補上列為 Critical/High 的紅燈測試；沒測過的路徑不要當成已守住。 |

---

### MEDIUM（8 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 1 | `promote-clean-package.ts:24-32` vs `design.md:55-59` | 契約 Allow 是 `apps/saas/` + 列名 packages + `tooling/typescript|tailwind`。實作放寬成 `apps/marketing/`、`apps/docs/`、整個 `packages/`、`patches/`。指引有寫，但沒有公司 Landing 的路徑級排除；marketing 若日後混入營運文案會整包帶走。 | 要嘛改契約，要嘛收斂 Allow。Landing／文章路徑顯式 Forbid。 |
| 2 | `promote-clean-package.ts:167-194`；契約 L68 | 規格要求 type checking + build + test。實作只有 `pnpm install`、`build`、`test`，沒 `type-check`。`--release` 只寫進 report，不打 tag、不產乾淨 commit。Decision 2 / 驗收「git log 只有乾淨發布歷史」未落地（非目標雖說不 push，但連 commit 都沒做）。 | 非 dry-run 成功路徑加上 `pnpm type-check`；commit／tag 若本 change 不做，契約與指引應改成「操作者手動 commit」，避免以為腳本已產乾淨歷史。 |
| 3 | `promote-clean-package.ts:143-145` | dry-run 的 excluded 只收 `isForbidden` 或 `docs/`、`legacy/`。`tooling/scripts/`、`openspec/` 以外未列名的根檔、`.github/` 等既不 included 也不 excluded。規格要「所有 included 與 excluded」。 | 非 included 一律進 excluded（可再分子類：forbidden / not-allowlisted）。 |
| 4 | `packages/database/prisma/seed-course.ts` | Forbid 只有 `seed/test-users.ts`。`seed-course.ts` 含示範課程、bunny-demo、YouTube 測試 URL，會進乾淨包。規格排除測試媒體／測試 seed。 | 測試／demo seed 整目錄 Forbid；只留真正必要的空白 seed。 |
| 5 | `promote-clean-package.ts:74-77` | 私鑰 regex 不含 `BEGIN EC PRIVATE KEY`、`BEGIN DSA PRIVATE KEY`、`BEGIN ENCRYPTED PRIVATE KEY`。副檔名只擋 `.pem`，不擋 `.key`／`.p12`／`.pfx`。規格寫 credential examples 與內部密鑰。 | 擴充 PEM header；憑證副檔名與 gitignore 對齊（`*.pem`、`*.key`、`*.p12`、`*.pfx`）。 |
| 6 | `promote-clean-package.ts:74-77`；spec L32 | 規格要求偵測 test secret tokens。掃描沒有 `sk-`、`sk_live`、`sk_test`、`whsec_`、`ghp_`、`GOCSPX-` 等。依賴檔名過濾，檔名一漏就過。 | 加高信心 token pattern；命中即 abort。 |
| 7 | `promote-clean-package.ts:120-122` | `--target` 沒有下一個參數時，`target` 變 `undefined` 並吞掉下一旗標， silently 回預設路徑。 | 缺值就 throw。 |
| 8 | `docs/clean-package-promotion-guide.md` vs 腳本 | 指引寫 dry-run「印 included／excluded 與掃描結果」。CLI 成功才 `JSON.stringify(report)`；掃描命中則 throw，操作者看不到清單。`--skip-verify` 未記載。 | 先印分類清單再 abort；CLI 旗標與文件對齊。 |

---

### LOW（3 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 1 | `promote-clean-package.ts:97-108` | `walkFiles` 會走進 `openspec/`、`legacy/`、`graphify-out/`、`code/`、`vendor/`（只靠事後 Forbid／非 Allow 丟掉）。`SKIP_DIR_NAMES` 沒這些。偶發 CLI 可接受，repo 變髒時會變慢。 | 把已知大且永不晉升的目錄加入 skip。 |
| 2 | `promote-clean-package.ts:153-165` | 每個 included 檔 `readFileSync` 整份當 utf8，無大小上限。`apps/marketing/public/images/*.webp` 也掃。目前圖小；以後若有影片會衝記憶體。 | 跳過明顯二進位／超過 N MB 的檔，或只掃文字副檔名。 |
| 3 | `promote-clean-package.ts:248` | 成功時把完整 included／excluded 陣列印成 JSON，檔案數上千時輸出難用。 | 摘要 + 寫 report 檔。 |

---

### 通過項目

- `--dry-run` 在 copy 之前 return，測試有斷言目標不出現 `package.json`。**dry-run 不會寫檔。**
- `startkiter.aiver.me` 命中時在 copy 前 throw；測試斷言目標不存在。**forbidden content abort 路徑正確（就它有掃到的 pattern 而言）。**
- verify 丟錯時 promise reject、CLI `process.exitCode = 1`，**不會把失敗當成發布成功**（但目標已寫入，見 High #3）。
- Allow／Forbid 對 fixture 內的 demo 路由 `apps/saas/app/api/demo/`、`demo-grant-button`、`packages/database/prisma/seed/test-users.ts`、`docs/discuss/`、`legacy/` 有排除；現況 `apps/saas/app/api/demo` 目錄不存在，過濾仍在。
- 精確檔名 `.env`、`.env.local`、`.env.production`、`.env.development`、`*.pem` 會 `isForbidden`。根目錄 `.env` 另因不在 Allow Files 而不納入。
- `node_modules`、`.next`、`.turbo`、`.git`、`dist`、`coverage`、`playwright-report` 不走訪。
- 預設 `--target` 為 `../startkiter-starter-kit`，對應獨立倉庫 `fishtvlvoe/startkiter-starter-kit`，不是改名 TEST。
- `docs/deploy-and-public-url.md` 有 Promotion gate、checklist、Hotfix 雙軌、drift 節奏，並指向 `docs/clean-package-promotion-guide.md`。
- `README.md` 有短指針指向 promotion 指引。
- `vitest.config.ts` 已 include `tooling/scripts/**/*.test.ts`。
- 白名單預設（未宣告不納入）對未列名根目錄成立；`openspec/`、`.spectra/`、`graphify-out/`、`.vercel/`、`.zeabur/` 有 Forbid prefix。

---

### 三角度摘要

**correctness**  
Demo／test-users／discuss／legacy 的正向案例成立。Allow 比契約寬。dry-run 的 excluded 清單不完整。`--skip-verify`、`--release`、type-check、乾淨 commit 與契約有落差。

**security**  
Critical：工作樹 env 變體可攜帶真實金鑰進學員包，內容掃描補不上。High：測試檔跳過掃描、目標殘留、操作者文件／SOP 洩內部基礎設施。現況 `apps/saas/.env` 因精確檔名被擋，**不能**推論「所有憑證都擋得住」。

**performance**  
無明顯 O(n²)。同步 walk + 全檔 utf8 掃描，對現況可接受；缺大目錄 skip 與二進位上限，列 Low。

---

### 結論

CRITICAL **1** / HIGH **6** / MEDIUM **8** / LOW **3** — **不可 commit、Verdict FAIL**

Critical 未清零：修完 env deny list（對齊 gitignore 的 `.env*` 例外）、補測試證明 `.env.production.local` 等不會進目標，才能再送審。
