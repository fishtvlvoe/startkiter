## Context

講師新增一整門課目前只能一個單元一個單元手動建立、手動貼影片網址、手動打講義。參考舊系統 `realms-course-platform-v1.8.0` 的 `lib/utils/folder-parser.ts`：嚴格三層資料夾結構（課程/章節/單元），單元資料夾內找 `.mp4`/`.mov` 影片、`.srt` 字幕、`.md` 講義（優先順序：有 `.md` 直接用，沒有才用 `.srt` 呼叫 AI 生成）；`use-course-processor.ts` 用並行控制器（上傳序列化避免撞供應商限制、AI 生成可並行 5 個）處理整批單元。

本次依賴 `course-ai-notes-single` 已完成的 `srtToText`／生成 API／rate limiter，批次匯入是在這些既有邏輯上疊加「資料夾解析」跟「並行排程」，不重新設計生成本身。

技術現況確認：StartKiter 目前完全沒有 Bunny 影片上傳的程式碼（`packages/api/modules/course/lib/video-resolver.ts` 只做已知網址的辨識，不做上傳），這部分是本次真正的新工程，不是重用既有功能。Bunny API Key 的加密設定欄位鍵名沿用既有慣例 `BUNNY_API_KEY_FIELD = "bunnyApiKey"`（`packages/course/src/course-pack/checks/bunny-zone-created.ts` 已定義），不另外取新名字，避免同一把 Key 在系統裡有兩個不同的儲存鍵名。

## Goals / Non-Goals

**Goals:**

- 講師能拖拉一個三層結構的資料夾（課程/章節/單元），系統自動解析出章節與單元清單並可預覽/編輯標題
- 每個單元資料夾內的影片自動上傳至 Bunny，講義依優先順序（有 `.md` 直接讀取，否則用 `.srt` 呼叫既有 AI 生成邏輯）處理
- 處理過程並行進行（影片上傳序列化避免撞 Bunny API 限制、AI 生成最多 5 個並行），並即時顯示每個單元的處理狀態
- 部分單元處理失敗不影響其他單元，失敗的單元可個別重試，不需重新處理整批
- 全部處理完成、講師確認後，一次性批次寫入資料庫建立課程/章節/單元骨架

**Non-Goals:**

- 不支援 Safari 等不支援 `webkitdirectory`/資料夾拖拉的瀏覽器，v1 只保證 Chrome/Edge 可用，UI 需明確標示此限制
- 不做超大檔案的斷點續傳（resumable upload），v1 影片上傳為單次直接上傳，設定檔案大小上限；斷點續傳留待未來若有實際需求再評估
- 不修改 `course-ai-notes-single` 既有的生成邏輯本身，只重用其匯出的函式
- 不做「無字幕無講義」單元的自動略過式靜默處理，缺檔案的單元要在預覽階段明確警示，讓講師決定是否要繼續
- 不做批次刪除/批次更新既有課程，本次只處理「新建」情境

## Decisions

### Decision: 影片上傳採用伺服器代轉的簡單直接上傳，不做用戶端直傳 TUS 斷點續傳

伺服器持有 Bunny API Key（環境變數或既有 `SiteSetting` 加密設定），收到瀏覽器上傳的影片檔後，由伺服器呼叫 Bunny Video Library API（建立影片物件 + 上傳影片二進位內容），設定單支影片檔案大小上限（例如 2GB）。

Alternatives Considered:
- 用戶端直接對 Bunny 做 TUS 斷點續傳上傳（伺服器只簽發授權簽章）→ 否決：這是更完整的方案但工程複雜度高出許多（要處理斷點續傳協定、簽章有效期、前端 TUS client 整合），v1 目標是先讓「拖資料夾自動建課」這個核心體驗能動，斷點續傳留待實際遇到大檔案上傳失敗的回饋後再投入
- 完全不做批次上傳，只做批次「文字/講義」生成，影片仍要求講師自己先上傳好、貼網址 → 否決：這樣就失去「拖一個資料夾全自動建課」的核心價值，跟舊系統對照差距太大

### Decision: 資料夾解析邏輯整段搬用舊系統的三層結構規則，不做更彈性的巢狀支援

嚴格要求「課程資料夾 → 章節資料夾 → 單元資料夾 → 檔案」四層路徑深度，不符合的檔案（包括超過四層的巢狀）直接忽略並在預覽階段警示，不嘗試自動猜測結構。

Alternatives Considered:
- 支援更彈性的巢狀深度或用檔名關鍵字自動判斷結構 → 否決：舊系統已驗證過「嚴格三層」這個約定簡單好懂、講師好整理資料夾，自動猜測結構的容錯邏輯複雜度高、容易產生講師無法預期的解析結果

### Decision: 並行處理沿用舊系統的 concurrency 慣例（上傳序列化、AI 生成 5 個並行）

比照 `use-course-processor.ts`：影片上傳 concurrency=1（避免撞 Bunny API 速率限制），AI 生成呼叫 concurrency=5（沿用 `course-ai-notes-single` 的 rate limiter，5 個並行仍在其每分鐘上限之內不會互相卡住）。

Alternatives Considered:
- 全部序列化處理（一次一個單元從頭到尾）→ 否決：講師若匯入十幾堂課的資料夾，全序列處理等待時間會拉得很長，AI 生成部分（呼叫外部 API，非本機運算）可以安全並行
- 全部無限並行 → 否決：會撞 Bunny 上傳 API 的速率限制，且 `course-ai-notes-single` 的 rate limiter 本來就限制每講師每分鐘 10 次，全部同時打會立刻觸發限流反而更慢

### Decision: 部分失敗採逐筆狀態追蹤，批次寫入資料庫的動作延後到全部單元處理完成、講師確認之後

