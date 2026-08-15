## 1. 兩倉邊界與文件 SSOT

- [x] 1.1 落實 Requirement「Two-repository boundary」與 design「Decision: 兩倉永久分家，晉升是顯式閘門」：`docs/deploy-and-public-url.md` 寫清 TEST（`test-startkiter`）／正式乾淨安裝包／學員 kit 三分界與圖解，Tunnel 標廢案；同步更新文件內「現行功能單：extract-github-kit-fulfillment」這行為現況（該單已 park，現行施工為本 SR）。驗證：文件可回答三倉各做什麼；對照 spec Two-repository boundary 場景；文件無過期的「現行功能單」指向。 [Tool: sonnet]
- [x] 1.2 在 `AGENTS.md` 加上兩倉與晉升短指針（指向部署文件），保留結構對焦用文字＋圖解；同步把 `AGENTS.md` 與 `openspec/config.yaml` context 段落裡「現行待施工 change 是 extract-github-kit-fulfillment」改寫成：現行施工為 `test-to-clean-package-promotion`（文件／規格單），`extract-github-kit-fulfillment` 為 parked、待本單 archive 後恢復施工，並列入「已封存／狀態」段落避免下一個 agent 誤判現行單。驗證：搜尋 `test-startkiter` 或 `test-clean-package-promotion` 可命中；`AGENTS.md`／`config.yaml` 不再單獨陳述「現行待施工 change 是 extract-github-kit-fulfillment」而未註明其為 parked。 [Tool: sonnet]

## 2. 晉升閘門、禁止清單、漂移節奏

- [x] 2.1 落實 Requirement「Promotion gate from TEST to clean package」與「Promotion forbid list」：文件內可勾選晉升 checklist（可進殼／骨架／schema；不可進公司 Landing／文章、測試帳號與媒體、公司網域與金鑰範例、Tunnel 主路徑；禁止髒 TEST 改名上線）。驗證：假設「只在 TEST 的實驗 UI」依 checklist 結論為不可晉升。 [Tool: sonnet]
- [x] 2.2 落實 Requirement「Hotfix flow」。Decision: hotfix 預設先正式包再回灌 TEST — 正式包已給客戶 → 先修正式包再回灌 TEST；未發佈 → 只修 TEST 再晉升。驗證：文件段落與 spec Hotfix flow 場景一致。 [Tool: sonnet]
- [x] 2.3 落實 Requirement「Drift acknowledgment and review cadence」。Decision: 晉升節奏人工 checklist，不做自動化 — 文件寫明 TEST 營運中 ≠ 正式包，每張功能 SR archive 後檢視是否晉升，且不實作自動 sync。驗證：文件有對應段落；對照 spec Drift 場景。 [Tool: sonnet]

## 3. 收尾驗證

- [x] 3.1 跑 `spectra validate test-to-clean-package-promotion` 與 `spectra analyze test-to-clean-package-promotion --json`，無 Critical；Claude 一致性分析 OK 或僅已接受 Suggestion。驗證：CLI 與 Claude 結論可覆核。 [Tool: sonnet]
- [x] 3.2 確認本單未建 GitHub／Vercel、未改 `apps/`／`packages/` 執行碼（design「Decision: 本 SR 只做規格與文件，不做部署開通」）。驗證：diff 僅 openspec change、`docs/deploy-and-public-url.md`、`AGENTS.md`。 [Tool: sonnet]
