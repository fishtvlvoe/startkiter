## Why

老師目前只能在課程單元裡手動貼一段影片網址（`videoUrl`），系統靠 `resolveVideoSource` 猜 provider；圖片（課程封面、單元縮圖）完全沒有上傳機制。沒有媒體庫代表每次要重複使用同一支影片或圖片，老師得自己去外部平台複製網址，也無法知道一份媒體被哪些單元引用、能不能安全刪除。

## What Changes

- 新增 `Media` model：登記課程使用中的影片（貼網址登記，沿用既有 `resolveVideoSource` 解析 provider/sourceId，不做檔案直傳）與圖片（走 `packages/storage` 簽名 URL 上傳，登記進媒體庫）
- 新增媒體庫 admin 管理頁：列表／搜尋／依 type 篩選／查看引用來源（`sourceType`/`sourceId`）／刪除未被引用的媒體
- 新增媒體選擇器元件（`MediaPicker`），掛在課程單元編輯器（影片來源改成「從媒體庫選擇」或「登記新網址」二選一）與課程封面設定（新增 `Course.coverImageUrl` 欄位，透過 `MediaPicker` 上傳圖片）
- `packages/storage` 的 `StorageBucketNamesConfig` 新增 `media` bucket，供圖片上傳使用
- **BREAKING**：`Lesson.videoUrl` 欄位語意不變，但課程單元編輯器 UI 改為透過 `MediaPicker` 寫入，不再是裸的 URL 輸入框（既有資料相容，不需要 migration 轉換資料）

## Non-Goals

- 不做影片檔案直傳（Bunny TUS Upload API、Cloudflare Stream Direct Creator Upload）：這需要 Bunny/Cloudflare 帳號與 API 金鑰，屬於需要 Fish 裁決的外部帳號事項，留待未來另開 change。本次影片仍是「貼網址登記」模式，只是登記進媒體庫以便重複使用與追蹤引用
- 不做圖片自動壓縮/裁切轉檔（沿用 `packages/storage` 原始檔案上傳，不加影像處理 pipeline）
- 不做媒體版本歷史（同一媒體被覆蓋時不保留舊版本記錄）
- 不做跨組織/跨站共用媒體庫（媒體庫是單一 StartKiter 站台範圍，不涉及 multi-tenant）

## Capabilities

### New Capabilities

- `course-media-library`：課程影片/圖片媒體庫，登記、搜尋、追蹤引用、刪除

## Impact

- Affected specs: `course-media-library`（新增）
- Affected code:
  - New:
    - `packages/api/modules/course/procedures/register-media.ts`（影片網址登記、圖片上傳完成後登記）
    - `packages/api/modules/course/procedures/register-media.test.ts`
    - `packages/api/modules/course/procedures/list-media.ts`
    - `packages/api/modules/course/procedures/delete-media.ts`
    - `packages/api/modules/course/procedures/delete-media.test.ts`
    - `packages/api/modules/course/procedures/media-upload-url.ts`（回傳 `packages/storage` 簽名上傳網址，bucket 用 `media`）
    - `apps/saas/modules/course/components/MediaPicker.tsx`
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx`
    - `packages/database/prisma/migrations/`（新增 `Media` model、`Course.coverImageUrl` 欄位 migration）
  - Modified:
    - `packages/database/prisma/schema.prisma`（新增 `Media` model、`Course.coverImageUrl` 欄位）
    - `packages/api/modules/course/router.ts`（掛上述 procedure）
    - `packages/storage/types.ts`（`StorageBucketNamesConfig` 新增 `media` 欄位）
    - `packages/storage/config.ts`（`bucketNames.media` 用 `NEXT_PUBLIC_MEDIA_BUCKET_NAME` env fallback，比照 `avatars` 慣例）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（課程單元編輯器現有的影片來源輸入元件，掛上 `MediaPicker`）
    - `packages/platform/src/mount-points.ts`（`MOUNT_POINTS` 新增一筆 entry：`id: "media-library"`、`route.path: "/admin/media"`、`menu: { requiresOperator: true }`）
  - Removed: 無
- Dependencies 新增：無（沿用既有 `react-dropzone`、`packages/storage`）
- 環境變數新增：`NEXT_PUBLIC_MEDIA_BUCKET_NAME`（有預設值 fallback，非必填）
- 與其他規劃中 change 的檔案衝突：`packages/storage/types.ts`／`packages/storage/config.ts` 同時被 `course-assignment-plugin`（新增 `assignments` bucket）與 `lesson-private-message`（新增 `lessonMessages` bucket）修改，三張 change 若平行 apply 需序列處理或最後手動合併 `StorageBucketNamesConfig` 介面
