---
name: handoff-coolify-plugin-architecture
description: pi session 交接給 Claude Code，Coolify 部署決策 + 外掛架構 SR 重寫 + interactive-learning-system 風險處理進度
type: project
---

# Coolify 部署決策 + 外掛架構重寫 交接

**狀態：** 討論定案、部分工作已派工完成，還有兩件事要接手處理
**日期：** 2026-08-18

## 今天做了什麼

### 1. 三個架構方案比較與決策（討論階段，已定案）

比較了「輕量檔案慣例」「中量級 Mount Points」「真 WordPress 動態載入」三種買家擴充架構，最後決定：**用 Coolify（或 Vercel）的 git-push 自動部署原生功能，取代自己蓋的打包/MCP推送/伺服器接收管線**。買家拿到自己的 GitHub 倉庫，用自己的 AI 工具（Claude Code/Codex）改代碼、AI 幫忙 commit+push，平台自動重建部署，買家全程不用碰 git 指令或終端機。

兩張討論用的圖（已 commit）：
- `docs/discuss/2026-08-18-plugin-architecture-tiers-comparison.html`（三方案比較，仍有效）
- `docs/discuss/2026-08-18-auto-deploy-pipeline-gap.html`（部署管線差距圖，**已部分過時**——裡面的②打包工具、③MCP Gateway 推送、④伺服器自動部署觸發，已經被 Coolify/Vercel 原生機制取代，不需要客製開發）

### 2. `platform-shell-plugin-architecture` change 已重寫完成（已派工、已完成）

用 worktree 派 Claude Code（模式：只寫文件不動代碼）重寫了這張 parked change，因為它原本規劃的檔案（`app-shell.tsx`、`site-nav.tsx`、`mobile-tabbar.tsx`）在 `rebuild-from-official-upstream` 之後已經不存在。

**產出位置**：worktree `/Users/fishtv/orca/workspaces/startkiter/sr-self-service-plugin-pipeline`，分支 `fishtvlvoe/sr-self-service-plugin-pipeline`（base: `feature/self-service-plugin-pipeline`），commit `9681b238`。**還沒 merge 回 main。**

涵蓋 7 個 capability：`platform-mount-points`（新）、`platform-marketplace`（新，改成「展示+選模版」不做一鍵裝解）、`mcp-gateway`（新，唯讀連線不做推送安裝包）、`platform-core-boundary`（新）、`buyer-template-selection`（新，2-3 內建模版）、`saas-shell`（改，對照現在真實的 NavBar/sidebar-context）、`course-module`（改，課程當示範 Plugin）。

`spectra analyze`：0 Critical/0 Warning/12 Suggestion。`spectra validate`：valid。

**4 個 Open Question 待裁決**（尚未討論完，只討論了排序）：
1. 內建模版視覺風格——要先出 HTML demo 給老闆看才能定案
2. refero.design MCP 整合——v1 不做
3. Coolify VPS 建置——獨立票，不算進這張（見下方第 3 點，已經開始討論）
4. 模版 AI 提示語品質——要實測

老闆定的執行順序是：**③ Coolify VPS 架好 → ① 做模版 demo 部署上去給學生看子網域 → ② 接 refero.design MCP → ④ 調提示詞**。

### 3. Coolify VPS 部署，決策已定案，帳號已開好

- **方案**：Coolify Cloud（`https://app.coolify.io/`）——老闆已經買好帳號了
- **網域**：`startkiter.dev`——老闆說要買，**還沒確認是否已買好，下一個 session 要跟老闆核對**
- **帳號歸屬**：老闆自己開的、綁自己的付款方式，之後會把存取權限交接過來
- **跟現有 TEST 站的關係**：TEST 站（`startkiter.aiver.me`，Vercel）不動，Coolify 上放的是新的「模版 demo 展示」用途，兩者不要混
- **下一步待辦**：老闆確認網域跟 Coolify 帳號都好了之後，要開始實際設定 Coolify 專案、接網域、規劃子網域結構（給模版 demo 用）。這件事**還沒開始動工**，只有前置決策定案。

### 4. `interactive-learning-system` change——重大風險已攔下，處理中

**背景**：老闆在別的地方（可能是另一個獨立 session，尚未確認）跑了一個 AI，逆向工程了別人的產品「氛圍學院 VibeAcademy」（`https://academy.vibetech.tw`，**確認不是老闆自己的，是別人的競品**），產出了一份 Spectra change 提案 `openspec/changes/interactive-learning-system/`，裡面原本引用了對方的確切品牌色碼、行銷文案原文、影片網址、Analytics 追蹤 ID、課程單元逆向細節。

**已處理**：
- 逆向工程原始文件（`docs/reference/academy.vibetech.tw/` 四份 md）已經**搬出 git 專案**，現在放在 `/Users/fishtv/Documents/startkiter-private-reference/academy.vibetech.tw/`（不在任何 git repo 裡）。

**還沒處理，下一個 session 要接手**：
- `openspec/changes/interactive-learning-system/proposal.md` 跟 `design.md` **裡面還是寫著「參考來源：https://academy.vibetech.tw」「逆向工程文件」這種措辭**，還沒重寫。要改成只描述**通用 UX 手法概念**，不點名、不綁定任何品牌：
  - 時間軸連動（TimelineSync）
  - 拖曳排序（WorkflowSorter）
  - 微沙盒互動（MicroSandbox）
  - 概念對照（ConceptCompare）
  - 隨堂測驗（InstantQuiz）
  - **老闆這次額外補充的兩個新概念，還沒寫進 proposal/design**：互動式老師人像、動態對話視窗
- `openspec/changes/interactive-learning-system/tasks.md`、`specs/course-module/spec.md` 也可能有同樣的措辭問題，要一併檢查
- 老闆的原話確認：「我想要借鑑它的概念，而不是要抄襲它整個內容和架構」——這是這次重寫要守住的紅線
- 這整份 change 目前**完全沒有 commit**，是 untracked 狀態，改完之後才 commit

**還沒問完的問題**：這份 change 是不是老闆自己另開了一個 session／worktree 在做，要跟老闆確認清楚，避免有第三條線在同時動工、之後衝突。

## 環境注意事項

- 目前的 worktree：`sr-self-service-plugin-pipeline`（platform-shell-plugin-architecture 重寫已完成，待 review/merge），路徑 `/Users/fishtv/orca/workspaces/startkiter/sr-self-service-plugin-pipeline`
- 主目錄 `products/startkiter` 上還有一批 8/17 的舊 discuss 文件跟一份不相關的筆記檔（`docs/为什么叫QQ...md`）一直是 untracked 狀態，之前討論過要清理但還沒處理，不急，但別誤刪
- `.turbo/` 沒進 `.gitignore`，一直出現在 `git status`，可以順手補一條規則
- Coolify Cloud 帳號、`startkiter.dev` 網域的實際存取權限還沒交接，下一個 session 要跟老闆確認進度

## 老闆的溝通習慣（給下一個 session 參考）

- 老闆的角色分工要求：**Claude 負責聽懂需求、給方案、寫計畫，然後派工出去，不要自己埋頭做執行細節**（自己讀一堆檔案、自己開瀏覽器查資料這種粗活，應該先想清楚要查什麼再派出去）
- 討論多個問題時要**一題一題來**，不要一次丟一串
- 結構／架構類討論，老闆明確要求「文字＋圖解」，圖解可以用 `orca artifacts share` 開公開連結給他看
- 老闆對「查證屬實」要求高，之前有一次因為誤植 PAYUNi 限制範圍被糾正，之後每個決策務必先查 repo 裡的實際紀錄再回答，不要憑印象
