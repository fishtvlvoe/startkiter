## Context

StartKiter 採兩倉模型：TEST（`test-<專案名>`，Private，髒）負責邊裝邊測與狗food；正式倉庫是從 TEST 只拉乾淨物的安裝包，對標 supastarter 乾淨度，給客戶並持續迭代。學員終身代碼包是第三條線。Cloudflare Tunnel 已廢，不再當 OAuth／整合測主路徑。現行風險是口頭約定不足以防止漂移與誤晉升。

## Goals / Non-Goals

**Goals:**

- 把兩倉邊界、禁止清單、晉升條件、hotfix 流向寫進可驗證規格與文件 SSOT。
- 讓後續 agent／人類不必靠老闆重講結構。
- 本單落地後，文件與 AGENTS 指針與規格一致。

**Non-Goals:**

- 不實作自動同步 CI／腳本。
- 不在本單建立 GitHub／Vercel／雲端 DB。
- 不實作 kit／LINE 社群／site-agent。

## Decisions

### Decision: 兩倉永久分家，晉升是顯式閘門

採「TEST 持續開發」＋「正式包只收晉升通過的乾淨物」。拒絕「同 repo 清 branch 當正式」與「髒 TEST 改名上線」。

Alternatives: 單一 repo 多環境 — 拒絕，因 git 歷史與公司營運內容會污染安裝包。

### Decision: 本 SR 只做規格與文件，不做部署開通

先鎖規則；`test-startkiter` 建倉與 Vercel 另排，避免本單 scope 膨脹到基礎建設。

### Decision: hotfix 預設先正式包再回灌 TEST

客戶已拿正式包時，安全修復以正式包為準，再回灌 TEST，避免只修工寮、出貨面漏修。若尚未對外發佈正式包，可只修 TEST 再晉升。

### Decision: 晉升節奏人工 checklist，不做自動化

初期用文件 checklist 驗證；自動化另開 SR。

## Implementation Contract

- Behavior: 讀 `docs/deploy-and-public-url.md` 與 archived／active spec `test-clean-package-promotion` 的人，能回答：什麼倉庫做什麼、什麼永不可晉升、hotfix 先修哪邊、漂移如何防。
- Interface: 無新 runtime API。文件必須含兩倉圖解、禁止清單、晉升條件、hotfix 流向。
- Failure modes: 若有人提議恢復 Tunnel 當 OAuth 主路徑，文件與規格 SHALL 標為廢案／禁止。
- Acceptance criteria: `spectra validate test-to-clean-package-promotion` 通過；文件章節齊；AGENTS 有指針；Claude 一致性分析無阻塞 Critical。
- Scope boundaries: 只改 openspec change artifacts、`docs/deploy-and-public-url.md`、`AGENTS.md`。不建外部 repo、不改 apps／packages 執行碼。

## Risks / Trade-offs

- [漂移仍發生] → 規格要求晉升 checklist 與「正式 ≠ 營運中」對外說法分開；後續可加節奏（例如每封存一張功能 SR 後檢視是否晉升）。
- [誤把公司內容推進正式包] → 禁止清單寫死 Landing 文章、測試帳號、公司網域／金鑰範例。
- [本單太薄被以為已開通測試站] → Non-Goals 與 tasks 明示不建 GitHub／Vercel。

## Migration Plan

1. 寫齊 proposal／design／specs／tasks 並通過一致性分析。
2. Apply 只更新文件與 AGENTS 指針。
3. Archive 後 `openspec/specs/test-clean-package-promotion/` 成現行真相。
4. 另排建 `test-startkiter` 與 Vercel 的 SR／工作項。

Rollback: 還原文件與 AGENTS 指針；規格 archive 前可刪 change。

## Open Questions

- 正式安裝包對外 GitHub 名稱（尚未定；本單不阻塞，用「正式乾淨安裝包倉庫」描述）。
- 晉升節奏固定「每功能 SR archive 後檢視」或「發版前批次」— 預設採「每功能 SR archive 後檢視是否晉升」，可在 apply 文件寫成建議而非硬閘。
