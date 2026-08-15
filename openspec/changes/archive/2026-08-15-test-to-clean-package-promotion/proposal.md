## Why

TEST 工寮與正式乾淨安裝包若長期分家卻沒有晉升規則，功能會漂移：狗food 的是新站，客戶裝到的是舊殼。現在兩倉模型已定稿，要把邊界、晉升條件、hotfix 流向寫成可執行規格，避免之後靠口頭重講。

## What Changes

- 新增能力 `test-clean-package-promotion`：定義 TEST 倉庫（`test-<專案名>`）與正式乾淨安裝包倉庫的邊界、禁止清單、晉升條件與節奏。
- 修改／擴充部署備忘 `docs/deploy-and-public-url.md` 為與本能力一致的 SSOT（Tunnel 已廢；兩倉＋晉升閘門）。
- 在 `AGENTS.md` 掛上兩倉與晉升規則的短指針（結構對焦用文字＋圖解）。
- 列出可驗證的晉升 checklist（什麼可進正式包、什麼永不可進、hotfix 先修哪邊）。
- 本 SR 以規格與文件為主；不實作自動 sync 工具、不在本單建立 GitHub／Vercel（另排或後續 task 明示時再做）。

## Non-Goals

- 不建自動「一鍵從 TEST 同步到正式包」的腳本或 CI（可後續另開 SR）。
- 不在本單建立 `test-startkiter` GitHub repo、不接 Vercel／雲端 DB（部署落地另排）。
- 不實作學員 kit 履約（仍屬 `extract-github-kit-fulfillment`）。
- 不把 Cloudflare Tunnel 恢復成 OAuth 主路徑。
- 不把公司 Landing／文章／測試帳號晉升進正式安裝包。

## Capabilities

### New Capabilities

- `test-clean-package-promotion`: TEST 髒站與正式乾淨安裝包的倉庫邊界、晉升規則、禁止清單、hotfix 流向與漂移防範。

### Modified Capabilities

- (none)

## Impact

- Affected specs: `test-clean-package-promotion`（新）
- Affected code:
  - New: `openspec/specs/test-clean-package-promotion/spec.md`（archive 後）
  - Modified: `docs/deploy-and-public-url.md`, `AGENTS.md`
  - Removed: (none)
- Dependencies 新增: (none)
- 環境變數新增: (none)
