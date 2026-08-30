## Context

課程媒體、頭像、assignment、lesson message 附件都透過 signed URL 上傳/存取，部分透過 image proxy 代理讀取。這些機制若 key 可預測、過期未強制、或 image proxy 可代理任意外部位址，會造成跨 user 資料外洩或 SSRF。目前沒有測試證據證明這些邊界被正確防護。

## Goals / Non-Goals

**Goals:**
- 每個 signed URL 簽發點驗證：key/path 綁定正確 owner、過期時間存在且合理、無法用猜測或竄改的 key 存取他人資源
- image proxy 驗證：只代理白名單/合法來源，不可被用來打內網位址或任意外部 URL（SSRF 防護，比照 `lesson-tool-embed` 已有模式）
- local upload fallback 路徑驗證：production 設定下不暴露非 owner 可存取的路徑

**Non-Goals:**
- 不重構 storage provider、不換 SDK
- 不新增上傳功能
- 抓到真實漏洞只記錄回報，不修復

## Decisions

1. 沿用 `lesson-tool-embed` SR 已建立的 SSRF 防護測試模式（image proxy 白名單驗證），作為本次 image proxy 測試的參考基準，不重新發明測試手法。
2. Signed URL 測試用 mock S3 client 驗證簽發參數（key 前綴含 owner id、expiresIn 有設定值），不需要真的打 S3 API。
3. 若测试过程发现某簽發點完全没有 owner 綁定（key 是全域可猜測格式），視為真實漏洞，停止該項並記錄。

## Implementation Contract

- **Behavior**：每個 signed URL 簽發函式的測試驗證回傳的 key/path 含正確 owner 識別；image proxy 對非白名單來源回傳 4xx 拒絕；local upload 路徑不可被非 owner 猜測存取。
- **Interface**：不改變任何簽發函式或 image proxy 的對外介面。
- **Failure modes**：發現漏洞時測試記錄現況（紅燈測試允許保留），tasks.md 對應項標註「⚠️ 發現漏洞，已回報 Fish，未修復」。
- **Acceptance criteria**：`pnpm test` 全部通過（PM親自重跑驗證）；每個簽發點至少一組 ownership/過期測試；image proxy 至少一組 SSRF 防護測試；`spectra validate` 通過。
- **Scope boundaries**：只新增/擴充測試，不動簽發邏輯本身（除非發現漏洞回報後由Fish決定）。

## Risks / Trade-offs

- **風險：測試過程發現真實漏洞**。對策：立即停止，記錄回報，不擅自修復（對齊資安類SR加碼驗收關卡第4條）。
- **風險：mock S3 client 與既有測試風格不一致**。對策：先讀 `packages/storage` 現有測試（若有）確認既有 mock 方式再沿用。
