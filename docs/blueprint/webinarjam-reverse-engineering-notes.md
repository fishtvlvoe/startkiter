# WebinarJam 逆向觀察紀錄

日期：2026-10-12  
目的：補充直播／Webinar 管理流程的介面參照，供 `creator-operations-platform-blueprint` 後續切分施工 SR。這份紀錄只描述本次實際可見證據，不推定未操作功能。

## 證據範圍

- 目標：已登入的 `https://app.webinarjam.com/webinars`。
- 工具：REA，經 Brave CDP `127.0.0.1:9224` 被動檢視及受控瀏覽器操作。
- 證據：清單 DOM／無障礙樹 `ev_176064500de2b89885daefdc239cdcdca0d6f7f57c0db43b4a3aa18fa581df60`；完整設定與場次路徑 `ev_4a35a9e07a41250f7fe882ce83665aa6d38ecf1fd46344847107f620a890cd51`、模式文案截圖 `ev_24f19ca0d576704235e85a9277456a68158ae8b0b0b240b219033c70253fbc80`；Basic settings／Streaming service 顯示 `ev_5a075724c51f9338bc87204c8705d6e6a1eaf1fbfbe4d2ff9081f55d91a4e11d`、`ev_74cefff5cd8cb64a3684975b8a01b3b73bbfe583203f26cf1160c5fc336dc465`；Analytics 篩選／查詢 `ev_575369365237673a7285e6d4659e7e6602be7e423c2fcd2cd6d02b7fda8fbcd`、`ev_b64f66b2f5c5dc17aed47d46a4757f43dd42f9219907e0cf9ba687803e43875d`；Registrant／Auto-subscribers `ev_48b0a3f4057530398cadbe0954ee5c05375b0cd12add993957cb096bedb53b1a`、`ev_f726f7e376da6ba5eef90af281c736f1a4f62f896aec89ebb3328577b18727f6`、`ev_b023403c9760e5fb4a3e46522056fad8e4a3792048cb66382288547ee05a7ff8`；返回清單 `ev_e98a2b566baaf686027552ea37fb436673e95f0a3aad9a5a9717c13399579712`。
- 等級：B（頁面入口與表單文字可讀；未完成建立或儲存流程）。
- 補充證據：Express setup `ev_969148348bba16553a255dc14181f800560457dd80c7d4d4ff4dda846007231f`、`ev_feb750b1cc4edf425aae2c7e163421bb31f449347dcf560ec5edd2edd282e702`；串流服務選項截圖／無障礙樹 `ev_9bba065c1d3321a6d60d969bc3ff570c878c7908c189dc2f6aeea08b2174dde9`、`ev_05020387424682dba7581f780456da611962ca73e294fcd90e778fa0e6b533e1`；Basic settings 規格截圖 `ev_aefd8ff75c0909485a77978d0a74bcec8281e4136958d46f793cfb0fbe41bb0bf`；離開未儲存向導後的清單 `ev_99b79dc09cfec0ce6fe1b22c62cef9254e3a242d5352a94b5acbe4fb65f5b669`。
- 隱私：不記錄清單內的 Webinar 名稱、聯絡人或帳戶資料；不保留 cookie、storage 值或 network body。

## 已觀察

```text
Webinars 清單
├─ 全站入口：Home／Webinars／Analytics／Registrants／Training
├─ 新增 Webinar
│  └─ Webinar configuration
│     ├─ Express configuration：以 smart defaults 快速設定
│     └─ Full configuration：自訂設定，頁面標示較完整、耗時較長
│        └─ Right now／Schedule for later／Always on
│           └─ Basic settings → Webinar presenters → Streaming service
│              → Schedules → Registration → Notifications → Integrations
│              → Thank You → Live → Replay → Finish
└─ 單場清單卡片可見入口
   ├─ Edit／Clone／Delete
   ├─ Advanced／Log
   ├─ Run a test／Your links
   └─ 排程日期時間與一個數字狀態指標

選 Full configuration 後可見三種場次／房間模式：Right now（文字描述為現在直接將 live room 連結交給參與者）、Schedule for later（未來舉行，參與者填報名表取得連結）、Always on（房間隨時可登入，品牌連結固定）。這些是 UI 對時間與進入方式的描述；不能只憑 Always on 推定它就是預錄 Evergreen webinar。

完整設定進入 `/wizard` 後可見 Basic settings、Webinar presenters、Streaming service；空白設定時 Next／Save 不可用。Basic settings 有三個文字欄位，Presenter 與 Streaming service 各有編輯入口，畫面目前顯示 `WebinarJam Live` provider 標籤。向導頂端另列 Schedules、Registration、Notifications、Integrations、Thank You、Live、Replay、Finish。這些只確認介面分區；本次未填欄位、選 provider、完成設定或儲存。

Analytics 頁提供 Webinar／Session／Event 篩選、Go 與 Export。以目前畫面條件按 Go 後沒有呈現報表，Export 仍停用；報表圖表、指標與匯出格式未確認。

Registrants 頁有 Active registrants／Auto-subscribers 兩個分頁；Active registrants 可按 Webinar／Session／Event 篩選，執行後再依 Live room behavior／Replay room behavior／Purchase behavior 篩選，另有 Export 與搜尋入口。本次結果畫面顯示 NO ENTRIES FOUND；Auto-subscribers 也顯示空結果。沒有讀取或記錄任何名單內容。

退出未完成向導後回到 Webinar 清單，畫面顯示 25 個項目、沒有空白或通用草稿名稱。這只證明清單目前未顯示新增草稿；不能證明服務端沒有任何暫存狀態。
```

