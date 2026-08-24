## Context

woomin（`products/woomin/realms/`）有完整的媒體庫模組：`Media` model（`prisma/schema.prisma` 1631 行起）＋ `lib/actions/media.ts`（851 行，CRUD、引用檢查、Cloudflare Stream/Bunny 刪除同步）＋ `components/admin/media/media-picker.tsx`（選擇器 UI）＋ `app/(admin)/admin/media/`（管理頁）＋多個上傳 API route（Bunny TUS、Cloudflare R2、PDF）。

StartKiter 目前完全沒有媒體管理：`Lesson.videoUrl` 是老師手動貼的字串，後端用 `packages/api/modules/course/lib/video-resolver.ts` 的 `resolveVideoSource()` 猜 provider（支援 BUNNY/YOUTUBE/VIMEO/CUSTOM_MP4/HLS）；`Course` model 沒有封面圖欄位；圖片上傳只有 `UserAvatarUpload.tsx`／`OrganizationLogoForm.tsx` 兩處個人化欄位，走 `packages/storage` 的 `GetSignedUploadUrlHandler`。

StartKiter 沒有 Cloudflare Stream 或 Bunny API 金鑰整合（`packages/platform/src/deployment/credentials.ts` 沒有相關欄位），無法做檔案直傳；woomin 的直傳邏輯本次不搬，改用「貼網址登記進媒體庫」取代「貼網址直接存進 Lesson.videoUrl」。

## Goals / Non-Goals

**Goals:**
- 影片網址登記進 `Media` model 後可在媒體庫重複選用，取代單元編輯器裸的 URL 輸入框
- 圖片走 `packages/storage` 簽名 URL 上傳並登記進 `Media` model，供課程封面／單元縮圖選用
- Admin 能看到每份媒體被哪個 `sourceType`/`sourceId` 引用，未被引用的媒體才能刪除
- 新增 `Course.coverImageUrl`，透過媒體庫設定課程封面

**Non-Goals:**
- 不做 Bunny TUS／Cloudflare Stream Direct Creator Upload 檔案直傳（需要外部 API 金鑰，屬於 Fish 裁決事項，留待未來 change）
- 不做圖片壓縮／裁切／轉檔 pipeline
- 不做媒體版本歷史
- 不做 multi-tenant 共用媒體庫

## Decisions

### Decision 1：`Media` model 簡化 provider 欄位，不比照 woomin 保留 `cfStreamId`/`bunnyVideoId`/`cfStatus`/`bunnyStatus`

StartKiter 沒有 Cloudflare Stream／Bunny API 整合，不會有「upload 中」「processing」這種非同步狀態，`Media.provider` 直接沿用 `resolveVideoSource()` 回傳的 `"BUNNY" | "YOUTUBE" | "VIMEO" | "CUSTOM_MP4" | "HLS" | "IMAGE"` 字串，不需要獨立的 status 欄位。

**Alternatives Considered：**
1. 完整照抄 woomin 的 `cfStreamId`/`bunnyStatus` 欄位——否決，這些欄位服務的是「後端主動呼叫 Cloudflare/Bunny API 上傳」流程，StartKiter 沒有這個流程，欄位會永遠是 null，屬於死欄位
2. 影片與圖片分成兩個 model（`VideoMedia`/`ImageMedia`）——否決，`MediaPicker` UI 需要同時列出兩種類型讓老師選，單一 model 加 `type` 欄位篩選比維護兩張表加 UNION 查詢簡單

### Decision 2：影片「登記」流程沿用既有 `resolveVideoSource()`，不重新寫 provider 判斷邏輯

`register-media.ts` procedure 收到網址後呼叫既有 `resolveVideoSource(url)`；`ok: false` 直接回傳驗證錯誤，不寫入 `Media`。避免與 `video-resolver.ts` 出現兩套 provider 判斷邏輯不同步的風險。

