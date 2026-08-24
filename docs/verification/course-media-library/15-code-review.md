# course-media-library Code Review

日期：2026-08-25
審查者：Codex 等效 CR（主控 session；CC 用量不可用）
範圍：本 change 的 task 1–3 全部 diff、migration、API procedures、UI、storage、image proxy、測試與 migration script。

## 結論

PASS。Critical：0；High：0；Medium：0；Low：0。

## Correctness

- `register-media.ts` 先呼叫既有 `resolveVideoSource()`；解析失敗直接回傳 `BAD_REQUEST`，不進入 `db.media.create`。
- `delete-media.ts` 後端再次檢查 `usageId`；非 null 回傳 `IN_USE`，未使用媒體才刪除。前端 disabled 狀態不是唯一防線。
- `set-course-cover-media.ts` 在 transaction 內清除舊封面引用、設定新圖片引用並更新 `Course.coverImageUrl`。
- `MediaPicker` 的影片登記、圖片 signed PUT、媒體登記與單元保存均有實際 E2E 證據；播放頁實際渲染 Bunny iframe。

## Security

- `media-upload-url.ts` 的 bucket 固定為字面值 `"media"`，前端沒有 bucket 輸入欄位；路徑由 `mediaPathForUpload(context.user.id, filename)` 產生，並使用 UUID。
- 圖片登記限制 `media/{currentUserId}/` 路徑，拒絕 `..` 與反斜線；mime type 與大小有 schema 限制。
- `/image-proxy` 僅允許既有 `avatars` 與本 change 的 `media` bucket，未開放任意 bucket。
- operator 權限由 `courseOperatorProcedure` 強制套用在五個媒體 procedure；UI 禁止刪除不取代後端授權檢查。

## Performance

- `list-media.ts` 固定 `take = 50`、依 `createdAt` 排序並以 `skip` 分頁，另行 count；沒有無界 `findMany`。
- 搜尋欄位與篩選條件在查詢前組合，媒體 picker 與 admin page 都只取當頁資料。
- 圖片上傳採 signed URL 直傳，二進位內容不經 Next.js server route。

## Findings

無 Critical、High、Medium、Low findings。未發現需要修正的 correctness、security 或 performance 問題。
