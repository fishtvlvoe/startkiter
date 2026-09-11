## Why

2026-09-11 對 https://startkiter.dev / https://app.startkiter.dev 做端到端買家流程實測（Agy + ego-browser，非猜測），發現 GitHub／Google OAuth 登入雙雙壞掉（redirect URI 未設定），買家唯一的登入方式全部走不通，等於產品雖已部署上線但實際上無法完成購買後領取代碼包的核心流程。另外發現 5 個非阻擋但影響專業度與買家體驗的殘留問題（supastarter 品牌殘留、佔位文字、手機版導航缺陷、客服連結誤導）。

## What Changes

- 修復 GitHub OAuth App（Client ID `Ov23liN07Ec8UuJAAJtb`）的 Authorization callback URL，補上 `https://app.startkiter.dev/api/auth/callback/github`
- 修復 Google Cloud OAuth 2.0 用戶端（Client ID `101278174843-...`）的已授權重新導向 URI，補上 `https://app.startkiter.dev/api/auth/callback/google`
- 修掉手機版（400px）首頁 Header 缺少漢堡選單的問題，補上摺疊導航入口
- 移除頁面 `<title>` 殘留的 `supastarter for Next.js Demo` 字樣，換成 StartKiter 品牌標題
- 移除登入/註冊頁頁尾的「Built with supastarter」對外導流連結
- 移除 `app.startkiter.dev` 首頁殘留的英文佔位文字 `Place your content here...`，換成實際內容或移除該區塊
- 修正 App 側邊欄「客服」標籤的連結，不要指向 `/chatbot`（OpenAI Demo 範例頁），應指向 email 客服管道或移除該入口

## Non-Goals

- 不啟用 Chatwoot 產品站 widget（維持 `NEXT_PUBLIC_SUPPORT_CHANNEL=email` 現行設定）
- 不重新設計首頁或定價頁版面，只修復列出的具體缺陷
- 不處理 `chatwoot-data-access-renewal-and-oauth` 或其他跟本次買家流程測試無關的既有 SR

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `auth-login`：登入機制需涵蓋「OAuth redirect URI 已正確設定且可完成授權」的行為要求

## Impact

- Affected specs: `auth-login`（修改）
- Affected code:
  - Modified: `apps/marketing/app/layout.tsx` 或對應的 metadata 設定檔（title 修正）、`apps/saas/app/(authenticated)/(main)/(account)/page.tsx` 或會員首頁對應檔案（佔位文字）、`apps/saas` 側邊欄導航設定檔（客服連結）、`apps/marketing` 與 `apps/saas` 共用的登入/註冊頁 footer 元件（移除 supastarter 連結）、行動版導航元件（漢堡選單）
  - New: 無
- Dependencies 新增：無
- 環境變數新增：無（僅外部 OAuth App 後台設定變更，非本 repo 環境變數）
