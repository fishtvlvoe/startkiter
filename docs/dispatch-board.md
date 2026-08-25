# StartKiter 派工看板

> 派工師／PM／外部 CLI（Codex 等）讀這份決定「下一個做什麼」。每次任務狀態改變都要更新這份檔案（勾選、改狀態、填 E2E 結果），再重新產生 `docs/dispatch-board.html`。
> 進度數字一律用 `grep -c '^\- \[x\]' openspec/changes/<name>/tasks.md` 實跑算出來，不用 `spectra list` 的快取數字（2026-08-21 發現對不上）。
> 2026-08-25 全面重寫：舊版（2026-08-21）列的工作項目多數已封存，內容嚴重過時。這次重寫的觸發點：老闆問「有沒有總表能讓 Codex 接力做完」——答案是原本沒有，只存在對話裡，這份檔案就是補上的那份持久化總表。

## 派工分級原則（2026-08-21 老闆定案，沿用）

不是「PM 寫計畫、其他都能外包」這條線，是**任務能不能被獨立、可靠地驗證**：

| 特徵 | 派給誰 |
|---|---|
| 有明確規格照抄、機械性、輸出容易肉眼核對（讀檔摘要、照 design.md 抄的型別/CRUD、照現有格式翻譯、純文件） | **Haiku 子代理** |
| 需要抓根因、跨檔案除錯、架構判斷、驗收別人做的東西（含驗收 Haiku/外部 CLI 自報） | **Sonnet 子代理**（PM 自己或 Sonnet 等級） |
| money-related（金流計算、結帳、退款、資料庫 schema 遷移）、權限/角色矩陣設計、git/worktree 等高風險基礎設施操作 | **PM 親自**，不外派 |
| propose 階段（寫 proposal/design/specs/tasks，需要判斷範圍與取捨） | **PM 親自**，Codex 只做 apply 階段的機械實作 |

## 圖例

- 狀態：🟢 可收尾／✅ 已完成／🔵 進行中／⏸️ 排隊中（已解凍，等派工）／📝 待 propose（連 tasks.md 都還沒有）／🔴 卡關
- E2E：⬜ 未跑／🟡 跑過有失敗／✅ 全過

---

## 現況總覽（2026-08-25 實測）

- **已封存完成**：37 張 change（`openspec/changes/archive/`），涵蓋殼架構、課程後台、互動積木、bundles/coupons、發票、客服等地基
- **進行中，剩真人操作項（非代碼問題）**：
  - `unified-support-desk`：51/55（93%），剩 LINE/Telegram bot 帳號申請＋一個 Chatwoot webhook 疑難雜症，老闆裁決先擱置
  - `subscriptions-invoice`：20/22（91%），剩 ego-browser e2e 截圖驗證＋老闆去 ECPay/ezPay 後台填正式金鑰
- **跨 repo 依賴**：Awesome-Koson（課神，`/Users/fishtv/Development/Awesome-Koson`）那邊有一張對應的 change `structured-action-and-evaluator-checks`（改 `ActionSchema`/`EvaluatorSchema`），跟本表第 2 項 `course-pack-mission-execution` 的 schema 要對得上，兩邊都要 apply 完才算真正接通

---

## 接力佇列（本次新建，按順序做，一次只跑一張，做完打勾接下一張）

### 1. course-pack-import ⏸️ 排隊中
- Task 進度：0/10，已解凍（unparked），完整 proposal/design/specs/tasks 都在
- 誰做：Codex（提詞已交給老闆）
- 阻塞條件：無，可立即開始
- 完成後：`spectra archive course-pack-import`，回來打勾，解鎖第 2 項

### 2. course-pack-mission-execution ⏸️ 排隊中
- Task 進度：0/23，已 park，完整 proposal/design/specs/tasks 都在（2026-08-25 PM 親自跑完 propose 全套，analyze 0 Critical/Warning，validate 通過）
- 誰做：Codex
- 阻塞條件：**必須等第 1 項 apply 完成**（`CoursePackMission` 表要存在，本 change 的 `MissionFormValue` 表有外鍵指過去）；且建議跟 Awesome-Koson 那邊的 `structured-action-and-evaluator-checks` 大致同時 apply（schema 版本要對得上）
- 完成後：解鎖第 6 項（gamified-onboarding-course）

### 3. spec-plan-consistency-cr ⏸️ 排隊中
- Task 進度：0/3，已 park，完整 proposal/specs/tasks 都在（2026-08-25 PM 跑完 propose，analyze 0 Critical/Warning，validate 通過）
- 內容（**寫 propose 時範圍縮小**）：`operator-settings` 擴充為後台設定總表（登記 PAYUNi＋電子發票，定義新設定頁登記慣例）、新增 `apps/saas/.env.example`
- 43 份規格空白 Purpose 欄位**改成不走這張 change**：Purpose 是描述性欄位不是 Requirement，不適用 delta spec 機制，會另外以純文件維護方式直接處理（見下方「額外待辦」）
- 誰做：Codex

### 4. one-click-deploy（規格擴充：從綁 Zeabur 改成平台無關） ⏸️ 排隊中
- Task 進度：0/9，已 park，完整 proposal/design/specs/tasks 都在（analyze 0 Critical/Warning，validate 通過）
- 內容：新增 `apps/saas/Dockerfile` + `.dockerignore`（照抄 woomin 現有樣板，同源產品已驗證這套 multi-stage build），讓 Zeabur／Coolify／任何支援 Docker 的 VPS 都能吃同一份東西；`next.config.ts` 加 `output: "standalone"`；README「一鍵部署」段落改寫成兩條路徑並存
- 不包含：Coolify one-click 範本（開發時間長，先不做）、心跳回報器（第 5 項）、開站教學內容（第 6 項）
- 誰做：Codex

