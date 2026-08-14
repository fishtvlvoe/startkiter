## Why

StartKiter 要當獨立教學產品，不能掛在 Development 根目錄或 libon.me 上施工。沒有自己的 git 與 Spectra 家，後面抽殼、金流、LINE 會寫進錯的 repo。

## What Changes

- 新增獨立 git repo 於 products/startkiter（branch: main），與 Development 容器 git 分離
- 新增 Spectra 骨架：openspec/config.yaml、.spectra.yaml、AGENTS.md、CLAUDE.md、.cursorrules
- 新增 docs/discuss/，收納 2026-08-14 已鎖定的架構討論（邊界、抽取清單、金流、LINE、組織）
- 新增 README.md 寫死產品定位、四堂課、硬邊界
- 新增能力規格 project-governance：獨立 repo、來源只讀、零耦合 libon.me
- 新增能力規格 v1-scope-boundary：v1 抽什麼、不抽什麼、什麼必須新做

## Non-Goals

- 不抽 supastarter-nextjs-main 或 THE-TU-Project/dev/thetu 的應用程式碼
- 不建立 apps/saas、packages/*、package.json、資料庫 schema
- 不實作 Google／LINE 登入、SHOPLINE、發票
- 不修改來源 repo，不連接 libon.me
- 不購買網域、不建立 GitHub remote、不 push
- 不把 Development 根目錄 openspec/changes/ 當成此產品施工單

## Capabilities

### New Capabilities

- `project-governance`: 獨立 git、Spectra、來源凍結、禁止耦合 libon.me
- `v1-scope-boundary`: v1 能力邊界與四堂課解鎖順序，約束後續 extract

### Modified Capabilities

(none)

## Impact

- Affected specs: project-governance, v1-scope-boundary
- Affected code:
  - New: README.md, AGENTS.md, CLAUDE.md, .gitignore, .spectra.yaml, .cursorrules, openspec/config.yaml, docs/discuss/
  - Modified: (none，空 repo)
  - Removed: (none)
- Dependencies 新增: (none)
- 環境變數新增: (none)
