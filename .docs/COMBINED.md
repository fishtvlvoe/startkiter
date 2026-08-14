> **本檔狀態（2026-08-14 起）：探索過程紀錄，不是現行定案。**
> 檔內提到的三金流（Shopline/Stripe/PAYUNi 三選一）、台灣發票、三階方案（Starter/Pro/Agency）、apps/marketing + Organization 骨架，都是討論過程中的假設，**已被 `openspec/changes/mvp-test-scope/` 取代**。
> 現行定案：單一價 NT$8,800、只接 PAYUNi、不做三階、不做發票（下一輪）、不建 Organization 骨架。要查現行規格，看 `openspec/specs/` 與 `openspec/changes/mvp-test-scope/proposal.md`，不要把本檔當 SSOT 讀。

▋ StartKiter 是什麼（先把舊說法作廢）

不是「台灣中文版 supastarter」。

那句話會把產品定義成 localization：換語系、換金流、換文件語言。做出來還是 boilerplate 店，只是買家變成會中文的工程師。跟 Ray 在做的事、也跟你要合起來的那件事，不是同一類生意。

比較準的一句：

StartKiter = 用 Realms 的「代碼教學包」賣法，賣給「已經用 AI 做出東西、但拒絕被平台抽成、一定要擁有原始碼」的人。不是 15 分鐘接 Recur 那群。

```
supastarter          Realms Launch Course         StartKiter（合併後）
────────────────────────────────────────────────────────────────────
賣給工程師            賣給創作者／講師              賣給已用 AI 做出前端的人
（會寫 code）          （可以不會寫 code）            （AI Studio / Codex；八成停在自己用）

商品 = codebase        商品 = code + 影片 + Skill    商品 = SaaS code + 課程模組 + Skill
       + docs                 （三件套綁售）               （三件套綁售，不是加購課程）

打 ShipFast / Makerkit  打 Teachable / 秒站 / 抽成   打 Portaly／Recur 抽成與託管
                                                     打「每次重造金流輪子」
                                                     銷售主張是擁有權，不是 15 分鐘接上

交付 GitHub repo       交付 ZIP + 40 分影片          交付 repo/ZIP + 模組課 + Agent Skill
                        + Discord                      + 不卡關路徑

金流 Stripe 系         Shopline + PayUni + Stripe    同 Realms 三金流
                        + 台灣發票                      + 台灣發票（學員／客戶要的）

更新當產品活著的證明    更新當「買一次越改越強」        兩個都要，但銷售頁用 Realms 算法
                                                       （對月費／對請工程師，不要對 $299 boilerplate）
```

▋ 我理解你要合的，是這兩層，不是兩套 code 黏在一起

→ 從 supastarter 拿「做什麼系統」

apps/marketing + apps/saas + packages（auth、payments、i18n、ai、api）

organizations 骨架、paywall、admin、AI SDK、AGENTS.md

這是學生最後手上那套「可以對外賣的 SaaS」。

→ 從 Realms 拿「怎麼賣、怎麼教、怎麼讓非工程師上線」

商品三件套：原始碼、手把手影片、AI 部署 Skill

銷售頁打「擁有權」：買斷、零抽成、名單／站點歸你、平台倒了你的還在

三階 Starter／Pro／Agency：同一套核心，差在授權數、更新年限、人的支援

上線路徑當課程大綱：成本 → 部署 → 登入 → 功能 → 金流 → 發票

Vibe Coding 當進階模組：Stitch 設計 → AI 工程師落地 → 推上主機

不卡關保證換「數位內容不退款」

「內容 & 設計」模組在這裡不是彩蛋。Realms 已經把「AI 設計師 + AI 工程師改站」寫進商品。你選方案 C，等於把這層做進 SaaS 教學包，而不是只做課程平台那條。

▋ 受眾（已鎖：2026-08-14 選項 2）

不是 Threads 上隨便發一個前端頁面的人。那群人會去 Portaly／Recur／BMC。

鎖定：已經能用 AI 做出可跑的 App，想跟別人收錢，而且拒絕平台抽成、原始碼一定要在自己手上，寧願付一次買斷。動機結構很像老闆自己：看不懂底層、不想每次重接金流與架構、有想法。

公開市場這群人數可能很少。目前成交與詢問主要來自 AI 商會、AI 探討群組，路徑接近「本來就在同一圈」加「企業／工作室轉介」，不是 Threads 海釣。已有課程模組版本賣出，買家拿到課 + 完整可部署代碼庫，拿去上線的是「自己的 SaaS／工具要跟別人收費」，不是線上學院。代碼教學包在這個圈、對這個品類，已經成交過。StartKiter 要講清楚的是跟已賣出那包的差距，不是再證明「有沒有人會買」。

「八成自己用」那群先不要當 TAM。自用的人不會為擁有權付錢。

▋ 已鎖定（老闆 2026-08-14 確認「對」）

