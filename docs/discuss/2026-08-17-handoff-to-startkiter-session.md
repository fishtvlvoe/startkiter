▋ 交接：從 Development 大方向對話 → StartKiter 專屬對話

狀態：交接用（2026-08-17）

這份是從 `Development`（Orca 顯示為「Development / main」）那條大方向討論對話交接過來的摘要。那條對話討論範圍太廣（從整合 cordis 開始，中途轉向 StartKiter 架構），不適合繼續在那裡談 StartKiter 的細節。以後 StartKiter 的實作/細節討論，直接在這個專案（`Development/products/startkiter`）自己的對話裡開，不要回去 Development 那條。

【大方向決策（已定案，不用重新討論）】

- StartKiter = `code/supastarter-nextjs-main`（提供 HOW：UI/元件/架構）跟 `code/realms-course-platform-v1.8.0`（提供 WHAT：課程業務邏輯，THE-TU 專案正式名稱）**融合成一套系統**，不是兩個外掛式模組堆疊。兩份都是唯讀參考原始碼，已 `.gitignore` 排除，不進版控，不可修改來源。
- 買家擴充機制：不用 cordis 這類 runtime plugin framework，改用輕量慣例文件——`docs/buyer-extension-convention.md`（已寫好，內容真實引用 `packages/course` 路徑，已驗證過走一次「新增假模組」流程可行）。
- Organization 多租戶：**`docs/discuss/organizations.md` 的「v1 不抽 Organization」結論已經被推翻**，正式決策改成要做，見下方 `organization-role-model` change。
- Demo-first 強制流程：任何 UI 改動先出靜態 HTML demo，Fish 明確回覆「可以」才能寫真代碼；真代碼寫完要立刻用 ego-browser 截圖跟 demo 並排比對，不留到最後才比。
- 一鍵部署走 Zeabur（`deploy/zeabur.yaml` 已建好，README 已加部署按鈕，**還沒真的跑過一次部署驗證**）。

【兩個進行中的 Spectra change】

跑 `spectra list --json` 跟 `spectra list --parked --json` 看即時狀態，這裡只記重點：

1. **`extract-supastarter-design-system`**（40/45，主體是把 supastarter 的真元件庫移植進來重寫首頁/登入/後台/課程頁）
   - 今晚工作實際落在 worktree `apply-extract-supastarter-design-system`，branch `fishtvlvoe/apply-extract-supastarter-design-system`。**這個分支還沒 merge 回 `feature/extract-supastarter-design-system` 或 `main`**，接手第一件事是確認要不要合併回去。
   - `pnpm test` 135 個測試全過、`pnpm build` 過、CR（agy 審的）0 Critical / 2 Warning，報告在 `docs/cr-report-extract-supastarter-design-system.md`。
   - 剩給 Fish 裁決的 5 件事：(1) 8.3 真的跑一次 Zeabur 部署 (2) 9.2 三項 Open Questions 裁決（見下） (3) 缺測試帳密，E2E 11.1/11.4/11.5 補不完 (4) 登入頁送出按鈕視覺比 demo 淡 (5) 兩支測試寫死本機路徑的技術債。
   - 9.2 的三項 Open Questions：Organization 多租戶要不要做（已經在 `organization-role-model` 定案，這裡只是要求把裁決正式記錄進本 change）、電子發票範圍、已封存 changes 跟這次方向的關係。

2. **`organization-role-model`**（角色矩陣：owner／admin／instructor／user 四層，B2B 掛組織、B2C 掛個人雙模式並存，Invitation 走 Email）
   - SR 文件（proposal/design/specs/tasks）已寫完並經 Fish 逐項口頭確認，目前 parked。
   - 剩 4.1（確認 v1-scope-boundary 的 delta 內容跟角色矩陣一致，`spectra validate` 沒問題就能勾）、5.1（跑一次 `spectra analyze` 做四份文件內部一致性複查）兩個純文件檢查，沒有程式碼要寫。
   - **這個決策直接推翻了 `docs/discuss/organizations.md` 的舊結論**，該檔已經加上取代聲明，`README.md` 索引已更新分類。

【只是嘴上聊過、還沒進 SR 的想法（需要另開討論才能定案）】

- 把「派工師」（`~/.claude/agents/派工師.md`，全域子代理，用 Orca CLI 管理多個外部 CLI 平行分工）這個開發自動化工具本身，包進賣給買家的代碼包裡——這是全新範圍，屬於 `buyer-extension-convention` capability 的延伸，還沒有對應的 Spectra change，需要先討論範圍邊界再走 `/spectra-propose`。

【交接怎麼用】

新對話一開始先讀這份文件，再自己跑 `spectra list --json` + `spectra list --parked --json` 確認即時狀態，不用等口頭複述一遍。大方向決策已經在上面列完，細節/實作在這個對話裡繼續談就好。
