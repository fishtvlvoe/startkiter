## 1. OAuth Redirect URI 修復（致命阻擋）

- [x] 1.1 依 Decision: OAuth redirect URI 修復走 ego-browser 直接操作外部後台，不走 API，用 ego-browser 登入 GitHub OAuth App（Client ID `Ov23liN07Ec8UuJAAJtb`）後台設定頁，交付 Requirement「OAuth provider redirect URI matches the deployed domain」的 GitHub 情境：新增 Authorization callback URL `https://app.startkiter.dev/api/auth/callback/github`（保留既有值不刪除）。驗證：ego-browser 實測完整 GitHub 登入流程，截圖顯示成功回到 `app.startkiter.dev` 並建立 session，不是 `Invalid Redirect URI` 錯誤頁。
- [ ] 1.2 用 ego-browser 登入 Google Cloud Console 該 OAuth 2.0 用戶端（Client ID `101278174843-...`）設定頁，交付 Requirement「OAuth provider redirect URI matches the deployed domain」的 Google 情境：新增已授權的重新導向 URI `https://app.startkiter.dev/api/auth/callback/google`（保留既有值不刪除）。驗證：ego-browser 實測完整 Google 登入流程，截圖顯示成功回到 `app.startkiter.dev` 並建立 session，不是 `redirect_uri_mismatch` 錯誤頁。

## 2. 品牌殘留與佔位文字清理

依 Decision: 品牌殘留與佔位文字修復走一般代碼 PR，不特別隔離，以下 4 項合併成一批處理：

- [x] 2.1 修改頁面 metadata 設定，交付 Requirement「GitHub login when configured」所在頁面（登入/註冊/結帳/課程等）的 `<title>` 顯示 StartKiter 相關文字：不含 `supastarter for Next.js Demo` 字樣。驗證：`curl -s https://app.startkiter.dev/login | grep -io "supastarter for Next.js Demo"` 無輸出。
- [x] 2.2 移除登入／註冊頁 footer 元件中的「Built with supastarter」對外連結，交付乾淨買家體驗的行為：該連結不再出現。驗證：`curl -s https://app.startkiter.dev/login | grep -i "supastarter.dev"` 無輸出。
- [x] 2.3 移除 `app.startkiter.dev` 首頁殘留的英文佔位文字 `Place your content here...`，換成實際內容或移除該區塊，交付首頁不顯示未完工痕跡的行為。驗證：ego-browser 截圖確認該區塊不再顯示佔位字，或改顯示實際內容。
- [x] 2.4 修正 App 側邊欄「客服」標籤的連結，交付連結指向真實客服管道（email 相關頁面或說明）而非 `/chatbot` Demo 範例頁的行為。驗證：該連結的 `href` 屬性不含 `/chatbot`，ego-browser 點擊後確認導向內容與「客服」標籤相符。

## 3. 手機版導航修復

- [ ] 3.1 修復手機版（400px 寬）首頁 Header 缺少漢堡選單的問題，交付手機訪客能從 Header 找到登入/聯絡我們/價格入口的行為。驗證：ego-browser 在 400px 視窗截圖顯示漢堡選單按鈕存在，點擊後選單展開並顯示這些連結。

## 4. Review

- [ ] 4.1 Review：執行 `spectra analyze startkiter-buyer-flow-critical-fixes --json` 確認 change 內部一致性，交付無 Critical／Warning 的驗證通過行為。驗證：指令輸出不含 Critical／Warning 等級 finding。
