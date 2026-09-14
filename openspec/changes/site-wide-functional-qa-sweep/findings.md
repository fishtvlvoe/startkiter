# 全站功能巡查報告 (Site-Wide Functional QA Sweep Findings)

> 巡查時間：2026-09-15 05:30 - 05:40 (UTC+8)  
> 執行工具：ego-browser (Chromium)  
> 測試目標：正式站 `https://app.startkiter.dev` 與 `https://startkiter.dev`  
> 測試帳號：`fish@fishot.com` (正式站 admin)  
> 截圖存放目錄：`/Users/fishtv/Downloads/qa-sweep-screenshots/`（工作目錄備份於 `openspec/changes/site-wide-functional-qa-sweep/screenshots/`）

---

## 摘要與統計

- **總巡查項目（Page × Viewport 組合）**：36 項
- **正常 (PASS)**：28 項
- **異常 (FAIL)**：8 項
- **未完成 (BLOCKED)**：0 項

---

## 異常問題彙整 (Bug Summary for Codex Phase 2)

| 編號 | 影響頁面 / 流程 | 視口 | 問題摘要 | 根因判斷與詳細證據 | 解決狀態 (Codex 待填) |
|---|---|---|---|---|---|
| **BUG-01** | `/course/lesson-01` | Desktop & Mobile | 影片資源載入失敗 (COEP 阻擋) | 控制台報錯 `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep`，範例影片網址 `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` 因 WebContainer 啟用的 `Cross-Origin-Embedder-Policy: require-corp` 安全標頭而被瀏覽器攔截，導致影片無法播放。需替換為同源或具備 CORS/CORP 標頭的影片資源。 | 待處理 |
| **BUG-02** | `/settings/billing` | Desktop & Mobile | 點擊「選擇方案」按鈕無反應、靜默失敗 | 前端點擊按鈕呼叫 oRPC `payments.createCheckoutLink`，後端回傳 `404 NOT_FOUND`。原因為 `packages/payments/config.ts` 中的 `startkiter-mvp` 方案價格未配置 `priceId`，導致 `getProviderPriceIdByPlanId` 回傳 null。前端 `PricingTable.tsx` 捕獲此錯誤後僅 `console.error`，無 Toast 或錯誤提示，UI 靜止在原地。 | 待處理 |
| **BUG-03** | `/admin/settings/ai-provider` | Desktop & Mobile | 正式站回傳 404 Page Not Found | `https://app.startkiter.dev/admin/settings/ai-provider` 回傳 HTTP 404。經查 VPS docker 容器 `lmfjp5suzh08plloijhha5ke-190505470890` 目前運行的 image 為 commit `46152821` (`ai-chatbot-frontend-wireup`)，合併 `ai-chatbot-provider-model-config` 的 commit `8dafa2c6` 尚未部署至 Coolify VPS 正式站。 | 待處理 |
| **BUG-04** | 側邊欄抽屜 (Mobile 淺色模式) | Mobile | 抽屜選單文字與圖示在淺色模式下嚴重發白、缺乏對比度 | 抽屜背景在淺色模式下為白色 (`#ffffff`)，但導覽項目（課程、客服、AI 助手、帳號設定、後台管理清單等）未選中狀態的文字與圖示顏色仍使用 `#c3c4c7` 等原本給深色底設計的淺灰色，對比度極低，文字幾近不可見。 | 待處理 |
| **BUG-05** | 標頭與使用者選單 (Mobile) | Mobile | 標頭重複出現兩組主題切換按鈕，且使用者彈出選單背景穿透重疊 | 1. 手機版頂部標頭在漢堡圖示下方與右側通知圖示旁同時出現了兩組 `[ 系統 / 淺色 / 深色 ]` 切換鈕。<br>2. 點擊使用者頭像展開選單時，彈出層背景半透明，下方頁面大標題「歡迎，fish yu！」直接穿透顯示在選單文字後面，造成文字交疊干擾。 | 待處理 |

---

## 詳細巡查記錄 (Page × Viewport)

