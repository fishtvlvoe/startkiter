# Proposal: lesson-completion-without-blocks

## Why

2026-09-04 群眾模擬壓力測試（agy + ego-browser 打正式站）發現：純文字或純影片的課程單元，學員點「標記為完成」完全沒反應，進度永遠卡在 0%。PM 已親自讀程式碼確認為真，不是誤判。

根因不只在前端，後端 `toggleLessonProgress`（`packages/api/modules/course/router.ts:168`）本身就設計成必須帶一個「積木 ID」（`blockId`，`z.string().min(1)` 必填），伺服器再驗證這個 blockId 是否真的屬於該單元的內容（`extractLessonBlockIds`，防止偽造完成事件）。

問題是：`LessonProgress` 資料表本身是**單元層級**（`userId_lessonId` 唯一鍵），blockId 從頭到尾沒有被存進資料庫，純粹是「證明你有跟這個單元的某個積木互動過」的驗證用途。只要單元裡沒有任何積木（`packages/course/src/components/interactive/`那些互動元件），`extractLessonBlockIds` 回傳空陣列，前端拿不到 blockId 可送、後端規則上也沒有「無積木單元」的例外路徑——完成機制對這類單元從設計上就是不通的，不是漏寫一行判斷式。

前端 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx:97-108` 目前的處理是：抓不到 blockId 就靜默 `return`，按鈕沒有任何提示、沒有 toast、沒有錯誤訊息，學員完全不知道發生了什麼事。

## What Changes

- `toggleLessonProgress`（後端）：`blockId` 改成選填。單元真的沒有任何積木時（`extractLessonBlockIds` 回傳空陣列），允許直接標記完成，不要求 blockId；單元有積木時，維持現有規則——blockId 必填且必須驗證屬於該單元（防偽造完成事件的機制不變、不放寬）
- `classroom-client.tsx`（前端）：`toggleCompletion` 改為：有積木用積木 ID 送出（行為不變）；沒有積木時直接送出完成請求（不帶 blockId）
- 不新增資料庫欄位（`LessonProgress` 本來就是單元層級，不需要記錄用了哪個積木）

## Non-Goals

- 不改動「有積木的單元」既有的防偽造驗證邏輯（`allowedBlockIds.includes(input.blockId)` 這條檢查原樣保留）
- 不做「觀看影片達 X% 自動完成」這類額外的完成判定機制（`recordWatchTime` 目前刻意跟完成狀態分離，這次不動這個設計決策，只是補上「沒有積木時能不能手動標記完成」這個缺口）
- 不動 `LessonProgress` schema、不動課程進度計算公式（`round(100 * completed/total)`）

## 群眾測試同時發現的其他問題（不在本次修復範圍，另外排序）

- 🟡 `/app` 首頁載入 16 秒偏慢
- 🟡 缺日文語系（`/ja` 404）、缺獨立「關於」頁面（`/about` 404）
- 🟡 中文法律頁（隱私權/條款）內文仍是英文
- 🟢 部分頁面殘留 supastarter 範本標題與頁尾連結
- 🟢 註冊按鈕缺 `type="submit"`

這些留在 `site-remediation-tracker.md` 排隊，Fish 之後再決定優先順序。
