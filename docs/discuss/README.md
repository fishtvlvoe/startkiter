▋ 台灣 SaaS 教學 starter 討論紀錄

產品現行邊界 SSOT：`openspec/specs/`（由已封存 `mvp-test-scope` 灌入）。本資料夾是架構討論歷史；與 specs 衝突時以 specs 為準。

一句話結論（現行）：StartKiter 是獨立教學產品——課 + 終身代碼包；站殼與登入已落地；MVP 主金流只通 PAYUNi、結帳 8800 TWD；發票不在 MVP；Shopline／Stripe 不接線不上課。

資料夾工作名稱：`products/startkiter`。獨立新專案，不掛 libon.me。網域盯 `startkiter.com`／`startkiter.me`。

【怎麼讀這些檔】

• 要施工規則 → 先看 `openspec/specs/` 與 `AGENTS.md`

• 要檔案路徑清單 → `extract-map.md`（路徑仍可用；金流預設與課綱順序以本頁「已廢」為準）

• 要看當年怎麼吵到 SHOPLINE → 下列標「歷史／已廢」的檔，開頭有取代聲明

【現行仍有效】

• [organizations.md](./organizations.md) v1 不抽 Organization 多租戶（仍有效）

• [line-login-from-line-hub.md](./line-login-from-line-hub.md) LINE Login 契約：協定可以，PHP／LIFF 不搬（仍有效；登入已在 extract-shell-auth 落地）

• [deploy-and-public-url.md](../deploy-and-public-url.md) 對外網址 `startkiter.aiver.me`、Tunnel、Coolify 部署方向備忘（功能尚未開工）

【歷史／已廢（保留對照，勿當施工單）】

• [2026-08-14-alignment.md](./2026-08-14-alignment.md) 當日對焦；主金流 SHOPLINE、發票進 v1、四堂課路徑已廢

• [extract-map.md](./extract-map.md) 檔案路徑清單仍可參考；SHOPLINE 主推／發票 v1／舊施工順序已廢

• [v1-boundary.md](./v1-boundary.md) repo-foundation 舊邊界；已被 mvp-test-scope 取代

• [architecture-draft.md](./architecture-draft.md) 早期架構草稿；SHOPLINE／發票預設段落已廢

• [2026-08-14-thetu-source.md](./2026-08-14-thetu-source.md) thetu 來源觀察仍有用；「教學主金流 SHOPLINE」結論已廢

舊檔 `docs/teaching-starter-教學專用版-SOP.md` 的 v1（不要登入、不要後台、不要金流）亦已廢，不要沿用。
