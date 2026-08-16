## Context

StartKiter 現行 `packages/ui/src/index.tsx` 僅有一個 stub 元件 `Panel`，`apps/saas/app/page.tsx`、`login/page.tsx` 等頁面是手刻的 CSS class（`.hero` `.button` `.secondary`），從未真正移植 supastarter-nextjs-main 的 `@repo/ui`（shadcn/ui 元件庫）與 `theme.css` 設計 token。這是視覺風格「怎麼調都不像 supastarter」的根因，已用實際檔案內容驗證（見 proposal Impact）。

老闆已明確定案產品方向：以 supastarter-nextjs-main 的元件/架構系統為地基，逐步合併 THE-TU-Project（Course Realms）的完整課程販售功能，融合成一個系統。本次 change 只處理「地基」（元件系統移植、多語系架構、登入 UI、前後台版面骨架、買家擴充慣例、一鍵部署），不處理 THE-TU 各業務功能（coupons/subscriptions/newsletters/bundles/analytics/instructors/media/comments）的實作——那些留給地基完成後的後續 change。

## Goals / Non-Goals

**Goals:**

- 把 supastarter-nextjs-main 真實的 `packages/ui` 元件庫與 `theme.css` 設計 token 移植進 StartKiter，取代現有 stub
- 修正中文渲染字體/行距跑掉的問題（DM Sans 缺中文字型）
- 建立多語系架構（zh-TW/zh-CN/en 起跳，可擴充），取代「i18n 只留 zh-TW」的舊規則
- 登入頁改用真實元件重做，provider 架構可擴充
- 前台（marketing）比照 supastarter.dev 版面語言、後台（app）比照 demo.supastarter.dev 版面語言，同一套元件系統
- 建立買家擴充慣例文件與一鍵部署設定
- 在真代碼開工前，先產出高擬真 HTML demo（使用移植後的真實設計 token，不是手繪猜色）供老闆確認，避免重蹈前幾輪 Codex/Cursor 手刻 mockup 猜色猜排版走遠路的覆轍

**Non-Goals:**

- 不在本 change 實作 THE-TU 的 coupons、subscriptions、newsletters、bundles、analytics、instructors、comments/messages、media 管理等業務功能——這些是地基完成後個別開新 change
- 不裁決 Organization 多租戶要不要拉回來——列入 Open Questions，本 change 不假設答案、不動 `packages/auth` 的 organization 相關程式碼
- 不裁決電子發票（einvoice）範圍——維持現行「不在 MVP」，不在本 change 重新評估
- 不修改 supastarter-nextjs-main 或 THE-TU-Project 來源 repo 本身，僅單向抽取/參考
- 不變更現行 PAYUNi 結帳邏輯、Order 資料模型、GitHub kit 認領流程的業務邏輯（只調整這些頁面的視覺呈現，不動後端邏輯）
- 不重做 course、checkout、admin/settings、agent 頁面的視覺（cross-impact 預檢發現這些頁面共用 globals.css 現有的 `.hero`／`.button`／`.panel`／`.actions`／`.muted` class，超出本次 demo-first 確認過的首頁/登入/後台首頁三頁範圍）——這些 class 本次保留不動，這些頁面排入後續 change 才套用新設計系統

## Decisions

### 元件庫移植方式：整包搬遷不是重新手刻

從 `supastarter-nextjs-main/packages/ui` 直接複製 shadcn/ui 元件原始檔到 `startkiter/packages/ui/src/components/`，並複製 `theme.css` 的設計 token（顏色/圓角/間距 CSS 變數），而不是照著截圖用肉眼估算顏色重新手刻。

- **來源路徑 → 目標路徑**：
  - `/Users/fishtv/Development/supastarter-nextjs-main/packages/ui/components/*` → `/Users/fishtv/Development/products/startkiter/packages/ui/src/components/*`
  - `/Users/fishtv/Development/supastarter-nextjs-main/apps/saas/app/globals.css`（CSS 變數與 `@variant dark` 段落）→ `/Users/fishtv/Development/products/startkiter/apps/saas/app/globals.css`
  - `/Users/fishtv/Development/supastarter-nextjs-main/apps/saas/modules/shared/components/ColorModeToggle.tsx` → `/Users/fishtv/Development/products/startkiter/packages/ui/src/components/color-mode-toggle.tsx`
- **Alternatives Considered**：
  1. 手刻近似元件（前幾輪 Codex/Cursor 的做法）——否決，已證實無法逼近真實視覺，且每次修正都在猜測顏色數值，反覆返工
  2. 直接安裝 shadcn/ui CLI 重新生成元件——否決，會拿到 shadcn/ui 官方預設樣式而非 supastarter 已客製過的版本，仍需再次比對調整，不如直接複製已客製檔案

### 字體策略：DM Sans 接中文字體 fallback

`font-family` 設定為 `"DM Sans", "Noto Sans TC", sans-serif`，中文字元自動 fallback 到 Noto Sans TC，避免退回瀏覽器預設字體造成字重/行高不一致。

