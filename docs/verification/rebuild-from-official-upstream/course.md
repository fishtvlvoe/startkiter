# Course Scenario 驗證

驗證日期：2026-08-18

## Scenario 結果

| Spec | Scenario | 結果 | 證據 |
| --- | --- | --- | --- |
| course-module | Paid learner watches a lesson in-site | PASS | `packages/course/catalog.test.ts` 驗證 finite lesson catalog；本機建立 paid `Order.courseAccess=true` 後 ego-browser 開啟 `/course/lesson-01`，頁面在站內渲染 `<video>` 播放器，未跳轉課程平台 |
| course-module | Unpaid visitor cannot play lessons | PASS | 未付費登入帳號 GET `/api/course/lessons` 回 403 `course_access_denied`；POST lesson-01 回 403 且 body 不含 mediaUrl |
| course-module | Empty lesson id | PASS | POST `/api/course/lessons` body `{"lessonId":"   "}` 回 400 `lesson_id_required` |
| course-module | Paid learner with courseAccess can open a lesson | PASS | paid Order fixture + lesson page `/course/lesson-01` 回傳站內 video player |
| course-module | Unpaid or refunded learner is denied | PASS | `access.test.ts` 付款後/退款後權限 true/false；未付費 route 回 403 且不回傳媒體 URL |
| course-module | Unauthenticated playback is rejected | PASS | route 先以 Better Auth session gate；無 session 回 401 `authentication_required` |
| course-media-playback | Entitled learner gets Bunny embed | PASS | `catalog.test.ts` 以 `BUNNY_LIBRARY_ID=416184` 驗證 `iframe.mediadelivery.net/embed/...` |
| course-media-playback | Missing Bunny config falls back safely | PASS | `catalog.test.ts` 無 library 時回 flower.mp4 placeholder；本機 lesson page 顯示 video 與「暫時示範影片」提示 |
| course-media-playback | Locked lesson omits media URL | PASS | 未付費 lesson page 只顯示鎖定訊息；API 403 body 不含 mediaUrl |

## 指令結果

```text
pnpm --filter @startkiter/course exec vitest run \
  packages/course/access.test.ts packages/course/catalog.test.ts \
  packages/course/line-invite.test.ts packages/course/playback.test.ts

Test Files  4 passed (4)
Tests       19 passed (19)
```