賣課（約 8,800–9,000）+ 送持續更新的 SaaS 架站代碼包。

主客：已在用 AI 做服務／頁面，不想自己搞金流登入發信。排除沒摸過 Claude Code／Codex／GitHub 的純小白。

骨架含金流、Email、Gmail 登入、LINE 登入。客人自己去申請帳號。代碼包丟給 AI，影片教下指令，把已有的東西放到自己的網站開賣。

擁有權：買斷、不抽成、原始碼在自己手上。通路：AI 商會／群組，不是 Threads 海釣。接案是旁線，不是主 SKU。

舊包不當「拆掉課程 UI 再賣」。課程是模組之一，不是整站的唯一長相。下一包兩邊各拿：supastarter 當網站結構，舊包搬台灣金流／發票／LINE 登入，課程系統留著當模組。架構精神可以對齊以前做過的多功能站（例如 libon.me 給我們自己看「長這樣」），但 libon.me 不給 StartKiter 學員：代碼、帳號、站都不給。

定位：讓已在摸索的人覺得好入手的課程服務，送終身代碼包更新。

▋ 已鎖定（老闆 2026-08-14 確認「對」）

賣課（約 8,800–9,000）+ 送持續更新的代碼包。

主客：已在用 AI 做服務／頁面，不想自己搞金流登入發信。沒摸過 Claude Code／Codex／GitHub 的純小白不是主客；課要寫得讓「已開始摸、但不想搞工程」的人好入手。

骨架含金流、Email、Gmail 登入、LINE 登入。客人自己去申請帳號。代碼包丟給 AI，影片教下指令。

擁有權：買斷、不抽成、原始碼在自己手上。通路：AI 商會／群組。接案是旁線。

代碼從哪裡長（選 3）：兩邊各拿，課程 UI 不拆，當模組留下。

示範站第一眼（選 2）：這包打開／部屬起來是「能賣任何服務的一個網站」。課程是裡面一個模組。StartKiter 自己還沒有官網。

首頁案例（選 3，之後修正）：不要空白。學員看課裡的舉例、別人的 demo、以及 README／report 裡的真站連結（含 libon.me）。代碼包裡不另做給人點的示範站。

libon.me：老闆自己的站。學員可以去看網址（課、銷售頁、README 都能放連結）。只能看，拿不到 libon 的代碼／帳號／後台。StartKiter 代碼包不抄 libon 原始碼。沒有「要問對方同不同意」這件事。

交付：金流只走台灣（Shopline／統一金流等）。付款成功用 webhook 自動開通，不經 Polar。學員在課程平台按「領取代碼」，用 GitHub 登入，系統 API 邀請進組織私人倉庫（只讀）。之後 git pull。人手不點邀請；GitHub 仍要學員按一次接受邀請。課、說明、案例在課程平台。Repo 裡給 AI 的 AGENTS.md／Skill 另計。

課掛哪（選 2）：v1 就用 StartKiter 這包自己架出賣課站。上課、收款、領取 GitHub 都在這個站上。不是掛在舊的賣課系統。買到的私人倉庫是「代碼包」；對外的 startkiter 站是同一套架構部屬出來的實例。

第一次能賣：銷售頁 + 台灣金流 + 站內看課 + 領取 GitHub，加上課程模組與 AI 對話模組都在跑。

AI 對話（選 3）：不是純聊天室。能接 Gemini／OpenAI／Claude，對話裡可以叫這個網站自己的功能。

MVP 定價：單價 NT$8,800（測試帶 8,800–9,000；結帳先鎖 8,800）。一價，不三階。含終身代碼包更新 + 教學 SaaS（課）。課與終身代碼包是同一筆購買，不能拆賣。

MVP 金流：統一金流（PAYUNi）先做。Shopline 可測，這一輪不做。不經 Polar 收款。

退款取消代碼包領取資格：訂單變成 refunded 之後，不能再領 GitHub、也不能再看課。

學員社群：不做 SKOOL。MVP 在課程裡放 LINE 學員交流群加入連結（付費才看得到）。客服不走這個群，客服是寫信到客服信箱。LINE 不能在對方沒點的情況下把人拉進群。這個群只做學員交流。

賣的是課（約 8,800–9,000），送持續更新的 SaaS 架站代碼包。

給已經在用 AI 做出服務／頁面、但不想自己研究金流登入發信的人。純小白（沒摸過 Claude Code、Codex、GitHub）不是主客。

臺灣不像國外開個 Stripe 就能收錢。這包把骨架做好：金流、Gmail 登入、LINE 登入、Email。你去申請那幾個帳號，把這包丟給 AI，看影片學怎麼下指令，AI 帶你把已有的東西放到自己的網站上開賣。新功能會繼續更新進代碼包。

接案是另一條：有想法但做不出來，才找老闆代做。代碼包主線不是接案。

