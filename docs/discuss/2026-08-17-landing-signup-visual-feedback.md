# 首頁 / 註冊頁視覺回饋（2026-08-17）

來源：Fish 用 Orca design-feedback 工具在瀏覽器上標註，dev server `http://localhost:3001`。

## 1. 首頁 `/`

**選取元素**：`.home-main > .ds-container > nav[aria-label="主要導覽"] > .nav-links`（登入／註冊／語系切換／深淺色切換）

**Fish 原話**：
> 這個地方跟我要的不一樣。我希望你能用跟原本網頁一樣的方式呈現，也就是我們買的那一個頁面。它上面的銷售頁不是都有一些圖片嗎？我想請你用 Midjourney 去做圖片的生成，先假設我們跟它是一模一樣的產品，之後我們再慢慢去做調整和細節的規劃。因為現在這邊長得基本上完全不一樣。我要的是他這樣的 https://supastarter.dev/

**要點**：
- 目標視覺基準：https://supastarter.dev/ 官網本身的呈現方式（不是目前 `apps/saas` 手刻的簡化版）
- 銷售頁缺圖，要用 Midjourney 生成
- 先假設 StartKiter 產品內容跟 supastarter.dev 官網賣的東西一模一樣去產圖，細節之後再調整（不要卡在「內容還沒定案」上）

## 2. 註冊頁 `/signup`

**選取元素**：`main`（整個註冊表單區塊，card 樣式 + 表單）

**Fish 原話**：
> 這個也不一樣，你看暗色系跟原本的那個畫面，它是完全不同的。

**要點**：
- 暗色系配色跟 supastarter.dev 原版不一致

## 現況調查（PM 初步查過，未動手改）

- `apps/saas/app/` 下首頁、signup、login 等頁面是手刻的（`page.tsx` 直接寫 HTML/CSS class，如 `nav-links`、`ds-container`），沒有套用 supastarter 官方 marketing/auth 頁面元件
- 本機有 supastarter 原始碼可參考（唯讀來源，禁止直接複製耦合，只能參考視覺/結構）：
  - `/Users/fishtv/Development/supastarter-nextjs`
  - `/Users/fishtv/Development/dev-code/supastarter-nextjs-main`
- `repo-foundation` change 的 tasks.md 明寫「本階段不建立 Next.js 空殼」——代表目前 `apps/saas` 的首頁/signup 是後續某個 change（待查是哪個）建的，非 repo-foundation 範圍

## 下一步

交派工師：查清楚 `apps/saas` 首頁/signup 現況出自哪個 change、判斷要不要先開新 Spectra change 走 propose，再拆給 Codex 做視覺對齊 + Midjourney 產圖，交付前用 git diff 驗收再回報。
