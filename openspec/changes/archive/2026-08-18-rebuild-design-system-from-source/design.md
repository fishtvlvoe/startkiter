## Context

`extract-supastarter-design-system`（已封存）用本機三份不明版本 supastarter 快照做視覺/元件移植。事後對照官方私有倉庫（clone 到 `vendor/supastarter-nextjs/`，Fish 帳號 `fishtvlvoe` 已被授權 `pull`）與官方開發文件（下載到 `docs/reference/supastarter-nextjs-docs/`，122 個 `.mdx`）發現落差不是表面視覺問題，而是技術選型層級的偏離：

- UI 元件庫：官方用 Base UI（`@base-ui/react`），StartKiter 抄成 Radix UI（`packages/ui/package.json` 依賴 `radix-ui: ^1.6.7`），兩者元件 API 不相容
- CSS/token 架構：官方 `apps/saas/app/globals.css` 僅 41 行，token 集中在 `packages/tooling/tailwind/theme.css` 獨立成共用包再 `@import` 引入；StartKiter 現況 `globals.css` 479 行 + `design-system.css` 984 行全部內嵌
- 配色：官方預設 olive 色階，StartKiter 抄成 zinc/slate 灰階
- 字體：官方 SaaS 後台純 Inter，StartKiter 做成「DM Sans 全站 + Noto Sans TC fallback」
- `--radius` 已驗證舊快照抄到過時值（0.75rem vs 官方最新 0.625rem），已在前一輪修正為 0.625rem

`platform-shell-plugin-architecture` Phase 1（後台 Shell 統一：`/agent`、`/admin/settings` 併入 AppShell、手機版底部 tab bar）已完成並合併進 main（commit `e4cbb7b`），本次重做在其結構之上換元件庫/CSS/配色，不回頭重做 Shell 統一本身。

`organization-role-model` 已封存，定義了 owner/admin/instructor/user 四種角色的權限矩陣，本次補齊的多租戶切換器與型別化權限直接對接這份規格，不重新設計角色定義。

## Goals / Non-Goals

**Goals:**

- 以 `vendor/supastarter-nextjs/` 原始碼與 `docs/reference/supastarter-nextjs-docs/` 官方文件為唯一依據，逐項對照重做元件庫、CSS 架構、配色、字體
- 元件庫從 Radix UI 完整替換為 Base UI，不是換皮膚，是重寫元件實作
- 後台導覽補上官方有但 StartKiter 缺的型別化權限與多租戶切換器
- 每個階段完成後用源碼級斷言測試驗證（比對 `vendor/` 實際檔案內容），不用截圖肉眼比對

**Non-Goals:**

- 不改後端邏輯：auth、checkout（PAYUNi）、course 資料流與 API 契約不動
- 不動 `platform-shell-plugin-architecture` Phase 1 已完成的 Shell 統一結構
- 不做 `platform-shell-plugin-architecture` Phase 2（Plugin manifest、Marketplace、MCP Gateway）範疇
- 不把 `apps/saas` 目錄結構改成官方的 `modules/{shared,auth,organizations,...}` 分模組結構——專案骨架級改動，另開 change 處理
- 不修改 `vendor/supastarter-nextjs/` 來源本身，僅唯讀參考
- 不重新評估電子發票（einvoice）範圍，維持現行「不在 MVP」

## Decisions

### 元件庫遷移：逐元件源碼比對搬遷，不是重新設計

從 `vendor/supastarter-nextjs/packages/ui` 逐一比對 StartKiter `packages/ui` 現有的 Radix UI 版本元件，用 Base UI 版本原始碼取代，保留元件對外的 `data-slot` 屬性慣例（沿用 `extract-supastarter-design-system` 已建立的測試斷言方式）。透過官方文件指示的 `pnpm --filter=ui shadcn add --base base <元件>` 指令從 Base UI registry 加入新元件基底，再依 StartKiter 既有呼叫點調整 props。

- **Alternatives Considered**：
  1. 保留 Radix UI，只調整視覺樣式對齊 olive 配色 — 否決，元件庫本身選錯不是視覺問題，繼續用 Radix UI 會讓 StartKiter 元件行為/無障礙屬性/API 長期跟官方文件脫節，之後每次參考官方文件都要做心智轉換
  2. 一次性用腳本自動轉換 Radix UI import 為 Base UI import — 否決，兩者元件 API 不是 1:1 對應（如 Base UI 的 `Dialog` 與 Radix 的 `Dialog` props 命名與組合方式不同），自動轉換會產生看似能編譯但行為錯誤的程式碼，必須逐元件人工核對

### CSS/token 架構：token 抽成獨立共用包，globals.css 只留 base 樣式

新建 `packages/tooling/tailwind/theme.css`，把現有分散在 `apps/saas/app/globals.css` 與 `apps/saas/app/design-system.css` 的 CSS 自訂屬性（olive 色階、`--radius`、字體變數）集中進這個檔案，`globals.css` 改為 `@import` 引入 + 少量 base 樣式，比照官方 41 行的精簡程度。

