## Why

StartKiter 目前的 `packages/ui` 只有一個 stub 元件（`Panel`），`apps/saas` 頁面是手刻的陽春 HTML/CSS，從未真正引用 supastarter-nextjs-main 的真實元件庫與設計 token，這是視覺「怎麼調都不像 supastarter」的根因。老闆已明確定案：整個產品要以 supastarter-nextjs-main 的真實元件/架構為地基，合併 THE-TU-Project（Course Realms）的完整課程販售功能，融合成一個系統，不是兩塊拼接的模組。

## What Changes

- 新增：把 supastarter-nextjs-main 的 `packages/ui`（shadcn/ui 元件庫）與 `theme.css` 設計 token 正式移植進 StartKiter 自己的 `packages/ui`
- 新增：中文字體 fallback chain（DM Sans 接 Noto Sans TC），修正中文渲染時字重/行高跑掉的問題
- 新增：多語系架構（zh-TW / zh-CN / en 起跳，可擴充），沿用 supastarter-nextjs-main 的 `packages/i18n`（next-intl）架構
- 新增：買家可擴充慣例文件（輕量模組慣例，供買家自己的 AI 工具如 Claude Code / Cursor 讀取後照樣加新模組，不採用 cordis 或任何 runtime plugin 框架）
- 新增：一鍵部署設定（Zeabur / Vercel / Coolify Deploy 按鈕）
- 修改：`v1-scope-boundary` — 重寫邊界規則，記錄本次方向擴張，並列出待裁決的 Open Questions（見下）
- 修改：`auth-login` — 登入頁改用真實 supastarter 元件重做（Google + LINE），provider 架構可後續擴充
- 修改：`saas-shell` — 前台改用 supastarter.dev 的版面語言、後台改用 demo.supastarter.dev 的版面語言，兩者統一使用同一套元件系統
- **BREAKING**：`openspec/config.yaml` 現行「i18n 只留 zh-TW」規則作廢，改為多語系起跳
- **BREAKING**：`packages/ui` 目前的 stub `Panel` 元件將被真元件取代（Panel 全 repo 零 import，屬死代碼替換，無波及範圍）
- 新增：`apps/saas/app/components/site-nav.tsx`（被 9 個頁面共用的全站導覽列）與 `apps/saas/app/app/page.tsx` 同步改寫 i18n 呼叫方式，避免 i18n 架構變更後全站導覽列壞掉（cross-impact 預檢發現，原本未列入範圍）

## Capabilities

### New Capabilities

- `design-system`: supastarter-nextjs-main 元件庫（Button/Card/Badge/Form 等 shadcn/ui 元件）與 theme.css 設計 token 移植進 StartKiter，含中文字體 fallback 修正
- `i18n-multilingual`: 多語系架構，最少支援 zh-TW/zh-CN/en，架構可擴充其他語言
- `buyer-extension-convention`: 輕量模組慣例文件，定義新功能模組的資料夾/進入點/env 宣告慣例，供買家自己的 AI 工具讀取後擴充
- `one-click-deploy`: Zeabur/Vercel/Coolify 一鍵部署設定與說明文件

### Modified Capabilities

- `v1-scope-boundary`: 邊界規則從「窄範圍 MVP」改為「以 supastarter 元件系統為地基、逐階段合併 THE-TU 完整功能」的方向，並記錄本次未裁決的範圍問題
- `auth-login`: 登入/註冊 UI 從陽春手刻改為 supastarter 真實元件實作，provider 清單架構要可擴充
- `saas-shell`: 前台（marketing）與後台（app）版面從自製 CSS 改為 supastarter 真實版面語言，前台比照 supastarter.dev、後台比照 demo.supastarter.dev

## Impact

- Affected specs: `design-system`（新增）、`i18n-multilingual`（新增）、`buyer-extension-convention`（新增）、`one-click-deploy`（新增）、`v1-scope-boundary`（修改）、`auth-login`（修改）、`saas-shell`（修改）
- Affected code：
  - New：`packages/ui/src/components/`（移植的 shadcn/ui 元件）、`packages/ui/src/theme.css`、`packages/i18n/src/locales/`（zh-TW/zh-CN/en）、`docs/buyer-extension-convention.md`、`deploy/zeabur.yaml` 或對應部署設定檔
  - Modified：`packages/ui/src/index.tsx`、`apps/saas/app/page.tsx`、`apps/saas/app/login/page.tsx`、`apps/saas/app/login/login-form.tsx`、`apps/saas/app/signup/page.tsx`、`apps/saas/app/app/page.tsx`、`apps/saas/app/components/site-nav.tsx`、`apps/saas/app/globals.css`、`apps/saas/app/layout.tsx`、`openspec/config.yaml`、`packages/i18n/src/index.ts`
  - Removed：無。`packages/ui` 現有 stub `Panel` 元件本身會被移除（零 import，無波及），但 `apps/saas/app/globals.css` 現有的 `.hero`／`.button`／`.panel`／`.actions`／`.muted` 等 class **本次不移除**——cross-impact 預檢發現這些 class 被 course、checkout、admin、agent 等超過 10 個尚未排入本次改版範圍的頁面共用，移除會造成那些頁面靜默失去樣式。這些 class 在本次 change 結束後仍保留為 legacy 樣式，course/checkout/admin/agent 頁面改用新元件系統排入後續 change
- Dependencies 新增：`next-intl`（若尚未安裝）、shadcn/ui 相關 Radix primitives（隨移植元件帶入）、Noto Sans TC 字體來源
- 環境變數新增：暫無（本次不涉及新的第三方服務金鑰；THE-TU 全功能合併的後續 change 才會涉及）

## Non-Goals

（本 change 建立 design.md，Non-Goals 完整版記錄於 design.md 的 Goals/Non-Goals 段落）