**Alternatives Considered：**
1. 在 `register-media.ts` 重寫一份判斷邏輯——否決，會製造第二套 provider 規則來源，未來新增支援的影片平台要改兩處
2. 完全不驗證，讓老師貼什麼就存什麼——否決，`FluentPlayer.tsx` 依賴 `provider` 欄位決定要渲染 iframe 還是 video 標籤，未經驗證的資料會讓播放頁直接壞掉

### Decision 3：課程單元編輯器改走 `MediaPicker`，`Lesson.videoUrl` 欄位本身不變

`MediaPicker` 選定媒體後，把該媒體的 `url` 寫回 `Lesson.videoUrl`（`videoProvider` 寫回 `Media.provider`），資料庫層面完全相容既有資料，只是「填入這兩個欄位」的 UI 從裸輸入框換成選擇器 + 登記彈窗二合一。既有已發布課程的 `Lesson.videoUrl` 不需要 migration 轉換，也不會自動回填進 `Media` model（沒有 `sourceId` 對應，回填不了引用關係，屬於 Open Question 見下方）。

**Alternatives Considered：**
1. 新增 `Lesson.mediaId` 外鍵取代 `videoUrl`/`videoProvider` 兩個字串欄位——否決，改變既有欄位語意屬於 breaking schema change，會牽動 `video-resolver.ts`／`FluentPlayer.tsx`／所有讀取 `Lesson.videoUrl` 的既有 query，範圍超出本次 Non-Goals 界線
2. 保留欄位但要求前端一律透過 `mediaId` 查詢——否決，同上，且與 Decision 3 選定的低風險路徑衝突

## Implementation Contract

**Behavior：**
- 老師在單元編輯器點「選擇媒體」開啟 `MediaPicker`：可搜尋既有媒體、貼新影片網址登記、或上傳新圖片
- 貼新影片網址登記：呼叫 `resolveVideoSource()` 驗證失敗 → 顯示錯誤訊息，不建立 `Media` 記錄；驗證成功 → 建立 `Media{type: "VIDEO", provider, sourceId, url, sourceType: "LESSON_CONTENT", sourceId 對應 Lesson.id}`
- 上傳新圖片：`media-upload-url` procedure 回傳 `packages/storage` 簽名上傳網址（bucket: `media`）→ 前端 PUT 上傳 → 呼叫 `register-media` 建立 `Media{type: "IMAGE", url: path, sourceType, sourceId}`
- Admin 媒體庫頁（`/admin/media`）：列表可依 `type` 篩選、依 `sourceType`/`sourceId` 查看引用；`sourceId` 有值的媒體刪除按鈕停用並顯示「使用中，無法刪除」
- 課程封面設定：`Course.coverImageUrl` 透過 `MediaPicker`（限 `type: "IMAGE"`）設定，公開課程頁與 admin 課程列表讀取此欄位顯示縮圖，無值時顯示預設佔位圖

**Interface / data shape：**
```ts
// packages/database/prisma/schema.prisma 新增
enum MediaType {
  VIDEO
  IMAGE
}

enum MediaSourceType {
  MANUAL
  LESSON_CONTENT
  COURSE_COVER
}

model Media {
  id          String          @id @default(cuid())
  type        MediaType
  provider    String?         // "BUNNY" | "YOUTUBE" | "VIMEO" | "CUSTOM_MP4" | "HLS"，type=IMAGE 時為 null
  sourceId    String?         // resolveVideoSource() 回傳的影片 sourceId（provider 內部識別碼），type=IMAGE 時為 null
  url         String          // 影片：原始網址；圖片：packages/storage 回傳的 path
  filename    String?         // 圖片原始檔名，影片為 null
  mimeType    String?         // 圖片 MIME type，影片為 null
  size        Int?            // 圖片位元組數，影片為 null
  uploadedBy  String
  createdAt   DateTime        @default(now())

  usageType   MediaSourceType @default(MANUAL)
  usageId     String?         // 引用它的 Lesson.id 或 Course.id，null 代表未被引用

  user        User            @relation(fields: [uploadedBy], references: [id])

  @@index([type])
  @@index([usageType])
  @@index([usageId])
  @@map("media")
}

// Course model 新增欄位
// coverImageUrl String?
```