買家付一次錢，拿到課 + 終身更新的代碼包（同一個 SKU，不是買 code 再加購課）。

▋ 定價邏輯（抄結構，不要抄數字當真理）

Realms 早鳥：9,800 / 16,800 / 49,800。supastarter：USD 299 / 799 / 1,499。兩個都是三階買斷。

差在錨點：

supastarter 錨在「工程師時間」

Realms 錨在「你若去租 Teachable 十年會燒掉多少」

StartKiter 不該錨在 $299。一錨就變中文 boilerplate，走進 supastarter 的戰場。

比較能成立的錨：

請台灣工程師做一版可收款 SaaS：常見 20–80 萬

用 Bubble／代理商月費 + 抽成，三年後的總帳

自己 vibe 三個月還是接不上發票與 LINE

價格帶我猜（標成猜測）：Starter 落在 1.5–3 萬、Pro 3–5 萬、Agency 8–15 萬，才比較像「教學包 + 可上線系統」，而不是「一份 template」。最終數字要看你願意扛多少 1 對 1。Realms Agency 才 49,800 含 90 分鐘，那是課程平台客單；SaaS 教學包若含 MCP、三金流、內容設計，support 成本可能更高，定太低會把自己做死。

Pro 的真正賣點建議學 Realms：Lifetime Updates + 優先支援，不要學它把「13 項核心功能」重複講三遍。功能表三階都一樣，買家才比較好選。

▋ 課程大綱怎麼從 Realms 映射過來

```
Realms 上線路徑                    StartKiter 對應模組
─────────────────────────────────────────────────────
成本結構（主機/網域/AI 月費）         開 SaaS 真實成本（Zeabur/Vercel、金流費率、發票、AI）
下載 → AI 一句話部署                 同一套，但主機讓學生選（Zeabur / VPS / Vercel），不要鎖死一家
首次登入 / 管理員                    建立第一個可賣的產品與 paywall
功能總覽（老師後台）                  SaaS 後台：方案、顧客、權限、組織骨架
SHOPLINE 手把手                      Shopline + Stripe + 統一金流 三選一（依市場）
台灣電子發票（先問統編）               同一章，幾乎可直接移植精神：順序、門檻、加值中心
Vibe Coding + Stitch                 「內容 & 設計」模組：銷售頁、UI、簡報式敘事
（沒有的）                           MCP 對外：學生的 SaaS 要能被 agent 打到
（沒有的）                           怎麼寫自己的銷售頁把 SaaS 賣出去（你比 Ray 多的那層）
```

Ray 的發票章寫得比多數工程文件有用，因為先處理「你可能還不能開」而不是先貼金鑰。StartKiter 這章不該寫成 developer docs。

▋ 授權你大概也會跟 Realms 同一條紅線

可商用、可改、單一品牌（或 Agency 多站）。

禁止把種子再當 template 轉售。

禁止拿去開「讓別人註冊來建 SaaS」的多租戶建站平台（你自己的競業條款）。

學生用這套做出自己的 SaaS 賣給終端用戶，這才是許可用途。

這跟 supastarter「unlimited projects」不一樣。supastarter 給工程師無限專案；Realms 鎖單一品牌。你的市場若是「一個人開一個產品」，用 Realms 授權比較不容易被拿去開白牌工廠。若你想讓同一個創業者做第二個產品，要另開規則，不要默默抄 unlimited。

▋ 我自己也會質疑的前提

「合起來」很容易做成兩張皮：技術像 supastarter、文案像 Realms。買家一比對 code 會說 fork，一比對銷售頁會說抄 Ray。要成立，至少有一塊必須深到抄不走：內容 & 設計模組、MCP 對外、或中文亞洲金流發票的「開張路徑」品質。

Realms 賣給「開課的人」，你賣給「開 SaaS 的人」。開課動機清楚（我有內容要賣）；開 SaaS 動機常常還是空想。你可能需要像 supastarter 那樣的 idea validator，或更狠：課程先逼學生選一個要收錢的點，沒有點不准往下部署。否則 completion rate 會很差，不卡關保證會變成無限客服。

三金流 + 發票 + LINE Login + MCP + 內容設計，維護面比 Realms 或 supastarter 任何單一產品都重。對外可以講「adapters 已接好」，對內要能砍：v1 是否真的三金流全開，還是台灣主路徑 Shopline+發票，馬新主路徑 Stripe。

terms 與定價頁不要學 Realms 那個終身更新矛盾。

▋ 資料位置

supastarter：`.docs/supastarter-research/`

Realms：`.docs/launch-course-research/`

本檔曾用來 supersede `repo-foundation` 裡「最小提取／四堂課／做台灣版 starter」的舊假設，是討論探索紀錄，不是產品定義 SSOT。現行 SSOT 是 `openspec/changes/mvp-test-scope/`（見檔案開頭狀態說明）。
