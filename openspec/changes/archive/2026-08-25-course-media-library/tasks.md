## 1. 紅燈測試（TDD）

- [x] 1.1 為 `register-media.ts` 寫紅燈測試，涵蓋 Requirement「A learner-facing video source is registered into the media library before use」與「Image media is uploaded via signed storage URLs and registered on completion」：合法 Bunny/YouTube/Vimeo 網址登記成功、不合法網址被拒絕且不建立記錄、圖片登記成功。驗證目標：`pnpm --filter @startkiter/api test register-media.test.ts` FAIL
- [x] 1.2 為 `delete-media.ts` 寫紅燈測試，涵蓋 Requirement「Media in use by a lesson or course cannot be deleted」：`usageId` 非 null 時刪除被拒絕並回傳 `{ error: "IN_USE" }`、`usageId` 為 null 時刪除成功。驗證目標：`pnpm --filter @startkiter/api test delete-media.test.ts` FAIL

## 2. Database schema 與 procedure

- [x] 2.1 在 `packages/database/prisma/schema.prisma` 新增 `Media` model（依 Decision 1：`Media` model 簡化 provider 欄位，不比照 woomin 保留 `cfStreamId`/`bunnyVideoId`/`cfStatus`/`bunnyStatus`；含 `MediaType`／`MediaSourceType` enum，DDL 見 design.md）與 `Course.coverImageUrl` 欄位，產生 migration。驗證目標：task 1.1／1.2 全數轉綠燈
- [x] 2.2 實作 `register-media`、`list-media`、`delete-media`、`media-upload-url` 四個 procedure，掛進 `packages/api/modules/course/router.ts`；`register-media` 依 Decision 2：影片「登記」流程沿用既有 `resolveVideoSource()`，不重新寫 provider 判斷邏輯；`media-upload-url` 比照 `avatarUploadUrl` procedure 呼叫 `packages/storage` 的 `GetSignedUploadUrlHandler`，bucket 傳入 `"media"`。驗證目標：`pnpm --filter @startkiter/api test` 全綠
- [x] 2.3 在 `packages/storage/types.ts` 的 `StorageBucketNamesConfig` 新增 `media: string` 欄位，`packages/storage/config.ts` 補上 `bucketNames.media`（`NEXT_PUBLIC_MEDIA_BUCKET_NAME` env fallback，比照 `avatars` 慣例）。驗證目標：`pnpm type-check` 通過
- [x] 2.4 寫一次性 migration script（`packages/database/scripts/backfill-lesson-media.ts`），把現有 `Lesson.videoUrl` 非空的記錄批次呼叫 `resolveVideoSource()` 並建立對應 `Media{usageType: "LESSON_CONTENT", usageId: lesson.id}`；無法解析的舊資料記錄到 script 輸出但不中斷整體流程（依 design.md Risk 段落）。驗證目標：在測試資料庫跑一次，印出「成功回填 N 筆／無法解析 M 筆」統計，人工核對 M 筆清單

## 3. 頁面與元件

- [x] 3.1 新增 `apps/saas/modules/course/components/MediaPicker.tsx`：搜尋既有媒體、貼新影片網址登記、上傳新圖片三種操作二合一的選擇器元件（比照 `UserAvatarUpload.tsx` 的簽名 URL 上傳流程）
- [x] 3.2 課程單元編輯器實際位於 `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（連同 `apps/saas/app/api/course/studio/route.ts`、`packages/api/modules/course/lib/update-lesson.ts` 為既有影片來源寫入路徑，執行 `grep -rn "videoUrl" apps` 二次確認範圍），依 Decision 3：課程單元編輯器改走 `MediaPicker`，`Lesson.videoUrl` 欄位本身不變，把裡面裸的影片網址輸入框改接 `MediaPicker`，選定媒體後把 `url`/`provider` 寫回 `Lesson.videoUrl`/`Lesson.videoProvider`
- [x] 3.3 實作 Requirement「A course cover image is set through the media library」：新增課程封面設定 UI（限 `type: "IMAGE"` 的 `MediaPicker`），更新 `Course.coverImageUrl`；公開課程頁與 admin 課程列表讀取此欄位顯示縮圖，無值時顯示預設佔位圖
- [x] 3.4 新增 `apps/saas/app/(authenticated)/(main)/(account)/admin/media/page.tsx`（媒體庫管理頁：列表、依 type 篩選、查看 `usageType`/`usageId` 引用、刪除未使用媒體）；在 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 新增一筆 entry（`id: "media-library"`、`route.path: "/admin/media"`、`menu: { label: "媒體庫", icon: 依現有 icon 集挑選, order: 依現有最大 order 遞增, requiresOperator: true }`）。驗證目標：手動驗證 operator 登入後側邊選單看得到「媒體庫」入口，使用中媒體的刪除按鈕呈現停用狀態

## 4. Review 與驗證

- [x] 4.1 派 Codex 或等效工具對本次全部 diff（task 1-3）做 Code Review（correctness／security／performance 三角度）：correctness 確認 `usageId` 非 null 時刪除確實被拒絕、`resolveVideoSource()` 驗證失敗時不建立記錄；security 確認 `media-upload-url` 簽名網址的 bucket 限定為 `media`，不可被前端竄改指向其他 bucket；performance 確認媒體庫列表查詢有分頁、沒有一次撈全部記錄。驗證方式：CR 報告 Critical 數量為 0（PM 覆核）
- [x] 4.2 用 ego-browser skill 跑一次完整 e2e：講師帳號登入 → 進入課程單元編輯器 → 用 `MediaPicker` 登記一支 Bunny 影片網址 → 儲存單元 → 前台播放頁（`FluentPlayer`）確認正常播放 → 回到課程設定頁用 `MediaPicker` 上傳一張圖片設為封面 → 公開課程頁確認封面圖顯示 → operator 登入進入 `/admin/media` 確認兩筆媒體都出現且顯示正確的引用來源 → 嘗試刪除使用中的影片媒體確認按鈕停用。驗證目標：截圖記錄關鍵畫面，任何一步失敗即視為本 task 未完成
- [x] 4.3 跑 `spectra analyze course-media-library --json` 與 `spectra validate course-media-library`，確認 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅有 Suggestion。驗證目標：無 Critical／Warning，且 0 warnings／0 errors
- [x] 4.4 逐項核對 design.md Implementation Contract 的 Acceptance criteria 是否全部滿足：跑 `pnpm --filter @startkiter/api test`／`pnpm type-check`／`pnpm build`，確認全數綠燈。驗證目標：所有指令 exit code 為 0
