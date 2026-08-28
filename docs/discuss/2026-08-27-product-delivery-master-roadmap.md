# 2026-08-27 StartKiter 上線交付總覽（大張總表）

給誰看：Fish。目的：一次看完「全部功能做到哪、還剩什麼、怎麼排」，不用一直回頭問。

## 1. 全功能盤點表（依 Core 模組 + 交付面向）

| # | 功能模組 | 狀態 | 完成度 | 說明 |
|---|---|---|---|---|
| 1 | 認證登入（Google/LINE） | ✅完成 | 已封存 | `packages/auth/`，Better Auth，底層為準，課程包舊系統不抽 |
| 2 | 課程播放引擎 | ✅完成 | 43/43 已封存 | `packages/course/`，MDX + 7 積木 |
| 3 | 後台外殼／Plugin 掛載機制 | ✅完成 | 129/129 已封存 | `packages/platform/`，Mount Points/PluginContent/Marketplace |
| 4 | 通知系統（Email/LINE） | ✅完成 | 已封存（spectra 顯示錯誤，已查證是工具殘留檔） | `packages/notifications/`、`packages/mail/` |
| 5 | 客服系統 Chatwoot | 🟡進行中 | 51/55 | `support.startkiter.dev` 真的活著（curl 200） |
| 6 | 金流結帳（PAYUNi/Shopline/Stripe） | 🟡進行中 | 12/14 | 剩正式 Stripe 帳號憑證，卡 Fish |
| 7 | 訂閱與發票（ECPay/ezPay） | 🟡進行中，處理中 | 21/22 | 正在用 Fish 正式 ezPay 帳號做真實開票→作廢驗證 |
| 8 | **官網首頁部署** | ❌壞的 | SR已寫好未apply | `startkiter.dev` 現在 503，最急 |
| 9 | 行銷頁面真實內容 | ❌未做 | SR已寫好未apply | 定價/首頁還是 supastarter 假資料 |
| 10 | 買家文件站 | ❌未做 | SR已寫好未apply | `docs.startkiter.dev`，Fumadocs |
| 11 | 乾淨安裝包倉庫 | ❌未做 | SR已寫好未apply | 買家最終拿到的乾淨代碼包，目前完全空白 |

**整體完成度：約 7 成**（地基類 1-4 全部做完；交付面向 8-11 完全還沒開始）。

## 2. 排隊順序（小張 SR，Codex 依序做，我驗收）

```
subscriptions-invoice 22/22（2026-08-27 已完成，待 PM 獨立查證）
    ↓
1. vps-production-deployment（14項）— 修官網503，最急
    ↓
2. marketing-site-real-content（17項）— 換真實內容
    ↓
3. buyer-docs-site（13項）— docs.startkiter.dev
    ↓
4. plan-clean-install-package-repo（10項）— 交付乾淨代碼包
    ↓
5. course-lifecycle-email（13項）— 訂閱到期等生命週期通知（2026-08-27 Fish 確認加入）
```

**注意**：這份文件只是給 Fish 看的地圖，不是 Spectra 正式資料。實際追蹤在 Spectra 系統裡的 5 張 change（`vps-production-deployment`／`marketing-site-real-content`／`buyer-docs-site`／`plan-clean-install-package-repo` 為 parked，`course-lifecycle-email` 為 in-progress 未 apply）。

每張：Codex 寫碼 → test/type-check/build → 獨立 CR（全新 context）→ 無 Critical 才進下一張。archive 一律回報 Fish 決定，不自動 archive。

## 3. UI/UX 整合現況（Fish 要求思考的部分，這是初稿，要跟 Fish 對）

目前是 3 個獨立網域，各管各的，沒有統一導覽：

```
startkiter.dev          （行銷首頁，賣點/定價/簽約）
   ↓ 「開始使用」按鈕
app.startkiter.dev      （買家登入後的真正產品：課程後台、Shell外殼、Plugin）
   ↓ 「說明文件」連結（還沒接，因為 buyer-docs-site 還沒做）
docs.startkiter.dev     （買家自己開發時查的技術文件）
   ↓ 「需要協助」按鈕（已存在）
support.startkiter.dev  （Chatwoot 客服）
```

**現況缺口**：
- `app.startkiter.dev` 後台目前已有 53 個 `settings/` 頁面（含剛做的 `settings/einvoice`），但**還沒有一個總覽儀表板告訴買家「你現在的 SaaS 使用狀態」**（例如：已裝了哪些 Plugin、目前流量、課程銷售數字）。
- 4 個網域之間互相沒有導覽連結（首頁按鈕連不到文件站，因為文件站還不存在）。

**初步建議（要跟 Fish 對，不是定案）**：
- `buyer-docs-site` apply 時，順便在 `app.startkiter.dev` 後台加一個「文件」選單項（用既有 Plugin 掛載機制的 `menu` mount point，不用另外開發）。
- `vps-production-deployment` 修完官網後，行銷首頁的「開始使用」按鈕要導到 `app.startkiter.dev/signup`（現在很可能是死連結或導到 supastarter demo）。

## 4. SaaS 功能合併現況（Fish 要求，這段也是初稿）

「合併」指的是：底層 5 個 Core 模組 + 課程包抽取進來的功能，有沒有真的接成一個產品，而不是各自散落。目前檢查：

| 合併點 | 狀態 |
|---|---|
| 付款成功 → 自動開票 | ✅已接（`triggerInvoiceForOrder` 共用函式，PAYUNi/Shopline/Stripe 都會呼叫） |
| 付款成功 → 課程權限開通 | ✅已接（既有 Order/CourseSubscription 流程） |
| Plugin 掛載 → 後台選單 | ✅已接（`packages/platform` Mount Points） |
| 發票設定 → 後台可視化操作 | ✅已接（`settings/einvoice` 頁面） |
| 課程系統 → 通知系統（完課提醒等） | 🟡部分：`course-lifecycle-email` 這張卡 0/13，是「付款成功後除了 welcome 通知，其他生命週期事件（如訂閱到期提醒）還沒接」 |
| 行銷頁定價 → 真實金流方案 | ❌未接：`packages/payments/config.ts` 現在還是 supastarter demo 假方案，不是你的 NT$8800 一次買斷 |

## 5. 我需要 Fish 確認的地方

1. 第 3 節 UI/UX 建議只是我的初稿，你要不要調整？
2. 第 4 節「課程生命週期通知」(`course-lifecycle-email`) 目前排在四張隊列之外，要不要一起排進去？
3. 你之前問的「發票供應商」問題已經在處理（用正式帳號跑真實 E2E），這張表會隨結果更新。
