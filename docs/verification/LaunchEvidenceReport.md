# LaunchEvidenceReport

| 欄位 | 結果 |
| --- | --- |
| Change | `platform-launch-verification-evidence` |
| 驗收環境 | `https://app.startkiter.dev`（正式站，ego-browser） |
| App | `course` |
| 矩陣 | 36/36 組合已執行；12 verified、24 因 workspaceLabel 未本地化而 failed |
| 可見入口 | 54/54 link/button checks passed |
| 錯誤情境 | 3/3 passed：未授權路由、表單無效輸入、模擬逾時 |
| 回滾排練 | 未執行；本任務明確排除 4.1，且禁止對正式站回滾 |
| 完成狀態 | `incomplete` |

完整結構化報告：[`LaunchEvidenceReport.json`](./LaunchEvidenceReport.json)

## 證據

- 矩陣：[`launch-matrix-observations.json`](../../openspec/changes/platform-launch-verification-evidence/evidence/launch-matrix-observations.json)
- 連結：[`link-checks.json`](../../openspec/changes/platform-launch-verification-evidence/evidence/link-checks.json)
- 按鈕：[`button-checks.json`](../../openspec/changes/platform-launch-verification-evidence/evidence/button-checks.json)
- 錯誤情境：[`error-scenarios.json`](../../openspec/changes/platform-launch-verification-evidence/evidence/error-scenarios.json)

## 尚未確認與後續處理

1. 回滾排練留待 4.1：在 TEST/preview 執行，補上 timestamp、command、health check。
2. 36 張截圖未產出：ego-browser 的 `Page.captureScreenshot` 在 1440px 與 390px 均 15 秒逾時；不以空白或假 PNG 取代，保留 DOM/state 證據並標記 3.2 screenshot gate 未確認。
3. 測試帳號尚未取得課程 `courseAccess`：未直連正式站資料庫；需透過正式購買或安全的後台開通流程後，另跑課程內容權限路徑。
4. 24 格 zh-cn/en 矩陣未通過：`workspaceLabel` 未走 i18n，身份標籤仍顯示繁體中文；根因為 `packages/platform/src/workspace/navigation.ts` 第 237/239 行硬編碼，需另開 SR 修正後重跑。

## 範圍與 mitigation

- 36 格成本：固定角色、主題、語言、viewport 組合，以唯一鍵批次執行並保存 JSON。
- 回滾風險：本輪不碰正式站，後續在 TEST/preview 低流量時段排練。
- App 擴張：以 `appId` 分組；新增 App 只新增該 App 的矩陣與入口 checks，共用元件變更才重跑全量。
