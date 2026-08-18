---
name: handoff-rebuild-upstream-complete
description: rebuild-from-official-upstream 已合併封存，兩個 post-merge bug 已修復，交接給下一個 CLI/session 接手驗收剩餘項目
type: project
---

# rebuild-from-official-upstream 完工交接

**狀態：** 主體工程完成，已合併 main + 已封存；發現並修復兩個 post-merge bug；還有幾項驗收缺口沒補
**日期：** 2026-08-18

## 做了什麼

### 1. 官方底座重建（rebuild-from-official-upstream，21/21 tasks）
- 舊 apps/packages 搬進 `legacy/`，建立 `upstream` remote 追蹤官方 supastarter-nextjs
- `apps/marketing`、`apps/saas` 依官方底座重建（Hero/Features/Pricing/FAQ/Testimonials/CTA/Newsletter 全區塊）
- 業務邏輯（auth/payments/course/github-kit/database/i18n）整包遷移並重新接線
- CR 三角度審查 Critical 0，`pnpm build`/`pnpm test` 全過
- 已合併進 main，已封存至 `openspec/changes/archive/2026-08-18-rebuild-from-official-upstream`

### 2. Post-merge 發現並修復兩個真實 bug
（這兩個沒有走正式 SR 流程，是用 `/spectra-debug` 四階段方法論直接派工修的，直接 commit 進 main，沒有對應 change 資料夾）

- **i18n 語系切換完全無效**：大部分文案跟課程目錄仍是官方英文/繁中硬編碼，沒真的走 next-intl。已補齊 marketing/saas 文案跟課程目錄多語系，親自登入測試帳號實測繁中/簡中/英文三種切換都正確。
- **mail provider 導致乾淨 main 建置失敗**：`packages/mail/provider/index.ts` 預設用 resend，本機沒有 `RESEND_API_KEY` 時建置期初始化直接拋錯。已改為非 production 環境自動退回 console provider，production 環境維持 fail-closed（不會靜默吞信）。

**這兩個 bug 的教訓**：Codex 第一輪回報 tasks.md 全過，但那個「build 通過」的驗證其實是在它自己偷改過 mail provider（未 commit）的環境下跑的，不是乾淨環境。**以後任何「build/test 通過」的回報，都要在乾淨 checkout 上親自重跑一次確認，不能只信 worker 自報。**

## 還沒做的

- [ ] 前台首頁 `<title>Acme</title>` 官方站名沒換成 StartKiter（小疏漏）
- [ ] PAYUNi 目前是 sandbox 模式，正式上線前要換正式憑證重測
- [ ] 後台首頁/課程頁/checkout 頁的官方版面比對，因為當初沒有官方 demo 帳號，是用「元件庫共用性」當替代佐證，不是逐頁肉眼比對——**現在 Fish 已經有官方 demo 帳號了**（`fish@fishot.com`，密碼他自己有，不能由 AI 輸入），下一個 session 可以請 Fish 登入 `https://app-demo.supastarter.dev` 後用 ego-browser（會沿用登入 session）逐頁截圖比對，這次已經比對過首頁（Start 頁面，`Place your content here...` 佔位符確認官方本來就有），但後台管理員（Admin，僅組織/角色權限才會顯示）、課程頁、checkout 頁還沒有用官方帳號逐頁看過
- [ ] 官方 Admin 區塊（`/admin/organizations`、`/admin/users`）在我們自己 app 裡有做，但這次沒有實際登入官方 demo 去比對是否一致（demo 帳號目前是 Personal account 沒有組織，看不到 Admin）

## 關鍵決策

1. **部落格文章沒有網頁發文介面，是設計如此**：官方文件 `docs/reference/supastarter-nextjs-docs/blog.mdx` 明講用 content-collections（markdown-based CMS），文章就是 `.mdx` 檔案放在 `apps/marketing/content/posts/`，靠改檔案發文，不是漏做。
2. **Admin 後台只管「平台上的組織/用戶」，不是內容管理後台**——這是官方架構的既定設計，不是缺功能。
3. **派工協定教訓（已寫進 `~/.claude/rules/routing.md`）**：需要等 worker 完成回報才用 `orchestration`（`worker-start` + `check --wait --types worker_done`），單純交接才用 `orca-cli` 陽春 terminal；已誤開的陽春 terminal 可以用 `--terminal <handle>` 事後收編進 orchestration，不用重開。`orca terminal wait --for tui-idle` 不可靠，啟動階段會誤判成閒置。`orca orchestration check --wait --json` 會吐 heartbeat 雜訊要濾掉（`grep -v '"_heartbeat":true'`）。
4. **Worktree 收尾規則（已寫進 routing.md）**：每個 worktree 要對應一個「還沒 archive 的 change」，worker_done 一到、開新 worktree 前、change archive 時，三個時機強制檢查 done/still-active/stale，該關就關，不要無限累積佔 RAM/CPU。
5. **多個 worktree 共用同一個本機 Postgres**，新開的 worktree 需要自己複製 `.env`（不會自動繼承）、可能要重跑 `pnpm --filter database push` 同步 schema，測試帳號 emailVerified 欄位也可能要手動確認/補上。

## 改了哪些檔案

主要變動範圍（詳見 `git log --oneline` 從 `f6ea77b5`到`8af51530`，共 21+2 個 commit）：
- `apps/marketing/**`、`apps/saas/**`：整個重建
- `packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit`、`packages/database`、`packages/i18n`：整包遷移重新接線
- `packages/mail/provider/**`：新增 fail-safe 邏輯（本次 debug 修復）
- `legacy/**`：舊內容保留備份
- `openspec/changes/archive/2026-08-18-rebuild-from-official-upstream/`：已封存的 SR 文件

## 環境注意事項

- 目前正確的本機 dev port：**apps/saas 3000、apps/marketing 3101**（3001 是舊分支殘留過的 port，已經清掉，不要再往那邊找）
- 測試帳密：`admin@startkiter.local` / `StartKiter2026!`
- 官方 demo 比對用：`https://app-demo.supastarter.dev`，Fish 本人帳號 `fish@fishot.com`（AI 不可輸入密碼，需 Fish 自己登入，ego-browser 之後會沿用該登入 session）
