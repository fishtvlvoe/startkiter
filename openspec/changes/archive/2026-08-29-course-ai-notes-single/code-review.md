▋ Code Review：course-ai-notes-single

• 審查範圍：`main..HEAD`（分支 `fishtvlvoe/course-ai-notes-single`，15 commits）
• 審查基準：`proposal.md` / `design.md` / `specs/course-ai-notes-single/spec.md` / `tasks.md`
• 審查類型：獨立審查（未改程式碼）
• 審查日：2026-08-29

▋ 摘要

• Critical: 1
• High: 3
• Medium: 5
• Low: 4

• 結論：Critical／High 非 0，tasks.md 5.2 未通過；須修復後重跑測試再請二次 CR。

▋ Critical

• C1 — AI 存檔後未同步課程樹快取，可能用舊內容蓋回 DB
• 檔案：`apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`（`onSaved`）、對照同檔 `handleSaveLesson`
• 理由：`AiNotesDialog` 存檔會打 `/api/course/studio` `update_lesson` 寫入 DB，但 `onSaved` 只更新 `selectedLesson`，沒有像 `handleSaveLesson` 一樣同步 `chapters` 裡對應 lesson。側邊欄選單元是 `setSelectedLesson(lesson)`（來源是 `chapters`）。流程：對話框存檔成功 → 切換／重點同一單元 → 畫面回到舊 `content` → 再按主畫面「儲存單元」→ 舊內容覆寫 DB。這直接撞上 design「防止資料遺失」底線與 spec「確認存檔後 Lesson.content 為講師最終內容」。

▋ High

• H1 — 未設定 API Key 仍會打生成 API（違反 design／tasks 契約）
• 檔案：`apps/saas/modules/shared/components/AiNotesDialog.tsx`、`apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`
• 理由：design Implementation Contract 與 tasks 4.3 要求：未設定 Key 時顯示提示並連結設定頁，「不嘗試呼叫 AI」。實作只有常駐連結文字；上傳 `.srt` 仍直接 `fetch /api/course/ai-notes/generate`。阻擋只靠後端 400，前端沒有先讀取設定狀態、也沒有禁用上傳／生成。

• H2 — Gemini 呼叫失敗沒有明確失敗模式，可能被當成「生成完成」
• 檔案：`apps/saas/app/api/course/ai-notes/generate/route.ts`、`apps/saas/modules/shared/components/AiNotesDialog.tsx`
• 理由：design Failure modes 要求 provider 失敗時串流中斷並顯示「生成失敗：[原因]」，不可靜默失敗。route 對 `streamText`／`toTextStreamResponse()` 沒有 `try/catch`、也沒有 `onError`（同 repo 的 `apps/saas/app/api/course/ai/route.ts` 有完整 try/catch）。前端只要 `response.ok` 且 reader 正常結束就設「生成完成」；空內容、中途被截斷、或 SDK 以 200 空串流結束的情況，不會顯示明確錯誤。整合測試也未覆蓋 provider 失敗路徑。

• H3 — Goals 寫「講師自己的 Key／自己出費用」，實作是全站共用一把 Key
• 檔案：`packages/api/modules/course/lib/gemini-settings.ts`（`GEMINI_SETTING_ID = "gemini-notes"`）、`apps/saas/app/(authenticated)/(main)/(account)/admin/settings/gemini/page.tsx`
• 理由：任一有講師／operator 設定權限的人寫入同一筆 `SiteSetting`，所有人生成都用這把 Key。design Decision 雖說比照 payuni 全站設定，但 Goals／Alternatives 又以「多講師無法共用一把 env Key」否定 env——結果選了同樣無法分帳的全站密鑰。在已有 `course-instructor-scoped-access` 的前提下，這會造成費用歸屬錯誤與講師互相覆寫 Key。若產品刻意全站一把 Key，應改寫 Goals／spec；否則屬需求未落地。

▋ Medium