### 1. 登入 / 登出 / 註冊流程

#### 1.1 行銷首頁 `https://startkiter.dev`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/marketing-home-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：首頁標題「用 StartKiter 把 AI 服務做成自己的站」、導覽列（價格、常見問題、部落格、更新紀錄、聯絡我們、登入按鈕）、主行動按鈕「查看開站包」正常渲染，深淺色切換正常。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/marketing-home-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版版面自適應正常，漢堡選單、主題按鈕與行動按鈕皆可視。

#### 1.2 登入頁面 `https://app.startkiter.dev/login`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-login-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：標題「歡迎回來」、密碼/魔法連結分頁切換、Email與密碼輸入框、登入按鈕、Google/GitHub 第三方登入按鈕、通行金鑰登入、註冊連結皆完整顯示。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-login-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版視口排版置中，各輸入框、第三方登入按鈕排列無溢出。

#### 1.3 註冊頁面 `https://app.startkiter.dev/signup`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-signup-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：標題「建立帳號」、姓名/Email/密碼輸入框、密碼強度提示（長度/大小寫/數字/特殊字元）、建立帳號按鈕、Google/GitHub 第三方按鈕皆正常渲染。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-signup-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版表單正常自適應。

#### 1.4 忘記密碼頁面 `https://app.startkiter.dev/forgot-password`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-forgot-password-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：Email 輸入框、重設密碼送出按鈕、返回登入連結正常渲染。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-forgot-password-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版排版正常。

#### 1.5 登出流程 (User Menu -> 登出)
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-user-menu-desktop.png`、`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-logged-out.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：點擊左下角 User menu 彈出選單，點擊「登出」後順利清除 Session 並重新導向至 `https://app.startkiter.dev/login`。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-user-menu-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版點擊右上角 User menu，亦具備「帳號設定」與「登出」項目，點擊後可完成登出。

#### 1.6 登入流程 (Google OAuth)
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-logged-in-via-google.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：在 `/login` 點擊「Google」按鈕導向 Google OAuth 授權頁，選取 `fish@fishot.com` 完成驗證後，順利跳轉回 `https://app.startkiter.dev/` 並恢復管理員狀態。
- **Mobile (390×844)**: `正常`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：Google OAuth 授權回調共用相同後端 session callback，手機版回到首頁認證正常。

---

### 2. `/course` 課程瀏覽與觀看

#### 2.1 課程列表頁 `/course`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/course-list-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：顯示課程說明「買斷後可看全部單元」、單元列表（1. 開站包是什麼、為什麼要買斷；2. 站殼、登入與結帳路徑；3. 課程模組與權限閘門）、開始觀看按鈕、課程評價區塊皆正常渲染。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/course-list-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版單元列表與開始觀看按鈕正常，底部四分導覽列（開始/課程/客服/更多）正常顯示。

#### 2.2 單元觀看頁 `/course/lesson-01`
- **Desktop (1280×800)**: `異常` (BUG-01)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/course-lesson-01-desktop.png`
  - 網路錯誤：0
  - 控制台錯誤：`Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` (URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`)
  - 驗證說明：頁面講義大綱「教室 · 1-1 商業與產品架構總覽 (電馭學院)」、章節導覽、本節講義、單元留言區皆正常渲染；但影片播放器中的外部示範影片 `flower.mp4` 因 COEP 阻擋而載入失敗，播放器黑屏無法播放。
- **Mobile (390×844)**: `異常` (BUG-01)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/course-lesson-01-mobile.png`
  - 網路錯誤：0
  - 控制台錯誤：`Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` (URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`)
  - 驗證說明：與 Desktop 相同，單元大綱與講義留言正常，但影片載入受 COEP 阻擋。

---

### 3. `/bundles` 組合包瀏覽

#### 3.1 組合包空清單頁面 `/bundles`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/bundles-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：頁面標題「組合包」、說明「瀏覽已上架的課程組合，點進去看詳情與購買。」以及空清單狀態「目前沒有已上架的組合包。」正確顯示，版面整潔。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/bundles-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版空清單狀態排版置中無破版。

