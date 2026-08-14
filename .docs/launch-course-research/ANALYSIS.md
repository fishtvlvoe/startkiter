▋ Realms Launch Course 商業模式分析

撰寫日期：2026-08-14

來源：https://launch-course.ray-realms.com （已登入 fish 帳號）、docs 12 篇、FAQ 展開、/account、terms。

▋ 一句話

Realms 賣的不是「開課 SaaS 訂閱」，而是一次買斷的「線上學院原始碼 + 繁中教學影片 + AI 部署 Skill」。買家是創作者／講師，不是工程師。競爭對象是 Teachable、Kajabi、秒站、PressPlay，不是其他 boilerplate。

▋ 商品三件套（FAQ 原文結構）

① 完整原始碼（ZIP 下載，帳號頁寫 v1.8.0 Next.js + TypeScript）

② 手把手教學影片（繁中字幕；帳號頁寫部署教學約 40 分鐘）

③ 寫好的 AI 部署工作流（Agent Skill）

這三件是綁在一起賣的。原始碼不是附件，教學也不是加購。沒有「只買 code」這個 SKU。

▋ 定價（2026-08 早鳥）

Starter NT$9,800（劃線 14,800）

第一次開課。有第一年更新。單一品牌。

Pro NT$16,800（劃線 24,800）「最受歡迎」

終身更新 + 優先客服 48h + Pro Discord。單一品牌。Starter 12 個月內可補差價升級。

Agency NT$49,800

最多 20 個品牌 + 90 分鐘 1 對 1 + VIP Discord。

三階都內建同一套平台核心（金流／發票／登入／防盜／AI 擴充）。錢差在授權數、更新年限、人的支援。

對比敘事不是功能表，是「訂閱制十年 NT$380,000 vs 買斷 NT$9,800」。頁面上直接算到第 10 年。

▋ 他在打誰

不是 ShipFast、不是 Makerkit。

是 Teachable / Kajabi / 秒站（月費或年費，停繳站就停）和 PressPlay（抽成 5–10%）。

銷售主張三句：一次買斷、零抽成、名單與原始碼歸你。平台倒了你的站還在。

▋ 漏斗

```
Threads / 案例站 / LINE
        ↓
長銷售頁（痛點：月費+抽成+名單不歸你）
        ↓
Demo 影片 + 真實案例（Yapi Flow、航拓、滿點經濟、造市者、自家 iOS 課）
        ↓
三階定價 + LINE 諮詢降不確定性
        ↓
付款 → /account（ZIP + 40 分影片 + Discord）
        ↓
Docs 當「上線路徑」：成本 → 部署 → 登入 → 功能導覽 → SHOPLINE → 電子發票
        ↓
Vibe Coding 章：用 AI 把站改成自己的品牌
```

案例站都可以點進去，這比 testimonials 文字強。他自己用同一套系統賣 iOS Vibe Coding 課（自稱 1200+ 學員），「我不敢用的系統不會賣給你」。

▋ 教學怎麼設計（這才是產品本體）

Docs 不是 API reference。是影片逐字稿 + 時間戳，給「非工程師」走完開張。

→ 1 啟動說明

平台介紹與成本結構（月營運約 360–1,110 元台幣）

一步一步部署上線（下載 ZIP → Zeabur 買網域／伺服器 → 裝 Node → 開 Codex → 一句「幫我部署到 Zeabur」）

部署完成與首次登入

平台功能總覽（老師視角，不是工程視角）

串接 SHOPLINE Payments（含帳單名稱防拒付這種實務）

開立台灣電子發票（先問你有沒有統編，再講加值中心；不是只貼 API key）

→ 2 功能說明

課程建立與定價、講義編輯器、媒體中心、優惠券、訂單退款

→ 3 Vibe Coding

明確講：這套工作流「不屬於課程平台本身」，是因為你買到原始碼，才順便教你怎麼用 AI 改成別人難複製的品牌站。工具鏈是 Codex/Cursor/Claude Code + Google Stitch + Zeabur。

核心指令就兩句：「幫我把系統上線」「改完以後幫我推送上 Zeabur」。

▋ 授權與護城河

單一終端使用者商業授權。可改、可賣自己的課。

禁止轉售 template。禁止做成多租戶開課 SaaS（競業：不能拿去打 Teachify／秒站／Teachable）。

Starter／Pro 單一品牌。Agency 最多 20 站。接案幫第二個客戶要再買一份。

數位內容不退款 + 「不卡關保證」3 個月陪到上線。這是用支援承諾換「原始碼無法退貨」的心理帳。

terms 第 8 條寫「所有合法購買者終身更新」，定價頁卻把 Lifetime Updates 當 Pro 賣點。條款與銷售頁不一致，這點要記著，自己做的時候不要複製這個漏洞。

▋ 金流／合規層（跟 StartKiter 幾乎同款）

SHOPLINE Payments（主推，信用卡／Apple Pay／Google Pay）

PayUni 統一金流（ATM、超商）

Stripe（國際卡、訂閱）

發票：綠界 ECPay／藍新 ezPay，結帳收集、付款後開立、作廢折讓。預設關閉。

登入：Google／Apple（銷售頁沒主打 LINE Login）

部署預設 Zeabur。影片 Cloudflare Stream 或 YouTube。

▋ /account 實際交付

登入後不是課程播放器首頁，是三張卡：下載專案、部署教學與圖文講義、Discord。文件站 /docs 才是長路徑。購買後的「 ent 」很短，真正的課在 docs 的影片＋逐字稿。