- **Alternatives Considered**：
  1. 維持現有內嵌方式，只替換色值 — 否決，`design-tokens.test.ts`／`demo.test.ts` 這類測試已經證明「token 沒有獨立成可直接比對的來源」會讓落差長期不被發現，獨立成包才能持續用測試對照官方最新版本
  2. 用 CSS-in-JS 或 Tailwind config 物件取代 CSS 自訂屬性 — 否決，偏離官方架構模式，之後對照官方文件會更難追蹤

### 配色：完整採用官方 olive 色階，不做客製化偏移

`--background`、`--primary`、`--border` 等全部 token 直接取用 `vendor/supastarter-nextjs/packages/tooling/tailwind/theme.css` 的 olive 色階數值，不追加或調整任何色相。

- **Alternatives Considered**：
  1. 在 olive 基礎上調整成品牌識別色 — 否決，本次目標是消除「詮釋版跟官方對不上」的問題，任何客製化偏移都會重新引入同樣的落差風險；若後續要建立品牌識別，應該是另一個明確的視覺品牌 change，而非夾在這次源碼對齊工作裡
  2. 保留 zinc/slate，只调整 --radius 等少量數值 — 否決，Fish 已明確要求全部重做，維持舊配色系統跟目標矛盾

### 字體：SaaS 後台純 Inter，拿掉 DM Sans + Noto Sans TC fallback

依 `customization/styling.mdx` 的規範，SaaS 後台（`apps/saas`）全面改用 Inter，移除目前的 DM Sans 標題字體與 Noto Sans TC fallback 設定。中文顯示交由 Inter 的系統字體 fallback 鏈處理（`ui-sans-serif, system-ui`），不額外指定中文字體。

- **Alternatives Considered**：
  1. 保留 DM Sans 用於標題、Inter 用於內文（比照官方 marketing app 的策略） — 否決，StartKiter 目前沒有獨立的 marketing app，首頁與後台共用 `apps/saas`，官方文件明確區分「marketing 用 DM Sans 標題」與「SaaS 用純 Inter」是因為兩者是分開的 app；StartKiter 全部頁面都屬於 SaaS app 範疇，比照 SaaS 策略更符合官方架構意圖
  2. 保留 Noto Sans TC fallback 確保中文顯示品質 — 否決，這是先前偏離官方規範的原因之一，中文顯示品質留待後續若有具體 rendering 問題再處理，本次先完整對齊官方策略

### 型別化權限與多租戶切換器：對接 organization-role-model 既有角色矩陣

新增 `PermixProvider`/`usePermissions` 型別化權限機制與 `OrganizationSelect` 多租戶切換器，權限規則直接對應 `organization-role-model` 已封存的 owner/admin/instructor/user 權限矩陣（`openspec/specs/organization-tenancy/spec.md`），不重新定義角色語意。

- **Alternatives Considered**：
  1. 沿用目前 `apps/saas/lib/operator.ts` 的簡單布林 `requiresOperator` 判斷 — 否決，`platform-shell-plugin-architecture` design.md 已記錄這是 v1 刻意簡化的技術債，這次既然要對齊官方架構且官方確實用 Permix，順勢補齊比繼續拖欠更省成本
  2. 等 `platform-shell-plugin-architecture` Phase 2 再一起做 — 否決，Phase 2 範疇是 Plugin manifest/Marketplace/MCP Gateway，型別化權限是後台導覽層的基礎設施，跟本次元件庫重做同屬 UI 層變更，一起做可以避免同一批檔案（`app-shell.tsx`）被改兩次

## Implementation Contract

**Behavior**：

- 全站視覺配色從 zinc/slate 灰階變為 olive 色階，`--radius` 維持 0.625rem
- 後台頁面（`/app`、`/agent`、`/admin/settings`、`/course`）字體從 DM Sans 變為 Inter
- 所有互動元件（Button、Card、Badge、Input、Form、Dialog 等）的底層實作換成 Base UI，對外可見的 `data-slot` 屬性慣例維持不變（既有測試斷言 `data-slot="button"`／`data-slot="input"` 等不需要改寫測試意圖，只需要確認元件仍輸出相同屬性）
- 具備 owner/admin 權限的使用者在 AppShell 側欄看到 `OrganizationSelect` 多租戶切換器；不具備權限的使用者不看到
- 型別化權限規則生效後，`usePermissions` 回傳的權限判斷結果需與 `organization-tenancy` spec 的權限矩陣表一致

**Interface / data shape**：

- `packages/ui/src/components/*` 的元件 export 簽名維持與現有呼叫點相容（元件 props 介面不變，內部實作换 Base UI）
- `packages/tooling/tailwind/theme.css` 新增檔案，定義 `--background`、`--foreground`、`--primary` 等 CSS 自訂屬性，透過 `@import` 被 `apps/saas/app/globals.css` 引入
- `usePermissions()` hook 回傳型別化的權限檢查函式，簽名比照 `vendor/supastarter-nextjs` 對應 hook 的介面