---

### 4. `/ai` AI 助手對話

#### 4.1 AI 助手串流對話 `/ai`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/ai-desktop-before.png`、`/Users/fishtv/Downloads/qa-sweep-screenshots/ai-desktop-after.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：初始顯示「跟 AI 助手說點什麼吧。」輸入「你好，請用一句話介紹 StartKiter」點擊送出後，成功接收串流回覆：「StartKiter 是一個專注於幫助創業者和小型企業實現商業增長的多功能平台，提供了工具、資源和指導。」無任何錯誤。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/ai-mobile-after.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版介面輸入「哈囉，請回覆測試成功」，AI 成功回傳「哈囉，測試成功！有什麼我可以幫助你的嗎？」，輸入框與氣泡在手機寬度下渲染正常。

---

### 5. `/settings/billing` 帳單/訂閱頁

#### 5.1 方案檢視 `/settings/billing`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/settings-billing-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：次級導覽（一般/安全性/帳單/通知）高亮「帳單」；「你的方案」顯示「免費（使用中）」；「變更方案」卡片正確列出「StartKiter 開站包」推薦標籤、三項權益與金額 `$8,800.00`。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/settings-billing-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版卡片垂直堆疊，各標籤與金額文字無跑版。

#### 5.2 方案購買點擊流程
- **Desktop (1280×800)**: `異常` (BUG-02)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/billing-after-select-plan.png`
  - 網路/API 錯誤：呼叫 `/api/rpc/payments/createCheckoutLink` 回傳 HTTP 404 (`{"code":"NOT_FOUND"}`)
  - 控制台錯誤：內部拋出未處理異常被 catch 後 silent 忽視
  - 驗證說明：點擊「選擇方案」按鈕後，無跳轉亦無錯誤提示。經程式碼溯源，`packages/payments/config.ts` 中的 `startkiter-mvp` 方案價格未指定 `priceId`，導致 `getProviderPriceIdByPlanId` 回傳 null，後端拒絕建立結帳連結；前端 `PricingTable.tsx` 僅 `console.error` 且無 Toast 告知使用者，形成死按鈕。
- **Mobile (390×844)**: `異常` (BUG-02)
  - 驗證說明：與 Desktop 相同，按鈕點擊後後端回傳 404，前端無任何反饋。

---

### 6. 後台 6 個管理頁面

#### 6.1 組織管理 `/admin/organizations`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-organizations-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：後台導覽次選單正常顯示，頁面標題「組織 Manage organizations」、Create 按鈕與「No results.」表格空狀態正常渲染。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-organizations-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機寬度下表格自適應顯示無溢出。

#### 6.2 訂單管理 `/admin/orders`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-orders-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：訂單列表標題、「匯出活公式 Excel」按鈕、正式站既有測試訂單（SK20260911... pending · startkiter-mvp · NT$ 8,800 尚未開票）均正常顯示。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-orders-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：訂單項目在手機卡片佈局中正常堆疊，狀態徽章清晰。

#### 6.3 營收報表 `/admin/revenue`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-revenue-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：標題「營收結算」、「匯出活公式 Excel」按鈕、說明「營收結算以已付款訂單彙整」與表格欄位正常渲染。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-revenue-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版表格與匯出按鈕排版正常。

#### 6.4 收款閘道設定 `/admin/settings/checkout-gateway`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-checkout-gateway-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：子導覽選單（收款閘道設定/發票設定/Gemini 設定）正常切換；「一次性結帳金流」狀態顯示「目前金流：payuni；Shopline：未設定；Stripe：未設定」；PAYUNi/Shopline/Stripe 表單欄位皆可視可填。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-checkout-gateway-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：表單欄位在手機視口下皆能正確折行，按鈕可觸控。

#### 6.5 台灣統一發票設定 `/admin/settings/einvoice`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-einvoice-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：綠界 ECPay / 藍新 ezPay 選項切換正常，賣方名稱、統編、商店代號、Hash Key、Hash IV 表單皆完整呈現。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-einvoice-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版表單欄位顯示清晰。

#### 6.6 Gemini API Key 設定 `/admin/settings/gemini`
- **Desktop (1280×800)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-gemini-desktop.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：標題「Gemini API Key」、加密儲存提示、「目前狀態：未設定」、密碼輸入框與儲存設定按鈕皆正常渲染。
- **Mobile (390×844)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-gemini-mobile.png`
  - 網路錯誤：0 / 主控台錯誤：0
  - 驗證說明：手機版版面整潔無異常。

