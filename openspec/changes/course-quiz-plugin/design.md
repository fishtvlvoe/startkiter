## Context

`packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 靜態陣列目前只有 `start`／`course`／`chatbot`／`settings`／`admin`／`bundles` 等 Core 能力的 manifest entry，沒有任何一個真正意義上「買家自建 service-type Plugin」的範例。`PluginContent` 共用表（`platform-shell-plugin-architecture` change 已建好 schema）至今沒有任何代碼實際讀寫過——這次 Quiz 會是第一個真正落地使用這張表的 Plugin，沒有既有代碼可以參考正確用法，需要嚴格對照 `openspec/specs/platform-mount-points/spec.md`／`platform-core-boundary/spec.md` 的既有 Requirement 逐條核對。

woomin 的 `Quiz`／`QuizQuestion`／`QuizAttempt` 三個 model 是完整生產驗證過的計分邏輯來源（四種題型、及格判斷、洗牌），但資料儲存方式不能照抄：`Quiz`／`QuizQuestion`（測驗定義與題目，屬於「內容」）必須透過 `PluginContent` 表儲存；`QuizAttempt`（學員作答記錄，屬於高頻交易資料）符合 `platform-core-boundary` 既有 Requirement「Transaction-type data spec is documented but not scaffolded in v1」所描述的例外——可以自己開 migration-based 表，只是 v1 沒有 CLI 鷹架工具協助生成，這次手動寫 migration。

`platform-mount-points` 既有 Requirement「Content mount point supports three placement modes」明文：v1 只保證渲染 `mount.content.kind: "auto"`，`"block"`（嵌入既有課程正文）平台不保證顯示。這排除了「測驗直接嵌入 Lesson 正文中間」的做法，改為獨立路由。

## Goals / Non-Goals

**Goals:**

- Quiz 定義（設定＋題目）透過 `PluginContent{pluginId:"quiz", type:"quiz-definition"}` 儲存，不新開內容專屬表
- `QuizAttempt` 作為交易型資料開獨立表，記錄學員作答與計分結果
- 四種題型（單選/多選/是非/填空）的計分邏輯照抄 woomin 驗證過的判分規則
- Quiz 頁面用 `mount.content.kind: "auto"` 綁定獨立路由 `/quiz`，不依賴 v1 不保證的 block 嵌入模式

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: Quiz 定義存 PluginContent，QuizAttempt 開獨立交易型表

`PluginContent.body`（JSON）存 `{ lessonId, passingScore, timeLimitMinutes, shuffleQuestions, shuffleOptions, showAnswers, blockNextLesson, questions: [{ id, type, content, options, correctAnswer, explanation, points, order }] }`。查詢「這個 lessonId 對應哪個測驗」需要在應用層對 `body` JSON 欄位做全表掃描或用 Postgres JSON 索引（不能新增獨立索引欄位到 `PluginContent` 表本身，那算修改 Core 共用表結構），這次範圍內每門課的測驗數量不多（一堂課通常 0-1 份測驗），全表掃描的效能可接受，不引入額外索引機制。`QuizAttempt` 開獨立 model：`id`／`userId`／`pluginContentId`（對應 `PluginContent.id`，不用外鍵約束，因為 `PluginContent` 是跨 Plugin 共用表，不應該讓一個特定 Plugin 的表對它建立外鍵依賴）／`answers`（JSON）／`score`／`passed`／`timeTakenSeconds`／`startedAt`／`submittedAt`。

Alternatives Considered:
- 在 `PluginContent` 表新增一個 `lessonId` 索引欄位方便查詢 → 否決：`PluginContent` 是所有 Plugin 共用的表，新增一個只有 Quiz 用得到的欄位會讓其他 Plugin 的資料也背負這個欄位，且這已經是修改 Core 共用表結構，超出 Plugin 的權限範圍
- `QuizAttempt.pluginContentId` 建立外鍵約束到 `PluginContent.id` → 否決：`PluginContent` 是給所有 Plugin 共用的表，若每個 Plugin 都對它建外鍵，將來 `PluginContent` 表的任何遷移都要考慮所有 Plugin 的外鍵依賴，增加共用表的變更風險；用應用層驗證取代資料庫外鍵約束

### Decision: Quiz 頁面用 auto 模式綁定獨立路由，買家自己在課程內容裡貼連結

`MOUNT_POINTS` 新增 `{ id: "quiz", mount: { content: { kind: "auto", boundTo: "/quiz" }, route: { path: "/quiz-admin" } }, dataSpec: "content" }`。學員訪問 `/quiz/[pluginContentId]` 看到測驗頁；買家在自己的課程單元 MDX 內容裡手動貼一個連結（例如 `[前往測驗](/quiz/xxx)`），不修改 `course-module` capability 的既有渲染邏輯。

Alternatives Considered:
- 用 `mount.content.kind: "block"` 讓測驗直接嵌入課程正文 → 否決：`platform-mount-points` 既有 Requirement 明文 v1 平台不保證渲染 block 模式，這樣做的功能在當前版本可能完全不會顯示出來
- 修改 `course-module` capability，讓課程引擎原生知道「這堂課有沒有掛測驗」並自動在單元底部顯示連結 → 否決：這會修改 Core capability 的既有 Requirement，超出這次 Plugin 新增的範圍；且 Plugin 不應該反向要求 Core 為它客製渲染邏輯（`platform-core-boundary` 精神是 Plugin 服從 Core 提供的機制，不是 Core 為 Plugin 客製）

### Decision: 計分邏輯照抄 woomin 驗證過的判分規則

`packages/course-quiz/quiz-grading.ts` 照抄 woomin 四種題型的判分邏輯：單選比對字串相等、多選比對陣列內容相等（不計順序）、是非比對布林值、填空比對字串陣列（允許多個可接受答案）。`score` 為所有已答對題目的 `points` 加總除以總分乘以 100（取整數），`passed = score >= passingScore`。

Alternatives Considered:
- 自己重新設計判分邏輯 → 否決：woomin 的判分規則已經是生產驗證過的正確版本（尤其多選題「不計順序比對陣列」這種細節容易寫錯），沒有理由重新發明

## Implementation Contract

**Behavior:**
- Operator 在 `/quiz-admin` 建立測驗（選擇要綁定的 lessonId、設定及格分數/時間限制/洗牌/答案顯示策略、新增題目）
- 學員造訪 `/quiz/[pluginContentId]`（透過買家在課程內容裡貼的連結），作答並送出
- 送出後立即計分，依 `showAnswers` 設定決定是否立即顯示正確答案，記錄一筆 `QuizAttempt`
- 買家可透過 `hasPassedQuiz(userId, pluginContentId)` 查詢函式取得該學員是否已通過，自行決定要不要用來控制課程內容顯示

**Interface / data shape:**
- `PluginContent.body`（Quiz 定義）：見 Decision 1 的 JSON shape
- `QuizAttempt` model：見下方 DDL
- `hasPassedQuiz(userId: string, pluginContentId: string): Promise<boolean>`（`packages/course-quiz/index.ts` 匯出）

**DB DDL:**
```sql
CREATE TABLE "quiz_attempt" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "pluginContentId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "score" INTEGER NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "timeTakenSeconds" INTEGER,
  "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "submittedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "quiz_attempt_userId_pluginContentId_idx" ON "quiz_attempt"("userId", "pluginContentId");
