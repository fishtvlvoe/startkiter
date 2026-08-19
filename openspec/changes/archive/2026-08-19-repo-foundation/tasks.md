## 1. 獨立 git

- [x] 1.1 建立 products/startkiter 獨立 git，預設分支 main，滿足 Independent git repository 與 Decision: 獨立 nested git，不併進 Development 容器 repo。驗證：在該目錄執行 `git rev-parse --show-toplevel` 與 `git branch --show-current`，分別得到 startkiter 路徑與 main。 [Tool: sonnet]

## 2. 討論稿與產品說明

- [x] 2.1 [P] 把 2026-08-14 討論稿複製進 docs/discuss/（含 v1-boundary.md 與 extract-map.md），滿足 Spectra is the product requirement home 與 Decision: 討論稿複製進 docs/discuss/，不 symlink。驗證：`test -f docs/discuss/v1-boundary.md && test -f docs/discuss/extract-map.md`。 [Tool: sonnet]

- [x] 2.2 [P] README 與 AGENTS.md 寫死零耦合 libon.me、來源只讀、v1 take-home capabilities 與 Four-lesson unlock order。驗證：`rg -n "libon.me|SHOPLINE|Login Channel" README.md AGENTS.md` 都有命中，且 README 寫明尚未抽應用程式碼。 [Tool: sonnet]

## 3. Spectra 治理規格

- [x] 3.1 openspec/config.yaml 與 .spectra.yaml 成為此 repo 的產品需求家，滿足 Spectra is the product requirement home。驗證：`spectra validate repo-foundation` 通過，且 Development/openspec/changes/ 沒有 startkiter 施工單。 [Tool: sonnet]

- [x] 3.2 v1-scope-boundary spec 鎖住 Allowed extract sources、Forbidden extract targets、Payments and invoice policy，並對齊 Decision: 本 change 只鎖治理與邊界，不鎖 runtime 功能規格。驗證：`rg "### Requirement:" openspec/changes/repo-foundation/specs/v1-scope-boundary/spec.md` 含這三個 requirement 名稱，且 openspec/specs/ 尚無 LINE／SHOPLINE runtime spec。 [Tool: sonnet]

## 4. 隔離檢查

- [x] 4.1 確認 Source repositories stay read-only：本 change 工作樹不含從 thetu／supastarter 抽來的 ts/php。驗證：`test ! -f package.json && test ! -d apps && test ! -d packages`，且 `git -C ../../supastarter-nextjs-main status --porcelain` 與 `git -C ../../THE-TU-Project status --porcelain` 不因本工作變髒（若那些目錄是獨立 git）。 [Tool: sonnet]

- [x] 4.2 確認 Zero coupling to libon.me：文件禁止借網域與代碼。驗證：`rg -n "不准借|零耦合|MUST NOT use a libon" README.md AGENTS.md openspec/changes/repo-foundation/specs/project-governance/spec.md` 有命中。 [Tool: sonnet]

- [x] 4.3 確認 Decision: 本階段不建立 Next.js 空殼。驗證：根目錄沒有 package.json、pnpm-workspace.yaml、apps/saas。 [Tool: sonnet]

## 5. Review

- [x] 5.1 對照 docs/discuss/v1-boundary.md 與 v1-scope-boundary spec，確認 Forbidden extract targets 沒有漏組織、賣課、libon。驗證：`rg -n "Organization|coupon|libon" openspec/changes/repo-foundation/specs/v1-scope-boundary/spec.md docs/discuss/v1-boundary.md`。 [Tool: kimi]