• M1 — 缺 Key 時仍先消費 rate limit 額度
• 檔案：`apps/saas/app/api/course/ai-notes/generate/route.ts`
• 理由：順序是 `checkRateLimit` → `readGeminiApiKey`。未設定 Key 回 400 `GEMINI_KEY_MISSING` 前已寫入滑動視窗計數。403 路徑正確不計次；缺 Key／明顯無法生成的請求仍計次，誤觸或未設定狀態會燒額度。建議先確認可生成（Key 存在）再計次，或至少與 403 一樣在失敗前置條件不計次。

• M2 — 429／一般錯誤文案未對齊 design
• 檔案：`apps/saas/modules/shared/components/AiNotesDialog.tsx`
• 理由：design 要求超過速率顯示「呼叫太頻繁，請稍後再試」；實作直接把 `error` 碼（如 `RATE_LIMITED`）丟上畫面。非 `GEMINI_KEY_MISSING` 的錯誤也幾乎只顯示 raw code，沒有「生成失敗：[原因]」格式。

• M3 — 將 `settings-crypto` 抽到 `packages/api` 超出 proposal Impact，且套件邊界怪
• 檔案：`packages/api/modules/course/lib/settings-crypto.ts`、`apps/saas/lib/settings-crypto.ts`、`packages/api/modules/course/lib/gemini-settings.test.ts`
• 理由：proposal Impact 未列搬移既有加密實作。`apps/saas` 的 payuni／invoice／checkout-gateway 改走 api re-export；api 測試又反向 import `apps/saas/lib/settings-crypto`。演算法本身與既有 AES-256-GCM 一致（這點正確），但影響面大於本 change 宣告範圍，增加回歸風險。

• M4 — 生成 API 測試未斷言「未呼叫 provider」；亦無成功串流／失敗串流案例
• 檔案：`apps/saas/app/api/course/ai-notes/generate/route.test.ts`
• 理由：tasks／spec 要求缺 Key、403、429 皆「SHALL NOT call the AI provider」。現有測試只查 status／body；`GEMINI_KEY_MISSING`／429 未 `expect(streamText).not.toHaveBeenCalled()`。`createOpenAI` mock 回傳 `vi.fn()` 也無法支撐 `.chat()` 成功路徑，等於快樂路徑與 provider 錯誤路徑都沒鎖住。

• M5 — AI 草稿存檔後章節樹標題／內容 UI 不一致
• 檔案：`apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx`
• 理由：與 C1 同源；即使尚未踩到覆寫 DB，存檔後側欄仍顯示舊 title／舊摘要狀態，講師會以為沒存成功而重複生成（額外燒 Gemini 額度）。

▋ Low

• L1 — 深度相對路徑 import `@startkiter/ai` 的替代寫法
• 檔案：`apps/saas/app/api/course/ai-notes/generate/route.ts`（`../../../../../../../packages/ai`）
• 理由：同 repo 既有 `course/ai/route.ts` 也用相對路徑，但套件名已是 `@startkiter/ai`（見 `packages/support`、`packages/api`）。脆弱、難讀，後續搬檔易碎。

• L2 — SRT 純數字字幕行會被當成序號丟掉
• 檔案：`packages/platform/src/course-ai-notes/srt-parser.ts`
• 理由：`/^\d+$/` 過濾序號時，字幕正文若整行只有數字（如「42」）會被刪。主路徑（序號／時間軸剝離）測試有覆蓋且正確；此為邊界。

• L3 — 雙層 dialog 標記
• 檔案：`admin/course/page.tsx`（`Dialog`/`DialogContent`）+ `AiNotesDialog.tsx`（自身 `role="dialog"`）
• 理由：外層 shadcn Dialog 內再嵌一層 aria dialog，易造成焦點／Escape／a11y 混亂。非功能錯誤，建議 AiNotesDialog 只當內容面板。

• L4 — `writeGeminiApiKey` 未寫 `updatedBy`；記憶體 rate limit Map 無淘汰
• 檔案：`gemini-settings.ts`、`rate-limiter.ts`
• 理由：payuni 寫入會帶 `updatedBy`；此處沒有稽核欄位。rate limiter 的 `Map` 只 filter 時間戳、不刪空 key，長時間多講師程序有輕微記憶體成長（design 已接受記憶體方案，僅記錄）。