**Failure modes**：

- 元件庫替換過程中若某個 Base UI 元件行為與 Radix UI 版本不一致（例如 focus trap、鍵盤導覽），該元件所在頁面的既有測試會轉紅燈，需要逐一排查修正，不得跳過或刪除測試
- 型別化權限判斷失敗（找不到使用者角色）時，`usePermissions` 必須回傳「無權限」而非拋出例外或預設為有權限

**Acceptance criteria**：

- 對每個核心 token（`--radius`、`--background`、`--primary` 等）撰寫測試，斷言 StartKiter 本地值與 `vendor/supastarter-nextjs/packages/tooling/tailwind/theme.css` 對應值逐字相同
- `packages/ui` 所有元件測試（含既有 `data-slot` 屬性斷言）轉綠燈
- `pnpm build`／`pnpm test` 全專案 exit code 0
- 用 ego-browser 對首頁、登入頁、後台首頁、課程頁、`/agent`、`/admin/settings` 六頁截圖存檔，作為視覺變更前後對照紀錄（輔助佐證，非驗收依據——驗收依據是源碼級斷言）
- `usePermissions` 對 owner/admin/instructor/user 四種角色的判斷結果各有一則測試，比對 `organization-tenancy` spec 的權限矩陣

**Scope boundaries**：In scope：`packages/ui` 元件實作、CSS/token 架構、配色、後台字體、型別化權限、多租戶切換器 UI。Out of scope：後端邏輯、`platform-shell-plugin-architecture` Phase 1/2、`apps/saas` 目錄結構分模組化。

## Risks / Trade-offs

- [Risk] 元件庫替換期間，`apps/saas/app/globals.css` 現有的 `.hero`／`.button`／`.panel`／`.actions`／`.muted` class 仍被 `course`、`checkout`、`admin/settings`、`agent` 等頁面部分依賴（`extract-supastarter-design-system` 的 cross-impact 預檢已記錄此風險），token 架構重整若誤刪這些 class 會讓未排入本次範圍的頁面靜默失去樣式 → Mitigation：重整前先 grep 全部使用點，新舊樣式並存到所有依賴頁面逐一確認遷移完成才移除舊 class
- [Risk] 配色與字體屬於全站可見的劇烈視覺變更，一次套用到生產環境風險高 → Mitigation：沿用 `extract-supastarter-design-system` 證明有效的 demo-first 流程，但這次 demo 直接引用 `vendor/supastarter-nextjs` 實際 CSS 值產出（不是憑印象重刻），先讓 Fish 對照官方原始碼實際渲染結果確認過再套用真代碼
- [Risk] Base UI 與 Radix UI 的無障礙行為（focus trap、ARIA 屬性、鍵盤導覽）可能有細節差異，肉眼或截圖測試看不出來 → Mitigation：優先對高互動元件（Dialog、Dropdown、Form）補充鍵盤操作與 ARIA 屬性斷言測試，不只驗證視覺
- [Risk] 型別化權限與多租戶切換器是新增功能，若 `organization-tenancy` spec 的角色矩陣有本次工作期間才發現的邊界情況（例如同一使用者橫跨多組織的權限疊加），會需要回頭修改 `organization-role-model` 的既有規格 → Mitigation：本次僅實作 UI 層讀取既有角色矩陣，不新增或修改角色定義；若發現矛盾記錄進 Open Questions，不擅自變更已封存 spec

## Migration Plan

分批進行，每批獨立 commit，可逐批回滾：

1. **CSS/token 架構 + 配色**（風險相對低，可獨立驗證）：建立 `packages/tooling/tailwind/theme.css`，token 抽離、配色改 olive、後台字體改 Inter。用 demo-first 產出對照官方 `vendor/` 實際 CSS 值的靜態 HTML demo，Fish 確認後套用真代碼
2. **元件庫替換**（風險最高，逐元件進行）：依使用頻率排序（Button、Input、Form 優先，因為登入/結帳頁面依賴），每個元件替換後跑該元件既有測試與新增的 Base UI 行為測試，全部轉綠燈才進下一個元件
3. **型別化權限與多租戶切換器**：待元件庫替換完成、AppShell 側欄元件穩定後才加入，避免同一批檔案在元件替換期間被兩條工作線同時修改

回滾策略：每批完成後才 merge 進 main，若某批在驗收發現重大問題，回退該批對應的 commit 即可，不影響已完成的前一批。

## Open Questions

- 是否要在後續另開 change 把 `apps/saas` 目錄結構改成官方的 `modules/` 分模組結構？本次明確排除在 Non-Goals，但官方文件與程式碼都是這個結構，長期維護對照官方會持續有摩擦，需要 Fish 之後評估是否值得投入
