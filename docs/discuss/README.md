▋ 台灣 SaaS 教學 starter 討論紀錄

一句話結論：開全新教學 repo，從 supastarter 抽繁中前後台殼，從 THE-TU `dev/thetu` 抽台灣金流、電子發票與 Simple-first 啟用方式，LINE 登入新做；原專案不動，代碼可一次齊、預設全關、課分堂打開。

資料夾工作名稱：`products/startkiter`。獨立新專案，不掛 libon.me（那是客戶平台）。網域盯 `startkiter.com`／`startkiter.me`。

• [architecture-draft.md](./architecture-draft.md) 整包怎麼運作、要不要另派 agent、資料夾命名

本資料夾是架構討論紀錄。產品規格以這個 repo 的 `openspec/` 為準。舊檔 `docs/teaching-starter-教學專用版-SOP.md` 的 v1（不要登入、不要後台、不要金流）已被這次需求推翻，不要沿用。

• [2026-08-14-alignment.md](./2026-08-14-alignment.md) 今日對焦圖與決定

• [2026-08-14-thetu-source.md](./2026-08-14-thetu-source.md) THE-TU 優化版看完後：改抽來源、Simple-first、SHOPLINE 不做訂閱

• [line-login-from-line-hub.md](./line-login-from-line-hub.md) WordPress LINE 登入能接什麼：協定可以，PHP 與 LIFF 不能搬

• [v1-boundary.md](./v1-boundary.md) v1 能力清單：抽什麼、不抽什麼、什麼是新做

• [payment-and-deploy.md](./payment-and-deploy.md) 主金流 SHOPLINE、部署 Zeabur 類常駐 Node

• [organizations.md](./organizations.md) v1 不抽 supastarter 組織多租戶

• [extract-map.md](./extract-map.md) 對到檔案的抽取清單
