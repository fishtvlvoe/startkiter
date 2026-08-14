▋ StartKiter

給台灣已在用 AI 做服務的人：一堂課 + 終身代碼包。對外課名可用「開站包」。現行產品定義以 `mvp-test-scope` 為準。

MVP 是用這包自己的站賣課。課程是課程模組，不是整站唯一長相。結帳鎖 NT$8800，主金流只接通 PAYUNi 一次買斷。付款後在站內領取代碼：GitHub 登入，系統邀請組織私人倉庫只讀。課程裡有 LINE 學員交流群加入連結（付費才看得到）。客服走 email，不進這個群。

這不是 libon.me。學員拿到的是另一個私人倉庫讀取權，不是 ZIP。

【現在這 repo 有什麼】

Git。Spectra（`openspec/`）。架構討論稿（`docs/discuss/`）。還沒抽 Next.js 應用程式碼。本 change 只落地規格，下一張 extract 才搬代碼。

【來源（只讀）】

殼：`supastarter-nextjs-main`

台灣金流／訂單與課程觀看模組：`THE-TU-Project/dev/thetu`（只抽觀看／金流，不抽學院營運）

LINE 登入契約：`8-外掛/line-hub` 網頁 OAuth（不搬 PHP）

【MVP 怎麼賣】

→ 銷售頁

→ PAYUNi 結帳 8800 TWD

→ 站內看課（課程模組）

→ 站內領取代碼（GitHub 只讀邀請）

→ 課程內加入 LINE 交流群

【硬邊界】

PAYUNi 沒設金鑰時結帳必須 fail-closed，不能空白 500。

不做組織多租戶。帳單掛 user。

LINE Login Channel 做登入。學員社群是邀請連結，不能靜默入群。不做 SKOOL。

金鑰填後台。發票不在 MVP。

【已廢（不是現行規則）】

「不是賣課平台」「四堂課對 SHOPLINE」「主金流 SHOPLINE」已廢。細節看 `docs/discuss/v1-boundary.md` 開頭的取代聲明。

【網域】

盯 `startkiter.com`，備案 `startkiter.me`。下單前再查 whois。沒買到先用 Zeabur 子網域，不准借 libon.me。

【下一步】

對「抽殼＋PAYUNi＋課程模組＋GitHub 履約」開 extract change，再開始搬代碼。不要在 Development 根目錄開施工單。不要改來源 repo。
