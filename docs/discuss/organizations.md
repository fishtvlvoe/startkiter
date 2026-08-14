▋ 組織多租戶：v1 不抽

狀態：confirmed（2026-08-14）

v1 不從 supastarter 抽 Organization / Member / Invitation。一個老闆、一個後台、帳單掛在 user 上。

【為什麼拿掉】

這次教學對象是要用 AI 做出「自己的小 SaaS」的小白，不是要做代操多客戶後台的代管商。多租戶會逼學員先懂「組織、邀請、角色、哪個帳號在付錢」，跟「前後台能登入、能收錢」無關。

supastarter 的付款設定本身已經可以掛在 user。`packages/payments/config.ts` 的 `billingAttachedTo` 是 `"user"`。所以拿掉組織不會跟現有付款介面打架，反而是拿掉多餘的一層。

組織相關檔案會拖進：slug、邀請信、成員角色、組織切換器、`lastActiveOrganizationId`、seat-based 價格。這些每一項都會讓 LINE／金流／發票的課變長。

【v1 權限怎麼做】

User.role 區分一般使用者與管理員（沿用 Better Auth admin plugin 的最小用法）。

第一個註冊者升管理員，或用環境／後台手動指定。不要做組織邀請流。

方案與訂單的 foreign key 是 userId，不是 organizationId。

【之後若要加回來】

那是另一個產品假設：「學員要幫客戶開帳號、代管很多間店」。到時再抽 `packages/auth/lib/organization.ts`、`apps/saas/modules/organizations/`、`packages/api/modules/organizations/`。不能在 v1 施工時「順便留著以免以後要」。留著就等於 v1 範圍膨脹。

【挑戰】

假設「沒有組織就做不成 SaaS」是錯的。多數台灣小工具（預約、表單、內容生成）一個登入帳號就夠。組織是 B2B 多團隊功能，不是登入與收款的前置。
