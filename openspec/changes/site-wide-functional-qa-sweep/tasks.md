## 1. Agy 全站巡查

- [x] 1.1 派 Agy（Antigravity CLI，開 orca worktree）用 ego-browser 對正式站（app.startkiter.dev、startkiter.dev）巡查 proposal 列出的每個頁面/流程，桌面與手機兩種 viewport，交付：`openspec/changes/site-wide-functional-qa-sweep/findings.md` 存在，每個 page × viewport 組合都有一筆紀錄（正常／異常／未完成），異常項目附截圖路徑、console 錯誤、network 錯誤細節。驗證：PM 檢查 findings.md 涵蓋 proposal 列出的每一項，沒有遺漏；未完成項目要附具體卡住原因，不能悄悄跳過。

## 2. Codex 修復巡查抓到的問題

- [ ] 2.1 [after: 1.1] 把 findings.md 裡標記異常的項目交給 Codex 逐項判斷根因並直接修復程式碼，交付：每個異常項目最終在 findings.md 旁備註一個解決狀態——要嘛附上修復 commit hash，要嘛附上「不是 bug，原因是 X」的明確說明，不留未處理的項目。驗證：findings.md 裡沒有任何異常項目的狀態欄位是空的或寫「待處理」；若巡查抓到超過 10 個真的需要修的 bug，先停下來回報 Fish 討論優先順序，不要默默把範圍吃下去繼續做。
- [ ] 2.2 [after: 2.1] 每個 Codex 修復的 bug 各自跑完標準交叉驗證流程（PM 重跑相關測試不能只信自報，另一個 CLI 審查該修復，過關才 merge），交付：所有修復都合併進 main 並 push，全域測試維持綠燈。驗證：`pnpm test` 全綠，`git log` 能看到每個修復對應的獨立 commit。
- [ ] 2.3 [after: 2.2] PM 針對每個聲稱已修復的異常項目，重新用 ego-browser 實際走一次該頁面確認真的修好（不是只信任 Codex 或測試通過），交付：每個修復都有 PM 自己的第二次 ego-browser 驗證紀錄。驗證：findings.md 對應項目補上「PM 已複驗，正常」的確認字樣。
