# Cross-impact 預檢：support-email-fallback（2026-09-02）

## A. 直接改動的函式與其所有呼叫端

| 函式／元件 | 呼叫端 | 是否已處理 |
|---|---|---|
| `openSupportChat` | `SupportWidget` 內部 handleOpenChat／handleConfirmSelection；測試 2 檔 | ✅ 三個分支皆加 emailMode 分流 |
| `openChatwootWithDeployment` | `ReportIssueButton.handleClick`；`report-issue-button.test.tsx` | ✅ handleClick 改為條件分流，函式本身未改（測試直呼仍通過） |
| `openSupportMailForDeployment`（新增） | `ReportIssueButton.handleClick`；新測試 | ✅ |
| `initChatwootSdk` | `ChatwootScript.useEffect`；`chatwoot-script.test.ts` | ✅ email 模式 early return；測試已明確 stub chatwoot 模式 |
| `syncChatwootUser`／`syncChatwootDeployment` | 只在 `ChatwootScript.useEffect` 內；測試 | ✅ useEffect 在 email 模式提早 return，不會走到 |
| `<SupportWidget>` | `app/(authenticated)/layout.tsx:90` | ✅ 元件仍渲染（按鈕保留），只改點擊行為 |
| `<ReportIssueButton>` | `(account)/deployment/page.tsx:50` | ✅ 同上 |
| `<ChatwootScript>` | `app/(authenticated)/layout.tsx:89` | ✅ 仍掛載但不注入 script |

grep 範圍：`apps/` + `packages/`，排除 node_modules 與 prisma/generated。無遺漏呼叫端。

## B. 分類

- ✅ 前端三個入口：全部呼叫端已覆蓋，`chatwoot` 模式行為經回歸測試保護（3 案）
- ✅ `SupportTicket` schema／`packages/support`／`packages/api/modules/support`：本次一行未改
- ✅ 全套測試：`apps/saas` 346/346、type-check exit 0
- ⚠️ **LINE／Telegram webhook 路由仍公開存在且未受開關保護**。email 模式下若這兩個平台仍把訊息推來，程式會嘗試呼叫 Chatwoot API 建立 conversation；Chatwoot 若已停用會失敗。
  - 影響評估：低。這些 webhook 只有在 LINE／Telegram 後台「主動設定 webhook URL 指向本站」時才會有流量，目前未設定即無流量；且失敗只影響客服路徑，不影響主站與金流。
  - 處置：本次不改（Fish 明確要求程式碼保留原樣）。已記錄於本報告，未來若要完全關閉，在 webhook procedure 入口加同一個開關判斷即可。
- 🔴 無

## 結論

無 🔴，可以進封存。唯一 ⚠️ 已記錄且不影響主線功能。