- **Alternatives Considered**：
  1. 全站改用單一中文字體（不用 DM Sans）——否決，會失去 supastarter 視覺辨識度，且英文數字（NT$8,800 這類）用中文字體渲染會不好看
  2. 用 `next/font` 動態依語言切換整組字體——否決，增加複雜度且首次載入會有 FOUT，fallback chain 已足夠解決問題

### 多語系架構：沿用 supastarter 的 next-intl，不用其他 i18n 套件

直接移植 `supastarter-nextjs-main/packages/i18n` 的 next-intl 架構與訊息檔案結構，語言清單擴充為 `zh-TW`、`zh-CN`、`en`。

- **Alternatives Considered**：
  1. 沿用 StartKiter 現有 `@startkiter/i18n`（目前是自製的簡易 `messages` 物件，只有 zh-TW 一份）——否決，不支援語系切換機制，擴充語言要重寫
  2. 用 `react-i18next`——否決，supastarter 生態系與元件庫已綁定 next-intl，混用兩套 i18n 方案增加維護成本

### Demo-first 驗證流程：先出 HTML demo 確認，再動真代碼

用移植後的真實 `theme.css` token 與元件樣式，產出靜態 HTML demo（首頁、登入頁、後台首頁），讓老闆逐頁確認視覺與內容深度都對，簽核後才開始改寫 `apps/saas` 的真實頁面。

- **Alternatives Considered**：
  1. 直接動手改真代碼，做完再給老闆看——否決，前幾輪已證實「做完才看」會導致大量返工（A/B/C 三個方向、多輪顏色字體修正都是教訓）
  2. 用 Storybook 之類的元件預覽工具——否決，對非工程背景的老闆來說操作門檻高，靜態 HTML 直接雙擊開瀏覽器最直覺

### 買家擴充機制：輕量慣例文件，不採用 runtime plugin 框架（如 cordis）

寫一份 `docs/buyer-extension-convention.md`，用 StartKiter 現有 package 資料夾的實際形狀（`packages/<name>/src/index.ts` + 對應路由）當範例，定義新模組的資料夾/進入點/env 宣告慣例。買家自己的 AI 工具（Claude Code、Cursor）讀這份文件後照樣加新模組。

- **Alternatives Considered**：
  1. 導入 cordis（TypeScript 插件框架，Context/Service/Plugin/DI）——否決，已在本次討論初期實測過（demo 專案），確認買家拿到的是各自獨立的 repo、各自本機開發，不是共用一個跑著的服務，不需要 runtime 動態掛拔插件的能力；cordis 目前版本號 `4.0.0-rc.8` 尚未到 1.0，替一人公司的教學產品增加不必要的不穩定依賴
  2. 不寫慣例文件，讓買家自己看現有程式碼摸索——否決，買家不寫程式、靠 AI 溝通完成開發，AI 也需要一份明確的慣例文件才能穩定產出一致風格的新模組

## Implementation Contract

**Behavior**：
- 開發者執行 `pnpm dev` 後，`apps/saas` 首頁、登入頁使用真實 supastarter 元件渲染（可在瀏覽器 DOM 檢查到 shadcn/ui 元件的 class 命名慣例，如 `data-slot="button"`），不是自製 `.hero`/`.button` class
- 中文與英文混排文字（如「取得開站包 NT$8,800」）字重、基線對齊一致，不會出現中文字明顯比英文字大或字重不同的錯位
- 語言切換器可在 zh-TW / zh-CN / en 之間切換，切換後頁面文案即時更新，URL 帶語言代碼（如 `/zh-tw/`、`/en/`）
- 深色/淺色模式切換鈕存在且可用，切換後 `<html>` 的 `.dark` class 正確增減，色票依 supastarter 移植的 token 切換

**Interface / 資料形狀**：
- `packages/ui` 對外匯出至少：`Button`、`Card`、`Badge`、`Input`、`Form`、`ColorModeToggle` 元件，匯出方式比照 supastarter 的 `@repo/ui/components/<name>` 路徑慣例
- `packages/i18n` 對外匯出 `useTranslations()` hook（或等價機制）與語言清單常數，新增語言只需新增一份訊息檔案 + 語言清單常數加一筆，不需改動元件程式碼

**Failure modes**：
- 語言檔缺少某個 key 時，fallback 到 `zh-TW` 的對應文字，不得顯示 key 原始字串（如 `home.hero.title`）給使用者看到
- 字體載入失敗（CDN 問題）時，fallback 到系統預設無襯線字體，不得造成版面空白或當機

**Acceptance criteria**：
- 用瀏覽器打開 `apps/saas` 首頁，DOM 檢查可見 shadcn/ui 元件的 `data-slot` 屬性，而非自製 class
- 中文字串與英文字串混排截圖比對，字重/行高視覺一致（人工比對，無自動化測試）
- 語言切換器在三語間切換均能正確載入對應文案，無 key 原始字串外露
- 深色模式切換後，`document.documentElement.classList.contains('dark')` 為 true，且色票確實改變（可用瀏覽器 devtools 確認 CSS 變數值）
- 老闆對 HTML demo（首頁/登入頁/後台首頁）明確表示「可以，動代碼」後，才視為本項 Decision 完成，才能開始改 `apps/saas` 真實頁面

