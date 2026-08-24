# woomin → StartKiter 功能整合：總 SR 計畫

給 Codex（或其他外部代理）接力執行 `/spectra-apply` 用的路線圖。每張 change 已完成 proposal/design/specs/tasks 並通過 `spectra validate`，全部處於 `park` 狀態。這份文件只負責「誰先誰後、誰跟誰衝突」，不重複各 change 內部的設計細節。

Fish 只需要做的事：依序把下面的 change 丟給 Codex 執行 `/spectra-apply <name>`。每張 change 完成實作後，先由自動化流程開一個隔離 worktree 派 Claude Code（CC）做最終驗收；CC 明確 PASS、Critical 數量為 0，且三類驗證證據齊全後，才允許 `spectra archive <name>`，驗收未過不得封存或進下一張。除了「總表」列出的執行順序，不需要中途裁決任何東西——所有需要外部帳號/金鑰的功能（Bunny/Cloudflare 直傳、電子報群發等）都已經在各張 change 的 Non-Goals 排除，不在這批範圍內。

## 每張 SR 的自動 CC 驗收流程（所有功能模組共用）

這是每張 SR 的固定 gate，不限本次 15 張；之後新增的功能模組也必須套用：

1. Codex／主控完成該 change 的 tasks，先寫紅燈測試、完成實作、跑完 tasks.md 要求的本地驗證，並提交與該 change 有關的 commit；此時**不准先 archive**。
2. 自動化建立 `task-<change>-cc-acceptance` 隔離 worktree，從該 change 的最新 commit 啟動 Claude Code。CC 只讀驗收，不修改檔案、不 commit、不 push、不 archive。
3. CC 對本次完整 diff 做 correctness／security／performance 三角度 Code Review，並核對 `spectra analyze`／`validate`、`pnpm test`／`type-check`／`build` 與 tasks.md 指定的 ego-browser e2e 實跑證據。
4. CC 回報任何 Critical／High、驗收 FAIL 或缺證據時，主控先修正，再重新開／派 CC 驗收；未取得 PASS 前不得封存。Critical 數量必須是 0。
5. CC PASS 後，主控才在主工作樹執行 `spectra archive <change>`，確認 archive 成功、git status 乾淨，再關閉 CC terminal、刪除驗收 worktree，留下完整驗收報告。

2026-08-24 scope decision：第 2 張 `subscriptions-invoice` 的程式實作與本地驗證已完成，但真實付款／訂閱開票 e2e 與正式金鑰設定屬於金流驗收，依 Fish 裁決延後到全部非金流模組完成後再補。第 2 張保持未 archive 的 deferred 狀態，不能勾掉未完成 task，也不能把 deferred 當成 PASS；施工流程可先繼續第 3-8、11-15 張非金流 change。回頭補金流時，先 unpark 第 2 張，完成 tasks.md 的 e2e 與正式設定 gate，取得 CC PASS 後才 archive。

每張 change 除了對照自身 proposal/design/spec/tasks，也必須檢查 `docs/` 下與部署、後台、資料流及 agent routing 有關的文件，確認新模組沒有破壞目前後台耦合、Coolify/VPS 啟動條件、webhook 回路與既有 package contract。這項文件對照要在該張 change 的驗收報告留下實際檔案與驗證證據。

站內付不是現有 `multi-gateway-checkout` 的直接延伸。現有 change 以單一啟用 gateway、hosted redirect/form-post、排除買家支付方式選擇為前提，與新的 embedded checkout 方向不同；後續應另開一張 Spectra change（暫名 `embedded-payment-checkout`），先完成 discuss/propose/validate，再決定是否取代或依賴現有 change。`/Users/fishtv/Development/8-外掛/paygo` 只作 adapter、支付方式策略、return/webhook、退款與設定分層的參考，不直接搬 PHP/WordPress 程式碼，也不在新 SR 核准前修改正式 specs。

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

## 驗收方式（每張 apply 完成後，硬性關卡，不可跳過任一項）

每張 tasks.md 的「Review 與驗證」章節都固定包含三種驗證，缺一項就不算這張完成，不能進下一張：

1. **Code Review（CR）**：對照 tasks.md 裡「派 Codex 或等效工具對本次全部 diff 做 Code Review（correctness／security／performance 三角度）」那一項，確認 CR 報告 Critical 數量為 0。有任何 Critical 發現 → 先修，重新 CR，Critical 清零才能繼續，不可帶著已知 Critical 進下一張
2. **e2e 行為驗證**：對照 tasks.md 裡的 ego-browser e2e 項，確認截圖/終端機輸出證據齊全，每一步驟都實際跑過，不是「應該會過」的推測
3. **一致性/測試/建置**：`spectra analyze`／`validate` 通過、`pnpm test`／`pnpm type-check`／`pnpm build` 全數 exit code 0

三項都過，才做：
4. `git status` 乾淨、已 commit
5. `spectra archive <name>`
6. 進下一張前，若這張是衝突組成員，先 `grep` 確認共用檔案的最新狀態符合這份計畫的預期（見上方「衝突組細節」）

我（Claude）做最終驗收時，會逐張核對這三項證據是否真的存在，不會只看 Codex 回報「完成」就簽核。

## 已盤點但本次不做（待 Fish 裁決，不在這 15 張範圍內）

以下 woomin 功能已盤點過，因為需要外部帳號/金鑰或屬於商業範圍決策，本次規劃刻意排除，未來要做需要 Fish 先做決定再開新 change：

- **Bunny TUS / Cloudflare Stream 檔案直傳**：`course-media-library` 的 Non-Goals 明確排除，需要 Bunny/Cloudflare API 金鑰才能實作，目前 StartKiter 沒有這兩個服務的帳號整合
- **電子報群發（Newsletter Campaign）**：`NewsletterCampaign`／`Recipient`／`Template`／`Link` 共 4 個 model，`course-lifecycle-email` 的 Non-Goals 排除。屬於行銷工具而非交易生命週期必要功能，是否要做電子報行銷是商業範圍決定
- **行銷自動化流程引擎（Newsletter Automation）**：`NewsletterAutomation`／`Step`／`Enrollment`／`Delivery`／`Open`／`Click` 共 6 個 model，`course-lifecycle-email` 的 Non-Goals 排除。範圍等同一整套 Marketing Automation 平台，遠超單一課程 MVP 需求
- **Email 退訂同意記錄（EmailConsentLog）**：只有主動群發行銷信才需要，若不做上述兩項電子報功能，這個表用不到
- **SalesChat/SalesInquiry（銷售導購對話）**：woomin schema 註解自己標注為「舊版，保留資料庫相容性」，且與 StartKiter 既有 `unified-support-desk`（Chatwoot）功能重疊，判斷不需要搬遷
