## Why

盤點過程中發現 4 個各自獨立、但都是「明確要修」的問題，跟功能缺口 SR（`course-platform-feature-parity`）分開，因為性質不同——這份全是修復既有問題，不是新功能：

1. **NavBar 沒接上 SR-01 的 resolveNavigation**：`role-based-workspace-navigation` change 已把 `WorkspaceContext`/`resolveNavigation` 邏輯寫好並測試過，但 `NavBar.tsx` 從未真的呼叫它，還是用舊的布林值判斷，導致總管理員進 App 看不到該 App 對應的管理員身份與設定
2. **頭像上傳失敗**：`UserAvatarUpload.tsx` 呼叫簽名上傳 URL 失敗時，錯誤被整個吞掉；根因疑似 `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` 環境變數缺漏
3. **客服按鈕擋畫面**：`SupportWidget.tsx` 固定在右下角，不能收合、不能移動，會擋住頁面內容
4. **電子報自動寄送分支沒合併**：`fishtvlvoe/newsletter-automation-integration`（7 個 commit）寫完的自動寄送引擎從未合併進 `main`，且與 main 上已有的退訂/同意權限邏輯有 14 個檔案衝突，需要仔細比對合併，不能盲目二選一

## What Changes

### 1. NavBar 接上 resolveNavigation
- `NavBar.tsx` 改為呼叫 `packages/platform/src/workspace/navigation.ts` 的 `resolveNavigation`，依 `WorkspaceContext` 動態顯示對應身份與選單
- 補上「總管理員進課程 App 應顯示課程管理員身份」這個目前完全沒被測到的案例

### 2. 頭像上傳修復
- 確認/補齊 S3 環境變數（本機若無可用測試環境，明確標記卡住，不假裝驗證過）
- `onCrop` 的錯誤處理不再整個吞掉，顯示具體失敗原因

### 3. 客服按鈕位置修復
- 改成可收合/可關閉，不擋內容，功能（`handleOpenChat`）不變

### 4. 電子報分支合併
- 合併 `fishtvlvoe/newsletter-automation-integration` 的自動寄送引擎進 `main`
- 遇到 `packages/database/prisma/schema.prisma`、`packages/mail/provider/*` 衝突時採用 main 版本（已確認更完整）
- `packages/newsletter/`、`unsubscribe`、`email-consent`、`SignupForm.tsx`、`checkout` 相關的實際邏輯衝突需逐一核對兩邊行為語意是否一致，無法安全判斷時停下回報，不能自行二選一

## Non-Goals

- 不在這份處理 `course-platform-feature-parity` 那 4 項新功能（另案）
- 不順手重構 NavBar 以外的選單元件
- 不擴大電子報系統功能範圍，只做「把已寫好的自動寄送引擎安全合併進 main」

## Capabilities

### Modified Capabilities

- `role-based-workspace-navigation`: NavBar 選單邏輯改為呼叫 `resolveNavigation`，這是既有 SR-01 規格的真正落地，不是新規格
- `user-avatar-upload`: 上傳失敗時的錯誤呈現行為改變（原本靜默失敗，改為顯示具體錯誤）
- `support-widget-placement`: 客服按鈕的呈現方式改變（原本固定不可收合，改為可收合）
- `newsletter-send-engine`: 電子報系統新增自動寄送能力（原本只有基礎設定，沒有寄送引擎）

## Impact

- **前端**：`apps/saas/modules/shared/components/NavBar.tsx`、`apps/saas/modules/settings/components/UserAvatarUpload.tsx`、`apps/saas/modules/deployment/components/SupportWidget.tsx`
- **後端/資料庫**：`packages/newsletter/*`、`packages/mail/provider/*`（合併時保留 main 版本）、電子報相關 API 路由
- **環境變數**：需要確認正式站與本機的 S3 相關變數是否齊全
- **風險最高項目**：電子報分支合併（涉及使用者同意/退訂的合規邏輯，需要仔細核對，不可用猜的）
