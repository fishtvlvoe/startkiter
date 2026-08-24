## Context

跟 `course-assignment-plugin` 一樣複用 `packages/storage` 簽名 URL 抽象處理附件上傳（避免重蹈 woomin 本地儲存路徑漏洞的坑）。這次新增 `lessonMessages` bucket，跟 `course-assignment-plugin` 新增的 `assignments` bucket 都修改 `packages/storage/types.ts`／`config.ts` 這兩個檔案——若兩張 change 平行 apply 會產生合併衝突，需要序列處理（在總 SR 計畫裡標注）。

## Goals / Non-Goals

**Goals:**

- 學員與老師的一對一單元私訊，含附件
- 老師可標記已讀、operator 可看到所有未讀私訊列表

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: 私訊附件複用 packages/storage，storageKey 不用使用者檔名

跟 `course-assignment-plugin` 的 Decision 相同模式：`storageKey` 用系統產生 ID，原始檔名只存顯示用欄位。

Alternatives Considered:
- 私訊不支援附件，只做純文字 → 否決：woomin 原版支援附件（例如學員傳截圖問問題），拿掉這個功能會降低實用性，且附件上傳邏輯已經在 `course-assignment-plugin` 驗證過可行，複用成本低

### Decision: 附件採 staged upload intent，再以一次性 finalize 建立訊息

學員先呼叫 prepare procedure 建立短效 `PENDING` intent，再使用 signed URL（S3 使用 `If-None-Match: *`）上傳物件；API 只有在驗證 token、使用者／單元、Content-Type、size 與實際物件存在後，才在同一個 transaction 將 intent 原子轉為 `FINALIZED` 並建立 `LessonPrivateMessage`。因此附件驗證失敗或 token 重播不會建立訊息。

未完成的 intent 由 cleanup procedure 以五分鐘 grace period 和 `CLEANING` claim 狀態清除，避免 upload race；已完成 intent 保留七天後清理。production cleanup route 缺少 shared secret 時 fail-closed。transaction commit 後若下載網址簽署暫時失敗，不刪除已提交的物件，交由 finalized retention 清理，避免訊息已存在但附件被誤刪。

## Implementation Contract

**Behavior:**
- 學員在單元頁私訊面板發送訊息（可附檔），老師/operator 在後台看到並回覆
- 老師標記已讀後，`readByTeacher` 更新

**Interface / data shape:**
- `sendLessonMessage(lessonId, content, attachment?, isFromTeacher): Promise<LessonPrivateMessage>`

**DB DDL:**
```sql
CREATE TABLE "lesson_private_message" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "lessonId" TEXT NOT NULL REFERENCES "lesson"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "attachmentStorageKey" TEXT,
  "attachmentName" TEXT,
  "attachmentMimeType" TEXT,
  "attachmentSize" INTEGER,
  "isFromTeacher" BOOLEAN NOT NULL DEFAULT false,
  "readByTeacher" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "lesson_private_message_lessonId_userId_createdAt_idx" ON "lesson_private_message"("lessonId", "userId", "createdAt");
CREATE INDEX "lesson_private_message_readByTeacher_createdAt_idx" ON "lesson_private_message"("readByTeacher", "createdAt");
```

**Failure modes:**
- 未登入使用者發送私訊 → 401
- 附件超過大小限制 → 拒絕

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test send-lesson-message.test.ts` 涵蓋發送/回覆/標記已讀邏輯
- `pnpm type-check`／`pnpm build` 全綠

**Scope boundaries:**
- In scope：`LessonPrivateMessage` model；私訊 procedure；`packages/storage` 新增 bucket；學員/operator 頁面
- Out of scope：群組對話；即時推播通知；訊息撤回編輯

## Risks / Trade-offs

- [Risk] 跟 `course-assignment-plugin` 都修改 `packages/storage/types.ts`／`config.ts`，平行 apply 會衝突 → Mitigation: 在總 SR 計畫裡標注這兩張 change 序列處理，不平行派給不同 Codex 實例