本次分別進入 Express 與 Full 的未儲存路徑，但沒有填欄位、選取 provider、完成設定或建立活動。清單卡片上的 Edit／Clone／Delete 等動作只確認入口存在，不代表已確認其完整結果、權限或副作用。

## Express 與串流服務選項

- Express 路徑進入 `/wizard/express`，可見 Basic settings、三個基本文字欄位、Webinar presenters 與語言；本次 Save disabled，未填寫。此頁未顯示串流服務選擇入口。
- Full 路徑的基本資料頁顯示 Webinar name（Private title，最多 70 字元）、Webinar title（Public title，最多 70 字元）、Webinar description（最多 150 字元）、縮圖（最多 1 MB，JPG／JPEG／GIF／PNG，理想尺寸 660×440）與語言選擇。空白時 Save disabled。
- Full 路徑的 Streaming service 選單顯示三個 UI 選項：

| 畫面選項 | 畫面描述 | 本次可確認／不可確認 |
| --- | --- | --- |
| WebinarJam Live | 產品文案稱為 private broadcast network | 只確認選項與文案；傳輸協定、CDN、錄影架構未確認 |
| YouTube Live | 直接廣播到 YouTube channel／audience | 只確認選項與文案；OAuth、API、金鑰與權限流程未確認 |
| Facebook Live | 直接廣播到 Facebook page／profile | 只確認選項與文案；Meta API、OAuth、權限流程未確認 |

畫面預選 WebinarJam Live；未選擇其他項目、未保存設定，也未進入第三方登入／授權。這些是比較用的產品選項，不代表 StartKiter 已決定要整合哪個 provider，更不是直播技術棧的證據。

## StartKiter 對照與設計推論

- 這份來源可作為創作者端 Webinar 管理介面的比較依據：列表／建立入口、快速與完整設定路徑、單場管理動作、測試入口、連結入口及操作紀錄入口。
- 場次模式、設定分區、報名者依據與分析篩選，是建立 StartKiter LiveEvent／EvergreenWebinar 管理工作流的參考；以 workspace、webinar、session、event 作為明確查詢範圍，並把 Active registrants 映射到 Contact 與正規化的 attendance／replay／purchase events。
- 這是 StartKiter 的 UX／功能設計參照，不要求複製 WebinarJam 的品牌、版面、文案或內部實作。
- StartKiter 應把 Webinar 管理能力接到既有 `LiveEvent`／`EvergreenWebinar`、Contact／Consent、Offer、Automation、Analytics 與 provider adapter；不要把影音串流、付款權限與 Webinar 設定混成單一資料真相。
- 基於 StartKiter 的付款與稽核邊界，後續規格應另行定義 Clone 不複製報名／出席／付款／provider secret，移除活動需保留可追溯交易與稽核資料。這兩點是 StartKiter 的安全設計決策，不是對 WebinarJam 行為的觀察。

## 未觀察／不可下結論

- Full／Express 表單之後的設定步驟、活動類型、報名頁、提醒、回放與發布流程。
- YouTube／Facebook 授權與直播連線流程、provider 的密碼／stream key 保存方式、WebinarJam Live 的實際傳輸／錄影技術。
- Edit、Clone、Delete、Advanced、Log、Run a test、Your links 各入口實際執行結果。
- Analytics 與 Registrants 頁面內容、篩選、匯出、CRM 整合及權限差異。
- Analytics 點 Go 後的有資料狀態、指標定義、Export 內容；registrant 表格欄位、搜尋結果與分頁／匯出格式。
- WebinarJam 的後端、資料庫、直播傳輸、錄影處理及其與 Systeme.io 的技術整合方式。

後續 REA 盤點應在不儲存 Webinar 的前提下，逐步檢查上述流程；涉及建立、刪除、寄送、發布或改變外部資料時，先停在確認前畫面並記錄阻擋點。
