# Proposal: 電馭學院互動學習系統

## Why

StartKiter 已有課程權限閘門與基礎播放頁，但課程目錄仍是靜態資料，播放器僅處理 Bunny 或暫存影片，沒有可持久化的課綱、學習進度、管理端內容工作流或公開試看流程。

本變更將課程升級為正式品牌「電馭學院（StartKiter Academy）」：公開銷售頁導流至合法試看或已購買學員教室；operator 在 Studio 編輯並發布課綱；學員在同一套 Fluent Player Shell 中學習、完成單元並看見即時計算的進度。

三份 HTML Demo 僅作為互動與版型參考，不能複製其 Font Awesome、Emoji、原生假資料或直接插入 HTML 的實作方式。白皮書與現行 `openspec/specs/` 為行為與安全邊界的 SSOT。

## What Changes

- 建立課程內容的持久化模型：Course、Chapter、Lesson、LessonProgress，以及 Studio 側欄資料夾與排序資料；保留既有 `Order.courseAccess` 作為付費完整課程權限來源。
- 在四個明確 Mount Point 落地課程模組：`packages/database/prisma/schema.prisma`、`packages/api/modules/course/`、`apps/saas/app/.../course/` 與 `config/modules.ts`。同一個 `course` module id 必須貫穿四處，不能有第二份隱性註冊表。
- 提供電馭學院三個門戶：公開課程銷售與試看、已購買學員教室、operator 專用 Course Studio。
- 建立 Fluent Player Shell 與 provider adapter，支援 Bunny.net、YouTube、Vimeo、HTTPS MP4 與 HLS 直連；Studio 貼上 URL 後必須解析供應商、識別碼與可取得時長，未知或不安全來源必須封鎖。
- 將學員進度改為由 `LessonProgress` 推導：頂部常駐顯示四捨五入百分比與完成數／總單元數，完成單元顯示綠色 SVG 勾選，重複送出不得重複計算。
- 提供可收折的課綱側欄、受限 MDX 互動積木、時間碼同步，以及無工具呼叫的隨課文字 AI 助教。AI 僅取得伺服器確認後的當前單元內容與 AI context，不能讀取其他單元或寫入資料。
- 提供 WordPress 式資訊架構的 Course Studio：資料夾折疊、改名、排序；章節與單元 CRUD、跨章節拖曳排序、發布、預覽、影音解析資訊卡，以及以可存取 SVG icon-only 按鈕呈現的編輯／預覽／刪除操作。
- 對互動系統涉及的所有 UI 設立 SVG icon 與可存取性契約，並將掃描範圍擴及 `apps/marketing`、`apps/saas`、`packages/ui` 與 `packages/course` 的 shipped UI。

## Binding Decisions

- 正式品牌固定為「電馭學院（StartKiter Academy）」。
- 所有使用者可見圖示必須是 imported SVG component；禁止 Emoji、Unicode 圖像字元、Font Awesome font icon 與 `<i>` 標籤式圖示。icon-only 按鈕必須有可讀名稱與 tooltip。
- 完整課程維持 PAYUNi 單一 SKU、TWD 8,800、一次買斷；本變更不得重寫結帳、退款或 GitHub kit 履約。
- Cloudflare Stream 不在支援名單。Bunny、YouTube、Vimeo、HTTPS MP4 與 HLS 是唯一可發布來源；支援清單以 adapter 的嚴格驗證為準。
- Studio 授權沿用 `ADMIN_EMAIL` 的 operator 判定。未登入回 401，已登入但非 operator 回 403，兩者都不能取得 draft、影音 URL 或 mutation 結果。
- 隨課 AI 助教不註冊工具、不寫入資料、不沿用任意 site-agent 上下文；模型或 provider 未設定時 fail-closed 並回傳白話錯誤。
- 多國語系架構：延續底座 `packages/i18n` 既有機制，電馭學院前台、學員教室與 Studio 介面文字以繁體中文 (`zh-TW`) 為 SSOT，並保留語系鍵值，不破壞既有多語系結構。
- 媒體 Fallback 與防呆：捨棄舊版靜態 Bunny fallback；新版 Fluent Player 採 fail-closed 嚴格驗證（無效或未知來源拒絕解析與發布，並在 Studio 顯示白話防呆提示）。
- `platform-shell-plugin-architecture` 目前仍有未完成的 Mount Point 設計。本變更以白皮書指定的 `config/modules.ts` 為課程註冊 SSOT；實作前必須完成跨 change 對照，讓既有 platform registry 成為讀取或轉接層，不能雙寫。

