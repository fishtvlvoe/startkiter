## Context

講師目前新增課程單元的講義只能手打，沒有輔助工具。參考舊系統 `realms-course-platform-v1.8.0` 的 `app/api/admin/ai-course/generate-content/route.ts`：把 SRT 字幕轉純文字後餵給 Gemini，System Prompt 強制要求輸出以多個 H1 分段、每段結尾標時間軸 `[MM:SS](#t=秒數)` 方便對照影片時間點，回應用串流方式即時顯示生成進度。

技術可行性已查證：StartKiter 目前串接的影片系統是 Bunny（`packages/api/modules/course/lib/video-resolver.ts` 只做 URL 辨識與 embed 網址組裝，沒有「取得可公開存取的影片直鏈」API），不像 Cloudflare Stream 有現成的直鏈可以丟給 Gemini 多模態直接分析影片本身。因此本次 v1 **只支援「上傳字幕檔生成」，不支援「無字幕、AI 直接看影片生成」**這個舊系統裡有的模式，待未來 Bunny 直鏈取得機制確定後再開新 change 補上。

StartKiter 現有可直接沿用的基礎設施：
- `apps/saas/lib/site-settings.ts` 的 payuni 設定模式（`encryptSettingsJson`／`decryptSettingsJson` + `SiteSetting.ciphertext` + `SETTINGS_ENCRYPTION_KEY`）直接比照用於儲存講師的 Gemini API Key
- `packages/api/modules/course/lib/course-instructor-access.ts` 的 `canManageCourse` 判斷講師是否能對這個課程單元生成/存檔講義

## Goals / Non-Goals

**Goals:**

- 講師能對「已存在」的課程單元上傳一份 .srt 字幕檔，呼叫 AI 生成一篇結構化講義草稿（H1 分段 + 時間軸連結）
- 生成過程用串流方式即時顯示，講師可以看著逐字出現
- 生成完的內容是「草稿」，講師確認、可編輯後才手動按存檔，不會自動覆蓋 `Lesson.content` 既有內容
- 講師自己的 Gemini API Key 加密儲存，AI 費用由講師自己的 Key 出
- 同一講師呼叫生成 API 有速率限制，避免失誤重試或惡意呼叫打爆自己的 API 配額

**Non-Goals:**

- 不支援「無字幕、AI 直接分析影片本身」生成講義（Bunny 目前無等同 Cloudflare Stream 的公開直鏈 API，技術上做不到，留待未來 change）
- 不做批次匯入／多課程同時生成（見另一張 `course-ai-batch-import` change）
- 不做除了 Gemini 以外的其他 AI 供應商選擇
- 不修改既有 `Lesson.aiPrompt`／`aiContext` 欄位或其邏輯（那是課堂 AI 助教情境既有欄位，跟本次講義生成是不同用途，不共用）
- 不做生成內容的版本歷史／多版本比較，講師確認存檔即覆蓋 `Lesson.content`，沒有自動保留舊版本機制（若需要復原，仰賴既有的一般編輯救援方式，不在本次新增）

## Decisions

### Decision: v1 只支援字幕上傳生成，不支援無字幕直接分析影片

理由已在 Context 說明：Bunny 沒有等同 Cloudflare Stream 的公開直鏈取得 API，技術上無法讓 Gemini 多模態直接讀取影片本身。

Alternatives Considered:
- 自行研究並串接 Bunny 的直鏈取得方式，一併在本次做出「無字幕生成」模式 → 否決：這牽涉到影片系統另一層的能力擴充（取得公開直鏈涉及 Bunny Pull Zone/Token Authentication 設定），範圍會膨脹超出「單堂課補講義」這個核心目標，應該獨立評估
- 直接不管字幕來源，永遠要求講師手動貼一段文字說明影片內容 → 否決：這樣就不是「自動生成」了，失去這個功能的核心價值（省去手動打字/整理逐字稿的時間）

### Decision: Gemini API Key 比照既有 payuni 設定模式儲存，不新建加密機制

新增 `GEMINI_SETTING_ID = "gemini-notes"` 常數，複用 `apps/saas/lib/site-settings.ts` 同一套 `encryptSettingsJson`／`decryptSettingsJson` 與 `SiteSetting` 表格模式。

Alternatives Considered:
- 把 API Key 存進環境變數 → 否決：環境變數是部署時固定值，講師沒辦法自己在後台更換 Key，且多個講師情境下（`course-instructor-scoped-access` 已允許多講師）環境變數無法區分不同講師各自的 Key
- 自建一套新的加密欄位／演算法 → 否決：專案已有一套通過既有測試與正式環境驗證的加密模式，重新發明只增加維護成本

### Decision: 生成內容是草稿，講師手動確認才寫入 Lesson.content，不自動覆蓋

`AiNotesDialog` 生成完成後停留在預覽/編輯狀態，講師按下「存檔」按鈕才呼叫既有的課程更新 API 把內容寫入 `Lesson.content`；不生成完就自動存檔。

Alternatives Considered:
- 生成完自動存檔，講師之後再去編輯 → 否決：若該單元已有講師手打的內容，自動存檔等於無預警覆蓋掉既有心血，違反「防止資料遺失的錯誤處理不能省」的底線
- 生成內容存到另一個暫存欄位，跟 `Lesson.content` 分開，讓講師之後再决定要不要合併 → 否決：增加一個暫存欄位與對應清理邏輯的複雜度，超出本次範圍；對話框內的草稿狀態（前端 state，未送出前不落地）已經足夠達成「不自動覆蓋」的目標

