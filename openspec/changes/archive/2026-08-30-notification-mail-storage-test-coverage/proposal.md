## Why

全站盤點第7節優先順序第6項：`packages/notifications`（7支source檔/0測試）、`packages/mail`（25支source檔/1測試）、`packages/storage`（0測試）、course settings（`settings-crypto.ts`涉及加密、`invoice-settings.ts`、`gemini-settings.ts`）目前測試覆蓋率嚴重不足，核心邏輯（通知建立、Email發送、加密/解密設定值）沒有測試證據保護，改動時容易靜默壞掉。

## What Changes

- `packages/notifications`：為 `create-notification.ts`、`resolve-link.ts`、`welcome.ts`、`catalog.ts` 補單元測試，驗證通知內容正確建立、連結解析正確、welcome流程觸發條件正確
- `packages/mail`：為核心發送邏輯補測試，優先順序：`lib/send.ts`（實際發送入口）、`provider/index.ts`（provider選擇邏輯）、`lib/course-lifecycle.ts`（課程生命週期email觸發）、`lib/templates.ts`／`lib/i18n.ts`（模板渲染與多語系fallback）。不逐一測試每個provider adapter（mailgun/resend/postmark/nodemailer/console），只測provider選擇與fallback邏輯
- `packages/storage`：補測試驗證 provider 介面正確實作、錯誤處理（上傳失敗、檔案不存在）
- Settings：`packages/api/modules/course/lib/settings-crypto.ts` 補測試，這支涉及加密/解密，必須驗證加密後無法逆推明文、解密錯誤key時正確拋錯而非靜默回傳錯誤資料（資安相關，走加碼驗收關卡）
- 若測試過程發現加密邏輯有真實漏洞（如使用弱加密演算法、key管理不當），立即停止並回報Fish

## Non-Goals (optional)

- 不重構通知/Email/storage架構，不換provider SDK
- 不測試每個mail provider adapter的實作細節（mailgun/resend/postmark/nodemailer/console），只測選擇與fallback邏輯
- 不處理總表其他項目
- 抓到真實漏洞只記錄回報，不修復

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected specs: 無（純補測試，不變更spec行為）
- Affected code:
  - New（測試檔）：
    - `packages/notifications/src/create-notification.test.ts`
    - `packages/notifications/src/resolve-link.test.ts`
    - `packages/notifications/src/welcome.test.ts`
    - `packages/mail/lib/send.test.ts`
    - `packages/mail/provider/index.test.ts`
    - `packages/mail/lib/course-lifecycle.test.ts`
    - `packages/mail/lib/templates.test.ts`
    - `packages/mail/lib/i18n.test.ts`
    - `packages/storage/provider/s3/index.test.ts`（若`signed-url-access-review` SR未先建立）
    - `packages/api/modules/course/lib/settings-crypto.test.ts`
  - 不動：上述所有生產邏輯本身（除非發現真漏洞，回報後另行決定）
