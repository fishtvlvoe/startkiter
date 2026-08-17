## Context

StartKiter 目前擁有本地開發 Monorepo（`products/startkiter`）與髒測試站（`test-startkiter`，部署於 Vercel + Neon）。依照 `openspec/specs/test-clean-package-promotion/spec.md` 與 `docs/deploy-and-public-url.md` 的三倉庫模型規範，交付給學員的乾淨安裝包（clean install-package，對標 supastarter）必須具備最高純淨度，嚴禁包含測試帳號、測試媒體、公司營運頁面與工寮雜物。目前該 clean package 倉庫尚未建立，亦缺乏自動化的 promotion 機制與明確的 Checklist 落地流程。

## Goals / Non-Goals

**Goals:**

- 規劃建立獨立之 GitHub 倉庫 `fishtvlvoe/startkiter-starter-kit` 作為學員交付乾淨安裝包。
- 制定完整的 Promotion Checklist 流程與檢驗步驟。
- 明確定義 Allow List（可晉升項目）與 Forbid List（禁止晉升項目）。
- 設計自動化 promotion 工具 `tooling/scripts/promote-clean-package.ts`，支援 `--dry-run`、檔案過濾、敏感詞安全掃描與發布。
- 規範 Hotfix 雙向維護規則（已發布時 Clean Package 優先，未發布時 TEST 優先）。

**Non-Goals:**

- 不直接執行 GitHub 遠端倉庫建立或推送（本變更僅限於規格與工具設計）。
- 不涉及付費學員之 GitHub kit fulfillment 自動邀請邏輯（由獨立 GitHub App 履約線處理）。
- 不建立自動雙向定時同步機制（維持單向 promotion 與受控 backport）。

## Decisions

### Decision 1: 建立獨立全新 GitHub 倉庫而非分支或重命名

建立全新的 GitHub 私有倉庫 `fishtvlvoe/startkiter-starter-kit` 作為 clean package 的專屬託管處，徹底與 `test-startkiter` 隔離。

- **Alternatives Considered:**
  1. 重命名現有的 `test-startkiter` 並清空資料：被否決。TEST 倉庫包含持續測試與營運的歷史記錄、測試環境配置與公司 Landing 內容，重命名會洩漏內部歷史並破壞測試站持續部署。
  2. 在同一個倉庫中使用 `clean` 分支維護：被否決。Monorepo 在分支間切換極易因 merge 或 rebase 導致測試程式碼或憑證洩漏，且無法對不同對象配置獨立的倉庫權限。

### Decision 2: 採用單向過濾導出與乾淨 Commit 腳本自動化 Promotion

開發 `tooling/scripts/promote-clean-package.ts` 腳本，透過白名單與黑名單規則篩選檔案，將純淨代碼複製至乾淨工作目錄，執行型別/測試檢查後生成乾淨 Commit。

- **Alternatives Considered:**
  1. 人工手動複製檔案：被否決。人工操作容易遺漏黑名單檔案或誤將測試密鑰、工寮雜物拷貝至乾淨包中。
  2. Git Subtree 或 Git Filter-Repo：被否決。專案中的過濾條件包含細粒度的檔案內容與目錄排除，git 原生工具難以處理跨套件的特定檔案剔除與自訂驗證。

### Decision 3: 實施已發布與未發布之雙軌 Hotfix 流程

當 clean package 已交付學員時，安全性與正確性修復以 clean package 為 SSOT，修復後立即 backport 至 TEST；若尚未交付學員，則修復直接進 TEST 並於下次 promotion 時同步。

- **Alternatives Considered:**
  1. 所有 Hotfix 一律先經 TEST 再 promote：被否決。當 clean package 已在學員手中時，TEST 上未穩定的實驗功能會阻塞緊急修復的即時發布。
  2. 兩邊各自修復不進行 backport：被否決。會造成兩套代碼快速漂移，導致未來的 promotion 產生大量衝突。

## Implementation Contract

- **CLI 指令契約**:
  - 指令名稱：`pnpm tsx tooling/scripts/promote-clean-package.ts`
  - 參數支援：
    - `--dry-run`: 僅輸出將被包含/排除的檔案清單與檢查報告，不執行實際複製或提交。
    - `--target <path>`: 指定乾淨包本地目錄路徑（預設為 `../startkiter-starter-kit`）。
    - `--release <version>`: 指定發布版本標籤（例如 `v1.0.0`）。
- **過濾白名單（Allow List）**:
  - `apps/saas/` 核心應用（移除公司 Landing、Demo 測試按鈕、測試假資料）。
  - `packages/auth/`, `packages/payments/`, `packages/course/`, `packages/database/`, `packages/ui/`, `packages/utils/`, `packages/i18n/`。
  - `tooling/typescript/`, `tooling/tailwind/`。
  - 根目錄設定檔：`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig.json`, `README.md`, `.gitignore`。
- **過濾黑名單（Forbid List）**:
  - 公司專屬頁面與文章內容（如特定的宣傳頁、公司團隊介紹）。
  - 測試帳號、測試媒體、測試用 seed（如 `packages/database/prisma/seed/test-users.ts`）。
  - 工寮測試與部署雜物：`.vercel/`, `.zeabur/`, `graphify-out/`, `docs/discuss/`, 歷史規劃稿。
  - 公司專用網域設定、憑證與私鑰範例（`*.pem`, 內部金鑰）。
  - 測試專用按鈕與路由（如 `apps/saas/app/api/demo/`）。
- **失敗模式與安全檢查**:
  - 若偵測到任何包含 `startkiter.aiver.me`、內部密鑰或黑名單檔案，腳本立即以非 0 狀態碼退出並中斷 promotion。
  - 目標目錄在 promotion 完成後自動執行 `pnpm install && pnpm build && pnpm test`，任何失敗均中止發布。
- **驗收標準**:
  - 產出的乾淨目錄可獨立安裝依賴並通過完整 build 與 test。
  - 執行 `git log` 僅呈現乾淨版本發布歷史，不含內部開發對話與測試 commit 雜訊。

## Risks / Trade-offs

- [Risk: 新增模組時未正確設定過濾規則導致洩漏內部設定] → Mitigation: 預設採用嚴格白名單模式，未顯式宣告的目錄不納入 clean package，並於腳本內建關鍵字安全掃描。
- [Risk: Hotfix backport 遺漏導致 TEST 與 clean package 行為分裂] → Mitigation: 在 promotion checklist 中明列 hotfix 雙向同步查核項，並於每次 feature change archive 時執行 audit。
