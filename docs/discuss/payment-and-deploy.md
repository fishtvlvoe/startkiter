▋ 主金流與部署

狀態：partially superseded（2026-08-15）

▋ 現行規則（以 openspec/specs 為準）

MVP 主金流只接通 PAYUNi，一次買斷 TWD，結帳鎖 8800。Shopline／Stripe 不接線、不上課、不出現在結帳。發票不在 MVP。

部署仍有效：常駐 Node（Zeabur 類）+ PostgreSQL + `/data` volume；預設不是 Vercel serverless。金鑰填後台、env fallback；沒設金流 fail-closed（503）。

下文自「主金流：SHOPLINE」起是 2026-08-14 歷史決定，僅供對照，不是施工單。

---

狀態（原稿）：confirmed（2026-08-14）— 金流預設已廢

【主金流：SHOPLINE】（已廢）

課上一定會串的那一家是 SHOPLINE Payments。第二家 PAYUNi 留在模板裡，當進階。Stripe 可編譯進去，不當台灣小白第一條路。

理由寫清楚，避免之後以為「Fish 的 Paygo 比較熟所以該改 PAYUNi」。

thetu 的閘道工廠已把業務主推寫死：shopline 第一、stripe 第二、payuni 第三。見 `THE-TU-Project/dev/thetu/lib/payment/gateway-factory.ts` 與 `lib/payment/types.ts`。

SHOPLINE 走 hosted checkout 跳轉（type: redirect），跟 supastarter 現有「產生 checkout URL」的心智模型接近。PAYUNi 是 form_post 加密表單，小白比較難懂、AI 也比較容易改壞。

教學第 3 堂要的是「測一筆付款、後台看到訂單」。redirect 比 form_post 少一個自製中繼頁。

這不表示 PAYUNi 不重要。Fish 既有 Paygo / BuyGo 生態是 PAYUNi。所以 adapter 要抽進來，課綱標成進階，不要刪。若之後改主推，只改預設 gateway 設定，不必重做架構。

【v1 金流行為】

結帳建立 Order（PENDING, currency=TWD）。

導向 SHOPLINE checkout。

webhook / return 把訂單標成 PAID，再觸發發票開立。同一筆訂單、同一個狀態機，發票不是另一個獨立系統。

金鑰填在後台設定頁，.env 當 fallback。這是 thetu Simple-first 的產品決策，教學版沿用。小白不該被要求手改一堆環境變數檔。沒設金流時，結帳路徑必須 fail-closed，不能 500。

【明確不做】

v1 課不上月繳。thetu 已經寫死 SHOPLINE 不做訂閱（`subscription-support.ts`：shopline false，要嵌入式綁卡 + 3DS）。課程訂閱制也不搬。若第二版要月繳 SaaS，只能走 PAYUNi 或 Stripe，不能幻想把 SHOPLINE 導轉式長成定期扣款。

Lemon Squeezy / Polar / Dodo / Creem 不進教學模板。

【部署：常駐 Node，預設 Zeabur 這類】

台灣金流 webhook、PAYUNi 檢查碼、發票 SDK（`@paid-tw/einvoice*`，server-only、用 node:crypto）吃長連線與 Node 執行環境。thetu 的 next.config 已把發票套件標成 server external。這跟 Vercel Edge／短生命週期 serverless 不合。

預設部署抄 thetu：常駐 Node、Zeabur、PostgreSQL、`/data` volume。教學話術可叫「主機」。客戶自己的 GitHub + Zeabur workspace，不要共用你的帳號。交付流程參考 `dev/thetu/docs/deployment/AGENT.md` 與 `dev/wumin-customer-template`，不要把賣課 onboarding skill 整包搬進 SaaS 教學模板。

若之後堅持 Vercel，必須另開 spike：webhook 時限、crypto、發票套件打包、冷啟動。在 spike 通過前，不能寫進課綱當預設。狀態：pending / 未證實。

【對我自己假設的挑戰】

假設「SHOPLINE 申請比 PAYUNi 簡單」沒有在本討論裡被實測。若開課後發現學員卡在 SHOPLINE 商家審核，可以把課上預設改 PAYUNi，架構不用翻。這是設定，不是地基。

假設「Zeabur 一定是主機」也沒被鎖死成唯一廠商。鎖死的是「常駐 Node + PostgreSQL」，不是品牌。