```

**Failure modes:**
- 找不到對應的 `PluginContent` 測驗定義（`pluginContentId` 錯誤或已刪除）→ 404
- 未登入使用者訪問測驗頁 → 導向登入
- 超過 `timeLimitMinutes` 時限後送出 → 拒絕計分，回應提示已超時（若 `timeLimitMinutes` 為 null 則不限時）

**Acceptance criteria:**
- `pnpm --filter @startkiter/course-quiz test` 涵蓋四種題型的判分邏輯、`hasPassedQuiz` 查詢正確性
- `pnpm type-check`／`pnpm build` 全綠
- `spectra validate course-quiz-plugin` 0 warnings

**Scope boundaries:**
- In scope：`packages/course-quiz/`；`QuizAttempt` model；`/quiz`／`/quiz-admin` 頁面；`MOUNT_POINTS` 新增 entry
- Out of scope：`course-module`／`platform-mount-points`／`platform-core-boundary` 既有 Requirement 不修改；`InstantQuiz` 隨堂互動元件不修改；`blockNextLesson` 的自動解鎖邏輯不寫進 Core

## Risks / Trade-offs

- [Risk] `PluginContent.body` 全表掃描查詢 lessonId 對應的測驗，若未來測驗數量大幅增長會有效能問題 → Mitigation: MVP 範圍內每門課測驗數量少，可接受；若未來需要優化，屬於 Core 共用表的效能調整，留給未來評估
- [Risk] `QuizAttempt.pluginContentId` 沒有外鍵約束，若對應的 `PluginContent` 記錄被刪除，會留下懸空的作答記錄 → Mitigation: 應用層在刪除測驗前檢查是否已有作答記錄並提示操作員，這是可接受的權衡（跨 Plugin 共用表不建外鍵是既定架構原則）
- [Risk] 這是第一個真正使用 `PluginContent` 表的 Plugin，若既有 schema 設計有未預期的限制（例如 `body` JSON 查詢效能、`title` 欄位語意不清楚要放什麼），可能需要在實作過程中發現並調整 → Mitigation: apply 階段第一步先寫紅燈測試驗證基本讀寫可行，若發現 `PluginContent` 表設計本身有問題，暫停並回報，不要在其他 Plugin 型 change 裡也複製同樣的錯誤用法