## Non-Goals

- 不引入第三方 LMS、WordPress runtime、泛用 block editor、shortcode 執行器或動態安裝外掛市場。
- 不把任意外部 URL、任意 MDX 元件、任意 HTML 或 JavaScript 交給前端執行。
- 不建立 Organization 多租戶課程所有權；課程內容為站級資料，進度僅歸屬目前登入使用者。
- 不讓匿名訪客播放非 `isFreePreview` 單元，不向未授權使用者輸出完整媒體 URL、草稿、AI context 或其他學員進度。
- 不將 Demo 內的講師、課綱、時長或銷售文案硬編為不可管理的產品真相。

## Capabilities

### New Capabilities

- `interactive-learning-blocks`：受 allowlist 保護的 MDX 互動積木與完成事件契約。
- `timecode-sync-playback`：播放器 adapter 與課程內容之間的雙向時間碼同步契約。

### Modified Capabilities

- `course-module`：課程從靜態播放清單升級為三門戶、持久化課綱、進度、Studio 與受限 AI 助教。
- `course-media-playback`：從 Bunny-only 播放擴展至 Fluent Player Shell、核准來源與 URL metadata 解析。
- `design-system`：為 shipped UI 補上 SVG icon、禁用 icon font／Emoji、icon-only action 的可存取性規則。

## Impact

- Affected specs：`course-module`、`course-media-playback`、`design-system`，以及本 change 新增的 `interactive-learning-blocks`、`timecode-sync-playback`。
- Affected code：
  - `packages/database/prisma/schema.prisma` 與新增 migration
  - `packages/api/modules/course/`、`packages/api/orpc/router.ts`
  - `packages/course/` 的 catalog、media adapter、MDX renderer、interactive components 與測試
  - `config/modules.ts`
  - `apps/saas/app/(authenticated)/(main)/(account)/course/`、`apps/saas/app/(authenticated)/(main)/(account)/admin/course/`、相關 course module UI
  - `apps/marketing/` 的公開電馭學院銷售頁與試看導流
- Existing boundary reused：`Order.courseAccess`、PAYUNi 結帳、operator 判定、shared design-system primitives、site-agent 的唯讀工具限制。

## Acceptance Evidence

1. 四個 Mount Point 都能以相同 `course` module id 被測試與程式碼追蹤；沒有第二份 module enable 或 route 註冊真相。
2. Bunny、YouTube、Vimeo、MP4、HLS 各有 parser／adapter 測試；未知、非 HTTPS 與 Cloudflare Stream URL 被拒絕且無法發布。
3. 學員完成 3 個共 8 個已發布單元時，頂部顯示 38% 與 3/8；重新載入、切換單元或重複完成請求後結果不漂移。
4. Studio 的角色拒絕、排序持久化、刪除確認、URL metadata、草稿預覽與發布同步都有 oRPC／browser 行為證據。
5. 公開頁只允許已發布的試看單元；付費學員可進完整教室；退款或未付款狀態仍不能取得完整媒體。
6. 全部新舊受影響 UI 的 SVG／accessibility 掃描、單元與整合測試、browser smoke、`spectra analyze` 與 `spectra validate --strict` 都通過後，才能將 implementation task 標記完成。