### Decision: 速率限制用記憶體內計數器，每講師每分鐘上限，不落地資料庫

比照舊系統「10 req/min/講師」的量級，用一個 `Map<instructorId, timestamp[]>` 的記憶體內滑動視窗計數器實作，不需要額外的資料庫表格或 Redis。

Alternatives Considered:
- 用資料庫表格記錄呼叫次數 → 否決：StartKiter 是常駐 Node 服務（非 serverless，單一部署程序），記憶體內計數器在這個部署模式下就足夠準確，落地資料庫只會增加不必要的寫入負擔
- 不做速率限制 → 否決：Non-Goals 沒有排除這項，且這是明確識別過的風險（防止打爆講師自己的 Gemini 配額），屬於安全底線不能省

## Implementation Contract

**行為（Behavior）**：
- 講師在課程管理後台的單元編輯區塊按「AI 生成講義」，開啟對話框，上傳一份 `.srt` 字幕檔
- 若該講師尚未設定 Gemini API Key，對話框顯示「請先設定 API Key」並連結到設定頁面，不嘗試呼叫 AI
- 上傳後點擊「生成」，畫面即時串流顯示生成中的內容（邊生成邊顯示，不是等全部完成才一次顯示）
- 生成完成後，講師可以在對話框內編輯生成的內容與建議標題，按「存檔」才真正寫入這個單元的 `content` 欄位；按「取消」則生成內容不會被保留
- 同一講師在 60 秒內呼叫生成超過 10 次，第 11 次起被拒絕，顯示「呼叫太頻繁，請稍後再試」

**介面 / 資料形狀**：
- API：`POST /api/course/ai-notes/generate`，body: `{ lessonId: string, chapterTitle: string, lessonTitle: string, srtContent: string }`，回應為純文字串流（比照舊系統 `generate-content/route.ts` 的 streamText 模式）
- `packages/platform/src/course-ai-notes/srt-parser.ts` 匯出：`srtToText(raw: string): string`
- `packages/platform/src/course-ai-notes/rate-limiter.ts` 匯出：`checkRateLimit(instructorId: string, limit?: number, windowMs?: number): { allowed: boolean; retryAfterMs?: number }`
- `packages/api/modules/course/lib/gemini-settings.ts` 匯出：`readGeminiApiKey(): Promise<string | null>`、`writeGeminiApiKey(key: string): Promise<{ ok: boolean; error?: string }>`

**失敗模式（Failure modes）**：
- 講師未設定 Gemini API Key 就呼叫生成 API → 400，`GEMINI_KEY_MISSING`
- 非該課程講師呼叫生成 API → 403，不消費 rate limit 額度
- 超過速率限制 → 429，`retryAfterMs` 告知多久後可再試
- Gemini API 呼叫失敗（額度用盡、網路錯誤等）→ 串流中斷，前端顯示明確錯誤訊息「生成失敗：[原因]」，不靜默失敗

**驗收標準（Acceptance criteria）**：
- 單元測試：`srtToText` 正確去除 SRT 的序號/時間軸標記行，只留字幕文字內容
- 單元測試：`checkRateLimit` 在視窗內超過上限回傳 `allowed: false`，視窗過期後重置
- 整合測試：未設定 Key 時呼叫生成 API 回傳 400 `GEMINI_KEY_MISSING`；非講師呼叫回傳 403 且不影響 rate limit 計數
- 整合測試：講師確認存檔後，`Lesson.content` 更新為講師編輯後的最終內容（不是 AI 原始生成內容，若講師有修改）；按取消則 `Lesson.content` 不變
- 端對端：上傳一份測試字幕檔、看到串流生成、編輯內容、存檔後重新整理頁面確認內容真的存進去了

**範圍邊界（Scope boundaries）**：
- 範圍內：字幕上傳解析、Gemini API Key 加密儲存與設定介面、單一課程單元 AI 生成講義（含串流、速率限制、講師確認存檔）
- 範圍外：批次資料夾匯入、無字幕直接分析影片、多個 AI 供應商選擇、生成內容版本歷史

## Risks / Trade-offs

- [Risk] 講師的字幕檔內容過長（例如超長影片逐字稿）可能超過 Gemini context 限制，生成失敗或被截斷 → Mitigation: 失敗時明確顯示錯誤訊息，不靜默截斷內容；長度限制留待實作階段依 Gemini 官方文件實測數字決定，不在設計階段先鎖死一個猜測值
- [Risk] 記憶體內速率限制器在服務重啟後計數會歸零，理論上可被「刻意重啟服務」繞過 → Mitigation: 這是刻意的取捨（單一部署程序場景下重啟本身有成本跟時間差，不構成實際濫用誘因），比落地資料庫的額外複雜度更划算
- [Risk] AI 生成的講義內容可能包含事實錯誤或不適當內容（AI 幻覺）→ Mitigation: 生成內容永遠是草稿、需要講師人工確認編輯後才存檔，不自動發布給學員，人工把關這一關不能省

## Open Questions

- 未來若要支援「無字幕直接分析 Bunny 影片」，需要先確認 Bunny 是否提供 Pull Zone Token Authentication 或等同機制能取得短效公開直鏈，這個技術調查留待獨立的後續 change 處理，本次不做
