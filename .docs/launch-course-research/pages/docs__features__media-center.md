---
url: https://launch-course.ray-realms.com/docs/features/media-center
title: 媒體中心：影片、圖片、Cloudflare Stream — Realms Docs | Realms — 一次買斷，開你自己的線上學院
bytes: 1960
---

功能特色
運作流程
價格方案
真實案例
平台指南
F
進入 Realms
Skip to main content
← Realms Academy
PART 2 — FEATURES
功能說明
01課程建立與定價
02課程內容編輯器
03媒體中心：影片、圖片、Cloudflare Stream
04優惠券與促銷
05訂單與退款管理
06銷售分析與儀表板
07學員管理與權限
08作業、測驗、評論與留言
09系統設定總覽
10Google 登入串接
11Email 系統：Resend、SMTP、歡迎信
12AI 快速建課

PART 2 — FEATURES · PART 3

媒體中心：影片、圖片、Cloudflare Stream

管理課程影片與圖片的一站式媒體庫。支援 YouTube 與 Cloudflare Stream 兩種託管方式，比較兩者成本與防盜能力。

6 min read
媒體中心：影片、圖片、Cloudflare Stream

賣線上課程，80% 的成本都花在影片託管上。選錯方案，課越賣越多、帳單越繳越痛；選對方案，學生打開就看、盜版抓不到你。

Realms 的媒體中心把影片、圖片、素材全部集中在一個地方管理，不需要切換到 YouTube 後台、也不用自己寫 S3 上傳腳本。

媒體中心長什麼樣

進到「媒體中心」，你會看到三塊東西：

儲存統計：影片幾部、總共幾 GB、配額用了幾 %（老師最怕突然被鎖帳號，這裡一眼看完）
影片庫：所有課程影片的列表，標籤顯示是 YouTube 還是 Cloudflare Stream、時長、上傳狀態
圖片庫：縮圖、課程封面、講義截圖，網格檢視直接視覺瀏覽

影片可以拖拽上傳，進度條即時顯示，失敗會自動重試。批量選取還能一次刪除、一次加標籤、一次搬到另一門課——建過三堂課以上的人才會懂這有多救命。

YouTube 還是 Cloudflare Stream？

這是每個講師一定會問的問題。我直接給你對照表：

比較項目	YouTube 不公開嵌入	Cloudflare Stream
成本	免費	儲存 $5/1000 分鐘、播放 $1/1000 分鐘
防盜能力	弱，連結外流就完蛋	強，簽名 URL + 浮水印
廣告	觀眾可能看到	完全無廣告
自適應碼率	有	有，且全球 CDN 更快
中國可播放	否	是
下載下來再傳其他平台	容易	困難，每次播放需要新簽名
上手難度	貼個連結就好	要開 Cloudflare 帳號、填 API Token

我的建議：剛起步、學員少於 100 人、客單價低於 3000 元，用 YouTube 就夠了。等你開始賣 5000 元以上的課、或發現學員真的會把連結丟到群組，再升級到 Cloudflare Stream。盜版一次，Stream 的錢就回本。

怎麼接 Cloudflare Stream

到「系統設定」→「Cloudflare Stream 設定」頁籤，填三個東西：

API Token：到 Cloudflare Dashboard → My Profile → API Tokens，建一個有 Stream 權限的 Token
Account ID：在 Cloudflare 右側欄就能複製
Zone ID：同一頁面就有

填完按「測試連接」，綠燈亮就成功。之後所有上傳會自動走 Stream、自動轉碼、自動產生自適應碼率版本，你什麼都不用管。

你還可以設定：

自動轉碼：上傳完自動產生 240p 到 1080p 多種解析度
預設儲存時間：過期自動刪除，省配額
自適應碼率：學生網路爛就自動降畫質，不卡頓
Stream 的防盜機制

這是 Stream 最值錢的地方。

簽名 URL：學生每次要看影片，平台會產生一組只對他有效、且有時效（預設 2 小時）的網址。他把網址貼給朋友，朋友打開就是過期訊息。複製原始檔案的 URL？根本沒有原始檔案的 URL。

浮水印：可以在影片上疊加學生的 Email 或姓名，半透明、會移動位置。就算有人用螢幕錄影偷走，傳出去也能直接抓到是誰外流。這一招對付盜版群組特別有效——沒人想當那個被公開指名的帳號。

這兩個機制組合起來，基本上斷了 90% 以上的盜版路徑。剩下 10% 是有人真的架腳架拍螢幕，那種連 Netflix 也擋不住，不用糾結。

小結

媒體中心不只是個檔案夾，它是你課程生意的成本中心、也是防盜防線。低價課用 YouTube 省錢，高價課用 Stream 保命——這是我經營兩年下來的結論，直接抄走就好。

← PREVIOUS · PART 2

課程內容編輯器

NEXT · PART 4 →

優惠券與促銷
