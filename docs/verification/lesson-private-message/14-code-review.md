# lesson-private-message Code Review

審查者：Codex（主工作樹最終 diff review）  
審查基準：commit `983ed908`，涵蓋本 change 全部 implementation diff；角度為 correctness、security、performance。

## Verdict

PASS。Critical 0、High 0、Medium 0、Low 0。未發現需在 archive 前修正的問題。

## Correctness

- `sendLessonMessage` 只有在 signed upload token、lesson/user 綁定、Content-Type、size 與實際物件都吻合時才建立含附件訊息。
- `PENDING -> FINALIZED` 使用 transaction 內的條件式 `updateMany`，token 重播不會建立第二筆訊息。
- operator 回覆以 `${lessonId}:${userId}` 作為 draft key，跨單元不會互相污染；`markLessonMessageRead` 只更新指定的未讀學員訊息。
- commit 後下載網址簽署失敗不會刪除已提交物件；未完成 intent 由 cleanup lifecycle 處理。

## Security

- production S3 upload 使用 signed URL、`If-None-Match: *`、bucket abstraction 與系統產生 storage key；原始檔名只作顯示欄位。
- token 驗證包含 HMAC timing-safe comparison、intentId、lessonId、userId、storageKey prefix、Content-Type、size 與 expiry；學員無法指定其他 thread。
- `CLEANING` claim、五分鐘 grace period 與 cascade fallback 避免 cleanup race 誤刪已 finalize 物件；production cleanup secret 缺失時 fail-closed。

## Performance

- operator 列表使用單次 `findMany`，透過 relation include 取 user/lesson，沒有逐筆 N+1 查詢。
- cleanup 使用 bounded batch、狀態索引與 retention 索引；刪除物件與資料庫 row 的流程可重試。
- 附件 body 不經 API server，production 由 signed URL 直傳 storage。

## Earlier findings and remediation

前幾輪 CR 曾發現並已修正：

1. production upload 缺 `If-None-Match: *` → 已補上。
2. upload 尚未成功就可能建立 message → 改為 staged upload intent，驗證物件後才 transaction finalize。
3. local fallback 曾要求先有 DB message → 已改為獨立 upload route，與訊息建立解耦。
4. operator draft 只以 userId key → 改為 lessonId + userId。
5. token replay 可重複 finalize → 改為一次性 intent 狀態轉換。
6. abandoned object 無限累積、cleanup race、finalized intent 永不退役 → 新增 `CLEANING` claim、五分鐘 grace、七日 retention、cascade fallback 與索引。
7. post-commit download signing failure 可能刪除已提交 object → 移除 transaction 後立即刪除，改由 retention cleanup 收尾。

最終 CR 的 focused tests、type-check 與 `git diff --check` 均通過。