▋ 審查對照（重點方向）

• Correctness — 加密：比照既有 AES-256-GCM（`v1:iv:tag:data`）+ `SETTINGS_ENCRYPTION_KEY`，ciphertext 測試確認不含明文 Key → 通過。rate limiter 滑動視窗邏輯與測試對齊 spec 表 → 通過。SRT 去序號／時間軸 → 通過（見 L2 邊界）。
• Security — 非講師 403 且不呼叫 `checkRateLimit` → 通過（route + test）。API Key 未見 `console.log`／錯誤 body 外洩 → 未發現直接外洩；H2 若把原始 SDK error 丟前端仍有理論風險，目前前端多顯示自定字串。
• 資料完整性 — 取消不打 studio API → 通過（元件測試）。確認存檔才寫入 → API 路徑正確；但 C1 使「存檔成功」之後仍可能被舊快取蓋掉 → 未通過底線。
• 範圍蔓延 — 核心檔案大致落在 proposal Impact；M3 的 crypto 搬移超出清單。
• Provider — 經 Gemini OpenAI 相容端點 + `gemini-2.5-flash` chat 合理；錯誤處理覆蓋不足（H2）。

▋ 建議修復順序

• 先修 C1（`onSaved` 同步 `chapters`，比照 `handleSaveLesson`）
• 再修 H1（開對話框前或 generate 前檢查 Key）與 H2（route／前端明確錯誤）
• 釐清 H3（改 spec 為全站 Key，或改成 per-instructor 儲存）
• 其餘 Medium／Low 可同輪或下一輪處理

▋ 複審結果（2026-08-29，針對 C1／H1／H2／H3）

• 複審範圍：commit `7720994a`（`fix: 修正單堂 AI 講義資料一致性與講師金鑰隔離`）相對初審四項；其餘 Medium／Low 未重審。
• 對照基準：初審 C1／H1／H2／H3 的具體失敗條件。

• C1 — 已解決
• 證據：`admin/course/page.tsx` 的 `onSaved` 現在同時 `setSelectedLesson` 與 `setChapters`（依 `selectedLesson.id` 更新對應 lesson 的 `title`／`content`），型態與同檔 `handleSaveLesson` 的 chapters 同步一致。切換側欄單元再存檔時，來源資料已是新內容，不再用舊快取蓋 DB。

• H1 — 已解決
• 證據：`AiNotesDialog` 開啟時打 `GET /api/course/ai-notes/settings`（依 `session.user.id` 回 `configured`）；`keyConfigured !== true` 時上傳 input `disabled`，`generate()` 開頭直接 return 並顯示「請先設定 API Key」。元件測試覆蓋「無 Key 時 disabled 且不呼叫 generate API」。不是只靠後端 400。

• H2 — 已解決
• 證據：route 對 `streamText`／`toTextStreamResponse` 包 `try/catch`，同步失敗回 502 `GENERATION_FAILED` + `message: "生成失敗：AI provider 無法回應"`（有測試）。前端：非 200 顯示對應訊息；空串流顯示「生成失敗：沒有收到內容」而不標完成；`catch` 顯示「生成失敗：[原因]」。附註：`onError` 目前只 `console.error`，若未來要更嚴可把串流中錯誤也映射成前端可讀失敗，但不影響本項「不會誤判空／同步失敗為完成」的通過標準。

• H3 — 已解決
• 證據：`getGeminiSettingId(instructorId)` → `gemini-notes:${instructorId}`；`readGeminiApiKey`／`writeGeminiApiKey` 皆必填 `instructorId`。設定頁、settings API、generate route 都傳 `session.user.id`。單元測試「keeps each instructor API key isolated」驗證 A／B 互不覆蓋。

• 最終 Verdict
• 初審 Critical／High（C1 + H1–H3）剩餘：Critical 0、High 0
• 就 tasks.md 5.2「Critical／High 發現數為 0」而言：可以 archive（本複審四項皆已解決）
• 未重審的初審 Medium／Low（M3／M5／L1–L4 等）不阻擋 5.2 的 Critical／High 門檻；若要清技術債可另開後續 change