處理階段只在前端狀態機裡追蹤每個單元的進度（pending/uploading/generating/completed/error），失敗的單元可個別重試；只有講師在預覽/確認畫面按下「全部匯入」，才會真正呼叫批次寫入 API 把資料寫進資料庫。

Alternatives Considered:
- 每個單元處理完成就立刻各自寫入資料庫 → 否決：這樣「部分完成、部分失敗」時，資料庫裡會出現不完整的課程結構（有些單元有內容有些是空的），且沒有一個明確的「這批匯入完成了」確認點，講師難以判斷目前狀態
- 全部或全不寫入（transaction 包住整個上傳+生成流程）→ 否決：上傳跟 AI 生成都是耗時的外部 API 呼叫，不適合包在單一資料庫 transaction 裡（transaction 應該只包住最終寫入資料庫的那個短暫動作，不包含外部 API 呼叫）

## Implementation Contract

**行為（Behavior）**：
- 講師在課程管理後台點擊「批次匯入」，開啟精靈介面，拖拉一個資料夾進來
- 系統解析資料夾，顯示章節/單元結構預覽，缺少影片或缺少講義/字幕來源的單元顯示警示，講師可以在預覽階段調整標題或跳過缺件的單元
- 講師點擊「開始處理」，畫面即時顯示每個單元的處理狀態（等待中／上傳中／生成中／已完成／失敗），失敗的單元可以點擊「重試」單獨重跑
- 全部單元處理完成（或講師接受部分失敗、忽略那些單元）後，點擊「確認匯入」，才真正呼叫批次寫入 API 建立課程/章節/單元資料庫紀錄
- 單一影片檔案超過大小上限時，該單元標記為失敗，錯誤訊息明確說明「檔案過大，上限為 [X]GB」

**介面 / 資料形狀**：
- `packages/platform/src/course-batch-import/folder-parser.ts` 匯出：`parseFileList(files: FileList): ParsedChapter[] | { error: string }`（型別比照舊系統 `ParsedChapter`/`ParsedLesson`/`ParsedFolderItem`）
- API：`POST /api/course/batch-import/upload-video`（multipart，回傳 `{ bunnyVideoId, duration }` 或錯誤）
- API：`POST /api/course/batch-import/create-curriculum`（body: 章節/單元清單含各自的 `bunnyVideoId`／生成的 `content`，回傳建立筆數）

**失敗模式（Failure modes）**：
- 資料夾結構不符合三層規則 → 前端顯示結構說明圖示與錯誤訊息，不呼叫任何後端 API
- 影片超過檔案大小上限 → 該單元標記失敗，`error: "FILE_TOO_LARGE"`，其他單元不受影響繼續處理
- Bunny 上傳 API 呼叫失敗（額度/網路錯誤）→ 該單元標記失敗，可重試，不影響其他單元
- AI 生成失敗（沿用 `course-ai-notes-single` 既有失敗處理）→ 該單元的講義內容留空，標記為需要講師手動處理，不阻擋其他單元或批次寫入
- 批次寫入 API 呼叫時途中失敗 → 已成功寫入的章節/單元保留，回應清楚列出哪些單元寫入失敗，講師可針對失敗項目重試批次寫入（不是整批回滾重來）

**驗收標準（Acceptance criteria）**：
- 單元測試：`parseFileList` 對正確三層結構回傳對應的 `ParsedChapter[]`；對缺少中間層、超過四層路徑的檔案正確忽略並回傳警示清單
- 整合測試：上傳超過大小上限的檔案回傳 `FILE_TOO_LARGE`，不影響其他單元繼續處理
- 整合測試：其中一個單元的 Bunny 上傳模擬失敗，其餘單元仍正常完成處理
- 整合測試：批次寫入 API 對已解析好的章節/單元清單，正確建立對應的 `Chapter`／`Lesson` 資料庫紀錄，筆數與輸入一致
- 端對端：用一個測試用小型三層結構資料夾（2 章節、每章 2 單元，各自附小測試影片+字幕），走完整個「拖資料夾→預覽→處理→確認匯入」流程，資料庫確認課程結構正確建立

**範圍邊界（Scope boundaries）**：
- 範圍內：資料夾解析、批次影片上傳（伺服器代轉，非斷點續傳）、批次呼叫既有 AI 生成邏輯、並行處理與個別重試、批次寫入資料庫
- 範圍外：斷點續傳、Safari 相容性、批次更新/刪除既有課程、無字幕無講義單元的自動略過

## Risks / Trade-offs

- [Risk] 伺服器代轉上傳大型影片檔案會占用 Node 服務的記憶體與頻寬，若講師同時匯入多支大型影片可能拖慢服務本身（StartKiter 是常駐 Node 服務，會影響其他使用者）→ Mitigation: 設定合理的單支檔案大小上限（例如 2GB）與上傳並行度為 1（序列化），降低同時佔用資源的尖峰
- [Risk] 講師資料夾整理錯誤（例如章節/單元命名重複、順序跟預期不符）可能導致課程結構跟講師預期不一致 → Mitigation: 預覽階段列出完整解析結果供講師確認/調整標題，不是解析完就直接寫入資料庫
- [Risk] AI 生成部分沿用 `course-ai-notes-single` 的 rate limiter（每講師每分鐘 10 次），批次匯入若單元數量很多，會被限流拖慢整體處理速度 → Mitigation: 這是刻意的行為，避免打爆講師自己的 Gemini 配額；前端會顯示排隊等待中的狀態，讓講師知道是在正常排隊而非卡住

## Open Questions

- 單支影片檔案大小上限的實際數字（2GB 只是舉例）留待實作階段依 Bunny 官方文件的實際限制與部署環境頻寬條件決定，不在設計階段鎖死
