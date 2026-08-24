# woomin → StartKiter 功能整合：總 SR 計畫

給 Codex（或其他外部代理）接力執行 `/spectra-apply` 用的路線圖。每張 change 已完成 proposal/design/specs/tasks 並通過 `spectra validate`，全部處於 `park` 狀態。這份文件只負責「誰先誰後、誰跟誰衝突」，不重複各 change 內部的設計細節。

Fish 只需要做的事：依序把下面的 change 丟給 Codex 執行 `/spectra-apply <name>`，每張跑完後我（Claude）做驗收（跑 `spectra analyze`／測試／ego-browser e2e），驗收過才進下一張。除了「總表」列出的執行順序，不需要中途裁決任何東西——所有需要外部帳號/金鑰的功能（Bunny/Cloudflare 直傳、電子報群發等）都已經在各張 change 的 Non-Goals 排除，不在這批範圍內。

## 總表（15 張，依執行順序）

| # | Change | Task 數 | 前置依賴 | 檔案衝突組 |
|---|---|---|---|---|
| 1 | `startkiter-dev-skill` | 6 | 無 | 無 |
| 2 | `subscriptions-invoice` | 22 | 無 | 無 |
| 3 | `course-quiz-plugin` | 12 | 無 | 無 |
| 4 | `course-review-plugin` | 10 | 無 | 無 |
| 5 | `course-invite-access` | 12 | 無 | 無 |
| 6 | `login-and-admin-audit-log` | 9 | 無 | 無 |
| 7 | `course-onboarding-survey` | 6 | 無 | 無 |
| 8 | `course-instructor-scoped-access` | 12 | 無 | 無 |
| 9 | `multi-gateway-checkout` | 14 | **#2 subscriptions-invoice** | 無 |
| 10 | `course-lifecycle-email` | 12 | **#2 subscriptions-invoice** | 無 |
| 11 | `course-video-watermark` | 6 | 無 | **FluentPlayer.tsx 組 A** |
| 12 | `course-assignment-plugin` | 12 | 無 | **storage 組 A** |
| 13 | `lesson-watch-time-tracking` | 6 | 建議在 #11 之後 | **FluentPlayer.tsx 組 B** |
| 14 | `lesson-private-message` | 8 | 建議在 #12 之後 | **storage 組 B** |
| 15 | `course-media-library` | 13 | 建議在 #14 之後 | **storage 組 C** |

## 為什麼是這個順序

**Wave 1（#1-8，可平行，互不相干）**：8 張彼此不共用檔案、不互相依賴，Codex 可以同時開多個 worktree 分別跑（依 `~/.claude/rules/routing.md` 的平行上限：純寫代碼任務上限 5 個，這 8 張建議分兩批各 4-5 張）。

**Wave 2（#9、#10，依賴 #2）**：
- `multi-gateway-checkout` 依賴 `subscriptions-invoice` 產出的共用函式 `triggerInvoiceForOrder`（`packages/api/modules/course/lib/invoice-events.ts`）。
- `course-lifecycle-email` 依賴 `subscriptions-invoice` 產出的 `triggerInvoiceForSubscriptionPeriod`（同一檔案）。
- 這兩張必須等 #2 apply 完成、`invoice-events.ts` 真的存在對應函式後才能動工，彼此之間不衝突，可平行。

**Wave 3（#11、#12，可與 Wave 2 平行，但各自是衝突組的第一棒）**：
- `course-video-watermark` 會修改 `packages/course/src/player/FluentPlayer.tsx`（新增 `watermark` prop）。
- `course-assignment-plugin` 會修改 `packages/storage/types.ts`／`config.ts`（新增 `assignments` bucket）。
- 這兩張互相不衝突，可以跟 Wave 2 一起跑，但各自的衝突組後續 change 必須排在它們之後。

**Wave 4（#13、#14，各自衝突組的第二棒）**：
- `lesson-watch-time-tracking` 也會修改 `FluentPlayer.tsx`（新增浮水印以外的另一組 prop）。apply 前先 `git diff` 確認 #11 對 `FluentPlayer.tsx` 的改動已經合併進主幹，避免兩張同時修同一個檔案產生衝突 patch。
- `lesson-private-message` 也會修改 `packages/storage/types.ts`／`config.ts`（新增 `lessonMessages` bucket）。同理先確認 #12 已經合併。

**Wave 5（#15，衝突組的第三棒）**：
- `course-media-library` 是 `packages/storage/types.ts`／`config.ts` 這一組衝突的第三個（新增 `media` bucket）。等 #14 合併後再動工，`StorageBucketNamesConfig` 介面會變成同時有 `avatars`／`assignments`／`lessonMessages`／`media` 四個欄位。

## 衝突組細節

### FluentPlayer.tsx 組（#11 → #13）
兩張都改 `packages/course/src/player/FluentPlayer.tsx`，目前只有 `{ title, resolved }` 兩個 prop。`course-video-watermark` 加 `watermark` prop，`lesson-watch-time-tracking` 加時間追蹤邏輯（很可能是 `onProgress` 類的 callback prop）。序列執行，第二張 apply 前先讀最新的 `FluentPlayer.tsx` 確認第一張加的 prop 還在，不要整份覆蓋。

### packages/storage 組（#12 → #14 → #15）
三張都改 `StorageBucketNamesConfig`（`packages/storage/types.ts`）與 `config.ts` 的 `bucketNames`。目前只有 `avatars` 一個欄位。三張依序各自新增一個欄位（`assignments`／`lessonMessages`／`media`），每張 apply 前確認前一張已經合併，避免同時編輯同一個 interface 產生衝突。

## 驗收方式（每張 apply 完成後）

1. 跑該 change 的 tasks.md 全部項目，確認每個「驗證目標」都有實際輸出（測試綠燈、`spectra analyze`/`validate` 通過、ego-browser e2e 截圖）
2. `git status` 乾淨、已 commit
3. `spectra archive <name>`
4. 進下一張前，若這張是衝突組成員，先 `grep` 確認共用檔案的最新狀態符合這份計畫的預期（見上方「衝突組細節」）

## 已盤點但本次不做（待 Fish 裁決，不在這 15 張範圍內）

以下 woomin 功能已盤點過，因為需要外部帳號/金鑰或屬於商業範圍決策，本次規劃刻意排除，未來要做需要 Fish 先做決定再開新 change：

- **Bunny TUS / Cloudflare Stream 檔案直傳**：`course-media-library` 的 Non-Goals 明確排除，需要 Bunny/Cloudflare API 金鑰才能實作，目前 StartKiter 沒有這兩個服務的帳號整合
- **電子報群發（Newsletter Campaign）**：`NewsletterCampaign`／`Recipient`／`Template`／`Link` 共 4 個 model，`course-lifecycle-email` 的 Non-Goals 排除。屬於行銷工具而非交易生命週期必要功能，是否要做電子報行銷是商業範圍決定
- **行銷自動化流程引擎（Newsletter Automation）**：`NewsletterAutomation`／`Step`／`Enrollment`／`Delivery`／`Open`／`Click` 共 6 個 model，`course-lifecycle-email` 的 Non-Goals 排除。範圍等同一整套 Marketing Automation 平台，遠超單一課程 MVP 需求
- **Email 退訂同意記錄（EmailConsentLog）**：只有主動群發行銷信才需要，若不做上述兩項電子報功能，這個表用不到
- **SalesChat/SalesInquiry（銷售導購對話）**：woomin schema 註解自己標注為「舊版，保留資料庫相容性」，且與 StartKiter 既有 `unified-support-desk`（Chatwoot）功能重疊，判斷不需要搬遷
