▋ THE-TU 優化版看完之後

狀態：confirmed（2026-08-14）

老闆指的優化版是 `THE-TU-Project/dev/thetu`（對外叫 WooMin / Course Realms 1.8.0），不是根目錄的 `code/`（那份還停在 1.0.0）。更不是另一套 SaaS。它還是賣課系統。NextAuth。沒有 LINE Login。

【它到底優化了什麼】

Simple-first：啟動只硬要 `DATABASE_URL`。Google、Apple、Email、S3、Cloudflare Stream 全部「上線後再打開」。見 `dev/thetu/docs/simple-first-platform-plan.md`。

Setup flow：管理員進 `/admin/setup`，Email／OAuth 可跳過。這才是給非工程師的啟用，不是叫人先填二十個 .env。

客戶交付：每個人自己的 GitHub + Zeabur workspace + PostgreSQL + `/data` volume。Vendor 不代管金鑰。入口在 `docs/deployment/AGENT.md`、`docs/customer-deployment.md`。

金流／發票從綜合設定拆成 `/admin/payments` 兩個分頁。發票預設關閉，沒開時結帳不收載具、不開立。跟 Simple-first 同一條原則。

金流閘道檔案集合跟舊的 `realms-course-platform-v1.8.0/lib/payment` 同一組。主推仍是 SHOPLINE。差在外圍：可跳過、後台填、沒設金流時銷售頁不能 500。

【它沒有優化成什麼】

沒有變成 supastarter 那種前後台 SaaS 殼。

沒有 LINE。

沒有把課程目錄拿掉。影片、作業、電子報都還在。

SHOPLINE 在這版被寫死「不做訂閱」。`lib/payment/subscription-support.ts`：stripe true、payuni true、shopline false。理由是要嵌入式綁卡 + 3DS，跟現有導轉式不同。

【對教學 starter 的修正】

台灣金流／發票的抽取來源，從 `realms-course-platform-v1.8.0` 改成 `THE-TU-Project/dev/thetu`。舊副本不再當 SSOT。`THE-TU-Project/code` 也不用。

要偷的不是賣課產品，是這三件事：

• Simple-first：模板能先上線，金流、發票、OAuth 當開關

• 金鑰填後台、.setup 可跳過

• 客戶自己的 Zeabur／GitHub 交付包，不要共用主機

這跟「程式一次齊」不衝突：代碼裡可以有 SHOPLINE、發票、LINE，預設全關。課第 1 堂只開前後台。這其實就是你已經在 THE-TU 驗證過的教法。

【對先前假設的挑戰】

先前把 SHOPLINE 當教學主金流，是對的（導轉、後台填 key）。但如果以後課要教「月繳 SaaS」，SHOPLINE 這條路在 THE-TU 已經自己放棄了。月繳只能走 PAYUNi 或 Stripe。v1 一次買斷可以繼續 SHOPLINE；不要假裝 SHOPLINE 以後能長出訂閱。

先前怕「v1 一次到位會教不完」。THE-TU 的答案已經寫在產品裡：功能做進去、預設關掉、setup 可跳過。教學版應該抄這個，不要抄「第一堂就開發票」。

【不抽】

`dev/thetu` 的課程、章節、影片、作業、電子報、onboarding skill 裡跟賣課話術綁死的部分。

`dev/wumin-customer-template` 的「如何交付」可以當教學部署課參考，不要把課程平台 repo 邊界搞混。
