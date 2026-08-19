## Context

StartKiter 是獨立教學產品。2026-08-14 的決策已寫在 Development/docs/tw-saas-starter-discuss/，但沒有自己的 git 與 openspec，後續 SR 會誤開在 Development 根目錄。來源 repo（supastarter-nextjs-main、THE-TU-Project/dev/thetu、8-外掛/line-hub）必須維持只讀。libon.me 是客戶平台，不是這個產品的賣場或程式來源。

## Goals / Non-Goals

**Goals:**

- 建立 products/startkiter 獨立 git（main）
- 把討論稿收進 docs/discuss/，讓這個 repo 自包含
- 用 Spectra 鎖住治理規則與 v1 邊界，後續 extract 必須對齊
- 讓 agent 讀 AGENTS.md / openspec/config.yaml 就知道不准改來源、不准接 libon.me

**Non-Goals:**

- 不抽應用程式碼、不建 package.json、不安裝依賴
- 不實作登入、金流、發票、部署
- 不開 GitHub remote、不 push、不買網域
- 不把 v1 功能規格（LINE 能登入、SHOPLINE 能收款）寫成「已經存在」的 current specs；那些等下一張 extract change

## Decisions

### Decision: 獨立 nested git，不併進 Development 容器 repo

products/ 已被 Development .gitignore 忽略。StartKiter 用自己的 .git，branch 名 main。

Alternatives Considered:

- 放進 Development 根 git：施工單會跟 BuyGo / 基礎設施混在一起，push 風險高。否決。
- 做成 git submodule：多一層操作，教學 repo 還不需要被父 repo 釘死 SHA。否決。

### Decision: 討論稿複製進 docs/discuss/，不 symlink

獨立 clone 必須帶得走決策。Development/docs/tw-saas-starter-discuss/ 改成歷史指標，新決策只寫這個 repo。

Alternatives Considered:

- 只留 symlink 指回 Development/docs：獨立 git 推上 GitHub 後連結斷掉。否決。
- 討論稿直接當 openspec/specs current truth：Spectra specs 代表「已建成」，討論稿含尚未實作的產品行為。否決。

### Decision: 本 change 只鎖治理與邊界，不鎖 runtime 功能規格

project-governance 與 v1-scope-boundary 是政策。LINE／SHOPLINE／發票的 SHALL 行為等下一張 scaffold/extract change 再寫，避免 archive 後 specs 宣稱功能已存在。

Alternatives Considered:

- 一次寫完整 v1 runtime specs 並當 current truth：沒有代碼卻宣稱能登入能收款，drift 立刻發生。否決。
- 不做任何 spec，只放 markdown 討論：後續 agent 會當軟建議，邊界被「順便」加回組織或多租戶。否決。

### Decision: 本階段不建立 Next.js 空殼

package.json 與 apps/ 等抽殼 change 一次做，避免空 package 與之後從 supastarter 抽出的結構打架。

Alternatives Considered:

- 先 `create-next-app` 再覆蓋：雙重來源，diff 難讀。否決。
- 整包 clone supastarter 再刪：會帶進 organization、國際金流、多語系，違反 v1-scope-boundary。否決。

## Implementation Contract

- Behavior: 在 products/startkiter 執行 git status 看得到獨立 repo；spectra list 看得到 change；README 與 docs/discuss 說明產品定位；openspec/config.yaml 寫死來源只讀與 v1 硬邊界。工作樹沒有 apps/、packages/、package.json。
- Interface / data shape: 產品工作名稱固定為 startkiter。討論稿路徑固定為 docs/discuss/。Spectra change 名稱 kebab-case，只存在這個 repo 的 openspec/changes/。
- Failure modes: agent 若在 Development/openspec/changes/ 開 StartKiter 施工單，視為違規。agent 若修改 supastarter-nextjs-main、THE-TU-Project、8-外掛/line-hub，視為違規。缺 docs/discuss/v1-boundary.md 或 extract-map.md 視為 foundation 未完成。
- Acceptance criteria: `git rev-parse --is-inside-work-tree` 在 products/startkiter 回傳 true；`spectra validate repo-foundation` 通過；`test ! -f package.json` 為真；`test -f docs/discuss/extract-map.md` 為真。
- Scope in: git、Spectra 骨架、討論稿、治理 spec、README／AGENTS。
- Scope out: 應用程式碼抽取、remote、deploy、網域購買。

## Risks / Trade-offs

[Risk] 討論稿與治理 spec 兩份邊界文件之後會漂 → Mitigation: 後續 extract change 以 openspec specs 為準；docs/discuss 只當歷史。改邊界必須 ingest 再開 change，禁止只改討論稿。

[Risk] 空 repo 被誤認可以開始亂長 Next.js → Mitigation: README 與本 change Non-Goals 寫死；AGENTS.md 禁止抽代碼除非 change 名稱是 scaffold 或 extract。

[Risk] 品牌名 startkiter 與 StartKit.AI 在英文搜尋碰撞 → Mitigation: 台灣課綱與官網用中文「開站包」＋ LINE／SHOPLINE／發票當差異；網域下單前再查 whois。不在本 change 解決品牌法務。

[Risk] Development 容器 git 誤加這個目錄 → Mitigation: 父 repo .gitignore 已有 products/；此 repo 自有 .git。

## Migration Plan

部署步驟：在本機建立 products/startkiter 檔案與 git；不部署到任何主機。

回滾策略：刪除 products/startkiter 目錄（含 .git）。Development 容器 git 不追蹤此路徑，回滾不影響其他專案。

## Open Questions

- GitHub remote URL 與 visibility（private 教學模板 vs 之後公開）尚未定。
- startkiter.com / startkiter.me 尚未下單；下單前必須再查 whois。
- 下一張 change 要切成「只抽殼」還是「殼＋金流契約一起」，等 foundation archive 後再 propose。