**Scope boundaries**：
- In scope：`packages/ui`、`packages/i18n`、`apps/saas/app/page.tsx`、`login/page.tsx`、`signup/page.tsx`、`app/page.tsx`（後台首頁）、`globals.css`、`layout.tsx`、`openspec/config.yaml`、`docs/buyer-extension-convention.md`、部署設定檔
- Out of scope：`packages/payments`、`packages/database`、`packages/auth` 的業務邏輯（Better Auth 設定、PAYUNi 金流邏輯本身不動，只動這些功能對應頁面的視覺）；THE-TU 各項業務功能的資料模型與 API

## Risks / Trade-offs

- [Risk] 移植 supastarter 元件庫可能帶入未預期的相依套件（Radix UI primitives 版本、Tailwind 版本要求）與 StartKiter 現有 `package.json` 版本衝突 → Mitigation：移植前先比對兩邊 `package.json` 的 Tailwind／Next.js／React 版本號，衝突項目在 tasks 逐一列出處理，不得跳過直接覆蓋
- [Risk] 多語系上線後，PAYUNi 結帳等既有頁面文案若沒有全部補上翻譯，會出現英文/簡中頁面夾雜零星中文字串 → Mitigation：tasks 需包含「翻譯覆蓋率檢查」項目，用腳本掃描所有 `t("...")` 呼叫確認三語系都有對應 key
- [Risk] HTML demo 確認流程若老闆看了 demo 仍反覆修改，會拖延真代碼開工時間 → Mitigation：demo 逐頁分開確認（先首頁，過了才做登入頁），縮小每次來回的範圍，不要一次做完三頁才給看
- [Risk] `v1-scope-boundary` 邊界規則重寫後，Organization／發票兩項 Open Questions 若遲遲不裁決，會卡住後續 THE-TU 全功能合併的規劃 → Mitigation：本 change 的 tasks 完成後，於 proposal 摘要中明確請老闆對兩項 Open Questions 給裁決，不隱性假設任何一種答案
- [Risk] cross-impact 預檢發現 `apps/saas/app/globals.css` 的 `.hero`／`.button`／`.panel`／`.actions`／`.muted` 等 class 被 course、checkout、admin、agent 等超過 10 個未排入本次範圍的頁面共用，若這批 class 在移植階段被真元件系統取代或改名，會造成那些頁面靜默失去樣式（不會 build fail） → Mitigation：本次不移除、不改名任何現有 class，新舊樣式並存；course/checkout/admin/agent 頁面改用新設計系統排入後續 change，見 tasks 2.7
- [Risk] cross-impact 預檢發現 `apps/saas/app/components/site-nav.tsx`（被 9 個頁面共用的全站導覽列）與 `apps/saas/app/app/page.tsx` 直接消費 `packages/i18n` 現有的靜態 `messages` 物件，若 i18n 改為 next-intl 架構後介面改變（靜態物件存取變成 hook 呼叫），這兩個檔案會編譯錯誤或執行期壞掉，且因為 SiteNav 被 9 個頁面共用，等於全站導覽列一次性壞掉 → Mitigation：tasks 4.6 明確將這兩個檔案的 i18n 呼叫方式改寫排入範圍，並新增涵蓋 SiteNav 渲染的測試

## Migration Plan

**部署步驟**：
1. 在獨立 git 分支（`feature/merge-supastarter-ui`）進行本次全部變更，不直接動 `main`
2. 先完成 HTML demo 產出與老闆確認（本地靜態檔案，不部署）
3. demo 確認後，依 tasks 順序改寫 `packages/ui`、`packages/i18n`、`apps/saas` 頁面
4. 本機 `pnpm dev` 驗證全部 Acceptance criteria 通過
5. 部署到 TEST 環境（`https://test-startkiter.vercel.app`，依現有兩倉規則）供老闆用真實網址複驗
6. TEST 環境驗證通過後才合併回 `main`，觸發正式倉庫晉升流程（依 `test-clean-package-promotion` 既有規則）

**回滾策略**：
- 因為是獨立分支開發，合併前發現問題可直接捨棄分支，`main` 不受影響
- 若合併後 TEST 環境才發現問題，`git revert` 該次合併 commit，`packages/ui` 舊的 stub 版本會被還原，不影響資料庫（本 change 不涉及 DB schema 變更）

## Open Questions

- Organization 多租戶要不要在後續 THE-TU 全功能合併時一併拉回來？本 change 不假設答案，需要老闆在後續 change 開工前明確裁決
- 電子發票（einvoice）是否要重新排入 MVP 範圍？本 change 維持「不在 MVP」現狀，需要老闆確認是否仍然成立
- 現有已封存的 changes（`mvp-test-scope` 等）與本次方向擴張的關係——是否需要在 `v1-scope-boundary` spec 裡明確標註「本次擴張後，哪些舊條款正式失效」，避免未來讀取 archive 時誤用舊規則
