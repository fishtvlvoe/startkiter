# Creator Operations 的工作空間與事件邊界

日期：2026-10-11
狀態：已決定，待後續施工 SR 逐張落地

## 情境

StartKiter 要從課程平台擴展成台灣創作者營運平台。現有產品已經有 User、Organization、Member、Course、Order、Newsletter 與 SupportTicket；若直接新增一套 creator tenant、CRM user 或同步寄送流程，會形成多套資料真相，讓 UI 與權限更難操作。

## 決定

1. Creator Workspace 是產品概念，第一版沿用 Organization／Member／Invitation 作為資料與權限邊界；品牌與台灣預設值放在一對一 CreatorProfile。
2. User 是可登入身份，Contact 是可被創作者經營的關係資料；Contact 可以沒有 User，也可以之後透過驗證 identity link 到 User。
3. 跨模組副作用使用 transactional outbox、idempotency key、provider reference 與可回放事件；不在 HTTP request 中同步完成寄信、加標籤或發票等副作用。
4. 平台導覽使用任務導向的 Creator Operations Shell；App registry 負責能力與權限，不把所有功能塞到課程後台。
5. PAYUNi、電子發票、email、LINE 與未來 SMS 都透過 provider adapter；domain package 不直接依賴外部 SDK。

## 替代方案

- 新增獨立 creator_workspace tenant：否決，會和 Organization／Member 形成兩套成員與權限真相。
- 只使用 User 當 CRM contact：否決，無法管理未註冊名單，也會把行銷退訂與登入身份綁在一起。
- 只用 cron 掃資料表做自動化：否決，事件順序、重試、重播與重複送出難以驗證。
- 每個頁面自行建立 sidebar 與狀態：否決，會延續目前使用者找不到下一步與手機密度過高的問題。

## 後果

- 新增 CRM、商品與自動化前，必須先定義 workspace scope、contact identity、consent 與 event contract。
- 未來可以在不改 User／Organization 核心語意的前提下加入創作者模組。
- 需要 additive migration、outbox worker、事件保留與 provider failure UI；短期開發成本高於直接在 route 中寫流程，但可測試性與回滾能力更高。
