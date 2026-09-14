## Why

`admin-role-full-access-bypass`、`admin-nav-orphan-pages-wireup`、`buyer-bundle-checkout-entry`、`startkiter-ui-polish-bugs`、`ai-chatbot-frontend-wireup`、`ai-chatbot-provider-model-config` 這六張 SR 都已合併進 main 並部署，但每張只驗證了自己負責的範圍（各自的單元測試 + 各自的 UI 巡查），沒有一次把整個正式站所有功能一起走過，確認彼此沒有互相踩到（例如某張加的導覽項目排版、某張改的權限邏輯是否跟另一張的頁面衝突）。目標：用 Agy（Antigravity CLI）+ ego-browser 做一次全站功能巡查，找出任何異常，交給 Codex 判斷根因並直接修復。

## What Changes

- 派 Agy 開 orca worktree，用 ego-browser 對正式站（`app.startkiter.dev`、`startkiter.dev`）做全站巡查，桌面與手機兩種 viewport，範圍至少涵蓋：
  - 登入/登出/註冊流程
  - 課程瀏覽與觀看（`/course`）
  - 組合包瀏覽（`/bundles`，目前無已上架 bundle，先確認空清單狀態正常顯示）
  - AI 助手對話（`/ai`，確認能送訊息並收到回覆）
  - 帳單/訂閱頁（`/settings/billing`）
  - 後台 6 個管理頁面（組織管理、訂單管理、營收報表、收款閘道設定、發票設定、Gemini 設定）
  - AI 供應商模型設定頁（`/admin/settings/ai-provider`）
  - 側邊導覽在深色/淺色模式下的視覺正確性（文字對比、選單展開）
- Agy 記錄每個頁面的檢查結果（正常/異常），異常項目附截圖、瀏覽器 console 錯誤、network 請求失敗細節。
- 巡查完成的問題清單交給 Codex，由 Codex 判斷根因並直接修復程式碼（不是只寫報告）；每個確認的 bug 對應這張 SR 底下的一個獨立 task，修復後照標準流程驗證（PM 重跑測試、走完整實作+交叉驗證流程）。

## Non-Goals

- 這次是唯讀巡查加上抓到真 bug 才動代碼，不主動重構或優化沒有回報異常的既有功能。
- 不執行任何會產生真實金流扣款的操作（不用真實信用卡走完整付款流程；PAYUNi/Shopline/Stripe 一律只驗證到「頁面渲染正常、按鈕可點擊、表單可送出」為止，不驗證金流服務商那端的實際扣款結果）。
- 不建立/刪除正式站真實使用者資料以外的測試資料；若巡查過程需要建立測試用資料（例如一個測試用 Bundle）才能繼續走某條路徑，先停下來問 Fish，不擅自決定。
- 不對會員資料做任何刪除操作。

## Impact

- Affected specs: none（本身是巡查流程，若巡查中發現真的需要改變某個既有功能的 spec 行為，會另開對應的 spec-driven change，不在這張處理）
- Affected code:
  - New: 無法預先列出（巡查前不知道有哪些 bug）
  - Modified: 依巡查結果實際找到的檔案（每個修復對應 tasks.md 裡各自的 task，屆時在該 task 的完成紀錄中列出實際修改的檔案）
  - Removed: (none)
- Compatibility: 巡查本身不改動任何行為；後續 bug 修復是否有相容性影響，依各個 bug 的性質在對應 task 完成時個別記錄
