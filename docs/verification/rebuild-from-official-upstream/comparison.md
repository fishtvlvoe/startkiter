# rebuild-from-official-upstream：ego-browser 視覺比對

> 驗證限制（先讀）：官方 `app-demo.supastarter.dev` 的 protected routes 沒有本次可用的合法 demo session；後台首頁、課程、checkout 的右側截圖因此是官方登入殼，不是登入後頁面。這三頁以本機已登入實景、共用官方 `AppWrapper`／`AuthWrapper`／`Card` 元件與官方公開 auth 骨架作降級佐證，正式上線前仍應用官方測試帳號補做一次。

驗證日期：2026-08-18（Asia/Taipei）  
瀏覽器 viewport：1920 × 988；原始截圖為 ego-browser `captureScreenshot()` 產生，並排圖縮放為 1280 × 658／每側。

## 路由與結果

| 場景 | 本機路由與結果 | 官方對照路由與結果 | 結論 |
| --- | --- | --- | --- |
| 首頁 | `http://localhost:3101/zh-tw`，GET 200 | `https://demo.supastarter.dev/`，GET 200 | PASS：Logo icon、導覽列、Hero、CTA、瀏覽器窗格骨架一致；文案依本產品改為繁中 |
| 登入頁 | `http://localhost:3000/login`，GET 200 | `https://app-demo.supastarter.dev/login`，GET 200 | PASS：無外框飄浮卡片、Password/Magic link、Email/Password、社群登入列與 footer 骨架一致 |
| 註冊頁（補充公開殼驗證） | `http://localhost:3000/signup`，GET 200 | `https://app-demo.supastarter.dev/signup`，GET 200 | PASS：Create an account 表單、按鈕、社群登入列與 footer 骨架一致 |
| 後台首頁 | 已用測試帳密登入 `http://localhost:3000/`，頁面 200 | `https://app-demo.supastarter.dev/` 無官方 demo session，307 導向 `/login` | 限制：本機後台殼可見；官方只能取得登入殼，無法聲稱受保護後台骨架一致 |
| 課程頁 | 已用測試帳密登入 `http://localhost:3000/course`，頁面 200 | `https://app-demo.supastarter.dev/course`，307 導向 `/login` | 限制：課程是 StartKiter 自有模組，官方 demo 沒有可公開比對的課程頁 |
| checkout 頁 | 已用測試帳密登入 `http://localhost:3000/checkout`，頁面 200 | `https://app-demo.supastarter.dev/choose-plan`，307 導向 `/login`；官方沒有 StartKiter `/checkout` 頁 | 限制：本機 PAYUNi checkout 殼可見；官方 pricing/checkout 只能取得登入殼 |

## 截圖

每組包含原始左右截圖與並排圖；並排圖左側為本機、右側為官方。

- 首頁：[home-local.png](./home-local.png)、[home-demo.png](./home-demo.png)、[home-comparison.png](./home-comparison.png)
- 登入：[login-local.png](./login-local.png)、[login-demo.png](./login-demo.png)、[login-comparison.png](./login-comparison.png)
- 註冊（補充公開殼）：[signup-local.png](./signup-local.png)、[signup-demo.png](./signup-demo.png)、[signup-comparison.png](./signup-comparison.png)
- 後台首頁：[backend-local.png](./backend-local.png)、[backend-demo.png](./backend-demo.png)、[backend-comparison.png](./backend-comparison.png)
- 課程：[course-local.png](./course-local.png)、[course-demo.png](./course-demo.png)、[course-comparison.png](./course-comparison.png)
- Checkout：[checkout-local.png](./checkout-local.png)、[checkout-demo.png](./checkout-demo.png)、[checkout-comparison.png](./checkout-comparison.png)

## 驗證限制

官方 `app-demo.supastarter.dev` 的 protected routes 在未登入時固定導向 `/login`，本次沒有官方 demo 帳號或可授權建立的外部測試帳號；沒有把本機測試帳密送到官方站。故首頁、登入、註冊達成官方骨架比對，後台／課程／checkout 完成「本機頁可用 + 共用官方元件 + 官方路由導向行為」降級驗證，三頁的官方登入後版面仍待取得合法官方 demo session 後補驗。
