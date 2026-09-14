# 3.1 快取機制慣例筆記

## 現況盤點（有程式碼位置佐證）

1. React `cache()`（per-request 去重，不是跨 request TTL）
   - `apps/saas/modules/auth/lib/server.ts`：`export const getSession = cache(async () => { ... })`
   - `apps/saas/modules/payments/lib/server.ts`：`export const listPurchases = cache(async ...)`
   - `apps/saas/modules/shared/lib/server.ts`：`export const getServerQueryClient = cache(createQueryClient)`
   - 這類快取只在單次 React render / request 內合併重複呼叫，無法降低 50 人併發各自打 DB 的負載。

2. `revalidatePath`（路徑失效，不是資料查詢 TTL）
   - `apps/saas/modules/shared/lib/cache.ts`：`clearCache` 包 `revalidatePath`
   - 後台設定頁（gemini / einvoice / checkout-gateway）編輯後呼叫 `revalidatePath`
   - 沒有針對「已發布課程章節／單元內容」的 tag 或查詢層快取。

3. 專案內沒有 `unstable_cache`、Redis、或課程內容用的 TTL Map 先例。

4. 課程內容修改觸發點
   - `packages/api/modules/course/lib/update-lesson.ts` 的 `updateLesson` 直接 `db.lesson.update`，目前沒有任何快取失效呼叫。
   - DB schema 沒有獨立的 LessonTranslation／CourseTranslation table；「翻譯」在 buyer `/course` 頁主要走 next-intl + `localizeLesson`（靜態文案），SSR fan-out 熱路徑是 PostgreSQL 的已發布 chapter／lesson 內容。

## 決策

沿用「應用層、不引入外部服務」邊界（design Decision），新增 `packages/api/modules/course/lib/published-content-cache.ts`：

- 機制：process 內 in-memory Map + 明確 TTL（無先例 → 採 design 預設 5 分鐘 = 300 秒）
- 範圍：已發布課綱（chapter + lessons）與已發布單元詳情（getLessonDetail 的 lesson 查詢）
- 失效：TTL 到期自動失效；`updateLesson` 成功寫入後主動 `invalidatePublishedContentCache()`，避免管理員改完還卡舊內容到 TTL 結束

不採用 Next.js `unstable_cache`：快取入口同時被 `packages/api` 的 oRPC handler 使用，不宜把 `@startkiter/api` 綁死在 `next/cache`。
