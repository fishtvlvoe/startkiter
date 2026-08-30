## Context

`packages/notifications`（7 source/0 test）、`packages/mail`（25 source/1 test）、`packages/storage`（0 test）、`settings-crypto.ts`（加密邏輯，0 test）是全站測試覆蓋率最薄弱的區塊。這些模組被多個功能依賴（課程通知、Email發送、檔案上傳、加密設定值），沒有測試代表任何重構都可能靜默壞掉且無人察覺。

## Goals / Non-Goals

**Goals:**
- notifications 核心邏輯（建立通知、連結解析、welcome流程）有測試覆蓋
- mail 發送入口與provider選擇邏輯有測試覆蓋，不逐一測adapter實作
- storage provider 介面與錯誤處理有測試
- settings-crypto 加密/解密邏輯有測試，驗證加密不可逆推、錯誤key正確拋錯

**Non-Goals:**
- 不重構這些模組的架構
- 不測試個別mail provider adapter細節
- 不新增功能
- 發現真實漏洞只記錄回報

## Decisions

1. mail provider adapter（mailgun/resend/postmark/nodemailer/console）本身不逐一測試——這些是外部SDK的薄封裝，測試重點放在「選對provider」跟「fallback到console provider（開發環境）」的邏輯，避免為了衝覆蓋率寫沒意義的mock測試。
2. settings-crypto 測試視為資安類任務，套用 `~/.claude/rules/routing.md` 資安加碼驗收關卡：交叉審查需驗證是否用了業界標準加密演算法（不是自製XOR之類的弱加密）。
3. 測試框架沿用 Vitest，mock外部依賴（真實寄信API、真實S3）不觸發真實副作用。

## Implementation Contract

- **Behavior**：`create-notification` 正確寫入通知資料；`resolve-link` 對已知/未知連結類型有正確行為；mail `send.ts` 依環境變數選對provider，開發環境fallback到console provider；storage provider 對上傳失敗、檔案不存在有明確錯誤而非靜默失敗；`settings-crypto` 加密後密文與明文不同、無key無法解密、錯誤key解密拋錯。
- **Interface**：不改變任何函式簽名或對外行為。
- **Failure modes**：settings-crypto若發現弱加密或key管理問題，記錄並停止，不修復。
- **Acceptance criteria**：`pnpm test` 全部通過（PM親自重跑）；`spectra validate` 通過；settings-crypto測試明確驗證「加密輸出無法直接看出明文」與「錯誤key解密會拋錯」兩項。
- **Scope boundaries**：只補測試，不動生產邏輯（除非發現漏洞回報後決定）。

## Risks / Trade-offs

- **風險：settings-crypto發現弱加密實作**。對策：立即停止回報Fish，這類問題可能影響invoice/gemini API key等敏感資料安全性，優先度高於本SR本身範圍。
- **風險：mail測試需要mock多個外部API，容易寫出「假測試」（mock掉真正要驗證的邏輯）**。對策：交叉審查時特別檢查mock範圍是否過大，是否連provider選擇邏輯本身都被mock掉了。
