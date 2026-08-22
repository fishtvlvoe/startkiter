# StartKiter 專案儀表板 SOP

**新系統（2026-08-22 起）**：固定網址、永不到期、自動鎖機制、完整歷史紀錄。

> 舊系統（orca artifacts，30 天到期）已停用。新系統詳見 `~/.claude/reference/dev-dashboard-sop.md`。

## 目前發布網址

- **https://startkiter-dashboard.pages.dev/**
- 平台：Cloudflare Pages（永久固定網址，無到期機制）
- 本系統架構：Awesome-Dyson `dev-project-dashboard-system` change

## 什麼時候要更新

- 任何 Spectra change 的 tasks.md 進度有變化（打勾數變了）
- 基礎設施現況有變化（VPS、網域、Cloudflare、LINE/Telegram、部署平台等決定）
- 有新的待老闆確認事項，或舊的確認事項有了答案
- 老闆明確要求「更新一下現況」

## 快速更新步驟

1. **編輯本機狀態**（StartKiter 的專屬複本，不是 Awesome-Dyson 共用範本）：
   ```bash
   vim ~/.local/share/dev-dashboards/startkiter/state.json

   # 或新增歷史紀錄
   /Users/fishtv/Development/Awesome-Dyson/scripts/dashboard-add-entry.sh \
     startkiter ~/.local/share/dev-dashboards/startkiter \
     "2026-08-22" "更新描述" "工作摘要"
   ```

2. **部署到 Cloudflare Pages**：
   ```bash
   /Users/fishtv/Development/Awesome-Dyson/scripts/dashboard-deploy.sh startkiter ~/.local/share/dev-dashboards/startkiter
   ```

   > 腳本實際位置在 Awesome-Dyson repo 裡（`~/.claude/scripts/` 底下沒有這些腳本），不要改到 `/Users/fishtv/Development/Awesome-Dyson/public/`——那是共用範本，改了會污染之後其他專案要用的範本內容。

3. **驗證**：
   ```bash
   curl https://startkiter-dashboard.pages.dev/ | grep "<title>"
   ```

## 詳細 SOP

見 `~/.claude/reference/dev-dashboard-sop.md`，涵蓋：
- 初始化（已完成，startkiter-dashboard 已建立）
- 編輯 state.json（現況快照）
- 記錄 entry（工作階段歷史）
- 鎖機制（同時寫入保護）
- 本機目錄結構
- 部署工作流
- 常見問題

## 新系統特點

- **永久網址**：不再有 30 天到期、無須重新發布拿新網址
- **機器可讀**：state.json + entries/ 為純 JSON，AI Agent 能直接解析，不用渲染 HTML
- **歷史追蹤**：entries/ 自動記錄每次工作階段，互不覆蓋
- **無後端**：純靜態 Cloudflare Pages，無 Worker、無資料庫，無須維護伺服器
- **鎖機制**：多 Agent 同時更新時自動排隊，避免衝突

## 舊系統棄用

- orca artifacts 連結 `https://share.onorca.dev/a/3CEeYhHiSGfP` 已停用
- `docs/dashboard/status.html`（舊的 HTML 檔）保留作版本紀錄，但不再發布
- 後續所有更新改用新系統

## 相關硬規則

見 `~/.agent-guardrails/deny-list.md` 與 `~/.claude/reference/dev-dashboard-sop.md`
