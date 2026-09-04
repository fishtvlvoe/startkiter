# Design: lesson-completion-without-blocks

## 現況程式碼位置

- `packages/api/modules/course/router.ts:168-212` — `toggleLessonProgress` procedure，`blockId` 目前必填且驗證
- `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx:97-108` — 前端 `toggleCompletion`，抓不到 blockId 就靜默 return
- `packages/course/src/mdx/extract-lesson-block-ids.ts:42` — `extractLessonBlockIds`，回傳單元內容裡所有 `blockId` JSX 屬性值
- `packages/database/prisma/schema.prisma` `model LessonProgress` — `userId_lessonId` 唯一鍵，本來就沒有 blockId 欄位

## 修改設計

### 後端 `toggleLessonProgress`

```
input: z.object({
  lessonId: z.string(),
  blockId: z.string().min(1).optional(),   // 改為選填
})
```

handler 邏輯調整：

```
const allowedBlockIds = extractLessonBlockIds(lesson.content ?? "");

if (allowedBlockIds.length > 0) {
  // 單元有積木：blockId 必填且必須驗證屬於該單元（現有行為，不變）
  if (!input.blockId || !allowedBlockIds.includes(input.blockId)) {
    throw new ORPCError("FORBIDDEN", { message: "這個積木不屬於目前單元，完成事件已被拒絕。" });
  }
}
// 單元沒有積木：不要求 blockId，直接視為合法完成請求
// （後續 LessonProgress upsert 邏輯不變）
```

### 前端 `toggleCompletion`

```
const toggleCompletion = () => {
  if (completedLessonIds.includes(currentLesson.id) || toggleProgress.isPending) {
    return;
  }

  const [blockId] = extractLessonBlockIds(currentLesson.content);

  toggleProgress.mutate({ lessonId: currentLesson.id, blockId: blockId || undefined });
};
```

不需要额外判斷分支，`blockId` 選填時傳 `undefined` 自然符合新的 schema。

## Risks（正推＋逆推）

| # | 風險 | 逆推假設失敗原因 | 對策 |
| --- | --- | --- | --- |
| R1 | 放寬 blockId 必填，會不會連「有積木的單元」也被繞過防偽造檢查 | 如果判斷順序寫錯（例如用 `\|\|` 短路掉驗證） | 判斷條件明確用 `allowedBlockIds.length > 0` 分流，兩條路徑各自獨立測試，不共用可能被繞過的判斷式 |
| R2 | 有積木的單元，學員刻意不傳 blockId 想繞過驗證直接完成 | 如果「沒有 blockId」被誤判成「沒有積木」 | 判斷依據是伺服器自己重新解析 `lesson.content` 算出的 `allowedBlockIds`，不是看 client 有沒有傳 blockId；`allowedBlockIds.length > 0` 時無論 client 傳不傳 blockId 都必須通過驗證，傳空值一樣被拒絕 |
| R3 | 前端 `blockId: blockId \|\| undefined` 傳給 zod optional schema，序列化後端點收到的到底是 `undefined` 還是空字串 `""` | oRPC/JSON 序列化可能把 `undefined` 轉成別的東西 | 紅燈測試直接測 handler 收到 `blockId: undefined` 時的行為，不用猜序列化細節 |
| R4 | 既有測試（`extract-lesson-block-ids.test.ts` 等）依賴 blockId 必填的假設，改完後既有測試變紅燈但沒人發現 | 只跑新測試沒跑全庫 | 收尾跑 `pnpm --filter api test`、`pnpm --filter saas test` 全綠才算過 |

## TDD 紅燈矩陣（Phase 2，先寫測試確認會失敗，再寫實作）

| 失敗點 | 紅燈測試名稱 | 預期錯誤訊息／行為 |
| --- | --- | --- |
| 無積木單元，不帶 blockId 送出，目前會被 zod 擋掉（必填） | `toggleLessonProgress: marks a lesson with no interactive blocks complete without a blockId` | 目前呼叫應該直接因為 schema 驗證失敗而拋錯（`blockId` 必填），改完後應該回傳 `{ completed: true }` 並確認 `db.lessonProgress.create` 被呼叫 |
| 有積木單元，不帶 blockId 送出，目前規則本來就會拒絕，改完後仍要拒絕（防止 R2） | `toggleLessonProgress: rejects a lesson with interactive blocks when no blockId is provided` | 拋 `ORPCError FORBIDDEN`，`db.lessonProgress.create` 未被呼叫 |
| 有積木單元，帶錯的 blockId（不屬於該單元），維持現有拒絕行為 | `toggleLessonProgress: still rejects a blockId that does not belong to the lesson`（既有測試，確認沒被改壞） | 拋 `ORPCError FORBIDDEN` |
| 前端元件：無積木單元的「標記為完成」按鈕點下去要真的送出請求 | `classroom-client toggleCompletion: calls the mutation without a blockId when the lesson has no interactive blocks` | mutation 被呼叫，參數 `{ lessonId, blockId: undefined }` |
| 前端元件：有積木單元行為不變（既有測試，確認沒被改壞） | 沿用既有測試（如果存在）或補一支 | mutation 被呼叫，參數帶正確 blockId |

以上先寫、先跑一次確認前 2 支真的紅燈（一支目前會被 schema 擋、一支目前行為就對但要鎖住不能被這次改動弄壞），再進 Phase 3 寫實作。
