▋ StartKiter

給台灣小白用 AI（Cursor）架起來的 SaaS 教學模板。對外課名可用「開站包」。

學員帶走獨立 repo：繁中前台與後台、Google／LINE 登入、SHOPLINE 一次買斷（TWD）、電子發票接同一筆訂單。程式可以一次齊，功能預設全關，課分四堂打開。

這不是賣課平台。這不是 libon.me。

【現在這 repo 有什麼】

Git。Spectra（`openspec/`）。架構討論稿（`docs/discuss/`）。還沒抽 Next.js 應用程式碼。

【來源（只讀）】

殼：`supastarter-nextjs-main`

台灣金流／發票／Simple-first：`THE-TU-Project/dev/thetu`

LINE 登入契約：`8-外掛/line-hub` 網頁 OAuth（不搬 PHP）

【四堂課】

→ 1 繁中前後台能開

→ 2 Google，然後 LINE

→ 3 SHOPLINE 測一筆付款

→ 4 同一筆訂單開發票

【硬邊界】

SHOPLINE 不做訂閱。v1 不做月繳。

不做組織多租戶。

LINE 只做 Login Channel。

金鑰填後台。沒設金流不能 500。

發票預設關。

【網域】

盯 `startkiter.com`，備案 `startkiter.me`。下單前再查 whois。沒買到先用 Zeabur 子網域，不准借 libon.me。

【下一步】

在這個 repo 裡對「抽殼＋台灣金流」開 Spectra change，再開始搬代碼。不要在 Development 根目錄開施工單。