---

### 7. `/admin/settings/ai-provider` AI 供應商模型設定頁

#### 7.1 AI 供應商設定頁 `/admin/settings/ai-provider`
- **Desktop (1280×800)**: `異常` (BUG-03)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-ai-provider-desktop.png`
  - 網路錯誤：`404 https://app.startkiter.dev/admin/settings/ai-provider`
  - 控制台錯誤：`Failed to load resource: the server responded with a status of 404 ()`
  - 驗證說明：瀏覽器顯示 Next.js 預設「404 Page not found」。經查 VPS 部署狀態，Coolify 上的 SaaS 容器目前為 `lmfjp5suzh08plloijhha5ke:4615282117d39fd0aed7f140765f6224d552a5e0`（commit `46152821`），尚未部署新增該路由的 commit `8dafa2c6` (`ai-chatbot-provider-model-config`)。
- **Mobile (390×844)**: `異常` (BUG-03)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/admin-settings-ai-provider-mobile.png`
  - 網路錯誤：`404 https://app.startkiter.dev/admin/settings/ai-provider`
  - 控制台錯誤：`Failed to load resource: the server responded with a status of 404 ()`
  - 驗證說明：手機版同為 404。

---

### 8. 側邊導覽在深色/淺色模式下的視覺正確性

#### 8.1 Desktop 側邊導覽
- **深色模式 (Dark Mode)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/sidebar-desktop-dark.png`
  - 驗證說明：WordPress 風格側欄 `#1d2327`，選中項為亮藍色實心按鈕，未選中項為淺灰文字，在深色背景下具備良好對比度與易讀性。
- **淺色模式 (Light Mode)**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/sidebar-desktop-light.png`
  - 驗證說明：主內容區切換為白色背景，側邊欄維持經典深色導覽列，文字清晰可辨；惟導覽列右側存在一條白色垂直原生捲軸。
- **側邊欄收合與展開**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/sidebar-desktop-collapsed.png`
  - 驗證說明：點擊側欄邊緣拖拉收合按鈕，側欄平滑縮小為窄版純圖示模式；再次點擊展開恢復完整文字選單。

#### 8.2 Mobile 側邊導覽與抽屜
- **Mobile 深色模式抽屜**: `正常`
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/sidebar-mobile-dark-open.png`
  - 驗證說明：點擊漢堡選單展開抽屜，抽屜背景為 `#121212`，圖示與文字對比良好。
- **Mobile 淺色模式抽屜**: `異常` (BUG-04)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/sidebar-mobile-light-settled.png`
  - 驗證說明：在淺色模式下點擊漢堡選單開啟抽屜，抽屜背景變為純白 (`#ffffff`)，但導覽項目的文字與圖示色彩未切換為深色文字，仍沿用 `#c3c4c7` 等淺灰色，導致文字與背景色差極小，肉眼難以看清選單項目。
- **Mobile 標頭與選單排版重疊**: `異常` (BUG-05)
  - 截圖：`/Users/fishtv/Downloads/qa-sweep-screenshots/auth-user-menu-mobile.png`
  - 驗證說明：
    1. 手機頂部標頭同時存在兩個「系統/淺色/深色」的主題切換組（一個漂浮在左側漢堡選單正下方，另一個在右側鈴鐺通知旁），出現元件重複渲染。
    2. 點擊右上角使用者選單時，彈出選單背景為半透明模糊，後方主內容標題「歡迎，fish yu！」會大面積穿透並與選單項目「帳號設定 / 登出」交錯，造成文字遮蔽難讀。
