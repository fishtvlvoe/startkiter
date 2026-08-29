## Why

講師目前新增課程單元的講義（`Lesson.content`）只能自己手打，沒有任何輔助工具。參考舊系統 `realms-course-platform` 已驗證過的做法：把影片字幕（.srt）餵給 AI，自動重寫成一篇結構化、附時間軸連結的教學文章，講師確認後才存檔，大幅減少手動打字的時間。這是三張 AI 課程產生器相關 change 裡最小的一張，先把「單一課程單堂補生成」的邏輯做穩，之後批次匯入（另一張 change）才有穩固的地基可以疊加。

## Non-Goals (optional)

## Capabilities

### New Capabilities

- `course-ai-notes-single`: 講師針對「已存在」的課程單元，上傳字幕檔（.srt）並呼叫 AI（Gemini）生成結構化講義草稿，確認後手動存檔，涵蓋講師自帶 API Key 加密儲存、生成內容不自動覆蓋既有內容、rate limit 防護

## Modified Capabilities

（無：本次新增獨立能力，不變更既有課程管理或講師權限相關能力的需求行為）

## Impact

- Affected specs: New: `course-ai-notes-single`
- Affected code:
  - New:
    - `packages/platform/src/course-ai-notes/srt-parser.ts`（.srt 字幕解析為純文字）
    - `packages/platform/src/course-ai-notes/rate-limiter.ts`（單一講師每分鐘生成次數上限）
    - `packages/api/modules/course/lib/gemini-settings.ts`（比照 `apps/saas/lib/site-settings.ts` 的 payuni 設定慣例，儲存講師自帶 Gemini API Key，共用 `encryptSettingsJson`/`decryptSettingsJson`）
    - `apps/saas/app/api/course/ai-notes/generate/route.ts`（接收字幕內容，呼叫 Gemini，串流回傳生成內容）
    - `apps/saas/modules/shared/components/AiNotesDialog.tsx`（講師端：上傳字幕、預覽生成內容、確認後存檔的對話框）
  - Modified:
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/settings/page.tsx` 或既有設定選單（新增「Gemini API Key」設定入口，比照既有 einvoice／checkout-gateway 設定頁模式）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（單元編輯區塊新增「AI 生成講義」按鈕，開啟 `AiNotesDialog`）
  - Removed: 無