### 5. buyer-heartbeat-dashboard 📝 待 propose
- 內容：容器裡塞心跳回報小工具，定期回報狀態進買家已有的 `/deployment` 頁面
- 阻塞條件：等第 4 項 apply 完成（要塞進同一份 Dockerfile 的容器裡）

### 6. gamified-onboarding-course 📝 待 propose（原「post-deploy-setup-checklist」，2026-08-25 併入遊戲化教學構想）
- 內容：用課神（Awesome-Koson）設計「教買家部署自己 StartKiter 網站」的 Course Pack，七個 Mission（部署上線／LINE 登入／Google 登入／Bunny CDN／金流／發票／後台隱私設定），每關用 `check_id` 真判定過關
- 阻塞條件：等第 2 項＋第 5 項 apply 完成；教案內容本身由老闆在課神老師端自行設計（不算代碼工作）
- 誰做：教案內容＝老闆；技術執行層＝已經是第 2 項的範圍，這裡主要是排課程順序與整合

### 7. organization-enterprise-account ⏸️ 排隊中
- Task 進度：0/13，已 park，完整 proposal/design/specs/tasks 都在（2026-08-25 PM 跑完 propose，analyze 0 Critical/Warning，validate 通過）
- 內容：把 supastarter 原生 Organization 系統（`admin/organizations` 現在的殘留頁面，Better Auth `organization` plugin 已啟用、`Member.role` 目前不受限）跟既有角色矩陣（owner/admin/instructor/user，來自已封存的 `organization-role-model`）真正整合，`Order` 新增 `organizationId` 讓企業帳號購買的課程存取權共享給全體成員；解決了該張留下的 3 個 Open Question（courseAccess 歸屬層級＝Organization 聯集查詢、StartKiter 自己的站不強制多組織、邀請通知走 email 不走 LINE）
- 誰做：Codex apply，PM 需 review（碰權限矩陣）

### 8. startkiter-official-site-cleanup 📝 待 propose
- 內容：`apps/marketing` 接上 `startkiter.dev` 正式網域、關掉舊 Vercel 測試站、補一張 SR 正式記錄「官網已搬到 Coolify VPS」這件事（已實測 `app.startkiter.dev` 回 307 正常）
- 誰做：低風險，PM 寫 propose，Codex 可 apply

### 額外待辦（非 SDD change，不佔佇列順位，PM 有空即做）
- **43 份規格 Purpose 欄位回填**：純文件維護，不透過 delta spec 機制（Purpose 不是 Requirement，見第 3 項的範圍調整說明），PM 或 Haiku 子代理直接編輯 `openspec/specs/*/spec.md`，依現有 Requirement 內容歸納出一句話用途，逐份 commit（`docs: 補齊 <capability> 規格 Purpose 說明`）

### 9. course-lifecycle-email（parked）⏸️ 排隊中
- Task 進度：0/13，非金流但碰付款成功觸發點
- 誰做：Codex 實作，PM review

### 10. multi-gateway-checkout（parked）⏸️ 排隊中
- Task 進度：0/14
- 誰做：**PM 親自，不外派**（金流計算邏輯）

### 11. course-engine-upgrade 📝 待 propose
- 內容：積木架構升級成 Zod Schema Registry（可動態擴充）、真 WebContainer 沙盒（取代假的 MicroSandbox）、後台拖曳排序＋內容編輯器升級
- 阻塞條件：建議等第 6 項跑過一輪拿到真實回饋再決定範圍

### 12. newsletter 📝 待 propose
- 老闆已確認要做，排在這裡

### 13. full-system-regression-cr（最後一項，不可提前）
- 內容：以上全部做完後，跑一次全站回歸測試＋CR，確認彼此沒打架
- 誰做：PM 親自

---

## 舊有已封存重點紀錄（2026-08-21 之前，保留備查）

<details>
<summary>2026-08-21 晚間 Git 衛生修復（PM 親自）</summary>

老闆問「怎麼把網站做完，要定目標」時發現主工作樹在一個落後 main 34 個 commit 的舊分支（`feature/sheets-integration`）上。全面稽核發現：7 個孤兒 orca worktree（1 個做完但沒合併回 main，main 顯示「待做」是假象）、tasks.md 假完成（代碼卡在 stash 沒進版控）、sheets-export-engine 整包卡在舊分支。全部已修復並 push。

**教訓**：worktree 派工完成後「合併回 main」跟「更新 tasks.md」必須同一個動作內完成，不能分兩步。

</details>

---

## 外部 CLI 派工規則（引用 routing.md，不重複展開）

- 可用 CLI：`codex`、`cursor-agent`、`kimi`、`agy`（Antigravity）
- 派法：`orca worktree create` 開隔離 worktree → `orca terminal create --worktree path:<path> --command "<cli>"`，**禁止** `--command "claude"`
- **禁止** `codex exec "..."` / `kimi -p "..."` 這類背景一次性 headless 呼叫冒充派工，要開真正互動 terminal session
- 派工師負責：開 worktree、送指令、盯完成度、`git diff` 驗證實際改了什麼——不相信代理自報「做完了」
- **money-related（金流計算、結帳、退款、資料庫 schema 遷移）、propose 階段一律不外派**，只能 PM 親自

---

## 更新方式

1. 完成/開始一項工作 → 改這份檔案的狀態欄與進度數字（進度數字用 grep 實跑，不用記憶）
2. E2E 跑完 → 填 ⬜/🟡/✅，🟡 或有失敗時附一行失敗原因
3. 每完成佇列裡一項 → 打勾、往下移動到下一個未阻塞的項目
4. 改完這份 → 同步更新 `docs/dispatch-board.html`（把這份的內容渲染進去，不要讓兩份內容分岔）