- `register-media` procedure：`{ type: "VIDEO", url: string } | { type: "IMAGE", path: string, filename: string, mimeType: string, size: number }` → `Media`
- `list-media` procedure：`{ type?: MediaType, search?: string, page?: number }` → `{ media: Media[], total: number }`
- `delete-media` procedure：`{ id: string }` → 若 `usageId` 非 null 拒絕並回傳 `{ error: "IN_USE" }`
- `media-upload-url` procedure：`{ filename: string, mimeType: string }` → `{ signedUploadUrl: string, path: string }`（比照 `UserAvatarUpload.tsx` 呼叫 `avatarUploadUrl` procedure 的既有模式，bucket 換成 `"media"`）

**Failure modes：**
- 影片網址驗證失敗（`resolveVideoSource().ok === false`）→ 400，回傳 `resolveVideoSource` 的 `error` 訊息，不寫入資料庫
- 刪除使用中媒體 → 400 `{ error: "IN_USE" }`，前端停用刪除按鈕但後端仍需驗證（防止繞過前端直接打 API）
- 圖片上傳簽名網址取得失敗（`packages/storage` provider 未設定）→ 沿用 `packages/storage` 既有 fail-closed 行為，不新增額外容錯

**Acceptance criteria：**
- `pnpm --filter @startkiter/api test register-media.test.ts` 綠燈：驗證合法影片網址登記成功、非法網址被拒絕、圖片登記成功
- `pnpm --filter @startkiter/api test delete-media.test.ts` 綠燈：驗證使用中媒體刪除被拒絕、未使用媒體刪除成功
- 手動驗證：單元編輯器透過 `MediaPicker` 選擇/登記影片後，播放頁（`FluentPlayer`）正常播放
- 手動驗證：課程封面透過 `MediaPicker` 上傳圖片後，公開課程頁顯示該封面圖

**Scope boundaries：**
- In scope：`Media` model、`register-media`/`list-media`/`delete-media`/`media-upload-url` procedure、`MediaPicker` 元件、admin 媒體庫頁、`Course.coverImageUrl` 欄位與封面設定 UI、單元編輯器改接 `MediaPicker`
- Out of scope：Bunny/Cloudflare 檔案直傳、圖片轉檔壓縮、媒體版本歷史、既有 `Lesson.videoUrl` 資料回填進 `Media`（見 Open Questions）

## Risks / Trade-offs

- [Risk] 既有已發布課程的 `Lesson.videoUrl` 不會自動出現在媒體庫，`MediaPicker` 一開始是空的，老師還是得重新登記一次舊影片 → Mitigation：apply 階段寫一次性 migration script，把現有 `Lesson.videoUrl` 非空的記錄批次建立對應 `Media{usageType: "LESSON_CONTENT", usageId: lesson.id}`，回填歷史資料（納入 tasks.md）
- [Risk] `delete-media` 只檢查 `usageId` 是否為 null，若同一份媒體被多個 Lesson 引用（目前設計是 1:1，`usageId` 只存一個），刪除判斷會有漏洞 → Mitigation：本次設計刻意限制「一份媒體只能被一個來源引用」（Decision 3 的低風險路徑延伸），若老師想在多個單元重複使用同一支影片，UI 上是「重新登記一次」而非共用同一筆 `Media`，避免 many-to-many 追蹤複雜度；已寫進 spec Requirement 明確此限制
- [Risk] `packages/storage/types.ts`／`config.ts` 同時被本 change 與 `course-assignment-plugin`／`lesson-private-message` 修改 → Mitigation：三張 change 序列 apply（先完成一張、`StorageBucketNamesConfig` 介面 merge 後再 apply 下一張），已寫進總 SR 計畫的執行順序

## Open Questions

- 既有 `Lesson.videoUrl` 資料回填 `Media` 記錄的 migration script，是否需要人工複核回填結果（例如網址格式跟目前 `resolveVideoSource()` 規則不相容的舊資料要怎麼處理）——留待 apply 階段實際跑一次回填 script 看資料量與失敗筆數再決定
